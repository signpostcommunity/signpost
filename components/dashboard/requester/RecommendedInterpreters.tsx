'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface InterpreterInfo {
  id: string
  name: string
  first_name?: string
  last_name?: string
  photo_url?: string
  vanity_slug?: string
  sign_languages?: string[]
  specializations?: string[]
  city?: string
  state?: string
  available?: boolean
  rating?: number
  review_count?: number
  roster_notes?: string
  approve_work?: boolean
  approve_personal?: boolean
}


interface DhhUser {
  name: string
  first_name?: string
  comm_prefs?: Record<string, unknown>
  pronouns?: string
}

interface PreferencesData {
  dhh_user: DhhUser | null
  preferred: InterpreterInfo[]
  approved: InterpreterInfo[]
  do_not_book_ids: string[]
}

function InterpreterTierCard({
  interpreter,
  tier,
}: {
  interpreter: InterpreterInfo
  tier: 'preferred' | 'approved'
}) {
  const i = interpreter
  const isDnb = false
  const initials = (i.name || '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${isDnb ? 'rgba(200,207,224,0.08)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: isDnb ? 0.4 : 1,
        filter: isDnb ? 'grayscale(1)' : 'none',
        pointerEvents: isDnb ? 'none' : 'auto',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Avatar */}
      {isDnb ? (
        i.photo_url ? (
          <img
            src={i.photo_url}
            alt=""
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #7b61ff, #00e5ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: '0.88rem',
              color: '#fff',
            }}
          >
            {initials}
          </div>
        )
      ) : (
        <Link href={`/directory/${i.id}`} style={{ flexShrink: 0, cursor: 'pointer' }}>
          {i.photo_url ? (
            <img
              src={i.photo_url}
              alt=""
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: tier === 'preferred'
                  ? 'linear-gradient(135deg, #00e5ff, #9d87ff)'
                  : 'linear-gradient(135deg, #7b61ff, #00e5ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#fff',
              }}
            >
              {initials}
            </div>
          )}
        </Link>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          {isDnb ? (
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.92rem' }}>
              {i.name}
            </span>
          ) : (
            <Link
              href={`/directory/${i.id}`}
              className="interp-name-link"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: '0.92rem',
                color: 'var(--text)',
                textDecoration: 'none',
              }}
            >
              {i.name}
            </Link>
          )}
          {tier === 'preferred' && !isDnb && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Top Choice
            </span>
          )}
          {tier === 'approved' && !isDnb && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Approved
            </span>
          )}
        </div>

        {isDnb ? (
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            Not recommended for this request
          </div>
        ) : (
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {i.sign_languages?.length ? (
              <span>{i.sign_languages.slice(0, 3).join(', ')}</span>
            ) : null}
            {i.city || i.state ? (
              <span>{[i.city, i.state].filter(Boolean).join(', ')}</span>
            ) : null}
            {i.rating ? (
              <span>{Number(i.rating).toFixed(1)} ({i.review_count || 0})</span>
            ) : null}
          </div>
        )}

        {/* Setting-specific soft indicators */}
        {!isDnb && tier === 'preferred' && i.approve_work === false && (
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4, fontStyle: 'italic' }}>
            Preferred for personal settings
          </div>
        )}
        {!isDnb && tier === 'preferred' && i.approve_personal === false && (
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4, fontStyle: 'italic' }}>
            Preferred for work settings
          </div>
        )}
      </div>

      {/* Availability */}
      {!isDnb && i.available !== undefined && (
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          color: i.available ? '#34d399' : 'var(--muted)',
          flexShrink: 0,
        }}>
          {i.available ? 'Available' : 'Unavailable'}
        </div>
      )}
    </div>
  )
}

export default function RecommendedInterpreters({ dhhUserId }: { dhhUserId: string }) {
  const [data, setData] = useState<PreferencesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [noConnection, setNoConnection] = useState(false)
  const [notifyToast, setNotifyToast] = useState(false)

  const displayName = data?.dhh_user?.first_name || data?.dhh_user?.name || 'this person'

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/connections/preferences?dhh_user_id=${dhhUserId}`)
        if (res.status === 403) {
          setNoConnection(true)
          setLoading(false)
          return
        }
        if (!res.ok) {
          setLoading(false)
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        // silent fail — show normal form
      }
      setLoading(false)
    }
    load()
  }, [dhhUserId])

  if (loading) {
    return (
      <div style={{
        padding: '20px 24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: 24,
        color: 'var(--muted)',
        fontSize: '0.88rem',
      }}>
        Loading interpreter preferences...
      </div>
    )
  }

  // No active connection — silently show nothing
  if (noConnection || !data) {
    return null
  }

  const hasPreferences = data.preferred.length > 0 || data.approved.length > 0
  const hasDnb = data.do_not_book_ids.length > 0

  if (!hasPreferences && !hasDnb) {
    return (
      <div style={{
        padding: '24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: 24,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
          {displayName} hasn&apos;t set up their interpreter preferences yet.
        </p>
        <button
          onClick={() => {
            setNotifyToast(true)
            setTimeout(() => setNotifyToast(false), 3000)
          }}
          style={{
            padding: '9px 20px',
            background: 'rgba(0,229,255,0.1)',
            border: '1px solid rgba(0,229,255,0.3)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--accent)',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Let them know
        </button>
        {notifyToast && (
          <div style={{
            position: 'fixed', top: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
            background: 'var(--card-bg)', border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 'var(--radius)', padding: '12px 24px', fontSize: '0.88rem',
            color: '#34d399', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            We&apos;ll let {displayName} know you&apos;re looking for their preferences.
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Recommended section */}
      {hasPreferences && (
        <div style={{
          background: 'rgba(0,229,255,0.02)',
          border: '1px solid rgba(0,229,255,0.12)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          marginBottom: hasDnb ? 16 : 0,
        }}>
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1.05rem',
            fontWeight: 700,
            marginBottom: 20,
            letterSpacing: '-0.02em',
          }}>
            Recommended Interpreters
          </h3>

          {/* Preferred */}
          {data.preferred.length > 0 && (
            <div style={{ marginBottom: data.approved.length > 0 ? 20 : 0 }}>
              <div style={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--accent)',
                marginBottom: 10,
              }}>
                {displayName}&apos;s Preferred Interpreters
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.preferred.map(i => (
                  <InterpreterTierCard key={i.id} interpreter={i} tier="preferred" />
                ))}
              </div>
            </div>
          )}

          {/* Approved */}
          {data.approved.length > 0 && (
            <div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--muted)',
                marginBottom: 10,
              }}>
                Also on {displayName}&apos;s List
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.approved.map(i => (
                  <InterpreterTierCard key={i.id} interpreter={i} tier="approved" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DNB — silent exclusion only, no names or details shown */}

      <style>{`
        .interp-name-link:hover { text-decoration: underline !important; }
      `}</style>
    </div>
  )
}
