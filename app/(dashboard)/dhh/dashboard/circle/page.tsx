'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

export const dynamic = 'force-dynamic'

interface Connection {
  id: string
  inviter_id: string
  invitee_id: string | null
  invitee_email: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  accepted_at: string | null
  other_user_id: string | null
  other_name: string
  is_inviter: boolean
  other_location?: string
  other_preferred_count?: number
}

interface RosterInterpreter {
  id: string
  interpreter_id: string
  tier: string
  notes: string | null
  name: string
  photo_url: string | null
  certs: string
  domains: string
  initials: string
  color: string
}

export default function TrustedDeafCirclePage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [toast, setToast] = useState('')
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [viewingUserName, setViewingUserName] = useState('')
  const [viewingRoster, setViewingRoster] = useState<RosterInterpreter[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/dhh/circle')
      const data = await res.json()
      if (data.connections) setConnections(data.connections)
    } catch (err) {
      console.error('Failed to fetch connections:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviteLoading(true)
    setInviteError('')

    try {
      const res = await fetch('/api/dhh/circle/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.error || 'Failed to send invite')
        return
      }
      setShowInviteModal(false)
      setInviteEmail('')
      showToast('Invite sent')
      fetchConnections()
    } catch {
      setInviteError('Something went wrong')
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleRespond(inviteId: string, action: 'accept' | 'decline') {
    try {
      const res = await fetch('/api/dhh/circle/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Failed')
        return
      }
      showToast(action === 'accept' ? 'Invite accepted' : 'Invite declined')
      fetchConnections()
    } catch {
      showToast('Something went wrong')
    }
  }

  async function handleViewList(userId: string, name: string) {
    setViewingUserId(userId)
    setViewingUserName(name)
    setRosterLoading(true)
    setViewingRoster([])

    try {
      const supabase = createClient()

      // Use the admin-backed API to fetch their roster
      // We need a dedicated endpoint or use the existing pattern
      // For now, query directly — RLS won't allow it, so we fetch via API
      const res = await fetch(`/api/dhh/circle/roster?userId=${userId}`)
      const data = await res.json()
      if (data.roster) {
        setViewingRoster(data.roster)
      }
    } catch (err) {
      console.error('Failed to fetch roster:', err)
    } finally {
      setRosterLoading(false)
    }
  }

  const accepted = connections.filter(c => c.status === 'accepted')
  // Deduplicate pending sent by email (keep most recent)
  const pendingSentRaw = connections.filter(c => c.status === 'pending' && c.is_inviter)
  const pendingSent = Object.values(
    pendingSentRaw.reduce<Record<string, Connection>>((acc, c) => {
      const key = c.invitee_email?.toLowerCase() || c.id
      if (!acc[key] || new Date(c.created_at) > new Date(acc[key].created_at)) {
        acc[key] = c
      }
      return acc
    }, {})
  )
  const pendingReceived = connections.filter(c => c.status === 'pending' && !c.is_inviter)

  const TIER_BADGE: Record<string, { label: string; bg: string; border: string; color: string }> = {
    preferred: { label: 'Preferred', bg: 'rgba(0,229,255,0.12)', border: 'rgba(0,229,255,0.3)', color: 'var(--accent)' },
    approved: { label: 'Secondary Tier', bg: 'rgba(123,97,255,0.12)', border: 'rgba(123,97,255,0.3)', color: '#a78bfa' },
    dnb: { label: 'Do Not Book', bg: 'rgba(255,77,109,0.1)', border: 'rgba(255,77,109,0.3)', color: '#ff8099' },
  }

  return (
    <div className="dash-page-content" style={{ padding: '40px 48px', maxWidth: 900 }}>
      {/* Title row with invite button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '27px',
          margin: 0, color: '#f0f2f8',
        }}>
          Your trusted Deaf circle
        </h1>
        <button
          onClick={() => setShowInviteModal(true)}
          style={{
            background: '#7b61ff',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '9px 22px',
            fontSize: '0.84rem',
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          + Invite someone to your circle
        </button>
      </div>

      {/* Subtitle */}
      <p style={{
        fontWeight: 400, fontSize: '15px', color: '#96a0b8', lineHeight: 1.6,
        margin: '0 0 24px',
      }}>
        Deaf-to-Deaf: Privately share interpreter lists with friends. Help each other find the interpreters you&apos;ll love... and avoid the ones you won&apos;t.
      </p>

      {/* Scenario cards — 3-column grid */}
      <div className="circle-scenario-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 36,
      }}>
        {[
          "Traveling for work, but don\u2019t know any strong interpreters there? See who your friends trust.",
          "Giving a big presentation and wondering which voice interpreters your friends recommend?",
          "New to an area and need to find interpreters fast? Your circle has you covered.",
        ].map((text, idx) => (
          <div key={idx} style={{
            background: '#16161f',
            borderLeft: '3px solid #7b61ff',
            borderRadius: '0 8px 8px 0',
            padding: '16px 20px',
            fontSize: '0.875rem',
            color: '#b0b8c8',
            lineHeight: 1.6,
          }}>
            {text}
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading...</p>
      ) : (
        <>
          {/* YOUR CIRCLE section */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontWeight: 600, fontSize: '13px',
              color: '#a78bfa', margin: '0 0 14px', textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}>
              YOUR CIRCLE {accepted.length > 0 && `(${accepted.length})`}
            </h2>
            {accepted.length === 0 ? (
              <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '32px 24px', textAlign: 'center',
              }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0 0 16px' }}>
                  No connections yet. Invite a friend to get started.
                </p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    background: '#7b61ff', color: '#fff', border: 'none',
                    borderRadius: 10, padding: '9px 22px', fontSize: '0.84rem',
                    fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  + Invite someone
                </button>
              </div>
            ) : (
              <div className="circle-cards-grid" style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16,
              }}>
                {accepted.map(c => (
                  <div key={c.id} style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #9d87ff, #7b61ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.82rem', color: '#fff',
                      }}>
                        {c.other_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>
                          {c.other_name}
                        </div>
                        {c.other_location && (
                          <div style={{ fontSize: '0.81rem', color: 'var(--muted)', marginTop: 2 }}>
                            {c.other_location}
                          </div>
                        )}
                        {c.other_preferred_count != null && (
                          <div style={{ fontSize: '0.81rem', color: 'var(--muted)', marginTop: 2 }}>
                            {c.other_preferred_count} preferred interpreter{c.other_preferred_count !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => c.other_user_id && handleViewList(c.other_user_id, c.other_name)}
                      disabled={!c.other_user_id}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(123,97,255,0.35)',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#9d87ff',
                        cursor: c.other_user_id ? 'pointer' : 'not-allowed',
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'background 0.15s, border-color 0.15s',
                        opacity: c.other_user_id ? 1 : 0.5,
                        width: '100%',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,97,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(123,97,255,0.5)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(123,97,255,0.35)' }}
                    >
                      View their list
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* PENDING INVITES section */}
          {(pendingSent.length > 0 || pendingReceived.length > 0) && (
            <section>
              <h2 style={{
                fontWeight: 600, fontSize: '13px',
                color: '#a78bfa', margin: '0 0 14px', textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
              }}>
                PENDING INVITES
              </h2>

              {/* Received */}
              {pendingReceived.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{
                    fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em', color: '#96a0b8', margin: '0 0 8px',
                  }}>
                    Received
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingReceived.map(c => (
                      <div key={c.id} style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.68rem', color: '#fff',
                          }}>
                            {c.other_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.other_name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleRespond(c.id, 'accept')}
                            style={{
                              background: '#7b61ff', color: '#fff', border: 'none',
                              borderRadius: 8, padding: '7px 18px', fontSize: '0.82rem',
                              fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespond(c.id, 'decline')}
                            style={{
                              background: 'transparent', color: 'var(--muted)',
                              border: '1px solid var(--border)', borderRadius: 8,
                              padding: '7px 18px', fontSize: '0.82rem', fontWeight: 600,
                              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sent */}
              {pendingSent.length > 0 && (
                <div>
                  <h3 style={{
                    fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em', color: '#96a0b8', margin: '0 0 8px',
                  }}>
                    Sent
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingSent.map(c => (
                      <div key={c.id} style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}>
                        <span style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--text)' }}>
                          {c.invitee_email}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{
                            fontSize: '0.75rem', color: 'var(--muted)',
                            border: '1px solid var(--border)',
                            padding: '3px 10px', borderRadius: 100,
                          }}>
                            Pending
                          </span>
                          <button
                            onClick={() => {
                              // Re-send invite by calling the same invite endpoint
                              fetch('/api/dhh/circle/invite', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: c.invitee_email }),
                              }).then(() => showToast('Invite resent'))
                                .catch(() => showToast('Failed to resend'))
                            }}
                            style={{
                              background: 'none', border: 'none', color: '#9d87ff',
                              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                              fontFamily: "'DM Sans', sans-serif", padding: 0,
                            }}
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => handleRespond(c.id, 'decline')}
                            style={{
                              background: 'none', border: 'none', color: 'var(--muted)',
                              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                              fontFamily: "'DM Sans', sans-serif", padding: 0,
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <InviteModal
          email={inviteEmail}
          setEmail={setInviteEmail}
          loading={inviteLoading}
          error={inviteError}
          onSubmit={handleInvite}
          onClose={() => { setShowInviteModal(false); setInviteEmail(''); setInviteError('') }}
        />
      )}

      {/* View list modal */}
      {viewingUserId && (
        <ViewListModal
          userName={viewingUserName}
          roster={viewingRoster}
          loading={rosterLoading}
          tierBadge={TIER_BADGE}
          onClose={() => { setViewingUserId(null); setViewingRoster([]) }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: 'var(--text)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '10px 24px', fontSize: '0.88rem',
          fontFamily: "'DM Sans', sans-serif", zIndex: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .circle-scenario-grid { grid-template-columns: 1fr !important; }
          .circle-cards-grid { grid-template-columns: 1fr !important; }
          .dash-page-content { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  )
}

/* ───── Invite Modal ───── */

function InviteModal({ email, setEmail, loading, error, onSubmit, onClose }: {
  email: string
  setEmail: (v: string) => void
  loading: boolean
  error: string
  onSubmit: () => void
  onClose: () => void
}) {
  const focusTrapRef = useFocusTrap(true)

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Invite to trusted Deaf circle"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          width: '100%', maxWidth: 460,
          padding: '28px 32px',
        }}
      >
        <h2 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px',
          margin: '0 0 8px', color: '#f0f2f8',
        }}>
          Invite someone to your Deaf circle
        </h2>
        <p style={{
          color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6,
          margin: '0 0 20px',
        }}>
          They&apos;ll receive an email invitation. Once they accept, you can both see each other&apos;s preferred interpreter lists and helpful notes.
        </p>

        <label htmlFor="invite-email" style={{
          display: 'block', fontSize: '13px', fontWeight: 500,
          color: '#c8cdd8', marginBottom: 6,
        }}>
          Email address
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="friend@example.com"
          onKeyDown={e => { if (e.key === 'Enter' && !loading) onSubmit() }}
          style={{
            width: '100%', padding: '10px 14px',
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text)',
            fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
            outline: 'none', boxSizing: 'border-box',
          }}
          autoFocus
        />

        {error && (
          <p style={{ color: 'var(--accent3)', fontSize: '0.82rem', margin: '8px 0 0' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '8px 20px',
              color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || !email.trim()}
            style={{
              background: '#9d87ff', border: 'none',
              borderRadius: 'var(--radius-sm)', padding: '8px 20px',
              color: '#fff', fontSize: '0.85rem', fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              opacity: loading || !email.trim() ? 0.5 : 1,
            }}
          >
            {loading ? 'Sending...' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───── View List Modal ───── */

function ViewListModal({ userName, roster, loading, tierBadge, onClose }: {
  userName: string
  roster: RosterInterpreter[]
  loading: boolean
  tierBadge: Record<string, { label: string; bg: string; border: string; color: string }>
  onClose: () => void
}) {
  const focusTrapRef = useFocusTrap(true)

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const preferred = roster.filter(r => r.tier === 'preferred')
  const approved = roster.filter(r => r.tier === 'approved')
  const dnb = roster.filter(r => r.tier === 'dnb')

  function renderTierSection(title: string, tierKey: string, items: RosterInterpreter[]) {
    if (items.length === 0) return null
    const badge = tierBadge[tierKey]
    return (
      <div style={{ marginBottom: 24 }}>
        <h3 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px',
          margin: '0 0 10px', color: '#f0f2f8',
        }}>
          {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: item.notes ? 8 : 0 }}>
                <Link href={`/directory/${item.interpreter_id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt=""
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: item.color || 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.7rem', color: '#fff',
                    }}>
                      {item.initials}
                    </div>
                  )}
                </Link>
                <div style={{ flex: 1 }}>
                  <Link href={`/directory/${item.interpreter_id}`} style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none' }}
                  >{item.name}</Link>
                  {badge && (
                    <span style={{
                      marginLeft: 8,
                      fontSize: '0.7rem', fontWeight: 600,
                      padding: '2px 8px', borderRadius: 6,
                      background: badge.bg, border: `1px solid ${badge.border}`,
                      color: badge.color,
                    }}>
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>
              {(item.certs || item.domains) && (
                <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '4px 0 0', paddingLeft: 42 }}>
                  {[item.certs, item.domains].filter(Boolean).join(' · ')}
                </p>
              )}
              {item.notes && (
                <p style={{
                  color: 'var(--muted)', fontSize: '0.82rem', margin: '6px 0 0',
                  paddingLeft: 42, fontStyle: 'italic', lineHeight: 1.5,
                }}>
                  &ldquo;{item.notes}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClose}
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '60px 20px', overflowY: 'auto',
      }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${userName}'s interpreter list`}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          width: '100%', maxWidth: 560,
          padding: '28px 32px',
          maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px',
            margin: 0, color: '#f0f2f8',
          }}>
            {userName}&apos;s interpreter list
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              fontSize: '1.2rem', cursor: 'pointer', padding: 4,
              minWidth: 44, minHeight: 44, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            &#10005;
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading...</p>
        ) : roster.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
            {userName} hasn&apos;t added any interpreters to their list yet.
          </p>
        ) : (
          <>
            {renderTierSection('Preferred', 'preferred', preferred)}
            {renderTierSection('Secondary Tier', 'approved', approved)}
            {renderTierSection('Do Not Book', 'dnb', dnb)}
          </>
        )}
      </div>
    </div>
  )
}
