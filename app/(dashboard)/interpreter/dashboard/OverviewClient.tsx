'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BetaBanner, PageHeader, SectionLabel, StatusBadge, DemoBadge, GhostButton, DashMobileStyles } from '@/components/dashboard/interpreter/shared'

/* ── Types ── */

interface Booking {
  id: string
  title: string | null
  requester_name: string | null
  specialization: string | null
  date: string
  time_start: string
  time_end: string
  location: string | null
  format: string | null
  recurrence: string | null
  notes: string | null
  status: string
  is_seed: boolean | null
}

/* ── Date formatting helpers ── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(start: string, end: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

/* ── Calendar helpers ── */

function parseDateTimeFromBooking(dateStr: string, timeStart: string, timeEnd: string): { start: Date; end: Date } {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [sh, sm] = timeStart.split(':').map(Number)
  const [eh, em] = timeEnd.split(':').map(Number)
  return { start: new Date(y, mo - 1, d, sh, sm), end: new Date(y, mo - 1, d, eh, em) }
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

function CalendarDropdown({ booking, onToast }: {
  booking: Booking; onToast: (m: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const title = booking.title || 'Booking'
  const location = booking.location || ''

  function addToGcal() {
    const { start, end } = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGoogleDateStr(start)}/${toGoogleDateStr(end)}&location=${encodeURIComponent(location)}`, '_blank')
    setOpen(false); onToast('Added to Google Calendar')
  }
  function addToIcal() {
    const { start, end } = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    const p = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`SUMMARY:${title}`,`LOCATION:${location}`,'END:VEVENT','END:VCALENDAR'].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`; a.click(); URL.revokeObjectURL(url)
    setOpen(false); onToast('iCal file downloaded')
  }
  function addToOutlook() {
    const { start, end } = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
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
  interpreterProfileId: string | null
  firstName: string | null
  lastName: string | null
  profileStatus: string | null
}

export default function OverviewClient({ interpreterProfileId, firstName, profileStatus }: OverviewClientProps) {
  const displayName = firstName || 'there'
  const hasPendingProfile = profileStatus === 'pending'
  const [toast, setToast] = useState<string | null>(null)
  const [newInquiries, setNewInquiries] = useState(0)
  const [confirmedThisMonth, setConfirmedThisMonth] = useState(0)
  const [teamCount, setTeamCount] = useState(0)
  const [daysAvailable, setDaysAvailable] = useState(0)
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!interpreterProfileId) { setLoading(false); return }

    async function fetchData() {
      const supabase = createClient()

      // Pending bookings count + data
      const { data: pending, error: pendingErr } = await supabase
        .from('bookings')
        .select('id, title, requester_name, specialization, date, time_start, time_end, location, format, recurrence, notes, status, is_seed')
        .eq('interpreter_id', interpreterProfileId!)
        .eq('status', 'pending')
        .order('date', { ascending: true })
        .limit(2)

      if (!pendingErr && pending) {
        setPendingBookings(pending)
        setNewInquiries(pending.length)
      }

      // Confirmed this month count
      const now = new Date()
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`

      const { count: confirmedCount, error: confirmedErr } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('interpreter_id', interpreterProfileId!)
        .eq('status', 'confirmed')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)

      if (!confirmedErr) setConfirmedThisMonth(confirmedCount ?? 0)

      // Upcoming confirmed bookings for display
      const today = now.toISOString().slice(0, 10)
      const { data: confirmed, error: confDataErr } = await supabase
        .from('bookings')
        .select('id, title, requester_name, specialization, date, time_start, time_end, location, format, recurrence, notes, status, is_seed')
        .eq('interpreter_id', interpreterProfileId!)
        .eq('status', 'confirmed')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(2)

      if (!confDataErr && confirmed) setConfirmedBookings(confirmed)

      // Preferred team count — table may not exist
      const { count: teamC, error: teamErr } = await supabase
        .from('interpreter_preferred_team')
        .select('id', { count: 'exact', head: true })
        .eq('interpreter_id', interpreterProfileId!)

      if (!teamErr) setTeamCount(teamC ?? 0)

      // Unread messages count for "New Inquiries" — add to pending count
      // TODO: wire to real availability table
      setDaysAvailable(0)

      setLoading(false)
    }
    fetchData()
  }, [interpreterProfileId])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const hasSeedData = pendingBookings.some(b => b.is_seed) || confirmedBookings.some(b => b.is_seed)

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 900 }}>
      {hasSeedData && <BetaBanner />}

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
        <StatCard num={newInquiries} label="New Inquiries" href="/interpreter/dashboard/inquiries" />
        <StatCard num={confirmedThisMonth} label="Confirmed This Month" href="/interpreter/dashboard/confirmed" />
        <StatCard num={teamCount} label="Interpreters in Your Preferred Team" href="/interpreter/dashboard/team" />
        <StatCard num={daysAvailable} label="Days Available This Week" href="/interpreter/dashboard/availability" />
      </div>

      {!hasPendingProfile && !loading && (
        <>
          {/* Pending Inquiries */}
          <SectionLabel>Pending Inquiries</SectionLabel>
          {pendingBookings.length === 0 ? (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '32px 24px',
              color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
            }}>
              No pending inquiries yet. They&apos;ll appear here when clients reach out.
            </div>
          ) : (
            pendingBookings.map(inq => (
              <div key={inq.id} style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif" }}>{inq.title || 'Booking Request'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>
                      From: {inq.requester_name || 'Unknown'} · {inq.specialization || 'General'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {inq.is_seed && <DemoBadge />}
                    <StatusBadge status="pending" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                  <span>📅 {formatDate(inq.date)}</span>
                  <span>🕐 {formatTime(inq.time_start, inq.time_end)}</span>
                  <span>📍 {inq.location || 'TBD'}</span>
                  <span>{inq.format === 'remote' ? 'Remote' : 'On-site'}</span>
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
            ))
          )}

          {/* Upcoming Confirmed */}
          <SectionLabel>Upcoming Confirmed</SectionLabel>
          {confirmedBookings.length === 0 ? (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '32px 24px',
              color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
            }}>
              No confirmed bookings yet.
            </div>
          ) : (
            confirmedBookings.map(booking => (
              <div key={booking.id} style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif" }}>{booking.title || 'Confirmed Booking'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>{booking.requester_name || 'Client'} · {booking.specialization || 'General'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {booking.is_seed && <DemoBadge />}
                    <StatusBadge status="confirmed" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                  <span>📅 {formatDate(booking.date)}</span>
                  <span>🕐 {formatTime(booking.time_start, booking.time_end)}</span>
                  <span>📍 {booking.location || 'TBD'}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <CalendarDropdown booking={booking} onToast={showToast} />
                </div>
              </div>
            ))
          )}
        </>
      )}

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

      <DashMobileStyles />
    </div>
  )
}
