'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import BetaTryThis from '@/components/ui/BetaTryThis'
import { formatLocationShort, formatLocationFull } from '@/lib/location-display'
import { displayBookingFormat } from '@/lib/bookingFormat'
import { formatContactedAgo } from '@/lib/format-time'
import RequestTracker from '@/components/dashboard/dhh/RequestTracker'
import { RECIPIENT_STATUS_ORDER } from '@/lib/booking-status'

/* ── Types ── */

interface RecentBooking {
  id: string
  title: string | null
  date: string
  time_start: string
  time_end: string
  status: string
  interpreter_count: number
  event_category: string | null
  request_type?: string | null
  location?: string | null
  format?: string | null
  specialization?: string | null
  description?: string | null
  notes?: string | null
  prep_notes?: string | null
  onsite_contact_name?: string | null
  onsite_contact_phone?: string | null
  onsite_contact_email?: string | null
  location_name?: string | null
  location_address?: string | null
  location_city?: string | null
  location_state?: string | null
  location_zip?: string | null
  location_country?: string | null
  meeting_link?: string | null
}

interface RecentRecipient {
  id: string
  booking_id: string
  interpreter_id: string
  status: string
  sent_at?: string | null
  response_rate?: number | null
  wave_number?: number
  response_notes?: string | null
  rate_profile_id?: string | null
  confirmed_at?: string | null
  declined_at?: string | null
  proposed_date?: string | null
  proposed_start_time?: string | null
  proposed_end_time?: string | null
  proposal_note?: string | null
}

interface InterpreterInfo {
  name: string
  first_name: string | null
  last_name: string | null
  photo_url: string | null
}

interface RateProfileTerms {
  hourly_rate: number | null
  currency: string | null
  min_booking: number | null
  after_hours_diff: number | null
  after_hours_description: string | null
  cancellation_policy: string | null
  late_cancel_fee: number | null
  travel_expenses: Record<string, unknown> | null
  additional_terms: string | null
}

interface DhhClient {
  booking_id: string
  dhh_user_id: string
}

interface Props {
  firstName: string
  orgName: string
  activeRequests: number
  confirmedBookings: number
  rosterCount: number
  pendingResponses: number
  recentBookings: RecentBooking[]
  recentRecipients?: RecentRecipient[]
  recentInterpreterMap?: Record<string, InterpreterInfo>
  recentRateProfileMap?: Record<string, RateProfileTerms>
  recentDhhClients?: DhhClient[]
  recentTierMap?: Record<string, string>
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

function sortRecipients(recipients: RecentRecipient[]): RecentRecipient[] {
  return [...recipients].sort((a, b) =>
    (RECIPIENT_STATUS_ORDER[a.status] ?? 3) - (RECIPIENT_STATUS_ORDER[b.status] ?? 3)
  )
}

/* ── SVG Icons (thin-line, matching Deaf portal) ── */

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

/* ── Interpreter Mini Card (matching Deaf portal style) ── */

function InterpreterMiniCard({ recipient, interp, showRate, tier }: {
  recipient: RecentRecipient
  interp: InterpreterInfo | undefined
  tier?: string | null
  showRate?: boolean
}) {
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
    responded: { bg: 'rgba(255,165,0,0.1)', color: '#ffa500', label: 'Rate received' },
    proposed: { bg: 'rgba(139,92,246,0.1)', color: '#a78bfa', label: 'Alternative suggested' },
    declined: { bg: 'rgba(255,107,133,0.08)', color: '#ff8099', label: 'Declined' },
    withdrawn: { bg: 'rgba(184,191,207,0.06)', color: '#6b7280', label: 'Withdrawn' },
  }
  const sc = statusConfigs[recipient.status] || statusConfigs.sent

