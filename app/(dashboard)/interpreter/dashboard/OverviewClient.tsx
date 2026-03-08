'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { DEMO_INQUIRIES, DEMO_CONFIRMED } from '@/lib/data/demo'
import { BetaBanner, PageHeader, SectionLabel, StatusBadge, DemoBadge, GhostButton } from '@/components/dashboard/interpreter/shared'

/* ── Calendar helpers ── */

function parseDateTime(dateStr: string, timeStr: string): { start: Date; end: Date } {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
  const rangeMatch = dateStr.match(/^(\w+)\s+(\d+)[–\-](\d+),?\s+(\d+)$/)
  if (rangeMatch) {
    const [, mon, d1, d2, yr] = rangeMatch
    return { start: new Date(+yr, months[mon] ?? 0, +d1, 9, 0), end: new Date(+yr, months[mon] ?? 0, +d2, 17, 0) }
  }
  const dateMatch = dateStr.match(/^(\w+)\s+(\d+),?\s+(\d+)$/)
  let year = 2026, month = 2, day = 15
  if (dateMatch) { month = months[dateMatch[1]] ?? 2; day = +dateMatch[2]; year = +dateMatch[3] }
  let startH = 9, startM = 0, endH = 17, endM = 0
  if (timeStr !== 'Full days') {
    const times = timeStr.split(/\s*[–\-]\s*/)
    const parseT = (t: string) => { const m = t.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i); if (!m) return { h: 9, m: 0 }; let h = +m[1]; const min = +m[2]; if (m[3].toUpperCase() === 'PM' && h < 12) h += 12; if (m[3].toUpperCase() === 'AM' && h === 12) h = 0; return { h, m: min } }
    if (times[0]) { const t = parseT(times[0]); startH = t.h; startM = t.m }
    if (times[1]) { const t = parseT(times[1]); endH = t.h; endM = t.m }
  }
  return { start: new Date(year, month, day, startH, startM), end: new Date(year, month, day, endH, endM) }
}

function toGoogleDateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`
}

function toISOLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`
}

/* ── Calendar Dropdown ── */

function CalendarDropdown({ title, date, time, location, onToast }: {
  title: string; date: string; time: string; location: string; onToast: (m: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function addToGcal() {
    const { start, end } = parseDateTime(date, time)
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGoogleDateStr(start)}/${toGoogleDateStr(end)}&location=${encodeURIComponent(location)}`, '_blank')
    setOpen(false); onToast('Added to Google Calendar')
  }
  function addToIcal() {
    const { start, end } = parseDateTime(date, time)
    const p = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`SUMMARY:${title}`,`LOCATION:${location}`,'END:VEVENT','END:VCALENDAR'].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`; a.click(); URL.revokeObjectURL(url)
    setOpen(false); onToast('iCal file downloaded')
  }
  function addToOutlook() {
    const { start, end } = parseDateTime(date, time)
    window.open(`https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent(title)}&startdt=${encodeURIComponent(toISOLocal(start))}&enddt=${encodeURIComponent(toISOLocal(end))}&location=${encodeURIComponent(location)}`, '_blank')
    setOpen(false); onToast('Added to Outlook Calendar')
  }

  const optStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
    padding: '9px 14px', color: 'var(--text)', fontSize: '0.82rem', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", borderRadius: 6, transition: 'background 0.12s',
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
          <button onClick={addToGcal} style={optStyle} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }} onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>Google Calendar</button>
          <button onClick={addToIcal} style={optStyle} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }} onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>iCal (.ics)</button>
          <button onClick={addToOutlook} style={optStyle} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }} onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>Outlook</button>
        </div>
      )}
    </div>
  )
}

/* ── Stat Card ── */

function StatCard({ num, label, href }: { num: number; label: string; href: string }) {
  const [hover, setHover] = useState(false)
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: 'var(--card-bg)',
          border: `1px solid ${hover ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '20px',
          transition: 'border-color 0.18s, transform 0.18s', cursor: 'pointer',
          transform: hover ? 'translateY(-2px)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}
      >
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.04em', color: 'var(--accent)' }}>{num}</div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 4 }}>{label}</div>
      </div>
    </Link>
  )
}

/* ── Main Component ── */

interface OverviewClientProps {
  firstName: string | null
  lastName: string | null
  profileStatus: string | null
  showSampleData: boolean
}

export default function OverviewClient({ firstName, lastName, profileStatus, showSampleData }: OverviewClientProps) {
  const displayName = firstName || 'there'
  const hasPendingProfile = profileStatus === 'pending'
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 900 }}>
      {showSampleData && <BetaBanner />}

      <PageHeader
        title={`Welcome back, ${displayName}.`}
        subtitle={
          hasPendingProfile
            ? 'Your profile is pending review. You\'ll be notified once it\'s approved.'
            : 'Here\'s a snapshot of your activity on signpost.'
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32, alignItems: 'stretch' }}>
        <StatCard num={showSampleData ? 2 : 0} label="New Inquiries" href="/interpreter/dashboard/inquiries" />
        <StatCard num={showSampleData ? 3 : 0} label="Confirmed This Month" href="/interpreter/dashboard/confirmed" />
        <StatCard num={showSampleData ? 4 : 0} label="Interpreters in Your Preferred Team" href="/interpreter/dashboard/team" />
        <StatCard num={showSampleData ? 4 : 0} label="Days Available This Week" href="/interpreter/dashboard/availability" />
      </div>

      {showSampleData ? (
        <>
          {/* Pending Inquiries */}
          <SectionLabel>Pending Inquiries</SectionLabel>
          {DEMO_INQUIRIES.map(inq => (
            <div key={inq.id} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif" }}>{inq.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>
                    From: {inq.from} · {inq.category} · {inq.receivedDate}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <DemoBadge />
                  <StatusBadge status="pending" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                <span>📅 {inq.date}</span>
                <span>🕐 {inq.time}</span>
                <span>📍 {inq.location}</span>
                <span>{inq.mode}</span>
              </div>
              <div className="dash-card-actions" style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <Link href="/interpreter/dashboard/inquiries">
                  <button className="btn-primary" style={{ fontSize: '0.82rem', padding: '8px 18px' }}>
                    Accept &amp; Send Rate
                  </button>
                </Link>
                <Link href="/interpreter/dashboard/inquiries" style={{ textDecoration: 'none' }}>
                  <GhostButton>View Details</GhostButton>
                </Link>
                <Link href="/interpreter/dashboard/inquiries" style={{ textDecoration: 'none' }}>
                  <GhostButton danger>Decline</GhostButton>
                </Link>
              </div>
            </div>
          ))}

          {/* Upcoming Confirmed */}
          <SectionLabel>Upcoming Confirmed</SectionLabel>
          {DEMO_CONFIRMED.filter(b => b.upcoming).map(booking => (
            <div key={booking.id} style={{
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
              <div style={{ marginTop: 12 }}>
                <CalendarDropdown title={booking.title} date={booking.date} time={booking.time} location={booking.location} onToast={showToast} />
              </div>
            </div>
          ))}
        </>
      ) : !hasPendingProfile ? (
        <>
          <SectionLabel>Pending Inquiries</SectionLabel>
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '32px 24px',
            color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
          }}>
            No pending inquiries yet. They&apos;ll appear here when clients reach out.
          </div>

          <SectionLabel>Upcoming Confirmed</SectionLabel>
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '32px 24px',
            color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
          }}>
            No confirmed bookings yet.
          </div>
        </>
      ) : null}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 'var(--radius)', padding: '14px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.85rem', color: '#34d399',
        }}>{toast}</div>
      )}
    </div>
  )
}
