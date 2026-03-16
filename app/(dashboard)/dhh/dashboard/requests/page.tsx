'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { BetaBanner, PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import RequestTracker from '@/components/dashboard/dhh/RequestTracker'
import InterpreterRating from '@/components/dashboard/dhh/InterpreterRating'
import { createClient } from '@/lib/supabase/client'
import BookingFilterBar, { filterBySearch, filterByDateRange, sortSoonestFirst } from '@/components/dashboard/shared/BookingFilterBar'

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
  recipients: Recipient[]
}

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

function FormatBadge({ format }: { format: string | null }) {
  if (!format) return null
  const label = format === 'in_person' ? 'In-person' : format === 'remote' ? 'Remote' : 'Hybrid'
  const colors = format === 'in_person'
    ? { bg: 'rgba(0,229,255,0.15)', color: '#00e5ff', border: 'rgba(0,229,255,0.25)' }
    : format === 'remote'
    ? { bg: 'rgba(123,97,255,0.15)', color: '#7b61ff', border: 'rgba(123,97,255,0.25)' }
    : { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: 'rgba(249,115,22,0.25)' }
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
      borderRadius: 100, background: colors.bg,
      color: colors.color, border: `1px solid ${colors.border}`,
    }}>
      {label}
    </span>
  )
}

function isBookingCompleted(booking: BookingWithRecipients): boolean {
  if (booking.status === 'completed') return true
  if (booking.status === 'filled') {
    return new Date(booking.date + 'T23:59:59') < new Date()
  }
  return false
}

/* Recipient status pill */
function StatusPill({ status, rate, showRate = true }: { status: string; rate?: number | null; showRate?: boolean }) {
  const displayRate = showRate ? rate : null
  const configs: Record<string, { bg: string; color: string; label: string; dot: string }> = {
    sent: { bg: 'rgba(184,191,207,0.1)', color: 'var(--muted)', label: 'Awaiting response', dot: '#6b7280' },
    viewed: { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', label: 'Viewed', dot: '#60a5fa' },
    responded: { bg: 'rgba(0,229,255,0.1)', color: '#00e5ff', label: displayRate ? `Available — $${displayRate}/hr` : 'Available', dot: '#00e5ff' },
    confirmed: { bg: 'rgba(52,211,153,0.1)', color: '#34d399', label: 'Confirmed', dot: '#34d399' },
    declined: { bg: 'rgba(255,107,133,0.08)', color: '#ff8099', label: 'Unavailable', dot: '#ff6b85' },
    withdrawn: { bg: 'rgba(184,191,207,0.06)', color: 'var(--muted)', label: 'Withdrawn', dot: '#6b7280' },
  }
  const c = configs[status] || configs.sent
  const isWithdrawn = status === 'withdrawn'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: '0.74rem', fontWeight: 500, padding: '3px 10px',
      borderRadius: 100, background: c.bg, color: c.color,
      textDecoration: isWithdrawn ? 'line-through' : undefined,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: c.dot, flexShrink: 0,
      }} />
      {c.label}
    </span>
  )
}

/* Interpreter status list */
function InterpreterStatusList({ recipients, interpCount, showRate = true }: { recipients: Recipient[]; interpCount: number; showRate?: boolean }) {
  const confirmedCount = recipients.filter(r => r.status === 'confirmed').length
  const allConfirmed = confirmedCount >= interpCount && interpCount > 0

  return (
    <div style={{ marginBottom: 14, marginTop: 8 }}>
      <div style={{
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 8,
      }}>
        Interpreter Status
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recipients.map(r => {
          const interp = r.interpreter
          const interpName = interp?.name || 'Interpreter'
          const initials = interp?.first_name
            ? `${interp.first_name[0]}${interp.last_name?.[0] || ''}`.toUpperCase()
            : interpName[0]?.toUpperCase() || 'I'

          return (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 10, padding: '6px 10px',
              background: 'rgba(255,255,255,0.02)', borderRadius: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {interp?.photo_url ? (
                  <img src={interp.photo_url} alt="" style={{
                    width: 24, height: 24, borderRadius: '50%', objectFit: 'cover',
                  }} />
                ) : (
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.55rem', color: '#fff',
                  }}>
                    {initials}
                  </div>
                )}
                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{interpName}</span>
              </div>
              <StatusPill status={r.status} rate={r.response_rate} showRate={showRate} />
            </div>
          )
        })}
      </div>
      {interpCount > 1 && (
        <div style={{
          fontSize: '0.75rem', marginTop: 8,
          color: allConfirmed ? '#34d399' : 'var(--muted)',
          fontWeight: allConfirmed ? 600 : 400,
        }}>
          {allConfirmed
            ? 'All interpreters confirmed'
            : `${confirmedCount} of ${interpCount} interpreter${interpCount !== 1 ? 's' : ''} confirmed`
          }
        </div>
      )}
    </div>
  )
}

