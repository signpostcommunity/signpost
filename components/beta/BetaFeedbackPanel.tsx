'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

// ── Route content map ────────────────────────────────────────────────────────

type RouteContent = {
  prompt: string
  scenario?: string
  specificQuestion?: string
}

function getRouteContent(pathname: string): RouteContent {
  if (pathname === '/interpreter') {
    return {
      prompt: "Welcome to the signpost interpreter beta! Take a moment to look over this page — then when you're ready, go ahead and create your interpreter account. As you move through each step, drop your notes here — anything confusing, broken, missing, or that you love.",
    }
  }
  if (pathname.startsWith('/interpreter/signup')) {
    return {
      prompt: "You're building your interpreter profile. Note anything that's missing, confusing, or doesn't work as expected.",
      specificQuestion: 'Is there anything missing that Deaf clients or organizations would need to see?',
    }
  }
  if (pathname === '/interpreter/dashboard') {
    return {
      prompt: "This is your home base — have a look around!",
      scenario: "It's 8pm and you're feeling sick. You have a job tomorrow. How do you let the requester know and start looking for a sub?",
      specificQuestion: "What's the first thing you went looking for?",
    }
  }
  if (pathname === '/interpreter/dashboard/inquiries') {
    return {
      prompt: 'You have a new booking request. Try checking and responding to it.',
      scenario: 'Check and respond to a pending request.',
      specificQuestion: 'Was it clear what you were supposed to do and what would happen next?',
    }
  }
  if (pathname === '/interpreter/dashboard/inbox') {
    return {
      prompt: 'You have a message. Try reading and responding to it.',
      scenario: 'Respond to a message in your inbox.',
      specificQuestion: 'Did messaging feel natural, or was anything awkward or missing?',
    }
  }
  if (pathname === '/interpreter/dashboard/profile') {
    return {
      prompt: "You're looking at your public profile — this is what Deaf clients and organizations will see.",
      specificQuestion: "Does this represent you the way you'd want to be seen?",
    }
  }
  if (pathname === '/interpreter/dashboard/rates') {
    return {
      prompt: "You're setting your rates and terms.",
      specificQuestion: "What's missing that you'd need to work professionally? (minimum call time, cancellation windows, travel pay, etc.)",
    }
  }
  if (pathname === '/interpreter/dashboard/availability') {
    return {
      prompt: "You're setting your availability.",
      specificQuestion: "Does this give you enough control over when and how you're booked?",
    }
  }
  if (pathname === '/interpreter/dashboard/team') {
    return {
      prompt: 'This is where you manage your preferred team interpreters.',
      scenario: 'Add an interpreter to your Preferred Team list. Try finding them in the directory.',
      specificQuestion: 'Was finding and adding them straightforward?',
    }
  }
  if (pathname === '/directory' || pathname.startsWith('/directory/')) {
    return {
      prompt: "This is where Deaf clients and organizations search for interpreters — but it's also where you can find and add colleagues to your Preferred Team list. Have a look around from both perspectives.",
      specificQuestion: "Does your profile show up the way you'd expect? Is there anything about how interpreters are displayed that you'd want to change?",
    }
  }
  // Default
  const pageName = pathname.split('/').filter(Boolean).pop() || 'this page'
  return {
    prompt: `You're on ${pageName}. Note anything that feels off, confusing, or missing.`,
  }
}

// ── Shared styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif", fontSize: '0.72rem', fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: 'var(--accent)', marginBottom: 8, display: 'block',
}

const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', minHeight: 90, resize: 'vertical',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
  color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
  outline: 'none',
}

const radioLabelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
  fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.5, padding: '4px 0',
}

// ── End of Session View ──────────────────────────────────────────────────────

