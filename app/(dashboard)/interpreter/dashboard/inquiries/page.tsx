'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { DEMO_INQUIRIES } from '@/lib/data/demo'
import { BetaBanner, PageHeader, RequestCard, GhostButton, DashMobileStyles } from '@/components/dashboard/interpreter/shared'

type Filter = 'all' | 'new' | 'pending' | 'responded' | 'sent'
type InquiryState = Record<string, { status: 'new' | 'responded' | 'declined'; reason?: string }>

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
  color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
  outline: 'none',
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', color: 'var(--muted)',
  fontFamily: "'Syne', sans-serif", fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
}

function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--accent)'
}
function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border)'
}

// ── FIX 1: Accept & Send Rate modal ─────────────────────────────────────────

function AcceptModal({ inquiry, onClose }: { inquiry: typeof DEMO_INQUIRIES[0]; onClose: () => void }) {
  const [sent, setSent] = useState(false)
  const [rateProfile, setRateProfile] = useState('standard')
  const [customHourly, setCustomHourly] = useState('')
  const [customMinHours, setCustomMinHours] = useState('')
  const [customCancellation, setCustomCancellation] = useState('48 hours notice required')
  const [customTerms, setCustomTerms] = useState('')
  const [note, setNote] = useState('')

  if (sent) return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>✓</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)', marginBottom: 8 }}>
            Rate sent!
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 20px' }}>
            In the live product, {inquiry.from} would receive your rate and terms and can confirm the booking. This is a sample flow — no message was actually sent.
          </p>
          <button className="btn-primary" onClick={onClose} style={{ padding: '10px 28px' }}>Done</button>
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
      <div style={{ ...modalStyle, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem' }}>Send Rate — {inquiry.title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        {/* Rate profile selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabelStyle}>Rate Profile</label>
          <select
            value={rateProfile}
            onChange={e => setRateProfile(e.target.value)}
            style={fieldInputStyle}
            onFocus={focusBorder} onBlur={blurBorder}
          >
            <option value="standard">Standard Rate</option>
            <option value="community">Community / Nonprofit Rate</option>
            <option value="multiday">Multi-Day Rate</option>
            <option value="custom">Create a custom rate for this requester</option>
          </select>
        </div>

        {/* Rate summary for preset profiles */}
        {rateProfile !== 'custom' && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 18, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Rate profile:</strong> {rateSummaries[rateProfile]}
          </div>
        )}

        {/* Custom rate form */}
        {rateProfile === 'custom' && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '18px 20px', marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={fieldLabelStyle}>Hourly Rate ($)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '0.9rem', pointerEvents: 'none' }}>$</span>
                  <input
                    type="text" placeholder="0.00" value={customHourly}
                    onChange={e => setCustomHourly(e.target.value)}
                    style={{ ...fieldInputStyle, paddingLeft: 28 }}
                    onFocus={focusBorder} onBlur={blurBorder}
                  />
                </div>
              </div>
              <div>
                <label style={fieldLabelStyle}>Minimum Hours</label>
                <input
                  type="text" placeholder="e.g. 2" value={customMinHours}
                  onChange={e => setCustomMinHours(e.target.value)}
                  style={fieldInputStyle}
                  onFocus={focusBorder} onBlur={blurBorder}
                />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabelStyle}>Cancellation Policy</label>
              <select
                value={customCancellation} onChange={e => setCustomCancellation(e.target.value)}
                style={fieldInputStyle}
                onFocus={focusBorder} onBlur={blurBorder}
              >
                <option>24 hours notice required</option>
                <option>48 hours notice required</option>
                <option>72 hours notice required</option>
                <option>1 week notice required</option>
              </select>
            </div>
            <div>
              <label style={fieldLabelStyle}>Additional Terms (optional)</label>
              <textarea
                placeholder="Any special terms or conditions for this job..."
                value={customTerms} onChange={e => setCustomTerms(e.target.value)}
                style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 70 }}
                onFocus={focusBorder} onBlur={blurBorder}
              />
            </div>
          </div>
        )}

        {/* Note to requester */}
        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Message to {inquiry.from} (optional)</label>
          <textarea
            placeholder={`Hi ${inquiry.from}, I'd be happy to assist with this. Here are my rates and terms...`}
            value={note} onChange={e => setNote(e.target.value)}
            style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 90 }}
            onFocus={focusBorder} onBlur={blurBorder}
          />
        </div>

        <div className="dash-card-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button className="btn-primary" onClick={() => setSent(true)} style={{ padding: '9px 22px' }}>
            Send Rate &amp; Accept
          </button>
        </div>
      </div>
    </div>
  )
}

// ── FIX 2: View Details modal ───────────────────────────────────────────────

