'use client'

import { useState, useEffect } from 'react'

type TargetListRole = 'interpreter_team' | 'dhh_pref_list' | 'requester_pref_list'

interface PendingInvite {
  id: string
  recipient_name: string
  recipient_email: string
  status: string
  sent_at: string
  target_list_role: string
}

interface PendingInvitesProps {
  targetListRole: TargetListRole
  accentColor?: string
}

export default function PendingInvites({
  targetListRole,
  accentColor = '#00e5ff',
}: PendingInvitesProps) {
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvites() {
      try {
        const res = await fetch('/api/invites')
        if (!res.ok) { setLoading(false); return }
        const data = await res.json()
        const filtered = (data.invites || []).filter(
          (inv: PendingInvite) =>
            inv.status === 'sent' &&
            (inv.target_list_role || 'interpreter_team') === targetListRole
        )
        setInvites(filtered)
      } catch {
        // Silently fail - pending invites is informational
      }
      setLoading(false)
    }
    fetchInvites()
  }, [targetListRole])

  if (loading || invites.length === 0) return null

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 600,
        fontSize: '13px', letterSpacing: '0.08em',
        textTransform: 'uppercase', color: accentColor,
        marginBottom: 12,
      }}>
        Pending Invites ({invites.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {invites.map(inv => (
          <div key={inv.id} style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${accentColor}44, ${accentColor}22)`,
                border: `1px solid ${accentColor}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Inter', sans-serif", fontWeight: 700,
                fontSize: '0.68rem', color: accentColor,
              }}>
                {inv.recipient_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
                  {inv.recipient_name}
                </div>
                <div style={{
                  fontSize: '0.75rem', color: 'var(--muted)', marginTop: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {inv.recipient_email}
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '0.72rem', color: 'var(--muted)',
              border: '1px solid var(--border)',
              padding: '3px 10px', borderRadius: 100,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Pending
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
