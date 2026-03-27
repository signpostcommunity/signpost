'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BetaBanner, SectionLabel, StatusBadge, DemoBadge, GhostButton, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import PendingRolesNudge from '@/components/shared/PendingRolesNudge'
import BookMeBadge from '@/components/interpreter/BookMeBadge'
import CalendarSyncCard from '@/components/dashboard/interpreter/CalendarSyncCard'

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

function formatTime(start: string | null, end: string | null): string {
  if (!start || !end) return 'TBD'
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

/* ── Calendar helpers ── */

function parseDateTimeFromBooking(dateStr: string, timeStart: string | null, timeEnd: string | null): { start: Date; end: Date } | null {
  if (!timeStart || !timeEnd) return null
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
    const parsed = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    if (!parsed) return
    const { start, end } = parsed
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGoogleDateStr(start)}/${toGoogleDateStr(end)}&location=${encodeURIComponent(location)}`, '_blank')
    setOpen(false); onToast('Added to Google Calendar')
  }
  function addToIcal() {
    const parsed = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    if (!parsed) return
    const { start, end } = parsed
    const p = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`SUMMARY:${title}`,`LOCATION:${location}`,'END:VEVENT','END:VCALENDAR'].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`; a.click(); URL.revokeObjectURL(url)
    setOpen(false); onToast('iCal file downloaded')
  }
  function addToOutlook() {
    const parsed = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    if (!parsed) return
    const { start, end } = parsed
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
      <GhostButton onClick={() => setOpen(!open)} aria-expanded={open}>Add to Calendar</GhostButton>
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
    <Link href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: 'var(--card-bg)',
          border: `1px solid ${hover ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '20px',
          transition: 'border-color 0.18s, transform 0.18s', cursor: 'pointer',
          transform: hover ? 'translateY(-2px)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
          flex: 1,
        }}
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.04em', color: 'var(--accent)' }}>{num}</div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 4 }}>{label}</div>
      </div>
    </Link>
  )
}

/* ── Book Me Badge Actions (buttons + collapsible guide, used inside combined card) ── */

function BookMeBadgeActions({ interpreterProfileId, displayName, onToast }: {
  interpreterProfileId: string; displayName: string; onToast: (m: string) => void
}) {
  const [guideOpen, setGuideOpen] = useState(false)

  const badgeUrl = `https://signpost.community/api/badge/${interpreterProfileId}`
  const profileUrl = `https://signpost.community/directory/${interpreterProfileId}`
  const embedHtml = `<a href="${profileUrl}"><img src="${badgeUrl}" alt="Book ${displayName} on signpost" width="500" style="border-radius:16px;border:0;"></a>`

  function copyBadgeEmbed() {
    navigator.clipboard.writeText(embedHtml)
    onToast('Badge copied! Paste it in your email signature.')
  }

  function copyImageLink() {
    navigator.clipboard.writeText(badgeUrl)
    onToast('Image link copied!')
  }

  const linkStyle: React.CSSProperties = {
    color: 'var(--accent)', textDecoration: 'none', fontWeight: 600,
  }

  return (
    <>
      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={copyBadgeEmbed}
          className="btn-primary"
          style={{ fontSize: '0.82rem', padding: '10px 20px' }}
        >
          Copy badge for email
        </button>
        <button
          onClick={copyImageLink}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '10px 20px',
            color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            transition: 'border-color 0.15s',
          }}
        >
          Copy badge image link
        </button>
      </div>

      {/* How to add — collapsible */}
      <button
        onClick={() => setGuideOpen(!guideOpen)}
        aria-expanded={guideOpen}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif", padding: '4px 0',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        How to add your badge
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: guideOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {guideOpen && (
        <div style={{
          marginTop: 12, padding: '16px', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.7,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Gmail</div>
            <a href="https://mail.google.com/mail/u/0/#settings/general" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Go to your signature settings
            </a>
            . Scroll down to &quot;Signature,&quot; click in the signature box, paste, and click &quot;Save changes&quot; at the bottom of the page.
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>LinkedIn</div>
            <a href="https://www.linkedin.com/in/me" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Go to your LinkedIn profile
            </a>
            . Add the badge image to your Featured section or About section.
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Other email providers</div>
            Look for &quot;Signature&quot; in your email settings, paste the badge, and save.
          </div>
        </div>
      )}
    </>
  )
}

