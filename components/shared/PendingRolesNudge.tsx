'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const ROLE_LABELS: Record<string, string> = {
  interpreter: 'sign language interpreter',
  deaf: 'Deaf/DB/HH individual',
  requester: 'requester/coordinator',
}

const STORAGE_KEY = 'signpost_pending_nudge_dismissed'

export default function PendingRolesNudge({ accentColor = 'var(--accent)' }: { accentColor?: string }) {
  const [pendingRoles, setPendingRoles] = useState<string[]>([])
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) return
    setDismissed(false)
    ;(async () => {
      try {
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
      } catch (e) {
        console.error('Failed to fetch pending roles:', e)
      }
    })()
  }, [])

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  if (dismissed || pendingRoles.length === 0) return null

  const roleList = pendingRoles
    .map(r => ROLE_LABELS[r])
    .filter(Boolean)
    .join(' and ')

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${accentColor === 'var(--accent2)' ? 'rgba(157,135,255,0.25)' : 'rgba(0,229,255,0.2)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '14px 20px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
        You mentioned you&apos;re also a {roleList}.
        Set up that profile anytime from the role switcher in your sidebar.
      </span>
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted)',
          fontSize: '1rem',
          padding: '4px 8px',
          flexShrink: 0,
          lineHeight: 1,
          opacity: 0.6,
        }}
        aria-label="Dismiss"
      >
        x
      </button>
    </div>
  )
}
