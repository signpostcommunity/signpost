'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface InterpreterRatingProps {
  bookingId: string
  interpreterId: string
  interpreterName: string
  onRated?: () => void
}

/* SVG star for ratings */
function Star({ filled, onClick, size = 28 }: { filled: boolean; onClick: () => void; size?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={filled ? 'Selected' : 'Not selected'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 2,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#00e5ff' : 'none'} stroke={filled ? '#00e5ff' : 'rgba(184,191,207,0.4)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  )
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: '0.85rem',
        color: 'var(--text)',
        marginBottom: 8,
        lineHeight: 1.5,
        fontWeight: 500,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 4 }} role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map(n => (
          <Star key={n} filled={n <= value} onClick={() => onChange(n)} />
        ))}
      </div>
    </div>
  )
}

function PillButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 22px',
        borderRadius: 100,
        border: selected ? '1px solid #00e5ff' : '1px solid var(--border)',
        background: selected ? '#00e5ff' : 'var(--surface2)',
        color: selected ? '#000' : 'var(--muted)',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.85rem',
        fontWeight: selected ? 700 : 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}

export default function InterpreterRating({ bookingId, interpreterId, interpreterName, onRated }: InterpreterRatingProps) {
  const [ratingMetNeeds, setRatingMetNeeds] = useState(0)
  const [ratingProfessional, setRatingProfessional] = useState(0)
  const [wouldBookAgain, setWouldBookAgain] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [shareWithInterpreter, setShareWithInterpreter] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyRated, setAlreadyRated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkExistingRating = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('interpreter_ratings')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('interpreter_id', interpreterId)
        .maybeSingle()

      if (data) {
        setAlreadyRated(true)
      }
    } catch {
      // ignore
    }
  }, [bookingId, interpreterId])

  useEffect(() => {
    checkExistingRating()
  }, [checkExistingRating])

  if (alreadyRated || submitted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '16px 20px',
        background: 'rgba(52,211,153,0.06)',
        border: '1px solid rgba(52,211,153,0.2)',
        borderRadius: 'var(--radius-sm)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <span style={{ fontSize: '0.88rem', color: '#34d399', fontWeight: 600 }}>
          Feedback submitted
        </span>
      </div>
    )
  }

  const canSubmit = ratingMetNeeds > 0 && ratingProfessional > 0 && wouldBookAgain !== null && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/dhh/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          interpreterId,
          ratingMetNeeds,
          ratingProfessional,
          wouldBookAgain,
          feedbackText: feedbackText.trim() || null,
          sharedWithInterpreter: shareWithInterpreter,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Failed to submit feedback')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
      onRated?.()
    } catch {
      setError('Failed to submit feedback. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      marginTop: 12,
    }}>
      <h3 style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: '1rem',
        color: 'var(--text)',
        margin: '0 0 20px 0',
      }}>
        How was your experience?
      </h3>

      {/* Question 1: Met needs */}
      <StarRating
        value={ratingMetNeeds}
        onChange={setRatingMetNeeds}
        label="This interpreter met my needs: I understood them clearly and they understood me"
      />

      {/* Question 2: Professional */}
      <StarRating
        value={ratingProfessional}
        onChange={setRatingProfessional}
        label="This interpreter was professional: was on-time, was prepared, dressed and behaved appropriately"
      />

      {/* Question 3: Would book again */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--text)',
          marginBottom: 10,
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          Would you book this interpreter again?
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Yes', 'Maybe', 'No'].map(opt => (
            <PillButton
              key={opt}
              label={opt}
              selected={wouldBookAgain === opt.toLowerCase()}
              onClick={() => setWouldBookAgain(opt.toLowerCase())}
            />
          ))}
        </div>
      </div>

      {/* Optional feedback textarea */}
      <div style={{ marginBottom: 16 }}>
        <textarea
          placeholder="Any additional feedback? This is 100% confidential."
          value={feedbackText}
          onChange={e => setFeedbackText(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            color: 'var(--text)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.85rem',
            outline: 'none',
            resize: 'vertical',
            minHeight: 80,
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      {/* Share checkbox */}
      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: 'pointer',
        marginBottom: 14,
      }}>
        <input
          type="checkbox"
          checked={shareWithInterpreter}
          onChange={e => setShareWithInterpreter(e.target.checked)}
          style={{
            marginTop: 3,
            accentColor: '#00e5ff',
            width: 16,
            height: 16,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
          Also share my written feedback directly with the interpreter
        </span>
      </label>

      {/* Confidentiality notice */}
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--muted)',
        lineHeight: 1.6,
        marginBottom: shareWithInterpreter ? 8 : 20,
        padding: '0 0 0 26px',
      }}>
        Your ratings are 100% confidential and never shared with interpreters, unless you want it shared. Honest feedback helps signpost maintain a directory that serves the Deaf community well. Interpreters who receive a consistent pattern of concerns may be reviewed by signpost.
      </div>

      {shareWithInterpreter && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--accent)',
          lineHeight: 1.6,
          marginBottom: 20,
          padding: '0 0 0 26px',
        }}>
          Your written feedback above will be sent to the interpreter&#39;s inbox as a direct message. Your star ratings will not be included.
        </div>
      )}

      {error && (
        <div style={{
          fontSize: '0.82rem',
          color: 'var(--accent3)',
          marginBottom: 14,
        }}>
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          padding: '10px 28px',
          fontSize: '0.88rem',
          opacity: canSubmit ? 1 : 0.4,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'Submitting...' : 'Submit feedback'}
      </button>
    </div>
  )
}
