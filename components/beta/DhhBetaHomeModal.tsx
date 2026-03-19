'use client'

import { useState, useEffect } from 'react'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

const LS_KEY = 'signpost_dhh_beta_welcome_dismissed'

export default function DhhBetaHomeModal() {
  const [show, setShow] = useState(false)
  const focusTrapRef = useFocusTrap(show)

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(LS_KEY)) {
      setShow(true)
    }
  }, [])

  useEffect(() => {
    if (!show) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [show])

  function dismiss() {
    localStorage.setItem(LS_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 20,
      }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dhh-beta-home-title"
        className="dhh-beta-modal-inner modal-dialog"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          maxWidth: 560,
          width: '100%',
          maxHeight: '85vh',
          fontFamily: "'DM Sans', sans-serif",
          color: 'var(--text)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', padding: '28px 32px 16px', flex: 1, minHeight: 0 }}>
          {/* Close button */}
          <button
            onClick={dismiss}
            aria-label="Close"
            className="modal-close-btn"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: '1.2rem',
              zIndex: 1,
            }}
          >
            &#10005;
          </button>
          <h2
            id="dhh-beta-home-title"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '1.25rem',
              margin: '0 0 20px',
              lineHeight: 1.3,
              color: 'var(--accent2)',
            }}
          >
            Welcome to the signpost Deaf community beta!
          </h2>

          <div style={{ fontSize: '0.88rem', lineHeight: 1.75, color: 'var(--muted)' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
              What to expect:
            </p>

            <p style={{ margin: '0 0 14px' }}>
              signpost is a free interpreter directory and booking platform, co-founded by Regina McGinnis (Deaf) and Molly Sano-Mahgoub (interpreter). This beta is your chance to tell us what&apos;s working, what&apos;s missing, and what we got wrong.
            </p>

            <p style={{ margin: '0 0 14px' }}>
              There are no right answers here. We need your honest experience, including the hard stuff.
            </p>

            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
              What to do:
            </p>

            <p style={{ margin: '0 0 14px' }}>
              Create your account and explore. There is a BETA panel on the right side that will ask you questions about each page. Take your time and share whatever comes up for you.
            </p>

            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
              To finish:
            </p>

            <p style={{ margin: '0 0 18px' }}>
              When you&apos;re ready to wrap up, click &ldquo;I&apos;m done exploring, take me to the final questions&rdquo; in the beta panel. There are a few multiple-choice questions that we would really love your insight on.
            </p>

            <p style={{ margin: '0 0 4px' }}>
              Thank you for being part of this.
            </p>
            <p style={{ margin: '0 0 2px' }}>With love,</p>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>
              Regina and Molly
            </p>
          </div>
        </div>

        {/* Sticky button footer */}
        <div style={{ padding: '16px 32px 24px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={dismiss}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: '0.92rem',
              fontWeight: 700,
              background: 'var(--accent2)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'opacity 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            Let&apos;s go
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .dhh-beta-modal-inner { max-height: 95vh !important; }
          .dhh-beta-modal-inner > div:first-child { padding: 20px 16px 12px !important; }
          .dhh-beta-modal-inner > div:last-child { padding: 12px 16px 16px !important; }
        }
      `}</style>
    </div>
  )
}
