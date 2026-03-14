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
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
      borderRadius: 100, background: 'rgba(0,229,255,0.08)',
      color: 'var(--accent)', border: '1px solid rgba(0,229,255,0.2)',
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

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', marginBottom: 12, overflow: 'hidden',
    }}>
      {/* Card header — clickable */}
      <button
        onClick={onExpand}
        aria-expanded={expanded}
        style={{
          width: '100%', padding: '18px 24px 6px', cursor: 'pointer',
          background: 'none', border: 'none', textAlign: 'left',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif",
            color: 'var(--text)', marginBottom: 6,
          }}>
            {booking.title || 'Interpreter Request'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span>{formatDate(booking.date)}</span>
            <span>{formatTime(booking.time_start, booking.time_end)}</span>
            <FormatBadge format={booking.format} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Interpreter avatar */}
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

      {/* Compact tracker — always visible below card header */}
      <div style={{ padding: '0 24px 12px' }}>
        <RequestTracker booking={booking} compact hasRating={hasRating} />
      </div>

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

export default function DhhRequestsListPage() {
  const [bookings, setBookings] = useState<BookingWithInterpreter[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [ratedBookings, setRatedBookings] = useState<Set<string>>(new Set())

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

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <BetaBanner />
      <PageHeader title="My Requests" subtitle="Personal interpreter requests you've submitted." />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Loading...
        </div>
      ) : bookings.length === 0 ? (
        <div style={{
          border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
          padding: '40px 24px', textAlign: 'center',
          color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6,
        }}>
          No requests yet. Submit your first interpreter request.
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
        </div>
      ) : (
        bookings.map(b => (
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
