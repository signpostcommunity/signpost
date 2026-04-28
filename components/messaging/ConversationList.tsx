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

  function notifyUnreadChanged() {
    window.dispatchEvent(new Event('signpost:unread-changed'))
  }

  async function markAllRead() {
    const res = await fetch('/api/messages/conversations/mark-all-read', { method: 'PATCH' })
    if (res.ok) {
      setConversations(prev => prev.map(c => ({ ...c, unread: false })))
      notifyUnreadChanged()
    }
  }

  async function toggleRead(convoId: string, currentlyUnread: boolean) {
    if (currentlyUnread) {
      const res = await fetch(`/api/messages/conversations/${convoId}/read`, { method: 'POST' })
      if (res.ok) {
        setConversations(prev => prev.map(c => c.id === convoId ? { ...c, unread: false } : c))
        notifyUnreadChanged()
      }
    } else {
      const res = await fetch(`/api/messages/conversations/${convoId}/read`, { method: 'DELETE' })
      if (res.ok) {
        setConversations(prev => prev.map(c => c.id === convoId ? { ...c, unread: true } : c))
        notifyUnreadChanged()
      }
    }
  }

  async function deleteConversation(convoId: string) {
    const res = await fetch(`/api/messages/conversations/${convoId}`, { method: 'DELETE' })
    if (res.ok) {
      setConversations(prev => prev.filter(c => c.id !== convoId))
      notifyUnreadChanged()
    }
  }

  const unreadCount = conversations.filter(c => c.unread).length

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
      {unreadCount > 0 && (
        <div style={{
          padding: '8px 20px', display: 'flex', justifyContent: 'flex-end',
          borderBottom: '1px solid var(--border)',
        }}>
          <button
            onClick={markAllRead}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: accent, fontSize: '0.76rem', fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600, whiteSpace: 'nowrap', padding: '2px 4px',
            }}
          >
            Mark all read
          </button>
        </div>
      )}
      {conversations.map(convo => (
        <ConversationRow
          key={convo.id}
          convo={convo}
          accent={accent}
          onClick={() => router.push(`${threadBaseUrl}/${convo.id}`)}
          onToggleRead={() => toggleRead(convo.id, convo.unread)}
          onDelete={() => deleteConversation(convo.id)}
        />
      ))}
    </div>
  )
}

function ConversationRow({ convo, accent, onClick, onToggleRead, onDelete }: {
  convo: Conversation
  accent: string
  onClick: () => void
  onToggleRead: () => void
  onDelete: () => void
}) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {/* Mark read / unread toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleRead() }}
          title={convo.unread ? 'Mark as read' : 'Mark as unread'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', padding: 4,
            display: hover ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4, transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = accent }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          {convo.unread ? (
            /* Open envelope — mark as read */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 13V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h9" />
              <path d="M22 7l-10 7L2 7" />
            </svg>
          ) : (
            /* Closed envelope — mark as unread */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7l-10 7L2 7" />
            </svg>
          )}
        </button>
        {/* Delete conversation */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title="Delete conversation"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', padding: 4,
            display: hover ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4, transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
