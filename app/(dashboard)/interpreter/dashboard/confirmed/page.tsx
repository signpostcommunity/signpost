'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BetaBanner, PageHeader, SectionLabel, StatusBadge, DemoBadge, GhostButton, Avatar, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import { sendNotification } from '@/lib/notifications'
import { getVideoEmbedUrl } from '@/lib/videoUtils'
import BookingFilterBar, { filterByDateRange, groupByTimeCategory, timeCategoryHeaderStyle } from '@/components/dashboard/shared/BookingFilterBar'

/* ── Types ── */

interface Booking {
  id: string
  recipient_id: string
  title: string | null
  requester_id: string | null
  requester_name: string | null
  specialization: string | null
  date: string
  time_start: string
  time_end: string
  location: string | null
  format: string | null
  recurrence: string | null
  description: string | null
  notes: string | null
  status: string
  is_seed: boolean | null
  cancellation_reason: string | null
  sub_search_initiated: boolean | null
  rate_profile_id: string | null
  context_video_url: string | null
  profile_video_url: string | null
}

interface InvoiceInfo {
  id: string
  status: string
  invoice_number: string
  due_date: string | null
}

interface AdditionalCost {
  category: string
  description: string
  amount: number
}

interface RateProfileData {
  id: string
  label: string
  hourly_rate: number | null
}

interface PaymentMethodEntry {
  type: string
  value: string
}

const COST_CATEGORIES = [
  'Travel - Mileage', 'Travel - Parking', 'Travel - Tolls', 'Travel - Airfare',
  'Travel - Lodging', 'Prep Time', 'Materials', 'Rush Fee', 'After Hours', 'Other',
] as const

const TERMS_LABELS: Record<string, string> = {
  'due_on_receipt': 'Due on Receipt',
  'net_15': 'Net 15',
  'net_30': 'Net 30',
  'net_45': 'Net 45',
  'net_60': 'Net 60',
}

