'use client';

import { useState, useEffect } from 'react';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

export default function BetaWelcomeModal() {
  const [show, setShow] = useState(false);
  const focusTrapRef = useFocusTrap(show);

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('signpost_beta_welcomed')) {
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show]);

  function dismiss() {
    sessionStorage.setItem('signpost_beta_welcomed', 'true');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
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
        aria-labelledby="beta-welcome-title"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          maxWidth: 680,
          width: '100%',
          maxHeight: '85vh',
          fontFamily: "'DM Sans', sans-serif",
          color: 'var(--text)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', padding: '24px 32px 16px', flex: 1, minHeight: 0 }}>
          <h2
            id="beta-welcome-title"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '1.2rem',
              margin: '0 0 16px',
              lineHeight: 1.3,
            }}
          >
            Welcome to the signpost interpreter beta!
          </h2>

          <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--muted)' }}>
            <p style={{ margin: '0 0 16px' }}>
              This beta will run from <strong style={{ color: 'var(--text)' }}>March 9&ndash;13</strong>.
            </p>

            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
              What to expect
            </p>

            <p style={{ margin: '0 0 12px' }}>
              You will create an interpreter profile, and explore your Interpreter Portal: responding to new requests, reviewing confirmed jobs, submitting invoices, etc.
            </p>

            <p style={{ margin: '0 0 12px' }}>
              Your profile can be real (it&apos;ll stay on the site when we go live) or fake (just for testing). If you create a fake profile, add <strong style={{ color: 'var(--text)' }}>(BETA)</strong> after the name so we know to delete it later. You can always come back to create a real one, and we hope you will!
            </p>

            <p style={{ margin: '0 0 16px' }}>
              While you explore, you&apos;ll notice a <strong style={{ color: 'var(--text)' }}>BETA</strong> panel on the right side of each page. It will ask you questions about what you&apos;re seeing, and occasionally prompt you to try specific scenarios with a &ldquo;<strong style={{ color: 'var(--text)' }}>Try this! 👇</strong>&rdquo; label.
            </p>

            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
              When you&apos;re done
            </p>

            <p style={{ margin: '0 0 16px' }}>
              Once you&apos;ve explored the interpreter pages, click <strong style={{ color: 'var(--text)' }}>&ldquo;I&apos;m done exploring &mdash; take me to the final questions.&rdquo;</strong> You&apos;ll land on a short final page with a few multiple-choice questions and space for any last thoughts. Hit &ldquo;Submit&rdquo; and you&apos;re all set!
            </p>

            <p style={{ margin: '0 0 4px' }}>
              Thank you for being part of our new adventure.
            </p>

            <p style={{ margin: '0 0 2px' }}>
              With love,
            </p>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>
              Regina and Molly
            </p>
          </div>
        </div>

        {/* Sticky button footer */}
        <div style={{ padding: '16px 32px 24px', borderTop: '1px solid var(--border)' }}>
          <button
            className="btn-primary"
            onClick={dismiss}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: '0.92rem',
              fontWeight: 700,
            }}
          >
            Begin Beta &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
