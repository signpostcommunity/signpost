'use client'

import { useState } from 'react'
import { useForm, RateProfile } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormRow, FormField, FieldLabel,
  SelectInput, TextareaInput, MoneyInput, AddButton, RemoveButton, FormNav, ToggleTile,
} from './FormFields'
import { TRAVEL_OPTIONS } from '@/lib/data/languages'

const CURRENCIES = [
  'USD — US Dollar', 'GBP — British Pound', 'EUR — Euro',
  'CAD — Canadian Dollar', 'AUD — Australian Dollar', 'Other',
]

const MIN_BOOKINGS = [
  'No minimum', '1 hour', '1.5 hours', '2 hours', '3 hours',
  'Half day (4 hrs)', 'Full day (8 hrs)',
]

const CANCELLATION_POLICIES = [
  '24 hours notice required', '48 hours notice required',
  '72 hours notice required', '1 week notice required', 'Custom (describe below)',
]

const LATE_FEES = [
  'No fee', '50% of booking fee', '100% of booking fee',
  '1 hour minimum charge', '2 hour minimum charge', 'Custom (describe below)',
]

const MIN_ENGAGEMENTS = ['2 days', '3 days', '4 days', '5 days (1 week)', 'Custom']

const CANCELLATION_WINDOWS = [
  '2 weeks notice required', '3 weeks notice required', '4 weeks notice required',
  '6 weeks notice required', '8 weeks notice required', 'Custom (describe below)',
]

const LATE_FEES_MULTIDAY = [
  '50% of total booking', '100% of total booking',
  'First day fee', 'Custom (describe below)',
]

