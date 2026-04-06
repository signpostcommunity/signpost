'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ORANGE = '#f97316'

const PAGE_QUESTIONS: Record<string, string> = {
  '/request/dashboard': 'What is the first thing you went looking for? Did you find it?',
  '/request/dashboard/new-request': 'Did the booking process feel straightforward? Was anything confusing about the "Who is this for?" section or choosing interpreters?',
  '/request/dashboard/requests': 'Can you easily understand the status of each request? Is anything unclear about how interpreter responses are shown?',
  '/request/dashboard/inbox': 'Is the messaging with interpreters clear? Is there anything missing from the conversation view?',
  '/request/dashboard/interpreters': 'Is it clear how to add interpreters to your roster? Does the Preferred vs Secondary tier distinction make sense?',
  '/request/dashboard/client-lists': 'Is it clear how to request a Deaf client\'s preferred list? Does the process feel respectful of the Deaf person\'s control?',
  '/request/dashboard/profile': 'Was setting up your profile straightforward? Is there anything missing from the payment method section?',
}

const GENERAL_QUESTION = 'Anything else about this page?'

function getPageLabel(pathname: string): string {
  const map: Record<string, string> = {
    '/request/dashboard': 'Dashboard',
    '/request/dashboard/new-request': 'New Request',
    '/request/dashboard/requests': 'All Requests',
    '/request/dashboard/inbox': 'Inbox',
    '/request/dashboard/interpreters': 'Preferred Interpreters',
    '/request/dashboard/client-lists': 'Client Interpreter Lists',
    '/request/dashboard/profile': 'Profile',
  }
  return map[pathname] || 'Page'
}

export default function RequesterBetaPanel() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [specificAnswer, setSpecificAnswer] = useState('')
  const [generalAnswer, setGeneralAnswer] = useState('')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPathRef = useRef(pathname)

  // Reset when page changes
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      setSpecificAnswer('')
      setGeneralAnswer('')
      setSaveStatus(null)
      prevPathRef.current = pathname
    }
  }, [pathname])

  const saveFeedback = useCallback(async (specific: string, general: string) => {
    if (!specific.trim() && !general.trim()) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const pageLabel = getPageLabel(pathname)
      const combined = [specific.trim(), general.trim()].filter(Boolean).join('\n---\n')

      await supabase.from('beta_feedback').insert({
        tester_email: user.email ?? null,
        page: `requester_${pathname.replace(/\//g, '_')}`,
        notes: combined || null,
        specific_answer: specific.trim() || null,
        feedback_type: 'page_note',
      })

      setSaveStatus(`Saved for ${pageLabel}`)
      setTimeout(() => setSaveStatus(null), 2000)
    } catch {
      setSaveStatus('Error saving')
      setTimeout(() => setSaveStatus(null), 2000)
    }
  }, [pathname])

  const debouncedSave = useCallback((specific: string, general: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveFeedback(specific, general), 1500)
  }, [saveFeedback])

  const question = PAGE_QUESTIONS[pathname] || null
  const pageLabel = getPageLabel(pathname)

  // Don't render on sub-pages like /inbox/conversation/[id]
  if (!question) return null

  // Mobile floating pill (when closed)
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open beta feedback"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
          background: ORANGE, color: '#0a0a0f',
          border: 'none', borderRadius: 100,
          padding: '10px 18px', fontSize: '0.8rem', fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Beta Feedback
      </button>
    )
  }

  // Drawer (open state)
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
      width: 340, maxWidth: 'calc(100vw - 40px)',
      background: '#111118', border: `1px solid ${ORANGE}44`,
      borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column',
      maxHeight: 'calc(100vh - 80px)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px', borderBottom: `1px solid ${ORANGE}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: ORANGE, fontFamily: "'Inter', sans-serif" }}>
            Beta Feedback
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>
            {pageLabel}
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: '1rem', padding: '4px',
          }}
        >
          X
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
        {/* Page-specific question */}
        <label style={{
          display: 'block', fontSize: '0.78rem', fontWeight: 500,
          color: '#c8cdd8', marginBottom: 8, lineHeight: 1.5,
        }}>
          {question}
        </label>
        <textarea
          value={specificAnswer}
          onChange={e => {
            setSpecificAnswer(e.target.value)
            debouncedSave(e.target.value, generalAnswer)
          }}
          placeholder="Your thoughts..."
          rows={3}
          style={{
            width: '100%', padding: '10px 12px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text)', fontSize: '0.82rem',
            fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
            resize: 'vertical', outline: 'none',
          }}
        />

        {/* General question */}
        <label style={{
          display: 'block', fontSize: '0.78rem', fontWeight: 500,
          color: '#c8cdd8', marginBottom: 8, marginTop: 14, lineHeight: 1.5,
        }}>
          {GENERAL_QUESTION}
        </label>
        <textarea
          value={generalAnswer}
          onChange={e => {
            setGeneralAnswer(e.target.value)
            debouncedSave(specificAnswer, e.target.value)
          }}
          placeholder="Optional..."
          rows={2}
          style={{
            width: '100%', padding: '10px 12px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text)', fontSize: '0.82rem',
            fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
            resize: 'vertical', outline: 'none',
          }}
        />

        {/* Save status */}
        {saveStatus && (
          <div style={{ fontSize: '0.72rem', color: ORANGE, marginTop: 8, fontWeight: 600 }}>
            {saveStatus}
          </div>
        )}
      </div>
    </div>
  )
}
