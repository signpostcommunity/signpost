'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserRoles } from '@/components/shared/RoleSwitcher'

interface Props {
  userName: string
  userInitials: string
  photoUrl?: string | null
  activeRole: string
  onRoleChange: (role: string) => void
}

const ROLE_LABELS: Record<string, string> = {
  interpreter: 'Interpreter',
  deaf: 'Deaf/DB/HH',
  requester: 'Requester',
}

const ROLE_ACCENT: Record<string, string> = {
  interpreter: '#00e5ff',
  deaf: '#a78bfa',
  requester: '#00e5ff',
}

const ICONS = {
  dashboard: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2L14 6.5V14H10V10H6V14H2V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  team: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 0 1 8 4.5 3.5 3.5 0 0 1 13.5 7C13.5 10.5 8 14 8 14z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  directory: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  back: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6M10.5 11.5L14 8l-3.5-3.5M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
}

const ROLE_NAV: Record<string, Array<{ label: string; href: string; icon: React.ReactNode }>> = {
  interpreter: [
    { label: 'Dashboard', href: '/interpreter/dashboard', icon: ICONS.dashboard },
    { label: 'Preferred Team', href: '/interpreter/dashboard/team', icon: ICONS.team },
  ],
  deaf: [
    { label: 'Dashboard', href: '/dhh/dashboard', icon: ICONS.dashboard },
    { label: 'My Interpreters', href: '/dhh/dashboard/interpreters', icon: ICONS.team },
  ],
  requester: [
    { label: 'Dashboard', href: '/request/dashboard', icon: ICONS.dashboard },
    { label: 'Preferred Interpreters', href: '/request/dashboard/interpreters', icon: ICONS.team },
  ],
}

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
        {ICONS.logout}
      </span>
      <span>{loading ? 'Logging out...' : 'Log out'}</span>
    </button>
  )
}

function SidebarContent({ userName, userInitials, photoUrl, activeRole, onRoleChange }: Props) {
  const { roles, loading: rolesLoading } = useUserRoles()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const accent = ROLE_ACCENT[activeRole] || '#00e5ff'
  const accentBg = activeRole === 'deaf' ? 'rgba(167,139,250,0.06)' : 'rgba(0,229,255,0.06)'

  const otherRoles = rolesLoading ? [] : roles.active.filter(r => r !== activeRole && r !== 'admin')
  const navItems = ROLE_NAV[activeRole] || ROLE_NAV.interpreter

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  return (
    <>
      {/* User identity */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {photoUrl ? (
            <img src={photoUrl} alt={userName} style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              objectFit: 'cover', border: `2px solid ${accent}`,
            }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#7b61ff,#00e5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#fff',
            }}>
              {userInitials}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.92rem' }}>{userName}</div>
            <div style={{ color: accent, fontSize: '0.75rem', marginTop: 2, fontWeight: 600 }}>
              {ROLE_LABELS[activeRole] || activeRole}
            </div>
          </div>
        </div>
      </div>

      {/* Role switcher */}
      {(otherRoles.length > 0 || rolesLoading) && (
        <div ref={dropdownRef} onClick={e => e.stopPropagation()} style={{ padding: '14px 16px 8px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
            fontSize: '0.58rem', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--muted)',
            marginBottom: 6,
          }}>
            Change Hats
          </div>
          <div style={{ marginBottom: 8 }}>
            <button
              onClick={() => !rolesLoading && setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 12px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: rolesLoading ? 'default' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: rolesLoading ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                {ROLE_LABELS[activeRole] || activeRole}
              </span>
              <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 5.5L5 3L8 5.5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 8.5L5 11L8 8.5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {dropdownOpen && otherRoles.length > 0 && (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '6px 0',
              marginBottom: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {otherRoles.map(roleKey => (
                <button
                  key={roleKey}
                  onClick={() => {
                    onRoleChange(roleKey)
                    setDropdownOpen(false)
                  }}
                  style={{
                    display: 'block', width: '100%', padding: '8px 14px',
                    background: 'none', border: 'none',
                    fontSize: '0.85rem', color: 'var(--text)',
                    textAlign: 'left', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  {ROLE_LABELS[roleKey] || roleKey}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav links */}
      <nav aria-label="Directory navigation" style={{ flex: 1, padding: '12px 0' }}>
        <div style={{
          padding: '14px 20px 6px',
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
          fontSize: '0.7rem', letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--muted)',
        }}>
          Navigation
        </div>
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 20px', textDecoration: 'none',
              fontSize: '0.88rem', color: 'var(--muted)',
              borderLeft: '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 20px',
          fontSize: '0.88rem', color: accent,
          background: accentBg,
          borderLeft: `2px solid ${accent}`,
        }}>
          <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {ICONS.directory}
          </span>
          <span>Browse Interpreter Directory</span>
        </div>
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
            {ICONS.back}
          </span>
          <span>Back to signpost</span>
        </Link>
      </nav>

      {/* Logout */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
        <LogoutButton />
      </div>
    </>
  )
}

export default function DirectoryPortalSidebar(props: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const accent = ROLE_ACCENT[props.activeRole] || '#00e5ff'

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="dir-sidebar-desktop" aria-label="Portal navigation" style={{
        width: 240, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: 'calc(100vh - 73px)', position: 'sticky', top: 73, overflowY: 'auto',
      }}>
        <SidebarContent {...props} />
      </aside>

      {/* Mobile top bar */}
      <div className="dir-sidebar-mobile-bar" style={{
        display: 'none', position: 'sticky', top: 73, zIndex: 50,
        height: 56, alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 8,
            display: 'flex', flexDirection: 'column', gap: 5,
            minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span aria-hidden="true" style={{ width: 22, height: 2, background: accent, display: 'block', borderRadius: 1 }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: accent, display: 'block', borderRadius: 1 }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: accent, display: 'block', borderRadius: 1 }} />
        </button>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="wordmark" style={{ fontSize: '1.1rem' }}>
            sign<span>post</span>
          </div>
        </Link>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, color: accent,
          border: `1px solid ${accent}40`,
          borderRadius: 6, padding: '3px 8px',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {(ROLE_LABELS[props.activeRole] || props.activeRole).split('/')[0]}
        </span>
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
            aria-label="Portal navigation"
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
                aria-label="Close menu"
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                {'\u2715'}
              </button>
            </div>
            <div role="presentation" onClick={() => setMobileOpen(false)}>
              <SidebarContent {...props} />
            </div>
          </aside>
        </div>
      )}

      <style>{`
        .dir-sidebar-desktop { display: flex !important; }
        .dir-sidebar-mobile-bar { display: none !important; }
        @media (max-width: 768px) {
          .dir-sidebar-desktop { display: none !important; }
          .dir-sidebar-mobile-bar { display: flex !important; }
        }
      `}</style>
    </>
  )
}
