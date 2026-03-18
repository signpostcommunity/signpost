'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import RequestTracker from '@/components/dashboard/dhh/RequestTracker'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import InterpreterRequestLinkCard from '@/components/dashboard/dhh/InterpreterRequestLinkCard'

/* ── Types ── */

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

interface RecentBooking {
  id: string
  title: string | null
  date: string
  time_start: string
  time_end: string
  format: string | null
  location: string | null
  status: string
  event_type: string | null
  event_category: string | null
  description: string | null
  notes: string | null
  interpreter_count: number | null
  cancellation_reason: string | null
  requester_name: string | null
  created_at: string
  recipients: Recipient[]
}

interface PrefInterpreter {
  id: string
  first_name: string | null
  last_name: string | null
  name: string | null
  photo_url: string | null
  certs: string[]
  tier: 'preferred' | 'approved'
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

function getInitials(firstName: string | null, lastName: string | null, name: string | null): string {
  if (firstName) return `${firstName[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  if (name) return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  return '?'
}

function getDisplayName(firstName: string | null, lastName: string | null, name: string | null): string {
  if (firstName) return `${firstName} ${lastName || ''}`.trim()
  return name || 'Unknown'
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

/* ── SVG Icons ── */

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

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

/* ── Interpreter mini-card for modal grid ── */

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

/* ── Detail Modal ── */

function DetailModal({ booking, onClose }: { booking: RecentBooking; onClose: () => void }) {
  const focusTrapRef = useFocusTrap(true)
  const confirmedRecipients = booking.recipients.filter(r => r.status === 'confirmed')
  const formatLabel = booking.format === 'remote' ? 'Remote' : booking.format === 'in_person' ? 'In-person' : 'TBD'
  const locationText = booking.format === 'remote' ? 'Remote' : booking.location || 'TBD'
  const statusColors = getStatusColors(booking.status)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label={booking.title || 'Booking details'}
        style={{
          background: '#111118', border: '1px solid #1e2433',
          borderRadius: 'var(--radius)', maxWidth: 700, width: '100%',
          maxHeight: '85vh', overflow: 'auto', padding: '24px 28px',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, borderRadius: 6,
          }}
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* Line 1: Title + badges */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10,
          paddingRight: 32,
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.1rem',
            color: 'var(--text)',
          }}>
            {booking.title || 'Interpreter Request'}
          </span>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '2px 10px',
            borderRadius: 100, background: 'none',
            color: 'var(--muted)', border: '1px solid #333',
          }}>
            {formatLabel}
          </span>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '2px 10px',
            borderRadius: 100, background: statusColors.bg,
            color: statusColors.text, border: `1px solid ${statusColors.border}`,
          }}>
            {getDisplayStatusLabel(booking.status)}
          </span>
        </div>

        {/* Line 2: Date/time/location */}
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <PinIcon />
            {locationText}
          </span>
        </div>

        {/* Progress tracker */}
        <RequestTracker booking={booking} recipients={booking.recipients} hasRating={false} />

        {/* Confirmed interpreter preview */}
        {confirmedRecipients.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
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
                    <img src={interp.photo_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.5rem', color: '#fff',
                    }}>
                      {initials}
                    </div>
                  )}
                  Confirmed: {name}
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                </span>
              )
            })}
          </div>
        )}

        {/* Two-column layout */}
        <div className="dhh-modal-cols" style={{
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
                {booking.recipients.map(r => (
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
      </div>
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
          border: `1px solid ${hover ? 'rgba(157,135,255,0.3)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '20px',
          transition: 'border-color 0.18s, transform 0.18s', cursor: 'pointer',
          transform: hover ? 'translateY(-2px)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
          flex: 1,
        }}
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.04em', color: '#9d87ff' }}>{num}</div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 4 }}>{label}</div>
      </div>
    </Link>
  )
}

/* ── Recent Request Card (compact, clickable for modal) ── */

