'use client'

import { useMemo } from 'react'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  style?: React.CSSProperties
  /** Accent color for focus state, default cyan */
  accent?: string
}

/** Generate time options in 5-minute increments, 12-hour AM/PM display */
function generateTimeOptions(): { display: string; value: string }[] {
  const options: { display: string; value: string }[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      const mStr = m.toString().padStart(2, '0')
      const display = `${h12}:${mStr} ${ampm}`
      const value = `${h.toString().padStart(2, '0')}:${mStr}`
      options.push({ display, value })
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export default function TimePicker({ value, onChange, label, required, style, accent = '#00e5ff' }: TimePickerProps) {
  const focusBorder = `rgba(${accent === '#a78bfa' ? '167,139,250' : '0,229,255'},0.5)`

  return (
    <div>
      {label && (
        <label style={{
          display: 'block',
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          color: '#c8cdd8',
          marginBottom: 6,
        }}>
          {label}{required ? ' *' : ''}
        </label>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={{
          width: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '11px 14px',
          color: value ? 'var(--text)' : 'var(--muted)',
          fontSize: '15px',
          fontFamily: "'Inter', sans-serif",
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none' as const,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2396a0b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: 36,
          ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = focusBorder }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        <option value="">Select time</option>
        {TIME_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.display}</option>
        ))}
      </select>
    </div>
  )
}
