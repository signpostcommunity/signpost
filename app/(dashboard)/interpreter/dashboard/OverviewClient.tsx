'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SectionLabel, StatusBadge, DemoBadge, GhostButton, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import PendingRolesNudge from '@/components/shared/PendingRolesNudge'
import BookMeBadge from '@/components/interpreter/BookMeBadge'
import { decryptBatchClient } from '@/lib/decrypt-client'
import SendMessageModal from '@/components/messaging/SendMessageModal'
import { getMentorshipLabel } from '@/lib/mentorship-categories'

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

interface TeamMember {
  id: string
  first_name: string | null
  last_name: string | null
  tier: string | null
  photo_url: string | null
  avatar_color: string | null
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
    fontFamily: "'Inter', sans-serif", borderRadius: 6, transition: 'background 0.12s',
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
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.04em', color: 'var(--accent)' }}>{num}</div>
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
  vanitySlug: string | null
  calendarToken: string | null
  activeAwayPeriod?: { end_date: string; message: string } | null
}

export default function OverviewClient({ interpreterProfileId, firstName, lastName, profileStatus, vanitySlug, calendarToken, activeAwayPeriod }: OverviewClientProps) {
  const displayName = firstName || 'there'
  const hasDraftProfile = profileStatus === 'draft'
  const [toast, setToast] = useState<string | null>(null)
  const [newInquiries, setNewInquiries] = useState(0)
  const [confirmedThisMonth, setConfirmedThisMonth] = useState(0)
  const [teamCount, setTeamCount] = useState(0)
  const [daysAvailable, setDaysAvailable] = useState(0)
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [bannerDismissed, setBannerDismissed] = useState(true)
  const [videoRequestCount, setVideoRequestCount] = useState(0)
  const [hasIntroVideo, setHasIntroVideo] = useState(false)
  const [calSyncDismissed, setCalSyncDismissed] = useState(true)
  const [badgeNudgeDismissed, setBadgeNudgeDismissed] = useState(true)
  const [viewing, setViewing] = useState<string | null>(null)

  // Check localStorage for banner dismissals
  useEffect(() => {
    const dismissedAt = localStorage.getItem('signpost_profile_banner_dismissed')
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < sevenDays) {
        setBannerDismissed(true)
      } else {
        localStorage.removeItem('signpost_profile_banner_dismissed')
        setBannerDismissed(false)
      }
    } else {
      setBannerDismissed(false)
    }
    setCalSyncDismissed(!!localStorage.getItem('signpost_calendar_sync_dismissed'))
    setBadgeNudgeDismissed(!!localStorage.getItem('signpost_bookme_badge_dismissed'))
  }, [])

  useEffect(() => {
    if (!interpreterProfileId) { setLoading(false); return }

    async function fetchData() {
      const supabase = createClient()

      // Check profile completeness (required fields per signup spec)
      const { data: profileData } = await supabase
        .from('interpreter_profiles')
        .select('photo_url, bio, first_name, last_name, city, state, interpreter_type, work_mode, years_experience, sign_languages, spoken_languages')
        .eq('id', interpreterProfileId!)
        .single()

      const [{ count: certCount }, { count: signLangCount }, { count: spokenLangCount }, { count: specCount }] = await Promise.all([
        supabase.from('interpreter_certifications').select('id', { count: 'exact' }).limit(1).eq('interpreter_id', interpreterProfileId!),
        supabase.from('interpreter_sign_languages').select('id', { count: 'exact' }).limit(1).eq('interpreter_id', interpreterProfileId!),
        supabase.from('interpreter_spoken_languages').select('id', { count: 'exact' }).limit(1).eq('interpreter_id', interpreterProfileId!),
        supabase.from('interpreter_specializations').select('id', { count: 'exact' }).limit(1).eq('interpreter_id', interpreterProfileId!),
      ])

      const missingPhoto = !profileData?.photo_url
      const missingBio = !profileData?.bio || profileData.bio.trim() === ''
      const missingCerts = !certCount || certCount === 0
      const missingSignLangs = !signLangCount || signLangCount === 0
      const missingSpokenLangs = !spokenLangCount || spokenLangCount === 0
      const missingSpecs = !specCount || specCount === 0

      const required: { ok: boolean; label: string }[] = [
        { ok: !!profileData?.first_name?.trim(), label: 'Add your first name' },
        { ok: !!profileData?.last_name?.trim(), label: 'Add your last name' },
        { ok: !missingPhoto, label: 'Add a profile photo' },
        { ok: !!profileData?.city?.trim(), label: 'Add your city' },
        { ok: !!profileData?.state?.trim(), label: 'Add your state or region' },
        { ok: !!profileData?.interpreter_type, label: 'Select your interpreter type' },
        { ok: !missingSignLangs || (Array.isArray(profileData?.sign_languages) && profileData.sign_languages.length > 0), label: 'Add at least one sign language' },
        { ok: !missingSpokenLangs || (Array.isArray(profileData?.spoken_languages) && profileData.spoken_languages.length > 0), label: 'Add at least one spoken language' },
        { ok: !!profileData?.work_mode, label: 'Select your work mode' },
        { ok: !!profileData?.years_experience, label: 'Add your years of experience' },
      ]
      const missingList = required.filter(r => !r.ok).map(r => r.label)
      setMissingFields(missingList)
      setProfileIncomplete(missingList.length > 0 || missingBio || missingCerts || missingSpecs)

      // Check if interpreter has any intro videos
      const { count: videoCount } = await supabase
        .from('interpreter_videos')
        .select('id', { count: 'exact' }).limit(1)
        .eq('interpreter_id', interpreterProfileId!)
      setHasIntroVideo((videoCount ?? 0) > 0)

      // Check unfulfilled video request count
      if (!videoCount || videoCount === 0) {
        const { count: vrCount } = await supabase
          .from('video_requests')
          .select('id', { count: 'exact' }).limit(1)
          .eq('interpreter_id', interpreterProfileId!)
          .is('fulfilled_at', null)
        setVideoRequestCount(vrCount ?? 0)
      }

      // Pending bookings count (via booking_recipients)
      const { count: pendingCount, error: pendingCountErr } = await supabase
        .from('booking_recipients')
        .select('id', { count: 'exact' }).limit(1)
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
            const decrypted = await decryptBatchClient(upcomingData as Booking[], ['title', 'notes'])
            setConfirmedBookings(decrypted)
          }
        }
      }

      // Preferred team count - table may not exist
      const { count: teamC, error: teamErr } = await supabase
        .from('interpreter_preferred_team')
        .select('id', { count: 'exact' }).limit(1)
        .eq('interpreter_id', interpreterProfileId!)

      if (!teamErr) setTeamCount(teamC ?? 0)

      // Days available this week - count distinct days from interpreter_availability
      const { data: availRows, error: availErr } = await supabase
        .from('interpreter_availability')
        .select('day_of_week')
        .eq('interpreter_id', interpreterProfileId!)

      if (!availErr && availRows) {
        const uniqueDays = new Set(availRows.map(r => r.day_of_week))
        setDaysAvailable(uniqueDays.size)
      }

      // Preferred team members (compact list for right column, max 5)
      const { data: teamData, error: teamDataErr } = await supabase
        .from('interpreter_preferred_team')
        .select('id, first_name, last_name, tier, interpreter_profiles:member_interpreter_id(photo_url, avatar_color)')
        .eq('interpreter_id', interpreterProfileId!)
        .order('id', { ascending: false })
        .limit(5)

      if (!teamDataErr && teamData) {
        // Normalize nested join (Supabase returns array for FK joins)
        const normalized: TeamMember[] = teamData.map((m: Record<string, unknown>) => {
          const profile = Array.isArray(m.interpreter_profiles) ? m.interpreter_profiles[0] : m.interpreter_profiles
          return {
            id: m.id as string,
            first_name: m.first_name as string | null,
            last_name: m.last_name as string | null,
            tier: m.tier as string | null,
            photo_url: (profile as Record<string, unknown> | null)?.photo_url as string | null ?? null,
            avatar_color: (profile as Record<string, unknown> | null)?.avatar_color as string | null ?? null,
          }
        })
        setTeamMembers(normalized)
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
              fontFamily: "'Inter', sans-serif", textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Manage in Availability
          </a>
        </div>
      )}

      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: '27px', color: '#f0f2f8', margin: '0 0 6px' }}>
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

      {/* Stats */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 28, alignItems: 'stretch' }}>
        <StatCard num={newInquiries} label="New Inquiries" href="/interpreter/dashboard/inquiries" />
        <StatCard num={confirmedThisMonth} label="Confirmed This Month" href="/interpreter/dashboard/confirmed" />
        <StatCard num={teamCount} label="Interpreters in Your Preferred Team" href="/interpreter/dashboard/team" />
        <StatCard num={daysAvailable} label="Days Available This Week" href="/interpreter/dashboard/availability" />
      </div>

      {/* ── Unified banners - above two-column grid ── */}
      {!hasDraftProfile && !loading && (
        <div style={{ marginBottom: 28 }}>
          {/* Profile completeness card */}
          {missingFields.length > 0 && !bannerDismissed && (
            <div style={{
              background: '#111118', border: '1px solid #1e2433', borderLeft: '3px solid #f0a623',
              borderRadius: 10, padding: '20px 24px', marginBottom: 12,
            }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px',
                letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f0a623',
                marginBottom: 10,
              }}>
                Complete Your Profile
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '14px', color: '#c8cdd8', lineHeight: 1.55, marginBottom: 14 }}>
                Your profile is missing a few things that help Deaf community members and requesters find and connect with you:
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {missingFields.map(item => (
                  <li key={item} style={{ display: 'flex', gap: 10, fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#c8cdd8' }}>
                    <span style={{ color: '#f0a623' }}>&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/interpreter/dashboard/profile"
                style={{
                  display: 'inline-block',
                  fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px',
                  color: '#0a0a0f', background: '#f0a623',
                  padding: '8px 16px', borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Go to Profile Editor
              </Link>
            </div>
          )}

          {/* Book Me badge banner with mini preview */}
          {interpreterProfileId && !hasDraftProfile && (
            <div style={{
              background: '#111118', border: '1px solid #1e2433', borderLeft: '4px solid #00e5ff',
              borderRadius: 10, padding: '16px 20px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              {/* Mini badge preview */}
              <div style={{
                width: 270, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
              }}>
                <div style={{ transform: 'scale(0.50)', transformOrigin: 'top left', width: 540, height: 240 }}>
                  <BookMeBadge interpreterProfileId={interpreterProfileId} displayName={displayName} />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '14px', color: '#f0f2f8' }}>
                  Your &ldquo;Book Me&rdquo; badge and custom URL are live.
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '13px', color: '#96a0b8', marginTop: 2 }}>
                  Share your badge in your email signature, on your LinkedIn page, or anywhere your clients find you. Your custom link leads directly to a booking page specific to you.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                <Link
                  href="/interpreter/dashboard/profile"
                  style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px',
                    color: '#00e5ff', textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  View and customize &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Calendar Sync banner */}
          {!calendarToken && !calSyncDismissed && (
            <div style={{
              background: '#111118', border: '1px solid #1e2433', borderLeft: '4px solid #96a0b8',
              borderRadius: 10, padding: '16px 20px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#96a0b8" strokeWidth="1.5"/>
                <path d="M3 10h18M8 2v4M16 2v4" stroke="#96a0b8" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '14px', color: '#f0f2f8' }}>
                  Calendar Sync
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '13px', color: '#96a0b8', marginTop: 2 }}>
                  Subscribe so confirmed bookings appear in your calendar automatically.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 'auto' }}>
                <Link
                  href="/interpreter/dashboard/availability"
                  style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px',
                    color: '#96a0b8', textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  Set Up &rarr;
                </Link>
                <button
                  onClick={() => {
                    localStorage.setItem('signpost_calendar_sync_dismissed', '1')
                    setCalSyncDismissed(true)
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#96a0b8', fontSize: '13px', fontFamily: "'Inter', sans-serif",
                    fontWeight: 500, padding: '2px 4px', flexShrink: 0,
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Video request demand banner */}
          {!hasIntroVideo && videoRequestCount > 0 && (
            <div style={{
              background: '#111118', border: '1px solid #1e2433', borderLeft: '4px solid #00e5ff',
              borderRadius: 10, padding: '16px 20px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '14px', color: '#f0f2f8' }}>
                  {videoRequestCount} {videoRequestCount === 1 ? 'person has' : 'people have'} requested your intro video
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '13px', color: '#96a0b8', marginTop: 2 }}>
                  An intro video helps clients feel confident booking you.
                </div>
              </div>
              <Link
                href="/interpreter/dashboard/profile"
                style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px',
                  color: '#00e5ff', textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: 'auto', flexShrink: 0,
                }}
              >
                Record yours &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Two-column grid: Left = actionable, Right = context */}
      {!hasDraftProfile && !loading && (
        <div className="dashboard-grid" style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: '32px',
          alignItems: 'flex-start',
        }}>
          {/* Left column - actionable */}
          <div>
            {/* Pending Inquiries */}
            <SectionLabel>Pending Inquiries</SectionLabel>
            {pendingBookings.length === 0 ? (
              <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '32px 24px',
                color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
              }}>
                No pending inquiries. They&apos;ll appear here when clients reach out.
              </div>
            ) : (
              pendingBookings.map(inq => (
                <div key={inq.id} style={{
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Inter', sans-serif" }}>{inq.title || 'Booking Request'}</div>
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
                    <GhostButton onClick={() => setViewing(inq.id)}>View Details</GhostButton>
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
                No upcoming confirmed bookings.
              </div>
            ) : (
              confirmedBookings.map(booking => (
                <div key={booking.id} style={{
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Inter', sans-serif" }}>{booking.title || 'Confirmed Booking'}</div>
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
          </div>

          {/* Right column - context */}
          <div>
            <SectionLabel>Preferred Team</SectionLabel>
            {teamMembers.length === 0 ? (
              <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '24px 20px',
                color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center', lineHeight: 1.6,
              }}>
                Build your preferred team.{' '}
                <Link href="/directory" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                  Browse the directory &rarr;
                </Link>
              </div>
            ) : (
              <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '16px 20px',
              }}>
                {teamMembers.map((member, i) => {
                  const name = [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Team Member'
                  const initials = (member.first_name?.[0] || '') + (member.last_name?.[0] || '')
                  const tierLabel = member.tier === 'preferred' ? 'Top Choice' : 'Secondary'
                  return (
                    <div key={member.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 0',
                      borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    }}>
                      <Link href={`/directory/${member.id}`} style={{ flexShrink: 0, cursor: 'pointer' }}>
                        {member.photo_url ? (
                          <img
                            src={member.photo_url} alt=""
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: member.avatar_color || 'linear-gradient(135deg, #00e5ff, #9d87ff)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: "'Inter', sans-serif", fontWeight: 700,
                            fontSize: '0.72rem', color: '#fff',
                          }}>
                            {initials.toUpperCase()}
                          </div>
                        )}
                      </Link>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Link href={`/directory/${member.id}`} className="interp-name-link" style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)', fontFamily: "'Inter', sans-serif", textDecoration: 'none', display: 'block' }}>
                          {name}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {tierLabel}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {teamCount > 5 && (
                  <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <Link
                      href="/interpreter/dashboard/team"
                      style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                    >
                      View all ({teamCount}) &rarr;
                    </Link>
                  </div>
                )}
                {teamCount > 0 && teamCount <= 5 && (
                  <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <Link
                      href="/interpreter/dashboard/team"
                      style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}
                    >
                      View all &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Suggested Mentors ── */}
      <SuggestedMentors interpreterProfileId={interpreterProfileId} />

      {/* ── View Details Modal ── */}
      {viewing && (() => {
        const bk = pendingBookings.find(b => b.id === viewing)
        if (!bk) return null
        const isRemote = bk.format === 'remote'
        const sectionLabelSt: React.CSSProperties = { fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 14 }
        const detailRowSt: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 6 }
        const iconSt: React.CSSProperties = { color: 'var(--muted)', flexShrink: 0, marginTop: 2 }
        const sectionSt: React.CSSProperties = { padding: '16px 0', borderBottom: '1px solid var(--border)' }
        return (
          <div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setViewing(null)}>
            <div className="modal-dialog" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '90%', maxWidth: 560, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>{bk.title || 'Booking Request'}</h3>
                  <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                  </button>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,165,0,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}>
                  Awaiting Response
                </span>
              </div>
              <div style={{ padding: '0 28px 8px', overflowY: 'auto', maxHeight: '62vh' }}>
                <div style={sectionSt}>
                  <div style={sectionLabelSt}>Date &amp; Time</div>
                  <div style={detailRowSt}>
                    <svg style={iconSt} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M1 5.5h12M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <div>{formatDate(bk.date)}</div>
                      <div style={{ fontWeight: 600 }}>{formatTime(bk.time_start, bk.time_end)}</div>
                      {bk.recurrence && bk.recurrence !== 'one-time' && (
                        <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Recurring</div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={sectionSt}>
                  <div style={sectionLabelSt}>Location</div>
                  <div style={detailRowSt}>
                    {isRemote ? (
                      <svg style={iconSt} width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="1" y="1" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M4 12h6M7 10v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg style={iconSt} width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1C4.79 1 3 2.79 3 5C3 8.5 7 13 7 13C7 13 11 8.5 11 5C11 2.79 9.21 1 7 1ZM7 7C5.9 7 5 6.1 5 5C5 3.9 5.9 3 7 3C8.1 3 9 3.9 9 5C9 6.1 8.1 7 7 7Z" fill="currentColor"/>
                      </svg>
                    )}
                    <div>{isRemote ? 'Remote' : (bk.location || 'Location TBD')}</div>
                  </div>
                </div>
                <div style={sectionSt}>
                  <div style={sectionLabelSt}>Requester</div>
                  <div style={detailRowSt}>
                    <svg style={iconSt} width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <div><div style={{ fontWeight: 600 }}>{bk.requester_name || 'Name withheld'}</div></div>
                  </div>
                </div>
                {(bk.notes || bk.specialization) && (
                  <div style={sectionSt}>
                    <div style={sectionLabelSt}>Job Context</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                      {bk.notes || `${bk.specialization} appointment - no additional context provided.`}
                    </div>
                  </div>
                )}
                <div style={{ padding: '16px 0' }}>
                  <div style={sectionLabelSt}>Attachments &amp; Materials</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>None provided</div>
                </div>
              </div>
              <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <GhostButton onClick={() => setViewing(null)}>Close</GhostButton>
              </div>
            </div>
          </div>
        )
      })()}

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
      <style>{`
        .interp-name-link:hover { text-decoration: underline !important; }
      `}</style>
    </div>
  )
}

/* ── Suggested Mentors Component ── */

interface MentorSuggestion {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  avatar_color: string | null
  years_experience: string | null
  mentorship_types: string[] | null
  mentorship_types_offering: string[] | null
  mentorship_paid: string | null
  mentorship_bio_offering: string | null
  mentorship_bio_seeking: string | null
  name: string
  score: number
}

function SuggestedMentors({ interpreterProfileId }: { interpreterProfileId: string | null }) {
  const [suggestions, setSuggestions] = useState<MentorSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [messageTarget, setMessageTarget] = useState<MentorSuggestion | null>(null)
  const [seekerBio, setSeekerBio] = useState('')

  useEffect(() => {
    if (!interpreterProfileId) { setLoading(false); return }

    async function fetchSuggestions() {
      try {
        const res = await fetch('/api/interpreter/mentorship/suggestions')
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.suggestions || [])
        }
      } catch {
        // Silent fail
      }

      // Also fetch seeker's own bio for pre-fill
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('interpreter_profiles')
          .select('mentorship_bio_seeking')
          .eq('user_id', user.id)
          .maybeSingle()
        if (data?.mentorship_bio_seeking) setSeekerBio(data.mentorship_bio_seeking)
      }
      setLoading(false)
    }

    fetchSuggestions()
  }, [interpreterProfileId])

  if (loading || suggestions.length === 0) return null

  function getPaidLabel(paid: string | null): string {
    if (paid === 'pro_bono') return 'Pro bono'
    if (paid === 'paid') return 'Paid'
    if (paid === 'either') return 'Open to discussing'
    return ''
  }

  function buildPrefillMessage(mentor: MentorSuggestion): string {
    const types = (mentor.mentorship_types_offering || mentor.mentorship_types || []).map(getMentorshipLabel).join(', ')
    if (mentor.mentorship_paid === 'paid') {
      return `Hi ${mentor.first_name || mentor.name}, I'm interested in your paid mentorship${types ? ` in ${types}` : ''}. I'd love to learn about your rates and format.${seekerBio ? ` ${seekerBio}` : ''}`
    }
    return `Hi ${mentor.first_name || mentor.name}, I'm interested in mentorship${types ? ` in ${types}` : ''}.${seekerBio ? ` ${seekerBio}` : ''}`
  }

  return (
    <>
      <div style={{ marginTop: 36 }}>
        <SectionLabel>Suggested Mentors</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 14,
            marginTop: 16,
          }}
        >
          {suggestions.map(mentor => {
            const initials = mentor.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
            return (
              <div
                key={mentor.id}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Header: photo + name + experience */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {mentor.photo_url ? (
                    <img
                      src={mentor.photo_url}
                      alt={mentor.name}
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: mentor.avatar_color || 'linear-gradient(135deg,#7b61ff,#00e5ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                    }}>
                      {initials}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/directory/${mentor.id}`}
                      style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', textDecoration: 'none' }}
                    >
                      {mentor.name}
                    </Link>
                    {mentor.years_experience && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {mentor.years_experience} years experience
                      </div>
                    )}
                  </div>
                </div>

                {/* Mentorship types as tags (show offering types) */}
                {((mentor.mentorship_types_offering && mentor.mentorship_types_offering.length > 0) || (mentor.mentorship_types && mentor.mentorship_types.length > 0)) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(mentor.mentorship_types_offering || mentor.mentorship_types || []).slice(0, 4).map(t => (
                      <span
                        key={t}
                        style={{
                          fontSize: '0.68rem', padding: '2px 8px', borderRadius: 100,
                          background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
                          color: 'var(--accent)',
                        }}
                      >
                        {getMentorshipLabel(t)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Compensation */}
                {mentor.mentorship_paid && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {getPaidLabel(mentor.mentorship_paid)}
                  </div>
                )}

                {/* Bio offering (truncated) */}
                {mentor.mentorship_bio_offering && (
                  <div style={{
                    fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {mentor.mentorship_bio_offering}
                  </div>
                )}

                {/* Request Mentorship button */}
                <button
                  onClick={(e) => { e.preventDefault(); setMessageTarget(mentor) }}
                  className="btn-primary"
                  style={{ marginTop: 'auto', fontSize: '0.82rem', padding: '8px 16px' }}
                >
                  Request Mentorship
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Message modal for mentorship request */}
      {messageTarget && (
        <SendMessageModal
          recipientId={messageTarget.user_id}
          recipientName={messageTarget.name}
          recipientPhoto={messageTarget.photo_url}
          initialSubject="Mentorship inquiry"
          initialBody={buildPrefillMessage(messageTarget)}
          onClose={() => setMessageTarget(null)}
          onSent={() => setMessageTarget(null)}
        />
      )}
    </>
  )
}