  const rateLabel = showRate && recipient.response_rate != null && (recipient.status === 'responded' || recipient.status === 'confirmed' || recipient.status === 'proposed')
    ? ` · $${recipient.response_rate}/hr`
    : ''

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
      <Link href={`/directory/${recipient.interpreter_id}`} onClick={e => e.stopPropagation()} style={{ flexShrink: 0, textDecoration: 'none' }}>
        {interp?.photo_url ? (
          <img src={interp.photo_url} alt="" style={{
            width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
          }} />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.6rem', color: '#fff',
          }}>
            {initials}
          </div>
        )}
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link
            href={`/directory/${recipient.interpreter_id}`}
            onClick={e => e.stopPropagation()}
            style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.82rem',
              color: 'var(--text)', textDecoration: 'none',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {name}
          </Link>
          {tier === 'preferred' && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, color: '#a78bfa',
              background: 'rgba(167,139,250,0.15)', borderRadius: 100,
              padding: '1px 6px', whiteSpace: 'nowrap', flexShrink: 0,
            }}>Preferred</span>
          )}
          {tier === 'approved' && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, color: '#96a0b8',
              background: 'rgba(150,160,184,0.12)', borderRadius: 100,
              padding: '1px 6px', whiteSpace: 'nowrap', flexShrink: 0,
            }}>Approved</span>
          )}
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: 600, color: sc.color,
          background: sc.bg, borderRadius: 100, padding: '1px 7px',
          display: 'inline-block', marginTop: 2,
        }}>
          {sc.label}{rateLabel}
        </span>
        {recipient.sent_at && (
          <div style={{ fontSize: '11px', fontWeight: 400, color: '#96a0b8', marginTop: 4 }}>
            Contacted {formatContactedAgo(recipient.sent_at)}
          </div>
        )}
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

/* ── Main ── */

