'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { DEMO_MESSAGES } from '@/lib/data/demo'
import { BetaBanner, PageHeader, Avatar, DemoBadge } from '@/components/dashboard/interpreter/shared'

export default function InboxPage() {
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [reply, setReply] = useState('')
  const [sentMessages, setSentMessages] = useState<Record<string, Array<{ sender: string; body: string; time: string; fromMe: boolean }>>>({})

  const active = DEMO_MESSAGES.find(m => m.id === activeThread)

  function sendReply(msgId: string) {
    if (!reply.trim()) return
    setSentMessages(prev => ({
      ...prev,
      [msgId]: [...(prev[msgId] || []), { sender: 'You', body: reply, time: 'Just now', fromMe: true }],
    }))
    setReply('')
  }

  if (activeThread && active) {
    const allMessages = [...active.thread, ...(sentMessages[activeThread] || [])]
    return (
      <div style={{ padding: '48px 56px', maxWidth: 720 }}>
        <button
          onClick={() => setActiveThread(null)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", padding: 0 }}
        >
          ← Back to Inbox
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Avatar initials={active.avatar} gradient={active.avatarGradient} size={40} />
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem' }}>{active.from}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 2 }}>{active.subject}</div>
          </div>
          <DemoBadge />
        </div>

        {/* Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {allMessages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12,
              flexDirection: msg.fromMe ? 'row-reverse' : 'row',
            }}>
              {!msg.fromMe && (
                <Avatar initials={active.avatar} gradient={active.avatarGradient} size={32} />
              )}
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  background: msg.fromMe ? 'rgba(0,229,255,0.08)' : 'var(--card-bg)',
                  border: `1px solid ${msg.fromMe ? 'rgba(0,229,255,0.2)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  padding: '12px 16px',
                  fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text)',
                }}>
                  {msg.body}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4, textAlign: msg.fromMe ? 'right' : 'left' }}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply box */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <textarea
            placeholder="Write a reply…"
            value={reply}
            onChange={e => setReply(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
              outline: 'none', resize: 'vertical', minHeight: 80, marginBottom: 12,
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-primary"
              style={{ padding: '9px 22px', fontSize: '0.85rem' }}
              onClick={() => sendReply(activeThread)}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 56px', maxWidth: 760 }}>
      <BetaBanner />
      <PageHeader title="Inbox" subtitle="Messages from requesters." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DEMO_MESSAGES.map(msg => (
          <MessageRow key={msg.id} msg={msg} onClick={() => setActiveThread(msg.id)} />
        ))}
      </div>
    </div>
  )
}

function MessageRow({ msg, onClick }: { msg: typeof DEMO_MESSAGES[0]; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${hover ? 'rgba(0,229,255,0.35)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '18px 22px',
        cursor: 'pointer', transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={msg.avatar} gradient={msg.avatarGradient} size={36} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              {msg.from}
              <DemoBadge />
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 1 }}>{msg.subject}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {msg.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{msg.time}</span>
        </div>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 0 46px' }}>
        {msg.preview}
      </p>
    </div>
  )
}
