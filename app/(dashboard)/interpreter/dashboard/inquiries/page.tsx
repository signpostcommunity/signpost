'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, StatusBadge, DemoBadge, GhostButton, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import { getVideoEmbedUrl } from '@/lib/videoUtils'
import { sendNotification } from '@/lib/notifications'
import BookingFilterBar, { filterBySearch, filterByDateRange, groupByTimeCategory, timeCategoryHeaderStyle } from '@/components/dashboard/shared/BookingFilterBar'
import { decryptBatchClient } from '@/lib/decrypt-client'

/* ── Types ── */

interface Booking {
  id: string
  recipient_id: string
  recipient_status: string
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
  notes: string | null
  status: string
  is_seed: boolean | null
  created_at: string
  request_type: string | null
  dhh_client_name: string | null
  context_video_url: string | null
  context_video_visible_before_accept: boolean | null
  profile_video_url: string | null
  dhh_bio: string | null
  share_intro_text_before_confirm: boolean | null
  share_intro_video_before_confirm: boolean | null
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

/* ── Styles ── */

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 20,
}

const modalStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '28px 32px',
  width: '100%', maxWidth: 520,
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
  color: 'var(--text)', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem',
  outline: 'none',
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', color: '#c8cdd8',
  fontWeight: 500, marginBottom: 6,
}

function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--accent)'
}
function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border)'
}

/* ── Accept & Send Rate Modal ── */

