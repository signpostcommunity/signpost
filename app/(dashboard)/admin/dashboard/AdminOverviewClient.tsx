'use client'

import { useState } from 'react'
import Link from 'next/link'

const ORANGE = '#ff7e45'

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke="var(--muted)" strokeWidth="1.5"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconInterpreter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 2a5 5 0 015 5v3a5 5 0 01-10 0V7a5 5 0 015-5z" stroke="var(--muted)" strokeWidth="1.5"/>
      <path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconDeaf() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke="var(--muted)" strokeWidth="1.5"/>
    </svg>
  )
}

function IconFeedback() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

interface Stats {
  totalUsers: number
  interpreters: number
  deafUsers: number
  profileFlags: number
}

interface PaymentStats {
  feesCollected: { count: number; total: number }
  feesFailed: { count: number; total: number }
  creditsOutstanding: { count: number; total: number }
}

interface RecentUser {
  id: string
  role: string
  email: string | null
  created_at: string
}

interface RecentFlag {
  id: string
  reason: string
  status: string
  created_at: string
  interpreter_name: string
}

interface QualityAlert {
  id: string
  interpreter_id: string
  interpreter_name: string
  alert_level: 'yellow' | 'orange' | 'red'
  signal_type: string
  signal_details: Record<string, unknown>
  status: string
  created_at: string
}

const ALERT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  red: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)', text: '#ef4444' },
  orange: { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.35)', text: '#f97316' },
  yellow: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.35)', text: '#eab308' },
}

function describeSignalType(signal_type: string, details: Record<string, unknown>): string {
  switch (signal_type) {
    case 'would_not_book':
      return `${details.count} "would not book again" response${(details.count as number) !== 1 ? 's' : ''}`
    case 'low_rating':
      if (details.reason === 'single_1_star') return '1-star rating received'
      return `Average rating below 3.0 (${details.avg_met_needs}/${details.avg_professional}) across ${details.total_ratings} ratings`
    case 'dnb_frequency':
      return `Appears on ${details.dnb_count} Do Not Book list${(details.dnb_count as number) !== 1 ? 's' : ''}`
    case 'cancellation_pattern':
      return `${details.count} cancellation${(details.count as number) !== 1 ? 's' : ''} in last ${details.window_days} days`
    case 'flags':
      return `${details.count} profile flag${(details.count as number) !== 1 ? 's' : ''}`
    default:
      return 'Quality concern detected'
  }
}

