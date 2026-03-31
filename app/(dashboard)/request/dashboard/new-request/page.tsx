'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/ui/Toast'

/* ── Constants ── */

const EVENT_CATEGORIES = [
  'Medical', 'Legal', 'Education', 'Employment', 'Government',
  'Conference', 'Community', 'Religious', 'Family/Personal', 'Other',
]

const SIGN_LANGUAGES = [
  'ASL', 'BSL', 'IS', 'LSE', 'LSF', 'JSL', 'LIBRAS', 'PTASL', 'Auslan', 'DGS', 'ISL',
]

const SPOKEN_LANGUAGES = [
  'English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'Japanese', 'Hebrew', 'German', 'Italian',
]

const SPECIALIZATIONS = [
  'Medical', 'Legal', 'Conference', 'Mental Health', 'Academic', 'Technical',
  'Arts & Media', 'Diplomatic', 'Business', 'Education', 'Religious',
  'DeafBlind', 'Government',
]

const RECURRENCE_OPTIONS = ['One-time', 'Weekly', 'Bi-weekly', 'Monthly']

/* ── Styles ── */

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.82rem', fontWeight: 600,
  color: 'var(--text)', marginBottom: 6,
  fontFamily: "'DM Sans', sans-serif",
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
  fontSize: '15px', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', transition: 'border-color 0.15s',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238891a8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: 36,
}

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.7rem',
  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
  color: 'var(--muted)', margin: '32px 0 16px',
}

const errorStyle: React.CSSProperties = {
  fontSize: '0.78rem', color: 'var(--accent3)', marginTop: 4,
}

/* ── Component ── */

