'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ROUTE_CONFIG: Record<string, { prompt: string; scenario?: string; question?: string }> = {
  '/': {
    prompt:
      "Welcome to the signpost interpreter beta! Take a moment to look over this page — then when you're ready, go ahead and create your interpreter account. As you move through each step, drop your notes here — anything confusing, broken, missing, or that you love.\n\nFor the beta, you can create your actual profile to be posted live on the site when we open — or a test profile that we'll delete after the beta. Either way, you can always update your profile at any time! If you're creating a test profile, please enter your name as: First Name (TEST)",
  },
  '/interpreter': {
    prompt:
      "Welcome to the signpost interpreter beta! Take a moment to look over this page — then when you're ready, go ahead and create your interpreter account. As you move through each step, drop your notes here — anything confusing, broken, missing, or that you love.\n\nFor the beta, you can create your actual profile to be posted live on the site when we open — or a test profile that we'll delete after the beta. Either way, you can always update your profile at any time! If you're creating a test profile, please enter your name as: First Name (TEST)",
  },
  '/interpreter/login': {
    prompt:
      "Welcome to the signpost interpreter beta! Take a moment to look over this page — then when you're ready, go ahead and create your interpreter account. As you move through each step, drop your notes here — anything confusing, broken, missing, or that you love.\n\nFor the beta, you can create your actual profile to be posted live on the site when we open — or a test profile that we'll delete after the beta. Either way, you can always update your profile at any time! If you're creating a test profile, please enter your name as: First Name (TEST)",
  },
  '/interpreter/signup': {
    prompt:
      "You're building your interpreter profile. Note anything that's missing, confusing, or doesn't work as expected.",
    question: 'Is there anything missing that Deaf clients or organizations would need to see?',
  },
  '/interpreter/dashboard': {
    prompt: 'This is your home base — have a look around!',
    scenario:
      "It's 8pm and you're feeling sick. You have a job tomorrow. How do you let the requester know and start looking for a sub?",
    question: "What's the first thing you went looking for?",
  },
  '/interpreter/dashboard/inquiries': {
    prompt: 'You have a new booking request. Try checking and responding to it.',
    scenario: 'Check and respond to a pending request.',
    question: 'Was it clear what you were supposed to do and what would happen next?',
  },
  '/interpreter/dashboard/inbox': {
    prompt: 'You have a message. Try reading and responding to it.',
    scenario: 'Respond to a message in your inbox.',
    question: 'Did messaging feel natural, or was anything awkward or missing?',
  },
  '/interpreter/dashboard/profile': {
    prompt: "You're looking at your public profile — this is what Deaf clients and organizations will see.",
    question: "Does this represent you the way you'd want to be seen?",
  },
  '/interpreter/dashboard/rates': {
    prompt: "You're setting your rates and terms.",
    question:
      "What's missing that you'd need to work professionally? (minimum call time, cancellation windows, travel pay, etc.)",
  },
  '/interpreter/dashboard/availability': {
    prompt: "You're setting your availability.",
    question: "Does this give you enough control over when and how you're booked?",
  },
  '/interpreter/dashboard/team': {
    prompt: 'This is where you manage your preferred team interpreters.',
    scenario: 'Add an interpreter to your Preferred Team list. Try finding them in the directory.',
    question: 'Was finding and adding them straightforward?',
  },
  '/directory': {
    prompt:
      "This is where Deaf clients and organizations search for interpreters — but it's also where you can find and add colleagues to your Preferred Team list. Have a look around from both perspectives.",
    question:
      "Does your profile show up the way you'd expect? Is there anything about how interpreters are displayed that you'd want to change?",
  },
};

function getConfig(pathname: string) {
  if (ROUTE_CONFIG[pathname]) return ROUTE_CONFIG[pathname];
  if (pathname.startsWith('/interpreter/signup')) return ROUTE_CONFIG['/interpreter/signup'];
  const pageName = pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ?? 'this page';
  return { prompt: `You're on ${pageName}. Note anything that feels off, confusing, or missing.` };
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.63rem',
  fontWeight: 700,
  letterSpacing: '0.11em',
  textTransform: 'uppercase',
  color: '#888',
  marginBottom: 6,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '9px 11px',
  fontSize: '0.81rem',
  color: '#1a1a1a',
  resize: 'vertical',
  fontFamily: "'DM Sans', sans-serif",
  lineHeight: 1.5,
  outline: 'none',
  boxSizing: 'border-box',
};

