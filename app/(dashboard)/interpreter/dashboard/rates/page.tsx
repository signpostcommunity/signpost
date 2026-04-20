'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, InfoBox } from '@/components/dashboard/interpreter/shared'
import Toast from '@/components/ui/Toast'

type CustomFee = { label: string; amount: string; per: 'flat' | 'hour' | 'day' }

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
  afterHoursOn: boolean
  afterHoursDiff: string
  afterHoursDescription: string
  customFees: CustomFee[]
  travelTimeBilling: 'none' | 'portal_to_portal' | 'custom'
  travelTimeRate: string
  travelTimeDescription: string
  dbId?: string // Supabase row id
}

const MAX_CUSTOM_FEES = 5

function parseTravelExpenses(raw: unknown): { items: string[]; custom: CustomFee[] } {
  if (!raw) return { items: [], custom: [] }
  if (Array.isArray(raw)) return { items: raw as string[], custom: [] }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.items)) {
      const custom = Array.isArray(obj.custom)
        ? (obj.custom as Array<Record<string, unknown>>).map(c => ({
            label: String(c.label ?? ''),
            amount: c.amount == null ? '' : String(c.amount),
            per: (c.per === 'hour' || c.per === 'day' ? c.per : 'flat') as CustomFee['per'],
          }))
        : []
      return { items: obj.items as string[], custom }
    }
    // Legacy boolean-keyed format
    const items: string[] = []
    for (const opt of TRAVEL_OPTIONS) {
      const key = opt.toLowerCase().replace(/[^a-z]+/g, '_')
      if (obj[key] || obj[opt]) items.push(opt)
    }
    const custom = Array.isArray(obj.custom)
      ? (obj.custom as Array<Record<string, unknown>>).map(c => ({
          label: String(c.label ?? ''),
          amount: c.amount == null ? '' : String(c.amount),
          per: (c.per === 'hour' || c.per === 'day' ? c.per : 'flat') as CustomFee['per'],
        }))
      : []
    return { items, custom }
  }
  return { items: [], custom: [] }
}

const TRAVEL_OPTIONS = ['Mileage', 'Parking', 'Tolls', 'Ferry', 'Public Transit', 'Airfare', 'Lodging', 'Per diem / Meals']

const DEFAULT_PROFILES: RateProfile[] = [
  {
    id: 'rp-1', name: 'Standard Rate', color: '#00e5ff', isDefault: true,
    hourlyRate: '', currency: 'USD (US Dollar)', minBooking: 'No minimum',
    cancellationPolicy: '48 hours notice required', lateFee: '100% of booking fee',
    notes: '', travel: [],
    afterHoursOn: false, afterHoursDiff: '', afterHoursDescription: '', customFees: [],
    travelTimeBilling: 'none', travelTimeRate: '', travelTimeDescription: '',
  },
]

const inputStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '9px 12px',
  color: 'var(--text)', fontFamily: "'Inter', sans-serif",
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
      .select('id, interpreter_id, label, is_default, color, hourly_rate, currency, after_hours_diff, after_hours_description, min_booking, cancellation_policy, late_cancel_fee, travel_expenses, eligibility_criteria, additional_terms, travel_time_billing, travel_time_rate, travel_time_description')
      .eq('interpreter_id', profile.id)
      .order('id', { ascending: true })

    console.log('RATES FETCH - response:', JSON.stringify({ data: rates, error: ratesError }, null, 2))

    // If the fetch itself errored, show error - do NOT seed
    if (ratesError) {
      console.error('RATES FETCH - error, not seeding:', ratesError.message)
      setToast({ message: `Error loading rates: ${ratesError.message}`, type: 'error' })
      return
    }

    if (rates && rates.length > 0) {
      setProfiles(rates.map((r, i) => {
        const te = parseTravelExpenses(r.travel_expenses)
        return {
          id: r.id,
          dbId: r.id,
          name: r.label,
          color: r.color || (i === 0 ? '#00e5ff' : i === 1 ? '#34d399' : '#a78bfa'),
          isDefault: r.is_default ?? i === 0,
          hourlyRate: r.hourly_rate?.toString() || '',
          currency: r.currency ? `${r.currency} - ${r.currency === 'USD' ? 'US Dollar' : r.currency === 'GBP' ? 'British Pound' : r.currency === 'EUR' ? 'Euro' : r.currency === 'CAD' ? 'Canadian Dollar' : r.currency === 'AUD' ? 'Australian Dollar' : r.currency}` : 'USD (US Dollar)',
          minBooking: r.min_booking ? `${r.min_booking / 60} hour${r.min_booking > 60 ? 's' : ''}` : 'No minimum',
          cancellationPolicy: r.cancellation_policy || '48 hours notice required',
          lateFee: r.late_cancel_fee == null ? 'No fee' : r.late_cancel_fee === 100 ? '100% of booking fee' : r.late_cancel_fee === 50 ? '50% of booking fee' : `${r.late_cancel_fee}`,
          notes: r.additional_terms || '',
          travel: te.items,
          afterHoursOn: r.after_hours_diff != null && Number(r.after_hours_diff) > 0,
          afterHoursDiff: r.after_hours_diff != null ? String(r.after_hours_diff) : '',
          afterHoursDescription: r.after_hours_description || '',
          customFees: te.custom,
          travelTimeBilling: ((r as { travel_time_billing?: string | null }).travel_time_billing as RateProfile['travelTimeBilling']) || 'none',
          travelTimeRate: (r as { travel_time_rate?: number | null }).travel_time_rate != null ? String((r as { travel_time_rate?: number | null }).travel_time_rate) : '',
          travelTimeDescription: (r as { travel_time_description?: string | null }).travel_time_description || '',
        }
      }))
      setOpen([rates[0]?.id])
      return
    }

    // No rows and no error - seed defaults (once only)
    if (hasSeeded.current) {
      console.log('RATES SEED - already seeded, skipping')
      return
    }
    hasSeeded.current = true
    console.log('RATES SEED - seeding defaults for interpreter_id:', profile.id)

    const defaults = [
      { interpreter_id: profile.id, label: 'Standard Rate', color: '#00e5ff', is_default: true, hourly_rate: null, currency: 'USD', min_booking: null, cancellation_policy: '48 hours notice required', late_cancel_fee: 100, travel_expenses: [], additional_terms: null },
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
      setProfiles(seeded.map((r, i) => {
        const te = parseTravelExpenses(r.travel_expenses)
        return {
          id: r.id,
          dbId: r.id,
          name: r.label,
          color: r.color || (i === 0 ? '#a78bfa' : i === 1 ? '#34d399' : '#00e5ff'),
          isDefault: r.is_default ?? i === 0,
          hourlyRate: r.hourly_rate?.toString() || '',
          currency: r.currency ? `${r.currency} - ${r.currency === 'USD' ? 'US Dollar' : r.currency}` : 'USD (US Dollar)',
          minBooking: r.min_booking ? `${r.min_booking / 60} hour${r.min_booking > 60 ? 's' : ''}` : 'No minimum',
          cancellationPolicy: r.cancellation_policy || '48 hours notice required',
          lateFee: r.late_cancel_fee == null ? 'No fee' : r.late_cancel_fee === 100 ? '100% of booking fee' : r.late_cancel_fee === 50 ? '50% of booking fee' : `${r.late_cancel_fee}`,
          notes: r.additional_terms || '',
          travel: te.items,
          afterHoursOn: r.after_hours_diff != null && Number(r.after_hours_diff) > 0,
          afterHoursDiff: r.after_hours_diff != null ? String(r.after_hours_diff) : '',
          afterHoursDescription: (r as { after_hours_description?: string | null }).after_hours_description || '',
          customFees: te.custom,
          travelTimeBilling: ((r as { travel_time_billing?: string | null }).travel_time_billing as RateProfile['travelTimeBilling']) || 'none',
          travelTimeRate: (r as { travel_time_rate?: number | null }).travel_time_rate != null ? String((r as { travel_time_rate?: number | null }).travel_time_rate) : '',
          travelTimeDescription: (r as { travel_time_description?: string | null }).travel_time_description || '',
        }
      }))
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
      currency: profile.currency.split(' - ')[0] || 'USD',
      min_booking: parseMinBooking(profile.minBooking),
      cancellation_policy: profile.cancellationPolicy,
      late_cancel_fee: profile.lateFee === 'No fee' ? null : parseFloat(profile.lateFee.replace(/[^0-9.]/g, '')) || null,
      travel_expenses: {
        items: profile.travel,
        custom: profile.customFees
          .filter(f => f.label.trim() && f.amount.trim())
          .map(f => ({ label: f.label.trim(), amount: parseFloat(f.amount) || 0, per: f.per })),
      },
      after_hours_diff: profile.afterHoursOn && profile.afterHoursDiff
        ? parseFloat(profile.afterHoursDiff) || null
        : null,
      after_hours_description: profile.afterHoursOn && profile.afterHoursDescription.trim()
        ? profile.afterHoursDescription.trim()
        : null,
      additional_terms: profile.notes || null,
      travel_time_billing: profile.travelTimeBilling,
      travel_time_rate: profile.travelTimeBilling !== 'none' && profile.travelTimeRate
        ? parseFloat(profile.travelTimeRate) || null
        : null,
      travel_time_description: profile.travelTimeBilling !== 'none' && profile.travelTimeDescription.trim()
        ? profile.travelTimeDescription.trim()
        : null,
    }

    if (profile.travelTimeBilling !== 'none' && (!profile.travelTimeRate || !(parseFloat(profile.travelTimeRate) > 0))) {
      setSaving(null)
      setToast({ message: 'Enter a travel time rate or set travel time billing to "I don\'t bill for travel time".', type: 'error' })
      return
    }

    if (profile.afterHoursOn && (!profile.afterHoursDiff || !(parseFloat(profile.afterHoursDiff) > 0))) {
      setSaving(null)
      setToast({ message: 'Enter an after-hours differential amount or turn the toggle off.', type: 'error' })
      return
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
        late_cancel_fee: 100,
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
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
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
              onClick={() => toggleOpen(profile.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 22px', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: profile.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8' }}>{profile.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 2 }}>
                    {profile.isDefault ? 'Your default for most bookings' : 'Click to expand/collapse'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {profile.isDefault && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px' }}>Default</span>
                )}
                {!profile.isDefault && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      if (window.confirm('Delete this rate profile? This cannot be undone.')) {
                        removeProfile(profile.id)
                      }
                    }}
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', fontSize: '0.75rem', padding: '4px 10px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                  >
                    Delete
                  </button>
                )}
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Body */}
            {isOpen && (
              <div style={{ padding: '0 22px 22px', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                {/* Profile name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#c8cdd8', fontSize: '13px', fontWeight: 500, marginBottom: 6 }}>Profile Name</label>
                  <input type="text" value={profile.name} style={{ ...inputStyle, maxWidth: '50%' }}
                    onChange={e => updateProfile(profile.id, { name: e.target.value })}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                  />
                </div>

                <div className="rates-pair-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', color: '#c8cdd8', fontSize: '13px', fontWeight: 500, marginBottom: 6 }}>Hourly Rate</label>
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
                    <label style={{ display: 'block', color: '#c8cdd8', fontSize: '13px', fontWeight: 500, marginBottom: 6 }}>Currency</label>
                    <select value={profile.currency} onChange={e => updateProfile(profile.id, { currency: e.target.value })} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                    >
                      <option>USD (US Dollar)</option>
                      <option>GBP (British Pound)</option>
                      <option>EUR (Euro)</option>
                      <option>CAD (Canadian Dollar)</option>
                      <option>AUD (Australian Dollar)</option>
                    </select>
                  </div>
                </div>

                {/* After-hours differential */}
                <div style={{ marginBottom: 16, padding: '14px 16px', background: '#111118', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={profile.afterHoursOn}
                      onChange={e => updateProfile(profile.id, { afterHoursOn: e.target.checked })}
                      style={{ accentColor: '#00e5ff', width: 16, height: 16 }}
                    />
                    <span style={{ color: '#c8cdd8', fontSize: '13px', fontWeight: 500 }}>
                      I charge a different rate outside standard hours
                    </span>
                  </label>
                  {profile.afterHoursOn && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 12 }}>
                        After-Hours Differential
                      </div>
                      <div className="rates-afterhours-grid" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', color: '#96a0b8', fontSize: '12px', fontWeight: 500, marginBottom: 6 }}>Additional charge</label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>+$</span>
                            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '0.78rem' }}>/hr</span>
                            <input
                              type="text"
                              value={profile.afterHoursDiff}
                              placeholder="0.00"
                              onChange={e => updateProfile(profile.id, { afterHoursDiff: e.target.value })}
                              style={{ ...inputStyle, paddingLeft: 32, paddingRight: 32 }}
                              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', color: '#96a0b8', fontSize: '12px', fontWeight: 500, marginBottom: 6 }}>Hours description</label>
                          <input
                            type="text"
                            value={profile.afterHoursDescription}
                            placeholder="e.g. Mon-Fri 8am-5pm. Differential applies outside these hours, weekends, and holidays."
                            onChange={e => updateProfile(profile.id, { afterHoursDescription: e.target.value })}
                            style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rates-pair-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', color: '#c8cdd8', fontSize: '13px', fontWeight: 500, marginBottom: 6 }}>Minimum Booking</label>
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
                    <label style={{ display: 'block', color: '#c8cdd8', fontSize: '13px', fontWeight: 500, marginBottom: 6 }}>Cancellation Policy</label>
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
                  <label style={{ display: 'block', color: '#c8cdd8', fontSize: '13px', fontWeight: 500, marginBottom: 6 }}>Late Cancellation Fee</label>
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
                <div style={{ fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 14, marginTop: 34 }}>
                  Travel &amp; Incidental Expenses
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 12, lineHeight: 1.5 }}>
                  Select actual travel costs you pass on to clients for on-site jobs. Billed at cost, not marked up.
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

                {/* Custom fees */}
                <div style={{ marginBottom: 16 }}>
                  {profile.customFees.map((fee, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 10 }}>
                      <div style={{ flex: 2 }}>
                        {idx === 0 && <label style={{ display: 'block', color: '#96a0b8', fontSize: '12px', fontWeight: 500, marginBottom: 6 }}>Fee name</label>}
                        <input
                          type="text"
                          value={fee.label}
                          placeholder="e.g. Equipment rental"
                          onChange={e => {
                            const next = [...profile.customFees]
                            next[idx] = { ...next[idx], label: e.target.value }
                            updateProfile(profile.id, { customFees: next })
                          }}
                          style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        {idx === 0 && <label style={{ display: 'block', color: '#96a0b8', fontSize: '12px', fontWeight: 500, marginBottom: 6 }}>Amount</label>}
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>$</span>
                          <input
                            type="text"
                            value={fee.amount}
                            placeholder="0.00"
                            onChange={e => {
                              const next = [...profile.customFees]
                              next[idx] = { ...next[idx], amount: e.target.value }
                              updateProfile(profile.id, { customFees: next })
                            }}
                            style={{ ...inputStyle, paddingLeft: 24 }}
                            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                          />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        {idx === 0 && <label style={{ display: 'block', color: '#96a0b8', fontSize: '12px', fontWeight: 500, marginBottom: 6 }}>Per</label>}
                        <select
                          value={fee.per}
                          onChange={e => {
                            const next = [...profile.customFees]
                            next[idx] = { ...next[idx], per: e.target.value as CustomFee['per'] }
                            updateProfile(profile.id, { customFees: next })
                          }}
                          style={inputStyle}
                          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                        >
                          <option value="flat">flat fee</option>
                          <option value="hour">per hour</option>
                          <option value="day">per day</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = profile.customFees.filter((_, i) => i !== idx)
                          updateProfile(profile.id, { customFees: next })
                        }}
                        aria-label="Remove fee"
                        style={{
                          background: 'none', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
                          width: 36, height: 38, cursor: 'pointer', fontSize: '0.95rem',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ff6b85'; e.currentTarget.style.borderColor = '#ff6b85' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {profile.customFees.length < MAX_CUSTOM_FEES && (
                    <button
                      type="button"
                      onClick={() => updateProfile(profile.id, { customFees: [...profile.customFees, { label: '', amount: '', per: 'flat' }] })}
                      style={{
                        background: 'none', border: 'none', color: 'var(--accent)',
                        fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
                        fontWeight: 500, cursor: 'pointer', padding: '6px 0',
                      }}
                    >
                      + Add Custom Fee
                    </button>
                  )}
                </div>

                {/* Travel Time Billing */}
                <div style={{ fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 14, marginTop: 34 }}>
                  Travel Time Billing
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {([
                    { value: 'none', label: "I don't bill for travel time" },
                    { value: 'portal_to_portal', label: 'Portal-to-portal (from departure to arrival and return)' },
                    { value: 'custom', label: 'Custom arrangement' },
                  ] as const).map(opt => {
                    const active = profile.travelTimeBilling === opt.value
                    return (
                      <label
                        key={opt.value}
                        onClick={() => updateProfile(profile.id, { travelTimeBilling: opt.value })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                          background: active ? 'rgba(0,229,255,0.06)' : 'var(--surface2)',
                          border: `1px solid ${active ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          fontSize: '0.85rem', color: active ? 'var(--text)' : 'var(--muted)',
                          userSelect: 'none', transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="radio"
                          checked={active}
                          onChange={() => updateProfile(profile.id, { travelTimeBilling: opt.value })}
                          style={{ accentColor: '#00e5ff', width: 16, height: 16, margin: 0 }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    )
                  })}
                </div>
                {profile.travelTimeBilling !== 'none' && (
                  <div style={{ marginBottom: 16, padding: '14px 16px', background: '#111118', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', color: '#96a0b8', fontSize: '12px', fontWeight: 500, marginBottom: 6 }}>Travel time rate</label>
                      <div style={{ position: 'relative', maxWidth: 220 }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>$</span>
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '0.78rem' }}>/hr</span>
                        <input
                          type="text"
                          value={profile.travelTimeRate}
                          placeholder="0.00"
                          onChange={e => updateProfile(profile.id, { travelTimeRate: e.target.value })}
                          style={{ ...inputStyle, paddingLeft: 24, paddingRight: 32 }}
                          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                        />
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 6, lineHeight: 1.4 }}>
                        Required. Can be different from your interpreting rate. Common practice: 50% of interpreting rate.
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#96a0b8', fontSize: '12px', fontWeight: 500, marginBottom: 6 }}>Description (optional)</label>
                      <textarea
                        value={profile.travelTimeDescription}
                        placeholder="e.g. Travel time billed at 50% of interpreting rate. Portal-to-portal from my home office in Seattle."
                        onChange={e => updateProfile(profile.id, { travelTimeDescription: e.target.value })}
                        style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }}
                        onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#c8cdd8', fontSize: '13px', fontWeight: 500, marginBottom: 6 }}>Additional terms or notes (optional)</label>
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
      {profiles.length >= 10 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem', padding: '14px 0' }}>
          Maximum of 10 rate profiles
        </div>
      ) : (
        <button
          onClick={addProfile}
          style={{
            width: '100%', padding: 14, background: 'transparent',
            border: '1.5px dashed var(--border)', borderRadius: 'var(--radius)',
            color: 'var(--muted)', fontFamily: "'Inter', sans-serif", fontSize: '0.9rem',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
        >
          + Add Rate Profile
        </button>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @media (max-width: 640px) {
          .rates-pair-grid {
            grid-template-columns: 1fr !important;
          }
          .rates-afterhours-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
