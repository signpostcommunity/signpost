'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/components/ui/Toast'

const ORANGE = '#ff7e45'

interface Flag {
  id: string
  interpreterProfileId: string
  interpreterName: string
  flaggedByEmail: string
  reason: string
  details: string
  status: string
  created_at: string
}

export default function FlagsClient({ flags }: { flags: Flag[] }) {
  const [updating, setUpdating] = useState<string | null>(null)
  const [localFlags, setLocalFlags] = useState<Flag[]>(flags)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  async function handleFlagAction(flagId: string, action: 'reviewed' | 'dismissed' | 'suspended') {
    setUpdating(flagId)
    try {
      const res = await fetch('/api/admin/flag-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagId, action }),
      })
      if (res.ok) {
        // Update local state without full refresh
        setLocalFlags(prev => prev.map(f =>
          f.id === flagId ? { ...f, status: action } : f
        ))
        const labels: Record<string, string> = { reviewed: 'Reviewed', dismissed: 'Dismissed', suspended: 'Suspended' }
        setToast({ message: `Flag marked as ${labels[action]}.`, type: 'success' })
      } else {
        const data = await res.json()
        setToast({ message: data.error || 'Action failed', type: 'error' })
      }
    } catch {
      setToast({ message: 'Network request failed', type: 'error' })
    }
    setUpdating(null)
  }

  // Sort: pending first, then by date
  const sorted = [...localFlags].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: `${ORANGE}22`, color: ORANGE }
      case 'suspended': return { bg: 'rgba(255,107,133,0.15)', color: 'var(--accent3)' }
      case 'actioned': return { bg: 'rgba(255,107,133,0.15)', color: 'var(--accent3)' }
      default: return { bg: 'rgba(0,229,255,0.1)', color: 'var(--accent)' }
    }
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 650, marginBottom: 8 }}>
        Profile Flags
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24 }}>
        {localFlags.filter(f => f.status === 'pending').length} pending flag{localFlags.filter(f => f.status === 'pending').length !== 1 ? 's' : ''} &middot; {localFlags.length} total
      </p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Flagged Interpreter', 'Reason', 'Details', 'Flagged By', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontFamily: "'Inter', sans-serif", fontWeight: 700,
                    fontSize: '0.7rem', textTransform: 'uppercase',
                    letterSpacing: '0.1em', color: 'var(--muted)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(f => {
                const sc = statusColor(f.status)
                return (
                  <tr key={f.id} style={{
                    borderBottom: '1px solid var(--border)',
                    background: f.status === 'pending' ? 'rgba(255,107,43,0.03)' : 'transparent',
                  }}>
                    <td style={{ padding: '10px 16px' }}>
                      <a
                        href={`/directory/${f.interpreterProfileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: ORANGE, textDecoration: 'none' }}
                      >
                        {f.interpreterName}
                      </a>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text)', maxWidth: 200 }}>{f.reason}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', maxWidth: 200, fontSize: '0.8rem' }}>
                      {f.details || '\u2014'}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: '0.8rem' }}>{f.flaggedByEmail}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                        background: sc.bg, color: sc.color,
                      }}>
                        {f.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {f.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleFlagAction(f.id, 'reviewed')}
                            disabled={updating === f.id}
                            style={{
                              padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(0,229,255,0.3)',
                              background: 'none', color: 'var(--accent)', fontSize: '0.75rem',
                              cursor: 'pointer', opacity: updating === f.id ? 0.5 : 1,
                            }}
                          >
                            Reviewed
                          </button>
                          <button
                            onClick={() => handleFlagAction(f.id, 'dismissed')}
                            disabled={updating === f.id}
                            style={{
                              padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)',
                              background: 'none', color: 'var(--muted)', fontSize: '0.75rem',
                              cursor: 'pointer', opacity: updating === f.id ? 0.5 : 1,
                            }}
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleFlagAction(f.id, 'suspended')}
                            disabled={updating === f.id}
                            style={{
                              padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,107,133,0.3)',
                              background: 'none', color: 'var(--accent3)', fontSize: '0.75rem',
                              cursor: 'pointer', opacity: updating === f.id ? 0.5 : 1,
                            }}
                          >
                            Suspend
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                    No profile flags yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
