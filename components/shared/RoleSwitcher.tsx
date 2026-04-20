'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface RoleInfo {
  key: string
  label: string
  href: string
}

const ROLES: RoleInfo[] = [
  { key: 'interpreter', label: 'Interpreter', href: '/interpreter/dashboard' },
  { key: 'deaf', label: 'Deaf/DB/HH', href: '/dhh/dashboard' },
  { key: 'requester', label: 'Requester', href: '/request/dashboard' },
  { key: 'admin', label: 'Admin', href: '/admin/dashboard' },
]

const PENDING_ROLE_LABELS: Record<string, { label: string; href: string }> = {
  interpreter: { label: 'Interpreter Profile', href: '/interpreter/signup?addRole=true' },
  deaf: { label: 'D/DB/HH Account', href: '/dhh/signup?addRole=true' },
  requester: { label: 'Requester Portal', href: '/request/signup?addRole=true' },
}

interface UserRoles {
  active: string[]
  pending: string[]
  isAdmin: boolean
  preferredRole: string | null
}

export function useUserRoles() {
  const [roles, setRoles] = useState<UserRoles>({ active: [], pending: [], isAdmin: false, preferredRole: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Fetch user_profiles for is_admin, pending_roles, and preferred_role
      const { data: up } = await supabase
        .from('user_profiles')
        .select('is_admin, pending_roles, preferred_role, role')
        .eq('id', user.id)
        .single()

      const active: string[] = []
      const isAdmin = up?.is_admin === true

      // Check interpreter_profiles
      const { count: interpCount, error: interpErr } = await supabase
        .from('interpreter_profiles')
        .select('id', { count: 'exact' }).limit(1)
        .eq('user_id', user.id)
      if (interpErr && interpErr.code !== 'PGRST116') {
        // Server error (503, 500, etc.) - don't assume profile doesn't exist
        active.push('interpreter')
      } else if ((interpCount ?? 0) > 0) {
        active.push('interpreter')
      }

      // Check deaf_profiles
      const { count: deafCount, error: deafErr } = await supabase
        .from('deaf_profiles')
        .select('id', { count: 'exact' }).limit(1)
        .eq('user_id', user.id)
      if (deafErr && deafErr.code !== 'PGRST116') {
        active.push('deaf')
      } else if ((deafCount ?? 0) > 0) {
        active.push('deaf')
      }

      // Check requester_profiles
      const { count: reqCount, error: reqErr } = await supabase
        .from('requester_profiles')
        .select('id', { count: 'exact' }).limit(1)
        .eq('user_id', user.id)
      if (reqErr && reqErr.code !== 'PGRST116') {
        // Server error - optimistic fallback: show role as active
        active.push('requester')
      } else if ((reqCount ?? 0) > 0) {
        active.push('requester')
      }

      if (isAdmin) active.push('admin')

      const pending = (up?.pending_roles || []) as string[]

      // preferred_role is stored as 'dhh' in DB but we use 'deaf' internally
      const rawPref = up?.preferred_role as string | null
      const preferredRole = rawPref === 'dhh' ? 'deaf' : rawPref

      setRoles({ active, pending, isAdmin, preferredRole })
      setLoading(false)
    }
    fetch()
  }, [])

  function setPreferredRole(role: string) {
    setRoles(prev => ({ ...prev, preferredRole: role }))
  }

  return { roles, loading, setPreferredRole }
}

