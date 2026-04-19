'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Role = 'interpreter' | 'dhh' | 'requester'

interface PrelaunchModalProps {
  role: Role
  open: boolean
  onClose: () => void
}

const ACCENT: Record<Role, string> = {
  interpreter: '#00e5ff',
  dhh: '#a78bfa',
  requester: '#00e5ff',
}

const COPY: Record<Role, {
  body: string[]
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
  closer?: string
}> = {
  interpreter: {
    body: [
      'Right now we\'re building up the interpreter directory so the community has real choices when requests start coming in. Help shape this:',
    ],
    primaryLabel: 'Invite interpreters you trust',
    primaryHref: '/invite',
    secondaryLabel: 'Complete your profile',
    secondaryHref: '/interpreter/dashboard/profile',
    closer: 'We\'ll notify you the moment your first request arrives.',
  },
  dhh: {
    body: [
      'Starting May 1, organizations like medical practices, law firms, and workplaces can book interpreters through signpost. Before then, you can:',
    ],
    primaryLabel: 'Invite interpreters to your Trusted Circle',
    primaryHref: '/invite',
    secondaryLabel: 'Build your preferred interpreter list',
    secondaryHref: '/directory',
  },
  requester: {
    body: [
      'Your account is in early access. You have full access to the platform and can start sending booking requests today.',
      'Before our public launch, you can also help grow the interpreter directory:',
    ],
    primaryLabel: 'Invite interpreters you work with',
    primaryHref: '/invite',
    secondaryLabel: 'Browse the directory',
    secondaryHref: '/directory',
    closer: 'Questions or feedback? Reach us at hello@signpost.community.',
  },
}

export default function PrelaunchModal({ role, open, onClose }: PrelaunchModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dismissing, setDismissing] = useState(false)
  const router = useRouter()
  const accent = ACCENT[role]
  const copy = COPY[role]

  // Focus trap
  useEffect(() => {
    if (!open) return
    const container = containerRef.current
    if (!container) return

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    function trapFocus(e: KeyboardEvent) {
      // Block Escape key dismissal
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      if (e.key === 'Tab' && container) {
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }

    document.addEventListener('keydown', trapFocus)

    requestAnimationFrame(() => {
      if (container) {
        const first = container.querySelector<HTMLElement>(focusableSelector)
        if (first) first.focus()
      }
    })

    return () => {
      document.removeEventListener('keydown', trapFocus)
    }
  }, [open])

  if (!open) return null

  async function handleDismiss() {
    setDismissing(true)
    try {
      const res = await fetch('/api/prelaunch-notice/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        console.error('[prelaunch-notice] Dismiss failed:', await res.text())
      }
    } catch (err) {
      console.error('[prelaunch-notice] Dismiss error:', err)
    }
    setDismissing(false)
    onClose()
  }

  function handleNavigate(href: string) {
    handleDismiss()
    router.push(href)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(10,10,15,0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prelaunch-modal-title"
        style={{
          background: '#111118',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 520,
        }}
      >
        <h2
          id="prelaunch-modal-title"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: 'var(--text)',
            margin: '0 0 16px',
          }}
        >
          We open for requests on May 1.
        </h2>

        {copy.body.map((paragraph, i) => (
          <p
            key={i}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              color: '#96a0b8',
              lineHeight: 1.6,
              margin: i === copy.body.length - 1 ? '0 0 20px' : '0 0 12px',
            }}
          >
            {paragraph}
          </p>
        ))}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: copy.closer ? 20 : 24 }}>
          <button
            onClick={() => handleNavigate(copy.primaryHref)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 20px',
              background: accent,
              border: 'none',
              borderRadius: 10,
              color: '#0a0a0f',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14.5px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="#0a0a0f" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {copy.primaryLabel}
          </button>

          <button
            onClick={() => handleNavigate(copy.secondaryHref)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
              background: 'transparent',
              border: `1px solid ${accent}4d`,
              borderRadius: 10,
              color: accent,
              fontFamily: "'Inter', sans-serif",
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {copy.secondaryLabel}
          </button>
        </div>

        {copy.closer && (
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 13,
              color: '#96a0b8',
              fontStyle: 'italic',
              lineHeight: 1.5,
              margin: '0 0 20px',
            }}
          >
            {copy.closer}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            style={{
              background: 'none',
              border: 'none',
              color: '#96a0b8',
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              cursor: dismissing ? 'wait' : 'pointer',
              padding: '4px 0',
              opacity: dismissing ? 0.5 : 1,
            }}
          >
            {dismissing ? 'Saving...' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  )
}
