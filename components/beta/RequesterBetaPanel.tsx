'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Beta orange ─────────────────────────────────────────────────────────────
const BETA_ORANGE = '#f97316'

// ── Route-specific content ──────────────────────────────────────────────────

type PageConfig = {
  prompts: string[]
  questions: { key: string; label: string }[]
}

function getPageConfig(pathname: string): PageConfig | null {
  if (pathname === '/request') {
    return {
      prompts: ['Take a look at this page. Does the information here clearly explain how signpost works for requesters?'],
      questions: [
        { key: 'portal_landing_feedback', label: 'Is there anything about how the requester portal is described that feels off, missing, or unclear?' },
      ],
    }
  }
  if (pathname === '/request/signup') {
    return {
      prompts: ['You\'re creating your requester account. Note anything confusing or missing.'],
      questions: [
        { key: 'signup_feedback', label: 'Was the signup process straightforward? Is anything confusing or missing?' },
      ],
    }
  }
  if (pathname === '/request/dashboard') {
    return {
      prompts: ['This is your home base. Have a look around.'],
      questions: [
        { key: 'dashboard_overview_feedback', label: 'Is the dashboard overview helpful? What would you add or remove?' },
        { key: 'dashboard_stats_feedback', label: 'Is the snapshot (stat cards) showing the right information?' },
      ],
    }
  }
  if (pathname === '/request/dashboard/new-request') {
    return {
      prompts: ['Try creating a new interpreter request.'],
      questions: [
        { key: 'request_form_feedback', label: 'Was the request form easy to understand and fill out?' },
        { key: 'request_interpreter_feedback', label: 'Is anything confusing about how to select interpreters?' },
        { key: 'request_fee_feedback', label: 'Is the $15 platform fee clearly explained?' },
      ],
    }
  }
  if (pathname === '/request/dashboard/requests') {
    return {
      prompts: ['This is where you track all your interpreter requests.'],
      questions: [
        { key: 'requests_tracking_feedback', label: 'Can you easily find and track your requests?' },
        { key: 'requests_status_feedback', label: 'Are the status badges clear?' },
      ],
    }
  }
  if (pathname === '/request/dashboard/interpreters') {
    return {
      prompts: ['Browse and manage your preferred interpreters.'],
      questions: [
        { key: 'interpreters_add_feedback', label: 'Is it easy to add interpreters to your list?' },
        { key: 'interpreters_tier_feedback', label: 'Is the tier system (preferred/secondary) intuitive?' },
      ],
    }
  }
  if (pathname === '/request/dashboard/inbox' || pathname.startsWith('/request/dashboard/inbox/')) {
    return {
      prompts: ['This is where you communicate with interpreters.'],
      questions: [
        { key: 'inbox_feedback', label: 'Is the messaging interface clear?' },
      ],
    }
  }
  if (pathname === '/request/dashboard/profile') {
    return {
      prompts: ['Review your profile and account settings.'],
      questions: [
        { key: 'profile_payment_feedback', label: 'Is the payment method section clear?' },
        { key: 'profile_missing_feedback', label: 'Is anything missing from your profile?' },
      ],
    }
  }
  if (pathname === '/request/dashboard/client-lists') {
    return {
      prompts: ['This is where you manage your connections with Deaf/DB/HH individuals.'],
      questions: [
        { key: 'client_lists_feedback', label: 'Is it clear how to connect with and manage Deaf/DB/HH individuals you book for?' },
      ],
    }
  }
  if (pathname.startsWith('/request/dashboard/accept/')) {
    return {
      prompts: ['You\'re reviewing an interpreter assignment.'],
      questions: [
        { key: 'accept_flow_feedback', label: 'Is the booking acceptance flow clear and easy to follow?' },
      ],
    }
  }
  return null
}

// ── Styles ──────────────────────────────────────────────────────────────────

const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: '#111118',
  border: '1px solid #333',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: '0.84rem',
  color: '#e0e0e0',
  resize: 'vertical',
  fontFamily: "'DM Sans', sans-serif",
  lineHeight: 1.55,
  outline: 'none',
  boxSizing: 'border-box',
}

// ── Pencil SVG icon ─────────────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

