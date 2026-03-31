'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import ConversationList from '@/components/messaging/ConversationList'
import Toast from '@/components/ui/Toast'

/* ── Types ── */

interface RateResponse {
  recipientId: string
  bookingId: string
  bookingTitle: string | null
  bookingDate: string
  interpreterName: string
  responseRate: number
  responseNotes: string | null
  minBooking: number | null
  cancellationPolicy: string | null
}

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ── Notification icon ── */

function NotificationIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

/* ── Main Page ── */

export default function RequesterInboxPage() {
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages')
  const [rateResponses, setRateResponses] = useState<RateResponse[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null)
  const [decliningId, setDecliningId] = useState<string | null>(null)
  const [declining, setDeclining] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Fetch notifications
    const REQUESTER_EXCLUDE_TYPES = [
      'profile_approved', 'profile_denied', 'team_invite', 'sub_search_update',
      'added_to_preferred_list', 'added_to_preferred_list_by_interpreter',
      'added_to_preferred_list_by_org', 'added_to_preferred_list_by_dhh',
    ]

    const { data: notifs } = await supabase
      .from('notifications')
      .select('id, type, subject, body, status, created_at')
      .eq('recipient_user_id', user.id)
      .eq('channel', 'in_app')
      .not('type', 'in', `(${REQUESTER_EXCLUDE_TYPES.join(',')})`)
      .order('created_at', { ascending: false })

    if (notifs) setNotifications(notifs)

    // Fetch unreviewed rate responses
    // Step 1: Get user's bookings
    const { data: userBookings } = await supabase
      .from('bookings')
      .select('id, title, date')
      .eq('requester_id', user.id)
      .in('status', ['open', 'filled'])

    if (userBookings && userBookings.length > 0) {
      const bookingIds = userBookings.map(b => b.id)
      const bookingMap = new Map(userBookings.map(b => [b.id, b]))

      // Step 2: Get responded (not confirmed/declined) recipients
      const { data: respondedRecs } = await supabase
        .from('booking_recipients')
        .select('id, booking_id, interpreter_id, response_rate, response_notes, rate_profile_id')
        .in('booking_id', bookingIds)
        .eq('status', 'responded')

      if (respondedRecs && respondedRecs.length > 0) {
        // Step 3: Get interpreter names
        const interpIds = [...new Set(respondedRecs.map(r => r.interpreter_id))]
        const { data: interps } = await supabase
          .from('interpreter_profiles')
          .select('id, name, first_name, last_name')
          .in('id', interpIds)

        const interpMap = new Map<string, string>()
        if (interps) {
          for (const ip of interps) {
            interpMap.set(ip.id, ip.first_name && ip.last_name ? `${ip.first_name} ${ip.last_name}` : ip.name || 'Unknown')
          }
        }

        // Step 4: Get rate profile details if available
        const rateProfileIds = respondedRecs.filter(r => r.rate_profile_id).map(r => r.rate_profile_id!)
        const rateProfileMap = new Map<string, { min_booking: number | null; cancellation_policy: string | null }>()
        if (rateProfileIds.length > 0) {
          const { data: profiles } = await supabase
            .from('interpreter_rate_profiles')
            .select('id, min_booking, cancellation_policy')
            .in('id', rateProfileIds)

          if (profiles) {
            for (const p of profiles) {
              rateProfileMap.set(p.id, { min_booking: p.min_booking, cancellation_policy: p.cancellation_policy })
            }
          }
        }

        const responses: RateResponse[] = respondedRecs.map(r => {
          const booking = bookingMap.get(r.booking_id)
          const rateProfile = r.rate_profile_id ? rateProfileMap.get(r.rate_profile_id) : null
          return {
            recipientId: r.id,
            bookingId: r.booking_id,
            bookingTitle: booking?.title || null,
            bookingDate: booking?.date || '',
            interpreterName: interpMap.get(r.interpreter_id) || 'Unknown',
            responseRate: r.response_rate ?? 0,
            responseNotes: r.response_notes,
            minBooking: rateProfile?.min_booking ?? null,
            cancellationPolicy: rateProfile?.cancellation_policy ?? null,
          }
        })

        setRateResponses(responses)
      }
    }

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

  async function handleDecline(recipientId: string) {
    setDeclining(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('booking_recipients')
        .update({ status: 'declined', declined_at: new Date().toISOString() })
        .eq('id', recipientId)

      if (error) {
        setToast({ message: 'Failed to decline. Please try again.', type: 'error' })
      } else {
        setRateResponses(prev => prev.filter(r => r.recipientId !== recipientId))
        setToast({ message: 'Response declined.', type: 'success' })
        notifyUnreadChanged()
      }
    } catch {
      setToast({ message: 'An error occurred.', type: 'error' })
    }
    setDeclining(false)
    setDecliningId(null)
  }

  const unreadNotifCount = notifications.filter(n => n.status !== 'read').length

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <PageHeader title="Inbox" subtitle="Messages, notifications, and interpreter responses." />

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
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          Messages
          {rateResponses.length > 0 && (
            <span style={{
              background: 'var(--accent)', color: '#000', fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              lineHeight: '1.4',
            }}>
              {rateResponses.length}
            </span>
          )}
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
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', flex: 1 }}>Loading...</div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

          {/* ── Messages Tab ── */}
          {activeTab === 'messages' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

              {/* Rate Response Cards */}
              {rateResponses.length > 0 && (
                <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rateResponses.map(resp => (
                    <div key={resp.recipientId} className="req-rate-card" style={{
                      background: 'rgba(0,229,255,0.04)',
                      border: '1px solid rgba(0,229,255,0.2)',
                      borderRadius: 'var(--radius)', padding: '18px 22px',
                    }}>
                      <div className="req-rate-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 4 }}>
                            {resp.interpreterName} responded to your request
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            &ldquo;{resp.bookingTitle || 'Untitled'}&rdquo; &middot; {resp.bookingDate ? formatDate(resp.bookingDate) : ''}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
                          borderRadius: 100, border: '1px solid rgba(0,229,255,0.3)',
                          color: 'var(--accent)', fontFamily: "'DM Sans', sans-serif",
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          Action Required
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10, fontSize: '0.82rem', color: 'var(--text)' }}>
                        <span>Rate: <strong style={{ color: 'var(--accent)' }}>${resp.responseRate}/hr</strong></span>
                        {resp.minBooking && <span>Min {resp.minBooking} hours</span>}
                        {resp.cancellationPolicy && <span>Cancellation: {resp.cancellationPolicy}</span>}
                      </div>
                      {resp.responseNotes && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 12px', fontStyle: 'italic', lineHeight: 1.5 }}>
                          &ldquo;{resp.responseNotes}&rdquo;
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link
                          href={`/request/dashboard/accept/${resp.bookingId}/${resp.recipientId}`}
                          style={{
                            background: 'var(--accent)', color: '#000',
                            padding: '8px 18px', borderRadius: 'var(--radius-sm)',
                            fontSize: '0.82rem', fontWeight: 700,
                            fontFamily: "'DM Sans', sans-serif",
                            textDecoration: 'none', whiteSpace: 'nowrap',
                          }}
                        >
                          Review & Accept &rarr;
                        </Link>
                        <button
                          onClick={() => {
                            if (decliningId === resp.recipientId) {
                              handleDecline(resp.recipientId)
                            } else {
                              setDecliningId(resp.recipientId)
                            }
                          }}
                          disabled={declining}
                          style={{
                            background: 'none', border: '1px solid var(--border)',
                            color: 'var(--muted)', padding: '8px 18px',
                            borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
                            fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                          }}
                        >
                          {decliningId === resp.recipientId ? (declining ? 'Declining...' : 'Confirm Decline') : 'Decline'}
                        </button>
                        <Link
                          href="/request/dashboard/inbox"
                          style={{
                            background: 'none', border: 'none',
                            color: 'var(--accent)', padding: '8px 0',
                            fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif",
                            textDecoration: 'underline', textUnderlineOffset: '3px',
                          }}
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Conversation list */}
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
                  threadBaseUrl="/request/dashboard/inbox/conversation"
                  accent="#00e5ff"
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
                <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--text)', flex: 1 }}>
                  Notifications
                </h2>
                {unreadNotifCount > 0 && (
                  <button onClick={markAllNotificationsAsRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.76rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: 'nowrap', padding: '2px 4px' }}>Mark all read</button>
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
                      borderLeft: isUnread ? '3px solid var(--accent)' : '3px solid transparent',
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
                          background: isUnread ? 'rgba(0,229,255,0.04)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <NotificationIcon />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: isExpanded ? 0 : 3 }}>
                            <span style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem',
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
                        <div style={{ padding: '0 20px 16px 50px', background: 'rgba(0,229,255,0.02)' }}>
                          {notif.body && <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#b0b0b0', lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif" }}>{notif.body}</p>}
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                            {new Date(notif.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <DashMobileStyles />

      <style>{`
        @media (max-width: 640px) {
          .dash-page-content { height: auto !important; min-height: calc(100vh - 80px); }
          .req-rate-card { padding: 14px 16px !important; }
          .req-rate-card-header { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .dash-page-content { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}
