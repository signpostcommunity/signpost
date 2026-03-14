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
  redDot?: boolean
}

interface NavGroup {
  section: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    section: 'Overview',
    items: [
      {
        label: 'My Preferred Interpreters',
        href: '/dhh/dashboard',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="2" rx="1" fill="currentColor" opacity=".7"/><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" opacity=".7"/><rect x="2" y="11" width="8" height="2" rx="1" fill="currentColor" opacity=".7"/></svg>,
        badgeKey: 'roster',
      },
      {
        label: 'New Request',
        href: '/dhh/dashboard/request',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
      },
      {
        label: 'My Requests',
        href: '/dhh/dashboard/requests',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 6h6M5 8.5h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
      },
      {
        label: 'Messages & Notifications',
        href: '/dhh/dashboard/inbox',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 5l6 4.5L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        badgeKey: 'inbox',
        redDot: true,
      },
    ],
  },
  {
    section: 'Account',
    items: [
      {
        label: 'Preferences & Profile',
        href: '/dhh/dashboard/preferences',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      },
      {
        label: 'My Requesters',
        href: '/dhh/dashboard/requesters',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="10.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-2.76 2.02-5 4.5-5M8.5 14c0-2.76 2.02-5 4.5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
        badgeKey: 'requesters',
      },
      {
        label: 'Trusted Deaf Circle',
        href: '/dhh/dashboard/circle',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="5.5" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.1"/><circle cx="10.5" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M4 11c0-1 .7-1.8 1.5-1.8S7 10 7 11M9 11c0-1 .7-1.8 1.5-1.8S12 10 12 11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
      },
      {
        label: 'Browse Interpreter Directory',
        href: '/directory',
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

function SidebarContent({ userName, userInitials, badges }: {
  userName: string; userInitials: string
  badges: Record<string, number>
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Header */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#fff',
          }}>
            {userInitials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.92rem' }}>{userName}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>Deaf Individual</div>
          </div>
        </div>
      </div>

      {/* Role switcher */}
      <RoleSwitcher currentRole="deaf" />

      {/* Nav */}
      <nav aria-label="Dashboard navigation" style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map(group => (
          <div key={group.section}>
            <div style={{
              padding: '14px 20px 6px',
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: '0.62rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--muted)',
            }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = item.href === '/dhh/dashboard'
                ? pathname === item.href
                : pathname.startsWith(item.href)
              const badgeCount = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0
              const showRedDot = item.redDot && ((badges.notifications ?? 0) + (badges.inbox ?? 0)) > 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'instant' })
                    document.querySelector('.dash-main')?.scrollTo({ top: 0, behavior: 'instant' })
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 20px', textDecoration: 'none',
                    fontSize: '0.88rem', transition: 'all 0.15s',
                    color: active ? '#9d87ff' : 'var(--muted)',
                    background: active ? 'rgba(157,135,255,0.06)' : 'transparent',
                    borderLeft: active ? '2px solid #9d87ff' : '2px solid transparent',
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
                      background: 'rgba(0,229,255,0.15)',
                      color: 'var(--accent)',
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

export default function DhhDashboardSidebar({ userName = 'User', userInitials = 'U' }: {
  userName?: string; userInitials?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badges, setBadges] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchBadges() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count: rosterCount } = await supabase
        .from('deaf_roster')
        .select('id', { count: 'exact', head: true })
        .eq('deaf_user_id', user.id)
        .in('tier', ['preferred', 'approved'])

      // Unread notifications count (in_app only)
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_user_id', user.id)
        .eq('channel', 'in_app')
        .neq('status', 'read')

      // Unread messages count
      const { count: inboxCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)

      setBadges({
        roster: rosterCount ?? 0,
        requesters: 0,
        notifications: notifCount ?? 0,
        inbox: inboxCount ?? 0,
      })
    }
    fetchBadges()

    // Re-fetch when inbox page marks items as read/deleted
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
        <SidebarContent userName={userName} userInitials={userInitials} badges={badges} />
      </aside>

      {/* Mobile top bar */}
      <div className="dash-sidebar-mobile-bar" style={{
        display: 'none', position: 'sticky', top: 0, zIndex: 50,
        height: 56, alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }}>
        {/* Left: hamburger */}
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
          <span aria-hidden="true" style={{ width: 22, height: 2, background: '#9d87ff', display: 'block', borderRadius: 1 }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: '#9d87ff', display: 'block', borderRadius: 1 }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: '#9d87ff', display: 'block', borderRadius: 1 }} />
        </button>
        {/* Center: name + role */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.88rem' }}>{userName}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Deaf Individual</span>
        </div>
        {/* Red dot indicator for unread items */}
        {((badges.notifications ?? 0) + (badges.inbox ?? 0)) > 0 && (
          <span aria-label="Unread items" style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#ef4444', flexShrink: 0,
          }} />
        )}
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
              <SidebarContent userName={userName} userInitials={userInitials} badges={badges} />
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