function RateProfileCard({
  profile, isOpen, onToggle, onUpdate, onRemove, canRemove,
}: {
  profile: RateProfile
  isOpen: boolean
  onToggle: () => void
  onUpdate: (updates: Partial<RateProfile>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const isDefault = profile.isDefault
  const isMultiday = profile.profileType === 'multiday'
  const isCommunity = profile.profileType === 'community'

  function toggleTravel(option: string) {
    const current = profile.travel
    onUpdate({
      travel: current.includes(option)
        ? current.filter(t => t !== option)
        : [...current, option]
    })
  }

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', marginBottom: 16, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Header */}
      <div
        onClick={isDefault ? undefined : onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none',
          background: 'var(--surface2)',
          cursor: isDefault ? 'default' : 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: profile.dotColor, flexShrink: 0,
          }} />
          <div>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: '0.95rem', marginBottom: 2,
            }}>
              {profile.name}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
              {profile.hint}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isDefault && (
            <span style={{
              borderRadius: 100, padding: '3px 10px',
              fontSize: '0.68rem', fontWeight: 700,
              fontFamily: "'Syne', sans-serif", letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'rgba(0,229,255,0.1)',
              border: '1px solid rgba(0,229,255,0.25)',
              color: 'var(--accent)',
            }}>
              Default
            </span>
          )}
          {!isDefault && (
            <>
              <span style={{
                color: 'var(--muted)', fontSize: '0.75rem',
                transition: 'transform 0.2s',
                transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                display: 'inline-block',
              }}>▼</span>
              {canRemove && (
                <button
                  onClick={e => { e.stopPropagation(); onRemove() }}
                  style={{
                    background: 'none', border: '1px solid rgba(255,77,109,0.2)',
                    color: 'var(--accent3)', borderRadius: 8,
                    padding: '5px 12px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  Remove
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div style={{ padding: '22px 22px 16px' }}>
          {/* Rate fields */}
          {isMultiday ? (
            <FormRow>
              <FormField>
                <FieldLabel>Daily Rate</FieldLabel>
                <MoneyInput value={profile.dailyRate} onChange={v => onUpdate({ dailyRate: v })} />
              </FormField>
              <FormField>
                <FieldLabel>Or hourly rate for multi-day</FieldLabel>
                <MoneyInput value={profile.hourlyRate} onChange={v => onUpdate({ hourlyRate: v })} />
              </FormField>
            </FormRow>
          ) : (
            <FormRow>
              <FormField>
                <FieldLabel>Hourly Rate</FieldLabel>
                <MoneyInput value={profile.hourlyRate} onChange={v => onUpdate({ hourlyRate: v })} />
              </FormField>
              <FormField>
                <FieldLabel>Currency</FieldLabel>
                <SelectInput value={profile.currency} onChange={e => onUpdate({ currency: e.target.value })}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </SelectInput>
              </FormField>
            </FormRow>
          )}

          {/* After-hours */}
          <FormRow>
            <FormField style={{ gridColumn: '1 / -1' }}>
              <FieldLabel>
                After-hours Differential{' '}
                <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.8rem' }}>
                  (optional — for evenings, weekends &amp; holidays)
                </span>
              </FieldLabel>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <MoneyInput value={profile.afterHoursRate} onChange={v => onUpdate({ afterHoursRate: v })} />
                </div>
                <SelectInput
                  value={profile.afterHoursPer}
                  onChange={e => onUpdate({ afterHoursPer: e.target.value })}
                  style={{ flex: '0 0 auto', width: 160 }}
                >
                  <option>Per hour</option>
                  <option>Per assignment</option>
                </SelectInput>
              </div>
            </FormField>
          </FormRow>

          {/* Booking / cancellation */}
          {isMultiday ? (
            <>
              <FormRow>
                <FormField>
                  <FieldLabel>Minimum engagement</FieldLabel>
                  <SelectInput value={profile.minimumEngagement} onChange={e => onUpdate({ minimumEngagement: e.target.value })}>
                    {MIN_ENGAGEMENTS.map(o => <option key={o}>{o}</option>)}
                  </SelectInput>
                </FormField>
                <FormField>
                  <FieldLabel>Cancellation window</FieldLabel>
                  <SelectInput value={profile.cancellationWindow} onChange={e => onUpdate({ cancellationWindow: e.target.value })}>
                    {CANCELLATION_WINDOWS.map(o => <option key={o}>{o}</option>)}
                  </SelectInput>
                </FormField>
              </FormRow>
              <FormRow>
                <FormField style={{ gridColumn: '1 / -1' }}>
                  <FieldLabel>Late cancellation fee</FieldLabel>
                  <SelectInput value={profile.lateCancellationFee} onChange={e => onUpdate({ lateCancellationFee: e.target.value })}>
                    {LATE_FEES_MULTIDAY.map(o => <option key={o}>{o}</option>)}
                  </SelectInput>
                </FormField>
              </FormRow>
            </>
          ) : (
            <>
              <FormRow>
                <FormField>
                  <FieldLabel>Minimum Booking</FieldLabel>
                  <SelectInput value={profile.minimumBooking} onChange={e => onUpdate({ minimumBooking: e.target.value })}>
                    {MIN_BOOKINGS.map(o => <option key={o}>{o}</option>)}
                  </SelectInput>
                </FormField>
                <FormField>
                  <FieldLabel>Cancellation Policy</FieldLabel>
                  <SelectInput value={profile.cancellationPolicy} onChange={e => onUpdate({ cancellationPolicy: e.target.value })}>
                    {CANCELLATION_POLICIES.map(o => <option key={o}>{o}</option>)}
                  </SelectInput>
                </FormField>
              </FormRow>
              <FormRow>
                <FormField style={{ gridColumn: '1 / -1' }}>
                  <FieldLabel>Late cancellation fee</FieldLabel>
                  <SelectInput value={profile.lateCancellationFee} onChange={e => onUpdate({ lateCancellationFee: e.target.value })}>
                    {LATE_FEES.map(o => <option key={o}>{o}</option>)}
                  </SelectInput>
                </FormField>
              </FormRow>
            </>
          )}

          {/* Community-only: eligibility */}
          {isCommunity && (
            <FormRow>
              <FormField style={{ gridColumn: '1 / -1' }}>
                <FieldLabel>Eligibility criteria</FieldLabel>
                <input
                  type="text"
                  placeholder="e.g. Must provide 501(c)(3) documentation or equivalent"
                  value={profile.eligibilityCriteria}
                  onChange={e => onUpdate({ eligibilityCriteria: e.target.value })}
                  style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '11px 14px',
                    color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />
              </FormField>
            </FormRow>
          )}

          {/* Travel & Incidentals */}
          <SectionTitle>Travel &amp; Incidental Expenses</SectionTitle>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 14 }}>
            Select which actual travel costs you pass on to clients for on-site jobs. These are billed at cost — not marked up.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 8, marginBottom: 16,
          }}>
            {TRAVEL_OPTIONS.map(opt => (
              <ToggleTile
                key={opt}
                label={opt}
                selected={profile.travel.includes(opt)}
                onToggle={() => toggleTravel(opt)}
              />
            ))}
          </div>

          {/* Notes */}
          <FormRow full>
            <FormField>
              <FieldLabel>
                {isMultiday
                  ? 'Additional notes (optional)'
                  : isCommunity
                  ? 'Additional notes (optional)'
                  : 'Additional terms or notes for this profile (optional)'}
              </FieldLabel>
              <TextareaInput
                placeholder={
                  isMultiday
                    ? 'e.g. Multi-day bookings include a team coordinator fee for engagements over 3 days…'
                    : isCommunity
                    ? 'Any additional conditions for this rate…'
                    : 'e.g. Rate applies Mon–Fri 8am–6pm. Weekend and holiday bookings billed at 1.5x…'
                }
                value={profile.notes}
                onChange={e => onUpdate({ notes: e.target.value })}
                style={{ minHeight: 72 }}
              />
            </FormField>
          </FormRow>
        </div>
      )}
    </div>
  )
}