function StarIcon({ filled, onClick, label }: { filled: boolean; onClick: (e: React.MouseEvent) => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#00e5ff' : 'none'} stroke={filled ? '#00e5ff' : '#96a0b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  )
}

export default function RoleSwitcher({ currentRole }: { currentRole: string }) {
  const { roles, loading, setPreferredRole } = useUserRoles()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Effective preferred role: explicit preference or fall back to primary role
  const effectivePreferred = roles.preferredRole || currentRole

  async function handleStarClick(roleKey: string) {
    if (roleKey === effectivePreferred) return
    setPreferredRole(roleKey)
    try {
      const res = await fetch('/api/user/preferred-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleKey }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('Failed to set preferred role:', data.error || res.statusText)
        // Revert on failure
        setPreferredRole(effectivePreferred)
      }
    } catch (err) {
      console.error('Failed to set preferred role:', err)
      setPreferredRole(effectivePreferred)
    }
  }

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const currentRoleInfo = ROLES.find(r => r.key === currentRole)

  if (loading) {
    // Show button shell immediately so it doesn't pop in late on mobile
    return (
      <div style={{ padding: '14px 16px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
          fontSize: '0.58rem', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--muted)',
          marginBottom: 6,
        }}>
          Change Hats
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '8px 12px',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 8, opacity: 0.5,
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
            {currentRoleInfo?.label || currentRole}
          </span>
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M2 5.5L5 3L8 5.5" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 8.5L5 11L8 8.5" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    )
  }

  const otherRoles = roles.active.filter(r => r !== currentRole)
  const pendingRoles = roles.pending.filter(r => !roles.active.includes(r))

  const addableRoles = ['interpreter', 'deaf', 'requester'].filter(
    r => !roles.active.includes(r) && !pendingRoles.includes(r)
  )
  if (otherRoles.length === 0 && pendingRoles.length === 0 && addableRoles.length === 0) return null

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} style={{ padding: '14px 16px 8px', borderBottom: '1px solid var(--border)' }}>
      {/* Label */}
      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
        fontSize: '0.58rem', letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--muted)',
        marginBottom: 6,
      }}>
        Change Hats
      </div>

      {/* Dropdown trigger */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '8px 12px',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
              {currentRoleInfo?.label || currentRole}
            </span>
            <StarIcon
              filled={effectivePreferred === currentRole}
              onClick={(e) => { e.stopPropagation(); handleStarClick(currentRole) }}
              label={effectivePreferred === currentRole ? 'Primary dashboard' : 'Make this my primary dashboard'}
            />
          </span>
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M2 5.5L5 3L8 5.5" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 8.5L5 11L8 8.5" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '6px 0',
          marginBottom: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {/* Active roles */}
          {otherRoles.map(roleKey => {
            const role = ROLES.find(r => r.key === roleKey)
            if (!role) return null
            const isPreferred = effectivePreferred === roleKey
            return (
              <div
                key={role.key}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 10px 0 0', transition: 'background 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <Link
                  href={role.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'block', padding: '8px 14px', flex: 1,
                    fontSize: '0.85rem', color: 'var(--text)',
                    textDecoration: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {role.label}
                </Link>
                <StarIcon
                  filled={isPreferred}
                  onClick={(e) => { e.stopPropagation(); handleStarClick(roleKey) }}
                  label={isPreferred ? 'Primary dashboard' : 'Make this my primary dashboard'}
                />
              </div>
            )
          })}

          {/* Pending roles */}
          {pendingRoles.length > 0 && otherRoles.length > 0 && (
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          )}
          {pendingRoles.map(roleKey => {
            const info = PENDING_ROLE_LABELS[roleKey]
            if (!info) return null
            return (
              <Link
                key={roleKey}
                href={info.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 14px', textDecoration: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--muted)' }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#df2f4a', flexShrink: 0,
                  }} />
                  {info.label}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>Set up &rarr;</span>
              </Link>
            )
          })}

          {/* Add a role */}
          {(() => {
            const dropdownAddableRoles = ['interpreter', 'deaf', 'requester'].filter(
              r => !roles.active.includes(r) && !pendingRoles.includes(r)
            )
            if (dropdownAddableRoles.length === 0) return null
            const ADD_ROLE_INFO: Record<string, { label: string; href: string }> = {
              interpreter: { label: 'Interpreter Profile', href: '/interpreter/signup?addRole=true' },
              deaf: { label: 'Deaf/DB/HH Profile', href: '/dhh/signup?addRole=true' },
              requester: { label: 'Requester Profile', href: '/request/signup?addRole=true' },
            }
            return (
              <>
                {(otherRoles.length > 0 || pendingRoles.length > 0) && (
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                )}
                <div style={{
                  padding: '6px 14px 2px',
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--muted)', opacity: 0.6,
                }}>
                  Add a role
                </div>
                {dropdownAddableRoles.map(roleKey => {
                  const info = ADD_ROLE_INFO[roleKey]
                  if (!info) return null
                  return (
                    <Link
                      key={`add-${roleKey}`}
                      href={info.href}
                      onClick={() => setOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 14px', textDecoration: 'none',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.78rem', color: 'var(--muted)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>+</span>
                      {info.label}
                    </Link>
                  )
                })}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