function RecentRequestCard({ booking, onClick }: { booking: RecentBooking; onClick: () => void }) {
  const formatLabel = booking.format === 'remote' ? 'Remote' : booking.format === 'in_person' ? 'In-person' : 'TBD'
  const locationText = booking.format === 'remote' ? 'Remote' : booking.location || 'TBD'
  const statusColors = getStatusColors(booking.status)
  const confirmedRecipients = booking.recipients.filter(r => r.status === 'confirmed')

  return (
    <div
      onClick={onClick}
      style={{
        background: '#111118', border: '1px solid #1e2433',
        borderRadius: 'var(--radius)', padding: '18px 20px',
        cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(157,135,255,0.3)')}
      onMouseOut={e => (e.currentTarget.style.borderColor = '#1e2433')}
    >
      {/* Line 1: Title + badges */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6,
      }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem',
          color: 'var(--text)', flex: 1, minWidth: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {booking.title || 'Interpreter Request'}
        </span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px',
          borderRadius: 100, color: 'var(--muted)', border: '1px solid #333',
          whiteSpace: 'nowrap',
        }}>
          {formatLabel}
        </span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px',
          borderRadius: 100, background: statusColors.bg,
          color: statusColors.text, border: `1px solid ${statusColors.border}`,
          whiteSpace: 'nowrap',
        }}>
          {getDisplayStatusLabel(booking.status)}
        </span>
      </div>

      {/* Line 2: Date + Time + Location */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: 'var(--muted)',
        marginBottom: 6,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <CalendarIcon />
          {formatDateShort(booking.date)}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ClockIcon />
          {formatTime(booking.time_start, booking.time_end)}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          <PinIcon />
          {locationText}
        </span>
      </div>

      {/* Line 3: Progress tracker */}
      <RequestTracker booking={booking} recipients={booking.recipients} compact hasRating={false} />

      {/* Line 4 (conditional): Confirmed interpreter */}
      {confirmedRecipients.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {confirmedRecipients.slice(0, 2).map(r => {
            const interp = r.interpreter
            const name = interp?.first_name
              ? `${interp.first_name} ${interp.last_name || ''}`.trim()
              : interp?.name || 'Interpreter'
            const initials = interp?.first_name
              ? `${interp.first_name[0]}${interp.last_name?.[0] || ''}`.toUpperCase()
              : (interp?.name?.[0] || 'I').toUpperCase()
            return (
              <span key={r.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.75rem', color: '#34d399', fontWeight: 500,
              }}>
                {interp?.photo_url ? (
                  <img src={interp.photo_url} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.45rem', color: '#fff',
                  }}>
                    {initials}
                  </div>
                )}
                {name}
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
              </span>
            )
          })}
        </div>
      )}

      {/* View details link */}
      <div style={{
        marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
        fontSize: '0.78rem', color: '#00e5ff',
      }}>
        View details
      </div>
    </div>
  )
}

/* ── Main Component ── */

