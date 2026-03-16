'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, SectionLabel, DemoBadge, GhostButton, Avatar, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import VideoRecorder from '@/components/ui/VideoRecorder'
import { getVideoEmbedUrl } from '@/lib/videoUtils'
import BookingFilterBar, { filterBySearch, filterByDateRange, groupByTimeCategory, timeCategoryHeaderStyle } from '@/components/dashboard/shared/BookingFilterBar'

/* ── Types ── */

interface Recipient {
  id: string
  interpreter_id: string
  status: string
  interpreter: {
    name: string
    first_name?: string | null
    last_name?: string | null
    photo_url?: string | null
  } | null
}

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
  status: string
  request_type: string | null
  interpreter_count: number | null
  is_seed: boolean | null
  cancellation_reason: string | null
  sub_search_initiated: boolean | null
  created_at: string
  recipients: Recipient[]
  context_video_url?: string | null
}

interface MockBooking extends Booking {
  requester_display: string
  comm_prefs_summary: string
  replacement_info?: {
    message: string
    interpreters: { name: string; languages: string; specs: string; status: 'awaiting' | 'available' }[]
  }
}

/* ── Helpers ── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
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

/* ── Styles ── */

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 20,
}

/* ── Status Badges ── */

function ConfirmedBadge() {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: 100, whiteSpace: 'nowrap',
      background: 'rgba(52,211,153,0.1)', color: '#34d399',
      border: '1px solid rgba(52,211,153,0.3)',
      fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em',
    }}>
      Confirmed
    </span>
  )
}

function CancelledBadge({ reason }: { reason: string | null }) {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: 100, whiteSpace: 'nowrap',
      background: 'rgba(255,107,133,0.1)', color: '#ff6b85',
      border: '1px solid rgba(255,107,133,0.3)',
      fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em',
    }}>
      Cancelled{reason ? ` — ${reason}` : ''}
    </span>
  )
}

function OpenBadge() {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: 100, whiteSpace: 'nowrap',
      background: 'rgba(255,165,0,0.12)', color: '#f97316',
      border: '1px solid rgba(249,115,22,0.25)',
      fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em',
    }}>
      Open
    </span>
  )
}

/* ── Purple "Message Requester" button ── */

function MessageRequesterButton({ requesterName, onToast, disabled, tooltip }: {
  requesterName: string
  onToast: (msg: string) => void
  disabled?: boolean
  tooltip?: string
}) {
  const [hover, setHover] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => {
          if (!disabled) {
            onToast(`Message sent to ${requesterName}. They'll see it in their signpost inbox.`)
          }
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        disabled={disabled}
        style={{
          background: disabled ? 'var(--surface2)' : (hover ? 'rgba(123,97,255,0.15)' : 'rgba(123,97,255,0.1)'),
          border: `1px solid ${disabled ? 'var(--border)' : 'rgba(123,97,255,0.4)'}`,
          borderRadius: 'var(--radius-sm)',
          color: disabled ? 'var(--muted)' : '#9d87ff',
          fontSize: '0.82rem', padding: '8px 16px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        Message Requester
      </button>
      {disabled && hover && tooltip && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '6px 12px',
          fontSize: '0.75rem', color: 'var(--muted)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          zIndex: 10,
        }}>
          {tooltip}
        </div>
      )}
    </div>
  )
}

/* ── DNB Warning Banner ── */