/* Chevron icon */
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

function RequestCard({ booking, onExpand, expanded, ratedInterpreters, onRated }: {
  booking: BookingWithRecipients
  onExpand: () => void
  expanded: boolean
  ratedInterpreters: Set<string>
  onRated: (key: string) => void
}) {
  const isDismissed = booking.status === 'cancelled'
  const allDeclined = booking.status === 'open' &&
    booking.recipients.length > 0 &&
    booking.recipients.filter(r => r.status !== 'withdrawn').every(r => r.status === 'declined')
  const completed = isBookingCompleted(booking)
  const confirmedRecipients = booking.recipients.filter(r => r.status === 'confirmed')

  // Check if ALL confirmed interpreters on this booking have been rated
  const allRated = confirmedRecipients.length > 0 &&
    confirmedRecipients.every(r => ratedInterpreters.has(`${booking.id}:${r.interpreter_id}`))

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
      opacity: isDismissed || allDeclined ? 0.6 : 1,
    }}>
      {/* Card header — clickable */}
      <button
        onClick={onExpand}
        aria-expanded={expanded}
        style={{
          width: '100%', padding: '18px 24px 14px', cursor: 'pointer',
          background: 'none', border: 'none', textAlign: 'left',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 700, fontSize: '1.05rem',
            color: 'var(--text)', marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <span>{formatDate(booking.date)} &middot; {formatTime(booking.time_start, booking.time_end)}</span>
            <FormatBadge format={booking.format} />
            {isDismissed && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px',
                borderRadius: 100, background: 'rgba(255,107,133,0.15)',
                color: '#ff6b85',
              }}>
                Cancelled
              </span>
            )}
            {allDeclined && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px',
                borderRadius: 100, background: 'rgba(255,107,133,0.15)',
                color: '#ff6b85',
              }}>
                All Unavailable
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            {booking.title || 'Interpreter Request'}
          </div>

          {/* Compact tracker in collapsed view */}
          {!expanded && (
            <div style={{ marginTop: 8 }}>
              <RequestTracker booking={booking} recipients={booking.recipients} compact hasRating={allRated} />
            </div>
          )}
        </div>

        <ChevronIcon expanded={expanded} />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          padding: '0 24px 20px', borderTop: '1px solid var(--border)',
        }}>
          <div style={{ paddingTop: 16 }}>
            {/* Full tracker */}
            <RequestTracker booking={booking} recipients={booking.recipients} hasRating={allRated} />

            {/* Interpreter status list */}
            {booking.recipients.length > 0 && (
              <InterpreterStatusList
                recipients={booking.recipients}
                interpCount={booking.interpreter_count || 1}
                showRate={booking.request_type !== 'professional'}
              />
            )}

            {/* Location */}
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>Location: </span>
              {booking.format === 'remote' ? 'Remote' : booking.location || 'TBD'}
            </div>

            {/* Event type */}
            {booking.event_category && (
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Event: </span>
                {booking.event_category}{booking.event_type ? ` — ${booking.event_type}` : ''}
              </div>
            )}

            {/* Notes */}
            {(booking.description || booking.notes) && (
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8, lineHeight: 1.55 }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>Notes: </span>
                {booking.description || booking.notes}
              </div>
            )}

            {/* Cancellation reason */}
            {booking.status === 'cancelled' && booking.cancellation_reason && (
              <div style={{ fontSize: '0.85rem', color: '#ff6b85', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>Cancellation reason: </span>
                {booking.cancellation_reason}
              </div>
            )}

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
  const activeBookings = sortSoonestFirst(
    filterByDateRange(
      filterBySearch(tabBookings, search, ['title', 'location', 'description', 'notes']),
      dateFrom, dateTo
    )
  )

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '10px 20px', fontFamily: "'Syne', sans-serif", fontWeight: 700,
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
      ) : activeBookings.length === 0 ? (
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
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                New Request
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeBookings.map(b => (
            <RequestCard
              key={b.id}
              booking={b}
              expanded={expandedId === b.id}
              onExpand={() => setExpandedId(expandedId === b.id ? null : b.id)}
              ratedInterpreters={ratedInterpreters}
              onRated={handleRated}
            />
          ))}
        </div>
      )}

      <DashMobileStyles />
    </div>
  )
}
