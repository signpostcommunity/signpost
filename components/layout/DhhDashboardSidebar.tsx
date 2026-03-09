'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
  badgePurple?: boolean
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
        label: 'My Roster',
        href: '/dhh/dashboard',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2L14 6.5V14H10V10H6V14H2V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
      },
    ],
  },
  {
    section: 'Bookings',
    items: [
      {
        label: 'My Bookings',
        href: '/dhh/dashboard/bookings',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        badge: 3,
        badgePurple: true,
      },
    ],
  },
  {
    section: 'Account',
    items: [
      {
        label: 'Back to front page',
        href: '/',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
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

function SidebarContent({ userName, userInitials, photoUrl }: {
  userName: string; userInitials: string; photoUrl?: string
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
              objectFit: 'cover', border: '2px solid var(--accent2)',
            }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#9d87ff,#7b61ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#fff',
            }}>
              {userInitials}
            </div>
          )}
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.92rem' }}>{userName}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>D/HH Consumer</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 20px', textDecoration: 'none',
                    fontSize: '0.88rem', transition: 'all 0.15s',
                    color: active ? 'var(--accent2)' : 'var(--muted)',
                    background: active ? 'rgba(123,97,255,0.06)' : 'transparent',
                    borderLeft: active ? '2px solid var(--accent2)' : '2px solid transparent',
                  }}
                >
                  <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, minWidth: 18, height: 18,
                      borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 5px',
                      background: item.badgePurple ? 'rgba(123,97,255,0.15)' : 'rgba(255,107,133,0.2)',
                      color: item.badgePurple ? 'var(--accent2)' : 'var(--accent3)',
                    }}>
                      {item.badge}
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

export default function DhhDashboardSidebar({ userName = 'User', userInitials = 'U', photoUrl }: {
  userName?: string; userInitials?: string; photoUrl?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <div className="dash-sidebar-desktop" style={{
        width: 240, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0, overflowY: 'auto',
      }}>
        <SidebarContent userName={userName} userInitials={userInitials} photoUrl={photoUrl} />
      </div>

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
              border: '2px solid var(--accent2)',
            }} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#9d87ff,#7b61ff)',
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
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            display: 'flex', flexDirection: 'column', gap: 5,
          }}
        >
          <span style={{ width: 22, height: 2, background: 'var(--text)', display: 'block' }} />
          <span style={{ width: 22, height: 2, background: 'var(--text)', display: 'block' }} />
          <span style={{ width: 22, height: 2, background: 'var(--text)', display: 'block' }} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
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
            <div onClick={() => setMobileOpen(false)}>
              <SidebarContent userName={userName} userInitials={userInitials} photoUrl={photoUrl} />
            </div>
          </div>
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
