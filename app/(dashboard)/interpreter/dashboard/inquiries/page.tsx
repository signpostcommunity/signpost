'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, StatusBadge, DemoBadge, GhostButton, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import { getVideoEmbedUrl } from '@/lib/videoUtils'
import { displayBookingFormat } from '@/lib/bookingFormat'
import { sendNotification } from '@/lib/notifications'
import BookingFilterBar, { filterBySearch, filterByDateRange, groupByTimeCategory, timeCategoryHeaderStyle } from '@/components/dashboard/shared/BookingFilterBar'
import { decryptBatchClient } from '@/lib/decrypt-client'
import TimePicker from '@/components/shared/TimePicker'

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
  interpreter_count: number | null
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
  prep_notes: string | null
  onsite_contact_name: string | null
  onsite_contact_phone: string | null
  onsite_contact_email: string | null
}

interface BookingAttachment {
  id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
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

interface FetchedRateProfile {
  id: string
  interpreter_id: string
  label: string
  is_default: boolean | null
  hourly_rate: number | null
  currency: string | null
  min_booking: number | null
  cancellation_policy: string | null
  late_cancel_fee: number | null
  additional_terms: string | null
}

function AcceptModal({ booking, onClose, onAccepted }: {
  booking: Booking
  onClose: () => void
  onAccepted: () => void
}) {
  const [sent, setSent] = useState(false)
  const [profiles, setProfiles] = useState<FetchedRateProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [useCustom, setUseCustom] = useState(false)
  const [customHourly, setCustomHourly] = useState('')
  const [customMinHours, setCustomMinHours] = useState('')
  const [customCancellation, setCustomCancellation] = useState('48 hours notice required')
  const [customTerms, setCustomTerms] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Fetch real rate profiles for the current interpreter
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        const { data: interpProfile } = await supabase
          .from('interpreter_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!interpProfile) { setLoading(false); return }
        const { data: rateProfiles, error: rateErr } = await supabase
          .from('interpreter_rate_profiles')
          .select('id, interpreter_id, label, is_default, hourly_rate, currency, min_booking, cancellation_policy, late_cancel_fee, additional_terms')
          .eq('interpreter_id', interpProfile.id)
          .order('is_default', { ascending: false })
        if (rateErr) {
          console.error('[AcceptModal] rate profile fetch failed:', rateErr.message)
          setFetchError('Could not load rate profiles. You can enter a rate manually below.')
          setUseCustom(true)
          setLoading(false)
          return
        }
        if (rateProfiles && rateProfiles.length > 0) {
          setProfiles(rateProfiles as FetchedRateProfile[])
          const defaultP = rateProfiles.find(r => r.is_default === true) || rateProfiles[0]
          setSelectedProfileId(defaultP.id)
        }
      } catch (err) {
        console.error('[AcceptModal] unexpected error:', err)
        setFetchError('Could not load rate profiles. You can enter a rate manually below.')
        setUseCustom(true)
      }
      setLoading(false)
    })()
  }, [])

  const activeProfile = profiles.find(p => p.id === selectedProfileId) || null

  async function handleSend() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let responseRate: number | null = null
    let rateProfileId: string | null = null

    if (useCustom) {
      responseRate = Number(customHourly) || null
    } else if (activeProfile) {
      responseRate = activeProfile.hourly_rate != null ? Number(activeProfile.hourly_rate) : null
      rateProfileId = activeProfile.id
    }

    const { error } = await supabase
      .from('booking_recipients')
      .update({
        status: 'responded',
        responded_at: new Date().toISOString(),
        response_notes: note || null,
        response_rate: responseRate,
        rate_profile_id: rateProfileId,
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

      // Look up interpreter name for notifications
      const { data: interpSelf } = await supabase
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

      // Notify requester that the interpreter has responded with a rate.
      // Do NOT send booking_confirmed here -- the booking is not confirmed on
      // response; it only becomes confirmed once the requester picks an
      // interpreter. That notification is wired from the requester-side pick.
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
            rate: String(responseRate ?? ''),
            rate_profile_id: rateProfileId || '',
            cancellation_policy: useCustom ? customCancellation : (activeProfile?.cancellation_policy || ''),
            interpreter_note: note || '',
          },
          ctaText: 'Review and Accept',
          ctaUrl: `https://signpost.community/request/dashboard/accept/${booking.id}/${booking.recipient_id}`,
        }).catch(err => console.error('[inquiries] rate_response notification failed:', err))
      }
    }

    setSent(true)
    setSaving(false)
  }

  if (sent) return (
    <div style={overlayStyle}>
      <div className="modal-dialog" style={modalStyle}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>&#10003;</div>
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

  function formatMinBooking(minutes: number | null): string {
    if (!minutes) return 'No minimum'
    const hours = minutes / 60
    return `${hours} hour${hours !== 1 ? 's' : ''} minimum`
  }

  function formatLateFee(fee: number | null): string {
    if (fee == null) return 'No fee'
    if (fee === 100) return '100% of booking fee'
    if (fee === 50) return '50% of booking fee'
    return `${fee}%`
  }

  return (
    <div style={overlayStyle}>
      <div className="modal-dialog" style={{ ...modalStyle, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1rem' }}>Send Rate - {booking.title || 'Booking'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>&#10005;</button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Loading rate profiles...
          </div>
        )}

        {fetchError && (
          <div style={{
            background: 'rgba(255,126,69,0.08)',
            border: '1px solid rgba(255,126,69,0.3)',
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 12,
          }}>
            <p style={{ color: '#ff7e45', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
              {fetchError}
            </p>
          </div>
        )}

        {!loading && profiles.length === 0 && !fetchError && (
          <div style={{
            background: 'rgba(255,126,69,0.08)',
            border: '1px solid rgba(255,126,69,0.3)',
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 12,
          }}>
            <p style={{ color: '#ff7e45', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 6px' }}>
              No rate profiles found
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0 0 8px', lineHeight: 1.5 }}>
              Set up a rate profile to respond faster. You can still enter a rate manually below.
            </p>
            <a
              href="/interpreter/dashboard/rates"
              style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
            >
              Set up rate profile &#8594;
            </a>
          </div>
        )}

        {!loading && profiles.length > 0 && !useCustom && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabelStyle}>Rate Profile</label>
              <select
                value={selectedProfileId || ''}
                onChange={e => setSelectedProfileId(e.target.value)}
                style={fieldInputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}{p.is_default ? ' (default)' : ''}{p.hourly_rate != null ? ` - $${p.hourly_rate}/hr` : ''}
                  </option>
                ))}
              </select>
            </div>

            {activeProfile && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 18, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--text)' }}>{activeProfile.label}</strong>
                <br />
                {activeProfile.hourly_rate != null ? `$${activeProfile.hourly_rate}/hr` : 'Rate not set'}
                {activeProfile.currency && activeProfile.currency !== 'USD' ? ` (${activeProfile.currency})` : ''}
                {' \u00B7 '}{formatMinBooking(activeProfile.min_booking)}
                {' \u00B7 '}{activeProfile.cancellation_policy || 'No cancellation policy'}
                {activeProfile.late_cancel_fee != null && <>{' \u00B7 '}Late fee: {formatLateFee(activeProfile.late_cancel_fee)}</>}
                {activeProfile.additional_terms && (
                  <div style={{ marginTop: 6, fontStyle: 'italic' }}>{activeProfile.additional_terms}</div>
                )}
              </div>
            )}

            <button
              onClick={() => { setUseCustom(true) }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, padding: 0, marginBottom: 14, display: 'block' }}
            >
              Use a custom rate for this request instead
            </button>
          </>
        )}

        {!loading && (useCustom || (profiles.length === 0 && !fetchError)) && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '18px 20px', marginBottom: 18 }}>
            {profiles.length > 0 && (
              <button
                onClick={() => { setUseCustom(false) }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, padding: 0, marginBottom: 14, display: 'block' }}
              >
                Use a saved rate profile instead
              </button>
            )}
            <div className="inq-rate-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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

        {!loading && (
          <>
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
              <button
                className="btn-primary"
                onClick={handleSend}
                disabled={saving || (!useCustom && !activeProfile) || (useCustom && !Number(customHourly))}
                style={{ padding: '9px 22px', opacity: (saving || (!useCustom && !activeProfile) || (useCustom && !Number(customHourly))) ? 0.5 : 1 }}
              >
                {saving ? 'Sending...' : 'Send Rate & Accept'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Preparation Section (shared) ── */

function PreparationSection({ booking }: { booking: Booking }) {
  const [attachments, setAttachments] = useState<BookingAttachment[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('booking_attachments')
        .select('id, file_name, file_url, file_type, file_size')
        .eq('booking_id', booking.id)
      if (!cancelled && data) setAttachments(data as BookingAttachment[])
    })()
    return () => { cancelled = true }
  }, [booking.id])

  const hasContact = !!(booking.onsite_contact_name || booking.onsite_contact_phone || booking.onsite_contact_email)
  const hasPrep = !!booking.prep_notes
  if (!hasContact && !hasPrep && attachments.length === 0) return null

  async function openAttachment(att: BookingAttachment) {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('booking-attachments')
      .createSignedUrl(att.file_url, 60 * 5)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: '#00e5ff', marginBottom: 14,
  }

  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={sectionLabelStyle}>Preparation</div>
      {hasContact && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.65, marginBottom: hasPrep || attachments.length > 0 ? 10 : 0 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 4 }}>On-site Contact</div>
          {booking.onsite_contact_name && <div>{booking.onsite_contact_name}</div>}
          {booking.onsite_contact_phone && <div style={{ color: 'var(--muted)' }}>{booking.onsite_contact_phone}</div>}
          {booking.onsite_contact_email && <div style={{ color: 'var(--muted)' }}>{booking.onsite_contact_email}</div>}
        </div>
      )}
      {hasPrep && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.65, marginBottom: attachments.length > 0 ? 10 : 0 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 4 }}>Prep Notes</div>
          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--muted)' }}>{booking.prep_notes}</div>
        </div>
      )}
      {attachments.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 6 }}>Attachments</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attachments.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => openAttachment(a)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '7px 12px', fontSize: '0.82rem',
                  color: 'var(--text)', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  textAlign: 'left',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                {a.file_name}
              </button>
            ))}
          </div>
        </div>
      )}
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
                {isRemote ? 'Remote - Zoom link will be provided upon confirmation' : (booking.location || 'Location TBD')}
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

          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Job Details</div>
            <div className="inq-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.85rem' }}>
              <div><span style={{ color: 'var(--muted)' }}>Format:</span> {booking.format ? booking.format.replace('_', '-') : 'Not specified'}</div>
              <div><span style={{ color: 'var(--muted)' }}>Specialization:</span> {booking.specialization || 'Not specified'}</div>
              <div><span style={{ color: 'var(--muted)' }}>Interpreters requested:</span> {booking.interpreter_count ?? 1}</div>
              {booking.recurrence && booking.recurrence !== 'one-time' && (
                <div><span style={{ color: 'var(--muted)' }}>Recurrence:</span> {booking.recurrence}</div>
              )}
            </div>
          </div>

          {(booking.notes || booking.specialization) && (
            <div style={sectionStyle}>
              <div style={sectionLabelStyle}>Job Context</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                {booking.notes || `${booking.specialization} appointment - no additional context provided.`}
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

          <PreparationSection booking={booking} />
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <GhostButton onClick={onClose}>Close</GhostButton>
        </div>
      </div>
    </div>
  )
}

