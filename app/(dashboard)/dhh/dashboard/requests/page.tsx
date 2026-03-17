'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import RequestTracker from '@/components/dashboard/dhh/RequestTracker'
import InterpreterRating from '@/components/dashboard/dhh/InterpreterRating'
import { createClient } from '@/lib/supabase/client'
import BookingFilterBar, { filterBySearch, filterByDateRange, groupByTimeCategory, timeCategoryHeaderStyle } from '@/components/dashboard/shared/BookingFilterBar'
import InlineVideoCapture from '@/components/ui/InlineVideoCapture'
import { getVideoEmbedUrl } from '@/lib/videoUtils'

interface Recipient {
  id: string
  booking_id: string
  interpreter_id: string
  status: string
  wave_number?: number
  sent_at?: string | null
  viewed_at?: string | null
  responded_at?: string | null
  confirmed_at?: string | null
  declined_at?: string | null
  withdrawn_at?: string | null
  response_rate?: number | null
  response_notes?: string | null
  decline_reason?: string | null
  interpreter: {
    name: string
    first_name?: string | null
    last_name?: string | null
    photo_url?: string | null
  } | null
}

interface BookingWithRecipients {
  id: string
  title: string | null
  date: string
  time_start: string
  time_end: string
  timezone: string | null
  location: string | null
  format: string | null
  status: string
  request_type: string | null
  event_type: string | null
  event_category: string | null
  description: string | null
  notes: string | null
  interpreter_count: number | null
  interpreters_confirmed?: number | null
  cancellation_reason: string | null
  cancelled_at?: string | null
  created_at: string
  requester_name?: string | null
  context_video_url?: string | null
  context_video_visible_before_accept?: boolean | null
  recipients: Recipient[]
}

/* ── Helpers ── */

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
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

function getDisplayStatusLabel(status: string): string {
  if (status === 'open') return 'Still looking'
  if (status === 'filled') return 'Confirmed'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'
  return status
}

function getStatusColors(status: string) {
  if (status === 'open') return { bg: 'rgba(255,165,0,0.12)', border: 'rgba(255,165,0,0.3)', text: '#ffa500' }
  if (status === 'filled') return { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', text: '#34d399' }
  if (status === 'completed') return { bg: 'rgba(0,229,255,0.1)', border: 'rgba(0,229,255,0.3)', text: '#00e5ff' }
  if (status === 'cancelled') return { bg: 'rgba(255,77,109,0.1)', border: 'rgba(255,77,109,0.3)', text: '#ff8099' }
  return { bg: 'rgba(255,255,255,0.06)', border: 'var(--border)', text: 'var(--muted)' }
}

const RECIPIENT_STATUS_ORDER: Record<string, number> = {
  confirmed: 0,
  responded: 1,
  viewed: 2,
  sent: 3,
  declined: 4,
  withdrawn: 5,
}

function sortRecipients(recipients: Recipient[]): Recipient[] {
  return [...recipients].sort((a, b) =>
    (RECIPIENT_STATUS_ORDER[a.status] ?? 3) - (RECIPIENT_STATUS_ORDER[b.status] ?? 3)
  )
}

function isBookingCompleted(booking: BookingWithRecipients): boolean {
  if (booking.status === 'completed') return true
  if (booking.status === 'filled') {
    return new Date(booking.date + 'T23:59:59') < new Date()
  }
  return false
}

/* ── SVG Icons (thin-line style) ── */

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{
        transition: 'transform 0.2s',
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        flexShrink: 0,
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function CalendarAddIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="14" x2="12" y2="20" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  )
}

/* ── Interpreter mini-card for expanded grid ── */

