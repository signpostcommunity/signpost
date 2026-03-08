'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { DEMO_CONFIRMED } from '@/lib/data/demo'
import { BetaBanner, PageHeader, SectionLabel, StatusBadge, DemoBadge, GhostButton, DashMobileStyles } from '@/components/dashboard/interpreter/shared'

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 20,
}

const modalStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '28px 32px',
  width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', color: 'var(--muted)',
  fontFamily: "'Syne', sans-serif", fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
}

/* ── Date/time helpers ── */

function parseDateTime(dateStr: string, timeStr: string): { start: Date; end: Date } {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }

  // Handle date ranges like "Apr 3–5, 2026"
  const rangeMatch = dateStr.match(/^(\w+)\s+(\d+)[–\-](\d+),?\s+(\d+)$/)
  if (rangeMatch) {
    const [, mon, d1, d2, yr] = rangeMatch
    const start = new Date(+yr, months[mon] ?? 0, +d1, 9, 0)
    const end = new Date(+yr, months[mon] ?? 0, +d2, 17, 0)
    return { start, end }
  }

  // Parse "Mar 15, 2026"
  const dateMatch = dateStr.match(/^(\w+)\s+(\d+),?\s+(\d+)$/)
  let year = 2026, month = 2, day = 15
  if (dateMatch) {
    month = months[dateMatch[1]] ?? 2
    day = +dateMatch[2]
    year = +dateMatch[3]
  }

  // Parse "10:30 AM – 12:00 PM" or "Full days"
  let startH = 9, startM = 0, endH = 17, endM = 0
  if (timeStr !== 'Full days') {
    const times = timeStr.split(/\s*[–\-]\s*/)
    const parseTime = (t: string) => {
      const m = t.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i)
      if (!m) return { h: 9, m: 0 }
      let h = +m[1]
      const min = +m[2]
      const ampm = m[3].toUpperCase()
      if (ampm === 'PM' && h < 12) h += 12
      if (ampm === 'AM' && h === 12) h = 0
      return { h, m: min }
    }
    if (times[0]) { const t = parseTime(times[0]); startH = t.h; startM = t.m }
    if (times[1]) { const t = parseTime(times[1]); endH = t.h; endM = t.m }
  }

  return {
    start: new Date(year, month, day, startH, startM),
    end: new Date(year, month, day, endH, endM),
  }
}

function toGoogleDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

function toISOLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

/* ── Detail Modal ── */

