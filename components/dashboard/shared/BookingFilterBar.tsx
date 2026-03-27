'use client'

import React, { useState, useEffect, useRef } from 'react'

interface BookingFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
}

export default function BookingFilterBar({
  search, onSearchChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
}: BookingFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearchChange(localSearch)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [localSearch, onSearchChange])

  // Sync external search changes
  useEffect(() => { setLocalSearch(search) }, [search])

  const inputStyle: React.CSSProperties = {
    background: '#16161f',
    border: '1px solid #333',
    borderRadius: 'var(--radius-sm)',
    padding: '9px 14px',
    color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.88rem',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'var(--accent)'
  }
  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = '#333'
  }

  return (
    <div className="booking-filter-bar" style={{
      display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center',
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search requests..."
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', paddingLeft: 36 }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label="Search requests"
        />
      </div>

      {/* Date range */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={e => onDateFromChange(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: 140 }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label="Filter from date"
        />
        <label style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>To</label>
        <input
          type="date"
          value={dateTo}
          onChange={e => onDateToChange(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: 140 }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label="Filter to date"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { onDateFromChange(''); onDateToChange('') }}
            style={{
              background: 'none', border: '1px solid #333', borderRadius: 'var(--radius-sm)',
              padding: '8px 12px', color: 'var(--muted)', fontSize: '0.78rem',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
            }}
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  )
}

/** Sort bookings soonest-first (ascending date). Past items after upcoming. */
export function sortSoonestFirst<T extends { date: string }>(items: T[]): T[] {
  const today = getLocalToday()
  const upcoming = items.filter(i => i.date >= today).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const past = items.filter(i => i.date < today).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  return [...upcoming, ...past]
}

/** Filter items by search query across specified text fields */
export function filterBySearch<T>(items: T[], query: string, fields: (keyof T)[]): T[] {
  if (!query.trim()) return items
  const lower = query.toLowerCase()
  return items.filter(item =>
    fields.some(f => {
      const val = item[f]
      return typeof val === 'string' && val.toLowerCase().includes(lower)
    })
  )
}

/** Filter items by date range */
export function filterByDateRange<T extends { date: string }>(items: T[], from: string, to: string): T[] {
  return items.filter(item => {
    if (from && item.date < from) return false
    if (to && item.date > to) return false
    return true
  })
}

export function getLocalToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Group bookings by time category relative to today */
export function groupByTimeCategory<T extends { date: string }>(bookings: T[]): { label: string; items: T[]; isPast: boolean }[] {
  const now = new Date()
  const today = getLocalToday()

  // Monday of this week
  const dayOfWeek = now.getDay() // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() + mondayOffset)
  const thisSunday = new Date(thisMonday)
  thisSunday.setDate(thisMonday.getDate() + 6)

  const nextMonday = new Date(thisMonday)
  nextMonday.setDate(thisMonday.getDate() + 7)
  const nextSunday = new Date(nextMonday)
  nextSunday.setDate(nextMonday.getDate() + 6)

  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dy = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dy}`
  }

  const thisMon = fmt(thisMonday)
  const thisSun = fmt(thisSunday)
  const nextMon = fmt(nextMonday)
  const nextSun = fmt(nextSunday)

  const groups: Record<string, T[]> = { today: [], thisWeek: [], nextWeek: [], later: [], past: [] }

  for (const b of bookings) {
    if (b.date < today) {
      groups.past.push(b)
    } else if (b.date === today) {
      groups.today.push(b)
    } else if (b.date >= thisMon && b.date <= thisSun) {
      groups.thisWeek.push(b)
    } else if (b.date >= nextMon && b.date <= nextSun) {
      groups.nextWeek.push(b)
    } else {
      groups.later.push(b)
    }
  }

  // Sort each group by date ascending (past: most recent first)
  const asc = (a: T, b: T) => (a.date || '').localeCompare(b.date || '')
  const desc = (a: T, b: T) => (b.date || '').localeCompare(a.date || '')
  groups.today.sort(asc)
  groups.thisWeek.sort(asc)
  groups.nextWeek.sort(asc)
  groups.later.sort(asc)
  groups.past.sort(desc)

  return [
    { label: 'TODAY', items: groups.today, isPast: false },
    { label: 'THIS WEEK', items: groups.thisWeek, isPast: false },
    { label: 'NEXT WEEK', items: groups.nextWeek, isPast: false },
    { label: 'LATER', items: groups.later, isPast: false },
    { label: 'PAST', items: groups.past, isPast: true },
  ].filter(g => g.items.length > 0)
}

/** Section header style for time categories */
export const timeCategoryHeaderStyle: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#96a0b8',
  marginBottom: 16,
  marginTop: 32,
}
