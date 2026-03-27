'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getVideoEmbedUrl } from '@/lib/videoUtils'

interface CommPrefs {
  signing_style?: string
  signing_styles?: string[]
  voice_preference?: string
  cdi_preferred?: boolean
  di_preferred?: boolean
  notes?: string
}

interface DeafProfile {
  id: string
  name: string
  firstName: string | null
  pronouns: string | null
  commPrefs: CommPrefs | null
  profileVideoUrl: string | null
  vanitySlug: string
}

export default function DeafLandingClient({ deafProfile }: { deafProfile: DeafProfile }) {
  const [authState, setAuthState] = useState<'loading' | 'anon' | 'requester' | 'no_requester'>('loading')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const displayName = deafProfile.firstName || deafProfile.name || 'this person'
  const cp = deafProfile.commPrefs

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setAuthState('anon')
        return
      }

      // Check if user has requester role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, pending_roles')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'requester' || profile?.role === 'org') {
        setAuthState('requester')
      } else {
        // Check if requester profile exists (multi-role users)
        const { data: reqProfile } = await supabase
          .from('requester_profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (reqProfile) {
          setAuthState('requester')
        } else {
          setAuthState('no_requester')
        }
      }
    }
    checkAuth()
  }, [])

  async function handleConnect() {
    setConnecting(true)
    setError('')

    try {
      const res = await fetch('/api/connections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dhh_user_id: deafProfile.id,
          initiated_by: 'dhh',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 401) {
          // Session expired
          window.location.href = `/request/login?return=/d/${deafProfile.vanitySlug}&connect=${deafProfile.id}`
          return
        }
        setError(data.error || 'Something went wrong')
        setConnecting(false)
        return
      }

      // Redirect to booking form with the deaf user's ID
      window.location.href = `/request/dashboard?for=${deafProfile.id}`
    } catch {
      setError('Connection failed. Please try again.')
      setConnecting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Wordmark */}
      <div style={{ padding: '32px 24px 0', width: '100%', maxWidth: 560 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="wordmark" style={{ fontSize: '1.5rem' }}>
            sign<span>post</span>
          </div>
        </Link>
      </div>

      {/* Main content */}
      <div style={{
        width: '100%', maxWidth: 560,
        padding: '40px 24px 60px',
        display: 'flex', flexDirection: 'column', gap: 32,
      }}>
        {/* Name + Pronouns */}
        <div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '2rem',
            fontWeight: 775,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            marginBottom: 8,
            lineHeight: 1.2,
          }}>
            {deafProfile.name}
          </h1>
          {deafProfile.pronouns && (
            <p style={{
              fontSize: '0.92rem',
              color: 'var(--accent2)',
              fontWeight: 500,
              margin: 0,
            }}>
              {deafProfile.pronouns}
            </p>
          )}
        </div>

        {/* Communication preferences */}
        {cp && (cp.signing_style || cp.signing_styles?.length || cp.voice_preference || cp.cdi_preferred || cp.di_preferred || cp.notes) && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px 24px',
          }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
              color: 'var(--accent2)', marginBottom: 14,
              textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem',
            }}>
              Communication Preferences
            </div>

            {(cp.signing_style || (cp.signing_styles && cp.signing_styles.length > 0)) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 3, fontWeight: 600 }}>
                  Signing Style
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  {cp.signing_styles?.length ? cp.signing_styles.join(', ') : cp.signing_style}
                </div>
              </div>
            )}

            {cp.voice_preference && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 3, fontWeight: 600 }}>
                  Voice Interpreting
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  {cp.voice_preference === 'interpreter' && 'Always uses interpreter for voicing'}
                  {cp.voice_preference === 'self' && 'Always voices for self'}
                  {cp.voice_preference === 'depends' && 'Depends on the situation'}
                </div>
              </div>
            )}

            {(cp.cdi_preferred || cp.di_preferred) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  Prefers working with a Deaf Interpreter (DI)
                </div>
              </div>
            )}

            {cp.notes && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 3, fontWeight: 600 }}>
                  Additional Notes
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  {cp.notes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile video */}
        {deafProfile.profileVideoUrl && (() => {
          const embedUrl = getVideoEmbedUrl(deafProfile.profileVideoUrl)
          if (!embedUrl) return null
          return embedUrl.includes('supabase.co/storage') ? (
            <video
              controls
              width="100%"
              src={embedUrl}
              style={{
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                maxHeight: 320,
                background: '#000',
              }}
            />
          ) : (
            <iframe
              width="100%"
              height="300"
              src={embedUrl}
              title="Introduction video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: 'var(--radius-sm)', border: 'none' }}
            />
          )
        })()}

        {/* CTA Button */}
        <div style={{ textAlign: 'center' }}>
          {authState === 'loading' ? (
            <div style={{
              padding: '16px 40px',
              background: 'var(--surface2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--muted)',
              fontSize: '0.92rem',
              display: 'inline-block',
            }}>
              Loading...
            </div>
          ) : authState === 'anon' ? (
            <Link
              href={`/request?return=/d/${deafProfile.vanitySlug}&connect=${deafProfile.id}`}
              style={{
                display: 'inline-block',
                padding: '16px 40px',
                background: '#00e5ff',
                color: '#000',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
            >
              Book an Interpreter for {displayName}
            </Link>
          ) : authState === 'requester' ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{
                padding: '16px 40px',
                background: connecting ? 'var(--surface2)' : '#00e5ff',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                cursor: connecting ? 'wait' : 'pointer',
                opacity: connecting ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {connecting ? 'Connecting...' : `Book an Interpreter for ${displayName}`}
            </button>
          ) : (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px 24px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
                To book interpreters for others, you need a requester account.
              </p>
              <Link
                href={`/request?return=/d/${deafProfile.vanitySlug}&connect=${deafProfile.id}`}
                style={{
                  color: 'var(--accent)',
                  textDecoration: 'underline',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              >
                Set up a requester account
              </Link>
            </div>
          )}

          {error && (
            <p style={{
              color: 'var(--accent3)',
              fontSize: '0.85rem',
              marginTop: 12,
            }}>
              {error}
            </p>
          )}
        </div>

        {/* Subtitle text */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--muted)',
          lineHeight: 1.6,
          maxWidth: 400,
          margin: '0 auto',
        }}>
          signpost connects you with qualified sign language interpreters based on {displayName}&apos;s preferences.
        </p>
      </div>
    </div>
  )
}
