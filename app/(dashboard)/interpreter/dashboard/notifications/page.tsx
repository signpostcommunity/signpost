'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import PhoneInput from '@/components/ui/PhoneInput'
import { normalizePhone } from '@/lib/phone'

export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────────────────

interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  categories: Record<string, { email: boolean; sms: boolean }>
}

// ── Category sections ────────────────────────────────────────────────────────
// Only categories present in the user's JSONB are rendered.
// Grouped into sections matching Deaf/Requester notification pages.

const NOTIF_SECTIONS: { section: string; keys: string[] }[] = [
  {
    section: 'Bookings & rates',
    keys: ['new_request', 'rate_response', 'booking_confirmed', 'booking_reminder', 'cancelled_by_requester', 'cancelled_by_you', 'sub_search_update'],
  },
  {
    section: 'Communication',
    keys: ['new_message', 'team_invite'],
  },
  {
    section: 'Roster & community',
    keys: ['added_to_preferred_list'],
  },
  {
    section: 'Profile & admin',
    keys: ['profile_approved', 'profile_denied', 'profile_saved', 'invoice_paid'],
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  new_request: 'New booking request',
  rate_response: 'Response to your rate',
  booking_confirmed: 'Booking confirmed',
  booking_reminder: 'Upcoming booking reminder',
  cancelled_by_requester: 'Requester cancelled a booking',
  cancelled_by_you: 'Your cancellation confirmed',
  sub_search_update: 'Substitute search update',
  new_message: 'New message',
  team_invite: 'Team invite',
  added_to_preferred_list: 'Added to a preferred interpreter list',
  profile_approved: 'Profile approved',
  profile_denied: 'Profile changes denied',
  profile_saved: 'Profile draft saved',
  invoice_paid: 'Invoice paid',
}

// ── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({ on, onChange, disabled }: {
  on: boolean; onChange: (v: boolean) => void; disabled?: boolean
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
        background: on ? '#00e5ff' : 'var(--border)',
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

export default function InterpreterNotificationsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [phone, setPhone] = useState('')
  const [hasPhone, setHasPhone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/interpreter/notification-preferences')
        if (res.ok) {
          const data = await res.json()
          if (data.preferences) setPrefs(data.preferences)
          if (data.notification_phone) {
            setPhone(data.notification_phone)
            setHasPhone(true)
          }
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
      const res = await fetch('/api/interpreter/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setPrefs(prev)
        setToast('Failed to save notification preferences')
      } else {
        setToast('Notification preferences saved')
        if (phoneVal !== undefined) setHasPhone(!!phoneVal)
      }
    } catch {
      setPrefs(prev)
      setToast('Failed to save notification preferences')
    }

    setSaving(false)
    setTimeout(() => setToast(null), 2000)
  }, [prefs])

  function toggleMasterEmail() {
    if (!prefs) return
    const updated = { ...prefs, email_enabled: !prefs.email_enabled }
    savePrefs(updated)
  }

  function toggleMasterSms() {
    if (!prefs) return
    const updated = { ...prefs, sms_enabled: !prefs.sms_enabled }
    savePrefs(updated)
  }

  function toggleCategory(key: string, channel: 'email' | 'sms') {
    if (!prefs) return
    const current = prefs.categories[key] ?? { email: false, sms: false }
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
    if (!prefs) return
    const normalized = phone ? (normalizePhone(phone) || phone) : ''
    savePrefs(prefs, normalized)
  }

  // Build visible sections — only categories present in user's JSONB
  const visibleSections = prefs
    ? NOTIF_SECTIONS.map(s => ({
        section: s.section,
        items: s.keys.filter(k => k in prefs.categories).map(k => ({ key: k, label: CATEGORY_LABELS[k] || k })),
      })).filter(s => s.items.length > 0)
    : []

  if (loading) {
    return (
      <div className="dash-page-content" style={{ padding: '40px 32px', maxWidth: 960 }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: 27,
          letterSpacing: '-0.02em', color: '#f0f2f8', marginBottom: 8,
        }}>
          Notification Settings
        </div>
        <div style={{ color: '#96a0b8', fontSize: 14, marginTop: 24 }}>Loading preferences...</div>
      </div>
    )
  }

  if (!prefs) {
    return (
      <div className="dash-page-content" style={{ padding: '40px 32px', maxWidth: 960 }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: 27,
          letterSpacing: '-0.02em', color: '#f0f2f8', marginBottom: 8,
        }}>
          Notification Settings
        </div>
        <div style={{ color: '#96a0b8', fontSize: 14, marginTop: 24 }}>
          Unable to load notification preferences. Please try again later.
        </div>
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
        Notification Settings
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
          background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20,
          fontSize: '0.84rem', color: '#96a0b8', lineHeight: 1.5,
        }}>
          Customize which notifications you receive below.
        </div>

        {/* Master toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f0f2f8' }}>Email notifications</div>
              <div style={{ fontSize: '0.8rem', color: '#96a0b8', marginTop: 2 }}>Receive notifications via email</div>
            </div>
            <ToggleSwitch on={prefs.email_enabled} onChange={toggleMasterEmail} disabled={saving} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f0f2f8' }}>SMS notifications</div>
                <div style={{ fontSize: '0.8rem', color: '#96a0b8', marginTop: 2 }}>Standard messaging rates may apply. You can opt out anytime.</div>
              </div>
              <ToggleSwitch on={prefs.sms_enabled} onChange={toggleMasterSms} disabled={saving} />
            </div>
            {prefs.sms_enabled && !hasPhone && (
              <div style={{
                marginTop: 12, fontSize: '0.82rem', color: '#96a0b8',
                background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              }}>
                Add a phone number to enable SMS notifications.
              </div>
            )}
            {prefs.sms_enabled && (
              <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: 400 }}>
                <div style={{ flex: 1 }}>
                  <PhoneInput
                    label="Phone number for SMS"
                    value={phone}
                    onChange={setPhone}
                    accent="cyan"
                  />
                </div>
                <button
                  onClick={savePhone}
                  style={{
                    background: '#00e5ff', color: '#0a0a0f', border: 'none',
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
        {visibleSections.length > 0 && visibleSections.map(section => (
          <div key={section.section} style={{ marginBottom: 20 }}>
            <div style={{
              fontWeight: 600, fontSize: 13,
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              color: '#00e5ff',
              marginBottom: 10, paddingBottom: 6,
              borderBottom: '1px solid var(--border)',
            }}>
              {section.section}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.items.map(item => {
                const pref = prefs.categories[item.key] ?? { email: false, sms: false }
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
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 12, color: '#96a0b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>SMS</span>
                        <ToggleSwitch
                          on={prefs.sms_enabled && pref.sms}
                          onChange={() => toggleCategory(item.key, 'sms')}
                          disabled={saving || !prefs.sms_enabled || !hasPhone}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {visibleSections.length === 0 && (
          <div style={{ color: '#96a0b8', fontSize: '0.84rem', padding: '12px 0' }}>
            No notification categories configured yet.
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{
            padding: '8px 14px', borderRadius: 'var(--radius-sm)',
            background: toast.includes('Failed') ? 'rgba(255,107,133,0.08)' : 'rgba(0,229,255,0.08)',
            border: `1px solid ${toast.includes('Failed') ? 'rgba(255,107,133,0.2)' : 'rgba(0,229,255,0.2)'}`,
            fontSize: '0.82rem',
            color: toast.includes('Failed') ? '#ff6b85' : '#00e5ff',
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
