'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badgeKey?: 'inquiries' | 'confirmed' | 'inbox' | 'clientLists' | 'invoiceDrafts' | 'notifications'
  badgeCyan?: boolean
}

interface NavGroup {
  section: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/interpreter/dashboard', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2L14 6.5V14H10V10H6V14H2V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
    ],
  },
  {
    section: 'Bookings',
    items: [
      { label: 'Inquiries', href: '/interpreter/dashboard/inquiries', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, badgeKey: 'inquiries' },
      { label: 'Confirmed', href: '/interpreter/dashboard/confirmed', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, badgeKey: 'confirmed', badgeCyan: true },
      { label: 'Invoices', href: '/interpreter/dashboard/invoices', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 5h4M6 7.5h4M6 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>, badgeKey: 'invoiceDrafts', badgeCyan: true },
      { label: 'Inbox', href: '/interpreter/dashboard/inbox', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 5l6 4.5L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, badgeKey: 'inbox' },
    ],
  },
  {
    section: 'My Profile',
    items: [
      { label: 'Edit Profile', href: '/interpreter/dashboard/profile', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
      { label: 'Rates & Terms', href: '/interpreter/dashboard/rates', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v1.5M8 9.5V11M6.5 7a1.5 1.5 0 1 1 3 0c0 1-1.5 1.5-1.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
      { label: 'Availability', href: '/interpreter/dashboard/availability', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
      { label: 'Preferred Team Interpreters', href: '/interpreter/dashboard/team', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="3" cy="11" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="13" cy="11" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 5.5L4 9M10 5.5L12 9M5.5 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
      { label: 'Client Lists', href: '/interpreter/dashboard/client-lists', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 13.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10.5 7.5h4M12.5 5.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, badgeKey: 'clientLists', badgeCyan: true },
    ],
  },
  {
    section: 'Account',
    items: [
      { label: 'Account Settings', href: '/interpreter/dashboard/profile?tab=account-settings', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.3"/><path d="M13.5 8a5.5 5.5 0 01-.28 1.74l1.18.68-.75 1.3-1.18-.68A5.5 5.5 0 018 13.5a5.5 5.5 0 01-4.47-2.46l-1.18.68-.75-1.3 1.18-.68A5.5 5.5 0 012.5 8c0-.6.1-1.18.28-1.74L1.6 5.58l.75-1.3 1.18.68A5.5 5.5 0 018 2.5a5.5 5.5 0 014.47 2.46l1.18-.68.75 1.3-1.18.68c.18.56.28 1.14.28 1.74z" stroke="currentColor" strokeWidth="1.3"/></svg> },
      { label: 'Back to front page', href: '/', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
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

function SidebarContent({ userName, userInitials, photoUrl, badges }: {
  userName: string; userInitials: string; photoUrl?: string
  badges: Record<string, number>
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Header */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {photoUrl ? (
            <img src={photoUrl} alt={userName} style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              objectFit: 'cover', border: '2px solid var(--accent)',
            }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#7b61ff,#00e5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#fff',
            }}>
              {userInitials}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.92rem' }}>{userName}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>Interpreter</div>
          </div>
          {/* Notification bell */}
          <Link href="/interpreter/dashboard/profile" style={{ position: 'relative', color: 'var(--muted)', textDecoration: 'none', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M13.5 6.75a4.5 4.5 0 1 0-9 0c0 4.5-2.25 5.625-2.25 5.625h13.5s-2.25-1.125-2.25-5.625M10.3 14.625a1.5 1.5 0 0 1-2.6 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {(badges.notifications ?? 0) > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent)',
                border: '2px solid var(--surface)',
              }} />
            )}
          </Link>
        </div>
      </div>

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
              const hrefPath = item.href.split('?')[0]
              const hasQuery = item.href.includes('?')
              const active = hrefPath === '/interpreter/dashboard'
                ? pathname === hrefPath
                : hasQuery ? false : pathname.startsWith(hrefPath)
              const badgeCount = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
                  {badgeCount > 0 && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, minWidth: 18, height: 18,
                      borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 5px',
                      background: item.badgeCyan ? 'rgba(0,229,255,0.15)' : 'rgba(255,107,133,0.2)',
                      color: item.badgeCyan ? 'var(--accent)' : 'var(--accent3)',
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

      {/* Log out */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
        <LogoutButton />
      </div>
    </>
  )
}

export default function DashboardSidebar({ userName = 'Interpreter', userInitials = 'IN', photoUrl }: { userName?: string; userInitials?: string; photoUrl?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badges, setBadges] = useState<Record<string, number>>({})

  useEffect(() => {
    async function fetchBadges() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('interpreter_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      // Pending inquiries count
      const { count: inquiriesCount, error: inqErr } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('interpreter_id', profile.id)
        .eq('status', 'pending')

      if (inqErr) console.error('[sidebar] inquiries count failed:', inqErr.message)

      // Confirmed bookings count
      const { count: confirmedCount, error: confErr } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('interpreter_id', profile.id)
        .eq('status', 'confirmed')

      if (confErr) console.error('[sidebar] confirmed count failed:', confErr.message)

      // Unread messages count
      const { count: inboxCount, error: inboxErr } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('interpreter_id', profile.id)
        .eq('is_read', false)

      if (inboxErr) console.error('[sidebar] inbox count failed:', inboxErr.message)

      // Draft invoices count
      const { count: invoiceDraftsCount, error: invErr } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('interpreter_id', profile.id)
        .eq('status', 'draft')

      if (invErr) console.error('[sidebar] invoice drafts count failed:', invErr.message)

      // Unread notifications count
      const { count: notifCount, error: notifErr } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_user_id', user.id)
        .neq('status', 'read')

      if (notifErr) console.error('[sidebar] notifications count failed:', notifErr.message)

      setBadges({
        inquiries: !inqErr ? (inquiriesCount ?? 0) : 0,
        confirmed: !confErr ? (confirmedCount ?? 0) : 0,
        inbox: !inboxErr ? (inboxCount ?? 0) : 0,
        invoiceDrafts: !invErr ? (invoiceDraftsCount ?? 0) : 0,
        notifications: !notifErr ? (notifCount ?? 0) : 0,
      })
    }
    fetchBadges()
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
        <SidebarContent userName={userName} userInitials={userInitials} photoUrl={photoUrl} badges={badges} />
      </aside>

      {/* Mobile top bar */}
      <div className="dash-sidebar-mobile-bar" style={{
        display: 'none', position: 'sticky', top: 0, zIndex: 50,
        height: 56, alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {photoUrl ? (
            <img src={photoUrl} alt={userName} style={{
              width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
              border: '2px solid var(--accent)',
            }} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#7b61ff,#00e5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.7rem', color: '#fff',
            }}>
              {userInitials}
            </div>
          )}
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.88rem' }}>
            Dashboard
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            display: 'flex', flexDirection: 'column', gap: 5,
          }}
        >
          <span aria-hidden="true" style={{ width: 22, height: 2, background: 'var(--text)', display: 'block' }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: 'var(--text)', display: 'block' }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: 'var(--text)', display: 'block' }} />
        </button>
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
                ✕
              </button>
            </div>
            <div role="presentation" onClick={() => setMobileOpen(false)}>
              <SidebarContent userName={userName} userInitials={userInitials} photoUrl={photoUrl} badges={badges} />
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
