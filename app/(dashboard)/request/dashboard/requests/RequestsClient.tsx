'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import RequesterInterpreterPicker from '@/components/requester/RequesterInterpreterPicker'

/* ── Types ── */

interface Booking {
  id: string
  title: string | null
  description: string | null
  notes: string | null
  date: string
  time_start: string
  time_end: string
  location: string | null
  format: string | null
  specialization: string | null
  event_type: string | null
  event_category: string | null
  recurrence: string | null
  interpreter_count: number
  interpreters_confirmed: number
  status: string
  platform_fee_amount: number | null
  platform_fee_status: string | null
  wave_alerts_sent: Record<string, boolean> | null
  current_wave: number | null
  created_at: string
}

interface Recipient {
  id: string
  booking_id: string
  interpreter_id: string
  status: string
  wave_number: number
  response_rate: number | null
  response_notes: string | null
  rate_profile_id: string | null
  confirmed_at: string | null
  declined_at: string | null
}

interface InterpreterInfo {
  name: string
  first_name: string | null
  last_name: string | null
}

interface DhhClient {
  booking_id: string
  dhh_user_id: string
}

/* ── Helpers ── */

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

function statusLabel(s: string): string {
  switch (s) {
    case 'draft': return 'Draft'
    case 'open': return 'Pending'
    case 'filled': return 'Confirmed'
    case 'completed': return 'Completed'
    case 'cancelled': return 'Cancelled'
    default: return s
  }
}

function statusColor(s: string): { bg: string; color: string } {
  switch (s) {
    case 'draft': return { bg: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }
    case 'open': return { bg: 'rgba(255,165,0,0.12)', color: '#f97316' }
    case 'filled': return { bg: 'rgba(52,211,153,0.12)', color: '#34d399' }
    case 'completed': return { bg: 'rgba(157,135,255,0.12)', color: '#9d87ff' }
    case 'cancelled': return { bg: 'rgba(255,255,255,0.04)', color: '#666' }
    default: return { bg: 'rgba(0,229,255,0.1)', color: 'var(--accent)' }
  }
}

function recipientStatusLabel(s: string): string {
  switch (s) {
    case 'sent': return 'Pending'
    case 'viewed': return 'Viewed'
    case 'responded': return 'Responded'
    case 'confirmed': return 'Confirmed'
    case 'declined': return 'Declined'
    case 'withdrawn': return 'Withdrawn'
    default: return s
  }
}

function recipientStatusColor(s: string): string {
  switch (s) {
    case 'sent': case 'viewed': return '#f97316'
    case 'responded': return 'var(--accent)'
    case 'confirmed': return '#34d399'
    case 'declined': case 'withdrawn': return '#666'
    default: return 'var(--muted)'
  }
}

/* ── Status tabs ── */

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Pending' },
  { key: 'filled', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'draft', label: 'Draft' },
] as const

type TabKey = (typeof TABS)[number]['key']

/* ── Main Component ── */

