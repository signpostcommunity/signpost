'use client';

import { useState, useEffect } from 'react';

export default function BetaWelcomeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('signpost_beta_welcomed')) {
      setShow(true);
    }
  }, []);

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
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          maxWidth: 680,
          width: '100%',
          padding: '44px 48px 36px',
          maxHeight: '90vh',
          overflowY: 'auto',
          fontFamily: "'DM Sans', sans-serif",
          color: 'var(--text)',
        }}
      >
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '1.35rem',
            margin: '0 0 20px',
            lineHeight: 1.35,
          }}
        >
          Welcome to the signpost interpreter beta!
        </h2>

        <div style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--muted)' }}>
          <p style={{ margin: '0 0 28px' }}>
            This beta will run from <strong style={{ color: 'var(--text)' }}>March 9&ndash;13</strong>.
          </p>

          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
            What to expect
          </p>

          <p style={{ margin: '0 0 16px' }}>
            You will create an interpreter profile, and explore your Interpreter Portal: responding to new requests, reviewing confirmed jobs, submitting invoices, etc.
          </p>

          <p style={{ margin: '0 0 16px' }}>
            Your profile can be real (it&apos;ll stay on the site when we go live) or fake (just for testing). If you create a fake profile, add <strong style={{ color: 'var(--text)' }}>(BETA)</strong> after the name so we know to delete it later. You can always come back to create a real one, and we hope you will!
          </p>

          <p style={{ margin: '0 0 28px' }}>
            While you explore, you&apos;ll notice a <strong style={{ color: 'var(--text)' }}>BETA</strong> panel on the right side of each page. It will ask you questions about what you&apos;re seeing, and occasionally prompt you to try specific scenarios with a &ldquo;<strong style={{ color: 'var(--text)' }}>Try this! 👇</strong>&rdquo; label.
          </p>

          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
            When you&apos;re done
          </p>

          <p style={{ margin: '0 0 28px' }}>
            Once you&apos;ve explored the interpreter pages, click <strong style={{ color: 'var(--text)' }}>&ldquo;I&apos;m done exploring &mdash; take me to the final questions.&rdquo;</strong> You&apos;ll land on a short final page with a few multiple-choice questions and space for any last thoughts. Hit &ldquo;Submit&rdquo; and you&apos;re all set!
          </p>

          <p style={{ margin: '0 0 6px' }}>
            Thank you for being part of our new adventure.
          </p>

          <p style={{ margin: '0 0 4px' }}>
            With love,
          </p>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>
            Regina and Molly
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={dismiss}
          style={{
            width: '100%',
            marginTop: 24,
            padding: '14px 20px',
            fontSize: '0.92rem',
            fontWeight: 700,
          }}
        >
          Begin Beta &rarr;
        </button>
      </div>
    </div>
  );
}