function AcceptModal({ booking, onClose, onAccepted }: {
  booking: Booking
  onClose: () => void
  onAccepted: () => void
}) {
  const [sent, setSent] = useState(false)
  const [rateProfile, setRateProfile] = useState('standard')
  const [customHourly, setCustomHourly] = useState('')
  const [customMinHours, setCustomMinHours] = useState('')
  const [customCancellation, setCustomCancellation] = useState('48 hours notice required')
  const [customTerms, setCustomTerms] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSend() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('booking_recipients')
      .update({
        status: 'responded',
        responded_at: new Date().toISOString(),
        response_notes: note || null,
      })
      .eq('id', booking.recipient_id)

    if (error) {
      console.error('[inquiries] accept failed:', error.message)
      setSaving(false)
      return
    }

    // Send notifications
    if (user) {
      const locationDisplay = booking.format === 'remote' ? 'Remote' : (booking.location?.split(',')[0] || 'TBD')
      const dateStr = booking.date ? new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'
      const timeDisplay = formatTime(booking.time_start, booking.time_end)
      const formatDisplay = booking.format === 'in_person' ? 'In Person' : booking.format === 'remote' ? 'Remote' : (booking.format || '')

      // Look up interpreter name for notifications
      const interpSupabase = createClient()
      const { data: interpSelf } = await interpSupabase
        .from('interpreter_profiles')
        .select('first_name, last_name, name')
        .eq('user_id', user.id)
        .maybeSingle()
      const selfName = interpSelf?.first_name
        ? `${interpSelf.first_name} ${interpSelf.last_name || ''}`.trim()
        : interpSelf?.name || 'Your interpreter'

      const bookingMeta = {
        booking_id: booking.id,
        booking_title: booking.title || '',
        booking_date: dateStr,
        booking_time: timeDisplay,
        booking_location: locationDisplay,
        booking_format: booking.format || '',
        requester_name: booking.requester_name || '',
        interpreter_name: selfName,
      }

      // Notify interpreter (self-confirmation)
      sendNotification({
        recipientUserId: user.id,
        type: 'booking_confirmed',
        subject: `Booking confirmed: ${booking.title || 'Booking'}, ${dateStr}`,
        body: `Your booking for ${booking.title || 'Booking'} on ${dateStr} with ${booking.requester_name || 'the requester'} has been confirmed.`,
        metadata: { ...bookingMeta, recipient_role: 'interpreter' },
        ctaText: 'View Confirmed Booking',
        ctaUrl: 'https://signpost.community/interpreter/dashboard/confirmed',
      }).catch(err => console.error('[inquiries] confirm notification failed:', err))

      // Notify requester about rate response + booking confirmation
      if (booking.requester_id) {
        sendNotification({
          recipientUserId: booking.requester_id,
          type: 'rate_response',
          subject: `${selfName} responded to your request on signpost`,
          body: `${selfName} sent their rate for ${booking.title || 'your booking request'}. Review their rate and terms, then accept or decline.`,
          metadata: {
            ...bookingMeta,
            recipient_role: 'requester',
            recipient_id: booking.recipient_id,
            rate: customHourly || '',
            min_hours: customMinHours || '',
            cancellation_policy: customCancellation || '',
            interpreter_note: note || '',
          },
          ctaText: 'Review and Accept',
          ctaUrl: `https://signpost.community/request/dashboard/accept/${booking.id}/${booking.recipient_id}`,
        }).catch(err => console.error('[inquiries] rate_response notification failed:', err))

        sendNotification({
          recipientUserId: booking.requester_id,
          type: 'booking_confirmed',
          subject: `Booking confirmed: ${booking.title || 'Booking'}, ${dateStr}`,
          body: `${selfName} has been confirmed for your request.`,
          metadata: { ...bookingMeta, recipient_role: 'requester' },
          ctaText: 'View Booking Details',
          ctaUrl: 'https://signpost.community/request/dashboard/requests',
        }).catch(err => console.error('[inquiries] requester confirm notification failed:', err))
      }
    }

    setSent(true)
    setSaving(false)
  }

  if (sent) return (
    <div style={overlayStyle}>
      <div className="modal-dialog" style={modalStyle}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>✓</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)', marginBottom: 8 }}>
            Rate sent!
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 20px' }}>
            {booking.is_seed
              ? `This is a sample flow. No message was actually sent. The booking has been moved to Confirmed.`
              : `${booking.requester_name || 'The requester'} will receive your rate and can confirm the booking.`
            }
          </p>
          <button className="btn-primary" onClick={() => { onClose(); onAccepted() }} style={{ padding: '10px 28px' }}>Done</button>
        </div>
      </div>
    </div>
  )

  const rateSummaries: Record<string, string> = {
    standard: 'Standard Rate — $95/hr · 2hr minimum · 48hr cancellation · 100% late fee',
    community: 'Community / Nonprofit Rate — $65/hr · 2hr minimum · 48hr cancellation',
    multiday: 'Multi-Day Rate — $750/day · 2-day minimum · 2-week cancellation',
  }

  return (
    <div style={overlayStyle}>
      <div className="modal-dialog" style={{ ...modalStyle, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1rem' }}>Send Rate — {booking.title || 'Booking'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabelStyle}>Rate Profile</label>
          <select value={rateProfile} onChange={e => setRateProfile(e.target.value)} style={fieldInputStyle} onFocus={focusBorder} onBlur={blurBorder}>
            <option value="standard">Standard Rate</option>
            <option value="community">Community / Nonprofit Rate</option>
            <option value="multiday">Multi-Day Rate</option>
            <option value="custom">Create a custom rate for this requester</option>
          </select>
        </div>

        {rateProfile !== 'custom' && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 18, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Rate profile:</strong> {rateSummaries[rateProfile]}
          </div>
        )}

        {rateProfile === 'custom' && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '18px 20px', marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={fieldLabelStyle}>Hourly Rate ($)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '0.9rem', pointerEvents: 'none' }}>$</span>
                  <input type="text" placeholder="0.00" value={customHourly} onChange={e => setCustomHourly(e.target.value)} style={{ ...fieldInputStyle, paddingLeft: 28 }} onFocus={focusBorder} onBlur={blurBorder} />
                </div>
              </div>
              <div>
                <label style={fieldLabelStyle}>Minimum Hours</label>
                <input type="text" placeholder="e.g. 2" value={customMinHours} onChange={e => setCustomMinHours(e.target.value)} style={fieldInputStyle} onFocus={focusBorder} onBlur={blurBorder} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabelStyle}>Cancellation Policy</label>
              <select value={customCancellation} onChange={e => setCustomCancellation(e.target.value)} style={fieldInputStyle} onFocus={focusBorder} onBlur={blurBorder}>
                <option>24 hours notice required</option>
                <option>48 hours notice required</option>
                <option>72 hours notice required</option>
                <option>1 week notice required</option>
              </select>
            </div>
            <div>
              <label style={fieldLabelStyle}>Additional Terms (optional)</label>
              <textarea placeholder="Any special terms or conditions for this job..." value={customTerms} onChange={e => setCustomTerms(e.target.value)} style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 70 }} onFocus={focusBorder} onBlur={blurBorder} />
            </div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Message to {booking.requester_name || 'requester'} (optional)</label>
          <textarea
            placeholder={`Hi ${booking.requester_name || 'there'}, I'd be happy to assist with this. Here are my rates and terms...`}
            value={note} onChange={e => setNote(e.target.value)}
            style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 90 }}
            onFocus={focusBorder} onBlur={blurBorder}
          />
        </div>

        <div className="dash-card-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button className="btn-primary" onClick={handleSend} disabled={saving} style={{ padding: '9px 22px', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Sending…' : 'Send Rate & Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Detail Modal ── */

