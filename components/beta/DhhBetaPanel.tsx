'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Route-specific content ──────────────────────────────────────────────────

type PageConfig = {
  prompts: string[]
  questions: { key: string; label: string }[]
}

function getPageConfig(pathname: string): PageConfig | null {
  if (pathname === '/dhh') {
    return {
      prompts: ['Take a look at this page. Does the language here feel like it was written by people who understand your experience?'],
      questions: [
        { key: 'portal_landing_feedback', label: "Is there anything about how we've described this platform that feels off, missing, or surprising?" },
      ],
    }
  }
  if (pathname === '/dhh/signup') {
    return {
      prompts: ["You're creating your account. Note anything confusing or missing."],
      questions: [
        { key: 'signup_feedback', label: "Did we ask for anything that felt uncomfortable sharing? Is there a part of your identity or communication preference we forgot to include?" },
      ],
    }
  }
  if (pathname === '/dhh/dashboard') {
    return {
      prompts: ['This is your home base. Have a look around.'],
      questions: [
        { key: 'dashboard_feedback', label: "What's the first thing you went looking for? Did you find it?" },
      ],
    }
  }
  if (pathname === '/dhh/dashboard/interpreters' || pathname.startsWith('/dhh/dashboard/interpreters/') || pathname.includes('/directory')) {
    return {
      prompts: ["You need an interpreter for a doctor's appointment next week. Find someone you'd want to book."],
      questions: [
        { key: 'directory_feedback', label: "What information would you need to see that isn't here? What do you wish you could filter by?" },
        { key: 'directory_profiles_feedback', label: "What information is missing from these profiles? (e.g., specific certifications, video intros, specialized experience like medical/legal?)" },
      ],
    }
  }
  if (pathname === '/dhh/dashboard/requests' || pathname === '/dhh/dashboard/bookings') {
    return {
      prompts: ['Submit a personal interpreter request for an event of your choice.'],
      questions: [
        { key: 'request_feedback', label: 'Did the process feel straightforward? Was anything missing or confusing about submitting a request?' },
      ],
    }
  }
  if (pathname === '/dhh/dashboard/preferences') {
    return {
      prompts: [
        'This is where you manage your interpreter preferences.',
        'Try this: Add an interpreter to your Preferred List. Add a different interpreter to your Do Not Book list.',
      ],
      questions: [
        { key: 'preferences_feedback', label: "Does the 'Do Not Book' list feel clear and safe to use? How would you want us to handle that information to ensure your privacy? Is there anything you'd like to change?" },
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

// ── Component ───────────────────────────────────────────────────────────────

export default function DhhBetaPanel({ userId }: { userId: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth > 768
    return true
  })

  // Per-question response values keyed by question_key
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [justSavedKeys, setJustSavedKeys] = useState<Set<string>>(new Set())
  const [errorKeys, setErrorKeys] = useState<Set<string>>(new Set())
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())
  const fadeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
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
    if (!config) return
    async function loadResponses() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('dhh_beta_responses')
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
        } else {
          setResponses({})
          setSavedKeys(new Set())
        }
      } catch (err) {
        console.error('Failed to load beta responses:', err)
      }
    }
    loadResponses()
  }, [pathname, userId, config !== null])

  // Track page visit
  useEffect(() => {
    if (visitTracked.current) return
    visitTracked.current = true

    async function trackVisit() {
      try {
        const supabase = createClient()
        // First try to get existing status
        const { data: existing } = await supabase
          .from('dhh_beta_status')
          .select('pages_visited')
          .eq('user_id', userId)
          .maybeSingle()

        const currentPages: string[] = existing?.pages_visited ?? []
        if (!currentPages.includes(pathname)) {
          const updated = [...currentPages, pathname]
          const { error } = await supabase
            .from('dhh_beta_status')
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

  // Save response on blur
  const saveResponse = useCallback(async (questionKey: string, text: string) => {
    if (!text.trim()) return
    setErrorKeys(prev => { const next = new Set(prev); next.delete(questionKey); return next })
    setSavingKeys(prev => new Set(prev).add(questionKey))
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('dhh_beta_responses')
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
        setJustSavedKeys(prev => new Set(prev).add(questionKey))
        // Clear any existing fade timer for this key
        if (fadeTimers.current[questionKey]) clearTimeout(fadeTimers.current[questionKey])
        fadeTimers.current[questionKey] = setTimeout(() => {
          setJustSavedKeys(prev => { const next = new Set(prev); next.delete(questionKey); return next })
        }, 3000)
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

  // Don't render on final page or admin
  if (pathname.startsWith('/admin') || pathname.includes('beta-final')) return null

  // ── Collapsed tab ─────────────────────────────────────────────────────────
  if (!isOpen) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open beta panel"
        style={{
          position: 'fixed',
          right: 0,
          top: isMobile ? 'auto' : '50%',
          bottom: isMobile ? 16 : 'auto',
          transform: isMobile ? 'none' : 'translateY(-50%) rotate(90deg)',
          transformOrigin: 'center center',
          background: 'var(--accent2)',
          color: '#fff',
          border: 'none',
          borderRadius: isMobile ? '8px' : '6px 6px 0 0',
          padding: isMobile ? '8px 14px' : '8px 18px',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          boxShadow: isMobile ? '0 4px 16px rgba(0,0,0,0.4)' : '-2px 0 12px rgba(0,0,0,0.3)',
        }}
      >
        {isMobile ? 'Beta' : 'Beta'}
      </button>
    )
  }

  // ── Open panel ────────────────────────────────────────────────────────────
  return (
    <div
      className="dhh-beta-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '320px',
        height: '100vh',
        background: '#1a1a24',
        borderLeft: '1px solid #2a2a38',
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
              background: 'var(--accent2)',
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
        {config ? (
          <>
            {/* Prompts */}
            {config.prompts.map((prompt, i) => (
              <p key={i} style={{ fontSize: '0.84rem', lineHeight: 1.65, color: '#e0e0e0', margin: 0 }}>
                {prompt}
              </p>
            ))}

            {/* Questions */}
            {config.questions.map((q) => (
              <div key={q.key}>
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
                  {q.label}
                </label>
                <textarea
                  value={responses[q.key] ?? ''}
                  onChange={e => setResponses(prev => ({ ...prev, [q.key]: e.target.value }))}
                  onBlur={() => saveResponse(q.key, responses[q.key] ?? '')}
                  placeholder="Share your thoughts..."
                  rows={4}
                  style={textareaStyle}
                />
                <div style={{ fontSize: '0.72rem', color: '#666', marginTop: 4, minHeight: 16 }}>
                  {savingKeys.has(q.key) ? (
                    <span style={{ color: 'var(--accent2)' }}>Saving...</span>
                  ) : errorKeys.has(q.key) ? (
                    <span style={{ color: 'var(--accent3)' }}>Could not save — try again</span>
                  ) : justSavedKeys.has(q.key) ? (
                    <span style={{ color: '#00c875', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'opacity 0.3s' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </span>
                  ) : savedKeys.has(q.key) ? (
                    <span style={{ color: '#666', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </>
        ) : (
          <p style={{ fontSize: '0.84rem', color: '#888', lineHeight: 1.6 }}>
            No questions for this page. Keep exploring!
          </p>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Final questions CTA */}
        <div style={{ borderTop: '1px solid #2a2a38', paddingTop: 16 }}>
          <p style={{ fontSize: '0.76rem', color: '#888', margin: '0 0 10px', lineHeight: 1.55 }}>
            When you&apos;re done exploring, we have a few more questions we&apos;d love your insight on.
          </p>
          <button
            onClick={() => router.push('/dhh/dashboard/beta-final')}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              background: 'var(--accent2)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            I&apos;m done exploring, take me to the final questions
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
          .dhh-beta-panel {
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100vw !important;
            height: auto !important;
            max-height: 70vh !important;
            border-left: none !important;
            border-top: 1px solid #2a2a38 !important;
            border-radius: 16px 16px 0 0 !important;
            box-shadow: 0 -4px 32px rgba(0,0,0,0.3) !important;
          }
        }
      `}</style>
    </div>
  )
}