function DetailModal({ inquiry, status, onClose }: {
  inquiry: typeof DEMO_INQUIRIES[0]
  status: string
  onClose: () => void
}) {
  const isPending = status === 'new' || status === 'pending'

  const sections = [
    { label: 'Date & Time', content: `${inquiry.date} · ${inquiry.time}${inquiry.recurrence ? ` · ${inquiry.recurrence}` : ''}` },
    { label: 'Location', content: inquiry.mode === 'Remote' ? 'Remote — Zoom link will be provided upon confirmation' : `On-site — ${inquiry.location}` },
    { label: 'Deaf / HH Client', content: isPending ? 'Name withheld until booking confirmed' : inquiry.from, italic: isPending },
    { label: 'On-site Contact', content: inquiry.mode === 'Remote' ? 'N/A — Remote booking' : 'Contact information provided upon confirmation' },
    { label: 'Job Context', content: inquiry.note || 'No additional context provided.' },
    { label: 'Category', content: inquiry.category || '—' },
    { label: 'Attachments & Materials', content: 'None provided' },
  ]

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem' }}>{inquiry.title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 100,
            background: isPending ? 'rgba(255,165,0,0.12)' : 'rgba(0,229,255,0.1)',
            color: isPending ? '#f97316' : 'var(--accent)',
            fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em',
          }}>
            {isPending ? 'Awaiting Response' : status === 'responded' ? 'Responded' : status}
          </span>
        </div>

        {sections.map(section => (
          <div key={section.label} style={{ marginBottom: 18 }}>
            <div style={{ ...fieldLabelStyle, marginBottom: 4 }}>{section.label}</div>
            <div style={{
              fontSize: '0.88rem', lineHeight: 1.6,
              color: section.italic ? 'var(--muted)' : 'var(--text)',
              fontStyle: section.italic ? 'italic' : 'normal',
            }}>
              {section.content}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <GhostButton onClick={onClose}>Close</GhostButton>
        </div>
      </div>
    </div>
  )
}

// ── FIX 3: Decline modal with reason ────────────────────────────────────────

const DECLINE_REASONS = ['Not Available', 'Not a Good Fit', 'Unacceptable Terms', 'Prefer Not To Say'] as const

function DeclineModal({ inquiry, onConfirm, onClose }: {
  inquiry: typeof DEMO_INQUIRIES[0]
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState<string | null>(null)

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem' }}>Decline: {inquiry.title}</div>
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
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="dash-card-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button
            className="btn-primary"
            onClick={() => reason && onConfirm(reason)}
            disabled={!reason}
            style={{ padding: '9px 22px', opacity: reason ? 1 : 0.4, pointerEvents: reason ? 'auto' : 'none' }}
          >
            Confirm Decline
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function InquiriesPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [states, setStates] = useState<InquiryState>({
    'demo-inq-1': { status: 'new' },
    'demo-inq-2': { status: 'new' },
  })
  const [accepting, setAccepting] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [declining, setDeclining] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function handleDecline(id: string, reason: string) {
    setStates(s => ({ ...s, [id]: { status: 'declined', reason } }))
    setDeclining(null)
    setToast(`Declined — ${reason}`)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = DEMO_INQUIRIES.filter(inq => {
    const s = states[inq.id]?.status
    if (filter === 'all') return true
    if (filter === 'new') return s === 'new'
    if (filter === 'pending') return s === 'new'
    if (filter === 'responded') return s === 'responded'
    if (filter === 'sent') return s === 'responded'
    return true
  })

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 900 }}>
      <BetaBanner />
      <PageHeader title="Inquiries" subtitle="Booking requests awaiting your response." />

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['all', 'new', 'pending', 'responded', 'sent'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: 100, fontSize: '0.82rem',
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
              background: filter === f ? 'var(--accent)' : 'transparent',
              color: filter === f ? '#000' : 'var(--muted)',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              fontWeight: filter === f ? 700 : 400,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          No inquiries in this filter.
        </div>
      )}

      {filtered.map(inq => {
        const s = states[inq.id]
        const displayStatus = s?.status === 'declined'
          ? 'declined' as const
          : s?.status === 'new' ? 'pending' as const : (s?.status || 'pending') as 'pending' | 'responded' | 'declined'

        return (
          <RequestCard
            key={inq.id}
            {...inq}
            status={displayStatus}
            actions={
              s?.status === 'declined' ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--accent3)', fontStyle: 'italic' }}>
                  Declined — {s.reason}
                </div>
              ) : s?.status === 'new' ? (
                <>
                  <button className="btn-primary" style={{ fontSize: '0.82rem', padding: '8px 18px' }} onClick={() => setAccepting(inq.id)}>
                    Accept &amp; Send Rate
                  </button>
                  <GhostButton onClick={() => setViewing(inq.id)}>View Details</GhostButton>
                  <GhostButton danger onClick={() => setDeclining(inq.id)}>Decline</GhostButton>
                </>
              ) : (
                <GhostButton onClick={() => setViewing(inq.id)}>View Details</GhostButton>
              )
            }
          />
        )
      })}

      {accepting && (
        <AcceptModal
          inquiry={DEMO_INQUIRIES.find(i => i.id === accepting)!}
          onClose={() => {
            const inq = DEMO_INQUIRIES.find(i => i.id === accepting)
            setStates(s => ({ ...s, [accepting]: { status: 'responded' } }))
            setAccepting(null)
            setToast(`Rate sent to ${inq?.from || 'requester'}`)
            setTimeout(() => setToast(null), 3000)
          }}
        />
      )}

      {viewing && (
        <DetailModal
          inquiry={DEMO_INQUIRIES.find(i => i.id === viewing)!}
          status={states[viewing]?.status || 'new'}
          onClose={() => setViewing(null)}
        />
      )}

      {declining && (
        <DeclineModal
          inquiry={DEMO_INQUIRIES.find(i => i.id === declining)!}
          onConfirm={reason => handleDecline(declining, reason)}
          onClose={() => setDeclining(null)}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
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
