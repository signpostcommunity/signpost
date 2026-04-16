'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import PaymentMethodSection from '@/components/dashboard/requester/PaymentMethodSection'
import BetaTryThis from '@/components/ui/BetaTryThis'
import PhoneInput from '@/components/ui/PhoneInput'
import { normalizePhone } from '@/lib/phone'
import { TIMEZONE_LABELS, getTimezoneLabel } from '@/lib/timezones'

/* ── Shared styles ── */

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '11px 14px',
  color: 'var(--text)',
  fontSize: '15px',
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#c8cdd8',
  marginBottom: 6,
}

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '13px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#00e5ff',
  marginBottom: 20,
}

const cardStyle: React.CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '28px',
  marginBottom: 34,
}

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--accent)'
  e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.07)'
}
function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border)'
  e.target.style.boxShadow = 'none'
}

/* ── Constants ── */

const ORG_TYPES = [
  'School', 'Healthcare', 'Government', 'Non-profit',
  'Legal', 'Corporate', 'Community', 'Event', 'Other',
]

const COMM_OPTIONS = ['Email', 'Text/SMS', 'Video Phone', 'Phone Call']

/* ── Main Component ── */

interface Props {
  profile: Record<string, unknown> | null
  userEmail: string
}

export default function ProfileClient({ profile, userEmail }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [countryName, setCountryName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('')
  const [requesterType, setRequesterType] = useState('')
  const [commPrefs, setCommPrefs] = useState<string[]>([])
  const [timezone, setTimezone] = useState('')
  const [editingTimezone, setEditingTimezone] = useState(false)
  const [timezoneDraft, setTimezoneDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFirstName((profile.first_name as string) || '')
      setLastName((profile.last_name as string) || '')
      setPhone((profile.phone as string) || '')
      setCountry((profile.country as string) || '')
      setCountryName((profile.country_name as string) || '')
      setCity((profile.city as string) || '')
      setState((profile.state as string) || '')
      setOrgName((profile.org_name as string) || '')
      setOrgType((profile.org_type as string) || '')
      setRequesterType((profile.requester_type as string) || '')

      const tz = (profile.timezone as string) || ''
      setTimezone(tz)
      setTimezoneDraft(tz)

      // Auto-detect timezone on first load if empty
      if (!tz) {
        try {
          const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
          if (detected) {
            setTimezone(detected)
            setTimezoneDraft(detected)
          }
        } catch {
          // Ignore detection errors
        }
      }

      // Parse comm_prefs
      const cp = profile.comm_prefs
      if (typeof cp === 'string') {
        try { setCommPrefs(JSON.parse(cp)) } catch { setCommPrefs([]) }
      } else if (Array.isArray(cp)) {
        setCommPrefs(cp)
      } else {
        setCommPrefs([])
      }
    }

  }, [profile])

  function toggleComm(pref: string) {
    setCommPrefs(prev =>
      prev.includes(pref)
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    )
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setToast({ message: 'Not authenticated', type: 'error' })
      setSaving(false)
      return
    }

    const { normalizeProfileFields } = await import('@/lib/normalize')
    const norm = normalizeProfileFields({ first_name: firstName, last_name: lastName, city, state, country_name: countryName || country })
    const normFirst = (norm.first_name as string) || firstName
    const normLast = (norm.last_name as string) || lastName
    const displayName = `${normFirst} ${normLast}`.trim()

    const { error } = await supabase
      .from('requester_profiles')
      .update({
        first_name: normFirst,
        last_name: normLast,
        name: displayName,
        phone: phone ? (normalizePhone(phone) || phone) : null,
        country_name: (norm.country_name as string) || countryName || country,
        city: (norm.city as string) || city || null,
        state: (norm.state as string) || state || null,
        org_name: orgName || null,
        org_type: orgType || null,
        requester_type: requesterType || null,
        timezone: timezone || null,
        comm_prefs: JSON.stringify(commPrefs),
        updated_at: new Date().toISOString(),
      })
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)

    if (error) {
      setToast({ message: 'Failed to save: ' + error.message, type: 'error' })
    } else {
      setToast({ message: 'Profile saved', type: 'success' })
    }
    setSaving(false)
  }

  const isOrg = requesterType === 'organization'

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: '27px',
          color: '#f0f2f8', margin: '0 0 6px',
        }}>
          My Profile
        </h1>
        <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', margin: '0 0 32px' }}>
          Manage your account information and preferences.
        </p>

        {/* Section 1 - Personal Information */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Personal Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="profile-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                  placeholder="First name"
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                value={userEmail}
                readOnly
                style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
              />
              <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', marginTop: 4 }}>
                Email is linked to your account and cannot be changed here.
              </div>
            </div>
            <div>
              <PhoneInput
                label="Phone"
                value={phone}
                onChange={setPhone}
                defaultCountry={country || 'US'}
                accent="cyan"
              />
            </div>
          </div>
        </div>

        {/* Section 2 - Organization (conditional) */}
        {isOrg && (
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Organization</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Organization Name</label>
                <input
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                  placeholder="Acme Healthcare"
                />
              </div>
              <div>
                <label style={labelStyle}>Organization Type</label>
                <select
                  value={orgType}
                  onChange={e => setOrgType(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                >
                  <option value="">Select type...</option>
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Section 3 - Location */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Location</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Country</label>
              <input
                value={countryName || country}
                onChange={e => { setCountryName(e.target.value); setCountry(e.target.value) }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={inputStyle}
                placeholder="United States"
              />
            </div>
            <div className="profile-location-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>City / Region</label>
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                  placeholder="Los Angeles"
                />
              </div>
              <div>
                <label style={labelStyle}>State (optional)</label>
                <input
                  value={state}
                  onChange={e => setState(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                  placeholder="California"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 - Timezone */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Timezone</div>
          {!editingTimezone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, color: '#f0f2f8', fontWeight: 500 }}>
                  {timezone ? getTimezoneLabel(timezone) : 'Not set'}
                </div>
                {timezone && (
                  <div style={{ fontSize: 13, color: '#96a0b8', marginTop: 4 }}>
                    Auto-detected from your browser
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setTimezoneDraft(timezone); setEditingTimezone(true) }}
                style={{
                  background: 'transparent', border: '1px solid rgba(0,229,255,0.3)',
                  borderRadius: 10, padding: '8px 16px', fontSize: '13.5px',
                  color: '#00e5ff', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Select your timezone</label>
                <select
                  value={timezoneDraft}
                  onChange={e => setTimezoneDraft(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={inputStyle}
                >
                  <option value="">Select timezone...</option>
                  {Object.entries(TIMEZONE_LABELS).map(([tz, label]) => (
                    <option key={tz} value={tz}>{label}</option>
                  ))}
                  {timezoneDraft && !TIMEZONE_LABELS[timezoneDraft] && (
                    <option value={timezoneDraft}>{timezoneDraft}</option>
                  )}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setTimezone(timezoneDraft); setEditingTimezone(false) }}
                  style={{
                    background: '#00e5ff', color: '#0a0a0f', border: 'none',
                    borderRadius: 10, padding: '8px 16px', fontSize: '13.5px',
                    fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => { setTimezoneDraft(timezone); setEditingTimezone(false) }}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '8px 16px', fontSize: '13.5px',
                    color: 'var(--muted)', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 5 - Communication Preferences */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Communication Preferences</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COMM_OPTIONS.map(pref => (
              <button
                key={pref}
                type="button"
                onClick={() => toggleComm(pref)}
                style={{
                  padding: '8px 16px', borderRadius: 100,
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: "'Inter', sans-serif",
                  background: commPrefs.includes(pref) ? 'rgba(0,229,255,0.12)' : 'var(--surface2)',
                  border: commPrefs.includes(pref) ? '1px solid rgba(0,229,255,0.4)' : '1px solid var(--border)',
                  color: commPrefs.includes(pref) ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* Section 5 - Payment Method */}
        <BetaTryThis storageKey="beta_try_payment_method">
          Try adding a payment method using test card number 4242 4242 4242 4242 with any future expiry date and any CVC.
        </BetaTryThis>
        <PaymentMethodSection
          onToast={(msg, type) => setToast({ message: msg, type })}
        />

        {/* Sticky save button */}
        <div style={{
          position: 'sticky', bottom: 0,
          padding: '16px 0', background: 'var(--bg)',
          borderTop: '1px solid var(--border)', marginTop: 12,
          zIndex: 10,
        }}>
          <button
            onClick={handleSave}
            disabled={saving || !firstName}
            className="btn-primary"
            style={{
              width: '100%', padding: '14px 0', fontSize: '0.95rem', fontWeight: 700,
              opacity: (saving || !firstName) ? 0.4 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Mobile styles */}
      <style>{`
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
        }
        @media (max-width: 640px) {
          .profile-name-row,
          .profile-location-row,
          .profile-card-row {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .dash-page-content { padding: 20px 16px !important; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
