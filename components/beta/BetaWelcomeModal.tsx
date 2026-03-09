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
          maxWidth: 640,
          width: '100%',
          padding: '40px 40px 32px',
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

        <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--muted)' }}>
          <p style={{ margin: '0 0 24px' }}>
            This beta will run from <strong style={{ color: 'var(--text)' }}>March 9&ndash;13</strong>.
          </p>

          <p style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--text)' }}>
            What to expect:
          </p>

          <p style={{ margin: '0 0 20px' }}>
            During this beta test you will create an interpreter profile <strong style={{ color: 'var(--text)' }}>and explore your Interpreter Portal.</strong> It can be a real one, to leave on the site for when we go live, or it can be a fake profile for the beta only. If you are creating a fake profile, label it with <strong style={{ color: 'var(--text)' }}>(BETA)</strong> after the fake name, so we know to delete it afterwards. You can come back anytime to create a real profile, and we hope you will!
          </p>

          <p style={{ margin: '0 0 20px' }}>
            As you are exploring the site there is a <strong style={{ color: 'var(--text)' }}>BETA</strong> panel on the right that will ask you questions about the page contents, and occasionally you&apos;ll see prompts labelled &ldquo;<strong style={{ color: 'var(--text)' }}>Try this! 👇</strong>&rdquo; to have you test out specific scenarios.
          </p>

          <p style={{ margin: '0 0 20px' }}>
            <strong style={{ color: 'var(--text)' }}>To End:</strong> After you have explored all of the interpreter pages and are ready to be done, click the <strong style={{ color: 'var(--text)' }}>&ldquo;I&apos;m done exploring &mdash; take me to the final questions&rdquo;</strong> button. There will be one last page with a few multiple-choice questions and an opportunity to add any last thoughts. Click &ldquo;Submit&rdquo; and voil&agrave;! you are done.
          </p>

          <p style={{ margin: '0 0 6px' }}>
            Thank you so much for your willingness to be part of our new adventure!
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