function DnbWarningBanner({ requesterName, onToast }: { requesterName: string; onToast: (msg: string) => void }) {
  return (
    <div style={{
      background: 'rgba(255,107,133,0.08)',
      border: '1px solid rgba(255,107,133,0.35)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      marginBottom: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ fontSize: '0.85rem', color: '#ff6b85', fontWeight: 600, lineHeight: 1.5 }}>
        This interpreter is on your Do Not Book list.
      </div>
      <MessageRequesterButton requesterName={requesterName} onToast={onToast} />
    </div>
  )
}

/* ── Replacement Alert Banner ── */

function ReplacementAlertBanner() {
  return (
    <div style={{
      background: 'rgba(255,107,133,0.06)',
      border: '1px solid rgba(255,107,133,0.25)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 16px',
      marginBottom: 14,
      fontSize: '0.84rem', color: '#ff6b85', lineHeight: 1.55,
    }}>
      A replacement is being found for this appointment. You&apos;ll be updated as it progresses.
    </div>
  )
}

/* ── Replacement Info Box ── */

function ReplacementInfoBox({ info }: { info: NonNullable<MockBooking['replacement_info']> }) {
  return (
    <div style={{
      background: 'rgba(0,229,255,0.04)',
      border: '1px solid rgba(0,229,255,0.2)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 18px',
      marginTop: 12,
    }}>
      <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>
        {info.message}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {info.interpreters.map((interp, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, padding: '8px 12px',
            background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: '0.84rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{interp.name}</span>
              <span style={{ color: 'var(--muted)' }}> · {interp.languages} · {interp.specs}</span>
            </div>
            {interp.status === 'awaiting' ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                Awaiting response
              </span>
            ) : (
              <span style={{ fontSize: '0.78rem', color: '#00e5ff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                Available
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Detail Modal (read-only) ── */

function DetailModal({ booking, onClose, onToast }: {
  booking: MockBooking
  onClose: () => void
  onToast: (msg: string) => void
}) {
  const isRemote = booking.format === 'remote'
  const isCancelled = booking.status === 'cancelled'
  const isSelfRequest = !booking.requester_display

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10,
  }
  const detailRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 6,
  }
  const iconStyle: React.CSSProperties = { color: 'var(--muted)', flexShrink: 0, marginTop: 2 }
  const sectionStyle: React.CSSProperties = { padding: '16px 0', borderBottom: '1px solid var(--border)' }

  // Get confirmed interpreters from recipients
  const confirmedRecipients = booking.recipients.filter(r => r.status === 'confirmed')

  return (
    <div role="presentation" style={overlayStyle} onClick={onClose}>
      <div className="modal-dialog" style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '90%', maxWidth: 560,
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>
              {booking.title || 'Booking'}
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>&#10005;</button>
          </div>
          {isCancelled
            ? <CancelledBadge reason={booking.cancellation_reason} />
            : booking.status === 'filled'
              ? <ConfirmedBadge />
              : <OpenBadge />
          }
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
                <div>{formatDate(booking.date)}</div>
                <div style={{ fontWeight: 600 }}>{formatTime(booking.time_start, booking.time_end)}</div>
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
              <div>{isRemote ? 'Remote' : (booking.location || 'TBD')}</div>
            </div>
          </div>

          {/* Interpreters Assigned */}
          {confirmedRecipients.length > 0 && (
            <div style={sectionStyle}>
              <div style={sectionLabelStyle}>Interpreter{confirmedRecipients.length > 1 ? 's' : ''} Assigned</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {confirmedRecipients.map(r => {
                  const interp = r.interpreter
                  const interpName = interp?.name || 'Interpreter'
                  const initials = interp?.first_name
                    ? `${interp.first_name[0]}${interp.last_name?.[0] || ''}`.toUpperCase()
                    : interpName[0]?.toUpperCase() || 'I'
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar initials={initials} gradient="linear-gradient(135deg,#9d87ff,#00e5ff)" size={36} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{interpName}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Communication Preferences */}
          {booking.comm_prefs_summary && (
            <div style={sectionStyle}>
              <div style={sectionLabelStyle}>Your Communication Preferences Shared</div>
              <div style={{
                fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65,
                fontStyle: 'italic',
              }}>
                {booking.comm_prefs_summary}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <GhostButton onClick={onClose}>Close</GhostButton>
          {!isSelfRequest && (
            <MessageRequesterButton
              requesterName={booking.requester_name || 'Requester'}
              onToast={onToast}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Booking Card (D/HH read-only) ── */

function DhhBookingCard({ booking, dnbInterpreterIds, onViewDetails, onToast, onAddContextVideo }: {
  booking: MockBooking
  dnbInterpreterIds: Set<string>
  onViewDetails: () => void
  onToast: (msg: string) => void
  onAddContextVideo?: (bookingId: string) => void
}) {
  const isCancelled = booking.status === 'cancelled'
  const isSelfRequest = !booking.requester_display

  // DNB check: compare confirmed interpreter IDs against DNB set
  const confirmedRecipients = booking.recipients.filter(r => r.status === 'confirmed')
  const hasDnb = confirmedRecipients.some(r => dnbInterpreterIds.has(r.interpreter_id))

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '24px 24px', marginBottom: 24,
      opacity: isCancelled && !booking.sub_search_initiated ? 0.75 : 1,
    }}>
      {/* DNB warning */}
      {hasDnb && !isCancelled && (
        <DnbWarningBanner requesterName={booking.requester_name || 'Requester'} onToast={onToast} />
      )}

      {/* Replacement alert for cancelled bookings with active sub search */}
      {isCancelled && booking.sub_search_initiated && (
        <ReplacementAlertBanner />
      )}

      {/* Header — date-first */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>{formatDate(booking.date)} &middot; {formatTime(booking.time_start, booking.time_end)}</span>
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
              borderRadius: 100,
              ...(booking.format === 'remote'
                ? { background: 'rgba(123,97,255,0.15)', color: '#7b61ff', border: '1px solid rgba(123,97,255,0.25)' }
                : { background: 'rgba(0,229,255,0.15)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.25)' }),
            }}>
              {booking.format === 'remote' ? 'Remote' : 'In-person'}
            </span>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 3 }}>
            {booking.title || 'Booking'}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 2 }}>
            {booking.requester_display || 'You requested this directly'} · {booking.specialization || 'General'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {booking.is_seed && <DemoBadge />}
          {isCancelled
            ? <CancelledBadge reason={booking.cancellation_reason} />
            : booking.status === 'filled'
              ? <ConfirmedBadge />
              : <OpenBadge />
          }
        </div>
      </div>

      {/* Interpreter rows (from recipients) */}
      {confirmedRecipients.length > 0 && (
        <div style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
          {confirmedRecipients.map(r => {
            const interp = r.interpreter
            const interpName = interp?.name || 'Interpreter'
            const initials = interp?.first_name
              ? `${interp.first_name[0]}${interp.last_name?.[0] || ''}`.toUpperCase()
              : interpName[0]?.toUpperCase() || 'I'
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6,
              }}>
                <Avatar initials={initials} gradient="linear-gradient(135deg,#7b61ff,#00e5ff)" size={32} />
                <div style={{ fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{interpName}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Replacement info for cancelled with sub search */}
      {isCancelled && booking.sub_search_initiated && booking.replacement_info && (
        <ReplacementInfoBox info={booking.replacement_info} />
      )}

      {/* Context video preview */}
      {booking.context_video_url && (() => {
        const embedUrl = getVideoEmbedUrl(booking.context_video_url!)
        if (!embedUrl) return null
        return (
          <div style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
              Context Video
            </div>
            {embedUrl.includes('supabase.co/storage') ? (
              <video controls width="100%" src={embedUrl} style={{ borderRadius: 8, maxHeight: 180, background: '#000' }} />
            ) : (
              <iframe width="100%" height="180" src={embedUrl} title="Context video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                style={{ borderRadius: 8, border: 'none' }} />
            )}
          </div>
        )
      })()}

      {/* Actions */}
      <div className="dash-card-actions" style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <GhostButton onClick={onViewDetails}>View Details</GhostButton>
        {!booking.context_video_url && !isCancelled && onAddContextVideo && (
          <button
            onClick={() => onAddContextVideo(booking.id)}
            style={{
              background: 'none', border: '1px solid rgba(123,97,255,0.4)',
              borderRadius: 'var(--radius-sm)', padding: '8px 16px',
              color: '#9d87ff', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            Add context video
          </button>
        )}
        {!isSelfRequest && (
          <MessageRequesterButton
            requesterName={booking.requester_name || 'Requester'}
            onToast={onToast}
          />
        )}
        {isSelfRequest && (
          <MessageRequesterButton
            requesterName=""
            onToast={onToast}
            disabled
            tooltip="You made this request directly"
          />
        )}
      </div>
    </div>
  )
}

/* ── Empty State ── */

function EmptyState() {
  return (
    <div style={{
      border: '2px dashed var(--border)',
      borderRadius: 'var(--radius)',
      padding: '32px 24px',
      textAlign: 'center',
      color: 'var(--muted)',
      fontSize: '0.88rem',
      lineHeight: 1.6,
    }}>
      No bookings yet. When a request is made, it will appear here with real-time updates.
    </div>
  )
}

/* ── Mock Data ── */

const MOCK_ON_BEHALF_CONFIRMED: MockBooking = {
  id: 'mock-behalf-1',
  title: 'Cardiology Appointment',
  requester_name: 'Alex Rivera',
  requester_display: 'Alex Rivera (Seattle Medical Center)',
  specialization: 'Medical',
  date: '2026-03-04',
  time_start: '14:00',
  time_end: '16:00',
  location: 'Seattle Medical Center, Floor 3',
  format: 'in_person',
  status: 'filled',
  request_type: 'professional',
  interpreter_count: 1,
  is_seed: true,
  cancellation_reason: null,
  sub_search_initiated: null,
  created_at: '2026-03-01T00:00:00Z',
  comm_prefs_summary: 'Black ASL preferred. Prefers interpreter positioned directly across.',
  recipients: [
    {
      id: 'mock-r-1',
      interpreter_id: 'mock-interp-1',
      status: 'confirmed',
      interpreter: {
        name: 'Sofia Reyes',
        first_name: 'Sofia',
        last_name: 'Reyes',
        photo_url: null,
      },
    },
  ],
}

const MOCK_ON_BEHALF_CANCELLED: MockBooking = {
  id: 'mock-behalf-2',
  title: 'Legal Consultation',
  requester_name: 'Alex Rivera',
  requester_display: 'Alex Rivera',
  specialization: 'Legal',
  date: '2026-02-22',
  time_start: '10:30',
  time_end: '12:00',
  location: 'Remote (Zoom)',
  format: 'remote',
  status: 'cancelled',
  request_type: 'professional',
  interpreter_count: 1,
  is_seed: true,
  cancellation_reason: 'Illness',
  sub_search_initiated: true,
  created_at: '2026-02-18T00:00:00Z',
  comm_prefs_summary: 'Black ASL preferred. Prefers interpreter positioned directly across.',
  recipients: [
    {
      id: 'mock-r-2',
      interpreter_id: 'mock-interp-2',
      status: 'confirmed',
      interpreter: {
        name: 'Sofia Reyes',
        first_name: 'Sofia',
        last_name: 'Reyes',
        photo_url: null,
      },
    },
  ],
  replacement_info: {
    message: 'Your requester is looking for a replacement interpreter. The request has been forwarded to 2 interpreters.',
    interpreters: [
      { name: 'Marcus Kim', languages: 'ASL', specs: 'Medical, Legal', status: 'awaiting' },
      { name: 'Priya Nair', languages: 'ASL', specs: 'Medical', status: 'available' },
    ],
  },
}

/* ── Main Page ── */

export default function DhhBookingsPage() {
  const [selfBookings, setSelfBookings] = useState<MockBooking[]>([])
  const [onBehalfBookings] = useState<MockBooking[]>([MOCK_ON_BEHALF_CONFIRMED, MOCK_ON_BEHALF_CANCELLED])
  const [dnbInterpreterIds, setDnbInterpreterIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [contextVideoBookingId, setContextVideoBookingId] = useState<string | null>(null)
  const [videoRecorderOpen, setVideoRecorderOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Fetch bookings where this user is a DHH client (via booking_dhh_clients)
    // or where they are the requester
    try {
      const res = await fetch('/api/dhh/request')
      const data = await res.json()
      if (data.bookings) {
        const realSelfBookings: MockBooking[] = data.bookings
          .filter((b: BookingWithRecipients) => b.request_type === 'personal')
          .map((b: BookingWithRecipients) => ({
            ...b,
            requester_display: '',
            comm_prefs_summary: '',
          }))
        if (realSelfBookings.length === 0) {
          // Show a mock self-booking
          setSelfBookings([{
            id: 'mock-self-1',
            title: 'ASL Practice',
            requester_name: null,
            requester_display: '',
            specialization: 'Education',
            date: '2026-03-12',
            time_start: '10:00',
            time_end: '11:30',
            location: 'Seattle Community Center, Room 204',
            format: 'in_person',
            status: 'filled',
            request_type: 'personal',
            interpreter_count: 1,
            is_seed: true,
            cancellation_reason: null,
            sub_search_initiated: null,
            created_at: '2026-03-08T00:00:00Z',
            comm_prefs_summary: 'Black ASL preferred. Prefers interpreter positioned directly across.',
            recipients: [
              {
                id: 'mock-r-self',
                interpreter_id: 'mock-interp-mk',
                status: 'confirmed',
                interpreter: {
                  name: 'Marcus Kim',
                  first_name: 'Marcus',
                  last_name: 'Kim',
                  photo_url: null,
                },
              },
            ],
          }])
        } else {
          setSelfBookings(realSelfBookings)
        }
      }
    } catch (err) {
      console.error('[dhh-bookings] fetch failed:', err)
    }

    // DNB list: query deaf_roster for interpreters flagged as DNB tier
    const { data: deafProfile } = await supabase
      .from('deaf_profiles')
      .select('id')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()

    const deafUserId = deafProfile?.id || user.id

    const { data: dnbData } = await supabase
      .from('deaf_roster')
      .select('interpreter_id')
      .eq('deaf_user_id', deafUserId)
      .eq('tier', 'dnb')

    const dnbIds = new Set((dnbData || []).map(d => d.interpreter_id))
    setDnbInterpreterIds(dnbIds)

    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const searchFields: (keyof MockBooking)[] = ['title', 'requester_name', 'location', 'specialization']
  const filteredSelf = filterByDateRange(filterBySearch(selfBookings, search, searchFields), dateFrom, dateTo)
  const filteredOnBehalf = filterByDateRange(filterBySearch(onBehalfBookings, search, searchFields), dateFrom, dateTo)
  const groupedSelf = groupByTimeCategory(filteredSelf)
  const groupedOnBehalf = groupByTimeCategory(filteredOnBehalf)
  const allBookings = [...selfBookings, ...onBehalfBookings]
  const viewingBooking = allBookings.find(b => b.id === viewing)

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>

      <PageHeader title="My Bookings" subtitle="Appointments scheduled for you, requested by you or on your behalf." />

      <BookingFilterBar
        search={search} onSearchChange={setSearch}
        dateFrom={dateFrom} onDateFromChange={setDateFrom}
        dateTo={dateTo} onDateToChange={setDateTo}
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Loading...
        </div>
      ) : (
        <>
          {/* Section A: Requests Made by You */}
          <SectionLabel>Requests Made by You</SectionLabel>
          {groupedSelf.length === 0 ? (
            <EmptyState />
          ) : (
            groupedSelf.map((group, gi) => (
              <div key={group.label} style={group.isPast ? { opacity: 0.6 } : undefined}>
                <div style={{ ...timeCategoryHeaderStyle, marginTop: gi === 0 ? 0 : 32 }}>{group.label}</div>
                {group.items.map(b => (
                  <DhhBookingCard
                    key={b.id}
                    booking={b}
                    dnbInterpreterIds={dnbInterpreterIds}
                    onViewDetails={() => setViewing(b.id)}
                    onToast={showToast}
                    onAddContextVideo={(bookingId) => {
                      setContextVideoBookingId(bookingId)
                      setVideoRecorderOpen(true)
                    }}
                  />
                ))}
              </div>
            ))
          )}

          {/* Section B: Requests Made on Your Behalf */}
          <SectionLabel>Requests Made on Your Behalf</SectionLabel>
          {groupedOnBehalf.length === 0 ? (
            <EmptyState />
          ) : (
            groupedOnBehalf.map((group, gi) => (
              <div key={group.label} style={group.isPast ? { opacity: 0.6 } : undefined}>
                <div style={{ ...timeCategoryHeaderStyle, marginTop: gi === 0 ? 0 : 32 }}>{group.label}</div>
                {group.items.map(b => (
                  <DhhBookingCard
                    key={b.id}
                    booking={b}
                    dnbInterpreterIds={dnbInterpreterIds}
                    onViewDetails={() => setViewing(b.id)}
                    onToast={showToast}
                    onAddContextVideo={(bookingId) => {
                      setContextVideoBookingId(bookingId)
                      setVideoRecorderOpen(true)
                    }}
                  />
                ))}
              </div>
            ))
          )}
        </>
      )}

      {/* Detail Modal */}
      {viewing && viewingBooking && (
        <DetailModal
          booking={viewingBooking}
          onClose={() => setViewing(null)}
          onToast={showToast}
        />
      )}

      {/* Context Video Recorder */}
      <VideoRecorder
        isOpen={videoRecorderOpen}
        onClose={() => { setVideoRecorderOpen(false); setContextVideoBookingId(null) }}
        onVideoSaved={async (url) => {
          setVideoRecorderOpen(false)
          if (contextVideoBookingId) {
            try {
              await fetch('/api/dhh/context-video', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId: contextVideoBookingId,
                  contextVideoUrl: url,
                  contextVideoVisibleBeforeAccept: true,
                }),
              })
              showToast('Context video added')
              // Update local state
              setSelfBookings(prev => prev.map(b =>
                b.id === contextVideoBookingId ? { ...b, context_video_url: url } : b
              ))
            } catch {
              showToast('Failed to save context video')
            }
          }
          setContextVideoBookingId(null)
        }}
        accentColor="#7b61ff"
        storageBucket="videos"
        storagePath="context"
      />

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

// Type used for fetch parsing
interface BookingWithRecipients {
  id: string
  title: string | null
  date: string
  time_start: string
  time_end: string
  location: string | null
  format: string | null
  status: string
  request_type: string | null
  interpreter_count: number | null
  is_seed: boolean | null
  cancellation_reason: string | null
  sub_search_initiated: boolean | null
  created_at: string
  recipients: Recipient[]
  [key: string]: unknown
}
