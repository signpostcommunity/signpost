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

type DnbEntry = {
  interpreter_id: string
  name: string
  first_name: string
  last_name: string
  photo_url: string | null
}

type ClientData = {
  connectionId: string
  dhhUserId: string
  clientName: string
  clientPhoto: string | null
  connectionDate: string
  preferred: RosterEntry[]
  secondary: RosterEntry[]
  doNotBook: DnbEntry[]
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
  const secCount = client.secondary.length
  const dnbCount = client.doNotBook.length
  const total = prefCount + secCount

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
            Connected {new Date(client.connectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 4 }}>
            {prefCount} Preferred &middot; {secCount} Secondary
            {dnbCount > 0 && <span style={{ color: '#ff8099' }}> &middot; {dnbCount} Do Not Book</span>}
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

          {/* Secondary */}
          {client.secondary.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                color: '#00e5ff', marginBottom: 10,
              }}>
                Secondary Tier ({client.secondary.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {client.secondary.map(entry => (
                  <InterpreterRow key={entry.interpreter_id} entry={entry} />
                ))}
              </div>
            </div>
          )}

          {client.preferred.length === 0 && client.secondary.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: '0 0 16px' }}>
              This client hasn&apos;t added any interpreters to their list yet.
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
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
          >
            Find an interpreter for {client.clientName.split(' ')[0]} &#8594;
          </Link>
        </div>
      )}

      {/* Do Not Book section — always visible when there are entries */}
      {client.doNotBook.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255,107,133,0.2)',
          padding: '16px 24px',
          background: 'rgba(255,107,133,0.03)',
        }}>
          <div style={{
            fontWeight: 600,
            fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
            color: '#ff8099', marginBottom: 8,
          }}>
            Do Not Book ({client.doNotBook.length})
          </div>
          <p style={{
            color: 'var(--muted)', fontSize: '0.78rem', margin: '0 0 10px',
            lineHeight: 1.5,
          }}>
            These interpreters should not be booked for {client.clientName.split(' ')[0]}.
            This list was shared with you in confidence.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {client.doNotBook.map(entry => {
              const fullName = entry.first_name
                ? `${entry.first_name} ${entry.last_name || ''}`.trim()
                : entry.name || 'Unknown'
              return (
                <div key={entry.interpreter_id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px', borderRadius: 8,
                  background: 'rgba(255,107,133,0.05)',
                  border: '1px solid rgba(255,107,133,0.15)',
                }}>
                  <span style={{ color: '#ff8099', fontSize: '0.82rem', fontWeight: 500 }}>
                    {fullName}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ClientListsClient() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Step 1: Fetch active connections
    const { data: connections, error: connErr } = await supabase
      .from('dhh_requester_connections')
      .select('id, dhh_user_id, created_at, confirmed_at')
      .eq('requester_id', user.id)
      .eq('status', 'active')

    if (connErr || !connections || connections.length === 0) {
      if (connErr) console.error('[client-lists] connections error:', connErr.message)
      setClients([])
      setLoading(false)
      return
    }

    // Step 2: Fetch each client's roster via the preferences API (uses service role)
    const clientDataArr: ClientData[] = []

    for (const conn of connections) {
      if (!conn.dhh_user_id) continue

      try {
        const res = await fetch(`/api/connections/preferences?dhh_user_id=${conn.dhh_user_id}`)
        if (!res.ok) continue

        const data = await res.json()
        const dhhUser = data.dhh_user as { name?: string; first_name?: string } | null

        const clientName = dhhUser?.first_name
          ? dhhUser.first_name
          : dhhUser?.name || 'Client'

        // Fetch client's photo separately (API doesn't include it)
        const { data: deafProfile } = await supabase
          .from('deaf_profiles')
          .select('first_name, last_name, photo_url')
          .eq('id', conn.dhh_user_id)
          .maybeSingle()

        const fullClientName = deafProfile
          ? `${deafProfile.first_name || ''} ${deafProfile.last_name || ''}`.trim() || clientName
          : clientName

        clientDataArr.push({
          connectionId: conn.id,
          dhhUserId: conn.dhh_user_id,
          clientName: fullClientName,
          clientPhoto: deafProfile?.photo_url || null,
          connectionDate: conn.confirmed_at || conn.created_at,
          preferred: (data.preferred || []).filter((e: RosterEntry) => e.approve_work || e.approve_personal),
          secondary: (data.approved || []).filter((e: RosterEntry) => e.approve_work || e.approve_personal),
          doNotBook: data.do_not_book || [],
          expanded: false,
        })
      } catch (err) {
        console.error('[client-lists] fetch error for', conn.dhh_user_id, err)
      }
    }

    setClients(clientDataArr)
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

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
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: '27px', color: '#f0f2f8', margin: '0 0 6px' }}>
          Client Interpreter Lists
        </h1>
        <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', margin: 0 }}>
          View your connected Deaf clients&apos; preferred interpreter lists. These are shared with you so you can book the right interpreters.
        </p>
      </div>

      {clients.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'var(--surface)', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 10 }}>
            No Deaf clients have shared their interpreter lists with you yet.
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: 460, margin: '0 auto 20px' }}>
            When a Deaf client connects with your organization on signpost, their preferred interpreter list will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {clients.map((client, idx) => (
            <ClientCard
              key={client.connectionId}
              client={client}
              onToggle={() => toggleExpand(idx)}
            />
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  )
}