/* ── Main Component ── */

interface OverviewClientProps {
  interpreterProfileId: string | null
  firstName: string | null
  lastName: string | null
  profileStatus: string | null
  vanitySlug: string | null
  calendarToken: string | null
  activeAwayPeriod?: { end_date: string; message: string } | null
}

export default function OverviewClient({ interpreterProfileId, firstName, lastName, profileStatus, vanitySlug, calendarToken, activeAwayPeriod }: OverviewClientProps) {
  const displayName = firstName || 'there'
  const hasDraftProfile = profileStatus === 'draft'
  const [toast, setToast] = useState<string | null>(null)
  const [currentCalendarToken, setCurrentCalendarToken] = useState(calendarToken)
  const [newInquiries, setNewInquiries] = useState(0)
  const [confirmedThisMonth, setConfirmedThisMonth] = useState(0)
  const [teamCount, setTeamCount] = useState(0)
  const [daysAvailable, setDaysAvailable] = useState(0)
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(true)
  const [videoRequestCount, setVideoRequestCount] = useState(0)
  const [hasIntroVideo, setHasIntroVideo] = useState(false)

  // Check localStorage for banner dismissal
  useEffect(() => {
    const dismissedAt = localStorage.getItem('signpost_profile_banner_dismissed')
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < sevenDays) {
        setBannerDismissed(true)
        return
      }
      localStorage.removeItem('signpost_profile_banner_dismissed')
    }
    setBannerDismissed(false)
  }, [])

  useEffect(() => {
    if (!interpreterProfileId) { setLoading(false); return }

    async function fetchData() {
      const supabase = createClient()

      // Check profile completeness (photo_url, bio, certifications)
      const { data: profileData } = await supabase
        .from('interpreter_profiles')
        .select('photo_url, bio')
        .eq('id', interpreterProfileId!)
        .single()

      const { count: certCount } = await supabase
        .from('interpreter_certifications')
        .select('id', { count: 'exact', head: true })
        .eq('interpreter_id', interpreterProfileId!)

      const missingPhoto = !profileData?.photo_url
      const missingBio = !profileData?.bio || profileData.bio.trim() === ''
      const missingCerts = !certCount || certCount === 0
      setProfileIncomplete(missingPhoto || missingBio || missingCerts)

      // Check if interpreter has any intro videos
      const { count: videoCount } = await supabase
        .from('interpreter_videos')
        .select('id', { count: 'exact', head: true })
        .eq('interpreter_id', interpreterProfileId!)
      setHasIntroVideo((videoCount ?? 0) > 0)

      // Check unfulfilled video request count
      if (!videoCount || videoCount === 0) {
        const { count: vrCount } = await supabase
          .from('video_requests')
          .select('id', { count: 'exact', head: true })
          .eq('interpreter_id', interpreterProfileId!)
          .is('fulfilled_at', null)
        setVideoRequestCount(vrCount ?? 0)
      }

      // Pending bookings count (via booking_recipients)
      const { count: pendingCount, error: pendingCountErr } = await supabase
        .from('booking_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('interpreter_id', interpreterProfileId!)
        .in('status', ['sent', 'viewed', 'responded'])

      if (pendingCountErr) {
        console.error('[overview] pending count failed:', pendingCountErr.message)
      } else {
        setNewInquiries(pendingCount ?? 0)
      }

      // Pending bookings data (for display, limit 2, via booking_recipients)
      // Two-step fetch to avoid RLS nested embed bug
      const { data: pendingRecipients, error: pendingErr } = await supabase
        .from('booking_recipients')
        .select('id, status, booking_id')
        .eq('interpreter_id', interpreterProfileId!)
        .in('status', ['sent', 'viewed', 'responded'])
        .order('sent_at', { ascending: true })
        .limit(2)

      if (!pendingErr && pendingRecipients) {
        const pendingBookingIds = pendingRecipients.map(r => r.booking_id).filter(Boolean)
        if (pendingBookingIds.length > 0) {
          const { data: pendingBookingsData, error: pendingBookingsErr } = await supabase
            .from('bookings')
            .select('id, title, requester_name, specialization, date, time_start, time_end, location, format, recurrence, notes, status, is_seed')
            .in('id', pendingBookingIds)
          if (pendingBookingsErr) {
            console.error('[overview] pending bookings fetch error:', pendingBookingsErr.message, pendingBookingsErr.details)
          }
          if (pendingBookingsData) {
            setPendingBookings(pendingBookingsData as Booking[])
          }
        }
      }

      // Confirmed this month count (via booking_recipients + bookings)
      const now = new Date()
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`

      // Two-step fetch to avoid RLS nested embed bug
      const { data: confirmedRecipients, error: confirmedErr } = await supabase
        .from('booking_recipients')
        .select('id, booking_id')
        .eq('interpreter_id', interpreterProfileId!)
        .eq('status', 'confirmed')

      if (!confirmedErr && confirmedRecipients) {
        const confBookingIds = confirmedRecipients.map(r => r.booking_id).filter(Boolean)
        let confBookingsData: { id: string; date: string }[] = []
        if (confBookingIds.length > 0) {
          const { data: bData, error: confBookingsErr } = await supabase
            .from('bookings')
            .select('id, date')
            .in('id', confBookingIds)
          if (confBookingsErr) {
            console.error('[overview] confirmed bookings fetch error:', confBookingsErr.message, confBookingsErr.details)
          }
          confBookingsData = (bData || []) as { id: string; date: string }[]
        }
        const thisMonthCount = confBookingsData.filter(b => b.date >= startOfMonth && b.date <= endOfMonth).length
        setConfirmedThisMonth(thisMonthCount)
      }

      // Upcoming confirmed bookings for display (reuse confirmedRecipients from above)
      const today = now.toISOString().slice(0, 10)
      if (!confirmedErr && confirmedRecipients) {
        const upcomingBookingIds = confirmedRecipients.map(r => r.booking_id).filter(Boolean)
        if (upcomingBookingIds.length > 0) {
          const { data: upcomingData, error: upcomingErr } = await supabase
            .from('bookings')
            .select('id, title, requester_name, specialization, date, time_start, time_end, location, format, recurrence, notes, status, is_seed')
            .in('id', upcomingBookingIds)
            .gte('date', today)
            .order('date', { ascending: true })
            .limit(2)
          if (upcomingErr) {
            console.error('[overview] upcoming bookings fetch error:', upcomingErr.message, upcomingErr.details)
          }
          if (upcomingData) {
            setConfirmedBookings(upcomingData as Booking[])
          }
        }
      }

      // Preferred team count — table may not exist
      const { count: teamC, error: teamErr } = await supabase
        .from('interpreter_preferred_team')
        .select('id', { count: 'exact', head: true })
        .eq('interpreter_id', interpreterProfileId!)

      if (!teamErr) setTeamCount(teamC ?? 0)

      // Days available this week — count distinct days from interpreter_availability
      const { data: availRows, error: availErr } = await supabase
        .from('interpreter_availability')
        .select('day_of_week')
        .eq('interpreter_id', interpreterProfileId!)

      if (!availErr && availRows) {
        const uniqueDays = new Set(availRows.map(r => r.day_of_week))
        setDaysAvailable(uniqueDays.size)
      }

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
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      {hasSeedData && <BetaBanner />}

      {activeAwayPeriod && (
        <div style={{
          background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 'var(--radius-sm)', padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexWrap: 'wrap',
        }}>
          <div>
            <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
              You&apos;re currently marked as away until {new Date(activeAwayPeriod.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
            </span>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontStyle: 'italic', marginLeft: 8 }}>
              &ldquo;{activeAwayPeriod.message}&rdquo;
            </span>
          </div>
          <a
            href="/interpreter/dashboard/availability"
            style={{
              color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif", textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Manage in Availability
          </a>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '27px', color: '#f0f2f8', margin: '0 0 6px' }}>
          Welcome back, {displayName}.
        </h1>
        <p style={{ fontWeight: 400, fontSize: '15px', color: '#96a0b8', margin: 0 }}>Here&apos;s a snapshot of your activity on signpost.</p>
      </div>

      <PendingRolesNudge accentColor="var(--accent)" />

      {/* Draft resume banner */}
      {hasDraftProfile && (
        <div style={{
          background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
          borderRadius: 'var(--radius-sm)', padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
            You have an unfinished profile. Pick up where you left off.
          </span>
          <a
            href="/interpreter/signup?resume=true"
            style={{
              color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Resume signup →
          </a>
        </div>
      )}

      {/* Incomplete profile banner */}
      {profileIncomplete && !bannerDismissed && !hasDraftProfile && !loading && (
        <div style={{
          background: 'rgba(0, 229, 255, 0.06)', border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <span style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Your profile isn&apos;t complete yet. A complete profile helps clients find and trust you.
            </span>
            <a
              href="/interpreter/dashboard/profile"
              style={{
                color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              Complete your profile &rarr;
            </a>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('signpost_profile_banner_dismissed', String(Date.now()))
              setBannerDismissed(true)
            }}
            aria-label="Dismiss banner"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', padding: 4, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Video request demand banner */}
      {!hasIntroVideo && videoRequestCount > 0 && !loading && (
        <div style={{
          background: 'rgba(0, 229, 255, 0.04)', border: '1px solid rgba(0, 229, 255, 0.15)',
          borderRadius: 'var(--radius-sm)', padding: '12px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 16,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#c8cdd8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="7" r="4" stroke="#c8cdd8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#c8cdd8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#c8cdd8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ color: '#c8cdd8', fontSize: '0.88rem', lineHeight: 1.5 }}>
            {videoRequestCount} {videoRequestCount === 1 ? 'person has' : 'people have'} requested your intro video.{' '}
            <a href="/interpreter/dashboard/profile" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Record yours &rarr;
            </a>
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32, alignItems: 'stretch' }}>
        <StatCard num={newInquiries} label="New Inquiries" href="/interpreter/dashboard/inquiries" />
        <StatCard num={confirmedThisMonth} label="Confirmed This Month" href="/interpreter/dashboard/confirmed" />
        <StatCard num={teamCount} label="Interpreters in Your Preferred Team" href="/interpreter/dashboard/team" />
        <StatCard num={daysAvailable} label="Days Available This Week" href="/interpreter/dashboard/availability" />
      </div>

      {/* Book Me Badges — single combined section */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{
          fontWeight: 600, fontSize: '13px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#00e5ff', marginBottom: 8,
        }}>
          Book Me Badges
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.55 }}>
          Add this badge to your email signature, website, or LinkedIn to make it easy to book you directly. When someone clicks the badge, it takes them straight to your signpost profile where they can send a booking request directly to you.
        </p>

        {/* Badge preview */}
        {interpreterProfileId && !hasDraftProfile && (
          <div style={{ marginBottom: 20 }}>
            <BookMeBadge
              interpreterProfileId={interpreterProfileId}
              displayName={[firstName, lastName].filter(Boolean).join(' ') || 'Interpreter'}
            />
          </div>
        )}

        {/* Your link */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your link</div>
          {vanitySlug ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent)',
                fontFamily: "'DM Sans', sans-serif", wordBreak: 'break-all',
              }}>
                signpost.community/book/{vanitySlug}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://signpost.community/book/${vanitySlug}`)
                  showToast('Copied to clipboard!')
                }}
                style={{
                  background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
                  color: 'var(--accent)', borderRadius: 8, padding: '6px 14px',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Copy link
              </button>
            </div>
          ) : (
            <Link
              href="/interpreter/dashboard/profile"
              style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}
            >
              Set up your Book Me link →
            </Link>
          )}
        </div>

        {/* Action buttons */}
        {interpreterProfileId && !hasDraftProfile && (
          <BookMeBadgeActions
            interpreterProfileId={interpreterProfileId}
            displayName={[firstName, lastName].filter(Boolean).join(' ') || 'Interpreter'}
            onToast={showToast}
          />
        )}
      </div>

      {/* Calendar Sync */}
      {!hasDraftProfile && currentCalendarToken && (
        <CalendarSyncCard
          calendarToken={currentCalendarToken}
          onTokenChange={setCurrentCalendarToken}
          onToast={showToast}
        />
      )}

      {!hasDraftProfile && !loading && (
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
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif" }}>{inq.title || 'Booking Request'}</div>
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
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif" }}>{booking.title || 'Confirmed Booking'}</div>
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
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
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
