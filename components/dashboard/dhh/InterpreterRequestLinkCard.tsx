'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
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

  // Shared outer style matching StatCard: card-bg, border, radius, padding, flex
  const outerStyle: React.CSSProperties = {
    gridColumn: 'span 2',
    background: 'var(--card-bg)',
    border: '1px solid rgba(0,229,255,0.15)',
    borderRadius: 'var(--radius)',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  }

  if (loading) {
    return (
      <div style={outerStyle}>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Loading...</div>
      </div>
    )
  }

  if (!vanitySlug) return null

  const fullUrl = `signpost.community/d/${vanitySlug}`

  return (
    <div style={outerStyle} role="region" aria-label="My Interpreter Request Link">
      {/* Left: QR code */}
      <div style={{
        flexShrink: 0,
        padding: 8,
        background: '#111118',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        lineHeight: 0,
      }}>
        <QRCodeSVG
          value={`https://signpost.community/d/${vanitySlug}`}
          size={80}
          bgColor="#111118"
          fgColor="#00e5ff"
          level="M"
        />
      </div>

      {/* Right: label, URL, copy button */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif" }}>
            My Interpreter Request Link
          </div>
          <Link
            href="/dhh/dashboard/preferences"
            style={{
              fontSize: '0.72rem',
              color: 'var(--muted)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              opacity: 0.7,
            }}
          >
            Edit
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <code style={{
            flex: 1,
            minWidth: 0,
            padding: '7px 12px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            color: 'var(--accent)',
            fontFamily: 'monospace',
            userSelect: 'all',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {fullUrl}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Link copied' : 'Copy interpreter request link'}
            style={{
              padding: '7px 14px',
              background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(0,229,255,0.1)',
              border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(0,229,255,0.3)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
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
    </div>
  )
}
