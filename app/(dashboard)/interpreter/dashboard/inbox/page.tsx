'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BetaBanner, PageHeader, DemoBadge, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import ConversationList from '@/components/messaging/ConversationList'

/* ── Types ── */

interface Message {
  id: string
  sender_name: string | null
  subject: string | null
  preview: string | null
  body: string | null
  is_read: boolean | null
  is_seed: boolean | null
  archived: boolean | null
  created_at: string
}

interface Notification {
  id: string
  type: string
  subject: string | null
  body: string | null
  status: string
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
      fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
      fontSize: size <= 36 ? '0.75rem' : '0.88rem', color: '#fff',
    }}>
      {getInitials(name)}
    </div>
  )
}

/* ── Notification icon helper ── */

function NotificationIcon({ type, size = 20 }: { type: string; size?: number }) {
  const color = 'var(--accent)'
  const s = size

  switch (type) {
    case 'booking_confirmed':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'new_request':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 7L2 7" />
        </svg>
      )
    case 'added_to_preferred_list':
    case 'added_to_preferred_list_by_interpreter':
    case 'added_to_preferred_list_by_org':
    case 'added_to_preferred_list_by_dhh':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    case 'new_message':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      )
    case 'profile_approved':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      )
  }
}

/* ── Time helper ── */

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

