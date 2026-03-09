'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BetaBanner, PageHeader, SectionLabel, StatusBadge, DemoBadge, GhostButton, Avatar, DashMobileStyles } from '@/components/dashboard/interpreter/shared'

/* ── Types ── */

interface Booking {
  id: string
  title: string | null
  requester_name: string | null
  specialization: string | null
  date: string
  time_start: string
  time_end: string
  location: string | null
  format: string | null
  recurrence: string | null
  notes: string | null
  status: string
  is_seed: boolean | null
  cancellation_reason: string | null
  sub_search_initiated: boolean | null
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  email: string
  member_interpreter_id: string | null
  photo_url: string | null
  avatar_color: string | null
}

/* ── Helpers ── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(start: string, end: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

function parseDateTimeFromBooking(dateStr: string, timeStart: string, timeEnd: string): { start: Date; end: Date } {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [sh, sm] = timeStart.split(':').map(Number)
  const [eh, em] = timeEnd.split(':').map(Number)
  return { start: new Date(y, mo - 1, d, sh, sm), end: new Date(y, mo - 1, d, eh, em) }
}

function toGoogleDateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`
}

function toISOLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`
}

/* ── Styles ── */

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 20,
}

const modalStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '28px 32px',
  width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
}

/* ── Cancel Modal (2-step) ── */

const CANCEL_REASONS = ['Illness', 'Transportation or logistics issue', 'Scheduling conflict / double booking', 'Other reason'] as const

