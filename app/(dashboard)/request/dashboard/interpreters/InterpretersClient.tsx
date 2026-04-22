'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AddToListModal from '@/components/directory/AddToListModal'
import InviteModal from '@/components/invite/InviteModal'
import PendingInvites from '@/components/invite/PendingInvites'
import Toast from '@/components/ui/Toast'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import BetaTryThis from '@/components/ui/BetaTryThis'

// ── Types ─────────────────────────────────────────────────────────────────────

type RosterInterpreter = {
  roster_id: string
  interpreter_id: string
  tier: 'preferred' | 'secondary' | 'dnb'
  notes: string | null
  name: string
  first_name: string
  last_name: string
  initials: string
  photo_url: string | null
  avatar_color: string | null
  city: string | null
  state: string | null
  sign_languages: string[]
  certifications: string[]
  dnb_reasons: string[] | null
  dnb_notes: string | null
  dnb_added_at: string | null
}

const DNB_REASONS = [
  'Unprofessional conduct',
  'Late arrival or no-show',
  'Skill level did not meet needs',
  'Communication difficulties',
  'Client expressed discomfort',
  'Scheduling reliability concerns',
  'Confidentiality concern',
  'Other',
]

// ── Interpreter Card ──────────────────────────────────────────────────────────

function InterpreterCard({ interp, onMoveTier, onRemove, onEditNote, onMoveToDnb, targetTierLabel }: {
  interp: RosterInterpreter
  onMoveTier: () => void
  onRemove: () => void
  onEditNote: () => void
  onMoveToDnb: () => void
  targetTierLabel: string
}) {
  const [hover, setHover] = useState(false)
  const location = [interp.city, interp.state].filter(Boolean).join(', ')

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${hover ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '20px 22px',
        display: 'flex', alignItems: 'flex-start', gap: 16,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Avatar */}
      <Link href={`/directory/${interp.interpreter_id}?context=requester`} style={{ flexShrink: 0, textDecoration: 'none' }}>
        {interp.photo_url ? (
          <img src={interp.photo_url} alt={interp.name} style={{
            width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
            border: '2px solid var(--accent)',
          }} />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: interp.avatar_color || 'linear-gradient(135deg, #7b61ff, #00e5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', color: '#fff',
          }}>
            {interp.initials}
          </div>
        )}
      </Link>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/directory/${interp.interpreter_id}?context=requester`}
          className="interp-name-link"
          style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
        >
          {interp.name}
        </Link>

        {location && (
          <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 3 }}>
            {location}
          </div>
        )}

        {/* Sign languages */}
        {interp.sign_languages.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {interp.sign_languages.map(lang => (
              <span key={lang} style={{
                padding: '2px 10px', borderRadius: 20,
                border: '1px solid rgba(0,229,255,0.3)',
                color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 600,
              }}>
                {lang}
              </span>
            ))}
          </div>
        )}

        {/* Certifications */}
        {interp.certifications.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {interp.certifications.slice(0, 3).map(cert => (
              <span key={cert} style={{
                padding: '2px 10px', borderRadius: 20,
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 500,
              }}>
                {cert}
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        {interp.notes && (
          <div style={{
            fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic',
            marginTop: 8, lineHeight: 1.5,
          }}>
            &ldquo;{interp.notes}&rdquo;
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12,
          paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Link
            href={`/directory/${interp.interpreter_id}?context=requester`}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
              fontSize: '0.75rem', padding: '5px 14px', cursor: 'pointer',
              textDecoration: 'none', display: 'inline-block',
              transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            View Profile
          </Link>
          <button
            onClick={onMoveTier}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
              fontSize: '0.75rem', padding: '5px 14px', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            {targetTierLabel}
          </button>
          <button
            onClick={onEditNote}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
              fontSize: '0.75rem', padding: '5px 14px', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            Edit Note
          </button>
          <button
            onClick={onMoveToDnb}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
              fontSize: '0.75rem', padding: '5px 14px', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            Do Not Book
          </button>
          <button
            onClick={onRemove}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
              fontSize: '0.75rem', padding: '5px 14px', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.4)'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DNB Card ──────────────────────────────────────────────────────────────────

function DnbInterpreterCard({ interp, onRemoveFromDnb }: {
  interp: RosterInterpreter
  onRemoveFromDnb: () => void
}) {
  const [hover, setHover] = useState(false)
  const location = [interp.city, interp.state].filter(Boolean).join(', ')
  const addedDate = interp.dnb_added_at
    ? new Date(interp.dnb_added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${hover ? 'rgba(248,113,113,0.3)' : 'rgba(248,113,113,0.12)'}`,
        borderRadius: 'var(--radius)', padding: '20px 22px',
        display: 'flex', alignItems: 'flex-start', gap: 16,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        {interp.photo_url ? (
          <img src={interp.photo_url} alt={interp.name} style={{
            width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
            border: '2px solid rgba(248,113,113,0.3)',
            filter: 'grayscale(0.4)',
          }} />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: interp.avatar_color || 'linear-gradient(135deg, #7b61ff, #00e5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', color: '#fff',
            filter: 'grayscale(0.4)',
          }}>
            {interp.initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>
            {interp.name}
          </span>
          {addedDate && (
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
              Added {addedDate}
            </span>
          )}
        </div>

        {location && (
          <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 3 }}>
            {location}
          </div>
        )}

        {/* DNB Reason pills */}
        {interp.dnb_reasons && interp.dnb_reasons.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {interp.dnb_reasons.map(reason => (
              <span key={reason} style={{
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                color: '#f87171', fontSize: '0.72rem', fontWeight: 500,
              }}>
                {reason}
              </span>
            ))}
          </div>
        )}

        {/* DNB Notes preview */}
        {interp.dnb_notes && (
          <div style={{
            fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic',
            marginTop: 8, lineHeight: 1.5,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {interp.dnb_notes}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12,
          paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={onRemoveFromDnb}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
              fontSize: '0.75rem', padding: '5px 14px', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            Remove from Do Not Book
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DNB Modal ─────────────────────────────────────────────────────────────────

function DnbModal({ name, onConfirm, onCancel }: {
  name: string
  onConfirm: (reasons: string[], notes: string) => void
  onCancel: () => void
}) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const modalRef = useFocusTrap(true)

  function toggleReason(reason: string) {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    )
  }

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
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${name} to Do Not Book`}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111118', border: '1px solid #1e2433',
          borderRadius: 16, padding: 32, maxWidth: 480, width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <h3 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 600,
          fontSize: '15px', color: '#f0f2f8', margin: '0 0 6px 0',
        }}>
          Add {name} to Do Not Book
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          This interpreter will be excluded from your booking requests. This action is private to your organization.
        </p>

        {/* Reason chips */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block', fontSize: '0.82rem', fontWeight: 600,
            color: 'var(--text)', marginBottom: 10,
            fontFamily: "'Inter', sans-serif",
          }}>
            Why are you adding this interpreter to Do Not Book?
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DNB_REASONS.map(reason => {
              const isSelected = selectedReasons.includes(reason)
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => toggleReason(reason)}
                  style={{
                    padding: '7px 14px', borderRadius: 10,
                    background: isSelected ? 'rgba(0,229,255,0.1)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
                    color: isSelected ? 'var(--accent)' : 'var(--muted)',
                    fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.15s',
                  }}
                >
                  {reason}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes field */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block', fontSize: '0.82rem', fontWeight: 600,
            color: 'var(--text)', marginBottom: 6,
            fontFamily: "'Inter', sans-serif",
          }}>
            Additional notes (private to your organization)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'var(--text)', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
              outline: 'none', resize: 'vertical', minHeight: 60,
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Actions */}
        <div className="req-modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 20px', color: 'var(--muted)',
              fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedReasons, notes)}
            disabled={selectedReasons.length === 0}
            style={{
              background: selectedReasons.length === 0 ? 'rgba(248,113,113,0.3)' : '#f87171',
              border: 'none', borderRadius: 10, padding: '11px 20px',
              color: selectedReasons.length === 0 ? 'rgba(255,255,255,0.5)' : '#000',
              fontSize: '0.85rem', fontWeight: 700,
              cursor: selectedReasons.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif", minHeight: 44,
              transition: 'all 0.15s',
            }}
          >
            Add to Do Not Book
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Client Component ─────────────────────────────────────────────────────

export default function InterpretersClient() {
  const [roster, setRoster] = useState<RosterInterpreter[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Confirm modal for tier move / remove
  const [confirmModal, setConfirmModal] = useState<{
    rosterId: string; name: string; action: 'move' | 'remove' | 'remove-dnb'; newTier?: string
  } | null>(null)
  const confirmModalRef = useFocusTrap(!!confirmModal)

  // DNB modal
  const [dnbModal, setDnbModal] = useState<{ rosterId: string; name: string } | null>(null)

  // Note editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteText, setEditNoteText] = useState('')

  // DNB section collapse state (collapsed by default)
  const [dnbCollapsed, setDnbCollapsed] = useState(true)

  // Invite modal
  const [showInvite, setShowInvite] = useState(false)

  const fetchRoster = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Step 1: Fetch roster rows (including DNB fields)
    const { data: rosterRows, error: rosterErr } = await supabase
      .from('requester_roster')
      .select('id, interpreter_id, tier, notes, do_not_book, dnb_reasons, dnb_notes, dnb_added_at')
      .eq('requester_user_id', user.id)

    if (rosterErr) {
      console.error('[requester-interpreters] roster fetch error:', rosterErr.message)
      setLoading(false)
      return
    }

    if (!rosterRows || rosterRows.length === 0) {
      setRoster([])
      setLoading(false)
      return
    }

    // Step 2: Fetch interpreter profiles (separate query - avoids RLS join issues)
    const interpreterIds = rosterRows.map(r => r.interpreter_id)

    const { data: profiles } = await supabase
      .from('interpreter_profiles')
      .select('id, first_name, last_name, photo_url, avatar_color, city, state, sign_languages, specializations')
      .in('id', interpreterIds)

    // Step 3: Fetch certifications
    const { data: certs } = await supabase
      .from('interpreter_certifications')
      .select('interpreter_id, name')
      .in('interpreter_id', interpreterIds)

    // Build lookup maps
    const profileMap: Record<string, typeof profiles extends (infer T)[] | null ? T : never> = {}
    for (const p of profiles || []) profileMap[p.id] = p

    const certsMap: Record<string, string[]> = {}
    for (const c of certs || []) {
      if (!certsMap[c.interpreter_id]) certsMap[c.interpreter_id] = []
      certsMap[c.interpreter_id].push(c.name)
    }

    // Step 4: Map to display objects (include all tiers)
    const mapped: RosterInterpreter[] = rosterRows
      .map(row => {
        const p = profileMap[row.interpreter_id]
        const firstName = p?.first_name || ''
        const lastName = p?.last_name || ''
        const fullName = `${firstName} ${lastName}`.trim() || 'Unknown'
        const initials = `${(firstName[0] || '').toUpperCase()}${(lastName[0] || '').toUpperCase()}` || 'U'

        return {
          roster_id: row.id,
          interpreter_id: row.interpreter_id,
          tier: row.tier as 'preferred' | 'secondary' | 'dnb',
          notes: row.notes,
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          initials,
          photo_url: p?.photo_url || null,
          avatar_color: p?.avatar_color || null,
          city: p?.city || null,
          state: p?.state || null,
          sign_languages: (p?.sign_languages as string[]) || [],
          certifications: certsMap[row.interpreter_id] || [],
          dnb_reasons: (row.dnb_reasons as string[]) || null,
          dnb_notes: row.dnb_notes as string | null,
          dnb_added_at: row.dnb_added_at as string | null,
        }
      })

    setRoster(mapped)
    setLoading(false)
  }, [])

  useEffect(() => { fetchRoster() }, [fetchRoster])

  // ── Handlers ──

  function requestMoveTier(rosterId: string) {
    const item = roster.find(r => r.roster_id === rosterId)
    if (!item) return
    const newTier = item.tier === 'preferred' ? 'secondary' : 'preferred'
    setConfirmModal({ rosterId, name: item.name, action: 'move', newTier })
  }

  function requestRemove(rosterId: string) {
    const item = roster.find(r => r.roster_id === rosterId)
    if (!item) return
    setConfirmModal({ rosterId, name: item.name, action: 'remove' })
  }

  function requestDnb(rosterId: string) {
    const item = roster.find(r => r.roster_id === rosterId)
    if (!item) return
    setDnbModal({ rosterId, name: item.name })
  }

  function requestRemoveFromDnb(rosterId: string) {
    const item = roster.find(r => r.roster_id === rosterId)
    if (!item) return
    setConfirmModal({ rosterId, name: item.name, action: 'remove-dnb' })
  }

  async function confirmAction() {
    if (!confirmModal) return
    const { rosterId, action, newTier } = confirmModal
    setConfirmModal(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (action === 'move' && newTier) {
      const { error } = await supabase
        .from('requester_roster')
        .update({ tier: newTier })
        .eq('id', rosterId)
        .eq('requester_user_id', user.id)
      if (error) {
        setToast({ message: `Error: ${error.message}`, type: 'error' })
        return
      }
      setToast({ message: `Moved to ${newTier === 'preferred' ? 'Preferred' : 'Secondary Tier'}.`, type: 'success' })
    } else if (action === 'remove') {
      const { error } = await supabase
        .from('requester_roster')
        .delete()
        .eq('id', rosterId)
        .eq('requester_user_id', user.id)
      if (error) {
        setToast({ message: `Error: ${error.message}`, type: 'error' })
        return
      }
      setToast({ message: 'Removed from your list.', type: 'success' })
    } else if (action === 'remove-dnb') {
      const { error } = await supabase
        .from('requester_roster')
        .update({
          tier: 'secondary',
          do_not_book: false,
          dnb_reasons: null,
          dnb_notes: null,
          dnb_added_by: null,
          dnb_added_at: null,
        })
        .eq('id', rosterId)
        .eq('requester_user_id', user.id)
      if (error) {
        setToast({ message: `Error: ${error.message}`, type: 'error' })
        return
      }
      setToast({ message: 'Removed from Do Not Book. Moved to Secondary Tier.', type: 'success' })
    }
    fetchRoster()
  }

  async function confirmDnb(reasons: string[], notes: string) {
    if (!dnbModal) return
    const { rosterId } = dnbModal
    setDnbModal(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('requester_roster')
      .update({
        tier: 'dnb',
        do_not_book: true,
        dnb_reasons: reasons,
        dnb_notes: notes || null,
        dnb_added_by: user.id,
        dnb_added_at: new Date().toISOString(),
      })
      .eq('id', rosterId)
      .eq('requester_user_id', user.id)

    if (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' })
      return
    }
    setToast({ message: 'Added to Do Not Book.', type: 'success' })
    setDnbCollapsed(false)
    fetchRoster()
  }

  function startEditNote(rosterId: string) {
    const item = roster.find(r => r.roster_id === rosterId)
    setEditNoteText(item?.notes || '')
    setEditingNoteId(rosterId)
  }

  async function saveNote(rosterId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('requester_roster')
      .update({ notes: editNoteText || null })
      .eq('id', rosterId)
      .eq('requester_user_id', user.id)

    if (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' })
    } else {
      setToast({ message: 'Note saved.', type: 'success' })
    }
    setEditingNoteId(null)
    fetchRoster()
  }

  const preferred = roster.filter(r => r.tier === 'preferred')
  const secondary = roster.filter(r => r.tier === 'secondary')
  const dnb = roster.filter(r => r.tier === 'dnb')

  if (loading) {
    return (
      <div style={{ padding: '48px 56px', color: 'var(--muted)', fontSize: '0.88rem' }}>
        Loading your interpreters...
      </div>
    )
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: '27px', color: '#f0f2f8', margin: '0 0 6px' }}>
          Preferred Interpreters
        </h1>
        <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', margin: 0 }}>
          Manage your preferred, secondary, and do not book interpreter lists.
        </p>
      </div>

      <BetaTryThis storageKey="beta_try_preferred_interp">
        Browse the interpreter directory and add a few interpreters to your preferred list. Try moving one to your secondary tier.
      </BetaTryThis>

      <PendingInvites targetListRole="requester_pref_list" accentColor="#00e5ff" />

      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite an interpreter to signpost"
        subtitle="I want to add you to my preferred interpreter list on signpost."
        targetListRole="requester_pref_list"
        senderRole="requester"
        accentColor="#00e5ff"
        onSuccess={() => { fetchRoster(); setShowInvite(false) }}
      />

      {/* ── Preferred Section ── */}
      <div style={{ marginBottom: 36 }}>
        <div className="req-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: '#f0f2f8', marginBottom: 2 }}>
              Preferred Interpreters
              <span style={{
                marginLeft: 10, fontSize: '0.75rem', fontWeight: 600,
                padding: '2px 8px', borderRadius: 12,
                background: 'rgba(0,229,255,0.12)', color: 'var(--accent)',
              }}>
                {preferred.length}
              </span>
            </div>
            <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8' }}>
              Your first call. These interpreters are contacted first when you submit a request.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link
              href="/directory?context=requester"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'transparent', border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
                fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
                padding: '8px 16px', cursor: 'pointer', textDecoration: 'none',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              Add Interpreter
            </Link>
            <button
              onClick={() => setShowInvite(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'transparent', border: '1.5px dashed rgba(0,229,255,0.3)',
                borderRadius: 'var(--radius-sm)', color: 'var(--accent)',
                fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
                padding: '8px 16px', cursor: 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              Invite
            </button>
          </div>
        </div>

        {preferred.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 24px',
            background: 'var(--surface)', border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
          }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>
              You haven&apos;t added any preferred interpreters yet.
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              Browse the directory to find interpreters.
            </p>
            <Link href="/directory?context=requester" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 22px', fontSize: '0.85rem' }}>
              Browse Directory &#8594;
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {preferred.map(interp => (
              <div key={interp.roster_id}>
                {editingNoteId === interp.roster_id ? (
                  <div style={{
                    background: 'var(--card-bg)', border: '1px solid rgba(0,229,255,0.3)',
                    borderRadius: 'var(--radius)', padding: '20px 22px',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 10 }}>
                      Edit note for {interp.name}
                    </div>
                    <textarea
                      value={editNoteText}
                      onChange={e => setEditNoteText(e.target.value)}
                      placeholder="Add a note about this interpreter..."
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                        color: 'var(--text)', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
                        outline: 'none', resize: 'vertical', minHeight: 60, marginBottom: 10,
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingNoteId(null)} style={{
                        background: 'transparent', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '6px 16px', color: 'var(--muted)',
                        fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      }}>Cancel</button>
                      <button onClick={() => saveNote(interp.roster_id)} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <InterpreterCard
                    interp={interp}
                    onMoveTier={() => requestMoveTier(interp.roster_id)}
                    onRemove={() => requestRemove(interp.roster_id)}
                    onEditNote={() => startEditNote(interp.roster_id)}
                    onMoveToDnb={() => requestDnb(interp.roster_id)}
                    targetTierLabel="Move to Secondary"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Secondary Tier Section ── */}
      <div style={{ marginBottom: 36 }}>
        <div className="req-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: '#f0f2f8', marginBottom: 2 }}>
              Secondary Tier
              <span style={{
                marginLeft: 10, fontSize: '0.75rem', fontWeight: 600,
                padding: '2px 8px', borderRadius: 12,
                background: 'rgba(157,135,255,0.12)', color: '#a78bfa',
              }}>
                {secondary.length}
              </span>
            </div>
            <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8' }}>
              Good alternatives. Contacted if your preferred interpreters aren&apos;t available.
            </div>
          </div>
          <Link
            href="/directory?context=requester"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'transparent', border: '1.5px dashed var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
              fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
              padding: '8px 16px', cursor: 'pointer', textDecoration: 'none',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Add Interpreter
          </Link>
        </div>

        {secondary.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 24px',
            background: 'var(--surface)', border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
              No secondary tier interpreters. Add interpreters from the directory or move them from your preferred list.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {secondary.map(interp => (
              <div key={interp.roster_id}>
                {editingNoteId === interp.roster_id ? (
                  <div style={{
                    background: 'var(--card-bg)', border: '1px solid rgba(157,135,255,0.3)',
                    borderRadius: 'var(--radius)', padding: '20px 22px',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 10 }}>
                      Edit note for {interp.name}
                    </div>
                    <textarea
                      value={editNoteText}
                      onChange={e => setEditNoteText(e.target.value)}
                      placeholder="Add a note about this interpreter..."
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                        color: 'var(--text)', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
                        outline: 'none', resize: 'vertical', minHeight: 60, marginBottom: 10,
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingNoteId(null)} style={{
                        background: 'transparent', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '6px 16px', color: 'var(--muted)',
                        fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      }}>Cancel</button>
                      <button onClick={() => saveNote(interp.roster_id)} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <InterpreterCard
                    interp={interp}
                    onMoveTier={() => requestMoveTier(interp.roster_id)}
                    onRemove={() => requestRemove(interp.roster_id)}
                    onEditNote={() => startEditNote(interp.roster_id)}
                    onMoveToDnb={() => requestDnb(interp.roster_id)}
                    targetTierLabel="Move to Preferred"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Do Not Book Section ── */}
      <div style={{ marginBottom: 36 }}>
        <button
          type="button"
          onClick={() => setDnbCollapsed(prev => !prev)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '16px 20px', marginBottom: dnbCollapsed ? 0 : 12,
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: dnbCollapsed ? 'var(--radius)' : 'var(--radius) var(--radius) 0 0',
            cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ transform: dnbCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
              <path d="M6 4l4 4-4 4" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: '#f87171' }}>
              Do Not Book
            </span>
            <span style={{
              fontSize: '0.75rem', fontWeight: 600,
              padding: '2px 8px', borderRadius: 12,
              background: 'rgba(248,113,113,0.15)', color: '#f87171',
            }}>
              {dnb.length}
            </span>
          </div>
        </button>

        {!dnbCollapsed && (
          <div style={{
            borderLeft: '1px solid rgba(248,113,113,0.25)',
            borderRight: '1px solid rgba(248,113,113,0.25)',
            borderBottom: '1px solid rgba(248,113,113,0.25)',
            borderRadius: '0 0 var(--radius) var(--radius)',
            padding: '16px 20px',
            background: 'rgba(248,113,113,0.02)',
          }}>
            <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', marginBottom: 16 }}>
              These interpreters will not appear in your booking requests. This list is private to your organization.
            </div>

            {dnb.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '28px 24px',
                background: 'var(--surface)', border: '1px dashed rgba(248,113,113,0.15)',
                borderRadius: 'var(--radius)',
              }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
                  No interpreters on your Do Not Book list.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dnb.map(interp => (
                  <DnbInterpreterCard
                    key={interp.roster_id}
                    interp={interp}
                    onRemoveFromDnb={() => requestRemoveFromDnb(interp.roster_id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Confirm Modal (move tier / remove / remove from DNB) ── */}
      {confirmModal && (() => {
        const isRemove = confirmModal.action === 'remove'
        const isRemoveDnb = confirmModal.action === 'remove-dnb'
        const tierLabel = confirmModal.newTier === 'preferred' ? 'Preferred' : 'Secondary Tier'
        return (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10000, padding: 20,
            }}
            onClick={() => setConfirmModal(null)}
            onKeyDown={e => { if (e.key === 'Escape') setConfirmModal(null) }}
          >
            <div
              ref={confirmModalRef}
              role="dialog"
              aria-modal="true"
              aria-label={isRemoveDnb ? `Remove ${confirmModal.name} from Do Not Book` : isRemove ? `Remove ${confirmModal.name}` : `Move ${confirmModal.name}`}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#111118', border: '1px solid #1e2433',
                borderRadius: 16, padding: 32, maxWidth: 400, width: '100%',
              }}
            >
              <h3 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 600,
                fontSize: '15px', color: '#f0f2f8', margin: '0 0 12px 0',
              }}>
                {isRemoveDnb
                  ? `Remove ${confirmModal.name} from Do Not Book?`
                  : isRemove
                    ? `Remove ${confirmModal.name}?`
                    : `Move ${confirmModal.name}?`
                }
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                {isRemoveDnb
                  ? `Remove ${confirmModal.name} from your Do Not Book list? They will be moved back to your Secondary Tier.`
                  : isRemove
                    ? `Remove ${confirmModal.name} from your interpreter list? You can add them back later from the directory.`
                    : `Move ${confirmModal.name} to ${tierLabel}?`
                }
              </p>
              <div className="req-modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmModal(null)}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '11px 20px', color: 'var(--muted)',
                    fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    minHeight: 44,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  style={{
                    background: isRemove ? '#ff6b85' : isRemoveDnb ? 'var(--accent)' : 'var(--accent)',
                    border: 'none', borderRadius: 10, padding: '11px 20px',
                    color: isRemove ? '#fff' : '#000', fontSize: '0.85rem',
                    fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    minHeight: 44,
                  }}
                >
                  {isRemoveDnb ? 'Remove from Do Not Book' : isRemove ? 'Remove' : 'Move'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── DNB Modal ── */}
      {dnbModal && (
        <DnbModal
          name={dnbModal.name}
          onConfirm={(reasons, notes) => confirmDnb(reasons, notes)}
          onCancel={() => setDnbModal(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
          .req-section-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
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