export default function RequestsClient({
  bookings,
  recipients,
  interpreterMap,
  dhhClients,
}: {
  bookings: Booking[]
  recipients: Recipient[]
  interpreterMap: Record<string, InterpreterInfo>
  dhhClients: DhhClient[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancelModalId, setCancelModalId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  // Wave: send to more state
  const [sendMoreBookingId, setSendMoreBookingId] = useState<string | null>(null)
  const [sendMoreStep, setSendMoreStep] = useState<'confirm' | 'pick'>('confirm')
  const [sendMoreIds, setSendMoreIds] = useState<string[]>([])
  const [sendMoreSubmitting, setSendMoreSubmitting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(localSearch), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [localSearch])

  // Build recipient map per booking
  const recipientsByBooking = new Map<string, Recipient[]>()
  for (const r of recipients) {
    const list = recipientsByBooking.get(r.booking_id) || []
    list.push(r)
    recipientsByBooking.set(r.booking_id, list)
  }

  // Filter bookings
  let filtered = bookings
  if (activeTab !== 'all') {
    filtered = filtered.filter(b => b.status === activeTab)
  }
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(b => {
      const recs = recipientsByBooking.get(b.id) || []
      const interpNames = recs.map(r => interpreterMap[r.interpreter_id]?.name || '').join(' ')
      return (
        (b.title || '').toLowerCase().includes(q) ||
        interpNames.toLowerCase().includes(q) ||
        formatDate(b.date).toLowerCase().includes(q)
      )
    })
  }

  // Count per tab
  const countForTab = (key: TabKey) => {
    if (key === 'all') return bookings.length
    return bookings.filter(b => b.status === key).length
  }

  // Cancel handler
  async function handleCancel(bookingId: string) {
    setCancelling(true)
    try {
      const supabase = createClient()

      // Update booking status
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: cancelReason || null,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (bookingErr) {
        console.error('[cancel] booking update error:', bookingErr.message)
        setToast({ message: 'Failed to cancel request. Please try again.', type: 'error' })
        setCancelling(false)
        return
      }

      // Withdraw pending recipients
      const bookingRecs = recipientsByBooking.get(bookingId) || []
      const pendingRecIds = bookingRecs
        .filter(r => r.status === 'sent' || r.status === 'viewed')
        .map(r => r.id)

      if (pendingRecIds.length > 0) {
        const { error: recErr } = await supabase
          .from('booking_recipients')
          .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
          .in('id', pendingRecIds)

        if (recErr) {
          console.error('[cancel] recipients update error:', recErr.message)
        }
      }

      setToast({ message: 'Request cancelled.', type: 'success' })
      setCancelModalId(null)
      setCancelReason('')
      setCancelling(false)
      router.refresh()
    } catch (err) {
      console.error('[cancel] error:', err)
      setToast({ message: 'An error occurred. Please try again.', type: 'error' })
      setCancelling(false)
    }
  }

  // Wave: send to more handler
  function openSendMore(bookingId: string, skipFriction = false) {
    const recs = recipientsByBooking.get(bookingId) || []
    const pending = recs.filter(r => r.status === 'sent' || r.status === 'viewed').length
    setSendMoreBookingId(bookingId)
    setSendMoreIds([])
    // Skip friction dialog if most have responded or if triggered from banner
    if (skipFriction || pending === 0) {
      setSendMoreStep('pick')
    } else {
      setSendMoreStep('confirm')
    }
  }

  async function handleSendMore() {
    if (!sendMoreBookingId || sendMoreIds.length === 0) return
    setSendMoreSubmitting(true)
    try {
      const res = await fetch('/api/request/wave-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: sendMoreBookingId, interpreterIds: sendMoreIds }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || 'Failed to send', type: 'error' })
        setSendMoreSubmitting(false)
        return
      }
      setToast({ message: `Request sent to ${data.sentCount} more interpreter${data.sentCount !== 1 ? 's' : ''}.`, type: 'success' })
      setSendMoreBookingId(null)
      setSendMoreSubmitting(false)
      router.refresh()
    } catch {
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' })
      setSendMoreSubmitting(false)
    }
  }

  // Wave helpers
  function getWaveStats(recs: Recipient[]) {
    const waves = new Map<number, Recipient[]>()
    for (const r of recs) {
      const w = r.wave_number || 1
      const list = waves.get(w) || []
      list.push(r)
      waves.set(w, list)
    }
    return waves
  }

  function getAlertBanner(booking: Booking, recs: Recipient[]) {
    const alerts = booking.wave_alerts_sent || {}
    const wave = booking.current_wave || 1
    const pending = recs.filter(r => r.status === 'sent' || r.status === 'viewed').length
    const interpretersNeeded = booking.interpreter_count || 1
    const confirmed = recs.filter(r => r.status === 'confirmed').length
    const declined = recs.filter(r => r.status === 'declined').length

    if (alerts[`wave_${wave}_urgent`]) {
      return {
        type: 'urgent' as const,
        message: `Your request for ${booking.title || 'this event'} is at risk. Only ${pending} interpreter${pending !== 1 ? 's' : ''} haven't responded and you still need ${interpretersNeeded - confirmed}. We recommend sending to more now.`,
      }
    }
    if (alerts[`wave_${wave}_nudge`] || alerts[`wave_${wave}_all_responded`] || alerts[`wave_${wave}_timeout`]) {
      return {
        type: 'nudge' as const,
        message: `${declined} interpreter${declined !== 1 ? 's' : ''} have declined this request. You can send to more interpreters to improve your chances.`,
      }
    }
    return null
  }

  const cancelBooking = cancelModalId ? bookings.find(b => b.id === cancelModalId) : null

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '1.6rem', margin: '0 0 6px' }}>
          All Requests
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
          View and manage all your interpreter requests.
        </p>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const count = countForTab(tab.key)
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: active ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: active ? '1px solid rgba(0,229,255,0.3)' : '1px solid var(--border)',
                borderRadius: 100,
                padding: '7px 16px',
                color: active ? 'var(--accent)' : 'var(--muted)',
                fontSize: '0.82rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  background: active ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.06)',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  borderRadius: 8, padding: '1px 6px',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 24 }}>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search by title, interpreter, or date..."
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          aria-label="Search requests"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#16161f', border: '1px solid #333',
            borderRadius: 'var(--radius-sm)', padding: '9px 14px 9px 36px',
            color: 'var(--text)', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = '#333' }}
        />
      </div>

      {/* Request list */}
      {filtered.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '48px 32px', textAlign: 'center',
        }}>
          {bookings.length === 0 ? (
            <>
              <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: 20 }}>
                You haven&apos;t created any requests yet.
              </p>
              <Link
                href="/request/dashboard/new-request"
                className="btn-primary"
                style={{ display: 'inline-block', padding: '12px 24px', fontSize: '0.88rem', textDecoration: 'none' }}
              >
                Create your first request &rarr;
              </Link>
            </>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>
              No requests match your search.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(booking => {
            const recs = recipientsByBooking.get(booking.id) || []
            const isExpanded = expandedId === booking.id
            const confirmedCount = recs.filter(r => r.status === 'confirmed').length
            const totalRequested = recs.length || booking.interpreter_count
            const feeAmount = (booking.platform_fee_amount ?? 15) * Math.max(booking.interpreter_count, 1)

            // Interpreter summary
            let interpSummary = ''
            if (confirmedCount > 0) {
              interpSummary = `${confirmedCount} interpreter${confirmedCount > 1 ? 's' : ''} confirmed`
            } else if (totalRequested > 0) {
              interpSummary = `${totalRequested} interpreter${totalRequested > 1 ? 's' : ''} requested`
            }

            const sc = statusColor(booking.status)

            return (
              <div key={booking.id}>
                {/* Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(isExpanded ? null : booking.id) } }}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: isExpanded ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)',
                    padding: '18px 24px', cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                    borderBottomColor: isExpanded ? 'transparent' : undefined,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,229,255,0.25)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isExpanded ? 'var(--border)' : 'var(--border)'; if (isExpanded) (e.currentTarget as HTMLDivElement).style.borderBottomColor = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                          {booking.title || 'Untitled Request'}
                        </span>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px',
                          borderRadius: 100, background: sc.bg, color: sc.color,
                          fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em',
                          border: booking.status === 'draft' ? '1px solid #444' : 'none',
                        }}>
                          {statusLabel(booking.status)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: 'var(--muted)', fontSize: '0.82rem' }}>
                        <span>{formatDate(booking.date)} &middot; {formatTime(booking.time_start, booking.time_end)}</span>
                        <span>&middot;</span>
                        <span>{booking.location || 'Remote'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                        {interpSummary && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{interpSummary}</span>
                        )}
                        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                          Platform fee: ${feeAmount.toFixed(2)}
                        </span>
                        {booking.platform_fee_status === 'failed' && (
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 600, color: '#ef4444',
                            background: 'rgba(239,68,68,0.1)', padding: '2px 8px',
                            borderRadius: 6,
                          }}>
                            Fee unpaid
                          </span>
                        )}
                        {booking.platform_fee_status === 'credited' && (
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 600, color: '#22c55e',
                            background: 'rgba(34,197,94,0.1)', padding: '2px 8px',
                            borderRadius: 6,
                          }}>
                            Credit applied
                          </span>
                        )}
                      </div>
                      {/* Per-interpreter status breakdown for multi-interpreter bookings */}
                      {recs.length > 1 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {recs.map(rec => {
                            const interp = interpreterMap[rec.interpreter_id]
                            const firstName = interp?.first_name || interp?.name?.split(' ')[0] || 'Unknown'
                            return (
                              <span key={rec.id} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                fontSize: '0.72rem', padding: '3px 10px',
                                borderRadius: 100, fontFamily: "'Inter', sans-serif",
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--border)',
                              }}>
                                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{firstName}</span>
                                <span style={{ color: recipientStatusColor(rec.status), fontWeight: 600 }}>
                                  {recipientStatusLabel(rec.status)}
                                </span>
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: 4, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: 'none',
                    borderRadius: '0 0 var(--radius) var(--radius)',
                    padding: '24px',
                  }}>
                    {/* Full event details */}
                    <div className="req-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px', marginBottom: 24 }}>
                      <DetailRow label="Date & Time" value={`${formatDate(booking.date)} · ${formatTime(booking.time_start, booking.time_end)}`} />
                      <DetailRow label="Location" value={booking.location || 'Not specified'} />
                      <DetailRow label="Format" value={booking.format ? booking.format.replace('_', '-') : 'Not specified'} />
                      <DetailRow label="Specialization" value={booking.specialization || booking.event_category || 'Not specified'} />
                      {booking.recurrence && booking.recurrence !== 'one-time' && (
                        <DetailRow label="Recurrence" value={booking.recurrence} />
                      )}
                      {booking.notes && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <DetailRow label="Notes" value={booking.notes} />
                        </div>
                      )}
                    </div>

                    {/* Interpreter responses */}
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{
                        fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.7rem',
                        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)',
                        margin: '0 0 12px',
                      }}>
                        Interpreter Responses
                      </h3>
                      {recs.length === 0 ? (
                        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No interpreters assigned yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {recs.map(rec => {
                            const interp = interpreterMap[rec.interpreter_id]
                            const interpName = interp?.name || 'Unknown Interpreter'
                            return (
                              <div key={rec.id} style={{
                                background: 'var(--surface)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)', padding: '14px 18px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                gap: 12, flexWrap: 'wrap',
                              }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <Link
                                      href={`/directory/${rec.interpreter_id}`}
                                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)', textDecoration: 'none' }}
                                      onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                                      onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                                    >
                                      {interpName}
                                    </Link>
                                    <span style={{
                                      fontSize: '0.7rem', fontWeight: 600, color: recipientStatusColor(rec.status),
                                      fontFamily: "'Inter', sans-serif",
                                    }}>
                                      {recipientStatusLabel(rec.status)}
                                    </span>
                                  </div>
                                  {rec.response_rate != null && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                                      Rate: ${rec.response_rate}/hr
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                                  {rec.status === 'responded' && (
                                    <Link
                                      href={`/request/dashboard/accept/${booking.id}/${rec.id}`}
                                      style={{
                                        background: 'var(--accent)', color: '#000',
                                        padding: '7px 16px', borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.78rem', fontWeight: 700,
                                        fontFamily: "'Inter', sans-serif",
                                        textDecoration: 'none', whiteSpace: 'nowrap',
                                      }}
                                    >
                                      Review & Accept
                                    </Link>
                                  )}
                                  <Link
                                    href="/request/dashboard/inbox"
                                    style={{
                                      background: 'none', border: '1px solid var(--border)',
                                      color: 'var(--muted)', padding: '7px 16px',
                                      borderRadius: 'var(--radius-sm)', fontSize: '0.78rem',
                                      fontFamily: "'Inter', sans-serif",
                                      textDecoration: 'none', whiteSpace: 'nowrap',
                                    }}
                                  >
                                    Message
                                  </Link>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Wave alert banner */}
                    {booking.status === 'open' && (() => {
                      const banner = getAlertBanner(booking, recs)
                      if (!banner) return null
                      const isUrgent = banner.type === 'urgent'
                      return (
                        <div style={{
                          padding: '14px 18px', borderRadius: 'var(--radius-sm)',
                          marginBottom: 16,
                          background: isUrgent ? 'rgba(255,107,133,0.06)' : 'rgba(0,229,255,0.06)',
                          border: `1px solid ${isUrgent ? 'rgba(255,107,133,0.3)' : 'rgba(0,229,255,0.2)'}`,
                          display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' as const,
                        }}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <p style={{
                              fontSize: '0.82rem', color: isUrgent ? 'var(--accent3)' : 'var(--accent)',
                              fontWeight: 600, margin: '0 0 4px', lineHeight: 1.5,
                            }}>
                              {isUrgent ? 'Action needed' : 'Heads up'}
                            </p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                              {banner.message}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); openSendMore(booking.id, true) }}
                            style={{
                              background: isUrgent ? 'rgba(255,107,133,0.15)' : 'rgba(0,229,255,0.1)',
                              border: `1px solid ${isUrgent ? 'rgba(255,107,133,0.4)' : 'rgba(0,229,255,0.3)'}`,
                              color: isUrgent ? 'var(--accent3)' : 'var(--accent)',
                              padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                              fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' as const,
                            }}
                          >
                            Send to more interpreters
                          </button>
                        </div>
                      )
                    })()}

                    {/* Wave history */}
                    {recs.length > 0 && (() => {
                      const waves = getWaveStats(recs)
                      if (waves.size <= 1 && !booking.current_wave) return null
                      return (
                        <div style={{ marginBottom: 16 }}>
                          <h3 style={{
                            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.7rem',
                            letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)',
                            margin: '0 0 10px',
                          }}>
                            Wave History
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                            {Array.from(waves.entries()).sort(([a], [b]) => a - b).map(([waveNum, waveRecs]) => {
                              const d = waveRecs.filter(r => r.status === 'declined').length
                              const resp = waveRecs.filter(r => r.status === 'responded' || r.status === 'confirmed').length
                              const p = waveRecs.filter(r => r.status === 'sent' || r.status === 'viewed').length
                              return (
                                <div key={waveNum} style={{
                                  fontSize: '0.78rem', color: 'var(--muted)', padding: '8px 14px',
                                  background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border)',
                                }}>
                                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>Wave {waveNum}:</span>{' '}
                                  Sent to {waveRecs.length} interpreter{waveRecs.length !== 1 ? 's' : ''}
                                  {' ('}
                                  {d > 0 && <>{d} declined, </>}
                                  {resp > 0 && <>{resp} responded, </>}
                                  {p > 0 && <>{p} pending</>}
                                  {p === 0 && d === 0 && resp === 0 && <>0 pending</>}
                                  {')'}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Send to more interpreters button (always visible for open bookings) */}
                    {(booking.status === 'open' || booking.status === 'filled') && (
                      <div style={{ marginBottom: 16 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openSendMore(booking.id) }}
                          style={{
                            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
                            borderRadius: 'var(--radius-sm)', padding: '9px 18px',
                            color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.14)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
                        >
                          Send to more interpreters
                        </button>
                      </div>
                    )}

                    {/* Inline send-to-more picker */}
                    {sendMoreBookingId === booking.id && sendMoreStep === 'pick' && (
                      <div style={{
                        marginBottom: 16, padding: '20px', background: 'var(--surface)',
                        border: '1px solid rgba(0,229,255,0.2)', borderRadius: 'var(--radius-sm)',
                      }}>
                        <h3 style={{
                          fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px',
                          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                          color: 'var(--accent)', margin: '0 0 10px',
                        }}>
                          SELECT MORE INTERPRETERS
                        </h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 14, lineHeight: 1.6 }}>
                          Select up to 10 new interpreters. Those already contacted for this request are filtered out.
                        </p>
                        <RequesterInterpreterPicker
                          selectedIds={sendMoreIds}
                          onChange={setSendMoreIds}
                          excludeIds={recs.map(r => r.interpreter_id)}
                        />
                        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' as const }}>
                          <button
                            disabled={sendMoreIds.length === 0 || sendMoreSubmitting}
                            onClick={(e) => { e.stopPropagation(); handleSendMore() }}
                            className="btn-primary"
                            style={{
                              padding: '10px 22px', fontSize: '0.85rem', fontWeight: 700,
                              opacity: (sendMoreIds.length === 0 || sendMoreSubmitting) ? 0.5 : 1,
                              cursor: (sendMoreIds.length === 0 || sendMoreSubmitting) ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {sendMoreSubmitting ? 'Sending...' : `Send to ${sendMoreIds.length} interpreter${sendMoreIds.length !== 1 ? 's' : ''}`}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSendMoreBookingId(null) }}
                            style={{
                              background: 'none', border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)', padding: '10px 18px',
                              color: 'var(--muted)', fontSize: '0.82rem',
                              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Smart directory link */}
                    {booking.status === 'open' && (() => {
                      const params = new URLSearchParams({ context: 'requester' })
                      if (booking.specialization) params.set('spec', booking.specialization)
                      if (booking.location) params.set('location', booking.location)
                      if (booking.format) params.set('workMode', booking.format)
                      return (
                        <Link
                          href={`/directory?${params.toString()}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            padding: '9px 18px', borderRadius: 'var(--radius-sm)',
                            background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
                            color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600,
                            textDecoration: 'none', fontFamily: "'Inter', sans-serif",
                            marginBottom: 16, transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.12)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.06)' }}
                        >
                          Find more interpreters for this request &#8594;
                        </Link>
                      )
                    })()}

                    {/* Cancel button */}
                    {(booking.status === 'open' || booking.status === 'filled') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCancelModalId(booking.id) }}
                        style={{
                          background: 'none', border: '1px solid rgba(255,107,133,0.3)',
                          color: 'var(--accent3)', padding: '9px 20px',
                          borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
                          fontFamily: "'Inter', sans-serif", fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,133,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel modal */}
      {cancelModalId && cancelBooking && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
          onClick={() => { if (!cancelling) { setCancelModalId(null); setCancelReason('') } }}
        >
          <div
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '28px 32px',
              width: '100%', maxWidth: 480,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '1.15rem', margin: '0 0 12px' }}>
              Cancel this request?
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 16px' }}>
              {cancelBooking.status === 'filled'
                ? 'The interpreter(s) will be notified of the cancellation. Depending on their cancellation policy, a fee may apply.'
                : 'This will withdraw the request from all interpreters who haven\'t responded yet.'}
            </p>
            <label style={{
              display: 'block', fontSize: '0.7rem', color: 'var(--muted)',
              fontFamily: "'Inter', sans-serif", fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
            }}>
              Reason (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                color: 'var(--text)', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem',
                outline: 'none', resize: 'vertical', marginBottom: 20,
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
            <div className="req-modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setCancelModalId(null); setCancelReason('') }}
                disabled={cancelling}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--muted)', padding: '11px 20px',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                  fontFamily: "'Inter', sans-serif", cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Keep Request
              </button>
              <button
                onClick={() => handleCancel(cancelModalId)}
                disabled={cancelling}
                style={{
                  background: 'rgba(255,107,133,0.15)', border: '1px solid rgba(255,107,133,0.4)',
                  color: 'var(--accent3)', padding: '11px 20px',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                  fontFamily: "'Inter', sans-serif", fontWeight: 700,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  opacity: cancelling ? 0.6 : 1,
                  minHeight: 44,
                }}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send-to-more friction dialog */}
      {sendMoreBookingId && sendMoreStep === 'confirm' && (() => {
        const recs = recipientsByBooking.get(sendMoreBookingId) || []
        const pending = recs.filter(r => r.status === 'sent' || r.status === 'viewed').length
        return (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: 20,
            }}
            onClick={() => setSendMoreBookingId(null)}
          >
            <div
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '28px 32px',
                width: '100%', maxWidth: 480,
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '1.15rem', margin: '0 0 12px' }}>
                Send to more interpreters?
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 20px' }}>
                You still have {pending} interpreter{pending !== 1 ? 's' : ''} who haven&apos;t responded yet. Waiting typically gets better response rates. Are you sure you want to send to more now?
              </p>
              <div className="req-modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setSendMoreBookingId(null)}
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    color: 'var(--muted)', padding: '11px 20px',
                    borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                    fontFamily: "'Inter', sans-serif", cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Wait for responses
                </button>
                <button
                  onClick={() => setSendMoreStep('pick')}
                  className="btn-primary"
                  style={{
                    padding: '11px 20px', fontSize: '0.85rem', fontWeight: 700,
                    minHeight: 44, cursor: 'pointer',
                  }}
                >
                  Yes, send to more
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
        }
        @media (max-width: 640px) {
          .req-detail-grid { grid-template-columns: 1fr !important; }
          .req-modal-actions { flex-direction: column !important; }
          .req-modal-actions button { width: 100% !important; }
        }
        @media (max-width: 480px) {
          .dash-page-content { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Detail Row ── */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)',
        fontFamily: "'Inter', sans-serif", letterSpacing: '0.08em',
        textTransform: 'uppercase', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  )
}
