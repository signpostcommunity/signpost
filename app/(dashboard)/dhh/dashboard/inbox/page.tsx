'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import ConversationList from '@/components/messaging/ConversationList'

/* ── Types ── */

interface Notification {
  id: string
  type: string
  subject: string | null
  body: string | null
  status: string
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
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Only show notifications relevant to the Deaf portal — exclude interpreter-specific types
    const INTERPRETER_ONLY_TYPES = [
      'profile_approved', 'profile_denied', 'new_request', 'rate_response',
      'invoice_paid', 'team_invite', 'sub_search_update',
      'added_to_preferred_list', 'added_to_preferred_list_by_interpreter',
      'added_to_preferred_list_by_org', 'added_to_preferred_list_by_dhh',
    ]

    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, subject, body, status, created_at')
      .eq('recipient_user_id', user.id)
      .eq('channel', 'in_app')
      .not('type', 'in', `(${INTERPRETER_ONLY_TYPES.join(',')})`)
      .order('created_at', { ascending: false })

    if (!error) setNotifications(data || [])
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

  const unreadNotifCount = notifications.filter(n => n.status !== 'read').length

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
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
            padding: '10px 20px', fontFamily: "'Inter', sans-serif", fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'messages' ? '#9d87ff' : 'var(--muted)',
            borderBottom: activeTab === 'messages' ? '2px solid #9d87ff' : '2px solid transparent',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 20px', fontFamily: "'Inter', sans-serif", fontWeight: 700,
            fontSize: '0.88rem',
            color: activeTab === 'notifications' ? '#9d87ff' : 'var(--muted)',
            borderBottom: activeTab === 'notifications' ? '2px solid #9d87ff' : '2px solid transparent',
            transition: 'color 0.15s, border-color 0.15s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          Notifications
          {unreadNotifCount > 0 && (
            <span style={{
              background: '#9d87ff', color: '#000', fontFamily: "'Inter', sans-serif",
              fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              lineHeight: '1.4',
            }}>
              {unreadNotifCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', flex: 1 }}>Loading...</div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

          {/* ── Messages Tab ── */}
          {activeTab === 'messages' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{
                background: 'var(--surface)', borderRadius: 'var(--radius) var(--radius) 0 0',
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid var(--border)',
              }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', margin: 0, color: '#f0f2f8', flex: 1 }}>
                  Conversations
                </h2>
              </div>
              <div style={{
                flex: 1, overflowY: 'auto', background: 'var(--card-bg)',
                border: '1px solid var(--border)', borderTop: 'none',
                borderRadius: '0 0 var(--radius) var(--radius)',
              }}>
                <ConversationList
                  threadBaseUrl="/dhh/dashboard/inbox/conversation"
                  accent="#9d87ff"
                />
              </div>
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
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', margin: 0, color: '#f0f2f8', flex: 1 }}>
                  Notifications
                </h2>
                {unreadNotifCount > 0 && (
                  <button onClick={markAllNotificationsAsRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9d87ff', fontSize: '0.76rem', fontFamily: "'Inter', sans-serif", fontWeight: 600, whiteSpace: 'nowrap', padding: '2px 4px' }}>Mark all read</button>
                )}
              </div>
              <div style={{
                flex: 1, overflowY: 'auto', background: 'var(--card-bg)',
                border: '1px solid var(--border)', borderTop: 'none',
                borderRadius: '0 0 var(--radius) var(--radius)',
              }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>No notifications yet.</div>
                ) : notifications.map(notif => {
                  const isUnread = notif.status !== 'read'
                  const isExpanded = expandedNotifId === notif.id
                  return (
                    <div key={notif.id} style={{
                      borderBottom: '1px solid var(--border)',
                      borderLeft: isUnread ? '3px solid #9d87ff' : '3px solid transparent',
                      transition: 'background 0.15s, border-color 0.2s',
                    }}>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() => {
                          const willExpand = !isExpanded
                          setExpandedNotifId(willExpand ? notif.id : null)
                          if (willExpand && isUnread) markNotificationAsRead(notif.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            const willExpand = !isExpanded
                            setExpandedNotifId(willExpand ? notif.id : null)
                            if (willExpand && isUnread) markNotificationAsRead(notif.id)
                          }
                        }}
                        style={{
                          padding: '14px 20px', cursor: 'pointer',
                          display: 'flex', alignItems: 'flex-start', gap: 12, outline: 'none',
                          background: isUnread ? 'rgba(157,135,255,0.04)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <NotificationIcon />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: isExpanded ? 0 : 3 }}>
                            <span style={{
                              fontFamily: "'Inter', sans-serif", fontSize: '0.86rem',
                              fontWeight: isUnread ? 600 : 400, color: 'var(--text)',
                              ...(isExpanded ? {} : { whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }),
                            }}>{notif.subject || '(no subject)'}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(notif.created_at)}</span>
                          </div>
                          {!isExpanded && notif.body && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.45, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{notif.body}</p>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, flexShrink: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '0 20px 16px 50px', background: 'rgba(157,135,255,0.02)' }}>
                          {notif.body && <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#b0b0b0', lineHeight: 1.65, fontFamily: "'Inter', sans-serif" }}>{notif.body}</p>}
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>
                            {new Date(notif.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                          <Link href="/dhh/dashboard/profile?tab=account-settings" style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'Inter', sans-serif", textDecoration: 'none', opacity: 0.7 }}>
                            Manage notification preferences
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <DashMobileStyles />

      <style>{`
        @media (max-width: 640px) {
          .dash-page-content { height: auto !important; min-height: calc(100vh - 80px); }
        }
      `}</style>
    </div>
  )
}
