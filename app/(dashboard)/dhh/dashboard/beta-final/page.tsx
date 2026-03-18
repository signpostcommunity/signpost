'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// ── Question definitions ────────────────────────────────────────────────────

type QuestionDef = {
  step: number
  title: string
  question: string
  key: string
  choices?: string[]
  followUp?: { key: string; label: string }
  freeTextQuestions?: { key: string; label: string }[]
}

const QUESTIONS: QuestionDef[] = [
  {
    step: 1,
    title: 'Trust',
    key: 'trust_level',
    question: 'How comfortable would you feel using signpost to manage your real interpreter needs?',
    choices: [
      "Very comfortable. I'd use it today.",
      'Mostly comfortable. A few things need to change first.',
      'Somewhat comfortable. I have real concerns.',
      'Not comfortable yet.',
    ],
    followUp: { key: 'trust_followup', label: 'What would need to be true for you to fully trust this platform?' },
  },
  {
    step: 2,
    title: 'Preferred List',
    key: 'preferred_list_value',
    question: 'How useful is the ability to build and share your own Preferred Interpreter List?',
    choices: [
      'Extremely useful. This changes things for me.',
      "Useful. I'd use it.",
      'Somewhat useful.',
      "Not useful for how I work.",
    ],
    followUp: { key: 'preferred_list_followup', label: "Is there anything about how the list works that doesn't match how you actually think about your interpreters?" },
  },
  {
    step: 3,
    title: 'Do Not Book',
    key: 'dnb_value',
    question: 'How important is the Do Not Book feature to you?',
    choices: [
      "Very important. This is something I've needed for a long time.",
      'Somewhat important.',
      'Nice to have.',
      "Not something I'd use.",
    ],
    followUp: { key: 'dnb_followup', label: 'Anything you want to tell us about this?' },
  },
  {
    step: 4,
    title: 'Visibility',
    key: 'transparency_value',
    question: "The request tracker shows you which interpreters have been contacted, who's responded, and who's confirmed. How does that level of transparency feel?",
    choices: [
      "Like exactly what I've always needed.",
      'Good, but I want more control over it.',
      'Neutral.',
      "I'm not sure I want that much visibility.",
    ],
    followUp: { key: 'transparency_followup', label: "What would you want to be able to see or do that you can't right now?" },
  },
  {
    step: 5,
    title: 'Directory',
    key: 'directory_value',
    question: 'When browsing interpreter profiles, did you feel like you had enough information to make a real choice?',
    choices: [
      'Yes. I felt genuinely informed.',
      'Mostly. A few things were missing.',
      'Not really. I needed more information.',
      "No. I couldn't tell enough from what was there.",
    ],
    followUp: { key: 'directory_followup', label: "What's missing that you'd need to make a confident choice?" },
  },
  {
    step: 6,
    title: 'Personal Requests',
    key: 'personal_request_value',
    question: 'How likely are you to use the personal request feature (for non-work events like family gatherings, personal appointments, etc.)?',
    choices: [
      'Very likely. This fills a real gap.',
      'Somewhat likely.',
      'Unlikely. I handle these differently.',
      "I wouldn't use this.",
    ],
  },
  {
    step: 7,
    title: 'What we got right / wrong',
    key: 'got_right',
    question: '',
    freeTextQuestions: [
      { key: 'got_right', label: 'Is there anything on signpost that felt genuinely different from your experience with other interpreter platforms or agencies?' },
      { key: 'got_wrong', label: "Is there anything that felt like we missed the point? Something that doesn't match how things actually work in your life?" },
    ],
  },
  {
    step: 8,
    title: 'Community',
    key: 'recommend_value',
    question: 'Would you recommend signpost to other Deaf, DeafBlind, or Hard of Hearing people you know?',
    choices: [
      'Yes, without hesitation.',
      'Yes, once a few things are fixed.',
      "Maybe. I'd want to see more first.",
      'No.',
    ],
  },
  {
    step: 9,
    title: 'Final',
    key: 'final_thoughts',
    question: '',
    freeTextQuestions: [
      { key: 'final_thoughts', label: 'Is there anything else you want Regina and Molly to know?' },
    ],
  },
]

// ── Styles ──────────────────────────────────────────────────────────────────

const cardStyle: (selected: boolean) => React.CSSProperties = (selected) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  background: selected ? 'rgba(157,135,255,0.12)' : 'var(--surface)',
  border: `1.5px solid ${selected ? 'var(--accent2)' : 'var(--border)'}`,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'border-color 0.15s, background 0.15s',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.88rem',
  color: 'var(--text)',
  lineHeight: 1.5,
  textAlign: 'left' as const,
  width: '100%',
})

const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: '#111118',
  border: '1px solid #333',
  borderRadius: 8,
  padding: '12px 14px',
  fontSize: '0.88rem',
  color: '#e0e0e0',
  resize: 'vertical',
  fontFamily: "'DM Sans', sans-serif",
  lineHeight: 1.6,
  outline: 'none',
  boxSizing: 'border-box',
}

// ── Component ───────────────────────────────────────────────────────────────

