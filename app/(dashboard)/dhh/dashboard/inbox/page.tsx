'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BetaBanner, PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'

/* ── Types ── */

interface Notification {
  id: string
  type: string
  subject: string | null
  body: string | null
  status: string
  created_at: string
}

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

/* ── Notification icon ── */

function NotificationIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

/* ── Main Page ── */

export default function DhhInboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [notifCollapsed, setNotifCollapsed] = useState(false)
  const [msgCollapsed, setMsgCollapsed] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [notifRes, msgRes] = await Promise.all([
      supabase
        .from('notifications')
        .select('id, type, subject, body, status, created_at')
        .eq('recipient_user_id', user.id)
        .eq('channel', 'in_app')
        .order('created_at', { ascending: false }),
      supabase
        .from('messages')
        .select('id, sender_name, subject, preview, body, is_read, is_seed, archived, created_at')
        .order('created_at', { ascending: false }),
    ])

    if (!notifRes.error) setNotifications(notifRes.data || [])
    if (!msgRes.error) setMessages(msgRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function notifyUnreadChanged() {
    window.dispatchEvent(new Event('signpost:unread-changed'))
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

  const unreadNotifCount = notifications.filter(n => n.status !== 'read').length
  const visibleMessages = showArchived ? messages.filter(m => m.archived) : messages.filter(m => !m.archived)
  const unreadMsgCount = messages.filter(m => !m.is_read && !m.archived).length

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <PageHeader title="Messages & Notifications" subtitle="Notifications and messages." />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', flex: 1 }}>Loading...</div>
      ) : (
        <div className="inbox-panes" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 16, minHeight: 0 }}>

          {/* Notifications pane */}
          <div className="inbox-pane-notif" style={{ flex: notifCollapsed ? 'none' : '0 0 33%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="inbox-pane-header" style={{
              background: 'var(--surface)', borderRadius: notifCollapsed ? 'var(--radius)' : 'var(--radius) var(--radius) 0 0',
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: notifCollapsed ? 'none' : '1px solid var(--border)',
            }}>
              <button onClick={() => setNotifCollapsed(!notifCollapsed)} aria-expanded={!notifCollapsed} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: 0, textAlign: 'left' }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text)', flex: 1 }}>Notifications</h2>
                {unreadNotifCount > 0 && (
                  <span style={{ background: '#9d87ff', color: '#000', fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, lineHeight: '1.4' }}>{unreadNotifCount}</span>
                )}
                <svg className="inbox-collapse-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: notifCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {unreadNotifCount > 0 && !notifCollapsed && (
                <button onClick={markAllNotificationsAsRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9d87ff', fontSize: '0.76rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: 'nowrap', padding: '2px 4px' }}>Mark all read</button>
              )}
            </div>
            {!notifCollapsed && (
              <div style={{ flex: 1, overflowY: 'auto', background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>No notifications yet.</div>
                ) : notifications.map(notif => {
                  const isUnread = notif.status !== 'read'
                  return (
                    <div key={notif.id} onClick={() => { if (isUnread) markNotificationAsRead(notif.id) }} style={{
                      padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'flex-start', gap: 12, opacity: isUnread ? 1 : 0.6,
                      background: isUnread ? 'rgba(157,135,255,0.04)' : 'transparent',
                    }}>
                      <NotificationIcon />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem', fontWeight: isUnread ? 600 : 400, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{notif.subject || '(no subject)'}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(notif.created_at)}</span>
                        </div>
                        {notif.body && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.45, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{notif.body}</p>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Messages pane */}
          <div style={{ flex: msgCollapsed ? 'none' : '1 1 67%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="inbox-pane-header" style={{
              background: 'var(--surface)', borderRadius: msgCollapsed ? 'var(--radius)' : 'var(--radius) var(--radius) 0 0',
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: msgCollapsed ? 'none' : '1px solid var(--border)',
            }}>
              <button onClick={() => setMsgCollapsed(!msgCollapsed)} aria-expanded={!msgCollapsed} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: 0, textAlign: 'left' }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text)', flex: 1 }}>Messages</h2>
                {unreadMsgCount > 0 && (
                  <span style={{ background: '#9d87ff', color: '#000', fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, lineHeight: '1.4' }}>{unreadMsgCount}</span>
                )}
                <svg className="inbox-collapse-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: msgCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {!msgCollapsed && (
                <button onClick={() => setShowArchived(!showArchived)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: showArchived ? '#9d87ff' : 'var(--muted)', fontSize: '0.76rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: 'nowrap', padding: '2px 4px' }}>
                  {showArchived ? 'Show active' : 'Archived'}
                </button>
              )}
            </div>
            {!msgCollapsed && (
              <div style={{ flex: 1, overflowY: 'auto', background: 'var(--card-bg)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)' }}>
                {visibleMessages.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>{showArchived ? 'No archived messages.' : 'No messages yet.'}</div>
                ) : visibleMessages.map(msg => (
                  <div key={msg.id} onClick={() => { if (!msg.is_read) markMessageAsRead(msg.id) }} style={{
                    padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'flex-start', gap: 12, opacity: msg.is_read ? 0.6 : 1,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{msg.sender_name || 'Unknown'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {!msg.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9d87ff', display: 'inline-block' }} />}
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{timeAgo(msg.created_at)}</span>
                        </div>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.subject || '(no subject)'}</div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.45, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.preview || '(no preview)'}</p>
                    </div>
                    {/* TODO: Reply UI needed when message creation flow is built */}
                    {!msg.archived && (
                      <button onClick={(e) => { e.stopPropagation(); archiveMessage(msg.id) }} title="Archive" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <DashMobileStyles />
      <style>{`
        .inbox-collapse-icon { display: none; }
        @media (max-width: 768px) {
          .inbox-panes { flex-direction: column !important; height: auto !important; }
          .inbox-pane-notif { flex: none !important; max-height: none !important; }
          .inbox-collapse-icon { display: block !important; }
        }
      `}</style>
    </div>
  )
}
