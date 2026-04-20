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
    width: '100%',
    height: '100%',
    background: 'var(--card-bg)',
    border: '1px solid rgba(0,229,255,0.2)',
    borderRadius: 'var(--radius)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
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
    <div className="irl-card" style={outerStyle} role="region" aria-label="My Interpreter Request Link">
      {/* Top row: QR code + title/description */}
      <div className="irl-top-row" style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
      }}>
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            padding: 10,
            background: '#111118',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            lineHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <QRCodeSVG
              value={`https://signpost.community/d/${vanitySlug}`}
              size={120}
              bgColor="#111118"
              fgColor="#00e5ff"
              level="M"
            />
          </div>
        </div>
        <div className="irl-title-block" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text)',
            fontFamily: "'Inter', sans-serif",
          }}>
            My Interpreter Request Link
          </div>
          <p style={{
            fontSize: '0.68rem',
            color: 'var(--muted)',
            margin: '2px 0 0',
            lineHeight: 1.3,
          }}>
            Share with anyone who books interpreters for you
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: 'var(--border)',
        margin: '14px 0',
      }} />

      {/* URL row: full card width */}
      <div>
        <a
          href={`https://signpost.community/d/${vanitySlug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            fontSize: '0.85rem',
            color: 'var(--accent)',
            fontFamily: 'monospace',
            overflowWrap: 'anywhere',
            lineHeight: 1.4,
            textDecoration: 'none',
          }}
        >
          {fullUrl}
        </a>
      </div>

      {/* Actions row */}
      <div className="irl-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
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
            fontFamily: "'Inter', sans-serif",
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
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Edit
        </Link>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .irl-card {
            align-items: center !important;
          }
          .irl-top-row {
            flex-direction: column !important;
            align-items: center !important;
          }
          .irl-title-block {
            align-items: center !important;
            text-align: center !important;
          }
          .irl-actions {
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  )
}
