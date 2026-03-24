'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RequesterDashboardPage() {
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function fetchName() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('requester_profiles')
        .select('first_name, name')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle()

      if (data?.first_name) {
        setUserName(data.first_name)
      } else if (data?.name) {
        setUserName(data.name.split(' ')[0] || 'there')
      }
    }
    fetchName()
  }, [])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px 64px' }}>
      {/* Greeting */}
      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: '1.6rem',
        fontWeight: 700,
        letterSpacing: '-0.03em',
        marginBottom: 8,
      }}>
        {userName ? `Good to see you, ${userName}.` : 'Welcome to your dashboard.'}
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: 40, lineHeight: 1.6 }}>
        {"Here's a snapshot of your activity on signpost."}
      </p>

      {/* Placeholder card */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(0,229,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <h2 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '1.15rem',
          fontWeight: 700,
          marginBottom: 8,
        }}>
          Your dashboard is being built
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
          Request overview, stats, and booking management are coming soon. In the meantime, browse interpreters and start building your preferred list.
        </p>
        <Link
          href="/directory?context=requester"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent)',
            color: '#000',
            borderRadius: 8,
            padding: '12px 24px',
            fontWeight: 700,
            fontSize: '0.92rem',
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
        >
          Browse Interpreter Directory →
        </Link>
      </div>
    </div>
  )
}
