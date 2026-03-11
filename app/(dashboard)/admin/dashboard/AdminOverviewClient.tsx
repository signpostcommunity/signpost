'use client'

const ORANGE = '#ff6b2b'

interface Stats {
  totalUsers: number
  interpreters: number
  deafUsers: number
  betaFeedback: number
  profileFlags: number
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
  recentUsers,
  recentFlags,
}: {
  stats: Stats
  recentUsers: RecentUser[]
  recentFlags: RecentFlag[]
}) {
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👤' },
    { label: 'Interpreters', value: stats.interpreters, icon: '🤟' },
    { label: 'Deaf/DB/HH Users', value: stats.deafUsers, icon: '💜' },
    { label: 'Beta Feedback', value: stats.betaFeedback, icon: '💬' },
  ]

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
        Admin Dashboard
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 32 }}>
        Platform overview and recent activity
      </p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '20px 24px',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {card.icon} {card.label}
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 700, color: ORANGE }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent signups */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 24 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
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
                        fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
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
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
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

      <style>{`
        @media (max-width: 768px) {
          .admin-main > div { padding: 24px 20px !important; }
          .admin-main > div > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
