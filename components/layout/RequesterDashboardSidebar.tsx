'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RoleSwitcher from '@/components/shared/RoleSwitcher'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badgeKey?: string
  badgeColor?: string
  redDot?: boolean
}

interface NavGroup {
  section: string
  items: NavItem[]
}

const INVITE_ICON = <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M12.5 5v4M10.5 7h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>

const NAV: NavGroup[] = [
  {
    section: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/request/dashboard',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8.5l6-5.5 6 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.5 7.5V13a1 1 0 001 1h7a1 1 0 001-1V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
      {
        label: 'Invite interpreters',
        href: '/invite',
        icon: INVITE_ICON,
      },
    ],
  },
  {
    section: 'Requests',
    items: [
      {
        label: 'All Requests',
        href: '/request/dashboard/requests',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 6h6M5 8.5h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
        badgeKey: 'requests',
      },
      {
        label: 'New Request',
        href: '/request/dashboard/new-request',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      },
{
        label: 'Messages & Notifications',
        href: '/request/dashboard/inbox',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 5l6 4.5L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        badgeKey: 'inbox',
        redDot: true,
      },
      {
        label: 'Invoices',
        href: '/request/dashboard/invoices',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M5 8h6M5 10.5h6M5 6h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
        badgeKey: 'invoices',
        badgeColor: 'var(--accent)',
      },
    ],
  },
  {
    section: 'Favorites',
    items: [
      {
        label: 'Preferred Interpreters',
        href: '/request/dashboard/interpreters',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.85 3.75L14 5.85l-3 2.93.7 4.12L8 10.95 4.3 12.9l.7-4.12-3-2.93 4.15-.6L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        badgeKey: 'preferred',
        badgeColor: '#f5a623',
      },
      {
        label: 'Client Interpreter Lists',
        href: '/request/dashboard/client-lists',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.1"/><circle cx="10.5" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M4 11c0-1 .7-1.8 1.5-1.8S7 10 7 11M9 11c0-1 .7-1.8 1.5-1.8S12 10 12 11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/></svg>,
        badgeKey: 'clientLists',
        badgeColor: 'var(--accent)',
      },
    ],
  },
  {
    section: 'Account',
    items: [
      {
        label: 'My Profile',
        href: '/request/dashboard/profile',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      },
      {
        label: 'Notification Settings',
        href: '/request/dashboard/notifications',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4 4 0 00-4 4v2.7L2.7 10.3a.5.5 0 00.1.7h10.4a.5.5 0 00.1-.7L12 8.2V5.5a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6.5 12a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      },
      {
        label: 'Browse Interpreter Directory',
        href: '/directory?context=requester',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      },
    ],
  },
]

function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 20px', width: '100%',
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '0.88rem', color: 'var(--accent3)',
        fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
        borderLeft: '2px solid transparent',
        transition: 'all 0.15s',
        opacity: loading ? 0.5 : 1,
      }}
    >
      <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6M10.5 11.5L14 8l-3.5-3.5M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span>{loading ? 'Logging out...' : 'Log out'}</span>
    </button>
  )
}

function SidebarContent({ userName, userInitials, userSubtitle, badges }: {
  userName: string; userInitials: string; userSubtitle: string
  badges: Record<string, number>
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <Link
          href="/request/dashboard/profile"
          prefetch={false}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            textDecoration: 'none', color: 'inherit', cursor: 'pointer',
            borderRadius: 8, padding: 4, margin: -4,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #00e5ff, #9d87ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#fff',
          }}>
            {userInitials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.92rem' }}>{userName}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>{userSubtitle}</div>
          </div>
        </Link>
      </div>

      {/* Role switcher */}
      <RoleSwitcher currentRole="requester" />

      {/* Nav */}
      <nav aria-label="Dashboard navigation" style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map(group => (
          <div key={group.section}>
            <div style={{
              padding: '14px 20px 6px',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
              fontSize: '0.7rem', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--muted)',
            }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = item.href === '/request/dashboard'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/')
              const badgeCount = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0
              const showRedDot = item.redDot && ((badges.notifications ?? 0) + (badges.inbox ?? 0)) > 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'instant' })
                    document.querySelector('.dash-main')?.scrollTo({ top: 0, behavior: 'instant' })
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 20px', textDecoration: 'none',
                    fontSize: '0.88rem', transition: 'all 0.15s',
                    color: active ? 'var(--accent)' : 'var(--muted)',
                    background: active ? 'rgba(0,229,255,0.06)' : 'transparent',
                    borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >
                  <span aria-hidden="true" style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.redDot ? (
                    showRedDot && (
                      <span aria-label="Unread items" style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#ef4444', flexShrink: 0,
                      }} />
                    )
                  ) : badgeCount > 0 && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, minWidth: 18, height: 18,
                      borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 5px',
                      background: item.badgeColor
                        ? `${item.badgeColor === '#f5a623' ? 'rgba(245,166,35,0.15)' : item.badgeColor === 'var(--accent2)' ? 'rgba(157,135,255,0.15)' : 'rgba(0,229,255,0.15)'}`
                        : 'rgba(0,229,255,0.15)',
                      color: item.badgeColor || 'var(--accent)',
                    }}>
                      {badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom nav */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
        <Link
          href="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 20px', textDecoration: 'none',
            fontSize: '0.88rem', color: 'var(--muted)',
            borderLeft: '2px solid transparent',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span>Back to signpost</span>
        </Link>
        <LogoutButton />
      </div>
    </>
  )
}

