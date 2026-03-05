'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { PageHeader, InfoBox, GhostButton } from '@/components/dashboard/interpreter/shared'

type RateProfile = {
  id: string
  name: string
  color: string
  isDefault: boolean
  hourlyRate: string
  currency: string
  minBooking: string
  cancellationPolicy: string
  lateFee: string
  notes: string
  travel: string[]
}

const TRAVEL_OPTIONS = ['Mileage', 'Parking', 'Tolls', 'Ferry', 'Public Transit', 'Airfare', 'Lodging', 'Per diem / Meals']

const DEFAULT_PROFILES: RateProfile[] = [
  {
    id: 'rp-1', name: 'Standard Rate', color: '#00e5ff', isDefault: true,
    hourlyRate: '95.00', currency: 'USD — US Dollar', minBooking: '2 hours',
    cancellationPolicy: '48 hours notice required', lateFee: '100% of booking fee',
    notes: '', travel: ['Mileage', 'Parking', 'Tolls'],
  },
  {
    id: 'rp-2', name: 'Community Rate', color: '#34d399', isDefault: false,
    hourlyRate: '65.00', currency: 'USD — US Dollar', minBooking: '1 hour',
    cancellationPolicy: '48 hours notice required', lateFee: 'No fee',
    notes: '', travel: [],
  },
]

const inputStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '9px 12px',
  color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.88rem', outline: 'none', width: '100%',
  boxSizing: 'border-box' as const,
}

export default function RatesPage() {
  const [profiles, setProfiles] = useState<RateProfile[]>(DEFAULT_PROFILES)
  const [open, setOpen] = useState<string[]>(['rp-1'])
  const [saved, setSaved] = useState<string | null>(null)

  function toggleOpen(id: string) {
    setOpen(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function updateProfile(id: string, updates: Partial<RateProfile>) {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  function toggleTravel(id: string, option: string) {
    const profile = profiles.find(p => p.id === id)!
    const current = profile.travel
    updateProfile(id, { travel: current.includes(option) ? current.filter(t => t !== option) : [...current, option] })
  }

  function saveProfile(id: string) {
    setSaved(id)
    setTimeout(() => setSaved(null), 2000)
  }

  function addProfile() {
    const id = `rp-${Date.now()}`
    setProfiles(prev => [...prev, {
      id, name: 'New Rate Profile', color: '#a78bfa', isDefault: false,
      hourlyRate: '', currency: 'USD — US Dollar', minBooking: 'No minimum',
      cancellationPolicy: '48 hours notice required', lateFee: 'No fee',
      notes: '', travel: [],
    }])
    setOpen(prev => [...prev, id])
  }

  function removeProfile(id: string) {
    setProfiles(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 760 }}>
      <PageHeader title="Rates & Terms" subtitle="Manage the rate profiles you send with inquiry responses." />

      <InfoBox>
        Your rates are never shown publicly. Requesters only see them when you respond to an inquiry. You can customize each response before sending.
      </InfoBox>

      {profiles.map(profile => {
        const isOpen = open.includes(profile.id)
        return (
          <div key={profile.id} style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', marginBottom: 14, overflow: 'hidden',
          }}>
            {/* Header */}
            <div
              onClick={() => !profile.isDefault && toggleOpen(profile.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 22px', cursor: profile.isDefault ? 'default' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: profile.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{profile.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 2 }}>
                    {profile.isDefault ? 'Your default for most bookings' : 'Click to expand'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {profile.isDefault && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px' }}>Default</span>
                )}
                {!profile.isDefault && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); removeProfile(profile.id) }}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', fontSize: '0.75rem', padding: '4px 10px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Remove
                    </button>
                    <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{isOpen ? '▲' : '▼'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            {isOpen && (
              <div style={{ padding: '0 22px 22px', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                {/* Profile name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>Profile Name</label>
                  <input type="text" value={profile.name} style={{ ...inputStyle, maxWidth: '50%' }}
                    onChange={e => updateProfile(profile.id, { name: e.target.value })}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>Hourly Rate</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>$</span>
                      <input type="text" value={profile.hourlyRate} placeholder="0.00"
                        onChange={e => updateProfile(profile.id, { hourlyRate: e.target.value })}
                        style={{ ...inputStyle, paddingLeft: 24 }}
                        onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>Currency</label>
                    <select value={profile.currency} onChange={e => updateProfile(profile.id, { currency: e.target.value })} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                    >
                      <option>USD — US Dollar</option>
                      <option>GBP — British Pound</option>
                      <option>EUR — Euro</option>
                      <option>CAD — Canadian Dollar</option>
                      <option>AUD — Australian Dollar</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>Minimum Booking</label>
                    <select value={profile.minBooking} onChange={e => updateProfile(profile.id, { minBooking: e.target.value })} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                    >
                      <option>No minimum</option>
                      <option>1 hour</option>
                      <option>1.5 hours</option>
                      <option>2 hours</option>
                      <option>3 hours</option>
                      <option>Half day (4 hrs)</option>
                      <option>Full day (8 hrs)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>Cancellation Policy</label>
                    <select value={profile.cancellationPolicy} onChange={e => updateProfile(profile.id, { cancellationPolicy: e.target.value })} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                    >
                      <option>24 hours notice required</option>
                      <option>48 hours notice required</option>
                      <option>72 hours notice required</option>
                      <option>1 week notice required</option>
                      <option>Custom (describe below)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>Late Cancellation Fee</label>
                  <select value={profile.lateFee} onChange={e => updateProfile(profile.id, { lateFee: e.target.value })} style={{ ...inputStyle, maxWidth: '50%' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                  >
                    <option>No fee</option>
                    <option>50% of booking fee</option>
                    <option>100% of booking fee</option>
                    <option>1 hour minimum charge</option>
                    <option>2 hour minimum charge</option>
                  </select>
                </div>

                {/* Travel expenses */}
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, marginTop: 4 }}>
                  Travel &amp; Incidental Expenses
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 12, lineHeight: 1.5 }}>
                  Select actual travel costs you pass on to clients for on-site jobs. Billed at cost — not marked up.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 16 }}>
                  {TRAVEL_OPTIONS.map(opt => {
                    const active = profile.travel.includes(opt)
                    return (
                      <label key={opt} onClick={() => toggleTravel(profile.id, opt)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: active ? 'rgba(0,229,255,0.08)' : 'var(--surface2)',
                        border: `1px solid ${active ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                        cursor: 'pointer', fontSize: '0.82rem',
                        color: active ? 'var(--accent)' : 'var(--muted)',
                        transition: 'all 0.15s', userSelect: 'none',
                      }}>
                        <span>{opt}</span>
                        {active && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                      </label>
                    )
                  })}
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>Additional terms or notes (optional)</label>
                  <textarea
                    value={profile.notes}
                    onChange={e => updateProfile(profile.id, { notes: e.target.value })}
                    placeholder="e.g. Rate applies Mon–Fri 8am–6pm. Weekend and holiday bookings billed at 1.5x…"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-primary" onClick={() => saveProfile(profile.id)} style={{ padding: '9px 22px' }}>
                    {saved === profile.id ? 'Saved ✓' : 'Save changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Add profile */}
      <button
        onClick={addProfile}
        style={{
          width: '100%', padding: 14, background: 'transparent',
          border: '1.5px dashed var(--border)', borderRadius: 'var(--radius)',
          color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
      >
        + Add Rate Profile
      </button>
    </div>
  )
}
