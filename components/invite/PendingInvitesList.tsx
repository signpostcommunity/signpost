'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

type TargetListRole = 'interpreter_team' | 'dhh_pref_list' | 'requester_pref_list'

interface PendingInvite {
  id: string
  invite_token: string
  recipient_name: string
  recipient_email: string | null
  recipient_phone: string | null
  channel: 'email' | 'sms' | 'clipboard'
  status: string
  sent_at: string
  clicked_at: string | null
  resend_count: number
  target_list_role: string
}

interface PendingInvitesListProps {
  targetListRole: TargetListRole
  accentColor?: string
  onRefresh?: () => void
}

const SORT_KEY = 'signpost_pending_invites_sort'
const RESEND_COOLDOWN_DAYS = 7

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 30) return `${diffDays} days ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`
}

function formatDatetime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

// ── Channel Icons ────────────────────────────────────────────────────────────

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

// ── Chevron Icon ─────────────────────────────────────────────────────────────

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Three Dot Menu ───────────────────────────────────────────────────────────

function ThreeDotMenu({ onCancel }: { onCancel: () => void }) {
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
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onCancel() }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', padding: '8px 14px',
              color: '#f87171', fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            Cancel invite
          </button>
        </div>
      )}
    </div>
  )
}

// ── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel, destructive }: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}) {
  const ref = useFocusTrap(true)
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, padding: 20,
      }}
      onClick={onCancel}
      onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111118', border: '1px solid #1e2433',
          borderRadius: 16, padding: 32, maxWidth: 400, width: '100%',
        }}
      >
        <h3 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 600,
          fontSize: '1.1rem', margin: '0 0 12px 0', color: 'var(--text)',
        }}>
          {title}
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 10, padding: '8px 20px', color: 'var(--muted)',
              fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: destructive ? '#f87171' : 'var(--accent)',
              border: 'none', borderRadius: 10, padding: '8px 20px',
              color: destructive ? '#fff' : '#000', fontSize: '0.85rem',
              fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PendingInvitesList({
  targetListRole,
  accentColor = '#00e5ff',
  onRefresh,
}: PendingInvitesListProps) {
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(SORT_KEY) as 'newest' | 'oldest') || 'newest'
    }
    return 'newest'
  })
  const [confirmAction, setConfirmAction] = useState<{
    type: 'resend' | 'cancel'
    invite: PendingInvite
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch('/api/invites')
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      const filtered = (data.invites || []).filter(
        (inv: PendingInvite) =>
          ['sent', 'clicked'].includes(inv.status) &&
          (inv.target_list_role || 'interpreter_team') === targetListRole
      )
      setInvites(filtered)
      // Auto-collapse if > 5
      if (filtered.length > 5) setCollapsed(true)
    } catch {
      // Informational section, fail silently
    }
    setLoading(false)
  }, [targetListRole])

  useEffect(() => { fetchInvites() }, [fetchInvites])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  function updateSort(order: 'newest' | 'oldest') {
    setSortOrder(order)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SORT_KEY, order)
    }
  }

  const sorted = [...invites].sort((a, b) => {
    const aTime = new Date(a.sent_at).getTime()
    const bTime = new Date(b.sent_at).getTime()
    return sortOrder === 'newest' ? bTime - aTime : aTime - bTime
  })

  async function handleResend(invite: PendingInvite) {
    setActionLoading(true)
    try {
      const res = await fetch('/api/invites/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: invite.id }),
      })
      if (res.ok) {
        setToast('Invite resent')
        fetchInvites()
        onRefresh?.()
      } else {
        const data = await res.json()
        setToast(data.error || 'Failed to resend')
      }
    } catch {
      setToast('Failed to resend')
    }
    setActionLoading(false)
    setConfirmAction(null)
  }

  async function handleClipboardResend(invite: PendingInvite) {
    const url = `https://signpost.community/invite?token=${invite.invite_token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(invite.id)
      setTimeout(() => setCopiedId(null), 2000)

      // Also increment resend_count server-side
      await fetch('/api/invites/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: invite.id }),
      })
      fetchInvites()
    } catch {
      setToast('Failed to copy link')
    }
    setConfirmAction(null)
  }

  async function handleCancel(invite: PendingInvite) {
    setActionLoading(true)
    try {
      const res = await fetch('/api/invites/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: invite.id }),
      })
      if (res.ok) {
        // Optimistic removal
        setInvites(prev => prev.filter(i => i.id !== invite.id))
        setToast('Invite cancelled')
        onRefresh?.()
      } else {
        const data = await res.json()
        setToast(data.error || 'Failed to cancel')
      }
    } catch {
      setToast('Failed to cancel')
    }
    setActionLoading(false)
    setConfirmAction(null)
  }

  function canResend(invite: PendingInvite): boolean {
    if (invite.status !== 'sent') return false
    if ((invite.resend_count || 0) >= 5) return false
    const daysSince = (Date.now() - new Date(invite.sent_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince >= RESEND_COOLDOWN_DAYS
  }

  function initiateResend(invite: PendingInvite) {
    if (invite.channel === 'clipboard') {
      // For clipboard: if they have email/phone, offer channel switch via confirm
      if (invite.recipient_email || invite.recipient_phone) {
        setConfirmAction({ type: 'resend', invite })
      } else {
        // Just re-copy
        handleClipboardResend(invite)
      }
    } else {
      setConfirmAction({ type: 'resend', invite })
    }
  }

  // Empty state: hide entire section
  if (loading || invites.length === 0) return null

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: collapsed ? 0 : 12,
        paddingBottom: 8,
        borderBottom: `1px solid ${accentColor}22`,
      }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: "'Inter', sans-serif", fontWeight: 600,
            fontSize: '13px', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: accentColor,
          }}
        >
          <ChevronIcon expanded={!collapsed} />
          Pending Invites ({invites.length})
        </button>

        {!collapsed && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => updateSort('newest')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: sortOrder === 'newest' ? 600 : 400,
                color: sortOrder === 'newest' ? accentColor : 'var(--muted)',
                fontFamily: "'Inter', sans-serif", padding: '3px 8px',
              }}
            >
              Most recent
            </button>
            <span style={{ color: 'var(--border)', fontSize: '0.72rem' }}>|</span>
            <button
              onClick={() => updateSort('oldest')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: sortOrder === 'oldest' ? 600 : 400,
                color: sortOrder === 'oldest' ? accentColor : 'var(--muted)',
                fontFamily: "'Inter', sans-serif", padding: '3px 8px',
              }}
            >
              Oldest first
            </button>
          </div>
        )}
      </div>

      {/* Card grid */}
      {!collapsed && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 10,
        }}>
          {sorted.map(invite => {
            const isClicked = invite.status === 'clicked'
            const contactDisplay = invite.recipient_email || invite.recipient_phone || ''
            const statusDate = isClicked && invite.clicked_at ? invite.clicked_at : invite.sent_at
            const statusLabel = isClicked ? 'Opened' : 'Invited'
            const statusColor = isClicked ? accentColor : '#96a0b8'
            const resendable = canResend(invite)

            return (
              <div key={invite.id} style={{
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
                  {invite.recipient_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name */}
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
                    {invite.recipient_name}
                  </div>

                  {/* Contact info - wraps, never truncates */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, marginTop: 3,
                  }}>
                    <ChannelIcon channel={invite.channel} />
                    <span style={{
                      fontSize: '0.78rem', color: 'var(--muted)',
                      wordBreak: 'break-all', overflowWrap: 'break-word',
                    }}>
                      {contactDisplay}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div
                    title={formatDatetime(statusDate)}
                    style={{
                      fontSize: '0.73rem', color: statusColor,
                      marginTop: 6,
                    }}
                  >
                    {statusLabel} {relativeTime(statusDate)}
                  </div>

                  {/* Resent count indicator */}
                  {(invite.resend_count || 0) > 0 && (
                    <div style={{
                      fontSize: '0.68rem', color: '#96a0b8',
                      marginTop: 3, fontStyle: 'italic',
                    }}>
                      Resent {invite.resend_count} time{invite.resend_count === 1 ? '' : 's'}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
                  {resendable && (
                    <button
                      onClick={() => initiateResend(invite)}
                      disabled={actionLoading}
                      style={{
                        background: 'none', border: `1px solid ${accentColor}44`,
                        borderRadius: 8, padding: '4px 10px',
                        color: accentColor, fontSize: '0.73rem', fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                        whiteSpace: 'nowrap', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.background = `${accentColor}11` }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = `${accentColor}44`; e.currentTarget.style.background = 'none' }}
                    >
                      {copiedId === invite.id ? 'Copied!' : 'Resend'}
                    </button>
                  )}
                  <ThreeDotMenu onCancel={() => setConfirmAction({ type: 'cancel', invite })} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm modals */}
      {confirmAction?.type === 'cancel' && (
        <ConfirmModal
          title="Cancel invite?"
          message={`Remove this invite from your list? ${confirmAction.invite.recipient_name} will no longer be able to use this invite link.`}
          confirmLabel="Remove"
          destructive
          onConfirm={() => handleCancel(confirmAction.invite)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction?.type === 'resend' && confirmAction.invite.channel === 'clipboard' && (
        <ConfirmModal
          title={`Resend invite to ${confirmAction.invite.recipient_name}?`}
          message={
            confirmAction.invite.recipient_email
              ? `This invite was originally shared via clipboard. Would you like to send it via email to ${confirmAction.invite.recipient_email} instead? The link will also be copied to your clipboard.`
              : confirmAction.invite.recipient_phone
                ? `This invite was originally shared via clipboard. Would you like to send it via SMS to ${confirmAction.invite.recipient_phone} instead? The link will also be copied to your clipboard.`
                : 'The invite link will be copied to your clipboard.'
          }
          confirmLabel={
            confirmAction.invite.recipient_email ? 'Send email'
              : confirmAction.invite.recipient_phone ? 'Send SMS'
                : 'Copy link'
          }
          onConfirm={() => {
            if (confirmAction.invite.recipient_email || confirmAction.invite.recipient_phone) {
              handleResend(confirmAction.invite)
            } else {
              handleClipboardResend(confirmAction.invite)
            }
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction?.type === 'resend' && confirmAction.invite.channel !== 'clipboard' && (
        <ConfirmModal
          title={`Resend invite to ${confirmAction.invite.recipient_name}?`}
          message={`A reminder will be sent via ${confirmAction.invite.channel === 'email' ? 'email' : 'SMS'} to ${confirmAction.invite.recipient_email || confirmAction.invite.recipient_phone}.`}
          confirmLabel="Resend"
          onConfirm={() => handleResend(confirmAction.invite)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10,
          background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)',
          color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