/* ── Suggest Alternative Modal ── */

function SuggestModal({ booking, onClose, onSent }: {
  booking: Booking
  onClose: () => void
  onSent: () => void
}) {
  const [sent, setSent] = useState(false)
  const [proposedDate, setProposedDate] = useState(booking.date || '')
  const [startTime, setStartTime] = useState(booking.time_start || '')
  const [endTime, setEndTime] = useState(booking.time_end || '')
  const [note, setNote] = useState('')
  const [rateProfile, setRateProfile] = useState('standard')
  const [customHourly, setCustomHourly] = useState('')
  const [saving, setSaving] = useState(false)

  const rateSummaries: Record<string, string> = {
    standard: 'Standard Rate - $95/hr',
    community: 'Community / Nonprofit Rate - $65/hr',
    multiday: 'Multi-Day Rate - $750/day',
  }
  const rateAmounts: Record<string, number> = { standard: 95, community: 65, multiday: 750 }

  async function handleSend() {
    if (!proposedDate || !startTime || !endTime) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const responseRate = rateProfile === 'custom' ? Number(customHourly) || null : rateAmounts[rateProfile]

    const { error } = await supabase
      .from('booking_recipients')
      .update({
        status: 'proposed',
        proposed_date: proposedDate,
        proposed_start_time: startTime,
        proposed_end_time: endTime,
        proposal_note: note || null,
        response_rate: responseRate,
        responded_at: new Date().toISOString(),
      })
      .eq('id', booking.recipient_id)

    if (error) {
      console.error('[inquiries] suggest failed:', error.message)
      setSaving(false)
      return
    }

    if (user && booking.requester_id) {
      const { data: interpSelf } = await supabase
        .from('interpreter_profiles')
        .select('first_name, last_name, name')
        .eq('user_id', user.id)
        .maybeSingle()
      const selfName = interpSelf?.first_name
        ? `${interpSelf.first_name} ${interpSelf.last_name || ''}`.trim()
        : interpSelf?.name || 'An interpreter'

      sendNotification({
        recipientUserId: booking.requester_id,
        type: 'rate_response',
        subject: `${selfName} suggested a different time for your request`,
        body: `${selfName} is interested in your request but suggests a different time.`,
        metadata: {
          booking_id: booking.id,
          booking_title: booking.title || '',
          recipient_id: booking.recipient_id,
          recipient_role: 'requester',
          interpreter_name: selfName,
          proposed_date: proposedDate,
          proposed_start_time: startTime,
          proposed_end_time: endTime,
          proposal_note: note || '',
        },
        ctaText: 'View Suggestion',
        ctaUrl: 'https://signpost.community/request/dashboard/requests',
      }).catch(err => console.error('[inquiries] suggest notification failed:', err))
    }

    setSent(true)
    setSaving(false)
  }

  if (sent) return (
    <div style={overlayStyle}>
      <div className="modal-dialog" style={modalStyle}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)', marginBottom: 8 }}>
            Suggestion sent
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 20px' }}>
            The requester has been notified of your suggested alternative time.
          </p>
          <button className="btn-primary" onClick={() => { onClose(); onSent() }} style={{ padding: '10px 28px' }}>Done</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={overlayStyle}>
      <div className="modal-dialog" style={{ ...modalStyle, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1rem' }}>Suggest Alternative Time</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>Close</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Suggested Date</label>
          <input type="date" value={proposedDate} onChange={e => setProposedDate(e.target.value)} style={fieldInputStyle} onFocus={focusBorder} onBlur={blurBorder} />
        </div>

        <div className="inq-suggest-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <TimePicker label="Start Time" value={startTime} onChange={setStartTime} />
          </div>
          <div>
            <TimePicker label="End Time" value={endTime} onChange={setEndTime} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Note to Requester</label>
          <textarea
            placeholder="e.g. I have a morning conflict but am free after 10am. Would this work?"
            value={note} onChange={e => setNote(e.target.value)}
            style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 90 }}
            onFocus={focusBorder} onBlur={blurBorder}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabelStyle}>Rate Profile</label>
          <select value={rateProfile} onChange={e => setRateProfile(e.target.value)} style={fieldInputStyle} onFocus={focusBorder} onBlur={blurBorder}>
            <option value="standard">Standard Rate</option>
            <option value="community">Community / Nonprofit Rate</option>
            <option value="multiday">Multi-Day Rate</option>
            <option value="custom">Custom rate</option>
          </select>
        </div>

        {rateProfile !== 'custom' ? (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 18, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Rate:</strong> {rateSummaries[rateProfile]}
          </div>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <label style={fieldLabelStyle}>Hourly Rate ($)</label>
            <input type="text" placeholder="0.00" value={customHourly} onChange={e => setCustomHourly(e.target.value)} style={fieldInputStyle} onFocus={focusBorder} onBlur={blurBorder} />
          </div>
        )}

        <div className="dash-card-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button className="btn-primary" onClick={handleSend} disabled={saving} style={{ padding: '9px 22px', opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Sending...' : 'Send Suggestion'}
          </button>
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

