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

interface AuthenticatedProfile {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  city: string | null
  state: string | null
  photoUrl: string | null
  pronouns: string | null
  commPrefs: CommPrefs | null
  profileVideoUrl: string | null
  vanitySlug: string
}

interface PublicProfile {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  city: string | null
  state: string | null
  photoUrl: string | null
  vanitySlug: string
}

type Props =
  | { isAuthenticated: true; deafProfile: AuthenticatedProfile }
  | { isAuthenticated: false; deafProfile: PublicProfile }

export default function DeafLandingClient(props: Props) {
  if (!props.isAuthenticated) {
    return <PublicView profile={props.deafProfile} />
  }
  return <AuthenticatedView deafProfile={props.deafProfile} />
}

/* ─── Public (unauthenticated) view ─── */

function PublicView({ profile }: { profile: PublicProfile }) {
  const displayName = profile.firstName || profile.name || 'this person'
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.name || 'User'
  const location = [profile.city, profile.state].filter(Boolean).join(', ')
  const initials = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .map(n => n!.charAt(0).toUpperCase())
    .join('') || '?'

  const redirectUrl = `/d/${profile.vanitySlug}`

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Wordmark */}
      <div style={{ padding: '32px 24px 0', width: '100%', maxWidth: 600 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="wordmark" style={{ fontSize: '1.5rem' }}>
            sign<span>post</span>
          </div>
        </Link>
      </div>

      {/* Main content */}
      <div style={{
        width: '100%', maxWidth: 600,
        padding: '40px 24px 60px',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {/* Identity card */}
        <div className="public-id-card" style={{
          background: '#111118',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={fullName}
              style={{
                width: 64, height: 64,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
              className="public-id-photo"
            />
          ) : (
            <div className="public-id-photo" style={{
              width: 64, height: 64,
              borderRadius: '50%',
              background: 'rgba(167, 139, 250, 0.15)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Syne', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: '#a78bfa',
              flexShrink: 0,
            }}>
              {initials}
            </div>
          )}
          <div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: '#f0f2f8',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}>
              {fullName}
            </div>
            {location && (
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#96a0b8',
                marginTop: 4,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {location}
              </div>
            )}
          </div>
        </div>

        {/* Hero copy */}
        <div style={{
          background: '#111118',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px 24px',
          marginTop: 24,
        }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: '#f0f2f8',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            margin: '0 0 8px',
          }}>
            Book an ASL interpreter for {fullName}
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            color: '#96a0b8',
            lineHeight: 1.6,
            margin: 0,
          }}>
            {displayName} uses signpost to coordinate interpreting. Submit a request and their preferred interpreter team will be notified.
          </p>
        </div>

        {/* Who is this for */}
        <div style={{
          background: '#111118',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 24px',
          marginTop: 16,
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            color: '#a78bfa',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: 12,
            marginBottom: 12,
          }}>
            Who is this for?
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            color: '#c8cdd8',
            lineHeight: 1.6,
            margin: '0 0 12px',
          }}>
            This page is for anyone booking an interpreter on behalf of {displayName}: office coordinators, HR staff, event planners, medical receptionists, school administrators, or court coordinators.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            color: '#96a0b8',
            lineHeight: 1.6,
            margin: 0,
          }}>
            signpost charges a flat $15 per interpreter confirmed on a booking. No percentage-based commissions. 100% of the interpreter&apos;s rate goes directly to them.
          </p>
        </div>

        {/* Signup prompt */}
        <div className="signup-prompt" style={{
          background: '#111118',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px 24px',
          marginTop: 16,
        }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            fontWeight: 400,
            color: '#c8cdd8',
            lineHeight: 1.6,
            margin: '0 0 20px',
          }}>
            Create a free account to submit an interpreter request. Nothing is charged until your interpreter is confirmed.
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}>
            <Link
              href={`/request/signup?redirect=${encodeURIComponent(redirectUrl)}`}
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: '#00e5ff',
                color: '#0a0a0f',
                fontWeight: 700,
                fontSize: 14.5,
                fontFamily: "'DM Sans', sans-serif",
                borderRadius: 10,
                textDecoration: 'none',
                transition: 'opacity 0.15s',
              }}
            >
              Create Account
            </Link>
            <Link
              href={`/request/login?redirect=${encodeURIComponent(redirectUrl)}`}
              style={{
                color: '#00e5ff',
                fontSize: 14.5,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                textDecoration: 'none',
              }}
            >
              Log In
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .public-id-card {
            margin-left: -8px;
            margin-right: -8px;
          }
          .public-id-photo {
            width: 48px !important;
            height: 48px !important;
          }
          .signup-prompt {
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  )
}

/* ─── Authenticated view (unchanged from original) ─── */

