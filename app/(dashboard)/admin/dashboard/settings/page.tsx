'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'

const ORANGE = '#ff7e45'

type AlertType = 'new_flag' | 'payment_failed' | 'dispute_opened' | 'new_signup_daily' | 'negative_review'
type Channel = 'email' | 'sms'

interface AlertPref {
  email: boolean
  sms: boolean
}

type Preferences = Record<AlertType, AlertPref>

const ALERT_CATEGORIES: { key: AlertType; label: string; description: string }[] = [
  { key: 'new_flag', label: 'NEW PROFILE FLAG', description: 'When a user flags an interpreter profile' },
  { key: 'payment_failed', label: 'PAYMENT FAILED', description: 'When a platform fee charge fails' },
  { key: 'dispute_opened', label: 'STRIPE DISPUTE OPENED', description: 'When a payment dispute is created' },
  { key: 'new_signup_daily', label: 'DAILY SIGNUP SUMMARY', description: 'Daily digest of new signups' },
  { key: 'negative_review', label: 'NEGATIVE REVIEW (3+ FLAGS)', description: 'When an interpreter accumulates multiple flags' },
]

const DEFAULT_PREFS: Preferences = {
  new_flag: { email: false, sms: false },
  payment_failed: { email: false, sms: false },
  dispute_opened: { email: false, sms: false },
  new_signup_daily: { email: false, sms: false },
  negative_review: { email: false, sms: false },
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 500,
  color: '#c8cdd8', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', maxWidth: 320,
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
  fontSize: '15px', fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
}

function Toggle({ on, color, onToggle, disabled }: { on: boolean; color: string; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: 40, height: 22, borderRadius: 11, flexShrink: 0,
        background: on ? color : 'var(--border)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', position: 'absolute', top: 3,
        left: on ? 21 : 3,
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

export default function AdminSettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS)
  const [phone, setPhone] = useState('')
  const [phoneEditing, setPhoneEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveIndicator, setSaveIndicator] = useState<string | null>(null)
  const [phoneNudge, setPhoneNudge] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/alert-preferences')
        if (!res.ok) return
        const data = await res.json()
        setPrefs({ ...DEFAULT_PREFS, ...data.preferences })
        setPhone(data.phone || '')
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const savePrefs = useCallback(async (newPrefs: Preferences) => {
    setSaveIndicator('Saving...')
    try {
      const res = await fetch('/api/admin/alert-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: newPrefs }),
      })
      if (res.ok) {
        setSaveIndicator('Saved')
        setTimeout(() => setSaveIndicator(null), 1500)
      } else {
        setSaveIndicator('Error')
        setTimeout(() => setSaveIndicator(null), 2000)
      }
    } catch {
      setSaveIndicator('Error')
      setTimeout(() => setSaveIndicator(null), 2000)
    }
  }, [])

  async function savePhone(value: string) {
    try {
      await fetch('/api/admin/alert-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: value }),
      })
    } catch {
      // silent
    }
    setPhoneEditing(false)
  }

  function handleToggle(alertType: AlertType, channel: Channel) {
    // If enabling SMS and no phone number, nudge
    if (channel === 'sms' && !prefs[alertType].sms && !phone) {
      setPhoneNudge(true)
      setTimeout(() => setPhoneNudge(false), 3000)
      return
    }

    const updated = {
      ...prefs,
      [alertType]: {
        ...prefs[alertType],
        [channel]: !prefs[alertType][channel],
      },
    }
    setPrefs(updated)
    savePrefs(updated)
  }

  // Check if any SMS toggle is on
  const anySmsEnabled = Object.values(prefs).some(p => p.sms)

  if (loading) {
    return (
      <div className="dash-page-content" style={{ padding: '48px 56px' }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      {/* Page header */}
      <h1 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: '27px',
        color: '#f0f2f8', letterSpacing: '-0.02em', margin: '0 0 6px',
      }}>
        Settings
      </h1>
      <p style={{ color: '#96a0b8', fontSize: '0.88rem', margin: '0 0 32px' }}>
        Configure your admin alert preferences.
      </p>

      {/* Phone number section */}
      {(anySmsEnabled || phoneNudge) && (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '18px 22px', marginBottom: 28,
        }}>
          <label style={labelStyle}>SMS alerts sent to:</label>
          {phoneEditing ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                style={inputStyle}
                autoFocus
              />
              <button
                onClick={() => savePhone(phone)}
                style={{
                  padding: '10px 18px', background: ORANGE, border: 'none',
                  borderRadius: 'var(--radius-sm)', color: '#0a0a0f',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: phone ? 'var(--text)' : 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
                {phone || 'No phone number set'}
              </span>
              <button
                onClick={() => setPhoneEditing(true)}
                style={{
                  padding: '6px 14px', background: 'none',
                  border: `1px solid ${ORANGE}`, borderRadius: 'var(--radius-sm)',
                  color: ORANGE, fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {phone ? 'Edit' : 'Add phone'}
              </button>
            </div>
          )}
          {phoneNudge && !phone && (
            <p style={{ color: ORANGE, fontSize: '0.82rem', marginTop: 8, marginBottom: 0 }}>
              Add your phone number to receive SMS alerts.
            </p>
          )}
        </div>
      )}

      {/* Save indicator */}
      {saveIndicator && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          padding: '10px 20px', borderRadius: 'var(--radius-sm)',
          background: saveIndicator === 'Error' ? 'rgba(255,107,133,0.15)' : 'rgba(52,211,153,0.15)',
          border: `1px solid ${saveIndicator === 'Error' ? 'rgba(255,107,133,0.3)' : 'rgba(52,211,153,0.3)'}`,
          color: saveIndicator === 'Error' ? '#ff6b85' : '#34d399',
          fontSize: '0.82rem', fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {saveIndicator}
        </div>
      )}

      {/* Alert categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ALERT_CATEGORIES.map(cat => {
          const pref = prefs[cat.key]
          return (
            <div
              key={cat.key}
              style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '20px 24px',
              }}
            >
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                fontSize: '13px', letterSpacing: '0.08em',
                textTransform: 'uppercase', color: ORANGE, marginBottom: 4,
              }}>
                {cat.label}
              </div>
              <p style={{ color: '#96a0b8', fontSize: '0.82rem', margin: '0 0 14px', lineHeight: 1.5 }}>
                {cat.description}
              </p>
              <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.84rem', color: '#c8cdd8', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Email</span>
                  <Toggle on={pref.email} color="#00e5ff" onToggle={() => handleToggle(cat.key, 'email')} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.84rem', color: '#c8cdd8', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>SMS</span>
                  <Toggle on={pref.sms} color="#34d399" onToggle={() => handleToggle(cat.key, 'sms')} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ color: '#96a0b8', fontSize: '0.78rem', marginTop: 24, lineHeight: 1.6 }}>
        All alerts default to off. Enable the channels you want for each event type.
        SMS alerts require Telnyx configuration and will be available soon.
      </p>

      <style>{`
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  )
}