export default function AdminOverviewClient({
  stats,
  paymentStats,
  recentUsers,
  recentFlags,
  qualityAlerts: initialAlerts,
}: {
  stats: Stats
  paymentStats: PaymentStats
  recentUsers: RecentUser[]
  recentFlags: RecentFlag[]
  qualityAlerts: QualityAlert[]
}) {
  const [qualityAlerts, setQualityAlerts] = useState<QualityAlert[]>(initialAlerts)
  const [showDismissed, setShowDismissed] = useState(false)
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [dismissNote, setDismissNote] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [runningCheck, setRunningCheck] = useState(false)

  async function handleDismiss(alertId: string) {
    if (!dismissNote.trim()) return
    try {
      const res = await fetch('/api/admin/quality-alert-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'dismiss', notes: dismissNote.trim() }),
      })
      if (res.ok) {
        setQualityAlerts(prev => prev.filter(a => a.id !== alertId))
        setDismissingId(null)
        setDismissNote('')
      }
    } catch { /* silent */ }
  }

  async function runQualityCheck() {
    setRunningCheck(true)
    try {
      const res = await fetch('/api/admin/quality-check')
      if (res.ok) {
        // Reload page to get fresh alerts
        window.location.reload()
      }
    } catch { /* silent */ }
    setRunningCheck(false)
  }

  const activeAlerts = qualityAlerts.filter(a => a.status === 'active')
  // Sort: red first, then orange, then yellow
  const sortedAlerts = [...activeAlerts].sort((a, b) => {
    const rank: Record<string, number> = { red: 3, orange: 2, yellow: 1 }
    return (rank[b.alert_level] || 0) - (rank[a.alert_level] || 0)
  })
  const highestLevel = sortedAlerts.length > 0 ? sortedAlerts[0].alert_level : null

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <IconUsers />, href: '/admin/dashboard/users' },
    { label: 'Interpreters', value: stats.interpreters, icon: <IconInterpreter />, href: '/admin/dashboard/interpreters' },
    { label: 'Deaf/DB/HH Users', value: stats.deafUsers, icon: <IconDeaf />, href: '/admin/dashboard/users?role=deaf' },
    { label: 'Profile Flags', value: stats.profileFlags, icon: <IconFeedback />, href: '/admin/dashboard/flags' },
  ]

  return (
    <div className="admin-overview-content" style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 725, marginBottom: 8 }}>
        Admin Dashboard
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 32 }}>
        Platform overview and recent activity
      </p>

      {/* Stat cards */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {statCards.map(card => (
          <Link key={card.label} href={card.href} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '20px 24px',
            textDecoration: 'none', transition: 'border-color 0.15s',
            display: 'flex', flexDirection: 'column',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${ORANGE}66` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              {card.icon}
              {card.label}
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '2rem', fontWeight: 700, color: ORANGE }}>
              {card.value}
            </div>
          </Link>
        ))}
      </div>

      {/* Quality Concerns */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{
              fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: highestLevel ? ALERT_COLORS[highestLevel].text : ORANGE,
              margin: 0,
            }}>
              QUALITY CONCERNS
            </h2>
            {sortedAlerts.length > 0 && (
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: highestLevel ? ALERT_COLORS[highestLevel].bg : 'transparent',
                color: highestLevel ? ALERT_COLORS[highestLevel].text : 'var(--muted)',
              }}>
                {sortedAlerts.length}
              </span>
            )}
          </div>
          <button
            onClick={runQualityCheck}
            disabled={runningCheck}
            style={{
              background: 'transparent', border: `1px solid ${ORANGE}44`,
              borderRadius: 10, padding: '6px 14px', fontSize: '0.75rem',
              fontWeight: 600, color: ORANGE, cursor: runningCheck ? 'wait' : 'pointer',
              opacity: runningCheck ? 0.6 : 1,
            }}
          >
            {runningCheck ? 'Running...' : 'Run Quality Check'}
          </button>
        </div>

        {sortedAlerts.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '24px',
            color: 'var(--muted)', fontSize: '0.85rem',
          }}>
            No quality concerns detected. The system monitors ratings, cancellation patterns, and Do Not Book list frequency.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedAlerts.map(alert => {
              const colors = ALERT_COLORS[alert.alert_level]
              const isDismissing = dismissingId === alert.id
              const isExpanded = expandedId === alert.id

              return (
                <div key={alert.id} style={{
                  background: 'var(--surface)', border: `1px solid ${colors.border}`,
                  borderRadius: 'var(--radius-sm)', padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 999,
                          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                          background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                        }}>
                          {alert.alert_level}
                        </span>
                        <Link
                          href={`/admin/dashboard/interpreters?id=${alert.interpreter_id}`}
                          style={{ color: 'var(--text)', fontSize: '0.92rem', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {alert.interpreter_name}
                        </Link>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                        {describeSignalType(alert.signal_type, alert.signal_details)}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: 4, opacity: 0.7 }}>
                        Active since {new Date(alert.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                        style={{
                          background: 'transparent', border: '1px solid var(--border)',
                          borderRadius: 10, padding: '6px 12px', fontSize: '0.75rem',
                          fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
                        }}
                      >
                        {isExpanded ? 'Close' : 'Review'}
                      </button>
                      <button
                        onClick={() => { setDismissingId(isDismissing ? null : alert.id); setDismissNote('') }}
                        style={{
                          background: 'transparent', border: '1px solid var(--border)',
                          borderRadius: 10, padding: '6px 12px', fontSize: '0.75rem',
                          fontWeight: 600, color: 'var(--muted)', cursor: 'pointer',
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  {/* Dismiss flow */}
                  {isDismissing && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: '#c8cdd8', marginBottom: 6 }}>
                        Add a note explaining your decision
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={dismissNote}
                          onChange={e => setDismissNote(e.target.value)}
                          placeholder="Required before dismissing"
                          style={{
                            flex: 1, padding: '8px 12px', background: 'var(--surface2)',
                            border: '1px solid var(--border)', borderRadius: 10,
                            color: 'var(--text)', fontSize: '0.82rem', outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          disabled={!dismissNote.trim()}
                          style={{
                            background: dismissNote.trim() ? ORANGE : 'var(--border)',
                            border: 'none', borderRadius: 10, padding: '8px 16px',
                            fontSize: '0.78rem', fontWeight: 600,
                            color: dismissNote.trim() ? '#0a0a0f' : 'var(--muted)',
                            cursor: dismissNote.trim() ? 'pointer' : 'not-allowed',
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Review expanded detail */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontWeight: 600, color: '#c8cdd8' }}>Signal type:</span>{' '}
                          {alert.signal_type.replace(/_/g, ' ')}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <span style={{ fontWeight: 600, color: '#c8cdd8' }}>Details:</span>{' '}
                          {JSON.stringify(alert.signal_details, null, 0)}
                        </div>
                        <div>
                          <Link
                            href={`/admin/dashboard/interpreters?id=${alert.interpreter_id}`}
                            style={{ color: ORANGE, fontSize: '0.78rem', fontWeight: 600 }}
                          >
                            View full interpreter profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="admin-recent-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent signups */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 24 }}>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
            Recent Signups
          </h2>
          {recentUsers.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No signups yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentUsers.map(u => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                  fontSize: '0.85rem',
                }}>
                  <div>
                    <div style={{ color: 'var(--text)' }}>{u.email || 'No email'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>
                      <span style={{
                        display: 'inline-block', padding: '1px 8px', borderRadius: 999,
                        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                        background: u.role === 'interpreter' ? 'rgba(0,229,255,0.1)' : u.role === 'deaf' ? 'rgba(157,135,255,0.1)' : 'rgba(255,107,43,0.1)',
                        color: u.role === 'interpreter' ? 'var(--accent)' : u.role === 'deaf' ? 'var(--accent2)' : ORANGE,
                      }}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent flags */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 24 }}>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
            Recent Profile Flags
          </h2>
          {recentFlags.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No flags yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentFlags.map(f => (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                  fontSize: '0.85rem',
                }}>
                  <div>
                    <div style={{ color: 'var(--text)' }}>{f.interpreter_name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>{f.reason}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{
                      padding: '1px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
                      background: f.status === 'pending' ? 'rgba(255,107,43,0.15)' : 'rgba(0,229,255,0.1)',
                      color: f.status === 'pending' ? ORANGE : 'var(--accent)',
                    }}>
                      {f.status}
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment stats */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          Platform Fees
        </h2>
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '20px 24px',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Fees Collected
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#22c55e' }}>
              ${paymentStats.feesCollected.total.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
              {paymentStats.feesCollected.count} booking{paymentStats.feesCollected.count !== 1 ? 's' : ''}
            </div>
          </div>

          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '20px 24px',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Fees Failed / Pending
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: paymentStats.feesFailed.count > 0 ? '#ef4444' : 'var(--muted)' }}>
              ${paymentStats.feesFailed.total.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
              {paymentStats.feesFailed.count} booking{paymentStats.feesFailed.count !== 1 ? 's' : ''}
            </div>
          </div>

          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '20px 24px',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Credits Outstanding
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: ORANGE }}>
              ${paymentStats.creditsOutstanding.total.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
              {paymentStats.creditsOutstanding.count} credit{paymentStats.creditsOutstanding.count !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-overview-content { padding: 24px 16px !important; }
          .admin-recent-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
