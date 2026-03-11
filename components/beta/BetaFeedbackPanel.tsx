'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ── Route-specific prompts ────────────────────────────────────────────────────

const ROUTE_CONFIG: Record<string, { prompt?: string; scenario?: string; question?: string; scenario2?: string; question2?: string }> = {
  '/': {
    prompt: 'Welcome to signpost! Take a moment to look around the home page.',
    scenario: 'Find out more about the people who built signpost. Where would you typically look for that?',
  },
  '/interpreter': {
    prompt:
      "Take a moment to look over this page — then when you're ready, find where you should go to create your interpreter account. As you move through each step, drop your notes here — anything confusing, broken, missing, or that you love.",
  },
  '/interpreter/signup': {
    prompt:
      "You're building your interpreter profile. Note anything that's missing, confusing, or doesn't work as expected. We will look at each section in more depth in the Dashboard, so don't worry about getting it perfect now.",
    question: 'Is there anything missing that Deaf clients or organizations would need to see?',
  },
  '/interpreter/dashboard': {
    prompt: 'This is your home base — have a look around!',
    question: "What's the first thing you went looking for? Did you find it easily?",
  },
  '/interpreter/dashboard/inquiries': {
    scenario: 'You have several new booking requests. Try responding to them in different ways.',
    question: 'Was it clear what you were supposed to do and what would happen next?',
  },
  '/interpreter/dashboard/inbox': {
    scenario: 'You have a message. Try reading and responding to it.',
    question: 'Did messaging feel natural, or was anything awkward or missing?',
  },
  '/interpreter/dashboard/confirmed': {
    scenario: 'Look at a specific job to see if you have all of the information you need.',
    question: 'Did the layout feel logical, was anything missing?',
    scenario2: "Cancel a job that you have already confirmed. (I know, it makes me nauseous thinking about it too, but these are fake!)",
    question2: 'How did you feel about the flow? Does it feel reasonable, easy to understand?',
  },
  '/interpreter/dashboard/invoices': {
    prompt: 'This is where you manage invoices for completed jobs.',
    scenario: "Find a past job that hasn't been invoiced yet and submit an invoice for it. Review the pre-filled details, adjust if needed, and send it.",
    question: "Was the invoicing flow clear? Is there anything missing that you'd need to invoice professionally?",
  },
  '/interpreter/dashboard/profile': {
    prompt: "You're looking at your public profile — this is what Deaf clients and organizations will see.",
    question: "Does this represent you the way you'd want to be seen? Is there anything missing?",
    question2: 'Are there any work settings, skillsets, or identity groups that should be added?',
  },
  '/interpreter/dashboard/rates': {
    prompt: "You're setting your rates and terms.",
    question: "What's missing that you'd need to easily set your rates and policies?",
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
    question: "Does your profile show up the way you'd expect? Is there anything about how interpreters are displayed that you'd want to change?",
    scenario: "Your favorite team interpreter of all time isn't in the directory. How would you invite them?",
  },
};

function getConfig(pathname: string) {
  if (ROUTE_CONFIG[pathname]) return ROUTE_CONFIG[pathname];
  if (pathname.startsWith('/interpreter/signup')) return ROUTE_CONFIG['/interpreter/signup'];
  return {};
}

// ── End-of-session question definitions ──────────────────────────────────────

const PROFESSIONAL_NEEDS_OPTIONS = [
  'Exceeds my needs',
  'Meets my needs',
  'Partially meets — some things missing',
  "Doesn't meet my needs yet",
  "I don't use other platforms",
];

const LIKELIHOOD_OPTIONS = [
  'I love it! I wish I could use it for all of my work.',
  'I like it, I will add it to places I accept jobs from.',
  'Meh, my jury is still out.',
  "I'm not a fan, count me out.",
];

const YES_NO = ['Yes', 'No'];

const STAR_RATING_FEEL_OPTIONS = [
  'Love it',
  "It's fine",
  'Not sure',
  "I don't like it",
];

