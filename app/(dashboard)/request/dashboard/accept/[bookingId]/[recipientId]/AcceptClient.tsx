'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'

/* ── Types ── */

interface BookingData {
  id: string
  title: string | null
  date: string
  time_start: string
  time_end: string
  location: string | null
  format: string | null
  specialization: string | null
  event_category: string | null
  interpreter_count: number
  interpreters_confirmed: number
  status: string
  platform_fee_amount: number | null
}

interface RecipientData {
  id: string
  status: string
  response_rate: number | null
  response_notes: string | null
}

interface RateProfileData {
  hourly_rate: number | null
  currency: string | null
  min_booking: number | null
  after_hours_diff: number | null
  cancellation_policy: string | null
  late_cancel_fee: number | null
  travel_expenses: Record<string, unknown> | null
  additional_terms: string | null
}

/* ── Helpers ── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
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

/* ── Main Component ── */

export default function AcceptClient({
  booking,
  recipient,
  interpreterName,
  rateProfile,
  dhhClientName,
}: {
  booking: BookingData
  recipient: RecipientData
  interpreterName: string
  rateProfile: RateProfileData | null
  dhhClientName: string | null
}) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [declining, setDeclining] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const rate = recipient.response_rate ?? rateProfile?.hourly_rate ?? 0
  const currency = rateProfile?.currency || 'USD'

  async function handleConfirm() {
    setConfirming(true)
    try {
      const supabase = createClient()

      // 1. Update booking_recipients status to confirmed
      const { error: recErr } = await supabase
        .from('booking_recipients')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', recipient.id)

      if (recErr) {
        console.error('[accept] recipient update error:', recErr.message)
        setToast({ message: 'Failed to confirm booking. Please try again.', type: 'error' })
        setConfirming(false)
        return
      }

      // 2. Update bookings status to filled
      const { error: bookingStatusErr } = await supabase
        .from('bookings')
        .update({ status: 'filled' })
        .eq('id', booking.id)

      if (bookingStatusErr) {
        console.error('[accept] booking status update error:', bookingStatusErr.message)
      }

      // 3. Update interpreters_confirmed count
      const { data: allRecs } = await supabase
        .from('booking_recipients')
        .select('id, status')
        .eq('booking_id', booking.id)

      const confirmedCount = (allRecs || []).filter(r => r.status === 'confirmed').length

      const { error: countErr } = await supabase
        .from('bookings')
        .update({ interpreters_confirmed: confirmedCount })
        .eq('id', booking.id)

      if (countErr) {
        console.error('[accept] confirmed count update error:', countErr.message)
      }

      // 4. Charge $15 platform fee (non-blocking — booking still confirms on failure)
      try {
        const chargeRes = await fetch('/api/stripe/charge-platform-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id }),
        })
        const chargeData = await chargeRes.json()
        if (chargeData.status === 'failed') {
          console.warn('[accept] Platform fee charge failed — requester notified')
        }
      } catch (chargeErr) {
        console.error('[accept] Platform fee charge error:', chargeErr)
      }

      setToast({ message: `Booking confirmed. ${interpreterName} has been notified.`, type: 'success' })
      setShowConfirm(false)
      setConfirming(false)

      // Notify sidebar
      window.dispatchEvent(new Event('signpost:unread-changed'))

      // Redirect after brief delay
      setTimeout(() => {
        router.push('/request/dashboard/requests')
        router.refresh()
      }, 1500)
    } catch (err) {
      console.error('[accept] error:', err)
      setToast({ message: 'An error occurred. Please try again.', type: 'error' })
      setConfirming(false)
    }
  }

  async function handleDecline() {
    setDeclining(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('booking_recipients')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString(),
          decline_reason: declineReason || null,
        })
        .eq('id', recipient.id)

      if (error) {
        console.error('[decline] error:', error.message)
        setToast({ message: 'Failed to decline. Please try again.', type: 'error' })
        setDeclining(false)
        return
      }

      setToast({ message: 'Response declined.', type: 'success' })
      window.dispatchEvent(new Event('signpost:unread-changed'))
      setTimeout(() => {
        router.push('/request/dashboard/inbox')
        router.refresh()
      }, 1500)
    } catch (err) {
      console.error('[decline] error:', err)
      setToast({ message: 'An error occurred.', type: 'error' })
      setDeclining(false)
    }
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 800, margin: '0 auto' }}>
      {/* Back link */}
      <Link
        href="/request/dashboard/requests"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--muted)', fontSize: '0.82rem', textDecoration: 'none',
          fontFamily: "'Inter', sans-serif", marginBottom: 24,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to All Requests
      </Link>

      <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 650, fontSize: '1.5rem', margin: '0 0 8px' }}>
        Review & Accept
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0 0 32px' }}>
        Review the interpreter&apos;s rate and terms before confirming this booking.
      </p>

      {/* Section 1 — Booking Summary */}
      <Section title="Booking Summary">
        <div className="req-accept-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 28px' }}>
          <DetailRow label="Title" value={booking.title || 'Untitled Request'} />
          <DetailRow label="Date & Time" value={`${formatDate(booking.date)} · ${formatTime(booking.time_start, booking.time_end)}`} />
          <DetailRow label="Location" value={booking.location || 'Not specified'} />
          <DetailRow label="Format" value={booking.format ? booking.format.replace('_', '-') : 'Not specified'} />
          {(booking.specialization || booking.event_category) && (
            <DetailRow label="Specialization" value={booking.specialization || booking.event_category || ''} />
          )}
          {dhhClientName && (
            <DetailRow label="D/HH Client" value={dhhClientName} />
          )}
        </div>
      </Section>

      {/* Section 2 — Interpreter's Rate & Terms */}
      <Section title={`${interpreterName}'s Rate & Terms`}>
        <div className="req-accept-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 28px' }}>
          <DetailRow label="Hourly Rate" value={`$${rate}/${currency === 'USD' ? 'hr' : currency}`} accent />
          {rateProfile?.min_booking && (
            <DetailRow label="Minimum Booking" value={`${rateProfile.min_booking} hour${rateProfile.min_booking > 1 ? 's' : ''}`} />
          )}
          {rateProfile?.after_hours_diff != null && rateProfile.after_hours_diff > 0 && (
            <DetailRow label="After-Hours Differential" value={`+$${rateProfile.after_hours_diff}/hr`} />
          )}
          {rateProfile?.cancellation_policy && (
            <DetailRow label="Cancellation Policy" value={rateProfile.cancellation_policy} />
          )}
          {rateProfile?.late_cancel_fee != null && rateProfile.late_cancel_fee > 0 && (
            <DetailRow label="Late Cancellation Fee" value={`$${rateProfile.late_cancel_fee}`} />
          )}
          {rateProfile?.travel_expenses && Object.keys(rateProfile.travel_expenses).length > 0 && (
            <DetailRow label="Travel Expenses" value="May apply — see interpreter's rate card" />
          )}
          {rateProfile?.additional_terms && (
            <div style={{ gridColumn: '1 / -1' }}>
              <DetailRow label="Additional Terms" value={rateProfile.additional_terms} />
            </div>
          )}
        </div>
        {recipient.response_notes && (
          <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(0,229,255,0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,229,255,0.1)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
              Interpreter&apos;s Note
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic' }}>
              &ldquo;{recipient.response_notes}&rdquo;
            </p>
          </div>
        )}
      </Section>

      {/* Section 3 — Platform Fee */}
      <Section title="signpost Platform Fee">
        <div style={{
          background: '#111118', border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 'var(--radius-sm)', padding: '20px 24px',
        }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent)', marginBottom: 12 }}>
            $15.00 per interpreter, per confirmed booking
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.7, margin: '0 0 12px' }}>
            This fee supports signpost and is completely separate from the interpreter&apos;s rate.
            The interpreter will invoice you directly for their services.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.7, margin: '0 0 16px' }}>
            signpost does not process interpreter payments.
            You pay the interpreter directly using their preferred payment method.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
              Fee for this booking:
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
              $15.00
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#96a0b8', fontStyle: 'italic' }}>
            Charged to your payment method on file when you confirm
          </div>
        </div>
      </Section>

      {/* Section 4 — Actions */}
      <div className="req-accept-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32, marginBottom: 40, alignItems: 'center' }}>
        <button
          onClick={() => setShowConfirm(true)}
          className="btn-primary"
          style={{
            padding: '14px 32px', fontSize: '0.92rem',
            fontFamily: "'Inter', sans-serif", fontWeight: 700,
            cursor: 'pointer', border: 'none',
          }}
        >
          Confirm Booking
        </button>
        {!showDeclineForm ? (
          <button
            onClick={() => setShowDeclineForm(true)}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--muted)', padding: '14px 24px',
              borderRadius: 'var(--radius-sm)', fontSize: '0.88rem',
              fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            }}
          >
            Decline This Interpreter
          </button>
        ) : (
          <div style={{ flex: '1 1 100%', marginTop: 8 }}>
            <label style={{
              display: 'block', fontSize: '0.7rem', color: 'var(--muted)',
              fontFamily: "'Inter', sans-serif", fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
            }}>
              Reason (optional)
            </label>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              rows={2}
              style={{
                width: '100%', maxWidth: 400, boxSizing: 'border-box',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                color: 'var(--text)', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
                outline: 'none', resize: 'vertical', marginBottom: 10,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDecline}
                disabled={declining}
                style={{
                  background: 'rgba(255,107,133,0.12)', border: '1px solid rgba(255,107,133,0.3)',
                  color: 'var(--accent3)', padding: '9px 20px',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
                  fontFamily: "'Inter', sans-serif", fontWeight: 700, cursor: 'pointer',
                  opacity: declining ? 0.6 : 1,
                }}
              >
                {declining ? 'Declining...' : 'Confirm Decline'}
              </button>
              <button
                onClick={() => { setShowDeclineForm(false); setDeclineReason('') }}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--muted)', padding: '9px 16px',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
                  fontFamily: "'Inter', sans-serif", cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <Link
          href="/request/dashboard/inbox"
          style={{
            color: 'var(--accent)', fontSize: '0.85rem',
            fontFamily: "'Inter', sans-serif",
            textDecoration: 'underline', textUnderlineOffset: '3px',
            padding: '14px 8px',
          }}
        >
          Ask a Question
        </Link>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
          onClick={() => { if (!confirming) setShowConfirm(false) }}
        >
          <div
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '28px 32px',
              width: '100%', maxWidth: 460,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 650, fontSize: '1.1rem', margin: '0 0 12px' }}>
              Confirm this booking?
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              Confirm this booking with <strong style={{ color: 'var(--text)' }}>{interpreterName}</strong> at{' '}
              <strong style={{ color: 'var(--accent)' }}>${rate}/hr</strong>?
              A <strong style={{ color: 'var(--text)' }}>$15 platform fee</strong> will apply.
            </p>
            <div className="req-modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={confirming}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--muted)', padding: '11px 20px',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                  fontFamily: "'Inter', sans-serif", cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="btn-primary"
                style={{
                  padding: '11px 24px', fontSize: '0.85rem',
                  fontFamily: "'Inter', sans-serif", fontWeight: 700,
                  cursor: confirming ? 'not-allowed' : 'pointer',
                  opacity: confirming ? 0.6 : 1, border: 'none',
                  minHeight: 44,
                }}
              >
                {confirming ? 'Confirming...' : 'Yes, Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
        }
        @media (max-width: 640px) {
          .req-accept-grid { grid-template-columns: 1fr !important; }
          .req-accept-actions { flex-direction: column !important; align-items: stretch !important; }
          .req-accept-actions button,
          .req-accept-actions a { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
          .req-modal-actions { flex-direction: column !important; }
          .req-modal-actions button { width: 100% !important; }
        }
        @media (max-width: 480px) {
          .dash-page-content { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Section wrapper ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 34 }}>
      <h2 style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.7rem',
        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)',
        margin: '0 0 14px',
      }}>
        {title}
      </h2>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px 24px',
      }}>
        {children}
      </div>
    </div>
  )
}

/* ── Detail Row ── */

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{
        fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)',
        fontFamily: "'Inter', sans-serif", letterSpacing: '0.08em',
        textTransform: 'uppercase', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: accent ? '1rem' : '0.85rem',
        color: accent ? 'var(--accent)' : 'var(--text)',
        fontFamily: "'Inter', sans-serif",
        fontWeight: accent ? 700 : 400,
        lineHeight: 1.5,
      }}>
        {value}
      </div>
    </div>
  )
}
