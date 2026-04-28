'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

type RosterEntry = {
  interpreter_id: string
  name: string
  first_name: string
  last_name: string
  photo_url: string | null
  sign_languages: string[]
  specializations: string[]
  roster_notes: string | null
  approve_work: boolean
  approve_personal: boolean
}

type ClientData = {
  connectionId: string
  dhhUserId: string | null
  clientName: string
  clientPhoto: string | null
  connectionDate: string
  isOffPlatform: boolean
  offplatformEmail: string | null
  preferred: RosterEntry[]
  approved: RosterEntry[]
  expanded: boolean
}

// ── Interpreter Row ───────────────────────────────────────────────────────────

function InterpreterRow({ entry }: { entry: RosterEntry }) {
  const fullName = entry.first_name
    ? `${entry.first_name} ${entry.last_name || ''}`.trim()
    : entry.name || 'Unknown'
  const initials = `${(entry.first_name?.[0] || '').toUpperCase()}${(entry.last_name?.[0] || '').toUpperCase()}` || 'U'
  const languages = (entry.sign_languages || []) as string[]

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 18px', background: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 10,
    }}>
      {/* Avatar */}
      <Link href={`/directory/${entry.interpreter_id}?context=requester`} style={{ flexShrink: 0, textDecoration: 'none' }}>
        {entry.photo_url ? (
          <img src={entry.photo_url} alt={fullName} style={{
            width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
            border: '2px solid var(--accent)',
          }} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7b61ff, #00e5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.82rem', color: '#fff',
          }}>
            {initials}
          </div>
        )}
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/directory/${entry.interpreter_id}?context=requester`}
          style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text)' }}
        >
          {fullName}
        </Link>

        {/* Languages */}
        {languages.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
            {languages.map(lang => (
              <span key={lang} style={{
                padding: '1px 8px', borderRadius: 16,
                border: '1px solid rgba(0,229,255,0.25)',
                color: 'var(--accent)', fontSize: '0.68rem', fontWeight: 600,
              }}>
                {lang}
              </span>
            ))}
          </div>
        )}

        {/* Approval badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {entry.approve_work && (
            <span style={{
              padding: '2px 10px', borderRadius: 16,
              background: 'rgba(0,229,255,0.08)', color: 'var(--accent)',
              fontSize: '0.7rem', fontWeight: 600,
            }}>
              Approved for: Work
            </span>
          )}
          {entry.approve_personal && (
            <span style={{
              padding: '2px 10px', borderRadius: 16,
              background: 'rgba(157,135,255,0.1)', color: '#a78bfa',
              fontSize: '0.7rem', fontWeight: 600,
            }}>
              Approved for: Personal/Medical
            </span>
          )}
        </div>

        {/* Client's note */}
        {entry.roster_notes && (
          <div style={{
            fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic',
            marginTop: 6, lineHeight: 1.4,
          }}>
            &ldquo;{entry.roster_notes}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}

// ── Client Card ───────────────────────────────────────────────────────────────

function ClientCard({ client, onToggle }: { client: ClientData; onToggle: () => void }) {
  const prefCount = client.preferred.length
  const appCount = client.approved.length
  const total = prefCount + appCount

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
    }}>
      {/* Card header */}
      <div
        onClick={onToggle}
        style={{
          padding: '20px 24px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 16,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.02)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        {/* Client avatar */}
        {client.clientPhoto ? (
          <img src={client.clientPhoto} alt={client.clientName} style={{
            width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
            border: '2px solid var(--accent2)',
            flexShrink: 0,
          }} />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', color: '#fff',
            flexShrink: 0,
          }}>
            {client.clientName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{client.clientName}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 2 }}>
            {client.isOffPlatform && (
              <span style={{ color: '#96a0b8', marginRight: 8 }}>Off-platform contact</span>
            )}
            Connected {new Date(client.connectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 4 }}>
            {total > 0
              ? <>{prefCount} Preferred &middot; {appCount} Approved</>
              : client.isOffPlatform
                ? 'Off-platform contact'
                : 'No interpreters shared yet'
            }
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 12,
            background: 'rgba(0,229,255,0.1)', color: 'var(--accent)',
            fontSize: '0.72rem', fontWeight: 600,
          }}>
            {total} interpreter{total !== 1 ? 's' : ''}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 16 16" fill="none"
            style={{ transform: client.expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
          >
            <path d="M4 6l4 4 4-4" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {client.expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px' }}>
          {/* Preferred */}
          {client.preferred.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                color: '#00e5ff', marginBottom: 10,
              }}>
                Preferred ({client.preferred.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {client.preferred.map(entry => (
                  <InterpreterRow key={entry.interpreter_id} entry={entry} />
                ))}
              </div>
            </div>
          )}

          {/* Approved */}
          {client.approved.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                color: '#00e5ff', marginBottom: 10,
              }}>
                Approved ({client.approved.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {client.approved.map(entry => (
                  <InterpreterRow key={entry.interpreter_id} entry={entry} />
                ))}
              </div>
            </div>
          )}

          {client.preferred.length === 0 && client.approved.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: '0 0 16px' }}>
              {client.isOffPlatform
                ? 'This contact is not on signpost yet. Once they join, they can share their preferred interpreter list with you.'
                : 'This client has not yet shared interpreters with you. They can update their list from their Trusted Circle.'}
            </p>
          )}

          {/* Find interpreter button */}
          <Link
            href={`/directory?context=requester`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
              color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.15s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
          >
            Find an interpreter for {client.clientName.split(' ')[0]} &#8594;
          </Link>
        </div>
      )}

    </div>
  )
}

// ── Lookup Result Types ──────────────────────────────────────────────────────

type LookupResult =
  | { status: 'list_available'; userId: string; displayName: string; interpreters: LookupInterpreter[] }
  | { status: 'approval_pending'; userId: string; displayName: string }
  | { status: 'not_on_signpost'; userId: null }
  | null

type LookupInterpreter = {
  id: string
  name: string
  certifications: string[]
  specializations: string[]
  tier: string
  avatar_url: string | null
  avatar_color: string | null
  is_dnb: boolean
}

// ── Connection Row ───────────────────────────────────────────────────────────

type ConnectionRow = {
  id: string
  dhhUserId: string | null
  clientName: string
  status: 'active' | 'pending'
  createdAt: string
}

// ── Request List Section ─────────────────────────────────────────────────────

function RequestListSection({ onListUpdated }: { onListUpdated: () => void }) {
  const [identifier, setIdentifier] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState<LookupResult>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  async function handleLookup() {
    if (!identifier.trim()) return
    setLookupLoading(true)
    setLookupResult(null)

    try {
      const res = await fetch('/api/request/deaf-list-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deafUserIdentifier: identifier.trim() }),
      })

      if (!res.ok) {
        setToast({ message: 'Something went wrong. Please try again.', type: 'error' })
        setLookupLoading(false)
        return
      }

      const data = await res.json()
      setLookupResult(data as LookupResult)

      if (data.status === 'list_available' || data.status === 'approval_pending') {
        onListUpdated()
      }
    } catch {
      setToast({ message: 'Network error. Please try again.', type: 'error' })
    }

    setLookupLoading(false)
  }

  async function handleSendInvite() {
    setToast({ message: 'Invite feature coming soon.', type: 'success' })
  }

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: 32,
    }}>
      <div style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 600,
        fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        color: '#00e5ff', marginBottom: 14,
      }}>
        Request a client&apos;s preferred list
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 16px', lineHeight: 1.5 }}>
        Enter a Deaf client&apos;s email or phone number to request access to their preferred interpreter list.
      </p>

      <div className="cl-lookup-row" style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          value={identifier}
          onChange={e => { setIdentifier(e.target.value); setLookupResult(null) }}
          placeholder="Email or phone number"
          onKeyDown={e => { if (e.key === 'Enter') handleLookup() }}
          style={{
            flex: 1, padding: '11px 14px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text)',
            fontSize: '15px', outline: 'none',
            fontFamily: "'Inter', sans-serif",
          }}
        />
        <button
          onClick={handleLookup}
          disabled={lookupLoading || !identifier.trim()}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-sm)',
            background: '#00e5ff', border: 'none',
            color: '#0a0a0f', fontSize: '14.5px', fontWeight: 600,
            cursor: lookupLoading || !identifier.trim() ? 'not-allowed' : 'pointer',
            opacity: lookupLoading || !identifier.trim() ? 0.5 : 1,
            transition: 'opacity 0.15s', whiteSpace: 'nowrap',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {lookupLoading ? 'Looking up...' : 'Request list access'}
        </button>
      </div>

      {/* Result states */}
      {lookupResult?.status === 'list_available' && (
        <div style={{
          padding: '16px 20px', borderRadius: 10,
          background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent)', marginBottom: 6 }}>
            {lookupResult.displayName}&apos;s preferred interpreter list has been shared with you.
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
            Their interpreters are now visible below. You can reference this list when booking interpreters on their behalf.
          </p>
          {lookupResult.interpreters.filter(i => !i.is_dnb).length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {lookupResult.interpreters.filter(i => !i.is_dnb).map(interp => (
                <div key={interp.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px', borderRadius: 8,
                  background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)',
                }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12,
                    background: interp.tier === 'preferred' ? 'rgba(167,139,250,0.15)' : 'rgba(0,229,255,0.1)',
                    color: interp.tier === 'preferred' ? '#a78bfa' : 'var(--accent)',
                    fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                  }}>
                    {interp.tier === 'preferred' ? 'Preferred' : 'Approved'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{interp.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {lookupResult?.status === 'approval_pending' && (
        <div style={{
          padding: '16px 20px', borderRadius: 10,
          background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.2)',
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f5a623', marginBottom: 6 }}>
            Approval request sent to {lookupResult.displayName}.
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
            We have sent {lookupResult.displayName} a request to share their preferred interpreter list. You will be notified when they respond.
          </p>
        </div>
      )}

      {lookupResult?.status === 'not_on_signpost' && (
        <div style={{
          padding: '16px 20px', borderRadius: 10,
          background: 'rgba(200,207,224,0.04)', border: '1px solid rgba(200,207,224,0.15)',
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 6 }}>
            This person does not have a signpost account yet.
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0 0 12px' }}>
            You can invite them to create one so they can build their preferred interpreter list.
          </p>
          <button
            onClick={handleSendInvite}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid rgba(0,229,255,0.3)',
              color: 'var(--accent)', fontSize: '13.5px', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            Send invite
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'success' ? 'rgba(0,229,255,0.15)' : 'rgba(255,107,133,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(0,229,255,0.3)' : 'rgba(255,107,133,0.3)'}`,
          color: toast.type === 'success' ? 'var(--accent)' : 'var(--accent3)',
          fontSize: '0.85rem', fontWeight: 500,
        }}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

