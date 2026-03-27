'use client'

import { useState } from 'react'
import Link from 'next/link'

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
}

interface Props {
  firstName: string
  orgName: string
  activeRequests: number
  confirmedBookings: number
  rosterCount: number
  pendingResponses: number
  recentBookings: RecentBooking[]
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

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    open: { bg: 'rgba(255,165,0,0.12)', color: '#f97316', label: 'Pending' },
    filled: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: 'Confirmed' },
    completed: { bg: 'rgba(157,135,255,0.12)', color: '#9d87ff', label: 'Completed' },
    cancelled: { bg: 'rgba(200,207,224,0.1)', color: 'var(--muted)', label: 'Cancelled' },
    draft: { bg: 'rgba(200,207,224,0.1)', color: 'var(--muted)', label: 'Draft' },
  }
  const s = map[status] || map.open
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: 100, background: s.bg, color: s.color,
      fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
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
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.04em', color: 'var(--accent)' }}>{num}</div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 4 }}>{label}</div>
      </div>
    </Link>
  )
}

/* ── Main ── */

export default function RequesterOverviewClient({
  firstName, orgName, activeRequests, confirmedBookings, rosterCount, pendingResponses, recentBookings,
}: Props) {
  const greeting = firstName ? `Good to see you, ${firstName}.` : 'Welcome to your dashboard.'

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '27px', color: '#f0f2f8', margin: '0 0 6px' }}>
          {greeting}
        </h1>
        <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', margin: 0 }}>
          Here&apos;s a snapshot of your activity on signpost.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32, alignItems: 'stretch' }}>
        <StatCard num={activeRequests} label="Active Requests" href="/request/dashboard/requests" />
        <StatCard num={confirmedBookings} label="Confirmed Bookings" href="/request/dashboard/requests" />
        <StatCard num={rosterCount} label="Interpreters on Roster" href="/request/dashboard/interpreters" />
        <StatCard num={pendingResponses} label="Pending Responses" href="/request/dashboard/inbox" />
      </div>

      {/* Beta Banner */}
      {process.env.NEXT_PUBLIC_BETA_MODE === 'true' && <BetaBanner />}

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

      {/* Recent Requests */}
      <div style={{ marginBottom: 36 }}>
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
            {recentBookings.map(booking => (
              <div key={booking.id} style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif" }}>
                      {booking.title || 'Untitled Request'}
                    </div>
                    {booking.event_category && (
                      <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>
                        {booking.event_category}
                      </div>
                    )}
                  </div>
                  {statusBadge(booking.status)}
                </div>
                <div style={{
                  display: 'flex', gap: 16, flexWrap: 'wrap',
                  fontSize: '0.8rem', color: 'var(--muted)',
                  padding: '10px 0', borderTop: '1px solid var(--border)',
                }}>
                  <span>{formatDate(booking.date)}</span>
                  <span>{formatTime(booking.time_start, booking.time_end)}</span>
                  <span>{booking.interpreter_count} interpreter{booking.interpreter_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
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
      <div>
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
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  )
}

function BetaBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div style={{
      background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
      borderRadius: 'var(--radius-sm)', padding: '12px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
          padding: '3px 8px', borderRadius: 4,
          background: 'rgba(0,229,255,0.15)', color: 'var(--accent)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          BETA
        </span>
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          {"You're using the signpost beta. Features are still being built. Your feedback shapes what comes next."}
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          cursor: 'pointer', fontSize: '1rem', flexShrink: 0, padding: 4,
        }}
        aria-label="Dismiss"
      >
        &#10005;
      </button>
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
          fontFamily: "'DM Sans', sans-serif", padding: 0,
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
            signpost charges a flat $15 platform fee per interpreter, per confirmed booking. This fee is charged when you accept an interpreter&apos;s rate and confirm the booking.
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
            During beta, platform fees are tracked but not charged.
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
