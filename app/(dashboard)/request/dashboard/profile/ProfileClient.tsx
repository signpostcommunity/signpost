'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'

/* ── Shared styles ── */

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '11px 14px',
  color: 'var(--text)',
  fontSize: '15px',
  fontFamily: "'DM Sans', sans-serif",
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
  marginBottom: 20,
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

const MOCK_PAYMENT_KEY = 'signpost_mock_payment'

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
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Mock payment state
  const [hasMockPayment, setHasMockPayment] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

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

    // Load mock payment from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(MOCK_PAYMENT_KEY)
      if (saved === 'true') setHasMockPayment(true)
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

    const displayName = `${firstName} ${lastName}`.trim()

    const { error } = await supabase
      .from('requester_profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        name: displayName,
        phone: phone || null,
        country_name: countryName || country,
        city: city || null,
        state: state || null,
        org_name: orgName || null,
        org_type: orgType || null,
        requester_type: requesterType || null,
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

  function handleSaveCard() {
    localStorage.setItem(MOCK_PAYMENT_KEY, 'true')
    setHasMockPayment(true)
    setShowCardForm(false)
    setCardNumber('')
    setCardExpiry('')
    setCardCvc('')
    setToast({ message: 'Payment processing is not yet active. During beta, no charges will be made.', type: 'info' })
  }

  function handleRemoveCard() {
    localStorage.removeItem(MOCK_PAYMENT_KEY)
    setHasMockPayment(false)
  }

  const isOrg = requesterType === 'organization'

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '27px',
          color: '#f0f2f8', margin: '0 0 6px',
        }}>
          My Profile
        </h1>
        <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', margin: '0 0 32px' }}>
          Manage your account information and preferences.
        </p>

        {/* Section 1 — Personal Information */}
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
              <label style={labelStyle}>Phone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={inputStyle}
                placeholder="555 000 0000"
              />
            </div>
          </div>
        </div>

        {/* Section 2 — Organization (conditional) */}
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

        {/* Section 3 — Location */}
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

        {/* Section 4 — Communication Preferences */}
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
                  transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
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

        {/* Section 5 — Payment Method (MOCKED) */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Payment Method</div>

          {!hasMockPayment && !showCardForm && (
            <div>
              <p style={{ fontWeight: 400, fontSize: '14px', color: '#c8cdd8', lineHeight: 1.6, margin: '0 0 12px' }}>
                Add a payment method to start submitting requests. You&apos;ll only be charged when you confirm an interpreter&apos;s booking.
              </p>
              <p style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 600, margin: '0 0 20px' }}>
                $15 per interpreter, per confirmed booking.
              </p>
              <button
                onClick={() => setShowCardForm(true)}
                className="btn-primary"
                style={{ padding: '10px 22px', fontSize: '0.88rem' }}
              >
                Add Payment Method
              </button>
            </div>
          )}

          {showCardForm && !hasMockPayment && (
            <div style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '20px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Card Number</label>
                  <input
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={inputStyle}
                    placeholder="1234 1234 1234 1234"
                  />
                </div>
                <div className="profile-card-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Expiry Date</label>
                    <input
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      style={inputStyle}
                      placeholder="MM / YY"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>CVC</label>
                    <input
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      style={inputStyle}
                      placeholder="CVC"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    onClick={handleSaveCard}
                    className="btn-primary"
                    style={{ padding: '10px 22px', fontSize: '0.88rem' }}
                  >
                    Save Card
                  </button>
                  <button
                    onClick={() => setShowCardForm(false)}
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 18px', color: 'var(--muted)',
                      fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasMockPayment && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
                  <rect x="1" y="1" width="26" height="18" rx="3" stroke="var(--muted)" strokeWidth="1.2" />
                  <rect x="1" y="5" width="26" height="4" fill="var(--border)" />
                </svg>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.92rem', letterSpacing: '0.05em' }}>
                  &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242
                </span>
              </div>
              <button
                onClick={handleRemoveCard}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent3)',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Remove
              </button>
            </div>
          )}

          <p style={{
            fontWeight: 400, fontSize: '14px', color: '#96a0b8', marginTop: 16, marginBottom: 0,
          }}>
            Powered by Stripe. Payment processing coming soon. During beta, platform fees are tracked but not charged.
          </p>
        </div>

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
        @media (max-width: 640px) {
          .profile-name-row,
          .profile-location-row,
          .profile-card-row {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