export default function DeafDashboardOverview() {
  const [firstName, setFirstName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalBooking, setModalBooking] = useState<RecentBooking | null>(null)

  // Stat counts
  const [activeRequests, setActiveRequests] = useState(0)
  const [prefCount, setPrefCount] = useState(0)
  const [secCount, setSecCount] = useState(0)
  const [circleCount, setCircleCount] = useState(0)

  // Recent data
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [prefInterpreters, setPrefInterpreters] = useState<PrefInterpreter[]>([])

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) { setLoading(false); return }

    // Get Deaf profile
    let deafProfileId: string | null = null
    const { data: byId } = await supabase
      .from('deaf_profiles')
      .select('id, first_name')
      .eq('id', user.id)
      .maybeSingle()

    if (byId) {
      deafProfileId = byId.id
      setFirstName(byId.first_name)
    } else {
      const { data: byUserId } = await supabase
        .from('deaf_profiles')
        .select('id, first_name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (byUserId) {
        deafProfileId = byUserId.id
        setFirstName(byUserId.first_name)
      }
    }

    if (!deafProfileId) { setLoading(false); return }

    // Fetch all stats in parallel
    const [
      activeRes,
      prefRes,
      secRes,
      circleRes,
      dhhBookingsRes,
      prefInterpRes,
    ] = await Promise.all([
      supabase
        .from('booking_dhh_clients')
        .select('booking_id', { count: 'exact', head: true })
        .eq('dhh_user_id', user.id),
      supabase
        .from('deaf_roster')
        .select('id', { count: 'exact', head: true })
        .eq('deaf_user_id', deafProfileId)
        .eq('tier', 'preferred'),
      supabase
        .from('deaf_roster')
        .select('id', { count: 'exact', head: true })
        .eq('deaf_user_id', deafProfileId)
        .eq('tier', 'approved'),
      supabase
        .from('trusted_deaf_circle')
        .select('id', { count: 'exact', head: true })
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
        .eq('status', 'accepted'),
      supabase
        .from('booking_dhh_clients')
        .select('booking_id')
        .eq('dhh_user_id', user.id),
      supabase
        .from('deaf_roster')
        .select('interpreter_id, tier, notes, do_not_book')
        .eq('deaf_user_id', deafProfileId)
        .in('tier', ['preferred', 'approved'])
        .or('do_not_book.is.null,do_not_book.eq.false')
        .order('tier', { ascending: true })
        .limit(10),
    ])

    if (!activeRes.error) setActiveRequests(activeRes.count ?? 0)
    if (!prefRes.error) setPrefCount(prefRes.count ?? 0)
    if (!secRes.error) setSecCount(secRes.count ?? 0)
    if (!circleRes.error) setCircleCount(circleRes.count ?? 0)

    // Fetch recent bookings with recipients (via API for full data)
    if (!dhhBookingsRes.error && dhhBookingsRes.data && dhhBookingsRes.data.length > 0) {
      try {
        const res = await fetch('/api/dhh/request')
        const data = await res.json()
        if (data.bookings) {
          // Take the 3 most recent
          setRecentBookings(data.bookings.slice(0, 3))
        }
      } catch (err) {
        console.error('[dhh-overview] bookings API fetch error:', err)
        // Fallback: simple fetch without recipients
        const bookingIds = dhhBookingsRes.data.map(b => b.booking_id)
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('id, title, date, time_start, time_end, format, location, status, created_at')
          .in('id', bookingIds)
          .order('date', { ascending: false })
          .limit(3)
        if (bookingsData) {
          setRecentBookings(bookingsData.map(b => ({
            ...b, event_type: null, event_category: null, description: null,
            notes: null, interpreter_count: null, cancellation_reason: null,
            requester_name: null, recipients: [],
          })) as RecentBooking[])
        }
      }
    }

    // Fetch preferred interpreter profiles (two-step)
    if (!prefInterpRes.error && prefInterpRes.data && prefInterpRes.data.length > 0) {
      const interpIds = prefInterpRes.data.map(p => p.interpreter_id)

      const [profilesRes, certsRes] = await Promise.all([
        supabase
          .from('interpreter_profiles')
          .select('id, first_name, last_name, name, photo_url')
          .in('id', interpIds),
        supabase
          .from('interpreter_certifications')
          .select('interpreter_id, name')
          .in('interpreter_id', interpIds),
      ])

      if (!profilesRes.error && profilesRes.data) {
        const certsMap: Record<string, string[]> = {}
        for (const c of certsRes.data || []) {
          if (!certsMap[c.interpreter_id]) certsMap[c.interpreter_id] = []
          certsMap[c.interpreter_id].push(c.name)
        }

        // Build a tier lookup from roster data
        const tierMap: Record<string, 'preferred' | 'approved'> = {}
        for (const r of prefInterpRes.data) {
          tierMap[r.interpreter_id] = r.tier as 'preferred' | 'approved'
        }

        const mapped: PrefInterpreter[] = profilesRes.data.map(p => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          name: p.name,
          photo_url: p.photo_url,
          certs: certsMap[p.id] || [],
          tier: tierMap[p.id] || 'preferred',
        }))
        // Sort: preferred first, then approved
        mapped.sort((a, b) => {
          if (a.tier === b.tier) return 0
          return a.tier === 'preferred' ? -1 : 1
        })
        setPrefInterpreters(mapped)
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Close modal on Escape
  useEffect(() => {
    if (!modalBooking) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalBooking(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [modalBooking])

  const displayName = firstName || 'there'

  if (loading) {
    return (
      <div style={{ padding: '60px 32px', color: 'var(--muted)', textAlign: 'center' }}>
        Loading your dashboard...
      </div>
    )
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.6rem', margin: '0 0 6px' }}>
          Welcome back, {displayName}.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>Here&apos;s a snapshot of your activity on signpost.</p>
      </div>

      {/* Stat cards + request link */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, alignItems: 'stretch' }}>
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, flex: 1, alignItems: 'stretch' }}>
          <StatCard num={activeRequests} label="Active Requests" href="/dhh/dashboard/requests" />
          <StatCard num={prefCount} label="Preferred Interpreters" href="/dhh/dashboard/interpreters" />
          <StatCard num={secCount} label="Secondary Tier" href="/dhh/dashboard/interpreters" />
          <StatCard num={circleCount} label="Trusted Circle" href="/dhh/dashboard/circle" />
        </div>
        <InterpreterRequestLinkCard />
      </div>

      {/* Two-column layout */}
      <div className="dhh-overview-columns" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* LEFT: Recent Requests */}
        <div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#9d87ff', marginBottom: 12,
          }}>
            Recent Requests
          </div>

          {recentBookings.length === 0 ? (
            <div style={{
              background: '#111118', border: '1px solid #1e2433',
              borderRadius: 'var(--radius)', padding: '32px 24px',
              color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
            }}>
              No requests yet. When someone books an interpreter for you, it will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentBookings.map(booking => (
                <RecentRequestCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => setModalBooking(booking)}
                />
              ))}

              <Link
                href="/dhh/dashboard/requests"
                style={{
                  color: '#9d87ff', fontSize: '0.85rem', fontWeight: 600,
                  textDecoration: 'none', display: 'inline-block', marginTop: 4,
                }}
              >
                View all requests &#8594;
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT: Preferred Interpreters */}
        <div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#9d87ff', marginBottom: 12,
          }}>
            Preferred Interpreters
          </div>

          {prefInterpreters.length === 0 ? (
            <div style={{
              background: '#111118', border: '1px solid #1e2433',
              borderRadius: 'var(--radius)', padding: '32px 24px',
              color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
            }}>
              <div style={{ marginBottom: 12 }}>You haven&apos;t added any preferred interpreters yet.</div>
              <Link
                href="/directory"
                className="btn-primary"
                style={{ textDecoration: 'none', display: 'inline-block', padding: '9px 20px', fontSize: '0.85rem' }}
              >
                + Browse the directory
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prefInterpreters.map(interp => {
                const name = getDisplayName(interp.first_name, interp.last_name, interp.name)
                const initials = getInitials(interp.first_name, interp.last_name, interp.name)
                const tierBadge = interp.tier === 'preferred'
                  ? { label: 'Preferred', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' }
                  : { label: 'Secondary Tier', color: 'var(--accent)', bg: 'rgba(0,229,255,0.1)', border: 'rgba(0,229,255,0.3)' }

                return (
                  <div key={interp.id} style={{
                    background: '#111118', border: '1px solid #1e2433',
                    borderRadius: 'var(--radius)', padding: '16px 18px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'border-color 0.15s',
                  }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(157,135,255,0.3)')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = '#1e2433')}
                  >
                    <Link href={`/directory/${interp.id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                      {interp.photo_url ? (
                        <img src={interp.photo_url} alt={name} style={{
                          width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
                          border: '2px solid #9d87ff',
                        }} />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.82rem', color: '#fff',
                        }}>
                          {initials}
                        </div>
                      )}
                    </Link>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link href={`/directory/${interp.id}`} style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', textDecoration: 'none' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none' }}
                        >{name}</Link>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 600, padding: '1px 8px',
                          borderRadius: 100, background: tierBadge.bg,
                          color: tierBadge.color, border: `1px solid ${tierBadge.border}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {tierBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              <Link
                href="/directory"
                style={{
                  color: '#9d87ff', fontSize: '0.85rem', fontWeight: 600,
                  textDecoration: 'none', display: 'inline-block', marginTop: 4,
                }}
              >
                + Browse Interpreters to Add
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal for booking details */}
      {modalBooking && (
        <DetailModal booking={modalBooking} onClose={() => setModalBooking(null)} />
      )}

      <DashMobileStyles />

      <style>{`
        @media (max-width: 768px) {
          .dhh-overview-columns {
            grid-template-columns: 1fr !important;
          }
          .dhh-modal-cols {
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