const TERMS_DAYS: Record<string, number> = {
  'due_on_receipt': 0, 'net_15': 15, 'net_30': 30, 'net_45': 45, 'net_60': 60,
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

function formatTime(start: string | null, end: string | null): string {
  if (!start || !end) return 'TBD'
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

function parseDateTimeFromBooking(dateStr: string, timeStart: string | null, timeEnd: string | null): { start: Date; end: Date } | null {
  if (!timeStart || !timeEnd) return null
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

    // Update recipient status to withdrawn
    const { error: recipientErr } = await supabase
      .from('booking_recipients')
      .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
      .eq('id', booking.recipient_id)

    if (recipientErr) {
      console.error('[confirmed] recipient withdraw failed:', recipientErr.message)
    }

    // Update the booking itself
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

    // TODO: cancelled_by_requester — when requester cancellation flow is built
    // TODO: If sub_search_initiated, send requester approval prompt
    // TODO: If D/HH consumer is linked to booking, send them a status update

    if (error) {
      console.error('[confirmed] cancel failed:', error.message)
      setSaving(false)
      return
    }

    // Send cancellation notification to interpreter (self-confirmation)
    const location = booking.format === 'remote' ? 'Virtual' : (booking.location?.split(',')[0] || 'TBD')
    const dateStr = booking.date ? new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'
    const timeStr = booking.time_start || ''
    sendNotification({
      recipientUserId: user.id,
      type: 'cancelled_by_you',
      subject: `Booking cancelled: ${booking.title || 'Booking'}`,
      body: `Your cancellation for "${booking.title || 'Booking'}" on ${dateStr} has been processed. Reason: ${finalReason}`,
      metadata: { booking_id: booking.id },
    }).catch(err => console.error('[confirmed] cancel notification failed:', err))

    // Notify the requester about the cancellation
    if (booking.requester_id) {
      sendNotification({
        recipientUserId: booking.requester_id,
        type: 'booking_cancelled',
        subject: `Booking cancelled: ${booking.title || 'Booking'}`,
        body: `The interpreter has cancelled the booking for ${booking.title || 'Booking'} on ${dateStr}. Reason: ${finalReason}`,
        metadata: { booking_id: booking.id },
        ctaText: 'View Details',
        ctaUrl: 'https://signpost.community/request/dashboard',
      }).catch(err => console.error('[confirmed] requester cancel notification failed:', err))
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
    <div role="presentation" style={overlayStyle} onClick={onClose}>
      <div className="modal-dialog" style={modalStyle} onClick={e => e.stopPropagation()}>

        {/* Step 1: Reason */}
        {step === 1 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.05rem' }}>Cancel this booking</div>
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
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.05rem' }}>Help find a replacement?</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 8px' }}>
              Optional, but it could make all the difference.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 22px' }}>
              Cancelling a booking can cause incredible disruption for the D/DB/HH consumer and the organization. Offering to help the requester find a replacement is optional, but highly recommended. A little help goes a long way.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div role="button" tabIndex={0} onClick={() => setSubOption('help')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSubOption('help'); } }} style={cardStyle(subOption === 'help')}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: subOption === 'help' ? 'var(--accent)' : 'var(--text)', marginBottom: 6 }}>
                  Offer to check with my Preferred Team Interpreters
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                  The requester will be notified of your cancellation and asked if they&apos;d like you to forward this request to your trusted team. If they approve, you&apos;ll select who to contact.
                </div>
              </div>

              <div role="button" tabIndex={0} onClick={() => setSubOption('skip')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSubOption('skip'); } }} style={cardStyle(subOption === 'skip')}>
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
    <div role="presentation" style={overlayStyle} onClick={onClose}>
      <div className="modal-dialog" style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.05rem' }}>Forward to Team</div>
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
                    {isSelected && <span style={{ color: '#000', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>}
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

// TODO: Add these columns to bookings table:
// - dhh_client_name (text)
// - dhh_client_preferences (text) — communication preferences
// - onsite_contact_name (text)
// - onsite_contact_phone (text)
// - attachments (jsonb) — array of {name, size, url}

interface Attachment {
  name: string
  size: string
  url: string
}

function DetailModal({ booking, onClose, currentInterpreterId }: { booking: Booking; onClose: () => void; currentInterpreterId: string | null }) {
  const isRemote = booking.format === 'remote'
  const [teamNames, setTeamNames] = useState<string[]>([])

  useEffect(() => {
    if (!currentInterpreterId || !booking.id) return
    ;(async () => {
      const supabase = createClient()
      // Fetch other confirmed recipients for this booking (separate query to avoid RLS inner join issue)
      const { data: recipients } = await supabase
        .from('booking_recipients')
        .select('interpreter_id')
        .eq('booking_id', booking.id)
        .eq('status', 'confirmed')
        .neq('interpreter_id', currentInterpreterId)
      if (!recipients || recipients.length === 0) return
      const ids = recipients.map(r => r.interpreter_id)
      // Fetch interpreter names in a second query
      const { data: profiles } = await supabase
        .from('interpreter_profiles')
        .select('first_name, last_name')
        .in('id', ids)
      if (profiles) {
        setTeamNames(profiles.map(p => [p.first_name, p.last_name].filter(Boolean).join(' ')).filter(Boolean))
      }
    })()
  }, [booking.id, currentInterpreterId])

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: '#00e5ff', marginBottom: 10,
  }
  const detailRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 6,
  }
  const iconStyle: React.CSSProperties = { color: 'var(--muted)', flexShrink: 0, marginTop: 2 }
  const sectionStyle: React.CSSProperties = { padding: '16px 0', borderBottom: '1px solid var(--border)' }
  const linkStyle: React.CSSProperties = { color: 'var(--accent)', textDecoration: 'none' }

  // Full date format matching prototype (e.g. "Sunday, February 22, 2026")
  const fullDate = (() => {
    const d = new Date(booking.date + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  })()

  // Timezone abbreviation
  const timezone = (() => {
    try {
      const d = new Date(booking.date + 'T12:00:00')
      const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d)
      const tz = parts.find(p => p.type === 'timeZoneName')?.value || ''
      const offset = d.getTimezoneOffset()
      const sign = offset <= 0 ? '+' : '−'
      const absH = Math.floor(Math.abs(offset) / 60)
      return `${tz} (UTC${sign}${absH})`
    } catch { return '' }
  })()

  // TODO: Add these columns to bookings table when ready:
  // - dhh_client_name (text) — name of the deaf/HoH person
  // - dhh_client_preferences (text) — communication preferences, signing style, positioning needs
  // - onsite_contact_name (text)
  // - onsite_contact_phone (text)
  // - attachments (jsonb) — array of {name, size, url}
  // TODO: Wire attachments to Supabase Storage for file uploads

  // Parse D/HH client info from notes field (seed data format: "D/HH Client: Name. Communication prefs: ...")
  const parsedDhh = (() => {
    const notes = booking.notes || ''
    const nameMatch = notes.match(/D\/HH Client:\s*([^.]+)/)
    const prefsMatch = notes.match(/Communication prefs?:\s*(.+?)(?:\.|$)/i)
    return {
      name: nameMatch ? nameMatch[1].trim() : null,
      prefs: prefsMatch ? prefsMatch[1].trim() : null,
    }
  })()

  const dhhClientName = parsedDhh.name // null if not available — show "Not yet provided"
  const dhhClientPrefs = parsedDhh.prefs // null if not available
  const onsiteContactName: string | null = null // TODO: booking.onsite_contact_name
  const onsiteContactPhone: string | null = null // TODO: booking.onsite_contact_phone
  const attachments: Attachment[] = [] // TODO: booking.attachments || []

  // Parse location for remote links
  const locationUrl = (() => {
    if (!booking.location) return null
    const match = booking.location.match(/(https?:\/\/[^\s]+)/)
    return match ? match[1] : null
  })()
  const meetingIdMatch = booking.location?.match(/Meeting\s*ID[:\s]*([0-9\s]+)/i)
  const meetingId = meetingIdMatch ? meetingIdMatch[0] : null

  return (
    <div role="presentation" style={overlayStyle} onClick={onClose}>
      <div className="modal-dialog" style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '90%', maxWidth: 560,
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }} onClick={e => e.stopPropagation()}>
        {/* Header: Title + Status Badge */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>{booking.title || 'Booking'}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>✕</button>
          </div>
          {booking.status === 'cancelled' ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: 'rgba(255,107,133,0.1)', color: '#ff6b85',
              border: '1px solid rgba(255,107,133,0.3)',
              fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em',
            }}>
              Cancelled{booking.cancellation_reason ? ` — ${booking.cancellation_reason}` : ''}
            </span>
          ) : booking.status === 'completed' ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: 'rgba(52,211,153,0.1)', color: '#34d399',
              border: '1px solid rgba(52,211,153,0.3)',
              fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em',
            }}>
              Completed
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
          {/* 1. Date & Time */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Date &amp; Time</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 5.5h12M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <div>
                <div>{fullDate}</div>
                <div><strong>{formatTime(booking.time_start, booking.time_end)}</strong>{' '}
                  <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{timezone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Location — clickable */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Location</div>
            <div style={detailRowStyle}>
              {isRemote ? (
                <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 5h4M5 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4zm0 5.5A1.5 1.5 0 1 1 7 3a1.5 1.5 0 0 1 0 3z" fill="currentColor" opacity="0.7"/>
                </svg>
              )}
              <div>
                {isRemote ? (
                  <>
                    <span>Remote (Zoom)</span>
                    {locationUrl && (
                      <>
                        <br />
                        <a href={locationUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}
                          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                        >{locationUrl}</a>
                      </>
                    )}
                    {meetingId && (
                      <>
                        <br />
                        <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{meetingId}</span>
                      </>
                    )}
                    {!locationUrl && !meetingId && booking.location && (
                      <>
                        <br />
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{booking.location}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    On-site —{' '}
                    {booking.location ? (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(booking.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkStyle}
                        onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                        onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                      >
                        {booking.location}
                      </a>
                    ) : (
                      <span>TBD</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 3. Requester — who booked the interpreter */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Requester</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 5l6 3.5L13 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div><span style={{ fontWeight: 600 }}>{booking.requester_name || 'Requester'}</span></div>
            </div>
          </div>

          {/* 3b. Team — other confirmed interpreters */}
          {teamNames.length > 0 && (
            <div style={sectionStyle}>
              <div style={sectionLabelStyle}>Team</div>
              <div style={detailRowStyle}>
                <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="9.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 12c0-2.5 1.8-3.5 4-3.5s4 1 4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M9.5 8.5c1.5 0 3 .8 3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <div><span style={{ fontWeight: 600 }}>{teamNames.join(', ')}</span></div>
              </div>
            </div>
          )}

          {/* 4. Deaf/Hard of Hearing Client — NOT the requester */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Deaf/Hard of Hearing Client</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1.5 12.5c0-3 2.24-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <div>
                {dhhClientName
                  ? <span style={{ fontWeight: 600 }}>{dhhClientName}</span>
                  : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Not yet provided</span>
                }
              </div>
            </div>
            {dhhClientPrefs && (
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65, marginTop: 8, paddingLeft: 24 }}>
                {dhhClientPrefs}
              </div>
            )}
          </div>

          {/* 4. On-site Contact */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>On-site Contact</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h3l1.5 3.5-2 1.5a9 9 0 0 0 2.5 2.5l1.5-2L12 9v3c-5.5.5-11-5-10-10z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                {onsiteContactName && onsiteContactPhone
                  ? `${onsiteContactName} — ${onsiteContactPhone}`
                  : onsiteContactName || onsiteContactPhone || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Not provided</span>
                }
              </div>
            </div>
          </div>

          {/* 6. Job Context */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Job Context</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>
              {booking.description || `${booking.specialization || 'General'} booking`}
            </div>
            {booking.notes && booking.description && !booking.notes.startsWith('D/HH Client:') && (
              <div style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.78rem' }}>Notes:</span> {booking.notes}
              </div>
            )}
          </div>

          {/* Profile video from D/HH client */}
          {booking.profile_video_url && (() => {
            const embedUrl = getVideoEmbedUrl(booking.profile_video_url!)
            if (!embedUrl) return null
            return (
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={sectionLabelStyle}>Communication style video from {booking.requester_name || 'client'}</div>
                {embedUrl.includes('supabase.co/storage') ? (
                  <video controls width="100%" src={embedUrl} style={{ borderRadius: 8, maxHeight: 220, background: '#000' }} />
                ) : (
                  <iframe width="100%" height="220" src={embedUrl} title="Communication style video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                    style={{ borderRadius: 8, border: 'none' }} />
                )}
              </div>
            )
          })()}

          {/* Context video — always visible on confirmed bookings */}
          {booking.context_video_url && (() => {
            const embedUrl = getVideoEmbedUrl(booking.context_video_url!)
            if (!embedUrl) return null
            return (
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={sectionLabelStyle}>Context video from {booking.requester_name || 'client'}</div>
                {embedUrl.includes('supabase.co/storage') ? (
                  <video controls width="100%" src={embedUrl} style={{ borderRadius: 8, maxHeight: 220, background: '#000' }} />
                ) : (
                  <iframe width="100%" height="220" src={embedUrl} title="Context video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                    style={{ borderRadius: 8, border: 'none' }} />
                )}
              </div>
            )
          })()}

          {/* 6. Attachments & Materials */}
          {attachments.length > 0 && (
            <div style={{ padding: '16px 0' }}>
              <div style={sectionLabelStyle}>Attachments &amp; Materials</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {attachments.map(a => (
                  <a
                    key={a.name}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '7px 12px', fontSize: '0.82rem',
                      color: 'var(--text)', cursor: 'pointer', transition: 'border-color 0.15s',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="2" y="1" width="8" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M5 4h4M5 7h4M5 10h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    {a.name} <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{a.size}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
    const parsed = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    if (!parsed) return
    const { start, end } = parsed
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGoogleDateStr(start)}/${toGoogleDateStr(end)}&location=${encodeURIComponent(location)}`, '_blank')
    setOpen(false); onToast('Added to Google Calendar')
  }
  function addToIcal() {
    const parsed = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    if (!parsed) return
    const { start, end } = parsed
    const p = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`SUMMARY:${title}`,`LOCATION:${location}`,'END:VEVENT','END:VCALENDAR'].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`; a.click(); URL.revokeObjectURL(url)
    setOpen(false); onToast('iCal file downloaded')
  }
  function addToOutlook() {
    const parsed = parseDateTimeFromBooking(booking.date, booking.time_start, booking.time_end)
    if (!parsed) return
    const { start, end } = parsed
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

/* ── Invoice Modal ── */

function InvoiceModal({ booking, interpreterId, onClose, onSaved }: {
  booking: Booking
  interpreterId: string
  onClose: () => void
  onSaved: (status: string) => void
}) {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingInvoiceId, setExistingInvoiceId] = useState<string | null>(null)

  // Editable fields
  const [billingName, setBillingName] = useState(booking.requester_name || '')
  const [billingEmail, setBillingEmail] = useState('')
  const [actualStart, setActualStart] = useState(booking.time_start || '09:00')
  const [actualEnd, setActualEnd] = useState(booking.time_end || '10:00')
  const [actualHours, setActualHours] = useState(0)
  const [hourlyRate, setHourlyRate] = useState(0)
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([])
  const [paymentTerms, setPaymentTerms] = useState('net_30')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodEntry[]>([])

  // Calculate hours from time
  useEffect(() => {
    const [sh, sm] = actualStart.split(':').map(Number)
    const [eh, em] = actualEnd.split(':').map(Number)
    const hours = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
    setActualHours(Math.round(hours * 100) / 100)
  }, [actualStart, actualEnd])

  const subtotal = (actualHours * hourlyRate) + additionalCosts.reduce((sum, c) => sum + (c.amount || 0), 0)
  const total = subtotal

  // Calculate due date
  const dueDate = (() => {
    const days = TERMS_DAYS[paymentTerms] || 30
    const d = new Date(booking.date + 'T00:00:00')
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  })()

  const dueDateFormatted = (() => {
    if (paymentTerms === 'due_on_receipt') return 'Due on Receipt'
    const d = new Date(dueDate + 'T00:00:00')
    return `Due by ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
  })()

  // Load data on mount
  useEffect(() => {
    async function init() {
      const supabase = createClient()

      // Check for existing draft invoice for this booking
      const { data: existingInv } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, requester_billing_email, actual_start_time, actual_end_time, actual_hours, base_rate, additional_costs, payment_terms, payment_methods_snapshot')
        .eq('booking_id', booking.id)
        .eq('interpreter_id', interpreterId)
        .in('status', ['draft'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (existingInv && existingInv.length > 0) {
        const inv = existingInv[0]
        setExistingInvoiceId(inv.id)
        setInvoiceNumber(inv.invoice_number)
        if (inv.requester_billing_email) setBillingEmail(inv.requester_billing_email)
        if (inv.actual_start_time) setActualStart(inv.actual_start_time.slice(0, 5))
        if (inv.actual_end_time) setActualEnd(inv.actual_end_time.slice(0, 5))
        if (inv.actual_hours) setActualHours(Number(inv.actual_hours))
        if (inv.base_rate) setHourlyRate(Number(inv.base_rate))
        if (inv.additional_costs) setAdditionalCosts(inv.additional_costs as AdditionalCost[])
        if (inv.payment_terms) setPaymentTerms(inv.payment_terms)
        if (inv.payment_methods_snapshot) setPaymentMethods(inv.payment_methods_snapshot as PaymentMethodEntry[])
        setLoading(false)
        return
      }

      // Generate new invoice number
      const { data: numData } = await supabase.rpc('generate_invoice_number')
      if (numData) setInvoiceNumber(numData as string)

      // Fetch rate profile if linked
      if (booking.rate_profile_id) {
        const { data: rp } = await supabase
          .from('interpreter_rate_profiles')
          .select('hourly_rate')
          .eq('id', booking.rate_profile_id)
          .single()
        if (rp?.hourly_rate) setHourlyRate(Number(rp.hourly_rate))
      } else {
        // Fallback: get default rate
        const { data: defaultRate } = await supabase
          .from('interpreter_rate_profiles')
          .select('hourly_rate')
          .eq('interpreter_id', interpreterId)
          .eq('is_default', true)
          .limit(1)
        if (defaultRate && defaultRate.length > 0 && defaultRate[0].hourly_rate) {
          setHourlyRate(Number(defaultRate[0].hourly_rate))
        }
      }

      // Fetch interpreter payment methods + default terms
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: interpData } = await supabase
          .from('interpreter_profiles')
          .select('payment_methods, default_payment_terms')
          .eq('user_id', user.id)
          .single()
        if (interpData) {
          if (interpData.payment_methods) setPaymentMethods(interpData.payment_methods as PaymentMethodEntry[])
          if (interpData.default_payment_terms) setPaymentTerms(interpData.default_payment_terms)
        }
      }

      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveInvoice(sendNow: boolean) {
    setSaving(true)
    const supabase = createClient()

    const payload = {
      interpreter_id: interpreterId,
      booking_id: booking.id,
      invoice_number: invoiceNumber,
      status: sendNow ? 'sent' : 'draft',
      job_title: booking.title,
      job_date: booking.date,
      job_location: booking.location,
      job_format: booking.format,
      requester_name: billingName,
      requester_billing_email: billingEmail || null,
      actual_start_time: actualStart,
      actual_end_time: actualEnd,
      actual_hours: actualHours,
      base_rate: hourlyRate,
      base_rate_type: 'hourly',
      additional_costs: additionalCosts,
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      payment_terms: paymentTerms,
      due_date: paymentTerms === 'due_on_receipt' ? booking.date : dueDate,
      payment_methods_snapshot: paymentMethods,
      updated_at: new Date().toISOString(),
      ...(sendNow ? { sent_at: new Date().toISOString() } : {}),
    }

    let result
    if (existingInvoiceId) {
      result = await supabase.from('invoices').update(payload).eq('id', existingInvoiceId).select('id')
    } else {
      result = await supabase.from('invoices').insert(payload).select('id')
    }

    setSaving(false)
    if (result.error) {
      console.error('[invoice] save failed:', result.error.message)
      return
    }

    const savedId = result.data?.[0]?.id || existingInvoiceId
    if (sendNow && savedId) {
      window.open(`/interpreter/dashboard/invoices/${savedId}`, '_blank')
    }

    onSaved(sendNow ? 'sent' : 'draft')
  }

  const inputSt: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '9px 12px',
    color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.88rem', outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const labelSt: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#c8cdd8', marginBottom: 6 }

  if (loading) {
    return (
      <div role="presentation" style={overlayStyle} onClick={onClose}>
        <div className="modal-dialog" style={{ ...modalStyle, maxWidth: 620 }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading invoice...</div>
        </div>
      </div>
    )
  }

  return (
    <div role="presentation" style={overlayStyle} onClick={onClose}>
      <div className="modal-dialog" style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '92%', maxWidth: 620,
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.1rem', margin: '0 0 6px' }}>Submit Invoice</h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{invoiceNumber}</span>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                background: 'rgba(180,180,180,0.1)', color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}>Draft</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '0 28px 16px', overflowY: 'auto', maxHeight: '64vh' }}>
          {/* Job details (read-only) */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 10 }}>Job Details</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600 }}>{booking.title || 'Booking'}</div>
              <div style={{ color: 'var(--muted)' }}>{formatDate(booking.date)} · {formatTime(booking.time_start, booking.time_end)}</div>
              <div style={{ color: 'var(--muted)' }}>{booking.location || 'TBD'}</div>
            </div>
          </div>

          {/* Billing recipient */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 10 }}>Bill To</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelSt}>Requester Name</label>
                <input type="text" value={billingName} onChange={e => setBillingName(e.target.value)} style={inputSt}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }} />
              </div>
              <div>
                <label style={labelSt}>Billing Email</label>
                <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} placeholder="billing@company.com" style={inputSt}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }} />
              </div>
            </div>
          </div>

          {/* Time & Rate */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 10 }}>Time &amp; Rate</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelSt}>Start Time</label>
                <input type="time" value={actualStart} onChange={e => setActualStart(e.target.value)} style={inputSt}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }} />
              </div>
              <div>
                <label style={labelSt}>End Time</label>
                <input type="time" value={actualEnd} onChange={e => setActualEnd(e.target.value)} style={inputSt}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }} />
              </div>
              <div>
                <label style={labelSt}>Hours</label>
                <input type="number" step="0.25" value={actualHours} onChange={e => setActualHours(parseFloat(e.target.value) || 0)} style={inputSt}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }} />
              </div>
            </div>
            <div style={{ maxWidth: 200 }}>
              <label style={labelSt}>Hourly Rate ($)</label>
              <input type="number" step="0.01" value={hourlyRate} onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)} style={inputSt}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }} />
            </div>
          </div>

          {/* Additional Costs */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 10 }}>Additional Costs</div>
            {additionalCosts.map((cost, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  {i === 0 && <label style={labelSt}>Category</label>}
                  <select value={cost.category} onChange={e => {
                    const updated = [...additionalCosts]; updated[i] = { ...updated[i], category: e.target.value }; setAdditionalCosts(updated)
                  }} style={inputSt}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}>
                    {COST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  {i === 0 && <label style={labelSt}>Description</label>}
                  <input type="text" value={cost.description} placeholder="e.g. 45 miles round trip" onChange={e => {
                    const updated = [...additionalCosts]; updated[i] = { ...updated[i], description: e.target.value }; setAdditionalCosts(updated)
                  }} style={inputSt}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }} />
                </div>
                <div style={{ width: 100 }}>
                  {i === 0 && <label style={labelSt}>Amount ($)</label>}
                  <input type="number" step="0.01" value={cost.amount || ''} onChange={e => {
                    const updated = [...additionalCosts]; updated[i] = { ...updated[i], amount: parseFloat(e.target.value) || 0 }; setAdditionalCosts(updated)
                  }} style={inputSt}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }} />
                </div>
                <button onClick={() => setAdditionalCosts(additionalCosts.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', padding: '9px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>✕</button>
              </div>
            ))}
            <button onClick={() => setAdditionalCosts([...additionalCosts, { category: COST_CATEGORIES[0], description: '', amount: 0 }])}
              style={{
                background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '8px 14px', color: 'var(--muted)', fontSize: '0.82rem', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}>
              + Add cost
            </button>
          </div>

          {/* Totals */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 6 }}>
              <span style={{ color: 'var(--muted)' }}>Interpreting ({actualHours}h × ${hourlyRate.toFixed(2)})</span>
              <span>${(actualHours * hourlyRate).toFixed(2)}</span>
            </div>
            {additionalCosts.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>{c.category}{c.description ? ` — ${c.description}` : ''}</span>
                <span>${(c.amount || 0).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, marginTop: 6 }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent)' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Terms */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 10 }}>Payment Terms</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} style={{ ...inputSt, maxWidth: 200 }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}>
                <option value="due_on_receipt">Due on Receipt</option>
                <option value="net_15">Net 15</option>
                <option value="net_30">Net 30</option>
                <option value="net_45">Net 45</option>
                <option value="net_60">Net 60</option>
              </select>
              <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>{dueDateFormatted}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div style={{ padding: '16px 0' }}>
            <div style={{ fontWeight: 600, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 10 }}>Payment Methods</div>
            {paymentMethods.length > 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.8 }}>
                {paymentMethods.map((pm, i) => (
                  <div key={i}><span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{pm.type}:</span> {pm.value}</div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                No payment methods configured. <a href="/interpreter/dashboard/profile" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Add them in your profile</a> under Payment &amp; Invoicing.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button
            onClick={() => saveInvoice(false)}
            disabled={saving}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '8px 18px',
              color: 'var(--text)', fontSize: '0.82rem', cursor: saving ? 'default' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn-primary" onClick={() => saveInvoice(true)} disabled={saving}
            style={{ padding: '8px 20px', fontSize: '0.82rem', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Sending...' : 'Send Invoice'}
          </button>
        </div>
      </div>
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
      fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em',
    }}>
      Cancelled{reason ? ` — ${reason}` : ''}
    </span>
  )
}

function CompletedBadge() {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: 100, whiteSpace: 'nowrap',
      background: 'rgba(52,211,153,0.1)', color: '#34d399',
      border: '1px solid rgba(52,211,153,0.3)',
      fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em',
    }}>
      Completed
    </span>
  )
}

/* ── Booking Card ── */

function InvoiceBadge({ invoice }: { invoice: InvoiceInfo }) {
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = invoice.status === 'sent' && invoice.due_date && invoice.due_date < today

  const config = isOverdue
    ? { label: 'Invoice: Overdue', bg: 'rgba(255,107,133,0.1)', color: '#ff6b85', border: 'rgba(255,107,133,0.3)' }
    : invoice.status === 'draft'
    ? { label: 'Invoice: Draft', bg: 'rgba(180,180,180,0.08)', color: 'var(--muted)', border: 'var(--border)' }
    : invoice.status === 'sent'
    ? { label: 'Invoice: Sent', bg: 'rgba(0,229,255,0.1)', color: 'var(--accent)', border: 'rgba(0,229,255,0.25)' }
    : invoice.status === 'paid'
    ? { label: 'Invoice: Paid', bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.3)' }
    : { label: `Invoice: ${invoice.status}`, bg: 'rgba(180,180,180,0.08)', color: 'var(--muted)', border: 'var(--border)' }

  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
      background: config.bg, color: config.color, border: `1px solid ${config.border}`,
      whiteSpace: 'nowrap',
    }}>
      {config.label}
    </span>
  )
}

function BookingCard({ booking, onViewDetails, onCancel, onForwardToTeam, onToast, isUpcoming, invoiceInfo, showInvoiceBtn, onSubmitInvoice }: {
  booking: Booking
  onViewDetails: () => void
  onCancel: () => void
  onForwardToTeam: () => void
  onToast: (msg: string) => void
  isUpcoming: boolean
  invoiceInfo: InvoiceInfo | null
  showInvoiceBtn: boolean
  onSubmitInvoice: () => void
}) {
  const isCancelled = booking.status === 'cancelled'
  const isCompleted = booking.status === 'completed'

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '24px 24px', marginBottom: 24,
      opacity: isCancelled ? 0.75 : 1,
    }}>
      <div className="dash-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif" }}>{booking.title || 'Booking'}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>{booking.requester_name || 'Client'} · {booking.specialization || 'General'}</div>
        </div>
        <div className="dash-card-badges" style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          {invoiceInfo && <InvoiceBadge invoice={invoiceInfo} />}
          {booking.is_seed && <DemoBadge />}
          {isCancelled
            ? <CancelledBadge reason={booking.cancellation_reason} />
            : isCompleted
            ? <CompletedBadge />
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
        {!isCancelled && !isCompleted && isUpcoming && <CalendarDropdown booking={booking} onToast={onToast} />}
        {!isCancelled && showInvoiceBtn && !invoiceInfo?.status?.match(/^(sent|paid)$/) && (
          <GhostButton onClick={onSubmitInvoice}>
            {invoiceInfo?.status === 'draft' ? 'Edit Invoice' : 'Submit Invoice'}
          </GhostButton>
        )}
        {!isCancelled && invoiceInfo?.status?.match(/^(sent|paid)$/) && (
          <GhostButton onClick={() => window.open(`/interpreter/dashboard/invoices/${invoiceInfo.id}`, '_blank')}>
            View Invoice
          </GhostButton>
        )}
        {!isCancelled && !isCompleted && <GhostButton danger onClick={onCancel}>Cancel Booking</GhostButton>}
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
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewing, setViewing] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [forwarding, setForwarding] = useState<string | null>(null)
  const [invoicing, setInvoicing] = useState<string | null>(null)
  const [interpreterId, setInterpreterId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [invoicingPref, setInvoicingPref] = useState<string>('own')
  const [invoiceMap, setInvoiceMap] = useState<Record<string, InvoiceInfo>>({})
  const backfillDone = useRef(false)

  const fetchBookings = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile, error: profileErr } = await supabase
      .from('interpreter_profiles')
      .select('id, invoicing_preference')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) { setLoading(false); return }
    setInterpreterId(profile.id)
    setInvoicingPref(profile.invoicing_preference || 'own')

    // Backfill completed seed bookings for existing accounts (runs once, no-ops if already seeded)
    if (!backfillDone.current) {
      backfillDone.current = true
      fetch('/api/seed-completed-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interpreterProfileId: profile.id }),
      })
        .then(res => res.json())
        .then(result => {
          if (result.inserted && result.inserted > 0) {
            // Re-fetch bookings to include newly seeded completed bookings
            fetchBookings()
          }
        })
        .catch(err => console.error('[confirmed] backfill failed:', err))
    }

    // Two-step fetch to avoid RLS nested embed bug (bookings RLS doesn't recognize
    // interpreter via booking_recipients, only via bookings.interpreter_id)
    const { data: recipientRows, error: recipientErr } = await supabase
      .from('booking_recipients')
      .select('id, status, rate_profile_id, booking_id')
      .eq('interpreter_id', profile.id)
      .in('status', ['confirmed', 'withdrawn'])

    if (recipientErr) {
      console.error('[confirmed] fetch recipients failed:', recipientErr.message)
    } else {
      const recipientBookingIds = (recipientRows || []).map(r => r.booking_id).filter(Boolean)

      let bookingsMap: Record<string, Record<string, unknown>> = {}
      if (recipientBookingIds.length > 0) {
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from('bookings')
          .select('id, title, requester_id, requester_name, specialization, date, time_start, time_end, location, format, recurrence, description, notes, status, is_seed, cancellation_reason, sub_search_initiated, context_video_url')
          .in('id', recipientBookingIds)

        if (bookingsErr) {
          console.error('[confirmed] bookings fetch error:', bookingsErr.message, bookingsErr.details)
        }

        if (bookingsData) {
          for (const b of bookingsData) {
            bookingsMap[b.id] = b
          }
        }
      }

      const data = (recipientRows || [])
        .filter(r => bookingsMap[r.booking_id])
        .map(r => {
          const b = bookingsMap[r.booking_id]
          // Determine display status: use booking status for completed/cancelled, otherwise confirmed
          let displayStatus = 'confirmed'
          if (b.status === 'completed') displayStatus = 'completed'
          else if (b.status === 'cancelled' || r.status === 'withdrawn') displayStatus = 'cancelled'
          return {
            ...b,
            recipient_id: r.id as string,
            rate_profile_id: r.rate_profile_id as string | null,
            status: displayStatus,
          } as unknown as Booking
        })
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      setBookings(data)

      // Fetch invoice status for all bookings
      const bookingIds = (data || []).map(b => b.id)
      if (bookingIds.length > 0) {
        const { data: invoices, error: invErr } = await supabase
          .from('invoices')
          .select('id, booking_id, status, invoice_number, due_date')
          .eq('interpreter_id', profile.id)
          .in('booking_id', bookingIds)

        if (!invErr && invoices) {
          const map: Record<string, InvoiceInfo> = {}
          for (const inv of invoices) {
            if (inv.booking_id) {
              // Keep the most relevant invoice per booking (sent > draft > void)
              const existing = map[inv.booking_id]
              if (!existing || inv.status === 'sent' || inv.status === 'paid' || (inv.status === 'draft' && existing.status === 'void')) {
                map[inv.booking_id] = { id: inv.id, status: inv.status, invoice_number: inv.invoice_number, due_date: inv.due_date }
              }
            }
          }
          setInvoiceMap(map)
        }
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // Auto-open invoice modal from ?invoice=bookingId query param
  const invoiceParamHandled = useRef(false)
  useEffect(() => {
    if (invoiceParamHandled.current || loading) return
    const invoiceBookingId = searchParams.get('invoice')
    if (invoiceBookingId && bookings.some(b => b.id === invoiceBookingId)) {
      invoiceParamHandled.current = true
      setInvoicing(invoiceBookingId)
    }
  }, [searchParams, loading, bookings])

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

  // Timezone-aware today: use local date, not UTC
  const today = (() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })()

  const searchFilter = (b: Booking) =>
    !search || [b.title || '', b.requester_name || '', b.specialization || '', b.location || ''].join(' ').toLowerCase().includes(search.toLowerCase())

  const dateFiltered = filterByDateRange(bookings, dateFrom, dateTo)

  const upcomingConfirmed = dateFiltered
    .filter(b => b.status === 'confirmed' && b.date >= today)
    .filter(searchFilter)

  const pastCompleted = dateFiltered
    .filter(b => b.status === 'completed' && b.date < today)
    .filter(searchFilter)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '')) // most recent first

  const cancelled = dateFiltered
    .filter(b => b.status === 'cancelled')
    .filter(searchFilter)

  const hasSeedData = bookings.some(b => b.is_seed)

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      {hasSeedData && <BetaBanner />}
      <PageHeader title="Confirmed Bookings" subtitle="All your accepted and confirmed bookings." />

      <BookingFilterBar
        search={search} onSearchChange={setSearch}
        dateFrom={dateFrom} onDateFromChange={setDateFrom}
        dateTo={dateTo} onDateToChange={setDateTo}
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Loading...
        </div>
      ) : (
        <>
          {/* Section 1: Upcoming */}
          <SectionLabel>Upcoming</SectionLabel>
          {upcomingConfirmed.length === 0 ? (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '32px 24px',
              color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
            }}>
              No upcoming confirmed bookings.
            </div>
          ) : (
            groupByTimeCategory(upcomingConfirmed).map((group, gi) => (
              <div key={group.label}>
                <div style={{ ...timeCategoryHeaderStyle, marginTop: gi === 0 ? 0 : 32 }}>{group.label}</div>
                {group.items.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onViewDetails={() => setViewing(b.id)}
                    onCancel={() => setCancelling(b.id)}
                    onForwardToTeam={() => setForwarding(b.id)}
                    onToast={showToast}
                    isUpcoming
                    invoiceInfo={invoiceMap[b.id] || null}
                    showInvoiceBtn={invoicingPref === 'signpost'}
                    onSubmitInvoice={() => setInvoicing(b.id)}
                  />
                ))}
              </div>
            ))
          )}

          {/* Section 2: Past — Completed */}
          {pastCompleted.length > 0 && (
            <>
              <SectionLabel>Past — Completed</SectionLabel>
              {pastCompleted.map(b => (
                <BookingCard
                  key={`past-${b.id}`}
                  booking={b}
                  onViewDetails={() => setViewing(b.id)}
                  onCancel={() => {}}
                  onForwardToTeam={() => {}}
                  onToast={showToast}
                  isUpcoming={false}
                  invoiceInfo={invoiceMap[b.id] || null}
                  showInvoiceBtn={invoicingPref === 'signpost'}
                  onSubmitInvoice={() => setInvoicing(b.id)}
                />
              ))}
            </>
          )}

          {/* Section 3: Cancelled */}
          {cancelled.length > 0 && (
            <>
              <SectionLabel>Cancelled</SectionLabel>
              {cancelled.map(b => (
                <BookingCard
                  key={`cancelled-${b.id}`}
                  booking={b}
                  onViewDetails={() => setViewing(b.id)}
                  onCancel={() => {}}
                  onForwardToTeam={() => setForwarding(b.id)}
                  onToast={showToast}
                  isUpcoming={false}
                  invoiceInfo={invoiceMap[b.id] || null}
                  showInvoiceBtn={false}
                  onSubmitInvoice={() => {}}
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
          currentInterpreterId={interpreterId}
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

      {/* Invoice modal */}
      {invoicing && interpreterId && bookings.find(b => b.id === invoicing) && (
        <InvoiceModal
          booking={bookings.find(b => b.id === invoicing)!}
          interpreterId={interpreterId}
          onClose={() => setInvoicing(null)}
          onSaved={(status) => {
            setInvoicing(null)
            showToast(status === 'sent' ? 'Invoice sent. A printable copy has been generated.' : 'Invoice draft saved.')
            fetchBookings()
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
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
