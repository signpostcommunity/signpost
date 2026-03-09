'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BetaBanner, PageHeader, DemoBadge, DashMobileStyles } from '@/components/dashboard/interpreter/shared'

/* ── Types ── */

interface Message {
  id: string
  sender_name: string | null
  subject: string | null
  preview: string | null
  body: string | null
  is_read: boolean | null
  is_seed: boolean | null
  created_at: string
}

/* ── Avatar helper ── */

function getInitials(name: string | null): string {
  if (!name) return '??'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getGradient(name: string | null): string {
  const gradients = [
    'linear-gradient(135deg,#00e5ff,#7b61ff)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#34d399,#7b61ff)',
    'linear-gradient(135deg,#a78bfa,#f472b6)',
    'linear-gradient(135deg,#f97316,#facc15)',
  ]
  const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return gradients[hash % gradients.length]
}

function Avatar({ name, size = 40 }: { name: string | null; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: getGradient(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Syne', sans-serif", fontWeight: 700,
      fontSize: size <= 36 ? '0.75rem' : '0.88rem', color: '#fff',
    }}>
      {getInitials(name)}
    </div>
  )
}

/* ── Main Page ── */

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sentReplies, setSentReplies] = useState<Record<string, Array<{ body: string; time: string }>>>({})

  const fetchMessages = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile, error: profileErr } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) { setLoading(false); return }

    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_name, subject, preview, body, is_read, is_seed, created_at')
      .eq('interpreter_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[inbox] fetch failed:', error.message)
    } else {
      setMessages(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  async function markAsRead(msgId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', msgId)

    if (!error) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_read: true } : m))
    }
  }

  function handleOpenThread(msgId: string) {
    setActiveThread(msgId)
    const msg = messages.find(m => m.id === msgId)
    if (msg && !msg.is_read) {
      markAsRead(msgId)
    }
  }

  function sendReply(msgId: string) {
    if (!reply.trim()) return
    setSentReplies(prev => ({
      ...prev,
      [msgId]: [...(prev[msgId] || []), { body: reply, time: 'Just now' }],
    }))
    setReply('')
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  const active = messages.find(m => m.id === activeThread)
  const hasSeedData = messages.some(m => m.is_seed)

  if (activeThread && active) {
    const myReplies = sentReplies[activeThread] || []
    return (
      <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 720 }}>
        <button
          onClick={() => setActiveThread(null)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", padding: 0 }}
        >
          ← Back to Inbox
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Avatar name={active.sender_name} size={40} />
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem' }}>{active.sender_name || 'Unknown'}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 2 }}>{active.subject || '(no subject)'}</div>
          </div>
          {active.is_seed && <DemoBadge />}
        </div>

        {/* Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {/* Original message */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar name={active.sender_name} size={32} />
            <div style={{ maxWidth: '75%' }}>
              <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '12px 16px',
                fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text)',
              }}>
                {active.body || active.preview || '(no content)'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                {timeAgo(active.created_at)}
              </div>
            </div>
          </div>

          {/* Sent replies */}
          {myReplies.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, flexDirection: 'row-reverse' }}>
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
                  borderRadius: 'var(--radius)', padding: '12px 16px',
                  fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text)',
                }}>
                  {r.body}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>
                  {r.time}
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
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 760 }}>
      {hasSeedData && <BetaBanner />}
      <PageHeader title="Inbox" subtitle="Messages from requesters." />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Loading…
        </div>
      ) : messages.length === 0 ? (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '32px 24px',
          color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
        }}>
          No messages yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map(msg => (
            <MessageRow key={msg.id} msg={msg} onClick={() => handleOpenThread(msg.id)} timeAgo={timeAgo} />
          ))}
        </div>
      )}

      <DashMobileStyles />
    </div>
  )
}

function MessageRow({ msg, onClick, timeAgo }: { msg: Message; onClick: () => void; timeAgo: (d: string) => string }) {
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
          <Avatar name={msg.sender_name} size={36} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              {msg.sender_name || 'Unknown'}
              {msg.is_seed && <DemoBadge />}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 1 }}>{msg.subject || '(no subject)'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!msg.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{timeAgo(msg.created_at)}</span>
        </div>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.84rem', lineHeight: 1.5, margin: '0 0 0 46px' }}>
        {msg.preview || '(no preview)'}
      </p>
    </div>
  )
}