function CancelModal({ booking, onClose, onCancelled }: {
  booking: Booking
  onClose: () => void
  onCancelled: (subSearch: boolean) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState<string | null>(null)
  const [otherText, setOtherText] = useState('')
  const [subOption, setSubOption] = useState<'help' | 'skip' | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!reason || !subOption) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const finalReason = reason === 'Other reason' && otherText.trim()
      ? otherText.trim()
      : reason

    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: finalReason,
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
        sub_search_initiated: subOption === 'help',
      })
      .eq('id', booking.id)

    // TODO: Send notification to requester — email + in-app inbox message
    // TODO: If sub_search_initiated, send requester approval prompt
    // TODO: If D/HH consumer is linked to booking, send them a status update

    if (error) {
      console.error('[confirmed] cancel failed:', error.message)
      setSaving(false)
      return
    }

    onCancelled(subOption === 'help')
  }

  const cardStyle = (selected: boolean): React.CSSProperties => ({
    background: selected ? 'rgba(0,229,255,0.06)' : 'var(--surface2)',
    border: `1.5px solid ${selected ? 'rgba(0,229,255,0.5)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-sm)', padding: '16px 18px',
    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
  })

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>

        {/* Step 1: Reason */}
        {step === 1 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.05rem' }}>Cancel this booking</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              Let the requester know why so they can find coverage.
            </p>

            {/* Booking summary */}
            <div style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 20,
              fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{booking.title || 'Booking'}</div>
              <div>{booking.requester_name || 'Requester'} · {formatDate(booking.date)} · {formatTime(booking.time_start, booking.time_end)}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {CANCEL_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  style={{
                    background: reason === r ? 'rgba(255,107,133,0.08)' : 'var(--surface2)',
                    border: `1px solid ${reason === r ? 'rgba(255,107,133,0.4)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                    color: reason === r ? '#ff6b85' : 'var(--text)',
                    fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === 'Other reason' && (
              <div style={{ marginBottom: 24, marginTop: -16 }}>
                <textarea
                  placeholder="Please describe your reason..."
                  value={otherText} onChange={e => setOtherText(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                    color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
                    outline: 'none', resize: 'vertical', minHeight: 70,
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />
              </div>
            )}

            <div className="dash-card-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <GhostButton onClick={onClose}>Nevermind, keep this booking</GhostButton>
              <button
                onClick={() => setStep(2)}
                disabled={!reason || (reason === 'Other reason' && !otherText.trim())}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '8px 18px',
                  color: 'var(--text)', fontSize: '0.82rem', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                  opacity: reason && !(reason === 'Other reason' && !otherText.trim()) ? 1 : 0.4,
                  pointerEvents: reason && !(reason === 'Other reason' && !otherText.trim()) ? 'auto' : 'none',
                }}
              >
                Next &rarr;
              </button>
            </div>
          </>
        )}

        {/* Step 2: Sub search offer */}
        {step === 2 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.05rem' }}>Help find a replacement?</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 8px' }}>
              Optional, but it could make all the difference.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 22px' }}>
              Cancelling a booking can cause incredible disruption for the D/HH consumer and the organization. Offering to help the requester find a replacement is optional, but highly recommended. A little help goes a long way.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div onClick={() => setSubOption('help')} style={cardStyle(subOption === 'help')}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: subOption === 'help' ? 'var(--accent)' : 'var(--text)', marginBottom: 6 }}>
                  Offer to check with my Preferred Team Interpreters
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                  The requester will be notified of your cancellation and asked if they&apos;d like you to forward this request to your trusted team. If they approve, you&apos;ll select who to contact.
                </div>
              </div>

              <div onClick={() => setSubOption('skip')} style={cardStyle(subOption === 'skip')}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: subOption === 'skip' ? 'var(--accent)' : 'var(--text)', marginBottom: 6 }}>
                  Skip &mdash; just cancel
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                  The requester will still be notified with your reason, but no sub search will be initiated.
                </div>
              </div>
            </div>

            <div className="dash-card-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <GhostButton onClick={() => setStep(1)}>&larr; Back</GhostButton>
              <button
                onClick={handleSubmit}
                disabled={!subOption || saving}
                style={{
                  background: subOption && !saving ? 'rgba(255,107,133,0.15)' : 'var(--surface2)',
                  border: `1px solid ${subOption && !saving ? 'rgba(255,107,133,0.4)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '8px 18px',
                  color: subOption && !saving ? '#ff6b85' : 'var(--muted)',
                  fontSize: '0.82rem', cursor: subOption && !saving ? 'pointer' : 'default',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                  opacity: subOption && !saving ? 1 : 0.4,
                }}
              >
                {saving ? 'Cancelling...' : 'Submit & Cancel Booking'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Forward to Team Modal (Step 3) ── */

function ForwardToTeamModal({ booking, interpreterId, onClose, onForwarded }: {
  booking: Booking
  interpreterId: string
  onClose: () => void
  onForwarded: (names: string[]) => void
}) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function fetchTeam() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('interpreter_preferred_team')
        .select('id, first_name, last_name, email, member_interpreter_id, interpreter_profiles:member_interpreter_id(photo_url, avatar_color)')
        .eq('interpreter_id', interpreterId)
        .order('id', { ascending: false })

      if (error) {
        console.error('[forward] team fetch failed:', error.message)
      } else {
        const mapped = (data || []).map((m: Record<string, unknown>) => {
          const joined = m.interpreter_profiles as { photo_url?: string; avatar_color?: string } | null
          return {
            id: m.id as string,
            first_name: m.first_name as string,
            last_name: m.last_name as string,
            email: m.email as string,
            member_interpreter_id: m.member_interpreter_id as string | null,
            photo_url: joined?.photo_url || null,
            avatar_color: joined?.avatar_color || null,
          }
        })
        setTeamMembers(mapped)
      }
      setLoading(false)
    }
    fetchTeam()
  }, [interpreterId])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleForward() {
    setSending(true)
    // TODO: Wire to real notification/message system — send request details to selected team members
    const names = teamMembers.filter(m => selected.has(m.id)).map(m => `${m.first_name} ${m.last_name}`)
    setTimeout(() => {
      onForwarded(names)
    }, 400)
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.05rem' }}>Forward to Team</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 16px' }}>
          Select team members to forward this request to.
        </p>

        {/* Booking summary */}
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 16,
          fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{booking.title || 'Booking'}</div>
          <div>{booking.requester_name || 'Requester'} · {formatDate(booking.date)} · {formatTime(booking.time_start, booking.time_end)}</div>
        </div>

        {/* Pre-filled message */}
        <div style={{
          background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20,
          fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6, fontStyle: 'italic',
        }}>
          &ldquo;Unfortunately I&apos;m unable to fulfill this request that I had previously accepted. The requester asked that I check availability with trusted interpreters. Any chance you can take this?&rdquo;
        </div>

        {/* Team members list */}
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>Loading team...</div>
        ) : teamMembers.length === 0 ? (
          <div style={{
            padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem',
            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            marginBottom: 20,
          }}>
            No team members found. Add interpreters to your Preferred Team first.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 280, overflowY: 'auto' }}>
            {teamMembers.map(m => {
              const isSelected = selected.has(m.id)
              const initials = `${(m.first_name[0] || '').toUpperCase()}${(m.last_name[0] || '').toUpperCase()}`
              return (
                <div
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                    background: isSelected ? 'rgba(0,229,255,0.06)' : 'var(--surface2)',
                    border: `1px solid ${isSelected ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isSelected && <span style={{ color: '#000', fontSize: '0.7rem', fontWeight: 800 }}>✓</span>}
                  </div>
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={`${m.first_name} ${m.last_name}`} style={{
                      width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
                    }} />
                  ) : (
                    <Avatar initials={initials} gradient={m.avatar_color || 'linear-gradient(135deg,#7b61ff,#00e5ff)'} size={36} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.first_name} {m.last_name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>{m.email}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="dash-card-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button
            className="btn-primary"
            onClick={handleForward}
            disabled={selected.size === 0 || sending}
            style={{
              padding: '8px 18px', fontSize: '0.82rem',
              opacity: selected.size > 0 && !sending ? 1 : 0.4,
              pointerEvents: selected.size > 0 && !sending ? 'auto' : 'none',
            }}
          >
            {sending ? 'Forwarding...' : `Forward to Selected Interpreter${selected.size !== 1 ? 's' : ''} →`}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Detail Modal ── */

function DetailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const isRemote = booking.format === 'remote'

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10,
  }
  const detailRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 6,
  }
  const iconStyle: React.CSSProperties = { color: 'var(--muted)', flexShrink: 0, marginTop: 2 }
  const sectionStyle: React.CSSProperties = { padding: '16px 0', borderBottom: '1px solid var(--border)' }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '90%', maxWidth: 560,
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>{booking.title || 'Booking'}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>✕</button>
          </div>
          {booking.status === 'cancelled' ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: 'rgba(255,107,133,0.1)', color: '#ff6b85',
              border: '1px solid rgba(255,107,133,0.3)',
              fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em',
            }}>
              Cancelled{booking.cancellation_reason ? ` — ${booking.cancellation_reason}` : ''}
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              background: 'rgba(0,229,255,0.1)', color: 'var(--accent)',
              border: '1px solid rgba(0,229,255,0.25)',
            }}>
              ✓ Confirmed
            </span>
          )}
        </div>

        <div style={{ padding: '0 28px 8px', overflowY: 'auto', maxHeight: '62vh' }}>
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Date &amp; Time</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 5.5h12M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <div>
                <div>{formatDate(booking.date)}</div>
                <div style={{ fontWeight: 600 }}>{formatTime(booking.time_start, booking.time_end)}</div>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Location</div>
            <div style={detailRowStyle}>
              {isRemote ? (
                <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M4 12h6M7 10v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1C4.79 1 3 2.79 3 5C3 8.5 7 13 7 13C7 13 11 8.5 11 5C11 2.79 9.21 1 7 1ZM7 7C5.9 7 5 6.1 5 5C5 3.9 5.9 3 7 3C8.1 3 9 3.9 9 5C9 6.1 8.1 7 7 7Z" fill="currentColor"/>
                </svg>
              )}
              <div>{booking.location || 'TBD'}</div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Client</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <div style={{ fontWeight: 600 }}>{booking.requester_name || 'Client'}</div>
            </div>
          </div>

          <div style={{ padding: '16px 0' }}>
            <div style={sectionLabelStyle}>Booking Context</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>
              {booking.notes || `${booking.specialization || 'General'} booking`}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <GhostButton onClick={onClose}>Close</GhostButton>
        </div>
      </div>
    </div>
  )
}