export default function BetaFinalPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, { choice?: string; text?: string }>>({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // Auth
  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  // Load existing responses
  useEffect(() => {
    if (!userId) return
    async function loadResponses() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('dhh_beta_responses')
        .select('question_key, response_text, response_choice')
        .eq('user_id', userId)
        .eq('page_path', '/dhh/dashboard/beta-final')

      if (error) {
        console.error('Failed to load final responses:', error)
        return
      }
      if (data && data.length > 0) {
        const loaded: Record<string, { choice?: string; text?: string }> = {}
        for (const row of data) {
          loaded[row.question_key] = {
            choice: row.response_choice ?? undefined,
            text: row.response_text ?? undefined,
          }
        }
        setResponses(loaded)
      }
    }
    loadResponses()
  }, [userId])

  // Save a single response
  const saveResponse = useCallback(async (key: string, type: 'free_text' | 'multiple_choice', text?: string, choice?: string) => {
    if (!userId) return
    const supabase = createClient()
    const { error } = await supabase
      .from('dhh_beta_responses')
      .upsert(
        {
          user_id: userId,
          page_path: '/dhh/dashboard/beta-final',
          question_key: key,
          response_type: type,
          response_text: text?.trim() || null,
          response_choice: choice || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,page_path,question_key' }
      )
    if (error) console.error('Failed to save response:', error)
  }, [userId])

  // Save current step and advance
  async function handleNext() {
    setSaving(true)
    const q = QUESTIONS[currentStep]
    const r = responses[q.key]

    // Save multiple choice
    if (q.choices && r?.choice) {
      await saveResponse(q.key, 'multiple_choice', undefined, r.choice)
    }

    // Save follow-up
    if (q.followUp && r?.text) {
      await saveResponse(q.followUp.key, 'free_text', r.text)
    }

    // Save free text questions
    if (q.freeTextQuestions) {
      for (const ftq of q.freeTextQuestions) {
        const val = responses[ftq.key]?.text
        if (val) {
          await saveResponse(ftq.key, 'free_text', val)
        }
      }
    }

    setSaving(false)

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Final submit — mark as completed
      if (userId) {
        const supabase = createClient()
        const { error } = await supabase
          .from('dhh_beta_status')
          .upsert(
            {
              user_id: userId,
              final_completed: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
        if (error) console.error('Failed to mark final completed:', error)
      }
      setDone(true)
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function setChoice(key: string, choice: string) {
    setResponses(prev => ({
      ...prev,
      [key]: { ...prev[key], choice },
    }))
  }

  function setText(key: string, text: string) {
    setResponses(prev => ({
      ...prev,
      [key]: { ...prev[key], text },
    }))
  }

  if (!userId) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
        Loading...
      </div>
    )
  }

  // ── Thank you state ─────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '80px 24px',
        fontFamily: "'DM Sans', sans-serif",
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(157,135,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 style={{
          fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)',
          margin: '0 0 16px', lineHeight: 1.3,
        }}>
          Thank you.
        </h1>
        <p style={{
          fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.7,
          maxWidth: 480, margin: '0 auto',
        }}>
          Your feedback means everything to us. If you think of anything else, you can always reach us at{' '}
          <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>
            hello@signpost.community
          </a>.
        </p>
      </div>
    )
  }

  // ── Survey steps ────────────────────────────────────────────────────────
  const q = QUESTIONS[currentStep]
  const r = responses[q.key]
  const isLast = currentStep === QUESTIONS.length - 1
  const progressPct = ((currentStep + 1) / QUESTIONS.length) * 100

  return (
    <div style={{
      maxWidth: 640,
      margin: '0 auto',
      padding: '40px 24px 80px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          height: 3,
          background: 'var(--border)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progressPct}%`,
            height: '100%',
            background: 'var(--accent2)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <p style={{
          fontSize: '0.75rem', color: '#666', margin: '8px 0 0',
          textAlign: 'right',
        }}>
          {currentStep + 1} of {QUESTIONS.length}
        </p>
      </div>

      {/* Question */}
      <div style={{ minHeight: 400 }}>
        {q.question && (
          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.5,
            margin: '0 0 28px',
          }}>
            {q.question}
          </h2>
        )}

        {/* Multiple choice cards */}
        {q.choices && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {q.choices.map((choice) => {
              const selected = r?.choice === choice
              return (
                <button
                  key={choice}
                  onClick={() => setChoice(q.key, choice)}
                  style={cardStyle(selected)}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${selected ? 'var(--accent2)' : '#444'}`,
                    background: selected ? 'var(--accent2)' : 'transparent',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {selected && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                    )}
                  </span>
                  <span>{choice}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Follow-up text area */}
        {q.followUp && (
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', fontSize: '0.88rem', fontWeight: 600,
              color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5,
            }}>
              {q.followUp.label}
            </label>
            <textarea
              value={responses[q.followUp.key]?.text ?? ''}
              onChange={e => setText(q.followUp!.key, e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              style={textareaStyle}
            />
          </div>
        )}

        {/* Free text questions (step 7, 9) */}
        {q.freeTextQuestions && q.freeTextQuestions.map((ftq) => (
          <div key={ftq.key} style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block', fontSize: '1.05rem', fontWeight: 600,
              color: 'var(--text)', marginBottom: 12, lineHeight: 1.5,
            }}>
              {ftq.label}
            </label>
            <textarea
              value={responses[ftq.key]?.text ?? ''}
              onChange={e => setText(ftq.key, e.target.value)}
              placeholder="Share your thoughts..."
              rows={5}
              style={textareaStyle}
            />
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 20, borderTop: '1px solid var(--border)',
      }}>
        {currentStep > 0 ? (
          <button
            onClick={handleBack}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 20px',
              fontSize: '0.88rem', fontWeight: 600,
              color: 'var(--muted)', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={handleNext}
          disabled={saving}
          style={{
            background: 'var(--accent2)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 28px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            fontFamily: "'DM Sans', sans-serif",
            transition: 'opacity 0.2s',
          }}
        >
          {saving ? 'Saving...' : isLast ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  )
}
