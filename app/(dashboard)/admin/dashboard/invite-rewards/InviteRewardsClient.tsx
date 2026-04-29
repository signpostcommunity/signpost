'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ORANGE = '#ff7e45'

interface Reward {
  id: string
  senderUserId: string
  senderName: string
  senderEmail: string | null
  thresholdMetAt: string
  distinctInviteCount: number
  giftCardProvider: string
  giftCardAmount: number
  giftCardCurrency: string
  giftCardSentAt: string | null
  sentByName: string | null
  notes: string | null
}

export default function InviteRewardsClient({ rewards }: { rewards: Reward[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const pending = rewards.filter(r => !r.giftCardSentAt)
  const fulfilled = rewards.filter(r => r.giftCardSentAt)

  async function markSent(rewardId: string) {
    if (!confirm('Mark this gift card as sent? This means you have already sent the Starbucks eGift Card via the Starbucks app.')) return
    setLoading(rewardId)
    try {
      const res = await fetch('/api/admin/invite-rewards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(`Failed: ${err.error}`)
      } else {
        router.refresh()
      }
    } catch {
      alert('Network error')
    } finally {
      setLoading(null)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>
        Invite Rewards
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 32 }}>
        Interpreters who invited 5+ distinct people earn a $15 Starbucks gift card. Send via the Starbucks app, then mark as sent here.
      </p>

      {rewards.length === 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '40px 24px',
          textAlign: 'center', color: 'var(--muted)',
        }}>
          No interpreters have reached the 5-invite threshold yet.
        </div>
      )}

      {/* Pending rewards */}
      {pending.length > 0 && (
        <>
          <h2 style={{
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: ORANGE, marginBottom: 12,
          }}>
            Pending ({pending.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {pending.map(r => (
              <div key={r.id} style={{
                background: '#111118', border: '1px solid var(--border)',
                borderLeft: `3px solid ${ORANGE}`,
                borderRadius: 'var(--radius-sm)', padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.senderName}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 2 }}>
                    {r.senderEmail}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 4 }}>
                    {r.distinctInviteCount} distinct invites &middot; Threshold met {formatDate(r.thresholdMetAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    background: 'rgba(255,126,69,0.12)', color: ORANGE,
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600,
                  }}>
                    ${r.giftCardAmount} {r.giftCardProvider}
                  </span>
                  <button
                    onClick={() => markSent(r.id)}
                    disabled={loading === r.id}
                    style={{
                      background: ORANGE, color: '#fff', border: 'none',
                      borderRadius: 'var(--radius-sm)', padding: '8px 16px',
                      fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      opacity: loading === r.id ? 0.5 : 1,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {loading === r.id ? 'Saving...' : 'Mark gift card sent'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Fulfilled rewards */}
      {fulfilled.length > 0 && (
        <>
          <h2 style={{
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12,
          }}>
            Sent ({fulfilled.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fulfilled.map(r => (
              <div key={r.id} style={{
                background: '#111118', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '16px 20px',
                opacity: 0.7,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.senderName}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 2 }}>
                    {r.senderEmail}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 4 }}>
                    {r.distinctInviteCount} distinct invites &middot; Threshold met {formatDate(r.thresholdMetAt)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#22c55e', fontSize: '0.82rem', fontWeight: 600 }}>
                    Sent
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>
                    {formatDate(r.giftCardSentAt!)}
                    {r.sentByName && ` by ${r.sentByName}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