export default function BetaFeedbackPanel() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [notes, setNotes] = useState('');
  const [specificAnswer, setSpecificAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showEndOfSession, setShowEndOfSession] = useState(false);

  const config = getConfig(pathname);

  // Track dashboard visit for end-of-session trigger
  useEffect(() => {
    if (pathname === '/interpreter/dashboard') {
      sessionStorage.setItem('signpost_visited_dashboard', 'true');
    }
    if (sessionStorage.getItem('signpost_visited_dashboard') === 'true') {
      setShowEndOfSession(true);
    }
  }, [pathname]);

  // Push page body right when panel is open so content is never covered
  useEffect(() => {
    document.body.style.transition = 'padding-right 0.25s ease';
    document.body.style.paddingRight = isOpen ? '320px' : '0px';
    return () => {
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen]);

  // Reset fields on route change
  useEffect(() => {
    setNotes('');
    setSpecificAnswer('');
    setSubmitted(false);
  }, [pathname]);

  async function handleSubmit() {
    if (!notes.trim() && !specificAnswer.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/beta-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: pathname, notes, specificAnswer, isEndOfSession: false }),
      });
      setSubmitted(true);
      setNotes('');
      setSpecificAnswer('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e) {
      console.error('Feedback submit error:', e);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Collapsed tab ─────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open beta feedback panel"
        style={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%) rotate(90deg)',
          transformOrigin: 'center center',
          background: '#ff6b2b',
          color: '#fff',
          border: 'none',
          borderRadius: '6px 6px 0 0',
          padding: '8px 18px',
          fontSize: '0.68rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          boxShadow: '-2px 0 12px rgba(0,0,0,0.3)',
        }}
      >
        Beta Feedback ✏️
      </button>
    );
  }

  // ── Open panel ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '320px',
        height: '100vh',
        background: '#f5f4ef',
        borderLeft: '1px solid #dedad2',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.2)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #dedad2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f5f4ef',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: '#ff6b2b',
              color: '#fff',
              fontSize: '0.58rem',
              fontWeight: 900,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 4,
            }}
          >
            Beta Feedback
          </span>
          <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: 500 }}>signpost</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Collapse feedback panel"
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
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Page prompt */}
        <p style={{ fontSize: '0.82rem', lineHeight: 1.65, color: '#1e1e1e', margin: 0 }}>
          {config.prompt}
        </p>

        {/* Scenario callout */}
        {config.scenario && (
          <div
            style={{
              background: '#fff7f0',
              border: '1px solid #ffd0b0',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.77rem',
              color: '#7a3600',
              lineHeight: 1.55,
            }}
          >
            <strong style={{ display: 'block', marginBottom: 4 }}>Try this:</strong>
            {config.scenario}
          </div>
        )}

        {/* Open notes */}
        <div>
          <label style={labelStyle}>Open Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything confusing, broken, missing, or that you love..."
            rows={4}
            style={textareaStyle}
          />
        </div>

        {/* Specific question */}
        {config.question && (
          <div>
            <label style={labelStyle}>Specific Question</label>
            <p style={{ fontSize: '0.77rem', color: '#555', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>
              {config.question}
            </p>
            <textarea
              value={specificAnswer}
              onChange={(e) => setSpecificAnswer(e.target.value)}
              placeholder="Your answer..."
              rows={3}
              style={textareaStyle}
            />
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || (!notes.trim() && !specificAnswer.trim())}
          style={{
            background: submitted ? '#00c875' : '#ff6b2b',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '11px 16px',
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            cursor: !notes.trim() && !specificAnswer.trim() ? 'not-allowed' : 'pointer',
            opacity: !notes.trim() && !specificAnswer.trim() && !submitted ? 0.45 : 1,
            transition: 'background 0.2s, opacity 0.2s',
          }}
        >
          {submitted ? '✓ Saved!' : submitting ? 'Saving...' : 'Submit feedback for this page'}
        </button>

        {/* End-of-session CTA — only appears after visiting dashboard */}
        {showEndOfSession && (
          <a
            href="/interpreter/dashboard/beta-survey"
            style={{
              display: 'block',
              textAlign: 'center',
              background: 'transparent',
              color: '#00e5ff',
              border: '1px solid #00e5ff',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: '0.77rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            I&apos;m done exploring — take me to the final questions →
          </a>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #dedad2',
          fontSize: '0.67rem',
          color: '#bbb',
          textAlign: 'center',
        }}
      >
        Feedback goes directly to Molly &amp; Regina
      </div>
    </div>
  );
}