function AuthenticatedView({ deafProfile }: { deafProfile: AuthenticatedProfile }) {
  const [authState, setAuthState] = useState<'loading' | 'anon' | 'self' | 'requester' | 'no_requester'>('loading')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const displayName = deafProfile.firstName || deafProfile.name || 'this person'
  const fullName = [deafProfile.firstName, deafProfile.lastName].filter(Boolean).join(' ') || deafProfile.name || 'User'
  const location = [deafProfile.city, deafProfile.state].filter(Boolean).join(', ')
  const initials = [deafProfile.firstName, deafProfile.lastName]
    .filter(Boolean)
    .map(n => n!.charAt(0).toUpperCase())
    .join('') || '?'
  const cp = deafProfile.commPrefs

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setAuthState('anon')
        return
      }

      // Self-view: user is viewing their own share page
      if (user.id === deafProfile.id) {
        setAuthState('self')
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
  }, [deafProfile.id])

  async function handleConnect() {
    setConnecting(true)
    setError('')

    try {
      const res = await fetch('/api/connections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dhh_user_id: deafProfile.id,
          // 'dhh' triggers auto-approval in /api/connections/create.
          // The DHH user pre-consented by creating and publishing this share link,
          // so the connection lands active rather than pending. This is not a
          // click-attribution value; it is a source-of-trust signal.
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

      // Redirect to new-request form pre-filled with this DHH person
      window.location.href = `/request/dashboard/new-request?deaf_id=${deafProfile.id}`
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
        {/* Identity card */}
        <div className="auth-id-card" style={{
          background: '#111118',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          {deafProfile.photoUrl ? (
            <img
              src={deafProfile.photoUrl}
              alt={fullName}
              style={{
                width: 64, height: 64,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
              className="auth-id-photo"
            />
          ) : (
            <div className="auth-id-photo" style={{
              width: 64, height: 64,
              borderRadius: '50%',
              background: 'rgba(167, 139, 250, 0.15)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Syne', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: '#a78bfa',
              flexShrink: 0,
            }}>
              {initials}
            </div>
          )}
          <div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: '#f0f2f8',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
            }}>
              {fullName}
            </div>
            {deafProfile.pronouns && (
              <div style={{
                fontSize: '0.88rem',
                color: 'var(--accent2)',
                fontWeight: 500,
                marginTop: 2,
              }}>
                {deafProfile.pronouns}
              </div>
            )}
            {location && (
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#96a0b8',
                marginTop: 4,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {location}
              </div>
            )}
          </div>
        </div>

        {/* Hero copy */}
        {authState !== 'self' && (
          <div style={{
            background: '#111118',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '28px 24px',
          }}>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: '#f0f2f8',
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
              margin: '0 0 8px',
            }}>
              Book an ASL interpreter for {fullName}
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 400,
              color: '#96a0b8',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {displayName} uses signpost to coordinate interpreting. Submit a request and their preferred interpreter team will be notified.
            </p>
          </div>
        )}

        {/* Who is this for - shown to non-self authenticated users */}
        {authState !== 'self' && authState !== 'loading' && (
          <div style={{
            background: '#111118',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 24px',
          }}>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              color: '#a78bfa',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: 12,
              marginBottom: 12,
            }}>
              Who is this for?
            </div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 400,
              color: '#c8cdd8',
              lineHeight: 1.6,
              margin: '0 0 12px',
            }}>
              This page is for anyone booking an interpreter on behalf of {displayName}: office coordinators, HR staff, event planners, medical receptionists, school administrators, or court coordinators.
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 400,
              color: '#96a0b8',
              lineHeight: 1.6,
              margin: 0,
            }}>
              signpost charges a flat $15 per interpreter confirmed on a booking. No percentage-based commissions. 100% of the interpreter&apos;s rate goes directly to them.
            </p>
          </div>
        )}

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
          ) : authState === 'self' ? (
            <div style={{
              background: '#111118',
              border: '1px solid rgba(167, 139, 250, 0.2)',
              borderRadius: 12,
              padding: '28px 24px',
              textAlign: 'left',
            }}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: '#f0f2f8',
                marginBottom: 8,
              }}>
                This is your share page
              </div>
              <p style={{
                fontSize: '0.88rem',
                color: '#96a0b8',
                lineHeight: 1.6,
                margin: '0 0 20px',
              }}>
                Anyone with this link can request an interpreter on your behalf. Share it with entities that book interpreters for you.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    const url = `https://signpost.community/d/${deafProfile.vanitySlug}`
                    navigator.clipboard.writeText(url).then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    })
                  }}
                  style={{
                    padding: '10px 20px',
                    background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(167, 139, 250, 0.1)',
                    border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(167, 139, 250, 0.3)'}`,
                    borderRadius: 10,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: copied ? '#34d399' : '#a78bfa',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.15s',
                  }}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <Link
                  href="/dhh/dashboard/preferences"
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--muted)',
                    textDecoration: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  Edit in Preferences
                </Link>
              </div>
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
            <p
              role="alert"
              style={{
                color: 'var(--accent3)',
                fontSize: '0.85rem',
                marginTop: 12,
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Subtitle text */}
        {authState !== 'self' && authState !== 'loading' && (
          <p style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--muted)',
            lineHeight: 1.6,
            maxWidth: 440,
            margin: '0 auto',
          }}>
            When you submit a request, {displayName}&apos;s preferred interpreters are notified first. Their communication preferences are shared with your interpreter automatically.
          </p>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .auth-id-card {
            margin-left: -8px;
            margin-right: -8px;
          }
          .auth-id-photo {
            width: 48px !important;
            height: 48px !important;
          }
        }
      `}</style>
    </div>
  )
}