export default function RequesterOverviewClient({
  firstName, orgName, activeRequests, confirmedBookings, rosterCount, pendingResponses, recentBookings,
  recentRecipients = [], recentInterpreterMap = {}, recentRateProfileMap = {},
  recentDhhClients = [], recentTierMap = {},
}: Props) {
  const router = useRouter()
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)
  const bookingCardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Build DHH client map per booking for tier lookups
  const dhhClientsByBooking = new Map<string, DhhClient[]>()
  for (const c of recentDhhClients) {
    const list = dhhClientsByBooking.get(c.booking_id) || []
    list.push(c)
    dhhClientsByBooking.set(c.booking_id, list)
  }

  function getInterpreterTier(bookingId: string, interpreterId: string): string | null {
    const clients = dhhClientsByBooking.get(bookingId)
    if (!clients || clients.length === 0) return null
    const primaryDhh = clients[0].dhh_user_id
    return recentTierMap[`${interpreterId}:${primaryDhh}`] || null
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      {/* Greeting / Org Header */}
      <div style={{ marginBottom: 30 }}>
        {orgName ? (
          <>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: '27px', color: '#f0f2f8', margin: '0 0 6px' }}>
              {orgName}
            </h1>
            <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', margin: 0 }}>
              Here&apos;s a snapshot of your activity on signpost.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: '27px', color: '#f0f2f8', margin: '0 0 6px' }}>
              {firstName ? `Good to see you, ${firstName}.` : 'Welcome to your dashboard.'}
            </h1>
            <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', margin: 0 }}>
              Here&apos;s a snapshot of your activity on signpost.
            </p>
          </>
        )}
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 38, alignItems: 'stretch' }}>
        <StatCard num={activeRequests} label="Open Requests" href="/request/dashboard/requests" />
        <StatCard num={confirmedBookings} label="Confirmed Bookings" href="/request/dashboard/requests" />
        <StatCard num={rosterCount} label="Interpreters on Roster" href="/request/dashboard/interpreters" />
        <StatCard num={pendingResponses} label="Awaiting Responses" href="/request/dashboard/inbox" />
      </div>

      {/* New Request Button */}
      <div style={{ marginBottom: 36 }}>
        <Link
          href="/request/dashboard/new-request"
          className="btn-primary"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', fontSize: '0.92rem', fontWeight: 700,
            textDecoration: 'none', borderRadius: 'var(--radius-sm)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New Interpreter Request
        </Link>
      </div>

      {/* How Billing Works */}
      <BillingInfoCard />

      {/* Try This banner */}
      <BetaTryThis storageKey="beta_try_dashboard_recent">
        Click on any of the sample requests below to see their details, interpreter responses, and status tracking. Try the &apos;Staff Training Workshop&apos; request to see how interpreter rate responses work.
      </BetaTryThis>

      {/* Recent Requests */}
      <div style={{ marginBottom: 34 }}>
        <h3 style={{
          fontWeight: 600, fontSize: '13px',
          letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff',
          margin: '0 0 14px',
        }}>
          Recent Requests
        </h3>

        {recentBookings.length === 0 ? (
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '32px 24px',
            color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
          }}>
            No requests yet. Create your first interpreter request to get started.
          </div>
        ) : (
          <>
            {recentBookings.map(booking => {
              const isExpanded = expandedBookingId === booking.id
              const recs = recentRecipients.filter(r => r.booking_id === booking.id)
              const confirmedRecs = recs.filter(r => r.status === 'confirmed')
              const locationText = formatLocationShort(booking)

              return (
              <div
                key={booking.id}
                ref={el => { bookingCardRefs.current[booking.id] = el }}
                className="recent-request-card"
                role="button"
                tabIndex={0}
                onClick={() => {
                  const next = isExpanded ? null : booking.id
                  setExpandedBookingId(next)
                  if (next) {
                    requestAnimationFrame(() => {
                      bookingCardRefs.current[booking.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    })
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setExpandedBookingId(isExpanded ? null : booking.id)
                  }
                }}
                style={{
                background: '#111118', border: '1px solid #1e2433',
                borderRadius: 'var(--radius)', padding: '20px 24px',
                cursor: 'pointer', transition: 'border-color 0.15s',
                marginBottom: 12, overflow: 'hidden',
              }}>
                {/* Title */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(booking.title || '').startsWith('[Sample]') && (
                      <span style={{
                        fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4,
                        background: 'rgba(249, 115, 22, 0.15)', color: '#f97316',
                        border: '1px solid rgba(249, 115, 22, 0.3)',
                        fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
                      }}>SAMPLE</span>
                    )}
                    {(booking.title || '').startsWith('[Sample] ') ? (booking.title || '').replace('[Sample] ', '') : (booking.title || 'Untitled Request')}
                  </div>
                </div>

                {/* Date, time, location with icons */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                  fontFamily: "'Inter', sans-serif", fontSize: '0.84rem', color: 'var(--muted)',
                  marginBottom: 8,
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <CalendarIcon />
                    {formatDate(booking.date)}
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

                {/* Tracker timeline */}
                <RequestTracker
                  booking={{
                    id: booking.id,
                    status: booking.status,
                    date: booking.date,
                    interpreter_count: booking.interpreter_count,
                  }}
                  recipients={recs.map(r => ({ id: r.id, interpreter_id: r.interpreter_id, status: r.status }))}
                  compact
                />

                {/* Compact: confirmed interpreters with photos */}
                {confirmedRecs.length > 0 && !isExpanded && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                    gap: 6, marginTop: 4,
                  }}>
                    {confirmedRecs.map(r => {
                      const interp = recentInterpreterMap[r.interpreter_id]
                      const name = interp?.first_name
                        ? `${interp.first_name} ${interp.last_name?.[0] || ''}.`
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
                              fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.5rem', color: '#fff',
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

                {/* View details toggle */}
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedBookingId(isExpanded ? null : booking.id) }}
                    aria-expanded={isExpanded}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '0.82rem',
                      color: '#00e5ff', display: 'inline-flex', alignItems: 'center', gap: 5,
                      textDecoration: 'none',
                    }}
                    onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    {isExpanded ? 'Hide details' : 'View details'}
                    <ChevronIcon expanded={isExpanded} />
                  </button>
                </div>

                {/* EXPANDED VIEW */}
                {isExpanded && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{ paddingTop: 16, marginTop: 16, borderTop: '1px solid var(--border)' }}
                  >
                    {/* View full request link */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <button
                        onClick={() => {
                          setExpandedBookingId(null)
                          router.push(`/request/dashboard/requests?expand=${booking.id}`)
                        }}
                        style={{
                          background: 'rgba(0,229,255,0.08)',
                          border: '1px solid rgba(0,229,255,0.25)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 16px',
                          color: 'var(--accent)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        View full request &#8594;
                      </button>
                    </div>
                    <div className="req-overview-expanded-cols" style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
                    }}>
                      {/* LEFT: Appointment Details */}
                      <div>
                        <div style={{
                          fontWeight: 600, fontSize: '13px',
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: '#00e5ff', marginBottom: 12,
                        }}>
                          Appointment Details
                        </div>

                        {/* Location */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>
                            Location
                          </div>
                          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'pre-line' }}>
                            {booking.format === 'remote' ? (
                              <>
                                <span style={{ color: '#00e5ff' }}>Remote</span>
                                {booking.meeting_link && (
                                  <div style={{ marginTop: 4 }}>
                                    <a
                                      href={booking.meeting_link}
                                      target="_blank" rel="noopener noreferrer"
                                      style={{ color: '#00e5ff', textDecoration: 'underline', fontSize: '0.85rem' }}
                                    >
                                      {booking.meeting_link}
                                    </a>
                                  </div>
                                )}
                              </>
                            ) : (booking.location || booking.location_city) ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatLocationFull(booking).replace(/\n/g, ', '))}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ color: '#00e5ff', textDecoration: 'none' }}
                                onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                {formatLocationFull(booking)}
                              </a>
                            ) : 'TBD'}
                          </div>
                        </div>

                        {/* Format */}
                        {booking.format && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>
                              Format
                            </div>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: 'var(--text)' }}>
                              {displayBookingFormat(booking.format)}
                            </div>
                          </div>
                        )}

                        {/* Event / Specialization */}
                        {(booking.specialization || booking.event_category) && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>
                              Specialization
                            </div>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: 'var(--text)' }}>
                              {booking.specialization || booking.event_category}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {(booking.description || booking.notes) && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>
                              Notes
                            </div>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55 }}>
                              {booking.description || booking.notes}
                            </div>
                          </div>
                        )}

                        {/* Preparation */}
                        {(booking.onsite_contact_name || booking.prep_notes) && (
                          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                            <div style={{
                              fontWeight: 600, fontSize: '13px',
                              letterSpacing: '0.08em', textTransform: 'uppercase',
                              color: '#00e5ff', marginBottom: 10,
                            }}>
                              Preparation
                            </div>
                            {booking.onsite_contact_name && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.65, marginBottom: 8 }}>
                                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 4 }}>On-site Contact</div>
                                <div>{booking.onsite_contact_name}</div>
                                {booking.onsite_contact_phone && <div style={{ color: 'var(--muted)' }}>{booking.onsite_contact_phone}</div>}
                                {booking.onsite_contact_email && <div style={{ color: 'var(--muted)' }}>{booking.onsite_contact_email}</div>}
                              </div>
                            )}
                            {booking.prep_notes && (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.65 }}>
                                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 4 }}>Prep Notes</div>
                                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--muted)' }}>{booking.prep_notes}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* RIGHT: Interpreters Contacted */}
                      <div>
                        <div style={{
                          fontWeight: 600, fontSize: '13px',
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          color: '#00e5ff', marginBottom: 12,
                        }}>
                          Interpreters Contacted
                        </div>

                        {recs.length > 0 ? (
                          <div className="req-overview-interp-grid" style={{
                            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
                          }}>
                            {sortRecipients(recs).map(rec => (
                              <InterpreterMiniCard
                                key={rec.id}
                                recipient={rec}
                                interp={recentInterpreterMap[rec.interpreter_id]}
                                showRate
                                tier={getInterpreterTier(booking.id, rec.interpreter_id)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                            No interpreters contacted yet.
                          </div>
                        )}

                        {/* Action buttons for responded interpreters */}
                        {recs.filter(r => r.status === 'responded' || r.status === 'proposed').length > 0 && (
                          <div style={{ marginTop: 14 }}>
                            {recs.filter(r => r.status === 'responded' || r.status === 'proposed').map(rec => {
                              const interp = recentInterpreterMap[rec.interpreter_id]
                              const interpName = interp?.first_name
                                ? `${interp.first_name} ${interp.last_name?.[0] || ''}.`
                                : interp?.name || 'Interpreter'
                              const actionTier = getInterpreterTier(booking.id, rec.interpreter_id)
                              return (
                                <div key={rec.id} style={{
                                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap',
                                }}>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }}>{interpName}:</span>
                                  {actionTier === 'preferred' && (
                                    <span style={{
                                      fontSize: '0.6rem', fontWeight: 700, color: '#a78bfa',
                                      background: 'rgba(167,139,250,0.15)', borderRadius: 100, padding: '1px 6px',
                                    }}>Preferred</span>
                                  )}
                                  {actionTier === 'approved' && (
                                    <span style={{
                                      fontSize: '0.6rem', fontWeight: 700, color: '#96a0b8',
                                      background: 'rgba(150,160,184,0.12)', borderRadius: 100, padding: '1px 6px',
                                    }}>Approved</span>
                                  )}
                                  <Link
                                    href={`/request/dashboard/accept/${booking.id}/${rec.id}`}
                                    style={{
                                      background: 'var(--accent)', color: '#000',
                                      padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                                      fontSize: '0.72rem', fontWeight: 700,
                                      fontFamily: "'Inter', sans-serif",
                                      textDecoration: 'none', whiteSpace: 'nowrap',
                                    }}
                                  >
                                    Review & Accept
                                  </Link>
                                  <Link
                                    href="/request/dashboard/inbox"
                                    style={{
                                      background: 'none', border: '1px solid var(--border)',
                                      color: 'var(--text)', padding: '6px 14px',
                                      borderRadius: 'var(--radius-sm)', fontSize: '0.72rem',
                                      fontFamily: "'Inter', sans-serif",
                                      textDecoration: 'none', whiteSpace: 'nowrap',
                                    }}
                                  >
                                    Message
                                  </Link>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )
            })}
            <Link
              href="/request/dashboard/requests"
              style={{
                color: 'var(--accent)', fontSize: '0.88rem', fontWeight: 600,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              View All Requests
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 2 }}>
        <h3 style={{
          fontWeight: 600, fontSize: '13px',
          letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff',
          margin: '0 0 14px',
        }}>
          Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          <QuickAction
            label="Browse Interpreter Directory"
            href="/directory?context=requester"
            icon={<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
          />
          <QuickAction
            label="Manage Preferred Interpreters"
            href="/request/dashboard/interpreters"
            icon={<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.85 3.75L14 5.85l-3 2.93.7 4.12L8 10.95 4.3 12.9l.7-4.12-3-2.93 4.15-.6L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          />
        </div>
      </div>

      {/* Mobile styles */}
      <style>{`
        .recent-request-card:hover {
          border-color: rgba(0,229,255,0.35) !important;
        }
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
          .req-overview-expanded-cols { grid-template-columns: 1fr !important; }
          .req-overview-interp-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .dash-page-content { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}


function BillingInfoCard() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600,
          fontFamily: "'Inter', sans-serif", padding: 0,
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        How does signpost billing work?
      </button>
      {expanded && (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '20px 24px', marginTop: 10,
          fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.7,
        }}>
          <p style={{ margin: '0 0 12px' }}>
            signpost charges a flat $15 platform fee for each interpreter confirmed on a booking. This fee is charged when you accept an interpreter&apos;s rate and confirm the booking.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            This fee supports the signpost platform and is completely separate from the interpreter&apos;s rate. The interpreter will invoice you directly for their services using their preferred payment method.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            Personal interpreter requests from Deaf/DB/HH individuals are always free.
          </p>
          <p style={{
            margin: 0, fontStyle: 'italic', opacity: 0.8,
          }}>
            Platform fees are tracked and charged after booking completion.
          </p>
        </div>
      )}
    </div>
  )
}

function QuickAction({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  const [hover, setHover] = useState(false)
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: 'var(--card-bg)',
          border: `1px solid ${hover ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '18px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          transition: 'border-color 0.18s, transform 0.18s', cursor: 'pointer',
          transform: hover ? 'translateY(-1px)' : 'none',
        }}
      >
        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  )
}
