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
  interpreter: { label: 'Interpreter Profile', href: '/interpreter' },
  deaf: { label: 'D/DB/HH Account', href: '/dhh' },
  requester: { label: 'Requester Portal', href: '/request' },
}

interface UserRoles {
  active: string[]
  pending: string[]
  isAdmin: boolean
}

export function useUserRoles() {
  const [roles, setRoles] = useState<UserRoles>({ active: [], pending: [], isAdmin: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Fetch user_profiles for is_admin and pending_roles
      const { data: up } = await supabase
        .from('user_profiles')
        .select('is_admin, pending_roles')
        .eq('id', user.id)
        .single()

      const active: string[] = []
      const isAdmin = up?.is_admin === true

      // Check interpreter_profiles
      const { count: interpCount } = await supabase
        .from('interpreter_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if ((interpCount ?? 0) > 0) active.push('interpreter')

      // Check deaf_profiles
      const { count: deafCount } = await supabase
        .from('deaf_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if ((deafCount ?? 0) > 0) active.push('deaf')

      // Check requester_profiles
      const { count: reqCount } = await supabase
        .from('requester_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if ((reqCount ?? 0) > 0) active.push('requester')

      if (isAdmin) active.push('admin')

      const pending = (up?.pending_roles || []) as string[]

      setRoles({ active, pending, isAdmin })
      setLoading(false)
    }
    fetch()
  }, [])

  return { roles, loading }
}

export default function RoleSwitcher({ currentRole }: { currentRole: string }) {
  const { roles, loading } = useUserRoles()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (loading) return null

  const otherRoles = roles.active.filter(r => r !== currentRole)
  const pendingRoles = roles.pending.filter(r => !roles.active.includes(r))

  if (otherRoles.length === 0 && pendingRoles.length === 0) return null

  const currentRoleInfo = ROLES.find(r => r.key === currentRole)

  return (
    <div ref={ref} style={{ padding: '10px 16px 6px', borderBottom: '1px solid var(--border)' }}>
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
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '8px 12px',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
          {currentRoleInfo?.label || currentRole}
        </span>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ flexShrink: 0 }}>
          <path d="M2 5.5L5 3L8 5.5" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 8.5L5 11L8 8.5" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

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
            return (
              <Link
                key={role.key}
                href={role.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'block', padding: '8px 14px',
                  fontSize: '0.85rem', color: 'var(--text)',
                  textDecoration: 'none', transition: 'background 0.1s',
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {role.label}
              </Link>
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
        </div>
      )}
    </div>
  )
}
