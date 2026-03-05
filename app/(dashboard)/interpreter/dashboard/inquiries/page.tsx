'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { DEMO_INQUIRIES } from '@/lib/data/demo'
import { BetaBanner, PageHeader, RequestCard, GhostButton, DashMobileStyles } from '@/components/dashboard/interpreter/shared'

type Filter = 'all' | 'new' | 'responded'

type InquiryState = Record<string, 'new' | 'responded' | 'declined'>

function AcceptModal({ inquiry, onClose }: { inquiry: typeof DEMO_INQUIRIES[0]; onClose: () => void }) {
  const [sent, setSent] = useState(false)

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

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem' }}>Send Rate — {inquiry.title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 18, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>Rate profile:</strong> Standard Rate — $95/hr · 2hr minimum · 48hr cancellation · 100% late fee
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'Syne', sans-serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Message to {inquiry.from} (optional)
          </label>
          <textarea
            placeholder={`Hi ${inquiry.from}, I'd be happy to assist with this. Here are my rates and terms…`}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
              outline: 'none', resize: 'vertical', minHeight: 90,
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
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

export default function InquiriesPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [states, setStates] = useState<InquiryState>({ 'demo-inq-1': 'new', 'demo-inq-2': 'new' })
  const [accepting, setAccepting] = useState<string | null>(null)

  function decline(id: string) {
    setStates(s => ({ ...s, [id]: 'declined' }))
  }

  const filtered = DEMO_INQUIRIES.filter(inq => {
    if (filter === 'all') return true
    if (filter === 'new') return states[inq.id] === 'new'
    if (filter === 'responded') return states[inq.id] === 'responded'
    return true
  }).filter(inq => states[inq.id] !== 'declined')

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 900 }}>
      <BetaBanner />
      <PageHeader title="Inquiries" subtitle="Booking requests awaiting your response." />

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['all', 'new', 'responded'] as Filter[]).map(f => (
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

      {filtered.map(inq => (
        <RequestCard
          key={inq.id}
          {...inq}
          status={states[inq.id] === 'new' ? 'pending' : states[inq.id]}
          actions={
            states[inq.id] === 'new' ? (
              <>
                <button className="btn-primary" style={{ fontSize: '0.82rem', padding: '8px 18px' }} onClick={() => setAccepting(inq.id)}>
                  Accept &amp; Send Rate
                </button>
                <GhostButton>View Details</GhostButton>
                <GhostButton danger onClick={() => decline(inq.id)}>Decline</GhostButton>
              </>
            ) : (
              <GhostButton>View Details</GhostButton>
            )
          }
        />
      ))}

      {accepting && (
        <AcceptModal
          inquiry={DEMO_INQUIRIES.find(i => i.id === accepting)!}
          onClose={() => {
            setStates(s => ({ ...s, [accepting]: 'responded' }))
            setAccepting(null)
          }}
        />
      )}

      <DashMobileStyles />
    </div>
  )
}