function DetailModal({ booking, onClose }: {
  booking: Booking
  onClose: () => void
}) {
  const isRemote = booking.format === 'remote'

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: '#00e5ff', marginBottom: 14,
  }
  const detailRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 6,
  }
  const iconStyle: React.CSSProperties = { color: 'var(--muted)', flexShrink: 0, marginTop: 2 }
  const sectionStyle: React.CSSProperties = { padding: '16px 0', borderBottom: '1px solid var(--border)' }

  return (
    <div role="presentation" style={overlayStyle} onClick={onClose}>
      <div className="modal-dialog" style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '90%', maxWidth: 560,
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>{booking.title || 'Booking Request'}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>✕</button>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: 'rgba(255,165,0,0.12)', color: '#f97316',
            border: '1px solid rgba(249,115,22,0.25)',
          }}>
            Awaiting Response
          </span>
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
                {booking.recurrence && booking.recurrence !== 'one-time' && (
                  <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Recurring</div>
                )}
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
              <div>
                {isRemote ? 'Remote — Zoom link will be provided upon confirmation' : (booking.location || 'Location TBD')}
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Requester</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <div>
                <div style={{ fontWeight: 600 }}>{booking.requester_name || 'Name withheld'}</div>
              </div>
            </div>
          </div>

          {(booking.notes || booking.specialization) && (
            <div style={sectionStyle}>
              <div style={sectionLabelStyle}>Job Context</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                {booking.notes || `${booking.specialization} appointment — no additional context provided.`}
              </div>
            </div>
          )}

          {/* Written introduction from D/HH client */}
          {booking.dhh_bio && (() => {
            const shareBefore = booking.share_intro_text_before_confirm !== false
            if (!shareBefore) {
              return (
                <div style={sectionStyle}>
                  <div style={sectionLabelStyle}>Introduction</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                    Introduction available after confirmation
                  </div>
                </div>
              )
            }
            return (
              <div style={sectionStyle}>
                <div style={sectionLabelStyle}>Introduction from {booking.requester_name || booking.dhh_client_name || 'client'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                  {booking.dhh_bio}
                </div>
              </div>
            )
          })()}

          {/* Profile video from D/HH client */}
          {booking.profile_video_url && (() => {
            const shareBefore = booking.share_intro_video_before_confirm !== false
            if (!shareBefore) {
              return (
                <div style={sectionStyle}>
                  <div style={sectionLabelStyle}>Intro Video</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                    Introduction available after confirmation
                  </div>
                </div>
              )
            }
            const embedUrl = getVideoEmbedUrl(booking.profile_video_url!)
            if (!embedUrl) return null
            return (
              <div style={sectionStyle}>
                <div style={sectionLabelStyle}>Intro video from {booking.requester_name || booking.dhh_client_name || 'client'}</div>
                {embedUrl.includes('supabase.co/storage') ? (
                  <video controls width="100%" src={embedUrl} style={{ borderRadius: 8, maxHeight: 220, background: '#000' }} />
                ) : (
                  <iframe width="100%" height="220" src={embedUrl} title="Intro video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                    style={{ borderRadius: 8, border: 'none' }} />
                )}
              </div>
            )
          })()}

          {/* Context video */}
          {booking.context_video_url && (() => {
            const visible = booking.context_video_visible_before_accept !== false
            if (!visible) {
              return (
                <div style={sectionStyle}>
                  <div style={sectionLabelStyle}>Context Video</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                    This request includes a context video that will be available after you accept.
                  </div>
                </div>
              )
            }
            const embedUrl = getVideoEmbedUrl(booking.context_video_url!)
            if (!embedUrl) return null
            return (
              <div style={sectionStyle}>
                <div style={sectionLabelStyle}>Context video from {booking.requester_name || booking.dhh_client_name || 'client'}</div>
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

          <div style={{ padding: '16px 0' }}>
            <div style={sectionLabelStyle}>Attachments &amp; Materials</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>None provided</div>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <GhostButton onClick={onClose}>Close</GhostButton>
        </div>
      </div>
    </div>
  )
}

/* ── Decline Modal ── */

const DECLINE_REASONS = ['Not Available', 'Not a Good Fit', 'Scheduling Conflict', 'Prefer Not To Say', 'Other'] as const

function DeclineModal({ booking, onConfirm, onClose }: {
  booking: Booking
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState<string | null>(null)
  const [otherText, setOtherText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleDecline() {
    if (!reason) return
    setSaving(true)
    const supabase = createClient()
    const finalReason = reason === 'Other' && otherText ? `Other: ${otherText}` : reason
    const { error } = await supabase
      .from('booking_recipients')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: finalReason,
      })
      .eq('id', booking.recipient_id)

    if (error) {
      console.error('[inquiries] decline failed:', error.message)
      setSaving(false)
      return
    }
    onConfirm(finalReason)
  }

  return (
    <div style={overlayStyle}>
      <div className="modal-dialog" style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1rem' }}>Decline: {booking.title || 'Booking'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 20 }}>
          Select a reason for declining. The requester will be shown your reason so they can find the right interpreter for their needs.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {DECLINE_REASONS.map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              style={{
                background: reason === r ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                border: `1px solid ${reason === r ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                color: reason === r ? 'var(--accent)' : 'var(--text)',
                fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left',
                fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {reason === 'Other' && (
          <div style={{ marginBottom: 24, marginTop: -16 }}>
            <textarea
              placeholder="Please describe your reason..."
              value={otherText} onChange={e => setOtherText(e.target.value)}
              style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 70 }}
              onFocus={focusBorder} onBlur={blurBorder}
            />
          </div>
        )}

        <div className="dash-card-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button
            className="btn-primary"
            onClick={handleDecline}
            disabled={!reason || saving}
            style={{ padding: '9px 22px', opacity: reason && !saving ? 1 : 0.4, pointerEvents: reason && !saving ? 'auto' : 'none' }}
          >
            {saving ? 'Declining…' : 'Confirm Decline'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */

export default function InquiriesPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [declining, setDeclining] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchBookings = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Get interpreter profile id
    const { data: profile, error: profileErr } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) { setLoading(false); return }

    // Two-step fetch to avoid RLS nested embed bug (bookings RLS doesn't recognize
    // interpreter via booking_recipients, only via bookings.interpreter_id)
    const { data: recipientRows, error: recipientErr } = await supabase
      .from('booking_recipients')
      .select('id, status, sent_at, booking_id')
      .eq('interpreter_id', profile.id)
      .in('status', ['sent', 'viewed', 'responded'])
      .order('sent_at', { ascending: false })

    if (recipientErr) {
      console.error('[inquiries] fetch recipients failed:', recipientErr.message)
    } else {
      const bookingIds = (recipientRows || []).map(r => r.booking_id).filter(Boolean)

      let bookingsMap: Record<string, Record<string, unknown>> = {}
      if (bookingIds.length > 0) {
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from('bookings')
          .select('id, title, requester_id, requester_name, specialization, date, time_start, time_end, location, format, recurrence, notes, status, is_seed, created_at, request_type, context_video_url')
          .in('id', bookingIds)

        if (bookingsErr) {
          console.error('[inquiries] bookings fetch error:', bookingsErr.message, bookingsErr.details)
        }

        if (bookingsData) {
          for (const b of bookingsData) {
            bookingsMap[b.id] = b
          }
        }
      }

      const mapped = (recipientRows || [])
        .filter(r => bookingsMap[r.booking_id])
        .map(r => {
          const b = bookingsMap[r.booking_id]
          return {
            ...b,
            recipient_id: r.id as string,
            recipient_status: r.status as string,
            dhh_client_name: null,
          } as unknown as Booking
        })

      // For personal requests, fetch D/HH client names via booking_dhh_clients join table
      const personalBookings = mapped.filter(b => b.request_type === 'personal')
      if (personalBookings.length > 0) {
        const personalIds = personalBookings.map(b => b.id)
        const { data: dhhLinks } = await supabase
          .from('booking_dhh_clients')
          .select('booking_id, dhh_user_id')
          .in('booking_id', personalIds)
        if (dhhLinks && dhhLinks.length > 0) {
          const dhhClientIds = [...new Set(dhhLinks.map(l => l.dhh_user_id))]
          const { data: deafProfiles } = await supabase
            .from('deaf_profiles')
            .select('user_id, first_name, last_name, bio, profile_video_url, share_intro_text_before_confirm, share_intro_video_before_confirm')
            .in('user_id', dhhClientIds)
          if (deafProfiles) {
            const nameMap: Record<string, string> = {}
            const videoMap: Record<string, string> = {}
            const bioMap: Record<string, string> = {}
            const shareTextMap: Record<string, boolean> = {}
            const shareVideoMap: Record<string, boolean> = {}
            for (const dp of deafProfiles) {
              nameMap[dp.user_id] = [dp.first_name, dp.last_name].filter(Boolean).join(' ')
              if (dp.profile_video_url) videoMap[dp.user_id] = dp.profile_video_url
              if (dp.bio) bioMap[dp.user_id] = dp.bio
              shareTextMap[dp.user_id] = dp.share_intro_text_before_confirm !== false
              shareVideoMap[dp.user_id] = dp.share_intro_video_before_confirm !== false
            }
            // Map booking_id → dhh_user_id for lookup
            const bookingDhhMap: Record<string, string> = {}
            for (const l of dhhLinks) {
              bookingDhhMap[l.booking_id] = l.dhh_user_id
            }
            for (const b of mapped) {
              const clientId = bookingDhhMap[b.id]
              if (b.request_type === 'personal' && clientId) {
                if (nameMap[clientId]) b.dhh_client_name = nameMap[clientId]
                if (videoMap[clientId]) b.profile_video_url = videoMap[clientId]
                if (bioMap[clientId]) b.dhh_bio = bioMap[clientId]
                b.share_intro_text_before_confirm = shareTextMap[clientId] ?? true
                b.share_intro_video_before_confirm = shareVideoMap[clientId] ?? true
              }
            }
          }
        }
      }

      // Decrypt encrypted fields (title, notes) server-side
      const decrypted = await decryptBatchClient(mapped, ['title', 'notes'])
      setBookings(decrypted)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleDeclined(id: string, reason: string) {
    setBookings(prev => prev.filter(b => b.id !== id))
    setDeclining(null)
    showToast(`Declined — ${reason}`)
  }

  function handleAccepted() {
    // Refresh the list after accepting
    setAccepting(null)
    fetchBookings()
  }

  const hasSeedData = bookings.some(b => b.is_seed)

  const filteredBookings = filterByDateRange(
    filterBySearch(bookings, search, ['title', 'requester_name', 'specialization', 'location', 'notes']),
    dateFrom, dateTo
  )
  const groupedBookings = groupByTimeCategory(filteredBookings)

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <PageHeader title="Inquiries" subtitle="Booking requests awaiting your response." />

      <BookingFilterBar
        search={search} onSearchChange={setSearch}
        dateFrom={dateFrom} onDateFromChange={setDateFrom}
        dateTo={dateTo} onDateToChange={setDateTo}
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Loading…
        </div>
      ) : groupedBookings.length === 0 ? (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '32px 24px',
          color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
        }}>
          No pending inquiries. They&apos;ll appear here when clients reach out.
        </div>
      ) : (
        groupedBookings.map((group, gi) => (
          <div key={group.label} style={group.isPast ? { opacity: 0.6 } : undefined}>
            <div style={{ ...timeCategoryHeaderStyle, marginTop: gi === 0 ? 0 : 32 }}>{group.label}</div>
            {group.items.map(inq => (
          <div key={inq.id} style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '24px 24px', marginBottom: 24,
          }}>
            <div className="dash-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Inter', sans-serif" }}>{inq.title || 'Booking Request'}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>
                  From: {inq.requester_name || 'Unknown'} · {inq.specialization || 'General'}
                  {inq.request_type === 'personal' && inq.dhh_client_name && (
                    <span> · Client: {inq.dhh_client_name}</span>
                  )}
                </div>
              </div>
              <div className="dash-card-badges" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {inq.is_seed && <DemoBadge />}
                <StatusBadge status="pending" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              <span>📅 {formatDate(inq.date)}</span>
              <span>🕐 {formatTime(inq.time_start, inq.time_end)}</span>
              <span>📍 {inq.location || 'TBD'}</span>
              <span>{inq.format === 'remote' ? 'Remote' : 'On-site'}</span>
              {inq.recurrence && inq.recurrence !== 'one-time' && <span>🔁 Recurring</span>}
            </div>
            {inq.notes && (
              <div style={{
                fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.6,
                borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4,
                fontStyle: 'italic',
              }}>
                &quot;{inq.notes}&quot;
              </div>
            )}
            <div className="dash-card-actions" style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button className="btn-primary" style={{ fontSize: '0.82rem', padding: '8px 18px' }} onClick={() => setAccepting(inq.id)}>
                Accept &amp; Send Rate
              </button>
              <GhostButton onClick={() => {
                setViewing(inq.id)
                if (inq.recipient_status === 'sent') {
                  const supabase = createClient()
                  supabase
                    .from('booking_recipients')
                    .update({ status: 'viewed', viewed_at: new Date().toISOString() })
                    .eq('id', inq.recipient_id)
                    .eq('status', 'sent')
                    .then(() => {
                      setBookings(prev => prev.map(b => b.id === inq.id ? { ...b, recipient_status: 'viewed' } : b))
                    })
                }
              }}>View Details</GhostButton>
              <GhostButton danger onClick={() => setDeclining(inq.id)}>Decline</GhostButton>
            </div>
          </div>
            ))}
          </div>
        ))
      )}

      {accepting && bookings.find(b => b.id === accepting) && (
        <AcceptModal
          booking={bookings.find(b => b.id === accepting)!}
          onClose={() => setAccepting(null)}
          onAccepted={handleAccepted}
        />
      )}

      {viewing && bookings.find(b => b.id === viewing) && (
        <DetailModal
          booking={bookings.find(b => b.id === viewing)!}
          onClose={() => setViewing(null)}
        />
      )}

      {declining && bookings.find(b => b.id === declining) && (
        <DeclineModal
          booking={bookings.find(b => b.id === declining)!}
          onConfirm={reason => handleDeclined(declining, reason)}
          onClose={() => setDeclining(null)}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid rgba(255,77,109,0.3)',
          borderRadius: 'var(--radius)', padding: '14px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.85rem', color: 'var(--accent3)',
        }}>
          {toast}
        </div>
      )}

      <DashMobileStyles />
    </div>
  )
}
