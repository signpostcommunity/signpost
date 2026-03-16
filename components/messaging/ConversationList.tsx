'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Conversation {
  id: string
  subject: string | null
  lastMessageAt: string | null
  lastMessage: { body: string; senderId: string } | null
  otherParticipant: {
    userId: string | null
    name: string
    photoUrl: string | null
  }
  unread: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg,#00e5ff,#7b61ff)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#34d399,#7b61ff)',
    'linear-gradient(135deg,#a78bfa,#f472b6)',
    'linear-gradient(135deg,#f97316,#facc15)',
  ]
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return gradients[hash % gradients.length]
}

function Avatar({ name, photo, size = 40 }: { name: string; photo: string | null; size?: number }) {
  if (photo) {
    return <img src={photo} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: getGradient(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
      fontSize: size <= 36 ? '0.75rem' : '0.88rem', color: '#fff',
    }}>
      {getInitials(name)}
    </div>
  )
}

export default function ConversationList({ threadBaseUrl, accent = '#00e5ff' }: { threadBaseUrl: string; accent?: string }) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/conversations')
      if (res.ok) {
        const data = await res.json()
        // API returns { conversations: [...] }
        setConversations(data.conversations || data || [])
      }
    } catch (err) {
      console.error('[conversations] fetch error:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 30000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  if (loading) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>
        Loading conversations...
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>
        No messages yet. Start a conversation from any interpreter&apos;s profile.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {conversations.map(convo => (
        <ConversationRow
          key={convo.id}
          convo={convo}
          accent={accent}
          onClick={() => router.push(`${threadBaseUrl}/${convo.id}`)}
        />
      ))}
    </div>
  )
}

function ConversationRow({ convo, accent, onClick }: { convo: Conversation; accent: string; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  const name = convo.otherParticipant.name
  const photo = convo.otherParticipant.photoUrl
  const preview = convo.lastMessage?.body || ''

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      style={{
        padding: '16px 20px', cursor: 'pointer',
        transition: 'background 0.15s',
        background: convo.unread
          ? (hover ? `${accent}12` : `${accent}08`)
          : (hover ? 'rgba(255,255,255,0.02)' : 'transparent'),
        borderBottom: '1px solid var(--border)',
        borderLeft: convo.unread ? `3px solid ${accent}` : '3px solid transparent',
        display: 'flex', alignItems: 'center', gap: 12,
        outline: 'none',
      }}
    >
      <Avatar name={name} photo={photo} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: convo.unread ? 600 : 400,
            fontSize: '0.88rem', color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {convo.unread && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, display: 'inline-block' }} />
            )}
            {convo.lastMessageAt && (
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
                {timeAgo(convo.lastMessageAt)}
              </span>
            )}
          </div>
        </div>
        <p style={{
          margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.45,
          fontFamily: "'DM Sans', sans-serif", opacity: 0.75,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {preview.length > 80 ? preview.slice(0, 80) + '...' : preview || '(no messages)'}
        </p>
      </div>
    </div>
  )
}
