'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import BetaTryThis from '@/components/ui/BetaTryThis'
import { formatLocationShort } from '@/lib/location-display'
import RequestTracker from '@/components/dashboard/dhh/RequestTracker'

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
  location?: string | null
}

interface RecentRecipient {
  id: string
  booking_id: string
  interpreter_id: string
  status: string
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
  recentInterpreterMap?: Record<string, string>
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

function recipientStatusLabel(s: string): string {
  switch (s) {
    case 'sent': return 'Pending'
    case 'viewed': return 'Viewed'
    case 'responded': return 'Rate received'
    case 'confirmed': return 'Confirmed'
    case 'declined': return 'Declined'
    case 'withdrawn': return 'Withdrawn'
    default: return s
  }
}

function recipientStatusColor(s: string): string {
  switch (s) {
    case 'sent': case 'viewed': return '#f97316'
    case 'responded': return '#f59e0b'
    case 'confirmed': return '#34d399'
    case 'declined': case 'withdrawn': return '#666'
    default: return '#96a0b8'
  }
}

export default function RequesterOverviewClient({
  firstName, orgName, activeRequests, confirmedBookings, rosterCount, pendingResponses, recentBookings,
  recentRecipients = [], recentInterpreterMap = {},
}: Props) {
  const greeting = firstName ? `Good to see you, ${firstName}.` : 'Welcome to your dashboard.'
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)
  const bookingCardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: '27px', color: '#f0f2f8', margin: '0 0 6px' }}>
          {greeting}
        </h1>
        <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', margin: 0 }}>
          Here&apos;s a snapshot of your activity on signpost.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 38, alignItems: 'stretch' }}>
        <StatCard num={activeRequests} label="Active Requests" href="/request/dashboard/requests" />
        <StatCard num={confirmedBookings} label="Confirmed Bookings" href="/request/dashboard/requests" />
        <StatCard num={rosterCount} label="Interpreters on Roster" href="/request/dashboard/interpreters" />
        <StatCard num={pendingResponses} label="Pending Responses" href="/request/dashboard/inbox" />
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
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px 24px',
                cursor: 'pointer', transition: 'border-color 0.15s',
                marginBottom: 12,
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

                {/* Date, time, location */}
                <div style={{
                  display: 'flex', gap: 16, flexWrap: 'wrap',
                  fontSize: '0.8rem', color: 'var(--muted)',
                  marginBottom: 4,
                }}>
                  <span>{formatDate(booking.date)}</span>
                  <span>{formatTime(booking.time_start, booking.time_end)}</span>
                  <span>{formatLocationShort(booking)}</span>
                </div>

                {/* Tracker timeline */}
                <RequestTracker
                  booking={{
                    id: booking.id,
                    status: booking.status,
                    date: booking.date,
                    interpreter_count: booking.interpreter_count,
                  }}
                  recipients={recentRecipients
                    .filter(r => r.booking_id === booking.id)
                    .map(r => ({ id: r.id, interpreter_id: r.interpreter_id, status: r.status }))
                  }
                  compact
                />
                {/* Per-interpreter status for multi-interpreter bookings */}
                {(() => {
                  const recs = recentRecipients.filter(r => r.booking_id === booking.id)
                  if (recs.length <= 1) return null
                  return (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 4 }}>
                      {recs.map(rec => (
                        <span key={rec.id} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: '0.72rem', padding: '3px 10px',
                          borderRadius: 100, fontFamily: "'Inter', sans-serif",
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border)',
                        }}>
                          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                            {recentInterpreterMap[rec.interpreter_id] || 'Unknown'}
                          </span>
                          {rec.status === 'responded' ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              color: '#f59e0b', fontWeight: 600,
                            }}>
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                              Rate received
                            </span>
                          ) : (
                            <span style={{ color: recipientStatusColor(rec.status), fontWeight: 600 }}>
                              {recipientStatusLabel(rec.status)}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )
                })()}
                {/* View details */}
                <div style={{ marginTop: 4 }}>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 500,
                    fontSize: '0.78rem', color: 'var(--accent)',
                  }}>
                    View details
                  </span>
                </div>
                {isExpanded && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', gap: 8,
                      fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6,
                    }}
                  >
                    {booking.event_category && (
                      <div><span style={{ color: 'var(--muted)' }}>Category: </span>{booking.event_category}</div>
                    )}
                    <Link
                      href={`/request/dashboard/requests?expand=${booking.id}`}
                      style={{
                        marginTop: 4, color: 'var(--accent)', textDecoration: 'none',
                        fontSize: '0.82rem', fontWeight: 600,
                      }}
                    >
                      Open in full requests view
                    </Link>
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
          border-color: rgba(0,229,255,0.3) !important;
        }
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
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
