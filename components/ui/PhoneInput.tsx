'use client'

import { useState, useRef, useCallback, useId } from 'react'
import { AsYouType, parsePhoneNumber } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
import { normalizePhone, isValidPhone } from '@/lib/phone'

// ─── Country data ────────────────────────────────────────────────────────────

interface CountryEntry {
  code: CountryCode
  name: string
  dial: string
  placeholder: string
}

const COUNTRIES: CountryEntry[] = [
  { code: 'AU', name: 'Australia', dial: '+61', placeholder: '412 345 678' },
  { code: 'BR', name: 'Brazil', dial: '+55', placeholder: '11 91234 5678' },
  { code: 'CA', name: 'Canada', dial: '+1', placeholder: '(604) 555-1234' },
  { code: 'DK', name: 'Denmark', dial: '+45', placeholder: '32 12 34 56' },
  { code: 'FI', name: 'Finland', dial: '+358', placeholder: '50 123 4567' },
  { code: 'FR', name: 'France', dial: '+33', placeholder: '06 12 34 56 78' },
  { code: 'DE', name: 'Germany', dial: '+49', placeholder: '170 1234567' },
  { code: 'GH', name: 'Ghana', dial: '+233', placeholder: '23 123 4567' },
  { code: 'IN', name: 'India', dial: '+91', placeholder: '91234 56789' },
  { code: 'IE', name: 'Ireland', dial: '+353', placeholder: '85 012 3456' },
  { code: 'IT', name: 'Italy', dial: '+39', placeholder: '312 345 6789' },
  { code: 'JP', name: 'Japan', dial: '+81', placeholder: '090-1234-5678' },
  { code: 'KE', name: 'Kenya', dial: '+254', placeholder: '712 345678' },
  { code: 'KR', name: 'South Korea', dial: '+82', placeholder: '10-1234-5678' },
  { code: 'MX', name: 'Mexico', dial: '+52', placeholder: '222 123 4567' },
  { code: 'NL', name: 'Netherlands', dial: '+31', placeholder: '6 12345678' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', placeholder: '21 123 4567' },
  { code: 'NG', name: 'Nigeria', dial: '+234', placeholder: '802 123 4567' },
  { code: 'NO', name: 'Norway', dial: '+47', placeholder: '412 34 567' },
  { code: 'PH', name: 'Philippines', dial: '+63', placeholder: '905 123 4567' },
  { code: 'ZA', name: 'South Africa', dial: '+27', placeholder: '71 123 4567' },
  { code: 'ES', name: 'Spain', dial: '+34', placeholder: '612 34 56 78' },
  { code: 'SE', name: 'Sweden', dial: '+46', placeholder: '70 123 45 67' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', placeholder: '7911 123456' },
  { code: 'US', name: 'United States', dial: '+1', placeholder: '(206) 555-1234' },
]

// Map ISO code to entry for fast lookup
const COUNTRY_MAP = new Map(COUNTRIES.map(c => [c.code, c]))

function resolveCountry(code: string | undefined): CountryEntry {
  if (!code) return COUNTRY_MAP.get('US')!
  const upper = code.toUpperCase()
  // Handle UK -> GB mapping
  if (upper === 'UK') return COUNTRY_MAP.get('GB')!
  return COUNTRY_MAP.get(upper as CountryCode) ?? COUNTRY_MAP.get('US')!
}

// ─── Format as you type ──────────────────────────────────────────────────────

function formatPartial(digits: string, countryCode: CountryCode): string {
  if (!digits) return ''
  const formatter = new AsYouType(countryCode)
  // Feed digits (without country prefix) through the formatter
  formatter.input(digits)
  const formatted = formatter.getNumber()?.formatNational()
  // For partial input, AsYouType may not produce a national format yet
  return formatted || digits
}

function stripNonDigits(s: string): string {
  return s.replace(/\D/g, '')
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  value: string
  onChange: (e164Value: string) => void
  defaultCountry?: string
  label?: string
  error?: string
  disabled?: boolean
  accent?: 'purple' | 'cyan'
}

export default function PhoneInput({
  value,
  onChange,
  defaultCountry = 'US',
  label,
  error: externalError,
  disabled = false,
  accent = 'cyan',
}: PhoneInputProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  // Parse the incoming value to determine country and local number
  const initialCountry = resolveCountry(defaultCountry)
  const [selectedCountry, setSelectedCountry] = useState<CountryEntry>(() => {
    // If value is E.164, try to detect its country
    if (value && value.startsWith('+')) {
      try {
        const parsed = parsePhoneNumber(value)
        if (parsed?.country) {
          return resolveCountry(parsed.country)
        }
      } catch { /* use default */ }
    }
    return initialCountry
  })

  // Local display value (formatted national number)
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (!value) return ''
    if (value.startsWith('+')) {
      try {
        const parsed = parsePhoneNumber(value)
        if (parsed) return parsed.formatNational()
      } catch { /* fallback */ }
    }
    return value
  })

  const [internalError, setInternalError] = useState('')
  const [touched, setTouched] = useState(false)

  const accentColor = accent === 'purple' ? 'rgba(167,139,250,0.5)' : 'rgba(0,229,255,0.5)'
  const accentSolid = accent === 'purple' ? '#a78bfa' : '#00e5ff'
  const errorColor = '#f06b85'

  const hasError = !!(externalError || internalError)
  const errorMessage = externalError || internalError

  const handleCountryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = resolveCountry(e.target.value)
    setSelectedCountry(newCountry)
    // Re-normalize current digits with new country
    const digits = stripNonDigits(displayValue)
    if (digits) {
      const formatted = formatPartial(digits, newCountry.code)
      setDisplayValue(formatted)
      const e164 = normalizePhone(digits, newCountry.code)
      onChange(e164 || digits)
    }
    setInternalError('')
    inputRef.current?.focus()
  }, [displayValue, onChange])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const digits = stripNonDigits(raw)
    const formatted = formatPartial(digits, selectedCountry.code)
    setDisplayValue(formatted || digits)

    // Pass back E.164 if valid, otherwise raw digits so partial typing works
    const e164 = normalizePhone(digits, selectedCountry.code)
    onChange(e164 || digits)

    // Clear error while typing
    if (internalError) setInternalError('')
  }, [selectedCountry, onChange, internalError])

  const handleBlur = useCallback(() => {
    setTouched(true)
    const digits = stripNonDigits(displayValue)
    if (!digits) {
      setInternalError('')
      return
    }
    if (!isValidPhone(digits, selectedCountry.code)) {
      setInternalError('Please enter a valid phone number')
    } else {
      setInternalError('')
    }
  }, [displayValue, selectedCountry])

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = hasError ? errorColor : accentColor
  }, [hasError, accentColor])

  const handleInputBlurStyle = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = hasError ? errorColor : 'var(--border)'
    handleBlur()
  }, [hasError, handleBlur])

  const borderColor = hasError && touched ? errorColor : 'var(--border)'

  return (
    <div>
      {label && (
        <label
          htmlFor={`${id}-phone`}
          style={{
            display: 'block',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            color: '#c8cdd8',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {/* Country selector */}
        <select
          value={selectedCountry.code}
          onChange={handleCountryChange}
          disabled={disabled}
          aria-label="Country code"
          style={{
            background: 'var(--surface2)',
            border: `1px solid ${borderColor}`,
            borderRight: 'none',
            borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
            padding: '10px 8px 10px 10px',
            color: 'var(--muted)',
            fontSize: '0.85rem',
            fontFamily: "'Inter', sans-serif",
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            minWidth: 80,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.code} {c.dial}
            </option>
          ))}
        </select>

        {/* Phone input */}
        <input
          ref={inputRef}
          id={`${id}-phone`}
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleInputBlurStyle}
          placeholder={selectedCountry.placeholder}
          disabled={disabled}
          aria-invalid={hasError && touched ? true : undefined}
          aria-describedby={hasError && touched ? `${id}-error` : undefined}
          style={{
            flex: 1,
            background: 'var(--surface2)',
            border: `1px solid ${borderColor}`,
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            padding: '10px 14px',
            color: 'var(--text)',
            fontSize: 15,
            fontFamily: "'Inter', sans-serif",
            outline: 'none',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : undefined,
          }}
        />
      </div>

      {/* Error message */}
      {hasError && touched && (
        <div
          id={`${id}-error`}
          role="alert"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: errorColor,
            marginTop: 6,
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  )
}
