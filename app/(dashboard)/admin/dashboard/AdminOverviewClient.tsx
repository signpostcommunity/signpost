'use client'

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

export default function AdminOverviewClient({
  stats,
  paymentStats,
  recentUsers,
  recentFlags,
}: {
  stats: Stats
  paymentStats: PaymentStats
  recentUsers: RecentUser[]
  recentFlags: RecentFlag[]
}) {
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <IconUsers />, href: '/admin/dashboard/users' },
    { label: 'Interpreters', value: stats.interpreters, icon: <IconInterpreter />, href: '/admin/dashboard/interpreters' },
    { label: 'Deaf/DB/HH Users', value: stats.deafUsers, icon: <IconDeaf />, href: '/admin/dashboard/users?role=deaf' },
    { label: 'Profile Flags', value: stats.profileFlags, icon: <IconFeedback />, href: '/admin/dashboard/flags' },
  ]

  return (
    <div className="admin-overview-content" style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 600, marginBottom: 8 }}>
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
