'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FLAG_REASONS = [
  'Not a real person / fake profile',
  'Presenting false or misleading credentials',
  'Inappropriate or offensive content',
  'This person is not an interpreter',
  'Other concern',
] as const

interface FlagProfileModalProps {
  isOpen: boolean
  onClose: () => void
  interpreterProfileId: string
  onSuccess: () => void
}

export default function FlagProfileModal({ isOpen, onClose, interpreterProfileId, onSuccess }: FlagProfileModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit() {
    if (!selectedReason || submitting) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to flag a profile.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase
      .from('profile_flags')
      .insert({
        interpreter_profile_id: interpreterProfileId,
        flagged_by: user.id,
        reason: selectedReason,
        details: selectedReason === 'Other concern' && details.trim() ? details.trim() : null,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('You have already flagged this profile.')
      } else {
        setError('Something went wrong. Please try again.')
        console.error('Flag insert error:', insertError)
      }
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setSelectedReason(null)
    setDetails('')
    onSuccess()
    onClose()
  }

  function handleClose() {
    setSelectedReason(null)
    setDetails('')
    setError(null)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '32px',
          maxWidth: 460, width: '90%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 2v12M3 2l8 3.5L3 9" stroke="#ff6b85" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem',
            margin: 0,
          }}>
            Flag this profile
          </h2>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.5 }}>
          Help us keep signpost safe and trustworthy.
        </p>

        {/* Reason options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {FLAG_REASONS.map(reason => (
            <label
              key={reason}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)',
                padding: '10px 14px',
                background: selectedReason === reason ? 'rgba(255,107,133,0.06)' : 'var(--surface2)',
                border: selectedReason === reason ? '1px solid rgba(255,107,133,0.3)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="flag-reason"
                checked={selectedReason === reason}
                onChange={() => setSelectedReason(reason)}
                style={{ accentColor: '#ff6b85', width: 'auto', flexShrink: 0 }}
              />
              {reason}
            </label>
          ))}
        </div>

        {/* Details field for "Other concern" */}
        {selectedReason === 'Other concern' && (
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Please describe your concern..."
            rows={3}
            style={{
              width: '100%', background: 'var(--surface2)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '11px 14px', color: 'var(--text)', fontSize: '0.85rem',
              fontFamily: "'DM Sans', sans-serif", resize: 'vertical',
              outline: 'none', marginBottom: 20, boxSizing: 'border-box',
            }}
          />
        )}

        {/* Error */}
        {error && (
          <p style={{ color: '#ff6b85', fontSize: '0.82rem', marginBottom: 12 }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px', borderRadius: 100,
              border: '1px solid var(--border)', background: 'var(--surface2)',
              color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || submitting}
            style={{
              padding: '10px 20px', borderRadius: 100,
              border: 'none',
              background: selectedReason && !submitting ? '#ff6b85' : 'rgba(255,107,133,0.3)',
              color: selectedReason && !submitting ? '#000' : 'rgba(255,255,255,0.4)',
              fontSize: '0.85rem', fontWeight: 600,
              cursor: selectedReason && !submitting ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Flag'}
          </button>
        </div>
      </div>
    </div>
  )
}
