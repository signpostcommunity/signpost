'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────────────────

interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  categories: Record<string, { email: boolean; sms: boolean }>
}

const DEFAULT_PREFS: NotificationPreferences = {
  email_enabled: true,
  sms_enabled: false,
  categories: {
    tagged_in_request: { email: true, sms: false },
    pref_list_access_request: { email: true, sms: false },
    interpreter_confirmed: { email: true, sms: false },
    request_forwarded_next_tier: { email: true, sms: false },
    still_searching: { email: true, sms: false },
    booking_reminder: { email: true, sms: false },
    interpreter_cancelled_replacement: { email: true, sms: false },
    replacement_confirmed: { email: true, sms: false },
    request_expired: { email: true, sms: false },
    booking_completed_rate: { email: true, sms: false },
    comm_prefs_shared: { email: true, sms: false },
    new_message_interpreter: { email: true, sms: false },
    new_message_requester: { email: true, sms: false },
    trusted_circle_invite: { email: true, sms: false },
    trusted_circle_response: { email: true, sms: false },
    pref_list_accessed: { email: true, sms: false },
    welcome_onboarding: { email: true, sms: false },
    profile_completion_reminder: { email: true, sms: false },
  },
}

// ── Category sections ────────────────────────────────────────────────────────

const NOTIF_SECTIONS: { section: string; items: { key: string; label: string }[] }[] = [
  {
    section: 'Bookings',
    items: [
      { key: 'tagged_in_request', label: 'Someone has tagged you in an interpreter request' },
      { key: 'pref_list_access_request', label: 'Someone is requesting access to your preferred interpreter list' },
      { key: 'interpreter_confirmed', label: 'Interpreter confirmed for a request you are tagged in' },
      { key: 'request_forwarded_next_tier', label: 'Request forwarded to next tier of interpreters' },
      { key: 'still_searching', label: 'Still searching for an interpreter (status updates)' },
      { key: 'booking_reminder', label: 'Booking reminder (24 hours before)' },
      { key: 'interpreter_cancelled_replacement', label: 'Interpreter cancelled, replacement search started' },
      { key: 'replacement_confirmed', label: 'Replacement interpreter confirmed' },
      { key: 'request_expired', label: 'Request expired with no interpreter found' },
      { key: 'booking_completed_rate', label: 'Booking completed / rate your interpreter' },
      { key: 'comm_prefs_shared', label: 'Your communication preferences were shared with confirmed interpreter' },
    ],
  },
  {
    section: 'Communication',
    items: [
      { key: 'new_message_interpreter', label: 'New message from an interpreter' },
      { key: 'new_message_requester', label: 'New message from a requester' },
      { key: 'trusted_circle_invite', label: "Invite to someone's Trusted Deaf Circle" },
      { key: 'trusted_circle_response', label: 'Responses to Trusted Circle invites you sent' },
      { key: 'pref_list_accessed', label: 'Your preferred list was accessed by a requester' },
    ],
  },
  {
    section: 'Account',
    items: [
      { key: 'welcome_onboarding', label: 'Welcome and onboarding' },
      { key: 'profile_completion_reminder', label: 'Profile completion reminder' },
    ],
  },
]

// ── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ on, onChange, disabled, purple }: {
  on: boolean; onChange: (v: boolean) => void; disabled?: boolean; purple?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        background: on ? (purple ? '#a78bfa' : '#a78bfa') : 'var(--border)',
        position: 'relative', transition: 'background 0.15s', flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2,
        left: on ? 18 : 2,
        transition: 'left 0.15s',
      }} />
    </button>
  )
}

// ── Main page component ──────────────────────────────────────────────────────