export default function RequesterDashboardSidebar({ userName = 'User', userInitials = 'U', userSubtitle = 'Requester' }: {
  userName?: string; userInitials?: string; userSubtitle?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badges, setBadges] = useState<Record<string, number>>({})
  const pathname = usePathname()

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    async function fetchBadges() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Pending bookings count (All Requests badge)
      const { count: requestsCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' }).limit(1)
        .eq('requester_id', user.id)
        .eq('status', 'open')

      // Unread notifications count
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' }).limit(1)
        .eq('recipient_user_id', user.id)
        .eq('channel', 'in_app')
        .neq('status', 'read')

      // Unread conversations count (via conversation_participants)
      let inboxCount = 0
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)

      if (participations && participations.length > 0) {
        const convoIds = participations.map(p => p.conversation_id)
        const { data: convos } = await supabase
          .from('conversations')
          .select('id, last_message_at')
          .in('id', convoIds)

        if (convos) {
          const lastReadMap = new Map(participations.map(p => [p.conversation_id, p.last_read_at]))
          inboxCount = convos.filter(c => {
            const lastRead = lastReadMap.get(c.id)
            return c.last_message_at && (!lastRead || c.last_message_at > lastRead)
          }).length
        }
      }

      // Pending rate responses count (booking_recipients with response_rate and status = 'responded')
      let pendingRateResponses = 0
      const { data: userBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('requester_id', user.id)
        .in('status', ['open', 'filled'])

      if (userBookings && userBookings.length > 0) {
        const bookingIds = userBookings.map(b => b.id)
        const { count: rateCount } = await supabase
          .from('booking_recipients')
          .select('id', { count: 'exact' }).limit(1)
          .in('booking_id', bookingIds)
          .eq('status', 'responded')
        pendingRateResponses = rateCount ?? 0
      }

      // Preferred interpreters count
      const { count: prefCount } = await supabase
        .from('requester_roster')
        .select('id', { count: 'exact' }).limit(1)
        .eq('requester_user_id', user.id)
        .eq('tier', 'preferred')

      // Client interpreter lists count (active connections)
      const { count: clientListsCount } = await supabase
        .from('dhh_requester_connections')
        .select('id', { count: 'exact' }).limit(1)
        .eq('requester_id', user.id)
        .eq('status', 'active')

      setBadges({
        requests: (requestsCount ?? 0) + pendingRateResponses,
        notifications: notifCount ?? 0,
        inbox: inboxCount + pendingRateResponses,
        preferred: prefCount ?? 0,
        clientLists: clientListsCount ?? 0,
      })
    }
    fetchBadges()

    function handleUnreadChanged() { fetchBadges() }
    window.addEventListener('signpost:unread-changed', handleUnreadChanged)
    const interval = setInterval(fetchBadges, 30000)
    return () => {
      window.removeEventListener('signpost:unread-changed', handleUnreadChanged)
      clearInterval(interval)
    }
  }, [])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="dash-sidebar-desktop" aria-label="Dashboard navigation" style={{
        width: 240, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0, overflowY: 'auto',
      }}>
        <SidebarContent userName={userName} userInitials={userInitials} userSubtitle={userSubtitle} badges={badges} />
      </aside>

      {/* Mobile top bar */}
      <div className="dash-sidebar-mobile-bar" style={{
        display: 'none', position: 'sticky', top: 0, zIndex: 50,
        height: 56, alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 8,
            display: 'flex', flexDirection: 'column', gap: 5,
            minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span aria-hidden="true" style={{ width: 22, height: 2, background: 'var(--accent)', display: 'block', borderRadius: 1 }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: 'var(--accent)', display: 'block', borderRadius: 1 }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: 'var(--accent)', display: 'block', borderRadius: 1 }} />
        </button>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="wordmark" style={{ fontSize: '1.1rem' }}>
            sign<span>post</span>
          </div>
        </Link>
        <span style={{ width: 8, flexShrink: 0 }} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: 280, background: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 0' }}>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &#10005;
              </button>
            </div>
            <div role="presentation" onClick={() => setMobileOpen(false)}>
              <SidebarContent userName={userName} userInitials={userInitials} userSubtitle={userSubtitle} badges={badges} />
            </div>
          </aside>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .dash-sidebar-desktop { display: none !important; }
          .dash-sidebar-mobile-bar { display: flex !important; }
          .dash-page-content { padding: 24px 20px !important; }
        }
        @media (max-width: 640px) {
          .dash-card-actions { flex-direction: column !important; }
          .dash-card-actions > *, .dash-card-actions > a { width: 100% !important; }
          .dash-card-actions > a > button,
          .dash-card-actions button { width: 100% !important; text-align: center !important; }
        }
      `}</style>
    </>
  )
}