/* ── Calendar Dropdown ── */

function CalendarDropdown({ booking, onToast }: {
  booking: Booking; onToast: (msg: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const title = booking.title || 'Booking'
  const location = booking.location || ''

  function addToGcal() {
    const { start, end } = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGoogleDateStr(start)}/${toGoogleDateStr(end)}&location=${encodeURIComponent(location)}`, '_blank')
    setOpen(false); onToast('Added to Google Calendar')
  }
  function addToIcal() {
    const { start, end } = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    const p = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`SUMMARY:${title}`,`LOCATION:${location}`,'END:VEVENT','END:VCALENDAR'].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`; a.click(); URL.revokeObjectURL(url)
    setOpen(false); onToast('iCal file downloaded')
  }
  function addToOutlook() {
    const { start, end } = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    window.open(`https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent(title)}&startdt=${encodeURIComponent(toISOLocal(start))}&enddt=${encodeURIComponent(toISOLocal(end))}&location=${encodeURIComponent(location)}`, '_blank')
    setOpen(false); onToast('Added to Outlook Calendar')
  }

  const optionStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left',
    background: 'none', border: 'none', padding: '9px 14px',
    color: 'var(--text)', fontSize: '0.82rem', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", borderRadius: 6,
    transition: 'background 0.12s',
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <GhostButton onClick={() => setOpen(!open)}>Add to Calendar</GhostButton>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: 6, minWidth: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        }}>
          <button onClick={addToGcal} style={optionStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>Google Calendar</button>
          <button onClick={addToIcal} style={optionStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>iCal (.ics)</button>
          <button onClick={addToOutlook} style={optionStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>Outlook</button>
        </div>
      )}
    </div>
  )
}