/* ── Main Page ── */

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sentReplies, setSentReplies] = useState<Record<string, Array<{ body: string; time: string }>>>({})
  const [showArchived, setShowArchived] = useState(false)
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null)

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
      .select('id, sender_name, subject, preview, body, is_read, is_seed, archived, created_at')
      .eq('interpreter_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[inbox] fetch messages failed:', error.message)
    } else {
      setMessages(data || [])
    }
    setLoading(false)
  }, [])

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Only show notifications relevant to the Interpreter portal
    const INTERPRETER_TYPES = [
      'welcome', 'profile_approved', 'profile_denied', 'new_request',
      'booking_confirmed', 'rate_response', 'booking_cancelled',
      'cancelled_by_requester', 'cancelled_by_you', 'sub_search_update',
      'booking_reminder', 'new_message', 'invoice_paid', 'team_invite',
      'added_to_preferred_list', 'added_to_preferred_list_by_interpreter',
      'added_to_preferred_list_by_org', 'added_to_preferred_list_by_dhh',
    ]

    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, subject, body, status, created_at')
      .eq('recipient_user_id', user.id)
      .eq('channel', 'in_app')
      .in('type', INTERPRETER_TYPES)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[inbox] fetch notifications failed:', error.message)
    } else {
      setNotifications(data || [])
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    fetchNotifications()
  }, [fetchMessages, fetchNotifications])

  function notifyUnreadChanged() {
    window.dispatchEvent(new Event('signpost:unread-changed'))
  }

  async function markMessageAsRead(msgId: string) {
    const res = await fetch(`/api/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: true }),
    })
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_read: true } : m))
      notifyUnreadChanged()
    }
  }

  async function archiveMessage(msgId: string) {
    const res = await fetch(`/api/messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true }),
    })
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, archived: true } : m))
      notifyUnreadChanged()
    }
  }

  async function markNotificationAsRead(notifId: string) {
    const res = await fetch(`/api/notifications/${notifId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'read' }),
    })
    if (res.ok) {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, status: 'read' } : n))
      notifyUnreadChanged()
    }
  }

  async function markAllNotificationsAsRead() {
    const res = await fetch('/api/notifications/mark-all-read', { method: 'PATCH' })
    if (res.ok) {
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })))
      notifyUnreadChanged()
    }
  }

  async function deleteNotification(notifId: string) {
    const res = await fetch(`/api/notifications/${notifId}`, { method: 'DELETE' })
    if (res.ok) {
      setNotifications(prev => prev.filter(n => n.id !== notifId))
      notifyUnreadChanged()
    }
  }

  function handleOpenThread(msgId: string) {
    setActiveThread(msgId)
    const msg = messages.find(m => m.id === msgId)
    if (msg && !msg.is_read) {
      markMessageAsRead(msgId)
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

  const active = messages.find(m => m.id === activeThread)
  const hasSeedData = messages.some(m => m.is_seed)
  const unreadNotifCount = notifications.filter(n => n.status !== 'read').length
  const visibleMessages = showArchived ? messages.filter(m => m.archived) : messages.filter(m => !m.archived)
  const unreadMsgCount = messages.filter(m => !m.is_read && !m.archived).length

  /* ── Legacy thread detail view (for seed/booking messages) ── */

  if (activeThread && active) {
    const myReplies = sentReplies[activeThread] || []
    return (
      <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
        <button
          onClick={() => setActiveThread(null)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", padding: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          Back to Inbox
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Avatar name={active.sender_name} size={40} />
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1rem' }}>{active.sender_name || 'Unknown'}</div>
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
            placeholder="Write a reply..."
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

  /* ── Tabbed inbox view ── */

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {hasSeedData && <BetaBanner />}
      <PageHeader title="Messages & Notifications" />

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 16,
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={() => setActiveTab('messages')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'messages' ? 'var(--accent)' : 'var(--muted)',
            borderBottom: activeTab === 'messages' ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'notifications' ? 'var(--accent)' : 'var(--muted)',
            borderBottom: activeTab === 'notifications' ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'color 0.15s, border-color 0.15s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          Notifications
          {unreadNotifCount > 0 && (
            <span style={{
              background: 'var(--accent)', color: '#000', fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              lineHeight: '1.4',
            }}>
              {unreadNotifCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', flex: 1 }}>
          Loading...
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

          {/* ── Messages Tab ── */}
          {activeTab === 'messages' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 16, minHeight: 0 }}>
              {/* Real conversations */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius) var(--radius) 0 0',
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: '1px solid var(--border)',
                }}>
                  <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text)', flex: 1 }}>
                    Conversations
                  </h2>
                </div>
                <div style={{
                  flex: 1, overflowY: 'auto', background: 'var(--card-bg)',
                  border: '1px solid var(--border)', borderTop: 'none',
                  borderRadius: '0 0 var(--radius) var(--radius)',
                }}>
                  <ConversationList
                    threadBaseUrl="/interpreter/dashboard/inbox/conversation"
                    accent="#00e5ff"
                  />
                </div>
              </div>

              {/* Legacy seed/booking messages (if any) */}
              {visibleMessages.length > 0 && (
                <div style={{ flex: 'none', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    background: 'var(--surface)', borderRadius: 'var(--radius) var(--radius) 0 0',
                    padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text)', flex: 1 }}>
                      Inquiries
                    </h2>
                    {unreadMsgCount > 0 && (
                      <span style={{
                        background: 'var(--accent)', color: '#000', fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        lineHeight: '1.4',
                      }}>
                        {unreadMsgCount}
                      </span>
                    )}
                    <button
                      onClick={() => setShowArchived(!showArchived)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: showArchived ? 'var(--accent)' : 'var(--muted)', fontSize: '0.76rem',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: 'nowrap',
                        padding: '2px 4px',
                      }}
                    >
                      {showArchived ? 'Show active' : 'Archived'}
                    </button>
                  </div>
                  <div style={{
                    overflowY: 'auto', maxHeight: 300, background: 'var(--card-bg)',
                    border: '1px solid var(--border)', borderTop: 'none',
                    borderRadius: '0 0 var(--radius) var(--radius)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {visibleMessages.map(msg => (
                        <MessageRow
                          key={msg.id}
                          msg={msg}
                          onClick={() => handleOpenThread(msg.id)}
                          onArchive={() => archiveMessage(msg.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{
                background: 'var(--surface)', borderRadius: 'var(--radius) var(--radius) 0 0',
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid var(--border)',
              }}>
                <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text)', flex: 1 }}>
                  Notifications
                </h2>
                {unreadNotifCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--accent)', fontSize: '0.76rem', fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600, whiteSpace: 'nowrap', padding: '2px 4px',
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{
                flex: 1, overflowY: 'auto', background: 'var(--card-bg)',
                border: '1px solid var(--border)', borderTop: 'none',
                borderRadius: '0 0 var(--radius) var(--radius)',
              }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>
                    No notifications yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {notifications.map(notif => (
                      <NotificationRow
                        key={notif.id}
                        notif={notif}
                        expanded={expandedNotifId === notif.id}
                        onToggle={() => {
                          const willExpand = expandedNotifId !== notif.id
                          setExpandedNotifId(willExpand ? notif.id : null)
                          if (willExpand && notif.status !== 'read') {
                            markNotificationAsRead(notif.id)
                          }
                        }}
                        onDelete={() => deleteNotification(notif.id)}
                        prefsHref="/interpreter/dashboard/profile?tab=account-settings"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <DashMobileStyles />
    </div>
  )
}

/* ── Notification Row (expandable) ── */

function NotificationRow({ notif, expanded, onToggle, onDelete, prefsHref }: {
  notif: Notification
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  prefsHref: string
}) {
  const [hover, setHover] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const isUnread = notif.status !== 'read'

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        borderLeft: isUnread ? '3px solid var(--accent)' : '3px solid transparent',
        transition: 'background 0.15s, border-color 0.2s',
      }}
    >
      {/* Clickable header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          padding: '14px 20px',
          cursor: 'pointer',
          transition: 'background 0.15s',
          background: isUnread
            ? (hover ? 'rgba(0,229,255,0.07)' : 'rgba(0,229,255,0.04)')
            : (hover ? 'rgba(255,255,255,0.02)' : 'transparent'),
          display: 'flex', alignItems: 'flex-start', gap: 12,
          outline: 'none',
        }}
      >
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <NotificationIcon type={notif.type} size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: expanded ? 0 : 3 }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem',
              fontWeight: isUnread ? 600 : 400, color: 'var(--text)',
              ...(expanded ? {} : { whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }),
            }}>
              {notif.subject || '(no subject)'}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
              {timeAgo(notif.created_at)}
            </span>
          </div>
          {!expanded && notif.body && (
            <p style={{
              margin: 0, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.45,
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {notif.body}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            className="notif-delete-btn"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            title="Delete notification"
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div
          ref={bodyRef}
          style={{
            padding: '0 20px 16px 50px',
            background: 'rgba(0,229,255,0.02)',
          }}
        >
          {notif.body && (
            <p style={{
              margin: '0 0 12px', fontSize: '0.85rem', color: '#b0b0b0', lineHeight: 1.65,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {notif.body}
            </p>
          )}
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
            {new Date(notif.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
          <Link
            href={prefsHref}
            style={{
              fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif",
              textDecoration: 'none', opacity: 0.7,
            }}
          >
            Manage notification preferences
          </Link>
        </div>
      )}
    </div>
  )
}

/* ── Message Row (legacy seed/booking messages) ── */

function MessageRow({ msg, onClick, onArchive }: { msg: Message; onClick: () => void; onArchive: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'background 0.15s, opacity 0.15s',
        background: hover ? 'rgba(255,255,255,0.02)' : 'transparent',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        opacity: msg.is_read ? 0.6 : 1,
      }}
    >
      <Avatar name={msg.sender_name} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.88rem',
              color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {msg.sender_name || 'Unknown'}
            </span>
            {msg.is_seed && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!msg.is_read && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            )}
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
              {timeAgo(msg.created_at)}
            </span>
          </div>
        </div>
        <div style={{
          color: 'var(--muted)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif",
          marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {msg.subject || '(no subject)'}
        </div>
        <p style={{
          margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.45,
          fontFamily: "'DM Sans', sans-serif", opacity: 0.75,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {msg.preview || '(no preview)'}
        </p>
      </div>
      {!msg.archived && (
        <button
          className="msg-archive-btn"
          onClick={(e) => { e.stopPropagation(); onArchive() }}
          title="Archive message"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', padding: 4, flexShrink: 0,
            display: hover ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4, transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
        </button>
      )}
    </div>
  )
}
