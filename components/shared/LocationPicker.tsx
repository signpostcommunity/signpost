'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Country, State } from 'country-state-city'

interface LocationPickerProps {
  country?: string
  state?: string
  city?: string
  onChange: (location: { country: string; state: string; city: string }) => void
  accentColor?: string // allow purple accent for deaf portal
}

// Map country names to subdivision labels
function getSubdivisionLabel(countryCode: string): string {
  switch (countryCode) {
    case 'US': return 'State'
    case 'CA': return 'Province'
    case 'AU': return 'State/Territory'
    case 'GB': return 'Region'
    case 'MX': return 'State'
    case 'BR': return 'State'
    case 'IN': return 'State'
    case 'DE': return 'State'
    case 'JP': return 'Prefecture'
    default: return 'State / Province / Region'
  }
}

export default function LocationPicker({ country = '', state = '', city = '', onChange, accentColor }: LocationPickerProps) {
  const accent = accentColor || 'var(--accent)'
  const allCountries = useMemo(() => Country.getAllCountries(), [])

  // Resolve country name → ISO code
  const countryCode = useMemo(() => {
    if (!country) return ''
    const match = allCountries.find(
      c => c.name === country || c.isoCode === country
    )
    return match?.isoCode || ''
  }, [country, allCountries])

  // Get states for selected country
  const states = useMemo(() => {
    if (!countryCode) return []
    return State.getStatesOfCountry(countryCode)
  }, [countryCode])

  const hasStates = states.length > 0

  // Country search
  const [countrySearch, setCountrySearch] = useState('')
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const countryRef = useRef<HTMLDivElement>(null)

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return allCountries
    const q = countrySearch.toLowerCase()
    return allCountries.filter(c => c.name.toLowerCase().includes(q))
  }, [countrySearch, allCountries])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Default to United States if no value
  useEffect(() => {
    if (!country) {
      onChange({ country: 'United States', state: '', city: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectCountry(name: string) {
    setCountryDropdownOpen(false)
    setCountrySearch('')
    onChange({ country: name, state: '', city })
  }

  function selectState(name: string) {
    onChange({ country, state: name, city })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '11px 14px',
    color: 'var(--text)',
    fontSize: '0.9rem',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--muted)',
    marginBottom: 6,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 16 }}>
      {/* Country — searchable dropdown */}
      <div ref={countryRef} style={{ position: 'relative' }}>
        <label style={labelStyle}>Country *</label>
        <input
          type="text"
          value={countryDropdownOpen ? countrySearch : country}
          onChange={e => {
            setCountrySearch(e.target.value)
            if (!countryDropdownOpen) setCountryDropdownOpen(true)
          }}
          onFocus={() => {
            setCountryDropdownOpen(true)
            setCountrySearch('')
          }}
          placeholder="Search countries..."
          style={inputStyle}
          onFocusCapture={e => { e.target.style.borderColor = accent }}
          onBlurCapture={e => {
            // Delay to allow click on dropdown
            setTimeout(() => { e.target.style.borderColor = 'var(--border)' }, 150)
          }}
        />
        {countryDropdownOpen && (
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
            {filteredCountries.slice(0, 50).map(c => (
              <div
                key={c.isoCode}
                onClick={() => selectCountry(c.name)}
                style={{
                  padding: '9px 14px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  color: c.name === country ? accent : 'var(--text)',
                  background: c.name === country ? 'rgba(0,229,255,0.06)' : 'transparent',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseOut={e => (e.currentTarget.style.background = c.name === country ? 'rgba(0,229,255,0.06)' : 'transparent')}
              >
                {c.flag} {c.name}
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

      {/* State / Province — dynamic dropdown or hidden */}
      {hasStates ? (
        <div>
          <label style={labelStyle}>{getSubdivisionLabel(countryCode)}</label>
          <select
            value={state}
            onChange={e => selectState(e.target.value)}
            style={{
              ...inputStyle,
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23b0b8d0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '32px',
            }}
            onFocus={e => { e.target.style.borderColor = accent }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          >
            <option value="">Select {getSubdivisionLabel(countryCode).toLowerCase()}...</option>
            {states.map(s => (
              <option key={s.isoCode} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      ) : country ? (
        <div>
          <label style={labelStyle}>State / Province / Region</label>
          <input
            type="text"
            value={state}
            onChange={e => onChange({ country, state: e.target.value, city })}
            placeholder="Optional"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = accent }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
        </div>
      ) : null}

      {/* City — free text */}
      <div>
        <label style={labelStyle}>City *</label>
        <input
          type="text"
          value={city}
          onChange={e => onChange({ country, state, city: e.target.value })}
          placeholder="e.g. Seattle, Toronto..."
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = accent }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>
    </div>
  )
}