/* ── Status tabs ── */

const INTERP_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'responded', label: 'Rate Sent' },
  { key: 'proposed', label: 'Proposed' },
  { key: 'declined', label: 'Declined' },
] as const

type InterpTabKey = (typeof INTERP_TABS)[number]['key']

const TAB_STATUS_MAP: Record<string, string[]> = {
  pending: ['sent', 'viewed'],
  responded: ['responded'],
  proposed: ['proposed'],
  declined: ['declined'],
}

export default function InquiriesPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [declining, setDeclining] = useState<string | null>(null)
  const [suggesting, setSuggesting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTab, setActiveTab] = useState<InterpTabKey>('all')

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
      .in('status', ['sent', 'viewed', 'responded', 'proposed', 'declined'])
      .order('sent_at', { ascending: false })

    if (recipientErr) {
      console.error('[inquiries] fetch recipients failed:', recipientErr.message)
    } else {
      const bookingIds = (recipientRows || []).map(r => r.booking_id).filter(Boolean)

      let bookingsMap: Record<string, Record<string, unknown>> = {}
      if (bookingIds.length > 0) {
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from('bookings')
          .select('id, title, requester_id, requester_name, specialization, date, time_start, time_end, location, format, recurrence, interpreter_count, notes, status, is_seed, created_at, request_type, context_video_url, context_video_visible_before_accept, prep_notes, onsite_contact_name, onsite_contact_phone, onsite_contact_email')
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
    setDeclining(null)
    showToast(`Declined - ${reason}`)
    fetchBookings()
  }

  function handleAccepted() {
    // Refresh the list after accepting
    setAccepting(null)
    fetchBookings()
  }

  const hasSeedData = bookings.some(b => b.is_seed)

  // Tab count (against all bookings, not filtered by search/date)
  const countForTab = (key: InterpTabKey) => {
    if (key === 'all') return bookings.length
    const statuses = TAB_STATUS_MAP[key] || []
    return bookings.filter(b => statuses.includes(b.recipient_status)).length
  }

  // Filter by status tab first
  let tabFiltered = bookings
  if (activeTab !== 'all') {
    const statuses = TAB_STATUS_MAP[activeTab] || []
    tabFiltered = tabFiltered.filter(b => statuses.includes(b.recipient_status))
  }

  const filteredBookings = filterByDateRange(
    filterBySearch(tabFiltered, search, ['title', 'requester_name', 'specialization', 'location', 'notes']),
    dateFrom, dateTo
  )
  const groupedBookings = groupByTimeCategory(filteredBookings)

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <PageHeader title="Inquiries" subtitle="Booking requests awaiting your response." />

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {INTERP_TABS.map(tab => {
          const count = countForTab(tab.key)
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: active ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: active ? '1px solid rgba(0,229,255,0.3)' : '1px solid var(--border)',
                borderRadius: 100,
                padding: '7px 16px',
                color: active ? 'var(--accent)' : 'var(--muted)',
                fontSize: '0.82rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  background: active ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.06)',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  borderRadius: 8, padding: '1px 6px',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

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
                <StatusBadge status={inq.recipient_status === 'proposed' ? 'proposed' : 'pending'} />
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
              <GhostButton onClick={() => setSuggesting(inq.id)}>Interested, Suggest Alternative</GhostButton>
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

      {suggesting && bookings.find(b => b.id === suggesting) && (
        <SuggestModal
          booking={bookings.find(b => b.id === suggesting)!}
          onClose={() => setSuggesting(null)}
          onSent={() => { setSuggesting(null); fetchBookings() }}
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
      <style>{`
        @media (max-width: 640px) {
          .inq-rate-grid {
            grid-template-columns: 1fr !important;
          }
          .inq-detail-grid {
            grid-template-columns: 1fr !important;
          }
          .inq-suggest-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
