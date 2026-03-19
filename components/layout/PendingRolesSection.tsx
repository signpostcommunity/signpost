'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const ROLE_LABELS: Record<string, { label: string; href: string }> = {
  interpreter: { label: 'Interpreter Profile', href: '/interpreter/signup?addRole=true' },
  deaf: { label: 'D/DB/HH Personal Account', href: '/dhh/signup?addRole=true' },
  requester: { label: 'Requester Portal', href: '/request/signup?addRole=true' },
}

export function usePendingRoles() {
  const [pendingRoles, setPendingRoles] = useState<string[]>([])

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('user_profiles')
        .select('pending_roles')
        .eq('id', user.id)
        .single()
      if (data?.pending_roles && data.pending_roles.length > 0) {
        setPendingRoles(data.pending_roles)
      }
    }
    fetch()
  }, [])

  return pendingRoles
}

export default function PendingRolesSection() {
  const pendingRoles = usePendingRoles()
  const [expanded, setExpanded] = useState(false)

  if (pendingRoles.length === 0) return null

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 20px', width: '100%',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.85rem', color: 'var(--muted)',
          fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
          borderLeft: '2px solid transparent',
          transition: 'all 0.15s',
        }}
      >
        <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 8, height: 8, borderRadius: '50%',
            background: '#df2f4a',
            border: '2px solid var(--surface)',
          }} />
        </span>
        <span style={{ flex: 1 }}>Role Switcher</span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, minWidth: 18, height: 18,
          borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 5px',
          background: 'rgba(223,47,74,0.15)', color: '#df2f4a',
        }}>
          {pendingRoles.length}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '4px 20px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pendingRoles.map(role => {
            const info = ROLE_LABELS[role]
            if (!info) return null
            return (
              <Link
                key={role}
                href={info.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(223,47,74,0.06)',
                  border: '1px solid rgba(223,47,74,0.15)',
                  textDecoration: 'none', fontSize: '0.82rem',
                }}
              >
                <span style={{ color: 'var(--text)' }}>{info.label}</span>
                <span style={{ color: '#df2f4a', fontWeight: 600, fontSize: '0.78rem' }}>Set up now →</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