// ── Check SVG icon ──────────────────────────────────────────────────────────
function CheckIcon({ size = 12, strokeWidth = 3 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

// ── Save row component ──────────────────────────────────────────────────────
function SaveRow({
  questionKey,
  isSaving,
  isSaved,
  isDirty,
  hasError,
  onSave,
}: {
  questionKey: string
  isSaving: boolean
  isSaved: boolean
  isDirty: boolean
  hasError: boolean
  onSave: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, minHeight: 28 }}>
      <button
        onClick={onSave}
        disabled={isSaving}
        style={{
          background: 'transparent',
          border: `1px solid ${BETA_ORANGE}`,
          color: BETA_ORANGE,
          borderRadius: 6,
          padding: '4px 12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: isSaving ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          opacity: isSaving ? 0.6 : 1,
          transition: 'opacity 0.2s',
          whiteSpace: 'nowrap',
        }}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      {hasError ? (
        <span style={{ fontSize: '0.72rem', color: 'var(--accent3)' }}>Could not save — try again</span>
      ) : isSaved && !isDirty ? (
        <span style={{ fontSize: '0.72rem', color: '#00c875', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <CheckIcon />
          Saved
        </span>
      ) : isDirty && isSaved ? (
        <span style={{ fontSize: '0.72rem', color: '#666' }}>Unsaved changes</span>
      ) : null}
    </div>
  )
}

// ── Component ───────────────────────────────────────────────────────────────

export default function RequesterBetaPanel({ userId }: { userId: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth > 768
    return true
  })

  // Per-question response values keyed by question_key
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set())
  const [errorKeys, setErrorKeys] = useState<Set<string>>(new Set())
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())
  const visitTracked = useRef(false)

  const config = getPageConfig(pathname)

  // Push body content left when panel is open (desktop), lock scroll on mobile
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    if (isOpen && !isMobile) {
      document.body.style.paddingRight = '320px'
      document.body.style.transition = 'padding-right 0.25s ease'
    } else {
      document.body.style.paddingRight = '0'
    }
    // Lock body scroll on mobile when panel is open
    if (isOpen && isMobile) {
      document.body.classList.add('beta-panel-open-mobile')
    } else {
      document.body.classList.remove('beta-panel-open-mobile')
    }
    return () => {
      document.body.style.paddingRight = '0'
      document.body.classList.remove('beta-panel-open-mobile')
    }
  }, [isOpen])

  // Load existing responses for this page
  useEffect(() => {
    async function loadResponses() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('requester_beta_responses')
          .select('question_key, response_text')
          .eq('user_id', userId)
          .eq('page_path', pathname)

        if (error) {
          console.error('Failed to load beta responses:', error)
          return
        }
        if (data && data.length > 0) {
          const loaded: Record<string, string> = {}
          const saved = new Set<string>()
          for (const row of data) {
            if (row.response_text) {
              loaded[row.question_key] = row.response_text
              saved.add(row.question_key)
            }
          }
          setResponses(loaded)
          setSavedKeys(saved)
          setDirtyKeys(new Set())
        } else {
          setResponses({})
          setSavedKeys(new Set())
          setDirtyKeys(new Set())
        }
      } catch (err) {
        console.error('Failed to load beta responses:', err)
      }
    }
    loadResponses()
  }, [pathname, userId])

  // Track page visit
  useEffect(() => {
    if (visitTracked.current) return
    visitTracked.current = true

    async function trackVisit() {
      try {
        const supabase = createClient()
        // First try to get existing status
        const { data: existing } = await supabase
          .from('requester_beta_status')
          .select('pages_visited')
          .eq('user_id', userId)
          .maybeSingle()

        const currentPages: string[] = existing?.pages_visited ?? []
        if (!currentPages.includes(pathname)) {
          const updated = [...currentPages, pathname]
          const { error } = await supabase
            .from('requester_beta_status')
            .upsert(
              {
                user_id: userId,
                pages_visited: updated,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            )
          if (error) console.error('Failed to track page visit:', error)
        }
      } catch (err) {
        console.error('Failed to track page visit:', err)
      }
    }
    trackVisit()

    return () => { visitTracked.current = false }
  }, [pathname, userId])

  // Save response
  const saveResponse = useCallback(async (questionKey: string, text: string) => {
    if (!text.trim()) return
    setErrorKeys(prev => { const next = new Set(prev); next.delete(questionKey); return next })
    setSavingKeys(prev => new Set(prev).add(questionKey))
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('requester_beta_responses')
        .upsert(
          {
            user_id: userId,
            page_path: pathname,
            question_key: questionKey,
            response_type: 'free_text',
            response_text: text.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,page_path,question_key' }
        )

      if (error) {
        console.error('Failed to save beta response:', error)
        setErrorKeys(prev => new Set(prev).add(questionKey))
      } else {
        setSavedKeys(prev => new Set(prev).add(questionKey))
        setDirtyKeys(prev => { const next = new Set(prev); next.delete(questionKey); return next })
        // Push to Monday (fire-and-forget — don't block UI)
        fetch('/api/requester-beta-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'page_feedback' }),
        }).catch(err => console.error('Monday push failed:', err))
      }
    } catch (err) {
      console.error('Failed to save beta response:', err)
      setErrorKeys(prev => new Set(prev).add(questionKey))
    } finally {
      setSavingKeys(prev => {
        const next = new Set(prev)
        next.delete(questionKey)
        return next
      })
    }
  }, [userId, pathname])

  // Handle text change — mark as dirty
  const handleChange = useCallback((key: string, value: string) => {
    setResponses(prev => ({ ...prev, [key]: value }))
    setDirtyKeys(prev => new Set(prev).add(key))
  }, [])

  // Don't render on admin pages or final survey page
  if (pathname.startsWith('/admin') || pathname.includes('beta-final')) return null

  // ── Collapsed state ─────────────────────────────────────────────────────────
  if (!isOpen) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    return isMobile ? (
      /* Mobile: orange pill with text */
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open beta feedback"
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          borderRadius: 22,
          background: BETA_ORANGE,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 18px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <PencilIcon />
        <span style={{ fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Beta Feedback</span>
      </button>
    ) : (
      /* Desktop: side tab */
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open beta panel"
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%) rotate(90deg)',
          transformOrigin: 'center center',
          background: BETA_ORANGE,
          color: '#fff',
          border: 'none',
          borderRadius: '6px 6px 0 0',
          padding: '8px 18px',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          cursor: 'pointer',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          boxShadow: '-2px 0 12px rgba(0,0,0,0.3)',
        }}
      >
        Beta
      </button>
    )
  }

  // ── Helper to render a question field with Save row ─────────────────────────
  function renderQuestionField(key: string, label: string, placeholder: string, rows = 4) {
    return (
      <div key={key}>
        <label
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--muted)',
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          {label}
        </label>
        <textarea
          value={responses[key] ?? ''}
          onChange={e => handleChange(key, e.target.value)}
          onBlur={() => saveResponse(key, responses[key] ?? '')}
          placeholder={placeholder}
          rows={rows}
          style={textareaStyle}
        />
        <SaveRow
          questionKey={key}
          isSaving={savingKeys.has(key)}
          isSaved={savedKeys.has(key)}
          isDirty={dirtyKeys.has(key)}
          hasError={errorKeys.has(key)}
          onSave={() => saveResponse(key, responses[key] ?? '')}
        />
      </div>
    )
  }

  // ── Open panel ────────────────────────────────────────────────────────────
  return (
    <>
    {/* Mobile backdrop */}
    <div
      className="requester-beta-backdrop"
      onClick={() => setIsOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 998,
        display: 'none',
      }}
    />
    <div
      className="requester-beta-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '320px',
        height: '100vh',
        background: '#1a1a24',
        borderLeft: `1px solid ${BETA_ORANGE}33`,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #2a2a38',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1a1a24',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: BETA_ORANGE,
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 4,
            }}
          >
            Beta
          </span>
          <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 500 }}>signpost</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Collapse beta panel"
          style={{
            background: 'none',
            border: 'none',
            color: '#aaa',
            fontSize: '1.2rem',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '0 2px',
          }}
        >
          &times;
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {config && (
          <>
            {/* Prompts */}
            {config.prompts.map((prompt, i) => (
              <p key={i} style={{ fontSize: '0.84rem', lineHeight: 1.65, color: '#e0e0e0', margin: 0 }}>
                {prompt}
              </p>
            ))}

            {/* Questions */}
            {config.questions.map((q) =>
              renderQuestionField(q.key, q.label, 'Share your thoughts...')
            )}
          </>
        )}

        {/* Freeform feedback — shown on every page */}
        {renderQuestionField(
          'general_feedback',
          config ? 'Anything else?' : 'Any thoughts on this page?',
          "What do you like? What's confusing? What's missing?"
        )}

        {/* ── Guidance text ──────────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid #1e2433', paddingTop: 16, marginTop: 4 }}>
          <p style={{
            fontSize: '0.8rem',
            color: '#8891a8',
            lineHeight: 1.6,
            margin: 0,
          }}>
            Your responses are saved automatically.{' '}
            <span style={{ color: BETA_ORANGE, fontWeight: 600 }}>Keep exploring!</span>{' '}
            Click around the portal — try pages like All Requests, Preferred Interpreters, etc. Each page may have different feedback questions.
          </p>
        </div>

        {/* ── Final survey section ───────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid #1e2433', paddingTop: 16 }}>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: BETA_ORANGE,
              display: 'block',
              marginBottom: 10,
            }}
          >
            Final Survey
          </span>
          <p style={{
            fontSize: '0.8rem',
            color: '#8891a8',
            lineHeight: 1.6,
            margin: '0 0 6px',
          }}>
            Once you&apos;ve had a chance to explore the portal — pages like All Requests, New Request, Preferred Interpreters, and your Profile — we&apos;d love to hear your overall thoughts.
          </p>
          <p style={{
            fontSize: '0.8rem',
            color: '#8891a8',
            lineHeight: 1.6,
            margin: '0 0 14px',
          }}>
            There&apos;s no rush. Take your time exploring first.
          </p>
          <button
            onClick={() => router.push('/request/dashboard/beta-final')}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              background: 'transparent',
              color: BETA_ORANGE,
              border: `1px solid ${BETA_ORANGE}`,
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${BETA_ORANGE}15` }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Take the Final Survey &rarr;
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #2a2a38',
          fontSize: '0.67rem',
          color: '#888',
          textAlign: 'center',
        }}
      >
        Feedback goes directly to Regina &amp; Molly
      </div>

      <style>{`
        @media (max-width: 768px) {
          .requester-beta-backdrop {
            display: block !important;
          }
          .requester-beta-panel {
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100vw !important;
            height: auto !important;
            max-height: 85vh !important;
            border-left: none !important;
            border-top: 1px solid #2a2a38 !important;
            border-radius: 16px 16px 0 0 !important;
            box-shadow: 0 -4px 32px rgba(0,0,0,0.3) !important;
            animation: requesterBetaSlideUp 0.25s ease-out;
          }
        }
        @keyframes requesterBetaSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
    </>
  )
}