/* ── Cancelled Status Badge ── */

function CancelledBadge({ reason }: { reason: string | null }) {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: 100, whiteSpace: 'nowrap',
      background: 'rgba(255,107,133,0.1)', color: '#ff6b85',
      border: '1px solid rgba(255,107,133,0.3)',
      fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em',
    }}>
      Cancelled{reason ? ` — ${reason}` : ''}
    </span>
  )
}

/* ── Booking Card ── */

function BookingCard({ booking, onViewDetails, onCancel, onForwardToTeam, onToast, isUpcoming }: {
  booking: Booking
  onViewDetails: () => void
  onCancel: () => void
  onForwardToTeam: () => void
  onToast: (msg: string) => void
  isUpcoming: boolean
}) {
  const isCancelled = booking.status === 'cancelled'

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 12,
      opacity: isCancelled ? 0.75 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif" }}>{booking.title || 'Booking'}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>{booking.requester_name || 'Client'} · {booking.specialization || 'General'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {booking.is_seed && <DemoBadge />}
          {isCancelled
            ? <CancelledBadge reason={booking.cancellation_reason} />
            : <StatusBadge status="confirmed" />
          }
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
        <span>📅 {formatDate(booking.date)}</span>
        <span>🕐 {formatTime(booking.time_start, booking.time_end)}</span>
        <span>📍 {booking.location || 'TBD'}</span>
      </div>
      <div className="dash-card-actions" style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <GhostButton onClick={onViewDetails}>View Details</GhostButton>
        {!isCancelled && isUpcoming && <CalendarDropdown booking={booking} onToast={onToast} />}
        {!isCancelled && <GhostButton danger onClick={onCancel}>Cancel Booking</GhostButton>}
        {isCancelled && booking.sub_search_initiated && (
          <button
            className="btn-primary"
            onClick={onForwardToTeam}
            style={{ fontSize: '0.82rem', padding: '8px 18px' }}
          >
            Forward to Team &rarr;
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ── */

export default function ConfirmedPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [forwarding, setForwarding] = useState<string | null>(null)
  const [interpreterId, setInterpreterId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile, error: profileErr } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) { setLoading(false); return }
    setInterpreterId(profile.id)

    const { data, error } = await supabase
      .from('bookings')
      .select('id, title, requester_name, specialization, date, time_start, time_end, location, format, recurrence, notes, status, is_seed, cancellation_reason, sub_search_initiated')
      .eq('interpreter_id', profile.id)
      .in('status', ['confirmed', 'cancelled'])
      .order('date', { ascending: true })

    if (error) {
      console.error('[confirmed] fetch failed:', error.message)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleCancelled(bookingId: string, subSearch: boolean) {
    setCancelling(null)
    // Update local state to reflect cancellation without refetch
    setBookings(prev => prev.map(b =>
      b.id === bookingId
        ? { ...b, status: 'cancelled', sub_search_initiated: subSearch, cancellation_reason: 'Cancelled' }
        : b
    ))
    showToast('Booking cancelled. The requester has been notified.')
    // Refetch to get the actual reason from DB
    fetchBookings()
  }

  function handleForwarded(names: string[]) {
    setForwarding(null)
    showToast(`Request forwarded to ${names.join(', ')}. The requester will be notified.`)
  }

  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const cancelled = bookings.filter(b => b.status === 'cancelled')

  const filtered = confirmed.filter(b =>
    !search || [b.title, b.requester_name, b.specialization, b.location].join(' ').toLowerCase().includes(search.toLowerCase())
  )
  const filteredCancelled = cancelled.filter(b =>
    !search || [b.title, b.requester_name, b.specialization, b.location].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const today = new Date().toISOString().slice(0, 10)
  const in14Days = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  const upcoming = filtered.filter(b => b.date >= today && b.date <= in14Days)
  const hasSeedData = bookings.some(b => b.is_seed)

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 900 }}>
      {hasSeedData && <BetaBanner />}
      <PageHeader title="Confirmed Bookings" subtitle="All your accepted and confirmed bookings." />

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by client, location, type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '9px 14px',
            color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Loading...
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <SectionLabel>Upcoming — Next 14 Days</SectionLabel>
              {upcoming.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onViewDetails={() => setViewing(b.id)}
                  onCancel={() => setCancelling(b.id)}
                  onForwardToTeam={() => setForwarding(b.id)}
                  onToast={showToast}
                  isUpcoming
                />
              ))}
            </>
          )}

          <SectionLabel>All Confirmed</SectionLabel>
          {filtered.length === 0 ? (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '32px 24px',
              color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
            }}>
              No confirmed bookings yet.
            </div>
          ) : (
            filtered.map(b => (
              <BookingCard
                key={`all-${b.id}`}
                booking={b}
                onViewDetails={() => setViewing(b.id)}
                onCancel={() => setCancelling(b.id)}
                onForwardToTeam={() => setForwarding(b.id)}
                onToast={showToast}
                isUpcoming={b.date >= today}
              />
            ))
          )}

          {filteredCancelled.length > 0 && (
            <>
              <SectionLabel>Cancelled</SectionLabel>
              {filteredCancelled.map(b => (
                <BookingCard
                  key={`cancelled-${b.id}`}
                  booking={b}
                  onViewDetails={() => setViewing(b.id)}
                  onCancel={() => {}}
                  onForwardToTeam={() => setForwarding(b.id)}
                  onToast={showToast}
                  isUpcoming={false}
                />
              ))}
            </>
          )}
        </>
      )}

      {/* Detail modal */}
      {viewing && bookings.find(b => b.id === viewing) && (
        <DetailModal
          booking={bookings.find(b => b.id === viewing)!}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Cancel modal */}
      {cancelling && bookings.find(b => b.id === cancelling) && (
        <CancelModal
          booking={bookings.find(b => b.id === cancelling)!}
          onClose={() => setCancelling(null)}
          onCancelled={(subSearch) => handleCancelled(cancelling, subSearch)}
        />
      )}

      {/* Forward to team modal */}
      {forwarding && interpreterId && bookings.find(b => b.id === forwarding) && (
        <ForwardToTeamModal
          booking={bookings.find(b => b.id === forwarding)!}
          interpreterId={interpreterId}
          onClose={() => setForwarding(null)}
          onForwarded={handleForwarded}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 'var(--radius)', padding: '14px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.85rem', color: '#34d399',
        }}>
          {toast}
        </div>
      )}

      <DashMobileStyles />
    </div>
  )
}
