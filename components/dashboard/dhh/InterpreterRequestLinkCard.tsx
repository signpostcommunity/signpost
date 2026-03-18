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

  const outerStyle: React.CSSProperties = {
    width: 280,
    flexShrink: 0,
    background: 'var(--card-bg)',
    border: '1px solid rgba(0,229,255,0.2)',
    borderRadius: 'var(--radius)',
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
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
      <div style={{ flexShrink: 0 }}>
        <div style={{
          padding: 8,
          background: '#111118',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          lineHeight: 0,
        }}>
          <QRCodeSVG
            value={`https://signpost.community/d/${vanitySlug}`}
            size={100}
            bgColor="#111118"
            fgColor="#00e5ff"
            level="M"
          />
        </div>
        <p style={{
          fontSize: '0.68rem',
          color: 'var(--muted)',
          textAlign: 'center',
          marginTop: 6,
          marginBottom: 0,
          lineHeight: 1.3,
        }}>
          Show to book for you
        </p>
      </div>

      {/* Right: text + actions */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--text)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          My Interpreter Request Link
        </div>

        <code style={{
          display: 'block',
          fontSize: '0.72rem',
          color: 'var(--accent)',
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          lineHeight: 1.4,
          marginTop: 4,
        }}>
          {fullUrl}
        </code>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Link copied' : 'Copy interpreter request link'}
            style={{
              padding: '5px 16px',
              background: copied ? 'rgba(52,211,153,0.15)' : 'transparent',
              border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(0,229,255,0.3)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.76rem',
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
          <Link
            href="/dhh/dashboard/preferences"
            style={{
              fontSize: '0.72rem',
              color: 'var(--muted)',
              textDecoration: 'none',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  )
}