// ── Connections List ─────────────────────────────────────────────────────────

function ConnectionsList({ connections }: { connections: ConnectionRow[] }) {
  if (connections.length === 0) return null

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 600,
        fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        color: '#00e5ff', marginBottom: 14,
      }}>
        All Connections
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {connections.map(conn => (
          <div key={conn.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', background: 'var(--card-bg)',
            border: '1px solid var(--border)', borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.7rem', color: '#fff', flexShrink: 0,
              }}>
                {conn.clientName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
                  {conn.clientName}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 1 }}>
                  Connected {new Date(conn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
            {conn.status === 'active' ? (
              <span style={{
                padding: '3px 10px', borderRadius: 12,
                background: 'rgba(0,229,255,0.1)', color: 'var(--accent)',
                fontSize: '0.72rem', fontWeight: 600,
              }}>
                View list
              </span>
            ) : (
              <span style={{
                padding: '3px 10px', borderRadius: 12,
                background: 'rgba(245,166,35,0.1)', color: '#f5a623',
                fontSize: '0.72rem', fontWeight: 600,
              }}>
                Pending approval
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ClientListsClient() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [connections, setConnections] = useState<ConnectionRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Fetch all connections (active + pending) for the connections list
    const { data: allConnections } = await supabase
      .from('dhh_requester_connections')
      .select('id, dhh_user_id, status, created_at, confirmed_at, offplatform_name, offplatform_email')
      .eq('requester_id', user.id)
      .in('status', ['active', 'pending'])
      .order('confirmed_at', { ascending: false, nullsFirst: false })

    // Build connections list with names
    const connRows: ConnectionRow[] = []
    if (allConnections) {
      for (const conn of allConnections) {
        let clientName = conn.offplatform_name || 'Client'
        if (conn.dhh_user_id) {
          const { data: dp } = await supabase
            .from('deaf_profiles')
            .select('first_name, last_name')
            .eq('id', conn.dhh_user_id)
            .maybeSingle()
          if (dp) clientName = `${dp.first_name || ''} ${dp.last_name || ''}`.trim() || 'Client'
        }
        connRows.push({
          id: conn.id,
          dhhUserId: conn.dhh_user_id,
          clientName,
          status: conn.status as 'active' | 'pending',
          createdAt: conn.confirmed_at || conn.created_at,
        })
      }
    }
    setConnections(connRows)

    // Fetch active connections' rosters for full client cards
    const activeConns = (allConnections || []).filter(c => c.status === 'active')
    const clientDataArr: ClientData[] = []

    for (const conn of activeConns) {
      const isOffPlatform = !conn.dhh_user_id

      // Off-platform connections: no roster to fetch
      if (isOffPlatform) {
        clientDataArr.push({
          connectionId: conn.id,
          dhhUserId: null,
          clientName: conn.offplatform_name || 'Off-platform contact',
          clientPhoto: null,
          connectionDate: conn.confirmed_at || conn.created_at,
          isOffPlatform: true,
          offplatformEmail: conn.offplatform_email || null,
          preferred: [],
          approved: [],
          expanded: false,
        })
        continue
      }

      try {
        // Fetch deaf profile for display name + photo
        const { data: deafProfile } = await supabase
          .from('deaf_profiles')
          .select('name, first_name, last_name, photo_url')
          .eq('id', conn.dhh_user_id)
          .maybeSingle()

        const fullClientName = deafProfile
          ? (`${deafProfile.first_name || ''} ${deafProfile.last_name || ''}`.trim() || deafProfile.name || 'Client')
          : 'Client'

        // Fetch roster via preferences API (service role required for deaf_roster RLS)
        const res = await fetch(`/api/connections/preferences?dhh_user_id=${conn.dhh_user_id}`)
        if (!res.ok) {
          // Connection exists but roster fetch failed; show client with empty roster
          clientDataArr.push({
            connectionId: conn.id,
            dhhUserId: conn.dhh_user_id,
            clientName: fullClientName,
            clientPhoto: deafProfile?.photo_url || null,
            connectionDate: conn.confirmed_at || conn.created_at,
            isOffPlatform: false,
            offplatformEmail: null,
            preferred: [],
            approved: [],
            expanded: false,
          })
          continue
        }

        const data = await res.json()

        // Filter to approve_work=true only (requester context is always work)
        const filterWork = (entries: RosterEntry[]) =>
          entries.filter((e: RosterEntry) => e.approve_work)

        // Sort within each tier by first_name
        const sortByName = (entries: RosterEntry[]) =>
          entries.sort((a, b) => (a.first_name || a.name || '').localeCompare(b.first_name || b.name || ''))

        clientDataArr.push({
          connectionId: conn.id,
          dhhUserId: conn.dhh_user_id,
          clientName: fullClientName,
          clientPhoto: deafProfile?.photo_url || null,
          connectionDate: conn.confirmed_at || conn.created_at,
          isOffPlatform: false,
          offplatformEmail: null,
          preferred: sortByName(filterWork(data.preferred || [])),
          approved: sortByName(filterWork(data.approved || [])),
          expanded: false,
        })
      } catch (err) {
        console.error('[client-lists] fetch error for', conn.dhh_user_id, err)
      }
    }

    setClients(clientDataArr)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleExpand(idx: number) {
    setClients(prev => prev.map((c, i) => i === idx ? { ...c, expanded: !c.expanded } : c))
  }

  if (loading) {
    return (
      <div className="dash-page-content" style={{ padding: '48px 56px', color: 'var(--muted)', fontSize: '0.88rem' }}>
        Loading client interpreter lists...
      </div>
    )
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: '27px', color: '#f0f2f8', margin: '0 0 6px' }}>
          Client Interpreter Lists
        </h1>
        <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', margin: 0 }}>
          View your connected Deaf clients&apos; preferred interpreter lists. These are shared with you so you can book the right interpreters.
        </p>
      </div>

      {/* Request list access section */}
      <RequestListSection onListUpdated={() => fetchData()} />

      {/* Connections list */}
      <ConnectionsList connections={connections} />

      {/* Shared client lists */}
      {clients.length > 0 && (
        <>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 600,
            fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
            color: '#00e5ff', marginBottom: 14,
          }}>
            Shared Interpreter Lists
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {clients.map((client, idx) => (
              <ClientCard
                key={client.connectionId}
                client={client}
                onToggle={() => toggleExpand(idx)}
              />
            ))}
          </div>
        </>
      )}

      {clients.length === 0 && connections.filter(c => c.status === 'active').length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px 24px',
          background: 'var(--surface)', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: 460, margin: '0 auto' }}>
            No clients connected yet. Once a Deaf client adds you as a requester, you&apos;ll see their shared interpreter list here.
          </p>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
          .cl-lookup-row { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .dash-page-content { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}
