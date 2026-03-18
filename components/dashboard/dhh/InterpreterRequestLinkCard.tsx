'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/slugUtils'

export default function InterpreterRequestLinkCard() {
  const [vanitySlug, setVanitySlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('deaf_profiles')
        .select('vanity_slug, first_name, last_name')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle()

      if (!profile) { setLoading(false); return }

      if (profile.vanity_slug) {
        setVanitySlug(profile.vanity_slug)
      } else if (profile.first_name || profile.last_name) {
        // Auto-generate slug for users who don't have one yet
        const baseSlug = generateSlug(profile.first_name || '', profile.last_name || '').slice(0, 50)
        if (baseSlug && baseSlug.length >= 3) {
          let slug = baseSlug
          let attempt = 1
          while (attempt <= 20) {
            const { data: existing } = await supabase
              .from('deaf_profiles')
              .select('vanity_slug')
              .ilike('vanity_slug', slug)
              .maybeSingle()
            if (!existing) break
            attempt++
            slug = `${baseSlug}-${attempt}`
          }
          const { error } = await supabase
            .from('deaf_profiles')
            .update({ vanity_slug: slug })
            .or(`user_id.eq.${user.id},id.eq.${user.id}`)
          if (!error) {
            setVanitySlug(slug)
          }
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  function handleCopy() {
    if (!vanitySlug) return
    const url = `https://signpost.community/d/${vanitySlug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div style={{
        background: 'rgba(0,229,255,0.03)',
        border: '1px solid rgba(0,229,255,0.15)',
        borderRadius: 'var(--radius)',
        padding: '20px 24px',
      }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>Loading...</div>
      </div>
    )
  }

  if (!vanitySlug) return null

  const fullUrl = `signpost.community/d/${vanitySlug}`

  return (
    <div
      style={{
        background: 'rgba(0,229,255,0.03)',
        border: '1px solid rgba(0,229,255,0.15)',
        borderRadius: 'var(--radius)',
        padding: '20px 24px',
      }}
      role="region"
      aria-label="My Interpreter Request Link"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <h3 style={{
          margin: 0,
          fontSize: '0.88rem',
          fontWeight: 700,
          color: 'var(--accent)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          My Interpreter Request Link
        </h3>
        <Link
          href="/dhh/dashboard/preferences"
          style={{
            fontSize: '0.78rem',
            color: 'var(--muted)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Edit in Preferences
        </Link>
      </div>

      <p style={{
        fontSize: '0.82rem',
        color: 'var(--muted)',
        lineHeight: 1.6,
        margin: '0 0 14px',
      }}>
        Share this link with anyone who books interpreters for you.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <code style={{
          flex: 1,
          minWidth: 180,
          padding: '9px 14px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.84rem',
          color: 'var(--accent)',
          fontFamily: 'monospace',
          userSelect: 'all',
          wordBreak: 'break-all',
        }}>
          {fullUrl}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Link copied' : 'Copy interpreter request link'}
          style={{
            padding: '9px 18px',
            background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(0,229,255,0.1)',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(0,229,255,0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: copied ? '#34d399' : 'var(--accent)',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  )
}