const WHO_SHOULD_RATE_OPTIONS = [
  'Deaf/HoH consumers only',
  'Organizations only',
  'Both',
];

const RATING_DISPLAY_OPTIONS = [
  'Separately',
  'Combined average only',
  'Both — overall average with expandable groups',
];

const INVOICING_COMPARE_OPTIONS = [
  'Much better',
  'About the same',
  'Worse',
  "I don't currently invoice",
];

const PREMIUM_INTEREST_OPTIONS = [
  'Definitely',
  'Maybe',
  'Probably not',
  'No',
];

const PREMIUM_PRICE_OPTIONS = [
  '$5–10',
  '$10–20',
  '$20–30',
  'More, if the features are right',
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

const checkboxLabelStyle: React.CSSProperties = {
  ...radioLabelStyle,
};

const separatorStyle: React.CSSProperties = {
  borderTop: '1px solid #e0ddd6',
  margin: '6px 0',
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

  // Q1: Professional needs
  const [professionalNeeds, setProfessionalNeeds] = useState('');
  const [whatsWorkingMissing, setWhatsWorkingMissing] = useState('');

  // Q2: Likelihood to use
  const [likelihood, setLikelihood] = useState('');

  // Q3: Mobile
  const [usedMobile, setUsedMobile] = useState('');
  const [mobileFeedback, setMobileFeedback] = useState('');

  // Q4: Star ratings
  const [starRatingFeel, setStarRatingFeel] = useState('');
  const [whoShouldRate, setWhoShouldRate] = useState<string[]>([]);
  const [dhhRatingCategories, setDhhRatingCategories] = useState('');
  const [orgRatingCategories, setOrgRatingCategories] = useState('');
  const [ratingDisplay, setRatingDisplay] = useState('');

  // Q5: Invoicing
  const [triedInvoicing, setTriedInvoicing] = useState('');
  const [invoicingCompare, setInvoicingCompare] = useState('');

  // Q6: Premium
  const [premiumInterest, setPremiumInterest] = useState('');
  const [premiumPrice, setPremiumPrice] = useState('');

  // Q7: Final
  const [dreamPlatform, setDreamPlatform] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);

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

  // Save per-page feedback to local state AND Supabase immediately
  async function handlePageSave() {
    if (!notes.trim() && !specificAnswer.trim()) return;
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

    // Write to Supabase immediately
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error: insertErr } = await supabase.from('beta_feedback').insert({
        tester_email: user?.email ?? null,
        page: pathname,
        notes: notes.trim() || null,
        specific_answer: specificAnswer.trim() || null,
        feedback_type: 'page_note',
      });
      if (insertErr) console.error('beta_feedback page save error:', insertErr);
    } catch (e) {
      console.error('beta_feedback page save failed:', e);
    }
  }

  // Submit everything
  async function handleFinalSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      if (notes.trim() || specificAnswer.trim()) {
        handlePageSave();
      }

      const res = await fetch('/api/beta-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageFeedback: feedbackRef.current,
          professionalNeeds,
          whatsWorkingMissing,
          likelihood,
          usedMobile,
          mobileFeedback,
          starRatingFeel,
          whoShouldRate,
          dhhRatingCategories,
          orgRatingCategories,
          ratingDisplay,
          triedInvoicing,
          invoicingCompare,
          premiumInterest,
          premiumPrice,
          dreamPlatform,
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

  function toggleCheckbox(value: string, arr: string[], setter: (v: string[]) => void) {
    setter(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
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
        Beta Feedback
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
          &times;
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
            {/* Back to dashboard link */}
            <a
              href="/interpreter/dashboard"
              style={{
                fontSize: '0.77rem', color: '#00e5ff', textDecoration: 'none',
                fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              &larr; Go back to Interpreter Portal
            </a>

            <div style={{
              background: '#fff7f0', border: '1px solid #ffd0b0', borderRadius: 8,
              padding: '10px 12px', fontSize: '0.79rem', color: '#7a3600', lineHeight: 1.55,
            }}>
              Almost done! Answer these final questions, then hit <strong>Submit all feedback</strong>.
            </div>

            {/* ── Q1: Professional needs ── */}
            <div style={separatorStyle} />
            <div>
              <label style={labelStyle}>1. Professional Needs</label>
              <p style={{ fontSize: '0.77rem', color: '#555', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>
                Thinking about efficiency, visibility, customization, and control &mdash; how does signpost compare to agencies, other platforms, or other software you currently use to manage your interpreting work?
              </p>
              {PROFESSIONAL_NEEDS_OPTIONS.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="professionalNeeds" value={opt} checked={professionalNeeds === opt}
                    onChange={() => setProfessionalNeeds(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <div>
              <label style={labelStyle}>What&apos;s working well, and what&apos;s missing?</label>
              <textarea value={whatsWorkingMissing} onChange={e => setWhatsWorkingMissing(e.target.value)}
                placeholder="What's working, what's missing..." rows={3} style={textareaStyle} />
            </div>

            {/* ── Q2: Likelihood to use ── */}
            <div style={separatorStyle} />
            <div>
              <label style={labelStyle}>2. Likelihood to Use</label>
              <p style={{ fontSize: '0.77rem', color: '#555', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>
                How likely are you to use signpost as part of your interpreting work?
              </p>
              {LIKELIHOOD_OPTIONS.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="likelihood" value={opt} checked={likelihood === opt}
                    onChange={() => setLikelihood(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* ── Q3: Mobile ── */}
            <div style={separatorStyle} />
            <div>
              <label style={labelStyle}>3. Mobile</label>
              <p style={{ fontSize: '0.77rem', color: '#555', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>
                Did you use signpost on your phone or tablet?
              </p>
              {YES_NO.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="usedMobile" value={opt} checked={usedMobile === opt}
                    onChange={() => setUsedMobile(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {usedMobile === 'Yes' && (
              <div>
                <label style={labelStyle}>If yes &mdash; were any buttons, menus, or text difficult to tap or read?</label>
                <textarea value={mobileFeedback} onChange={e => setMobileFeedback(e.target.value)}
                  placeholder="Any mobile issues..." rows={3} style={textareaStyle} />
              </div>
            )}

            {/* ── Q4: Star ratings ── */}
            <div style={separatorStyle} />
            <div>
              <label style={labelStyle}>4. Star Ratings</label>
              <p style={{ fontSize: '0.77rem', color: '#555', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>
                How would you feel about a star rating system for interpreters on signpost?
              </p>
              {STAR_RATING_FEEL_OPTIONS.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="starRatingFeel" value={opt} checked={starRatingFeel === opt}
                    onChange={() => setStarRatingFeel(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <div>
              <label style={labelStyle}>Who should be able to rate interpreters? (select all)</label>
              {WHO_SHOULD_RATE_OPTIONS.map(opt => (
                <label key={opt} style={checkboxLabelStyle}>
                  <input type="checkbox" checked={whoShouldRate.includes(opt)}
                    onChange={() => toggleCheckbox(opt, whoShouldRate, setWhoShouldRate)}
                    style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <div>
              <label style={labelStyle}>If D/HH consumers could rate interpreters, what categories would matter most?</label>
              <textarea value={dhhRatingCategories} onChange={e => setDhhRatingCategories(e.target.value)}
                placeholder="e.g. clarity, professionalism, signing style..." rows={2} style={textareaStyle} />
            </div>
            <div>
              <label style={labelStyle}>If organizations could rate interpreters, what categories would matter most?</label>
              <textarea value={orgRatingCategories} onChange={e => setOrgRatingCategories(e.target.value)}
                placeholder="e.g. punctuality, reliability, communication..." rows={2} style={textareaStyle} />
            </div>
            <div>
              <label style={labelStyle}>If both groups can rate, how should ratings be displayed?</label>
              {RATING_DISPLAY_OPTIONS.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="ratingDisplay" value={opt} checked={ratingDisplay === opt}
                    onChange={() => setRatingDisplay(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {/* ── Q5: Invoicing ── */}
            <div style={separatorStyle} />
            <div>
              <label style={labelStyle}>5. Invoicing</label>
              <p style={{ fontSize: '0.77rem', color: '#555', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>
                Did you try the invoicing feature?
              </p>
              {YES_NO.map(opt => (
                <label key={`inv-${opt}`} style={radioLabelStyle}>
                  <input type="radio" name="triedInvoicing" value={opt} checked={triedInvoicing === opt}
                    onChange={() => setTriedInvoicing(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {triedInvoicing === 'Yes' && (
              <div>
                <label style={labelStyle}>If yes &mdash; how did it compare to how you currently invoice?</label>
                {INVOICING_COMPARE_OPTIONS.map(opt => (
                  <label key={opt} style={radioLabelStyle}>
                    <input type="radio" name="invoicingCompare" value={opt} checked={invoicingCompare === opt}
                      onChange={() => setInvoicingCompare(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* ── Q6: Premium subscription ── */}
            <div style={separatorStyle} />
            <div>
              <label style={labelStyle}>6. Premium Subscription</label>
              <p style={{ fontSize: '0.77rem', color: '#555', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>
                signpost will always be free for interpreters to create a profile and receive job offers. If there were a paid premium tier offering features like full-service invoicing, getting paid directly through the site, tax and financial reports, and freelance job tracking &mdash; would you be interested?
              </p>
              {PREMIUM_INTEREST_OPTIONS.map(opt => (
                <label key={opt} style={radioLabelStyle}>
                  <input type="radio" name="premiumInterest" value={opt} checked={premiumInterest === opt}
                    onChange={() => setPremiumInterest(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {(premiumInterest === 'Definitely' || premiumInterest === 'Maybe') && (
              <div>
                <label style={labelStyle}>If yes &mdash; what would you expect to pay monthly?</label>
                {PREMIUM_PRICE_OPTIONS.map(opt => (
                  <label key={opt} style={radioLabelStyle}>
                    <input type="radio" name="premiumPrice" value={opt} checked={premiumPrice === opt}
                      onChange={() => setPremiumPrice(opt)} style={{ marginTop: 2, accentColor: '#ff6b2b' }} />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* ── Q7: Dream platform ── */}
            <div style={separatorStyle} />
            <div>
              <label style={labelStyle}>7. Final Question</label>
              <p style={{ fontSize: '0.77rem', color: '#555', margin: '0 0 8px', lineHeight: 1.5, fontStyle: 'italic' }}>
                What would your dream interpreter platform include that we haven&apos;t thought of?
              </p>
              <textarea value={dreamPlatform} onChange={e => setDreamPlatform(e.target.value)}
                placeholder="Your dream interpreter platform..." rows={4} style={textareaStyle} />
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
              &larr; Back to page feedback
            </button>
          </>
        ) : (
          /* ── Per-page feedback (local save) ── */
          <>
            {/* Page prompt */}
            {config.prompt && (
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
                <strong style={{ display: 'block', marginBottom: 4 }}>Try this! 👇</strong>
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

            {/* Separator between first and second scenario/question */}
            {(config.scenario2 || config.question2) && (
              <div style={separatorStyle} />
            )}

            {/* Second scenario callout */}
            {config.scenario2 && (
              <div
                style={{
                  background: '#fff7f0', border: '1px solid #ffd0b0', borderRadius: 8,
                  padding: '10px 12px', fontSize: '0.77rem', color: '#7a3600', lineHeight: 1.55,
                }}
              >
                <strong style={{ display: 'block', marginBottom: 4 }}>Try this! 👇</strong>
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
              <div>
                <p style={{ fontSize: '0.74rem', color: '#888', margin: '0 0 8px', textAlign: 'center' }}>
                  Once you&apos;ve had a chance to explore, we have just a few more questions that are most critical in shaping what signpost will be. Your insight here means everything to us.
                </p>
                <button
                  onClick={() => setShowFinal(true)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    background: '#ff6b2b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  I&apos;m done exploring. Take me to the final questions &rarr;
                </button>
              </div>
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