let customProfileCounter = 4

export default function Step4Rates({ onBack, onContinue }: {
  onBack: () => void
  onContinue: () => void
}) {
  const { formData, updateField } = useForm()
  const [openProfiles, setOpenProfiles] = useState<string[]>(['profile-1'])

  function toggleProfile(id: string) {
    setOpenProfiles(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  function updateProfile(id: string, updates: Partial<RateProfile>) {
    updateField('rateProfiles', formData.rateProfiles.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ))
  }

  function removeProfile(id: string) {
    updateField('rateProfiles', formData.rateProfiles.filter(p => p.id !== id))
    setOpenProfiles(prev => prev.filter(p => p !== id))
  }

  function addProfile() {
    const id = `profile-${customProfileCounter++}`
    const newProfile: RateProfile = {
      id,
      name: 'Custom Rate',
      hint: 'Custom rate profile',
      dotColor: '#b0b8d0',
      profileType: 'custom',
      hourlyRate: '', dailyRate: '', currency: 'USD — US Dollar',
      afterHoursRate: '', afterHoursPer: 'Per hour',
      minimumBooking: '2 hours', cancellationPolicy: '48 hours notice required',
      lateCancellationFee: '100% of booking fee',
      minimumEngagement: '', cancellationWindow: '',
      eligibilityCriteria: '', travel: [], notes: '',
    }
    updateField('rateProfiles', [...formData.rateProfiles, newProfile])
    setOpenProfiles(prev => [...prev, id])
  }

  return (
    <StepWrapper>
      {/* How rate profiles work — merged info box at top */}
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '18px 20px', marginBottom: 28,
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--muted)', marginBottom: 8,
        }}>
          How rate profiles work
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>
          Rates are never shown publicly on your profile. When a requester contacts you, choose which profile to send with your reply — they see your full rate and terms before confirming. You can customize the quote for any individual job. These profiles are starting points, not locked-in prices.
        </p>
      </div>

      {/* Rate profile cards */}
      {formData.rateProfiles.map(profile => (
        <RateProfileCard
          key={profile.id}
          profile={profile}
          isOpen={openProfiles.includes(profile.id)}
          onToggle={() => toggleProfile(profile.id)}
          onUpdate={updates => updateProfile(profile.id, updates)}
          onRemove={() => removeProfile(profile.id)}
          canRemove={!profile.isDefault}
        />
      ))}

      <AddButton onClick={addProfile}>+ Add Another Rate Profile</AddButton>

      <FormNav step={4} totalSteps={6} onBack={onBack} onContinue={onContinue} />
    </StepWrapper>
  )
}