function InterpreterMiniCard({ recipient }: { recipient: Recipient }) {
  const interp = recipient.interpreter
  const name = interp?.first_name
    ? `${interp.first_name} ${interp.last_name?.[0] || ''}.`
    : interp?.name || 'Interpreter'
  const initials = interp?.first_name
    ? `${interp.first_name[0]}${interp.last_name?.[0] || ''}`.toUpperCase()
    : (interp?.name?.[0] || 'I').toUpperCase()

  const statusConfigs: Record<string, { bg: string; color: string; label: string }> = {
    confirmed: { bg: 'rgba(52,211,153,0.1)', color: '#34d399', label: 'Confirmed' },
    sent: { bg: 'rgba(184,191,207,0.08)', color: '#6b7280', label: 'Sent' },
    viewed: { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', label: 'Viewed' },
    responded: { bg: 'rgba(255,165,0,0.1)', color: '#ffa500', label: 'Pending' },
    declined: { bg: 'rgba(255,107,133,0.08)', color: '#ff8099', label: 'Declined' },
    withdrawn: { bg: 'rgba(184,191,207,0.06)', color: '#6b7280', label: 'Withdrawn' },
  }
  const sc = statusConfigs[recipient.status] || statusConfigs.sent

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      {interp?.photo_url ? (
        <img src={interp.photo_url} alt="" style={{
          width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
        }} />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.6rem', color: '#fff',
        }}>
          {initials}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/directory/${recipient.interpreter_id}`}
          onClick={e => e.stopPropagation()}
          style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem',
            color: 'var(--text)', textDecoration: 'none', display: 'block',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {name}
        </Link>
        <span style={{
          fontSize: '0.68rem', fontWeight: 600, color: sc.color,
          background: sc.bg, borderRadius: 100, padding: '1px 7px',
          display: 'inline-block', marginTop: 2,
        }}>
          {sc.label}
        </span>
      </div>
    </div>
  )
}

/* ── Appointment Video Section (expanded card, on-my-behalf only) ── */

function AppointmentVideoSection({ booking }: { booking: BookingWithRecipients }) {
  const [videoUrl, setVideoUrl] = useState(booking.context_video_url || '')
  const [shareBeforeAccept, setShareBeforeAccept] = useState(
    booking.context_video_visible_before_accept !== false
  )
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function saveVideo(url: string) {
    setSaving(true)
    try {
      await fetch('/api/dhh/context-video', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          contextVideoUrl: url,
          contextVideoVisibleBeforeAccept: shareBeforeAccept,
        }),
      })
      setVideoUrl(url)
    } catch (err) {
      console.error('[context-video] save failed:', err)
    }
    setSaving(false)
  }

  async function removeVideo() {
    setRemoving(true)
    try {
      await fetch('/api/dhh/context-video', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          contextVideoUrl: null,
        }),
      })
      setVideoUrl('')
    } catch (err) {
      console.error('[context-video] remove failed:', err)
    }
    setRemoving(false)
  }

  async function updateSharePref(before: boolean) {
    setShareBeforeAccept(before)
    try {
      await fetch('/api/dhh/context-video', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          contextVideoVisibleBeforeAccept: before,
        }),
      })
    } catch (err) {
      console.error('[context-video] pref update failed:', err)
    }
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--muted)', marginBottom: 8,
  }

  const mutedSmall: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem',
    color: 'var(--muted)', lineHeight: 1.5,
  }

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
      <div style={sectionLabelStyle}>
        {videoUrl ? 'Appointment Video' : 'Appointment Video (Optional)'}
      </div>

      {!videoUrl ? (
        <>
          <p style={{ ...mutedSmall, marginBottom: 12, marginTop: 0 }}>
            Give your interpreter context about this specific appointment.
            Only the interpreter(s) assigned to this booking can see this video.
          </p>

          <InlineVideoCapture
            onVideoSaved={(url) => saveVideo(url)}
            accentColor="#9d87ff"
            storageBucket="videos"
            storagePath="context-videos"
          />

          {/* Sharing toggle */}
          <div style={{ marginTop: 14 }}>
            <div style={{ ...mutedSmall, marginBottom: 8, fontWeight: 600 }}>
              Share this video with interpreters:
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
              <input
                type="radio"
                name={`share-pref-${booking.id}`}
                checked={shareBeforeAccept}
                onChange={() => updateSharePref(true)}
                style={{ accentColor: '#9d87ff' }}
              />
              <span style={mutedSmall}>Before they confirm (helps them decide if they&apos;re a match)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name={`share-pref-${booking.id}`}
                checked={!shareBeforeAccept}
                onChange={() => updateSharePref(false)}
                style={{ accentColor: '#9d87ff' }}
              />
              <span style={mutedSmall}>After they confirm (share only with your confirmed interpreter)</span>
            </label>
          </div>
        </>
      ) : (
        <>
          {/* Video player */}
          {(() => {
            const embedUrl = getVideoEmbedUrl(videoUrl)
            if (!embedUrl) return null
            return embedUrl.includes('supabase.co/storage') ? (
              <video
                controls
                width="100%"
                src={embedUrl}
                style={{ borderRadius: 10, border: '1px solid var(--border)', maxHeight: 260, background: '#000', marginBottom: 12 }}
              />
            ) : (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                <iframe
                  src={embedUrl}
                  title="Appointment context video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            )
          })()}

          {/* Re-record / Remove buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button
              onClick={() => setVideoUrl('')}
              disabled={saving}
              style={{
                background: 'none', border: '1px solid rgba(157,135,255,0.4)',
                borderRadius: 'var(--radius-sm)', padding: '7px 16px',
                fontSize: '0.82rem', fontWeight: 600, color: '#9d87ff',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Re-record
            </button>
            <button
              onClick={removeVideo}
              disabled={removing}
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '7px 16px',
                fontSize: '0.82rem', color: 'var(--muted)',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {removing ? 'Removing...' : 'Remove video'}
            </button>
          </div>

          {/* Sharing toggle */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...mutedSmall, marginBottom: 8, fontWeight: 600 }}>
              Share this video with interpreters:
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 6 }}>
              <input
                type="radio"
                name={`share-pref-${booking.id}`}
                checked={shareBeforeAccept}
                onChange={() => updateSharePref(true)}
                style={{ accentColor: '#9d87ff' }}
              />
              <span style={mutedSmall}>Before they confirm (helps them decide if they&apos;re a match)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name={`share-pref-${booking.id}`}
                checked={!shareBeforeAccept}
                onChange={() => updateSharePref(false)}
                style={{ accentColor: '#9d87ff' }}
              />
              <span style={mutedSmall}>After they confirm (share only with your confirmed interpreter)</span>
            </label>
          </div>

          <p style={{ ...mutedSmall, marginTop: 4, marginBottom: 0 }}>
            Only the interpreter(s) assigned to this booking can see this video.
          </p>
        </>
      )}

      {/* Cross-link to profile Intro Video */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: '0.76rem',
        color: 'var(--muted)', marginTop: 14, marginBottom: 0,
        lineHeight: 1.5, opacity: 0.85,
      }}>
        This video is for context about this specific appointment.
        To add a general introduction attached to all your requests, go to{' '}
        <Link href="/dhh/dashboard/preferences" style={{ color: '#9d87ff', textDecoration: 'underline' }}>
          your Profile
        </Link>.
      </p>
    </div>
  )
}

/* ── Request Card ── */

function RequestCard({ booking, onExpand, expanded, ratedInterpreters, onRated, isOnMyBehalf }: {
  booking: BookingWithRecipients
  onExpand: () => void
  expanded: boolean
  ratedInterpreters: Set<string>
  onRated: (key: string) => void
  isOnMyBehalf?: boolean
}) {
  const isDismissed = booking.status === 'cancelled'
  const allDeclined = booking.status === 'open' &&
    booking.recipients.length > 0 &&
    booking.recipients.filter(r => r.status !== 'withdrawn').every(r => r.status === 'declined')
  const completed = isBookingCompleted(booking)
  const confirmedRecipients = booking.recipients.filter(r => r.status === 'confirmed')
  const statusColors = getStatusColors(booking.status)
  const formatLabel = booking.format === 'remote' ? 'Remote' : booking.format === 'in_person' ? 'In-person' : 'TBD'
  const locationText = booking.format === 'remote' ? 'Remote' : booking.location || 'TBD'

  // Check if ALL confirmed interpreters on this booking have been rated
  const allRated = confirmedRecipients.length > 0 &&
    confirmedRecipients.every(r => ratedInterpreters.has(`${booking.id}:${r.interpreter_id}`))

  return (
    <div
      onClick={onExpand}
      style={{
        background: '#111118', border: '1px solid #1e2433',
        borderRadius: 'var(--radius)', overflow: 'hidden',
        opacity: isDismissed || allDeclined ? 0.6 : 1,
        cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.35)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2433' }}
    >
      {/* COLLAPSED VIEW */}
      <div style={{ padding: '20px 24px' }}>
        {/* Line 1: Title */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1rem',
            color: 'var(--text)',
          }}>
            {booking.title || 'Interpreter Request'}
          </span>
        </div>

        {/* Line 2: Date + Time + Location with icons */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.84rem', color: 'var(--muted)',
          marginBottom: 8,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <CalendarIcon />
            {formatDateShort(booking.date)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <ClockIcon />
            {formatTime(booking.time_start, booking.time_end)}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            <PinIcon />
            {locationText}
          </span>
        </div>

        {/* Line 3: Progress tracker */}
        <RequestTracker booking={booking} recipients={booking.recipients} compact hasRating={allRated} />

        {/* Line 4 (conditional): Confirmed interpreter(s) — stacked vertically, right-aligned */}
        {confirmedRecipients.length > 0 && !expanded && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            gap: 6, marginTop: 4,
          }}>
            {confirmedRecipients.map(r => {
              const interp = r.interpreter
              const name = interp?.first_name
                ? `${interp.first_name} ${interp.last_name || ''}`.trim()
                : interp?.name || 'Interpreter'
              const initials = interp?.first_name
                ? `${interp.first_name[0]}${interp.last_name?.[0] || ''}`.toUpperCase()
                : (interp?.name?.[0] || 'I').toUpperCase()

              return (
                <span key={r.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: '0.8rem', color: '#34d399', fontWeight: 500,
                }}>
                  {interp?.photo_url ? (
                    <img src={interp.photo_url} alt="" style={{
                      width: 24, height: 24, borderRadius: '50%', objectFit: 'cover',
                    }} />
                  ) : (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.5rem', color: '#fff',
                    }}>
                      {initials}
                    </div>
                  )}
                  Confirmed: {name}
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#34d399',
                    display: 'inline-block',
                  }} />
                </span>
              )
            })}
          </div>
        )}

        {/* Line 5: Action links */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20, marginTop: 10,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onExpand() }}
            aria-expanded={expanded}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '0.82rem',
              color: '#00e5ff', display: 'inline-flex', alignItems: 'center', gap: 5,
              textDecoration: 'none',
            }}
            onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            {expanded ? 'Hide details' : 'View details'}
            <ChevronIcon expanded={expanded} />
          </button>
          <a
            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.title || 'Interpreter Booking')}&dates=${booking.date.replace(/-/g, '')}T${booking.time_start.replace(/:/g, '')}00/${booking.date.replace(/-/g, '')}T${booking.time_end.replace(/:/g, '')}00&location=${encodeURIComponent(booking.location || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '0.82rem',
              color: '#00e5ff', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
            onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            <CalendarAddIcon />
            Add to calendar
          </a>
        </div>
      </div>

      {/* EXPANDED VIEW */}
      {expanded && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            padding: '0 24px 20px', borderTop: '1px solid var(--border)',
          }}>
          <div style={{ paddingTop: 20 }}>
            {/* Two-column layout */}
            <div className="dhh-card-expanded-cols" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16,
            }}>
              {/* LEFT: Appointment Details */}
              <div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--muted)', marginBottom: 12,
                }}>
                  Appointment Details
                </div>

                {/* Location */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>
                    Location
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: 'var(--text)' }}>
                    {booking.format === 'remote' ? (
                      <span style={{ color: '#00e5ff' }}>Remote</span>
                    ) : booking.location ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: '#00e5ff', textDecoration: 'none' }}
                        onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {booking.location}
                      </a>
                    ) : 'TBD'}
                  </div>
                </div>

                {/* Event */}
                {(booking.event_category || booking.event_type) && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>
                      Event
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: 'var(--text)' }}>
                      {booking.event_category}{booking.event_type ? ` — ${booking.event_type}` : ''}
                    </div>
                  </div>
                )}

                {/* Requester */}
                {booking.requester_name && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>
                      Requester
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: 'var(--text)' }}>
                      {booking.requester_name}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {(booking.description || booking.notes) && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>
                      Notes
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55 }}>
                      {booking.description || booking.notes}
                    </div>
                  </div>
                )}

                {/* Cancellation reason */}
                {booking.status === 'cancelled' && booking.cancellation_reason && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: '#ff6b85', marginBottom: 2 }}>
                      Cancellation reason
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: '#ff6b85' }}>
                      {booking.cancellation_reason}
                    </div>
                  </div>
                )}

                {/* Appointment Video — only for "Requests made on my behalf" */}
                {isOnMyBehalf && (
                  <AppointmentVideoSection booking={booking} />
                )}
              </div>

              {/* RIGHT: Interpreters Contacted */}
              <div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--muted)', marginBottom: 12,
                }}>
                  Interpreters Contacted
                </div>

                {booking.recipients.length > 0 ? (
                  <div className="dhh-interp-grid" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
                  }}>
                    {sortRecipients(booking.recipients).map(r => (
                      <InterpreterMiniCard key={r.id} recipient={r} />
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    No interpreters contacted yet.
                  </div>
                )}
              </div>
            </div>

            {/* Rating UI — one form per confirmed interpreter */}
            {completed && confirmedRecipients.map(r => {
              const interpName = r.interpreter?.name || 'Interpreter'
              const key = `${booking.id}:${r.interpreter_id}`
              if (ratedInterpreters.has(key)) return null
              return (
                <InterpreterRating
                  key={r.interpreter_id}
                  bookingId={booking.id}
                  interpreterId={r.interpreter_id}
                  interpreterName={interpName}
                  onRated={() => onRated(key)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

type Tab = 'professional' | 'personal'

export default function DhhRequestsListPage() {
  const [bookings, setBookings] = useState<BookingWithRecipients[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [ratedInterpreters, setRatedInterpreters] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<Tab>('professional')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/dhh/request')
      const data = await res.json()
      if (data.bookings) {
        setBookings(data.bookings)
      }
    } catch (err) {
      console.error('[dhh-requests] fetch failed:', err)
    }
    setLoading(false)
  }, [])

  // Fetch which (booking, interpreter) pairs have already been rated
  const fetchRatings = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('interpreter_ratings')
        .select('booking_id, interpreter_id')

      if (data) {
        setRatedInterpreters(new Set(data.map(r => `${r.booking_id}:${r.interpreter_id}`)))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchRequests()
    fetchRatings()
  }, [fetchRequests, fetchRatings])

  function handleRated(key: string) {
    setRatedInterpreters(prev => new Set(prev).add(key))
  }

  // Filter bookings by tab, then apply search + date filters + sort soonest-first
  const professionalBookings = bookings.filter(b => b.request_type === 'professional' || (!b.request_type && !b.recipients?.length))
  const personalBookings = bookings.filter(b => b.request_type === 'personal')
  const tabBookings = activeTab === 'professional' ? professionalBookings : personalBookings
  const activeBookings = filterByDateRange(
    filterBySearch(tabBookings, search, ['title', 'location', 'description', 'notes']),
    dateFrom, dateTo
  )
  const groupedBookings = groupByTimeCategory(activeBookings)

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '10px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
    fontSize: '0.88rem',
    color: activeTab === tab ? 'var(--accent)' : 'var(--muted)',
    borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
    transition: 'color 0.15s, border-color 0.15s',
  })

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <PageHeader title="My Requests" subtitle="Track interpreter requests and bookings." />

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 20,
        borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={() => { setActiveTab('professional'); setExpandedId(null) }} style={tabStyle('professional')}>
          Requests made on my behalf
        </button>
        <button onClick={() => { setActiveTab('personal'); setExpandedId(null) }} style={tabStyle('personal')}>
          My personal requests
        </button>
      </div>

      <BookingFilterBar
        search={search} onSearchChange={setSearch}
        dateFrom={dateFrom} onDateFromChange={setDateFrom}
        dateTo={dateTo} onDateToChange={setDateTo}
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Loading...
        </div>
      ) : groupedBookings.length === 0 ? (
        <div style={{
          border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
          padding: '40px 24px', textAlign: 'center',
          color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6,
        }}>
          {activeTab === 'professional'
            ? 'No requests made on your behalf yet. These appear when an organization books an interpreter for you.'
            : 'No personal requests yet. Submit your first interpreter request.'
          }
          {activeTab === 'personal' && (
            <div style={{ marginTop: 14 }}>
              <Link
                href="/dhh/dashboard/request"
                style={{
                  display: 'inline-block', padding: '10px 24px',
                  background: 'linear-gradient(135deg, #9d87ff, #7b61ff)',
                  borderRadius: 'var(--radius-sm)', color: '#fff',
                  textDecoration: 'none', fontSize: '0.88rem', fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                New Request
              </Link>
            </div>
          )}
        </div>
      ) : (
        groupedBookings.map((group, gi) => (
          <div key={group.label} style={group.isPast ? { opacity: 0.6 } : undefined}>
            <div style={{ ...timeCategoryHeaderStyle, marginTop: gi === 0 ? 0 : 32 }}>{group.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {group.items.map(b => (
                <RequestCard
                  key={b.id}
                  booking={b}
                  expanded={expandedId === b.id}
                  onExpand={() => setExpandedId(expandedId === b.id ? null : b.id)}
                  ratedInterpreters={ratedInterpreters}
                  onRated={handleRated}
                  isOnMyBehalf={activeTab === 'professional'}
                />
              ))}
            </div>
          </div>
        ))
      )}

      <DashMobileStyles />

      {/* Responsive styles for expanded card columns */}
      <style>{`
        @media (max-width: 768px) {
          .dhh-card-expanded-cols {
            grid-template-columns: 1fr !important;
          }
          .dhh-interp-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