export default function DhhNotificationsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dhh/notification-preferences')
        if (res.ok) {
          const data = await res.json()
          if (data.preferences) setPrefs(data.preferences)
          if (data.notification_phone) setPhone(data.notification_phone)
        }
      } catch {
        // Use defaults on error
      }
      setLoading(false)
    }
    load()
  }, [])

  const savePrefs = useCallback(async (updated: NotificationPreferences, phoneVal?: string) => {
    setSaving(true)
    const prev = prefs
    setPrefs(updated)

    const body: Record<string, unknown> = { notification_preferences: updated }
    if (phoneVal !== undefined) body.notification_phone = phoneVal

    try {
      const res = await fetch('/api/dhh/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setPrefs(prev)
        setToast('Failed to save notification preferences')
      } else {
        setToast('Notification preferences saved')
      }
    } catch {
      setPrefs(prev)
      setToast('Failed to save notification preferences')
    }

    setSaving(false)
    setTimeout(() => setToast(null), 2000)
  }, [prefs])

  function toggleMasterEmail() {
    const updated = { ...prefs, email_enabled: !prefs.email_enabled }
    savePrefs(updated)
  }

  function toggleMasterSms() {
    const updated = { ...prefs, sms_enabled: !prefs.sms_enabled }
    savePrefs(updated)
  }

  function toggleCategory(key: string, channel: 'email' | 'sms') {
    const current = prefs.categories[key] ?? { email: true, sms: false }
    const updated: NotificationPreferences = {
      ...prefs,
      categories: {
        ...prefs.categories,
        [key]: { ...current, [channel]: !current[channel] },
      },
    }
    savePrefs(updated)
  }

  function savePhone() {
    savePrefs(prefs, phone)
  }

  if (loading) {
    return (
      <div className="dash-page-content" style={{ padding: '40px 32px', maxWidth: 960 }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: 27,
          letterSpacing: '-0.02em', color: '#f0f2f8', marginBottom: 8,
        }}>
          Notifications
        </div>
        <div style={{ color: '#96a0b8', fontSize: 14, marginTop: 24 }}>Loading preferences...</div>
      </div>
    )
  }

  return (
    <div className="dash-page-content" style={{ padding: '40px 32px', maxWidth: 960 }}>
      {/* L1 page headline */}
      <div style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: 27,
        letterSpacing: '-0.02em', color: '#f0f2f8', marginBottom: 8,
      }}>
        Notifications
      </div>
      <div style={{ color: '#96a0b8', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
        Choose how and when signpost reaches out to you.
      </div>

      {/* Main card */}
      <div style={{
        background: '#111118', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '28px 28px',
      }}>
        {/* Info banner */}
        <div style={{
          background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20,
          fontSize: '0.84rem', color: '#96a0b8', lineHeight: 1.5,
        }}>
          You&apos;re receiving all notifications by default. Customize which notifications you receive below.
        </div>

        {/* Master toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f0f2f8' }}>Email notifications</div>
              <div style={{ fontSize: '0.8rem', color: '#96a0b8', marginTop: 2 }}>Receive notifications via email</div>
            </div>
            <ToggleSwitch on={prefs.email_enabled} onChange={toggleMasterEmail} disabled={saving} purple />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f0f2f8' }}>SMS notifications</div>
                <div style={{ fontSize: '0.8rem', color: '#96a0b8', marginTop: 2 }}>Standard messaging rates may apply. You can opt out anytime.</div>
              </div>
              <ToggleSwitch on={prefs.sms_enabled} onChange={toggleMasterSms} disabled={saving} purple />
            </div>
            {prefs.sms_enabled && (
              <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: 400 }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block', fontFamily: "'Inter', sans-serif",
                    fontWeight: 500, fontSize: 13, color: '#c8cdd8', marginBottom: 6,
                  }}>
                    Phone number for SMS
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    style={{
                      width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '11px 14px', color: '#f0f2f8',
                      fontSize: 15, fontFamily: "'Inter', sans-serif", outline: 'none',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(167,139,250,0.5)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                  />
                </div>
                <button
                  onClick={savePhone}
                  style={{
                    background: '#a78bfa', color: '#0a0a0f', border: 'none',
                    borderRadius: 10, padding: '10px 16px', fontSize: '0.82rem',
                    fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                    fontFamily: "'Inter', sans-serif",
                    opacity: saving ? 0.6 : 1,
                  }}
                  disabled={saving}
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category toggles */}
        {NOTIF_SECTIONS.map(section => (
          <div key={section.section} style={{ marginBottom: 20 }}>
            <div style={{
              fontWeight: 600, fontSize: 13,
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              color: '#a78bfa',
              marginBottom: 10, paddingBottom: 6,
              borderBottom: '1px solid var(--border)',
            }}>
              {section.section}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.items.map(item => {
                const pref = prefs.categories[item.key] ?? { email: true, sms: false }
                return (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 500, color: '#f0f2f8' }}>{item.label}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 12, color: '#96a0b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Email</span>
                        <ToggleSwitch
                          on={prefs.email_enabled && pref.email}
                          onChange={() => toggleCategory(item.key, 'email')}
                          disabled={saving || !prefs.email_enabled}
                          purple
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 12, color: '#96a0b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>SMS</span>
                        <ToggleSwitch
                          on={prefs.sms_enabled && pref.sms}
                          onChange={() => toggleCategory(item.key, 'sms')}
                          disabled={saving || !prefs.sms_enabled}
                          purple
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Toast */}
        {toast && (
          <div style={{
            padding: '8px 14px', borderRadius: 'var(--radius-sm)',
            background: toast.includes('Failed') ? 'rgba(255,107,133,0.08)' : 'rgba(167,139,250,0.08)',
            border: `1px solid ${toast.includes('Failed') ? 'rgba(255,107,133,0.2)' : 'rgba(167,139,250,0.2)'}`,
            fontSize: '0.82rem',
            color: toast.includes('Failed') ? '#ff6b85' : '#a78bfa',
            marginTop: 8,
            transition: 'opacity 0.3s',
          }}>
            {toast}
          </div>
        )}

        <p style={{ fontSize: '0.78rem', color: '#96a0b8', opacity: 0.7, marginTop: 16, lineHeight: 1.5 }}>
          Every email notification includes a link to manage these settings.
        </p>
      </div>
    </div>
  )
}
