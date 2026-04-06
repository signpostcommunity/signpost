'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'

const radioStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 16px', borderRadius: 10,
  background: 'var(--surface)', border: '1px solid var(--border)',
  cursor: 'pointer', transition: 'all 0.15s',
  fontSize: '14px', color: 'var(--text)',
  fontFamily: "'Inter', sans-serif",
}

const radioSelectedStyle: React.CSSProperties = {
  ...radioStyle,
  background: 'rgba(167,139,250,0.08)',
  borderColor: 'rgba(167,139,250,0.4)',
}

const textareaStyle: React.CSSProperties = {
  width: '100%', minHeight: 100, padding: '12px 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: '15px',
  fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
  resize: 'vertical', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 500, fontSize: '14px',
  color: '#c8cdd8', marginBottom: 8, lineHeight: 1.5,
  fontFamily: "'Inter', sans-serif",
}

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif", fontWeight: 600,
  fontSize: '13px', letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#a78bfa',
  marginBottom: 20, marginTop: 40,
}

function RadioGroup({
  name, options, value, onChange,
}: {
  name: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      {options.map((opt) => (
        <label
          key={opt}
          style={value === opt ? radioSelectedStyle : radioStyle}
          onMouseEnter={(e) => {
            if (value !== opt) e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)'
          }}
          onMouseLeave={(e) => {
            if (value !== opt) e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            style={{ accentColor: '#a78bfa', width: 16, height: 16, flexShrink: 0 }}
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  )
}

export default function DeafBetaFeedbackPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [gutReaction, setGutReaction] = useState('')
  const [gutReactionText, setGutReactionText] = useState('')
  const [comfortLevel, setComfortLevel] = useState('')
  const [comfortText, setComfortText] = useState('')
  const [preferredListUsefulness, setPreferredListUsefulness] = useState('')
  const [interpreterInfo, setInterpreterInfo] = useState('')
  const [bookingProcess, setBookingProcess] = useState('')
  const [listFeatures, setListFeatures] = useState('')
  const [mostImportant, setMostImportant] = useState('')
  const [gotRight, setGotRight] = useState('')
  const [anythingElse, setAnythingElse] = useState('')
  const [name, setName] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/feedback/deaf-beta-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gutReaction,
          gutReactionText,
          comfortLevel,
          comfortText,
          preferredListUsefulness,
          interpreterInfo,
          bookingProcess,
          listFeatures,
          mostImportant,
          gotRight,
          anythingElse,
          name,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit')
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(167,139,250,0.12)', border: '2px solid rgba(167,139,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: '24px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: '27px',
            color: '#f0f2f8', margin: '0 0 12px',
          }}>
            Thank you.
          </h1>
          <p style={{
            fontSize: '15px', color: '#96a0b8', lineHeight: 1.6, margin: 0,
          }}>
            Your feedback has been sent to the signpost team. We read every response.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', padding: '48px 24px 80px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div className="wordmark" style={{ fontSize: '1.1rem', marginBottom: 16 }}>
            sign<span>post</span>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: '27px',
            color: '#f0f2f8', margin: '0 0 10px',
          }}>
            Deaf/DB/HH Beta Feedback
          </h1>
          <p style={{
            fontSize: '15px', color: '#96a0b8', lineHeight: 1.6, margin: 0, maxWidth: 560,
          }}>
            Thank you for taking the time to share your experience. Your feedback shapes everything we build.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Section: Your Experience ── */}
          <div style={sectionLabelStyle}>Your Experience</div>

          {/* Q1 */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>
              When you first landed on the signpost Deaf portal, what was your gut reaction?
            </label>
            <RadioGroup
              name="gutReaction"
              value={gutReaction}
              onChange={setGutReaction}
              options={[
                'This feels like it was made for me',
                'This feels promising but I have questions',
                "I'm not sure yet",
                "This doesn't feel right for me",
              ]}
            />
            <label style={{ ...labelStyle, marginTop: 12 }}>What shaped that reaction?</label>
            <textarea
              style={textareaStyle}
              value={gutReactionText}
              onChange={(e) => setGutReactionText(e.target.value)}
              placeholder="Share your thoughts..."
            />
          </div>

          {/* Q2 */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>
              How comfortable would you feel using signpost to manage your real interpreter needs?
            </label>
            <RadioGroup
              name="comfortLevel"
              value={comfortLevel}
              onChange={setComfortLevel}
              options={[
                'Very comfortable, I would use it today',
                'Mostly comfortable, a few things need to change first',
                'Somewhat comfortable, I have real concerns',
                'Not comfortable yet',
              ]}
            />
            <label style={{ ...labelStyle, marginTop: 12 }}>
              What would need to be true for you to fully trust this platform?
            </label>
            <textarea
              style={textareaStyle}
              value={comfortText}
              onChange={(e) => setComfortText(e.target.value)}
              placeholder="Share your thoughts..."
            />
          </div>

          {/* ── Section: Features ── */}
          <div style={sectionLabelStyle}>Features</div>

          {/* Q3 */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>
              How useful is the ability to build and share your own Preferred Interpreter List?
            </label>
            <textarea
              style={textareaStyle}
              value={preferredListUsefulness}
              onChange={(e) => setPreferredListUsefulness(e.target.value)}
              placeholder="Share your thoughts..."
            />
          </div>

          {/* Q4 */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>
              What information would you need to see about interpreters that is not here? What do you wish you could filter by?
            </label>
            <textarea
              style={textareaStyle}
              value={interpreterInfo}
              onChange={(e) => setInterpreterInfo(e.target.value)}
              placeholder="Share your thoughts..."
            />
          </div>

          {/* Q5 */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>
              Did the booking/request process feel straightforward? Was anything missing or confusing?
            </label>
            <textarea
              style={textareaStyle}
              value={bookingProcess}
              onChange={(e) => setBookingProcess(e.target.value)}
              placeholder="Share your thoughts..."
            />
          </div>

          {/* Q6 */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>
              Does having a Preferred List and a Do Not Book list feel useful? Is there anything about how this works that you would want to change?
            </label>
            <textarea
              style={textareaStyle}
              value={listFeatures}
              onChange={(e) => setListFeatures(e.target.value)}
              placeholder="Share your thoughts..."
            />
          </div>

          {/* ── Section: Overall ── */}
          <div style={sectionLabelStyle}>Overall</div>

          {/* Q7 */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>
              What is the single most important thing we should fix or add?
            </label>
            <textarea
              style={textareaStyle}
              value={mostImportant}
              onChange={(e) => setMostImportant(e.target.value)}
              placeholder="Share your thoughts..."
            />
          </div>

          {/* Q8 */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>
              What did we get right? What should we keep exactly as it is?
            </label>
            <textarea
              style={textareaStyle}
              value={gotRight}
              onChange={(e) => setGotRight(e.target.value)}
              placeholder="Share your thoughts..."
            />
          </div>

          {/* Q9 */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>
              Anything else you want us to know?
            </label>
            <textarea
              style={textareaStyle}
              value={anythingElse}
              onChange={(e) => setAnythingElse(e.target.value)}
              placeholder="Share your thoughts..."
            />
          </div>

          {/* Name */}
          <div style={{ marginBottom: 32 }}>
            <label style={labelStyle}>Your name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{
                width: '100%', padding: '11px 14px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)', fontSize: '15px',
                fontFamily: "'Inter', sans-serif", outline: 'none',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 16,
              background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.2)',
              color: '#ff8099', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 28px', borderRadius: 10,
              background: '#a78bfa', border: 'none',
              color: '#0a0a0f', fontSize: '15px', fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
              transition: 'opacity 0.15s',
              fontFamily: "'Inter', sans-serif",
              minWidth: 160, minHeight: 44,
            }}
          >
            {submitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </form>
      </div>

      <style>{`
        @media (max-width: 768px) {
          body { font-size: 14px; }
        }
      `}</style>
    </div>
  )
}
