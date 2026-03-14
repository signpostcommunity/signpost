'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { BetaBanner, PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import RequestTracker from '@/components/dashboard/dhh/RequestTracker'
import InterpreterRating from '@/components/dashboard/dhh/InterpreterRating'
import { createClient } from '@/lib/supabase/client'

interface BookingWithInterpreter {
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
  cancellation_reason: string | null
  cancelled_at?: string | null
  created_at: string
  interpreter_id: string
  requester_id?: string | null
  dhh_client_id?: string | null
  interpreter: {
    name: string
    first_name: string | null
    last_name: string | null
    photo_url: string | null
  } | null
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

function isBookingCompleted(booking: BookingWithInterpreter): boolean {
  if (booking.status === 'completed') return true
  if (booking.status === 'confirmed') {
    return new Date(booking.date + 'T23:59:59') < new Date()
  }
  return false
}

function RequestCard({ booking, onExpand, expanded, ratedBookings, onRated }: {
  booking: BookingWithInterpreter
  onExpand: () => void
  expanded: boolean
  ratedBookings: Set<string>
  onRated: (bookingId: string) => void
}) {
  const interp = booking.interpreter
  const interpName = interp?.name || 'Interpreter'
  const interpInitials = interp?.first_name
    ? `${interp.first_name[0]}${interp.last_name?.[0] || ''}`.toUpperCase()
    : interpName[0]?.toUpperCase() || 'I'

  const completed = isBookingCompleted(booking)
  const hasRating = ratedBookings.has(booking.id)
  const isDismissed = booking.status === 'cancelled' || booking.status === 'declined'

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', marginBottom: 12, overflow: 'hidden',
      opacity: isDismissed ? 0.6 : 1,
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
            fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif",
            color: 'var(--text)', marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            {booking.title || 'Interpreter Request'}
            {isDismissed && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px',
                borderRadius: 100, background: 'rgba(255,107,133,0.15)',
                color: '#ff6b85',
              }}>
                {booking.status === 'cancelled' ? 'Cancelled' : 'Declined'}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span>{formatDate(booking.date)}</span>
            <span>{formatTime(booking.time_start, booking.time_end)}</span>
            <FormatBadge format={booking.format} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {interp?.photo_url ? (
            <img
              src={interp.photo_url}
              alt=""
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.7rem', color: '#fff',
            }}>
              {interpInitials}
            </div>
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          padding: '0 24px 20px', borderTop: '1px solid var(--border)',
        }}>
          <div style={{ paddingTop: 16 }}>
            {/* Full tracker */}
            <RequestTracker booking={booking} hasRating={hasRating} />

            {/* Interpreter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
              {interp?.photo_url ? (
                <img src={interp.photo_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.75rem', color: '#fff',
                }}>
                  {interpInitials}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{interpName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Interpreter</div>
              </div>
            </div>

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

            {/* Rating UI — shows when booking is completed */}
            {completed && booking.interpreter_id && (
              <InterpreterRating
                bookingId={booking.id}
                interpreterId={booking.interpreter_id}
                interpreterName={interpName}
                onRated={() => onRated(booking.id)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

type Tab = 'professional' | 'personal'

export default function DhhRequestsListPage() {
  const [bookings, setBookings] = useState<BookingWithInterpreter[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [ratedBookings, setRatedBookings] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<Tab>('professional')

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

  // Fetch which bookings have already been rated
  const fetchRatings = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('interpreter_ratings')
        .select('booking_id')

      if (data) {
        setRatedBookings(new Set(data.map(r => r.booking_id)))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchRequests()
    fetchRatings()
  }, [fetchRequests, fetchRatings])

  function handleRated(bookingId: string) {
    setRatedBookings(prev => new Set(prev).add(bookingId))
  }

  // Filter bookings by tab
  const professionalBookings = bookings.filter(b => b.request_type === 'professional' || (!b.request_type && !b.requester_id))
  const personalBookings = bookings.filter(b => b.request_type === 'personal')
  const activeBookings = activeTab === 'professional' ? professionalBookings : personalBookings

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
      <BetaBanner />
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
        activeBookings.map(b => (
          <RequestCard
            key={b.id}
            booking={b}
            expanded={expandedId === b.id}
            onExpand={() => setExpandedId(expandedId === b.id ? null : b.id)}
            ratedBookings={ratedBookings}
            onRated={handleRated}
          />
        ))
      )}

      <DashMobileStyles />
    </div>
  )
}
