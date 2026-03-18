'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'

/* ── Types ── */

interface RequesterConnection {
  id: string
  requester_id: string
  status: 'active' | 'pending' | 'pending_offplatform'
  initiated_by: string
  requester_org_name: string | null
  offplatform_name: string | null
  offplatform_email: string | null
  created_at: string
  confirmed_at: string | null
  // Joined from requester_profiles
  requester_name: string | null
  org_name: string | null
  org_type: string | null
}

/* ── Helpers ── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDisplayOrg(conn: RequesterConnection): string {
  return conn.org_name || conn.requester_org_name || conn.requester_name || conn.offplatform_name || 'Unknown'
}

function getDisplayName(conn: RequesterConnection): string {
  return conn.requester_name || conn.offplatform_name || 'Unknown'
}

/* ── Styles ── */

const cardStyle: React.CSSProperties = {
  background: '#111118',
  border: '1px solid #1e2433',
  borderRadius: 'var(--radius)',
  padding: '20px 24px',
  transition: 'border-color 0.15s',
}

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#9d87ff',
  marginBottom: 12,
}

const btnBase: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.78rem',
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  border: 'none',
  transition: 'opacity 0.15s',
}

/* ── Main Component ── */

export default function MyRequestersPage() {
  const [connections, setConnections] = useState<RequesterConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingRevoke, setConfirmingRevoke] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchConnections = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Get deaf profile id
    const { data: profile } = await supabase
      .from('deaf_profiles')
      .select('id')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle()

    if (!profile) { setLoading(false); return }

    // Fetch connections
    const { data: conns, error } = await supabase
      .from('dhh_requester_connections')
      .select('id, requester_id, status, initiated_by, requester_org_name, offplatform_name, offplatform_email, created_at, confirmed_at')
      .eq('dhh_user_id', profile.id)
      .in('status', ['active', 'pending', 'pending_offplatform'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[my-requesters] fetch error:', error)
      setLoading(false)
      return
    }

    if (!conns || conns.length === 0) {
      setConnections([])
      setLoading(false)
      return
    }

    // Fetch requester profiles for on-platform connections
    const requesterIds = conns
      .filter(c => c.requester_id)
      .map(c => c.requester_id)

    let profilesMap: Record<string, { name: string | null; org_name: string | null; org_type: string | null }> = {}

    if (requesterIds.length > 0) {
      const { data: profiles } = await supabase
        .from('requester_profiles')
        .select('id, name, org_name, org_type')
        .in('id', requesterIds)

      if (profiles) {
        for (const p of profiles) {
          profilesMap[p.id] = { name: p.name, org_name: p.org_name, org_type: p.org_type }
        }
      }
    }

    // Merge
    const merged: RequesterConnection[] = conns.map(c => ({
      ...c,
      requester_name: profilesMap[c.requester_id]?.name ?? null,
      org_name: profilesMap[c.requester_id]?.org_name ?? null,
      org_type: profilesMap[c.requester_id]?.org_type ?? null,
    }))

    setConnections(merged)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  async function handleApprove(connId: string) {
    setActionLoading(connId)
    const supabase = createClient()
    const { error } = await supabase
      .from('dhh_requester_connections')
      .update({ status: 'active', confirmed_at: new Date().toISOString() })
      .eq('id', connId)

    if (error) {
      console.error('[my-requesters] approve error:', error)
    } else {
      setConnections(prev => prev.map(c =>
        c.id === connId ? { ...c, status: 'active' as const, confirmed_at: new Date().toISOString() } : c
      ))
    }
    setActionLoading(null)
  }

  async function handleRevoke(connId: string) {
    setActionLoading(connId)
    const supabase = createClient()
    const { error } = await supabase
      .from('dhh_requester_connections')
      .update({ status: 'revoked', revoked_at: new Date().toISOString() })
      .eq('id', connId)

    if (error) {
      console.error('[my-requesters] revoke error:', error)
    } else {
      setConnections(prev => prev.filter(c => c.id !== connId))
    }
    setConfirmingRevoke(null)
    setActionLoading(null)
  }

  async function handleDecline(connId: string) {
    setActionLoading(connId)
    const supabase = createClient()
    const { error } = await supabase
      .from('dhh_requester_connections')
      .update({ status: 'revoked', revoked_at: new Date().toISOString() })
      .eq('id', connId)

    if (error) {
      console.error('[my-requesters] decline error:', error)
    } else {
      setConnections(prev => prev.filter(c => c.id !== connId))
    }
    setActionLoading(null)
  }

  const activeConns = connections.filter(c => c.status === 'active')
  const pendingConns = connections.filter(c => c.status === 'pending' || c.status === 'pending_offplatform')

  if (loading) {
    return (
      <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
        <PageHeader title="My Requesters" subtitle="Coordinators and organizations who book interpreters for you." />
        <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <PageHeader title="My Requesters" subtitle="Coordinators and organizations who book interpreters for you." />

      {connections.length === 0 ? (
        <div style={{
          ...cardStyle,
          padding: '40px 32px',
          textAlign: 'center',
        }}>
          <div style={{
            color: 'var(--muted)',
            fontSize: '0.92rem',
            lineHeight: 1.6,
            maxWidth: 440,
            margin: '0 auto',
          }}>
            <p style={{ margin: '0 0 16px' }}>
              No connections yet. Share your Interpreter Request Link to connect with coordinators who book interpreters for you.
            </p>
            <Link
              href="/dhh/dashboard/preferences"
              className="btn-primary"
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                padding: '10px 24px',
                fontSize: '0.88rem',
              }}
            >
              Go to My Request Link
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Pending Connections */}
          {pendingConns.length > 0 && (
            <div>
              <div style={sectionLabelStyle}>Pending Connections</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingConns.map(conn => {
                  const orgDisplay = getDisplayOrg(conn)
                  const isProcessing = actionLoading === conn.id

                  return (
                    <div key={conn.id} style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: 'var(--text)',
                            marginBottom: 4,
                          }}>
                            {orgDisplay}
                          </div>
                          {conn.org_type && (
                            <div style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: '0.78rem',
                              color: 'var(--muted)',
                              marginBottom: 6,
                            }}>
                              {conn.org_type}
                            </div>
                          )}
                          <div style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.82rem',
                            color: '#ffa500',
                          }}>
                            Wants to request interpreters for you
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                          <button
                            onClick={() => handleApprove(conn.id)}
                            disabled={isProcessing}
                            style={{
                              ...btnBase,
                              background: 'rgba(157,135,255,0.15)',
                              color: '#9d87ff',
                              opacity: isProcessing ? 0.5 : 1,
                            }}
                          >
                            {isProcessing ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleDecline(conn.id)}
                            disabled={isProcessing}
                            style={{
                              ...btnBase,
                              background: 'rgba(255,107,133,0.1)',
                              color: '#ff8099',
                              opacity: isProcessing ? 0.5 : 1,
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Active Connections */}
          {activeConns.length > 0 && (
            <div>
              <div style={sectionLabelStyle}>Active Connections</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeConns.map(conn => {
                  const orgDisplay = getDisplayOrg(conn)
                  const nameDisplay = getDisplayName(conn)
                  const isConfirming = confirmingRevoke === conn.id
                  const isProcessing = actionLoading === conn.id

                  return (
                    <div key={conn.id} style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: 'var(--text)',
                            marginBottom: 4,
                          }}>
                            {orgDisplay}
                          </div>
                          {conn.org_type && (
                            <div style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: '0.78rem',
                              color: 'var(--muted)',
                              marginBottom: 4,
                            }}>
                              {conn.org_type}
                            </div>
                          )}
                          {conn.org_name && conn.requester_name && conn.requester_name !== conn.org_name && (
                            <div style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: '0.78rem',
                              color: 'var(--muted)',
                              marginBottom: 4,
                            }}>
                              Contact: {nameDisplay}
                            </div>
                          )}
                          <div style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.78rem',
                            color: 'var(--muted)',
                          }}>
                            Connected since {conn.confirmed_at ? formatDate(conn.confirmed_at) : formatDate(conn.created_at)}
                          </div>
                        </div>

                        <div style={{ flexShrink: 0 }}>
                          {isConfirming ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                              <div style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '0.76rem',
                                color: '#ff8099',
                                maxWidth: 260,
                                textAlign: 'right',
                                lineHeight: 1.4,
                                marginBottom: 4,
                              }}>
                                Are you sure? {orgDisplay} will no longer see your interpreter preferences.
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => handleRevoke(conn.id)}
                                  disabled={isProcessing}
                                  style={{
                                    ...btnBase,
                                    background: 'rgba(255,107,133,0.15)',
                                    color: '#ff8099',
                                    opacity: isProcessing ? 0.5 : 1,
                                  }}
                                >
                                  {isProcessing ? 'Revoking...' : 'Yes, Revoke'}
                                </button>
                                <button
                                  onClick={() => setConfirmingRevoke(null)}
                                  style={{
                                    ...btnBase,
                                    background: 'rgba(255,255,255,0.06)',
                                    color: 'var(--muted)',
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingRevoke(conn.id)}
                              style={{
                                ...btnBase,
                                background: 'rgba(255,255,255,0.04)',
                                color: 'var(--muted)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              Revoke Access
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <DashMobileStyles />
    </div>
  )
}
