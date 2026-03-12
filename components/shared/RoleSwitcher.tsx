'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface RoleInfo {
  key: string
  label: string
  href: string
  icon: string
  color: string
  colorBg: string
  colorBorder: string
}

const ROLES: RoleInfo[] = [
  {
    key: 'interpreter',
    label: 'Interpreter',
    href: '/interpreter/dashboard',
    icon: '🎯',
    color: 'var(--accent)',
    colorBg: 'rgba(0,229,255,0.08)',
    colorBorder: 'rgba(0,229,255,0.35)',
  },
  {
    key: 'deaf',
    label: 'Deaf/DB/HH',
    href: '/dhh/dashboard',
    icon: '💜',
    color: '#9d87ff',
    colorBg: 'rgba(157,135,255,0.08)',
    colorBorder: 'rgba(157,135,255,0.35)',
  },
  {
    key: 'requester',
    label: 'Requester',
    href: '/request/dashboard',
    icon: '📋',
    color: 'var(--accent)',
    colorBg: 'rgba(0,229,255,0.08)',
    colorBorder: 'rgba(0,229,255,0.35)',
  },
  {
    key: 'admin',
    label: 'Admin',
    href: '/admin/dashboard',
    icon: '🔧',
    color: '#ff6b2b',
    colorBg: 'rgba(255,107,43,0.08)',
    colorBorder: 'rgba(255,107,43,0.35)',
  },
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

  if (loading) return null

  // Filter active roles to only those different from current
  const otherRoles = roles.active.filter(r => r !== currentRole)
  // Pending roles that aren't already active
  const pendingRoles = roles.pending.filter(r => !roles.active.includes(r))

  // Hide if user only has current role and no pending roles
  if (otherRoles.length === 0 && pendingRoles.length === 0) return null

  return (
    <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid var(--border)' }}>
      <div style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 700,
        fontSize: '0.58rem', letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--muted)',
        marginBottom: 8,
      }}>
        Switch Role
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {/* Current role pill (highlighted) */}
        {(() => {
          const role = ROLES.find(r => r.key === currentRole)
          if (!role) return null
          return (
            <span
              key={role.key}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 100,
                fontSize: '0.74rem', fontWeight: 700,
                background: role.colorBg,
                border: `1.5px solid ${role.colorBorder}`,
                color: role.color,
              }}
            >
              <span style={{ fontSize: '0.7rem' }}>{role.icon}</span>
              {role.label}
            </span>
          )
        })()}

        {/* Other active roles */}
        {otherRoles.map(roleKey => {
          const role = ROLES.find(r => r.key === roleKey)
          if (!role) return null
          return (
            <Link
              key={role.key}
              href={role.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 100,
                fontSize: '0.74rem', fontWeight: 500,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '0.7rem' }}>{role.icon}</span>
              {role.label}
            </Link>
          )
        })}
      </div>

      {/* Pending roles */}
      {pendingRoles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
          {pendingRoles.map(roleKey => {
            const info = PENDING_ROLE_LABELS[roleKey]
            if (!info) return null
            return (
              <Link
                key={roleKey}
                href={info.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', borderRadius: 8,
                  background: 'rgba(223,47,74,0.06)',
                  border: '1px solid rgba(223,47,74,0.15)',
                  textDecoration: 'none', fontSize: '0.78rem',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#df2f4a', flexShrink: 0,
                  }} />
                  {info.label}
                </span>
                <span style={{ color: '#df2f4a', fontWeight: 600, fontSize: '0.72rem' }}>Set up now →</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