function DetailModal({ booking, onClose }: {
  booking: typeof DEMO_CONFIRMED[0]
  onClose: () => void
}) {
  const isRemote = booking.mode === 'Remote'

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10,
  }

  const detailRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 6,
  }

  const iconStyle: React.CSSProperties = { color: 'var(--muted)', flexShrink: 0, marginTop: 2 }

  const sectionStyle: React.CSSProperties = {
    padding: '16px 0', borderBottom: '1px solid var(--border)',
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '90%', maxWidth: 560,
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>{booking.title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>✕</button>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: 'rgba(0,229,255,0.1)', color: 'var(--accent)',
            border: '1px solid rgba(0,229,255,0.25)',
          }}>
            ✓ Confirmed
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '0 28px 8px', overflowY: 'auto', maxHeight: '62vh' }}>
          {/* Date & Time */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Date &amp; Time</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 5.5h12M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <div>
                <div>{booking.date}</div>
                <div style={{ fontWeight: 600 }}>{booking.time}</div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Location</div>
            <div style={detailRowStyle}>
              {isRemote ? (
                <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 12h6M7 10v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1C4.79 1 3 2.79 3 5C3 8.5 7 13 7 13C7 13 11 8.5 11 5C11 2.79 9.21 1 7 1ZM7 7C5.9 7 5 6.1 5 5C5 3.9 5.9 3 7 3C8.1 3 9 3.9 9 5C9 6.1 8.1 7 7 7Z" fill="currentColor"/>
                </svg>
              )}
              <div>
                {booking.location.match(/\d+\s+\w+\s+(St|Ave|Blvd|Rd|Dr|Ln|Way|Ct|Pl|Pkwy|Hwy|Street|Avenue|Boulevard|Road|Drive|Lane|Court|Place)/) ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(booking.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                  >
                    {booking.location}
                  </a>
                ) : (
                  <>
                    <div>{booking.location}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>(full address not provided)</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Client */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Deaf / Hard of Hearing Client</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <div style={{ fontWeight: 600 }}>{booking.client}</div>
            </div>
          </div>

          {/* Category / Job Context */}
          <div style={{ ...sectionStyle, borderBottom: 'none' }}>
            <div style={sectionLabelStyle}>Job Context</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>
              {booking.category} booking
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <GhostButton onClick={onClose}>Close</GhostButton>
        </div>
      </div>
    </div>
  )
}

/* ── Calendar Dropdown ── */

function CalendarDropdown({ booking, onToast }: {
  booking: typeof DEMO_CONFIRMED[0]
  onToast: (msg: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function addToGcal() {
    const { start, end } = parseDateTime(booking.date, booking.time)
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.title)}&dates=${toGoogleDateStr(start)}/${toGoogleDateStr(end)}&location=${encodeURIComponent(booking.location)}`
    window.open(url, '_blank')
    setOpen(false)
    onToast('Added to Google Calendar')
  }

  function addToIcal() {
    const { start, end } = parseDateTime(booking.date, booking.time)
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmtICS = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `DTSTART:${fmtICS(start)}`, `DTEND:${fmtICS(end)}`,
      `SUMMARY:${booking.title}`, `LOCATION:${booking.location}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${booking.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
    onToast('iCal file downloaded')
  }

  function addToOutlook() {
    const { start, end } = parseDateTime(booking.date, booking.time)
    const url = `https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent(booking.title)}&startdt=${encodeURIComponent(toISOLocal(start))}&enddt=${encodeURIComponent(toISOLocal(end))}&location=${encodeURIComponent(booking.location)}`
    window.open(url, '_blank')
    setOpen(false)
    onToast('Added to Outlook Calendar')
  }

  const optionStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left',
    background: 'none', border: 'none', padding: '9px 14px',
    color: 'var(--text)', fontSize: '0.82rem', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", borderRadius: 6,
    transition: 'background 0.12s',
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <GhostButton onClick={() => setOpen(!open)}>Add to Calendar</GhostButton>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: 6, minWidth: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        }}>
          <button onClick={addToGcal} style={optionStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            Google Calendar
          </button>
          <button onClick={addToIcal} style={optionStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            iCal (.ics)
          </button>
          <button onClick={addToOutlook} style={optionStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            Outlook
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Booking Card ── */

function BookingCard({ booking, onViewDetails, onToast }: {
  booking: typeof DEMO_CONFIRMED[0]
  onViewDetails: () => void
  onToast: (msg: string) => void
}) {
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif" }}>{booking.title}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>{booking.client} · {booking.category}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <DemoBadge />
          <StatusBadge status="confirmed" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
        <span>📅 {booking.date}</span>
        <span>🕐 {booking.time}</span>
        <span>📍 {booking.location}</span>
      </div>
      <div className="dash-card-actions" style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <GhostButton onClick={onViewDetails}>View Details</GhostButton>
        {booking.upcoming && <CalendarDropdown booking={booking} onToast={onToast} />}
      </div>
    </div>
  )
}

/* ── Main Page ── */

export default function ConfirmedPage() {
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = DEMO_CONFIRMED.filter(b =>
    !search || [b.title, b.client, b.category, b.location].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const upcoming = filtered.filter(b => b.upcoming)

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 900 }}>
      <BetaBanner />
      <PageHeader title="Confirmed Bookings" subtitle="All your accepted and confirmed jobs." />

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by client, location, type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '9px 14px',
            color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      {upcoming.length > 0 && (
        <>
          <SectionLabel>Upcoming — Next 14 Days</SectionLabel>
          {upcoming.map(b => (
            <BookingCard key={b.id} booking={b} onViewDetails={() => setViewing(b.id)} onToast={showToast} />
          ))}
        </>
      )}

      <SectionLabel>All Bookings</SectionLabel>
      {filtered.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          No bookings match your search.
        </div>
      )}
      {filtered.map(b => (
        <BookingCard key={b.id} booking={b} onViewDetails={() => setViewing(b.id)} onToast={showToast} />
      ))}

      {/* Detail Modal */}
      {viewing && (
        <DetailModal
          booking={DEMO_CONFIRMED.find(b => b.id === viewing)!}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 'var(--radius)', padding: '14px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.85rem', color: '#34d399',
        }}>
          {toast}
        </div>
      )}

      <DashMobileStyles />
    </div>
  )
}
