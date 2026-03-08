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
  const isRemote = inquiry.mode === 'Remote'

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10,
  }

  const detailRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 6,
  }

  const iconStyle: React.CSSProperties = { color: 'var(--muted)', flexShrink: 0, marginTop: 2 }

  const sectionStyle: React.CSSProperties = {
    padding: '16px 0', borderBottom: '1px solid var(--border)',
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '90%', maxWidth: 560,
        overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>{inquiry.title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>✕</button>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: isPending ? 'rgba(250,204,21,0.1)' : 'rgba(0,229,255,0.1)',
            color: isPending ? '#facc15' : 'var(--accent)',
            border: isPending ? '1px solid rgba(250,204,21,0.25)' : '1px solid rgba(0,229,255,0.25)',
          }}>
            {isPending ? 'Awaiting Response' : status === 'responded' ? 'Responded' : status}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '0 28px 8px', overflowY: 'auto', maxHeight: '62vh' }}>
          {/* Date & Time */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Date &amp; Time</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 5.5h12M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <div>
                <div>{inquiry.date}</div>
                <div style={{ fontWeight: 600 }}>{inquiry.time}</div>
                {inquiry.recurrence && <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{inquiry.recurrence}</div>}
              </div>
            </div>
          </div>

          {/* Location */}
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
                {isRemote ? (
                  <>
                    <div>Remote — Zoom link will be provided upon confirmation</div>
                  </>
                ) : (
                  <>
                    <div>{inquiry.location}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Deaf/HH Client */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>Deaf / Hard of Hearing Client</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <div>
                {isPending ? (
                  <>
                    <div style={{ fontWeight: 600 }}>Name withheld</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Client identity revealed upon booking confirmation</div>
                  </>
                ) : (
                  <div style={{ fontWeight: 600 }}>{inquiry.from}</div>
                )}
              </div>
            </div>
          </div>

          {/* On-site Contact */}
          <div style={sectionStyle}>
            <div style={sectionLabelStyle}>On-site Contact</div>
            <div style={detailRowStyle}>
              <svg style={iconStyle} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 2h2.5l1.5 3.5L5 7c.8 1.5 2 2.7 3.5 3.5l1.5-1.5L13.5 10.5v2.5c0 .55-.45 1-1 1C6.15 14 1 8.85 1 3.5c0-.55.45-1 1-1h.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ color: 'var(--muted)' }}>
                {isRemote ? 'N/A — Remote booking' : 'Contact information provided upon confirmation'}
              </div>
            </div>
          </div>

          {/* Job Context */}
          {(inquiry.note || inquiry.category) && (
            <div style={sectionStyle}>
              <div style={sectionLabelStyle}>Job Context</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                {inquiry.note || `${inquiry.category} appointment — no additional context provided.`}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div style={{ ...sectionStyle, borderBottom: 'none' }}>
            <div style={sectionLabelStyle}>Attachments &amp; Materials</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>None provided</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
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
