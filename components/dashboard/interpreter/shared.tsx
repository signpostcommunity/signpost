'use client'

import { useState } from 'react'

// ── Beta Sample Banner ────────────────────────────────────────────────────────

export function BetaBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div style={{
      background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.3)',
      borderRadius: 'var(--radius-sm)', padding: '12px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, marginBottom: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, fontFamily: "'Syne', sans-serif",
          letterSpacing: '0.1em', textTransform: 'uppercase',
          background: 'rgba(123,97,255,0.2)', border: '1px solid rgba(123,97,255,0.4)',
          color: '#a78bfa', borderRadius: 100, padding: '2px 8px', whiteSpace: 'nowrap',
        }}>
          Beta
        </span>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
          The data on this page is <strong style={{ color: 'var(--text)' }}>sample content</strong> — not real bookings or messages. It's here so you can explore and test the full flow. Your feedback helps us improve before launch.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0, padding: '0 4px' }}
      >
        ✕
      </button>
    </div>
  )
}

// ── Demo Badge ────────────────────────────────────────────────────────────────

export function DemoBadge() {
  return (
    <span style={{
      fontSize: '0.62rem', fontWeight: 700, fontFamily: "'Syne', sans-serif",
      letterSpacing: '0.08em', textTransform: 'uppercase',
      background: 'rgba(123,97,255,0.12)', border: '1px solid rgba(123,97,255,0.3)',
      color: '#a78bfa', borderRadius: 100, padding: '2px 8px',
    }}>
      Sample
    </span>
  )
}

// ── Page Header ───────────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.6rem', margin: '0 0 6px' }}>
        {title}
      </h1>
      {subtitle && <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>{subtitle}</p>}
    </div>
  )
}

// ── Section Label ─────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.68rem',
      letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)',
      margin: '28px 0 14px',
    }}>
      {children}
    </h3>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: 'new' | 'responded' | 'confirmed' | 'pending' | 'declined' }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    new: { bg: 'rgba(255,165,0,0.12)', color: '#f97316', label: 'New' },
    responded: { bg: 'rgba(0,229,255,0.1)', color: 'var(--accent)', label: 'Responded' },
    confirmed: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', label: 'Confirmed' },
    pending: { bg: 'rgba(255,165,0,0.12)', color: '#f97316', label: 'Awaiting Response' },
    declined: { bg: 'rgba(255,77,109,0.1)', color: 'var(--accent3)', label: 'Declined' },
  }
  const s = styles[status]
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: 100, background: s.bg, color: s.color,
      fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────

export function Avatar({ initials, gradient, size = 40 }: { initials: string; gradient: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Syne', sans-serif", fontWeight: 700,
      fontSize: size <= 36 ? '0.75rem' : '0.88rem', color: '#fff',
    }}>
      {initials}
    </div>
  )
}

// ── Request Card ──────────────────────────────────────────────────────────────

export function RequestCard({
  title, from, category, date, time, location, mode, recurrence,
  note, status, avatar, avatarGradient, receivedDate,
  actions,
}: {
  title: string
  from?: string
  category?: string
  date: string
  time: string
  location: string
  mode?: string
  recurrence?: string
  note?: string
  status: 'new' | 'responded' | 'confirmed' | 'pending' | 'declined'
  avatar: string
  avatarGradient: string
  receivedDate?: string
  actions?: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 24px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Avatar initials={avatar} gradient={avatarGradient} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif" }}>{title}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>
              {from && `From: ${from}`}{category && ` · ${category}`}{receivedDate && ` · ${receivedDate}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <DemoBadge />
          <StatusBadge status={status} />
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap',
        fontSize: '0.8rem', color: 'var(--muted)',
        padding: '10px 0', borderTop: '1px solid var(--border)',
      }}>
        <span>📅 {date}</span>
        <span>🕐 {time}</span>
        <span>📍 {location}</span>
        {mode && <span>{mode}</span>}
        {recurrence && <span>🔁 {recurrence}</span>}
      </div>

      {note && (
        <div style={{
          fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.6,
          borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4,
          fontStyle: 'italic',
        }}>
          "{note}"
        </div>
      )}

      {actions && (
        <div className="dash-card-actions" style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  )
}

// ── Ghost Button ──────────────────────────────────────────────────────────────

export function GhostButton({ children, onClick, danger }: {
  children: React.ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'none',
        border: `1px solid ${hover ? (danger ? 'rgba(255,77,109,0.4)' : 'rgba(0,229,255,0.4)') : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        color: hover ? (danger ? 'var(--accent3)' : 'var(--accent)') : 'var(--muted)',
        fontSize: '0.82rem', padding: '8px 16px',
        cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {children}
    </button>
  )
}

// ── Mobile Styles (shared) ───────────────────────────────────────────────

export function DashMobileStyles() {
  return (
    <style>{`
      @media (max-width: 768px) {
        .dash-page-content { padding: 24px 20px !important; }
      }
      @media (max-width: 640px) {
        .dash-card-actions { flex-direction: column !important; }
        .dash-card-actions > *, .dash-card-actions > a { width: 100% !important; }
        .dash-card-actions > a > button { width: 100% !important; }
        .dash-card-actions button { width: 100% !important; text-align: center !important; }
      }
    `}</style>
  )
}

// ── Info Box ──────────────────────────────────────────────────────────────────

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)',
      borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 24,
      fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.65,
    }}>
      {children}
    </div>
  )
}
