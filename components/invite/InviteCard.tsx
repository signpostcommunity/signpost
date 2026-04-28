'use client'

import { useState, useEffect, useRef } from 'react'
import { relativeTime, formatDatetime } from '@/lib/dateUtils'

// ── Types ───────────────────────────────────────────────────────────────────

export interface InviteCardAction {
  label: string
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  onClick: (id: string) => void
  disabled?: boolean
  loading?: boolean
}

export interface InviteCardProps {
  id: string
  recipientName: string
  recipientEmail?: string | null
  recipientPhone?: string | null
  channel?: 'email' | 'sms' | 'clipboard'
  sentAt?: string
  statusBadge?: {
    label: string
    variant: 'accent' | 'muted' | 'pill'
  }
  metadata?: string
  accentColor?: string
  actions?: InviteCardAction[]
  menuActions?: InviteCardAction[]
}

// ── Channel Icons ───────────────────────────────────────────────────────────

function EnvelopeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="#96a0b8" strokeWidth="1.3" />
      <path d="M1.5 5l6.5 4 6.5-4" stroke="#96a0b8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="4" y="1" width="8" height="14" rx="2" stroke="#96a0b8" strokeWidth="1.3" />
      <circle cx="8" cy="12.5" r="0.8" fill="#96a0b8" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="2.5" width="10" height="12" rx="1.5" stroke="#96a0b8" strokeWidth="1.3" />
      <path d="M6 1.5h4a1 1 0 011 1v1H5v-1a1 1 0 011-1z" stroke="#96a0b8" strokeWidth="1.2" />
    </svg>
  )
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'sms') return <PhoneIcon />
  if (channel === 'clipboard') return <ClipboardIcon />
  return <EnvelopeIcon />
}

// ── Three Dot Menu ──────────────────────────────────────────────────────────

function ThreeDotMenu({ actions, id }: { actions: InviteCardAction[]; id: string }) {
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

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(!open) }}
        aria-label="More actions"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
          color: 'var(--muted)', fontSize: '1rem', lineHeight: 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.3" />
          <circle cx="8" cy="8" r="1.3" />
          <circle cx="8" cy="13" r="1.3" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          background: '#111118', border: '1px solid var(--border)',
          borderRadius: 8, padding: '4px 0', zIndex: 100, minWidth: 140,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {actions.map((action, i) => {
            const color = action.variant === 'danger' ? '#f87171'
              : action.variant === 'primary' ? 'var(--accent)'
              : 'var(--muted)'
            const hoverBg = action.variant === 'danger' ? 'rgba(248,113,113,0.08)'
              : 'rgba(255,255,255,0.05)'
            return (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setOpen(false); action.onClick(id) }}
                disabled={action.disabled || action.loading}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', padding: '8px 14px',
                  color, fontSize: '0.82rem', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  opacity: action.disabled ? 0.5 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = hoverBg }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
              >
                {action.loading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Spinner size={12} /> Loading...
                  </span>
                ) : action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16" fill="none"
      style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28 10" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  )
}

// ── Action Button ───────────────────────────────────────────────────────────

function ActionButton({ action, accentColor, id }: { action: InviteCardAction; accentColor: string; id: string }) {
  const isDisabled = action.disabled || action.loading

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: accentColor, border: 'none',
      color: '#000', fontWeight: 600,
    },
    secondary: {
      background: 'none', border: `1px solid ${accentColor}44`,
      color: accentColor, fontWeight: 600,
    },
    ghost: {
      background: 'transparent', border: '1px solid var(--border)',
      color: 'var(--muted)', fontWeight: 600,
    },
    danger: {
      background: '#f87171', border: 'none',
      color: '#fff', fontWeight: 600,
    },
  }

  const baseStyle = styles[action.variant] || styles.secondary

  return (
    <button
      onClick={() => action.onClick(id)}
      disabled={isDisabled}
      style={{
        ...baseStyle,
        borderRadius: 8, padding: '4px 10px',
        fontSize: '0.73rem', cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
        transition: 'all 0.2s', opacity: isDisabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      {action.loading ? <Spinner size={12} /> : action.label}
    </button>
  )
}

// ── Initials ────────────────────────────────────────────────────────────────

function deriveInitials(name: string, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }
  if (email) {
    const local = email.split('@')[0]
    const domain = email.split('@')[1]
    if (domain) {
      return (local[0] + domain[0]).toUpperCase()
    }
    return local[0]?.toUpperCase() || '?'
  }
  return '?'
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function InviteCard({
  id,
  recipientName,
  recipientEmail,
  recipientPhone,
  channel,
  sentAt,
  statusBadge,
  metadata,
  accentColor = '#00e5ff',
  actions,
  menuActions,
}: InviteCardProps) {
  const initials = deriveInitials(recipientName, recipientEmail)
  const contactDisplay = recipientEmail || recipientPhone || ''

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${accentColor}44, ${accentColor}22)`,
        border: `1px solid ${accentColor}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", fontWeight: 700,
        fontSize: '0.68rem', color: accentColor,
        marginTop: 2,
      }}>
        {initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name */}
        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
          {recipientName}
        </div>

        {/* Contact info */}
        {(channel && contactDisplay) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, marginTop: 3,
          }}>
            <ChannelIcon channel={channel} />
            <span style={{
              fontSize: '0.78rem', color: 'var(--muted)',
              wordBreak: 'break-all', overflowWrap: 'break-word',
            }}>
              {contactDisplay}
            </span>
          </div>
        )}

        {/* Timestamp with optional status badge */}
        {sentAt && (
          <div
            title={formatDatetime(sentAt)}
            style={{ fontSize: '0.73rem', marginTop: 6 }}
          >
            {statusBadge && statusBadge.variant !== 'pill' && (
              <span style={{
                color: statusBadge.variant === 'accent' ? accentColor : '#96a0b8',
              }}>
                {statusBadge.label}{' '}
              </span>
            )}
            <span style={{
              color: statusBadge
                ? (statusBadge.variant === 'accent' ? accentColor : '#96a0b8')
                : '#96a0b8',
            }}>
              {statusBadge && statusBadge.variant !== 'pill'
                ? relativeTime(sentAt)
                : relativeTime(sentAt)}
            </span>
          </div>
        )}

        {/* Pill badge (separate from timestamp) */}
        {statusBadge && statusBadge.variant === 'pill' && (
          <div style={{ marginTop: 6 }}>
            <span style={{
              fontSize: '0.75rem', color: 'var(--muted)',
              border: '1px solid var(--border)',
              padding: '3px 10px', borderRadius: 100,
            }}>
              {statusBadge.label}
            </span>
          </div>
        )}

        {/* Metadata */}
        {metadata && (
          <div style={{
            fontSize: '0.68rem', color: '#96a0b8',
            marginTop: 3, fontStyle: 'italic',
          }}>
            {metadata}
          </div>
        )}
      </div>

      {/* Actions area */}
      {(actions?.length || menuActions?.length) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2, flexWrap: 'wrap' }}>
          {actions?.map((action, i) => (
            <ActionButton key={i} action={action} accentColor={accentColor} id={id} />
          ))}
          {menuActions && menuActions.length > 0 && (
            <ThreeDotMenu actions={menuActions} id={id} />
          )}
        </div>
      )}
    </div>
  )
}
