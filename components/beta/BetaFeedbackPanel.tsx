'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// ── Route-specific prompts ────────────────────────────────────────────────────

const ROUTE_CONFIG: Record<string, { prompt: string; scenario?: string; question?: string; scenario2?: string; question2?: string }> = {
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
  '/interpreter/dashboard/confirmed': {
    prompt: 'These are your confirmed bookings — upcoming, completed, and cancelled.',
    scenario: "Look at a specific job to see if you have all of the information you need.",
    question: 'Did the layout feel logical, was anything missing?',
    scenario2: "Cancel a job that you have already confirmed. (I know, it makes me nauseous thinking about it too, but these are fake!)",
    question2: 'How did you feel about the flow? Does it feel reasonable, easy to understand?',
  },
  '/interpreter/dashboard/invoices': {
    prompt: 'This is where you manage invoices for completed jobs.',
    scenario: "Find a past job that hasn't been invoiced yet and submit an invoice for it. Review the pre-filled details, adjust if needed, and send it.",
    question: "Was the invoicing flow clear? Is there anything missing that you'd need to invoice professionally?",
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

// ── Final question definitions ────────────────────────────────────────────────

const SIGNUP_EASE_OPTIONS = [
  'Very easy — no issues',
  'Mostly easy — a few small things',
  'Struggled — needed to figure things out',
  'Really difficult — something was broken',
];

const DASHBOARD_FEEL_OPTIONS = [
  'Intuitive — I knew where everything was',
  'Mostly clear — a few things took a second',
  "Confusing — I wasn't sure what to do",
  "I couldn't figure it out",
];

const RATES_CONTROL_OPTIONS = [
  'Yes — I can set what I need',
  'Mostly — a few things are missing',
  'No — I\'d need significant changes to use this professionally',
];

const WOULD_USE_OPTIONS = [
  'Yes, absolutely',
  'Probably — depends on how it develops',
  'Maybe — I have some concerns',
  'Probably not',
];

const TRIED_INVOICING_OPTIONS = ['Yes', 'No'];

const INVOICING_COMPARE_OPTIONS = [
  'Much better',
  'About the same',
  'Worse',
  "I don't currently invoice",
];

// ── Shared styles ─────────────────────────────────────────────────────────────

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

const radioLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  cursor: 'pointer',
  fontSize: '0.79rem',
  color: '#1e1e1e',
  lineHeight: 1.45,
  padding: '4px 0',
};

// ── Types ─────────────────────────────────────────────────────────────────────

type PageFeedback = {
  page: string;
  openNotes: string;
  specificAnswer: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BetaFeedbackPanel() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  // Per-page fields (current page)
  const [notes, setNotes] = useState('');
  const [specificAnswer, setSpecificAnswer] = useState('');
  const [pageSaved, setPageSaved] = useState(false);

  // Accumulated per-page feedback
  const feedbackRef = useRef<PageFeedback[]>([]);

  // Final questions state
  const [showFinal, setShowFinal] = useState(false);
  const [signupEase, setSignupEase] = useState('');
  const [dashboardFeel, setDashboardFeel] = useState('');
  const [ratesControl, setRatesControl] = useState('');
  const [wouldUse, setWouldUse] = useState('');
  const [triedInvoicing, setTriedInvoicing] = useState('');
  const [invoicingCompare, setInvoicingCompare] = useState('');
  const [whatNeedsChange, setWhatNeedsChange] = useState('');
  const [oneThingForMolly, setOneThingForMolly] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);

  const [showEndOfSession, setShowEndOfSession] = useState(false);

  const config = getConfig(pathname);
  const isWelcomePage = ['/', '/interpreter', '/interpreter/login'].includes(pathname);

  // Track dashboard visit for end-of-session trigger
  useEffect(() => {
    if (pathname === '/interpreter/dashboard') {
      sessionStorage.setItem('signpost_visited_dashboard', 'true');
    }
    if (sessionStorage.getItem('signpost_visited_dashboard') === 'true') {
      setShowEndOfSession(true);
    }
  }, [pathname]);

  // Push page content right when panel is open
  useEffect(() => {
    const el = document.getElementById('site-content');
    if (!el) return;
    if (isOpen) {
      el.classList.add('panel-open');
      document.documentElement.style.setProperty('--panel-offset', '320px');
    } else {
      el.classList.remove('panel-open');
      document.documentElement.style.setProperty('--panel-offset', '0px');
    }
    return () => {
      el.classList.remove('panel-open');
      document.documentElement.style.setProperty('--panel-offset', '0px');
    };
  }, [isOpen]);

  // Reset per-page fields on route change (but keep accumulated feedback)
  useEffect(() => {
    setNotes('');
    setSpecificAnswer('');
    setPageSaved(false);
  }, [pathname]);

  // Save per-page feedback to local state only
  function handlePageSave() {
    if (!notes.trim() && !specificAnswer.trim()) return;
    // Replace existing feedback for same page, or add new
    const existing = feedbackRef.current;
    const idx = existing.findIndex(f => f.page === pathname);
    const entry: PageFeedback = { page: pathname, openNotes: notes.trim(), specificAnswer: specificAnswer.trim() };
    if (idx >= 0) {
      existing[idx] = entry;
    } else {
      existing.push(entry);
    }
    setPageSaved(true);
    setTimeout(() => setPageSaved(false), 3000);
  }

  // Submit everything to Monday.com
  async function handleFinalSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      // Include current page fields if they have content and haven't been saved yet
      if (notes.trim() || specificAnswer.trim()) {
        handlePageSave();
      }

      const res = await fetch('/api/beta-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageFeedback: feedbackRef.current,
          signupEase,
          dashboardFeel,
          ratesControl,
          wouldUse,
          triedInvoicing,
          invoicingCompare,
          whatNeedsChange,
          oneThingForMolly,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit');
      }
      setAllDone(true);
      feedbackRef.current = [];
    } catch (e) {
      console.error('Final submit error:', e);
      setError((e as Error).message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Collapsed tab ───────────────────────────────────────────────────────────
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

  // ── Open panel ──────────────────────────────────────────────────────────────
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

        {/* ── All done state ── */}
        {allDone ? (
          <div style={{ textAlign: 'center', padding: '40px 10px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,229,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', marginBottom: 8 }}>
              Thank you!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>
              Your feedback has been submitted. It goes directly to Molly &amp; Regina and will shape how signpost works for interpreters everywhere.
            </p>
          </div>
        ) : showFinal ? (
          /* ── Final questions ── */
          <>
            <div style={{
              background: '#fff7f0', border: '1px solid #ffd0b0', borderRadius: 8,
              padding: '10px 12px', fontSize: '0.79rem', color: '#7a3600', lineHeight: 1.55,
            }}>
              Almost done! Answer these final questions, then hit <strong>Submit all feedback</strong>.
            </div>

            {/* Q1: Signup ease */}
            <div>
              <label style={labelStyle}>How easy was signup?</label>
              {SIGNUP_EASE_OPTIONS.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="signupEase" value={opt} checked={signupEase === opt}
                    onChange={() => setSignupEase(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* Q2: Dashboard feel */}
            <div>
              <label style={labelStyle}>How did the dashboard feel?</label>
              {DASHBOARD_FEEL_OPTIONS.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="dashboardFeel" value={opt} checked={dashboardFeel === opt}
                    onChange={() => setDashboardFeel(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* Q3: Rates control */}
            <div>
              <label style={labelStyle}>Does rate setup give enough control?</label>
              {RATES_CONTROL_OPTIONS.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="ratesControl" value={opt} checked={ratesControl === opt}
                    onChange={() => setRatesControl(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* Q4: Would you use signpost */}
            <div>
              <label style={labelStyle}>Would you use signpost?</label>
              {WOULD_USE_OPTIONS.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="wouldUse" value={opt} checked={wouldUse === opt}
                    onChange={() => setWouldUse(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* Q5: Did you try invoicing */}
            <div>
              <label style={labelStyle}>Did you try the invoicing feature?</label>
              {TRIED_INVOICING_OPTIONS.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="triedInvoicing" value={opt} checked={triedInvoicing === opt}
                    onChange={() => setTriedInvoicing(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* Q6: Invoicing comparison */}
            {triedInvoicing === 'Yes' && (
              <div>
                <label style={labelStyle}>If yes — how did it compare to how you currently invoice?</label>
                {INVOICING_COMPARE_OPTIONS.map(opt => (
                  <label key={opt} style={radioLabelStyle}>
                    <input type="radio" name="invoicingCompare" value={opt} checked={invoicingCompare === opt}
                      onChange={() => setInvoicingCompare(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Q7: What needs to change */}
            <div>
              <label style={labelStyle}>What would need to change?</label>
              <textarea value={whatNeedsChange} onChange={e => setWhatNeedsChange(e.target.value)}
                placeholder="What would make this work for you professionally?" rows={3} style={textareaStyle} />
            </div>

            {/* Q6: One thing for Molly */}
            <div>
              <label style={labelStyle}>One thing you&apos;d most want Molly to know</label>
              <textarea value={oneThingForMolly} onChange={e => setOneThingForMolly(e.target.value)}
                placeholder="The single most important piece of feedback..." rows={3} style={textareaStyle} />
            </div>

            {/* Submit all */}
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              style={{
                background: '#ff6b2b', color: '#fff', border: 'none', borderRadius: 8,
                padding: '13px 16px', fontSize: '0.85rem', fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit all feedback'}
            </button>

            {error && (
              <p style={{ fontSize: '0.78rem', color: '#d32f2f', margin: 0, lineHeight: 1.4 }}>
                Error: {error}
              </p>
            )}

            {/* Back link */}
            <button onClick={() => setShowFinal(false)} style={{
              background: 'none', border: 'none', color: '#888', fontSize: '0.77rem',
              cursor: 'pointer', textDecoration: 'underline', padding: 0,
            }}>
              ← Back to page feedback
            </button>
          </>
        ) : (
          /* ── Per-page feedback (local save) ── */
          <>
            {/* Page prompt */}
            {isWelcomePage ? (
              <div style={{ fontSize: '0.82rem', lineHeight: 1.65, color: '#1e1e1e' }}>
                <p style={{ margin: '0 0 10px' }}>
                  Welcome to the signpost interpreter beta! Take a moment to look over this page — then when you&apos;re ready, go ahead and create your interpreter account.
                </p>
                <p style={{ margin: '0 0 10px' }}>
                  As you move through each step, drop your notes here — anything confusing, broken, missing, or that you love.
                </p>
                <p style={{ margin: '0 0 10px' }}>
                  For the beta, you can create your actual profile to be posted live on the site when we open — or a test profile that we&apos;ll delete after the beta. Either way, you can always update your profile at any time!
                </p>
                <p style={{ margin: 0 }}>
                  <strong>If you&apos;re creating a test profile, please enter your name as: First Name (TEST)</strong>
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', lineHeight: 1.65, color: '#1e1e1e', margin: 0 }}>
                {config.prompt}
              </p>
            )}

            {/* Scenario callout */}
            {config.scenario && (
              <div
                style={{
                  background: '#fff7f0', border: '1px solid #ffd0b0', borderRadius: 8,
                  padding: '10px 12px', fontSize: '0.77rem', color: '#7a3600', lineHeight: 1.55,
                }}
              >
                <strong style={{ display: 'block', marginBottom: 4 }}>Try this 👇</strong>
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

            {/* Second scenario callout */}
            {config.scenario2 && (
              <div
                style={{
                  background: '#fff7f0', border: '1px solid #ffd0b0', borderRadius: 8,
                  padding: '10px 12px', fontSize: '0.77rem', color: '#7a3600', lineHeight: 1.55,
                }}
              >
                <strong style={{ display: 'block', marginBottom: 4 }}>Try this 👇</strong>
                {config.scenario2}
              </div>
            )}

            {/* Second specific question */}
            {config.question2 && (
              <div>
                <label style={labelStyle}>Specific Question</label>
                <p style={{ fontSize: '0.77rem', color: '#555', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>
                  {config.question2}
                </p>
              </div>
            )}

            {/* Save button — local only */}
            <button
              onClick={handlePageSave}
              disabled={!notes.trim() && !specificAnswer.trim()}
              style={{
                background: pageSaved ? '#00c875' : '#ff6b2b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '11px 16px',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                cursor: !notes.trim() && !specificAnswer.trim() ? 'not-allowed' : 'pointer',
                opacity: !notes.trim() && !specificAnswer.trim() && !pageSaved ? 0.45 : 1,
                transition: 'background 0.2s, opacity 0.2s',
              }}
            >
              {pageSaved ? '✓ Saved!' : 'Save feedback for this page'}
            </button>

            {feedbackRef.current.length > 0 && (
              <p style={{ fontSize: '0.72rem', color: '#888', margin: 0, textAlign: 'center' }}>
                {feedbackRef.current.length} page{feedbackRef.current.length !== 1 ? 's' : ''} of feedback saved
              </p>
            )}

            {/* End-of-session CTA */}
            {showEndOfSession && (
              <button
                onClick={() => setShowFinal(true)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  background: 'transparent',
                  color: '#00e5ff',
                  border: '1px solid #00e5ff',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: '0.77rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                I&apos;m done exploring — take me to the final questions →
              </button>
            )}
          </>
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