export default function NewRequestPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null)

  // Check if requester has a payment method on file
  useEffect(() => {
    async function checkPaymentMethod() {
      try {
        const res = await fetch('/api/stripe/payment-method')
        const data = await res.json()
        setHasPaymentMethod(!!data.paymentMethod)
      } catch {
        setHasPaymentMethod(false)
      }
    }
    checkPaymentMethod()
  }, [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [eventCategory, setEventCategory] = useState('')
  const [date, setDate] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [recurrence, setRecurrence] = useState('One-time')
  const [format, setFormat] = useState<'in_person' | 'remote'>('in_person')
  const [location, setLocation] = useState('')
  const [remotePlatform, setRemotePlatform] = useState('')
  const [signLanguage, setSignLanguage] = useState('ASL')
  const [spokenLanguage, setSpokenLanguage] = useState('English')
  const [interpreterCount, setInterpreterCount] = useState(1)
  const [specialization, setSpecialization] = useState('')
  const [notes, setNotes] = useState('')

  // DHH client info
  const [showDhhClient, setShowDhhClient] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientCommPrefs, setClientCommPrefs] = useState('')

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!eventCategory) errs.eventCategory = 'Category is required'
    if (!date) errs.date = 'Date is required'
    if (!timeStart) errs.timeStart = 'Start time is required'
    if (!timeEnd) errs.timeEnd = 'End time is required'
    if (!signLanguage) errs.signLanguage = 'Sign language is required'
    if (format === 'in_person' && !location.trim()) errs.location = 'Location is required for in-person events'
    if (date) {
      const today = new Date().toISOString().split('T')[0]
      if (date < today) errs.date = 'Date must be today or in the future'
    }
    if (timeStart && timeEnd && timeStart >= timeEnd) {
      errs.timeEnd = 'End time must be after start time'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(saveAsDraft: boolean) {
    if (!saveAsDraft && !validate()) return

    // Gate: require payment method for non-draft submissions
    if (!saveAsDraft && !hasPaymentMethod) {
      setToast({ message: 'Add a payment method to submit requests.', type: 'error' })
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/request/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          date: date || null,
          timeStart: timeStart || null,
          timeEnd: timeEnd || null,
          format,
          location: format === 'in_person' ? location : remotePlatform,
          eventCategory: eventCategory || null,
          specialization: specialization || null,
          recurrence: recurrence.toLowerCase().replace('-', '_'),
          interpreterCount,
          description: `Sign language: ${signLanguage}. Spoken language: ${spokenLanguage}.`,
          notes: notes || null,
          saveAsDraft,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || 'Failed to submit request', type: 'error' })
        setSubmitting(false)
        return
      }

      setToast({ message: saveAsDraft ? 'Draft saved.' : 'Request submitted. Interpreters will be notified.', type: 'success' })
      setTimeout(() => router.push('/request/dashboard'), 1500)
    } catch {
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' })
      setSubmitting(false)
    }
  }

  const platformFee = 15.0 * interpreterCount

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.6rem', margin: '0 0 6px' }}>
          New Interpreter Request
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0 0 26px' }}>
          Fill out the details below to request an interpreter for your event.
        </p>

        {/* ── Section 1: Event Details ── */}
        <h3 style={sectionLabelStyle}>Event Details</h3>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>What is this event? *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Medical appointment, Staff meeting, Conference keynote"
            style={inputStyle}
          />
          {errors.title && <div style={errorStyle}>{errors.title}</div>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Event Category *</label>
          <select value={eventCategory} onChange={e => setEventCategory(e.target.value)} style={selectStyle}>
            <option value="">Select a category</option>
            {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.eventCategory && <div style={errorStyle}>{errors.eventCategory}</div>}
        </div>

        <div className="req-date-time-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            {errors.date && <div style={errorStyle}>{errors.date}</div>}
          </div>
          <div>
            <label style={labelStyle}>Start Time *</label>
            <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} style={inputStyle} />
            {errors.timeStart && <div style={errorStyle}>{errors.timeStart}</div>}
          </div>
          <div>
            <label style={labelStyle}>End Time *</label>
            <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} style={inputStyle} />
            {errors.timeEnd && <div style={errorStyle}>{errors.timeEnd}</div>}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Recurrence</label>
          <select value={recurrence} onChange={e => setRecurrence(e.target.value)} style={selectStyle}>
            {RECURRENCE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Format *</label>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['in_person', 'remote'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: format === f ? 'rgba(0,229,255,0.1)' : 'var(--surface)',
                  border: `1px solid ${format === f ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  color: format === f ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: 600, fontSize: '0.88rem',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                {f === 'in_person' ? 'In-person' : 'Remote'}
              </button>
            ))}
          </div>
        </div>

        {format === 'in_person' && (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Location *</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Full address"
              style={inputStyle}
            />
            {errors.location && <div style={errorStyle}>{errors.location}</div>}
          </div>
        )}

        {format === 'remote' && (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Remote Platform</label>
            <input
              type="text"
              value={remotePlatform}
              onChange={e => setRemotePlatform(e.target.value)}
              placeholder="e.g. Zoom, Microsoft Teams, Google Meet"
              style={inputStyle}
            />
          </div>
        )}

        {/* ── Section 2: Interpreter Needs ── */}
        <h3 style={sectionLabelStyle}>Interpreter Needs</h3>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Sign Language Needed *</label>
          <select value={signLanguage} onChange={e => setSignLanguage(e.target.value)} style={selectStyle}>
            {SIGN_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {errors.signLanguage && <div style={errorStyle}>{errors.signLanguage}</div>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Spoken Language Needed</label>
          <select value={spokenLanguage} onChange={e => setSpokenLanguage(e.target.value)} style={selectStyle}>
            {SPOKEN_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Number of Interpreters Needed</label>
          <input
            type="number"
            min={1}
            max={10}
            value={interpreterCount}
            onChange={e => setInterpreterCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            style={{ ...inputStyle, maxWidth: 120 }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Specialization Needed</label>
          <select value={specialization} onChange={e => setSpecialization(e.target.value)} style={selectStyle}>
            <option value="">None specified</option>
            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Additional Notes for Interpreters</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional context, preparation materials, or special requirements"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />
        </div>

        {/* ── Section 3: DHH Client Info ── */}
        <h3 style={sectionLabelStyle}>Deaf/DB/HH Client Info</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 16, lineHeight: 1.6 }}>
          Is there a specific Deaf, DeafBlind, or Hard of Hearing person this booking is for?
        </p>

        <button
          type="button"
          onClick={() => setShowDhhClient(!showDhhClient)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '10px 16px',
            color: showDhhClient ? 'var(--accent)' : 'var(--muted)',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.15s',
          }}
        >
          <span style={{
            width: 20, height: 20, borderRadius: 6,
            border: `2px solid ${showDhhClient ? 'var(--accent)' : 'var(--border)'}`,
            background: showDhhClient ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', flexShrink: 0,
          }}>
            {showDhhClient && (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M4 8l3 3 5-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          Yes, add client details
        </button>

        {showDhhClient && (
          <div style={{
            marginTop: 16, padding: '20px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Client Name</label>
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full name" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Client Email (optional)</label>
              <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@example.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Communication Preferences Notes</label>
              <textarea value={clientCommPrefs} onChange={e => setClientCommPrefs(e.target.value)} placeholder="e.g. Prefers ASL, uses cochlear implant" rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
              If they have a signpost account, their preferred interpreter list will be integrated into your request. If they don&apos;t have an account, they will receive a notification that you&apos;ve created an interpreter request on their behalf, along with an invitation to view the request&apos;s status.
            </p>
          </div>
        )}

        {/* ── Section 4: Review & Platform Fee ── */}
        <h3 style={sectionLabelStyle}>Review &amp; Platform Fee</h3>

        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 20,
        }}>
          <div className="req-review-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', fontSize: '0.85rem', marginBottom: 16 }}>
            <div>
              <span style={{ color: 'var(--muted)' }}>Event: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{title || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Category: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{eventCategory || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Date: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{date || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Time: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                {timeStart && timeEnd ? `${timeStart} – ${timeEnd}` : '—'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Format: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{format === 'in_person' ? 'In-person' : 'Remote'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Interpreters: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{interpreterCount}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>
              A <strong style={{ color: 'var(--text)' }}>$15.00 platform fee</strong> per interpreter will be charged when a booking is confirmed. This fee supports signpost and is separate from the interpreter&apos;s rate.
            </p>
            <div style={{
              background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)',
              borderRadius: 'var(--radius-sm)', padding: '12px 16px',
              fontSize: '0.88rem', color: 'var(--accent)', fontWeight: 600,
            }}>
              $15.00 x {interpreterCount} interpreter{interpreterCount !== 1 ? 's' : ''} = ${platformFee.toFixed(2)} platform fee
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>
              No additional fees are charged by signpost, to any party. Interpreters receive 100% of their rate, signpost does not take a commission. You will not be charged until you confirm an interpreter&apos;s rate and accept the booking.
            </p>
          </div>
        </div>

        {/* Smart directory link */}
        {(() => {
          const params = new URLSearchParams({ context: 'requester' })
          if (signLanguage) params.set('signLang', signLanguage)
          if (spokenLanguage) params.set('spokenLang', spokenLanguage)
          if (specialization) params.set('spec', specialization)
          if (location) params.set('location', location)
          if (format) params.set('workMode', format)
          return (
            <Link
              href={`/directory?${params.toString()}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
                color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600,
                textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
                marginTop: 20, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.06)' }}
            >
              Browse matching interpreters &#8594;
            </Link>
          )
        })()}

        {/* Payment method gate warning */}
        {hasPaymentMethod === false && (
          <div style={{
            marginTop: 24,
            padding: '14px 18px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            color: '#c8cdd8',
            lineHeight: 1.6,
          }}>
            <Link
              href="/request/dashboard/profile"
              style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline' }}
            >
              Add a payment method
            </Link>
            {' '}to submit requests. You&apos;ll only be charged when a booking is confirmed.
          </div>
        )}

        {/* ── Actions ── */}
        <div className="req-form-actions" style={{ display: 'flex', gap: 12, marginTop: 32, marginBottom: 48 }}>
          <button
            className="btn-primary"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            style={{
              padding: '14px 32px', fontSize: '0.92rem', fontWeight: 700,
              opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '14px 24px',
              color: 'var(--muted)', fontSize: '0.88rem', fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'border-color 0.15s',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            Save as Draft
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
        }
        @media (max-width: 640px) {
          .req-date-time-grid { grid-template-columns: 1fr !important; }
          .req-review-grid { grid-template-columns: 1fr !important; }
          .req-form-actions { flex-direction: column !important; }
          .req-form-actions button { width: 100% !important; text-align: center !important; }
        }
        @media (max-width: 480px) {
          .dash-page-content { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}
