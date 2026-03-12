'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, InfoBox } from '@/components/dashboard/interpreter/shared'
import Toast from '@/components/ui/Toast'

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
  dbId?: string // Supabase row id
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
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const hasSeeded = useRef(false)

  async function fetchRateProfiles() {
    console.log('RATES FETCH - triggered at:', new Date().toISOString())
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { console.log('RATES FETCH - no user'); return }

    const { data: profile } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('RATES FETCH - interpreter profile:', JSON.stringify(profile, null, 2))
    if (!profile) { console.log('RATES FETCH - no interpreter profile found'); return }

    const { data: rates, error: ratesError } = await supabase
      .from('interpreter_rate_profiles')
      .select('id, interpreter_id, label, is_default, color, hourly_rate, currency, after_hours_diff, min_booking, cancellation_policy, late_cancel_fee, travel_expenses, eligibility_criteria, additional_terms')
      .eq('interpreter_id', profile.id)
      .order('id', { ascending: true })

    console.log('RATES FETCH - response:', JSON.stringify({ data: rates, error: ratesError }, null, 2))

    // If the fetch itself errored, show error — do NOT seed
    if (ratesError) {
      console.error('RATES FETCH - error, not seeding:', ratesError.message)
      setToast({ message: `Error loading rates: ${ratesError.message}`, type: 'error' })
      return
    }

    if (rates && rates.length > 0) {
      setProfiles(rates.map((r, i) => ({
        id: r.id,
        dbId: r.id,
        name: r.label,
        color: r.color || (i === 0 ? '#00e5ff' : i === 1 ? '#34d399' : '#a78bfa'),
        isDefault: r.is_default ?? i === 0,
        hourlyRate: r.hourly_rate?.toString() || '',
        currency: r.currency ? `${r.currency} — ${r.currency === 'USD' ? 'US Dollar' : r.currency === 'GBP' ? 'British Pound' : r.currency === 'EUR' ? 'Euro' : r.currency === 'CAD' ? 'Canadian Dollar' : r.currency === 'AUD' ? 'Australian Dollar' : r.currency}` : 'USD — US Dollar',
        minBooking: r.min_booking ? `${r.min_booking / 60} hour${r.min_booking > 60 ? 's' : ''}` : 'No minimum',
        cancellationPolicy: r.cancellation_policy || '48 hours notice required',
        lateFee: r.late_cancel_fee ? `${r.late_cancel_fee}` : 'No fee',
        notes: r.additional_terms || '',
        travel: (r.travel_expenses as string[]) || [],
      })))
      setOpen([rates[0]?.id])
      return
    }

    // No rows and no error — seed defaults (once only)
    if (hasSeeded.current) {
      console.log('RATES SEED - already seeded, skipping')
      return
    }
    hasSeeded.current = true
    console.log('RATES SEED - seeding defaults for interpreter_id:', profile.id)

    const defaults = [
      { interpreter_id: profile.id, label: 'Standard Rate', color: '#a78bfa', is_default: true, hourly_rate: 95, currency: 'USD', min_booking: 120, cancellation_policy: '48 hours notice required', late_cancel_fee: 100, travel_expenses: ['Mileage', 'Parking', 'Tolls'], additional_terms: null },
      { interpreter_id: profile.id, label: 'Community Rate', color: '#34d399', is_default: false, hourly_rate: 65, currency: 'USD', min_booking: 60, cancellation_policy: '48 hours notice required', late_cancel_fee: null, travel_expenses: [], additional_terms: null },
      { interpreter_id: profile.id, label: 'Multi-Day Rate', color: '#00e5ff', is_default: false, hourly_rate: 750, currency: 'USD', min_booking: 960, cancellation_policy: '2 weeks notice required', late_cancel_fee: null, travel_expenses: ['Mileage', 'Parking', 'Tolls', 'Airfare', 'Lodging', 'Per diem / Meals'], additional_terms: null },
    ]
    const { data: seeded, error: seedError } = await supabase
      .from('interpreter_rate_profiles')
      .insert(defaults)
      .select()
    console.log('RATES SEED - result:', JSON.stringify({ data: seeded, error: seedError }, null, 2))
    if (seedError) {
      setToast({ message: `Error creating default rates: ${seedError.message}`, type: 'error' })
      return
    }
    if (seeded && seeded.length > 0) {
      setProfiles(seeded.map((r, i) => ({
        id: r.id,
        dbId: r.id,
        name: r.label,
        color: r.color || (i === 0 ? '#a78bfa' : i === 1 ? '#34d399' : '#00e5ff'),
        isDefault: r.is_default ?? i === 0,
        hourlyRate: r.hourly_rate?.toString() || '',
        currency: r.currency ? `${r.currency} — ${r.currency === 'USD' ? 'US Dollar' : r.currency}` : 'USD — US Dollar',
        minBooking: r.min_booking ? `${r.min_booking / 60} hour${r.min_booking > 60 ? 's' : ''}` : 'No minimum',
        cancellationPolicy: r.cancellation_policy || '48 hours notice required',
        lateFee: r.late_cancel_fee ? `${r.late_cancel_fee}` : 'No fee',
        notes: r.additional_terms || '',
        travel: (r.travel_expenses as string[]) || [],
      })))
      setOpen([seeded[0].id])
    }
  }

  useEffect(() => {
    fetchRateProfiles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Parse min booking string to minutes
  function parseMinBooking(str: string): number | null {
    if (str === 'No minimum') return null
    const match = str.match(/([\d.]+)\s*hour/)
    if (match) return Math.round(parseFloat(match[1]) * 60)
    if (str.includes('Half day')) return 240
    if (str.includes('Full day')) return 480
    return null
  }

  async function saveProfile(id: string) {
    const profile = profiles.find(p => p.id === id)
    if (!profile) return

    setSaving(id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(null); return }

    // Get interpreter_profiles id
    const { data: interpProfile } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!interpProfile) {
      setSaving(null)
      setToast({ message: 'Error: No interpreter profile found. Save your profile first.', type: 'error' })
      return
    }

    const payload = {
      interpreter_id: interpProfile.id,
      label: profile.name,
      is_default: profile.isDefault,
      color: profile.color,
      hourly_rate: parseFloat(profile.hourlyRate) || null,
      currency: profile.currency.split(' — ')[0] || 'USD',
      min_booking: parseMinBooking(profile.minBooking),
      cancellation_policy: profile.cancellationPolicy,
      late_cancel_fee: profile.lateFee === 'No fee' ? null : parseFloat(profile.lateFee.replace(/[^0-9.]/g, '')) || null,
      travel_expenses: profile.travel,
      additional_terms: profile.notes || null,
    }

    let result
    if (profile.dbId) {
      result = await supabase
        .from('interpreter_rate_profiles')
        .update(payload)
        .eq('id', profile.dbId)
        .select()
    } else {
      result = await supabase
        .from('interpreter_rate_profiles')
        .insert(payload)
        .select()
    }

    console.log('Rate save response:', { data: result.data, error: result.error })

    setSaving(null)
    if (result.error) {
      setToast({ message: `Error: ${result.error.message}`, type: 'error' })
    } else if (result.data && result.data.length > 0) {
      // Update with DB id for future saves
      const savedId = result.data[0].id
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, dbId: savedId } : p))
      setToast({ message: 'Rate profile saved.', type: 'success' })
      await fetchRateProfiles()
    } else {
      setToast({ message: 'Error: save returned no data. Check RLS policies.', type: 'error' })
    }
  }

  async function addProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: interpProfile } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!interpProfile) {
      setToast({ message: 'Error: No interpreter profile found.', type: 'error' })
      return
    }

    const { data, error } = await supabase
      .from('interpreter_rate_profiles')
      .insert({
        interpreter_id: interpProfile.id,
        label: 'New Rate Profile',
        color: '#a78bfa',
        is_default: false,
        hourly_rate: null,
        currency: 'USD',
        min_booking: null,
        cancellation_policy: '48 hours notice required',
        late_cancel_fee: null,
        travel_expenses: [],
        additional_terms: null,
      })
      .select()

    console.log('Add rate profile:', { data, error })
    if (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' })
    } else {
      await fetchRateProfiles()
      if (data && data[0]) {
        setOpen(prev => [...prev, data[0].id])
      }
    }
  }

  async function removeProfile(id: string) {
    const profile = profiles.find(p => p.id === id)
    if (profile?.dbId) {
      const supabase = createClient()
      const { error } = await supabase.from('interpreter_rate_profiles').delete().eq('id', profile.dbId)
      if (error) {
        setToast({ message: `Error: ${error.message}`, type: 'error' })
        return
      }
    }
    await fetchRateProfiles()
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

                <div style={{
                  position: 'sticky', bottom: 0, zIndex: 20,
                  background: 'var(--card-bg)', borderTop: '1px solid var(--border)',
                  padding: '14px 0', display: 'flex', justifyContent: 'flex-end',
                }}>
                  <button className="btn-primary" onClick={() => saveProfile(profile.id)} disabled={saving === profile.id} style={{ padding: '9px 22px', opacity: saving === profile.id ? 0.6 : 1 }}>
                    {saving === profile.id ? 'Saving...' : 'Save Changes'}
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
