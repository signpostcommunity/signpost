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
}

interface NavGroup {
  section: string
  items: NavItem[]
}

const ORANGE = '#ff7e45'

const NAV: NavGroup[] = [
  {
    section: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2L14 6.5V14H10V10H6V14H2V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
      },
      {
        label: 'Email Inbox',
        href: 'https://mail.google.com/mail/u/0/#inbox',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M1 5l7 4 7-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
    ],
  },
  {
    section: 'Management',
    items: [
      {
        label: 'Users',
        href: '/admin/dashboard/users',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      },
      {
        label: 'Interpreters',
        href: '/admin/dashboard/interpreters',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 13.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10.5 7.5h4M12.5 5.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      },
      {
        label: 'Profile Flags',
        href: '/admin/dashboard/flags',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2v12M3 2l8 3.5L3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
    ],
  },
  {
    section: 'Insights',
    items: [
      {
        label: 'Bookings',
        href: '/admin/dashboard/bookings',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 6h12" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      },
      {
        label: 'Beta Feedback',
        href: '/admin/dashboard/feedback',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
      },
      {
        label: 'Invite Rewards',
        href: '/admin/dashboard/invite-rewards',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v4M4.5 5h7a1 1 0 011 1v1H3.5V6a1 1 0 011-1zM3 7h10v6a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 13V7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 7v7.5M5.5 3.5L8 5l2.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      },
    ],
  },
  {
    section: 'North Star',
    items: [
      {
        label: 'Product Vision',
        href: '/admin/dashboard/vision',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L9.4 5.8H13.9L10.25 8.4L11.65 12.7L8 10.1L4.35 12.7L5.75 8.4L2.1 5.8H6.6L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
      },
    ],
  },
  {
    section: 'Account',
    items: [
      {
        label: 'Announcements',
        href: '/admin/dashboard/announcements',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5.5L8 2l6 3.5v5L8 14 2 10.5v-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 14V8M2 5.5L8 8l6-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
      },
      {
        label: 'Settings',
        href: '/admin/dashboard/settings',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M13.5 8a5.5 5.5 0 01-.3 1.8l1.3.8-.8 1.4-1.3-.8a5.5 5.5 0 01-1.5 1l.2 1.5h-1.6l.2-1.5a5.5 5.5 0 01-1.5-1l-1.3.8-.8-1.4 1.3-.8A5.5 5.5 0 012.5 8c0-.6.1-1.2.3-1.8l-1.3-.8.8-1.4 1.3.8a5.5 5.5 0 011.5-1L4.9 2.3h1.6l-.2 1.5a5.5 5.5 0 011.5 1l1.3-.8.8 1.4-1.3.8c.2.6.3 1.2.3 1.8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
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

function SidebarContent({ userName, userInitials }: { userName: string; userInitials: string }) {
  const pathname = usePathname()

  return (
    <>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${ORANGE}, #ff9a44)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#fff',
          }}>
            {userInitials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.92rem' }}>{userName}</div>
            <div style={{ color: ORANGE, fontSize: '0.75rem', marginTop: 2, fontWeight: 600 }}>Admin</div>
          </div>
        </div>
      </div>

      {/* Role switcher */}
      <RoleSwitcher currentRole="admin" />

      {/* Nav */}
      <nav aria-label="Admin navigation" style={{ flex: 1, padding: '12px 0' }}>
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
              const isExternal = item.href.startsWith('http')
              const active = !isExternal && (item.href === '/admin/dashboard'
                ? pathname === item.href
                : pathname.startsWith(item.href))
              const linkStyle: React.CSSProperties = {
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 20px', textDecoration: 'none',
                fontSize: '0.88rem', transition: 'all 0.15s',
                color: active ? ORANGE : 'var(--muted)',
                background: active ? 'rgba(255,107,43,0.06)' : 'transparent',
                borderLeft: active ? `2px solid ${ORANGE}` : '2px solid transparent',
              }
              const content = (
                <>
                  <span aria-hidden="true" style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                </>
              )
              if (isExternal) {
                return (
                  <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    {content}
                  </a>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'instant' })
                    document.querySelector('.dash-main')?.scrollTo({ top: 0, behavior: 'instant' })
                  }}
                  style={linkStyle}
                >
                  {content}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span>Back to signpost</span>
        </Link>
        <LogoutButton />
      </div>
    </>
  )
}

export default function AdminSidebar({ userName = 'Admin', userInitials = 'AD' }: { userName?: string; userInitials?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
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

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="admin-sidebar-desktop" aria-label="Admin navigation" style={{
        width: 240, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0, overflowY: 'auto',
      }}>
        <SidebarContent userName={userName} userInitials={userInitials} />
      </aside>

      {/* Mobile top bar */}
      <div className="admin-sidebar-mobile-bar" style={{
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
          <span aria-hidden="true" style={{ width: 22, height: 2, background: ORANGE, display: 'block', borderRadius: 1 }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: ORANGE, display: 'block', borderRadius: 1 }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: ORANGE, display: 'block', borderRadius: 1 }} />
        </button>
        {/* Center: name + role */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.88rem' }}>{userName}</span>
          <span style={{ fontSize: '0.72rem', color: ORANGE, fontWeight: 600 }}>Admin</span>
        </div>
        {/* Right: notification bell */}
        <div
          style={{
            color: 'var(--muted)', padding: 8, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 44, minHeight: 44,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M13.5 6.75a4.5 4.5 0 1 0-9 0c0 4.5-2.25 5.625-2.25 5.625h13.5s-2.25-1.125-2.25-5.625M10.3 14.625a1.5 1.5 0 0 1-2.6 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
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
            aria-label="Admin navigation"
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
              <SidebarContent userName={userName} userInitials={userInitials} />
            </div>
          </aside>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-sidebar-mobile-bar { display: flex !important; }
        }
      `}</style>
    </>
  )
}