function EndOfSessionView({ onSubmit }: { onSubmit: (data: Record<string, unknown>) => void }) {
  const [professionalNeeds, setProfessionalNeeds] = useState('')
  const [professionalNotes, setProfessionalNotes] = useState('')
  const [usedMobile, setUsedMobile] = useState('')
  const [mobileIssues, setMobileIssues] = useState('')
  const [missingInfo, setMissingInfo] = useState('')
  const [missingInfoDetails, setMissingInfoDetails] = useState('')
  const [missingSettings, setMissingSettings] = useState('')
  const [schedulingConflicts, setSchedulingConflicts] = useState('')
  const [starRatings, setStarRatings] = useState('')
  const [whoCanRate, setWhoCanRate] = useState<string[]>([])
  const [dhhCategories, setDhhCategories] = useState('')
  const [orgCategories, setOrgCategories] = useState('')
  const [ratingDisplay, setRatingDisplay] = useState('')
  const [premiumInterest, setPremiumInterest] = useState('')
  const [premiumPrice, setPremiumPrice] = useState('')
  const [dreamPlatform, setDreamPlatform] = useState('')
  const [finalThought, setFinalThought] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function toggleWhoCanRate(val: string) {
    setWhoCanRate(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  function handleSubmit() {
    onSubmit({
      professionalNeeds, professionalNotes,
      usedMobile, mobileIssues,
      missingInfo, missingInfoDetails, missingSettings,
      schedulingConflicts,
      starRatings, whoCanRate, dhhCategories, orgCategories, ratingDisplay,
      premiumInterest, premiumPrice, dreamPlatform,
      finalThought,
    })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>
          Final Questions
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
          Thank you for exploring signpost! These last questions help us understand what matters most.
        </p>
      </div>

      {/* Professional needs */}
      <div>
        <label style={labelStyle}>Professional Needs</label>
        {['Exceeds my needs', 'Meets my needs', 'Partially meets my needs — some things are missing', "Doesn't meet my needs yet", "I don't use other platforms"].map(opt => (
          <label key={opt} style={radioLabelStyle}>
            <input type="radio" name="profNeeds" value={opt} checked={professionalNeeds === opt} onChange={() => setProfessionalNeeds(opt)} style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
            <span>{opt}</span>
          </label>
        ))}
        <textarea style={{ ...textareaStyle, marginTop: 10 }} placeholder="What's working well, and what's missing?" value={professionalNotes} onChange={e => setProfessionalNotes(e.target.value)} />
      </div>

      {/* Mobile */}
      <div>
        <label style={labelStyle}>Mobile</label>
        <p style={{ color: 'var(--muted)', fontSize: '0.84rem', margin: '0 0 8px' }}>Did you use signpost on your phone or tablet?</p>
        {['Yes', 'No'].map(opt => (
          <label key={opt} style={radioLabelStyle}>
            <input type="radio" name="mobile" value={opt} checked={usedMobile === opt} onChange={() => setUsedMobile(opt)} style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
            <span>{opt}</span>
          </label>
        ))}
        {usedMobile === 'Yes' && (
          <textarea style={{ ...textareaStyle, marginTop: 10 }} placeholder="Were any buttons, menus, or text difficult to tap or read?" value={mobileIssues} onChange={e => setMobileIssues(e.target.value)} />
        )}
      </div>

      {/* Missing info */}
      <div>
        <label style={labelStyle}>Missing Information</label>
        <p style={{ color: 'var(--muted)', fontSize: '0.84rem', margin: '0 0 8px' }}>Is there any professional information you couldn't add that feels essential for getting booked?</p>
        {['Yes', 'No'].map(opt => (
          <label key={opt} style={radioLabelStyle}>
            <input type="radio" name="missingInfo" value={opt} checked={missingInfo === opt} onChange={() => setMissingInfo(opt)} style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
            <span>{opt}</span>
          </label>
        ))}
        {missingInfo === 'Yes' && (
          <textarea style={{ ...textareaStyle, marginTop: 10 }} placeholder="What's missing?" value={missingInfoDetails} onChange={e => setMissingInfoDetails(e.target.value)} />
        )}
        <textarea style={{ ...textareaStyle, marginTop: 10 }} placeholder="Are there any work settings, skillsets, or affinity groups that should be added?" value={missingSettings} onChange={e => setMissingSettings(e.target.value)} />
      </div>

      {/* Scheduling conflicts */}
      <div>
        <label style={labelStyle}>Scheduling Conflicts</label>
        {['Yes, easy', 'I tried but it was confusing', "I couldn't figure it out", "I didn't try this"].map(opt => (
          <label key={opt} style={radioLabelStyle}>
            <input type="radio" name="scheduling" value={opt} checked={schedulingConflicts === opt} onChange={() => setSchedulingConflicts(opt)} style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
            <span>{opt}</span>
          </label>
        ))}
      </div>

      {/* Star ratings */}
      <div>
        <label style={labelStyle}>Star Ratings</label>
        {['Love it', "It's fine", 'Not sure', "I don't like it"].map(opt => (
          <label key={opt} style={radioLabelStyle}>
            <input type="radio" name="starRatings" value={opt} checked={starRatings === opt} onChange={() => setStarRatings(opt)} style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
            <span>{opt}</span>
          </label>
        ))}
        <div style={{ marginTop: 12 }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.84rem', margin: '0 0 8px' }}>Who should be able to rate?</p>
          {['Deaf/HoH consumers only', 'Organizations only', 'Both'].map(opt => (
            <label key={opt} style={radioLabelStyle}>
              <input type="checkbox" checked={whoCanRate.includes(opt)} onChange={() => toggleWhoCanRate(opt)} style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        <textarea style={{ ...textareaStyle, marginTop: 10 }} placeholder="If D/HH consumers could rate, what categories would matter most? (e.g. Easy to understand, Matched my communication style, Met my needs, Put me at ease)" value={dhhCategories} onChange={e => setDhhCategories(e.target.value)} />
        <textarea style={{ ...textareaStyle, marginTop: 10 }} placeholder="If organizations could rate, what categories would matter most? (e.g. Professionalism, Punctuality, Followed assignment protocols, Would hire again)" value={orgCategories} onChange={e => setOrgCategories(e.target.value)} />
        <div style={{ marginTop: 12 }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.84rem', margin: '0 0 8px' }}>How should ratings be displayed?</p>
          {[
            'Separately — Ratings from D/HH consumers and Ratings from organizations',
            'Combined average only',
            'Both — overall average with option to expand',
          ].map(opt => (
            <label key={opt} style={radioLabelStyle}>
              <input type="radio" name="ratingDisplay" value={opt} checked={ratingDisplay === opt} onChange={() => setRatingDisplay(opt)} style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Premium subscription */}
      <div>
        <label style={labelStyle}>Premium Subscription</label>
        {['Definitely', 'Maybe', 'Probably not', 'No'].map(opt => (
          <label key={opt} style={radioLabelStyle}>
            <input type="radio" name="premium" value={opt} checked={premiumInterest === opt} onChange={() => setPremiumInterest(opt)} style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
            <span>{opt}</span>
          </label>
        ))}
        {(premiumInterest === 'Definitely' || premiumInterest === 'Maybe') && (
          <div style={{ marginTop: 10 }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.84rem', margin: '0 0 8px' }}>What price feels right?</p>
            {['$5\u201310/mo', '$10\u201320/mo', '$20\u201330/mo', 'More, if the features are right'].map(opt => (
              <label key={opt} style={radioLabelStyle}>
                <input type="radio" name="premiumPrice" value={opt} checked={premiumPrice === opt} onChange={() => setPremiumPrice(opt)} style={{ accentColor: 'var(--accent)', marginTop: 3, flexShrink: 0 }} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
        <textarea style={{ ...textareaStyle, marginTop: 10 }} placeholder="What would your dream interpreter platform include?" value={dreamPlatform} onChange={e => setDreamPlatform(e.target.value)} />
      </div>

      {/* Final question */}
      <div>
        <label style={labelStyle}>One Last Thing</label>
        <textarea style={textareaStyle} placeholder="What's the one thing you'd most want Molly to know?" value={finalThought} onChange={e => setFinalThought(e.target.value)} />
      </div>

      <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', padding: '12px 20px' }}>
        {submitted ? '\u2713 Thank you!' : 'Submit final feedback'}
      </button>
    </div>
  )
}

// ── Main Panel ───────────────────────────────────────────────────────────────

export default function BetaFeedbackPanel() {
  const pathname = usePathname()
  const [open, setOpen] = useState(true)
  const [notes, setNotes] = useState('')
  const [specificAnswer, setSpecificAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showEndOfSession, setShowEndOfSession] = useState(false)
  const [visitedDashboard, setVisitedDashboard] = useState(false)

  // Load collapse state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('signpost_beta_panel_open')
    if (stored !== null) setOpen(stored === 'true')
  }, [])

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem('signpost_beta_panel_open', String(open))
  }, [open])

  // Track dashboard visit
  useEffect(() => {
    if (pathname === '/interpreter/dashboard') {
      sessionStorage.setItem('signpost_visited_dashboard', 'true')
    }
    setVisitedDashboard(sessionStorage.getItem('signpost_visited_dashboard') === 'true')
  }, [pathname])

  // Clear form on route change
  useEffect(() => {
    setNotes('')
    setSpecificAnswer('')
    setSubmitted(false)
    setShowEndOfSession(false)
  }, [pathname])

  const content = getRouteContent(pathname)
  const pageName = pathname.split('/').filter(Boolean).pop() || 'Home'

  async function handleSubmit() {
    try {
      await fetch('/api/beta-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: pathname, notes, specificAnswer }),
      })
    } catch { /* silent */ }
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setNotes('')
      setSpecificAnswer('')
    }, 2000)
  }

  async function handleEndOfSessionSubmit(data: Record<string, unknown>) {
    try {
      await fetch('/api/beta-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: pathname,
          notes: '',
          specificAnswer: '',
          isEndOfSession: true,
          endOfSessionData: data,
        }),
      })
    } catch { /* silent */ }
  }

  return (
    <>
      {/* Collapse tab — always visible */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="beta-panel-tab"
          style={{
            position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
            zIndex: 999, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRight: 'none', borderRadius: '8px 0 0 8px',
            padding: '14px 8px', cursor: 'pointer',
            writingMode: 'vertical-rl', textOrientation: 'mixed',
            fontFamily: "'Syne', sans-serif", fontSize: '0.78rem', fontWeight: 700,
            color: 'var(--accent)', letterSpacing: '0.04em',
          }}
        >
          Feedback
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="beta-panel"
          style={{
            position: 'fixed', right: 0, top: 0, bottom: 0,
            width: 320, zIndex: 999,
            background: 'var(--surface)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div className="wordmark" style={{ fontSize: '1rem', marginBottom: 4 }}>
                sign<span>post</span>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'capitalize' }}>
                {pageName}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none', border: 'none', color: 'var(--muted)',
                fontSize: '1.1rem', cursor: 'pointer', padding: '0 4px',
              }}
            >
              &times;
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {showEndOfSession ? (
              <EndOfSessionView onSubmit={handleEndOfSessionSubmit} />
            ) : (
              <>
                {/* Prompt */}
                <p style={{ color: 'var(--text)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                  {content.prompt}
                </p>

                {/* Scenario */}
                {content.scenario && (
                  <div style={{
                    background: 'var(--surface2)', borderLeft: '2px solid var(--accent)',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    padding: '10px 14px',
                  }}>
                    <div style={{
                      fontFamily: "'Syne', sans-serif", fontSize: '0.72rem', fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'var(--accent)', marginBottom: 6,
                    }}>
                      Try this
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                      {content.scenario}
                    </p>
                  </div>
                )}

                {/* Notes textarea */}
                <div>
                  <label style={labelStyle}>Open Notes</label>
                  <textarea
                    style={textareaStyle}
                    placeholder="Anything confusing, broken, missing, or that you love..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                  />
                </div>

                {/* Specific question */}
                {content.specificQuestion && (
                  <div>
                    <label style={labelStyle}>Specific Question</label>
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.5, margin: '0 0 8px' }}>
                      {content.specificQuestion}
                    </p>
                    <textarea
                      style={textareaStyle}
                      placeholder="Your answer..."
                      value={specificAnswer}
                      onChange={e => setSpecificAnswer(e.target.value)}
                      onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                    />
                  </div>
                )}

                {/* Submit */}
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  style={{ width: '100%', padding: '11px 20px' }}
                >
                  {submitted ? '\u2713 Got it, thank you!' : 'Submit feedback for this page'}
                </button>
              </>
            )}
          </div>

          {/* Footer — end of session CTA */}
          {visitedDashboard && !showEndOfSession && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setShowEndOfSession(true)}
                style={{
                  width: '100%', background: 'none', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
                  padding: '10px 16px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
                  transition: 'all 0.15s', textAlign: 'center',
                }}
              >
                I'm done exploring &mdash; take me to the final questions &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .beta-panel { width: 100% !important; }
          .beta-panel-tab { display: none !important; }
        }
        @media (min-width: 769px) {
          .beta-panel ~ .dash-layout,
          .beta-panel ~ div { margin-right: 320px; }
        }
      `}</style>
    </>
  )
}
