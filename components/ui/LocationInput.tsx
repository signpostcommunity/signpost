'use client'

import { useState, useMemo, useRef, useEffect } from 'react'

/* ── Data ── */

const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'IN', name: 'India' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'South Korea' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
]

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

const CA_PROVINCES = [
  { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' }, { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' }, { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
]

// Countries without postal codes
const NO_POSTAL_CODE = new Set(['GH', 'KE', 'NG'])

/* ── Label helpers ── */

function getStateLabel(countryCode: string): string {
  switch (countryCode) {
    case 'US': case 'AU': case 'MX': case 'BR': case 'IN': case 'DE': return 'State'
    case 'CA': return 'Province'
    case 'JP': return 'Prefecture'
    default: return 'Region'
  }
}

function getZipLabel(countryCode: string): string | null {
  if (NO_POSTAL_CODE.has(countryCode)) return null
  if (countryCode === 'US') return 'ZIP code'
  return 'Postal code'
}

function getStateOptions(countryCode: string): { code: string; name: string }[] | null {
  if (countryCode === 'US') return US_STATES
  if (countryCode === 'CA') return CA_PROVINCES
  return null
}

/* ── Types ── */

export interface LocationFields {
  locationName?: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  meetingLink?: string
}

interface LocationInputProps {
  locationName?: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  meetingLink?: string
  onChange: (fields: LocationFields) => void
  showLocationName?: boolean
  showMeetingLink?: boolean
  defaultCountry?: string
  accent?: 'cyan' | 'purple'
  disabled?: boolean
}

/* ── Component ── */

export default function LocationInput({
  locationName = '',
  address,
  city,
  state,
  zip,
  country,
  meetingLink = '',
  onChange,
  showLocationName = false,
  showMeetingLink = false,
  defaultCountry = 'US',
  accent = 'cyan',
  disabled = false,
}: LocationInputProps) {
  const accentColor = accent === 'purple' ? '#a78bfa' : '#00e5ff'
  const accentRgba = accent === 'purple' ? 'rgba(167,139,250,' : 'rgba(0,229,255,'

  // Initialize country on mount if empty
  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current && !country) {
      initialized.current = true
      onChange({
        locationName,
        address,
        city,
        state,
        zip,
        country: defaultCountry,
        meetingLink,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effectiveCountry = country || defaultCountry

  const stateLabel = getStateLabel(effectiveCountry)
  const zipLabel = getZipLabel(effectiveCountry)
  const stateOptions = getStateOptions(effectiveCountry)

  // Country dropdown state
  const [countryOpen, setCountryOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const countryRef = useRef<HTMLDivElement>(null)

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRIES
    const q = countrySearch.toLowerCase()
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q))
  }, [countrySearch])

  const countryDisplayName = COUNTRIES.find(c => c.code === effectiveCountry)?.name || effectiveCountry

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function update(partial: Partial<LocationFields>) {
    onChange({
      locationName,
      address,
      city,
      state,
      zip,
      country: effectiveCountry,
      meetingLink,
      ...partial,
    })
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: accentColor,
    marginBottom: 6,
    fontFamily: "'Inter', sans-serif",
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    fontSize: '15px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23b8bfcf' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: 36,
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.target.style.borderColor = accentColor
  }
  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--border)'
  }

  // Remote: only show meeting link
  if (showMeetingLink) {
    return (
      <div>
        <label style={labelStyle}>Meeting Link</label>
        <input
          type="url"
          value={meetingLink}
          onChange={e => update({ meetingLink: e.target.value })}
          placeholder="e.g. https://zoom.us/j/123456789"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
        />
      </div>
    )
  }

  // In-person: show full address form
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Location name (optional, booking forms only) */}
      {showLocationName && (
        <div>
          <label style={labelStyle}>Location Name</label>
          <input
            type="text"
            value={locationName}
            onChange={e => update({ locationName: e.target.value })}
            placeholder="e.g. EvergreenHealth, Seattle Convention Center"
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
          />
        </div>
      )}

      {/* Address */}
      <div>
        <label style={labelStyle}>Address</label>
        <input
          type="text"
          value={address}
          onChange={e => update({ address: e.target.value })}
          placeholder="Street address"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
        />
      </div>

      {/* City / State / ZIP row */}
      <div className="location-input-row" style={{ display: 'grid', gridTemplateColumns: zipLabel ? '1fr auto auto' : '1fr auto', gap: 12 }}>
        {/* City */}
        <div>
          <label style={labelStyle}>City</label>
          <input
            type="text"
            value={city}
            onChange={e => update({ city: e.target.value })}
            placeholder="City"
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
          />
        </div>

        {/* State / Province */}
        <div style={{ minWidth: 140 }}>
          <label style={labelStyle}>{stateLabel}</label>
          {stateOptions ? (
            <select
              value={state}
              onChange={e => update({ state: e.target.value })}
              style={selectStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
            >
              <option value="">Select...</option>
              {stateOptions.map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={state}
              onChange={e => update({ state: e.target.value })}
              placeholder={stateLabel}
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
            />
          )}
        </div>

        {/* ZIP / Postal */}
        {zipLabel && (
          <div style={{ minWidth: 110 }}>
            <label style={labelStyle}>{zipLabel}</label>
            <input
              type="text"
              value={zip}
              onChange={e => update({ zip: e.target.value })}
              placeholder={effectiveCountry === 'US' ? '98101' : 'Postal code'}
              style={{ ...inputStyle, maxWidth: 130 }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Country dropdown */}
      <div ref={countryRef} style={{ position: 'relative' }}>
        <label style={labelStyle}>Country</label>
        <input
          type="text"
          value={countryOpen ? countrySearch : countryDisplayName}
          onChange={e => {
            setCountrySearch(e.target.value)
            if (!countryOpen) setCountryOpen(true)
          }}
          onFocus={() => {
            setCountryOpen(true)
            setCountrySearch('')
          }}
          placeholder="Search countries..."
          style={inputStyle}
          onFocusCapture={handleFocus}
          onBlurCapture={e => {
            setTimeout(() => { e.target.style.borderColor = 'var(--border)' }, 150)
          }}
          disabled={disabled}
        />
        {countryOpen && !disabled && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: 220,
            overflowY: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {filteredCountries.map(c => (
              <div
                key={c.code}
                onClick={() => {
                  setCountryOpen(false)
                  setCountrySearch('')
                  // Clear state when country changes (different state list)
                  update({ country: c.code, state: '' })
                }}
                style={{
                  padding: '9px 14px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  color: c.code === effectiveCountry ? accentColor : 'var(--text)',
                  background: c.code === effectiveCountry ? `${accentRgba}0.06)` : 'transparent',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseOut={e => { e.currentTarget.style.background = c.code === effectiveCountry ? `${accentRgba}0.06)` : 'transparent' }}
              >
                {c.name}
              </div>
            ))}
            {filteredCountries.length === 0 && (
              <div style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: '0.82rem' }}>
                No countries match
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .location-input-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
