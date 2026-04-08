'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { syncNameFields } from '@/lib/nameSync';
import HowItWorks from '@/components/onboarding/HowItWorks';

const TOTAL_STEPS = 5;

type RequesterType = 'organization' | 'personal_event' | null;

const ORG_TYPES = [
  'School', 'Healthcare', 'Government', 'Non-profit',
  'Legal', 'Corporate', 'Community', 'Event', 'Other',
];

const COMM_OPTIONS = ['Email', 'Text/SMS', 'Video Phone', 'Phone Call'];

interface FormData {
  requesterType: RequesterType;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  country: string;
  city: string;
  orgName: string;
  orgType: string;
  commPrefs: string[];
}

const defaultForm: FormData = {
  requesterType: null, firstName: '', lastName: '', email: '', password: '',
  confirmPassword: '', phone: '', country: '', city: '', orgName: '', orgType: '',
  commPrefs: ['Email'],
};

export default function RequestSignupClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleComm(pref: string) {
    setForm(prev => ({
      ...prev,
      commPrefs: prev.commPrefs.includes(pref)
        ? prev.commPrefs.filter(p => p !== pref)
        : [...prev.commPrefs, pref],
    }));
  }

  function canContinue() {
    if (step === 1) return true; // How It Works (informational)
    if (step === 2) return form.requesterType !== null;
    if (step === 3) {
      const baseValid = form.firstName && form.email && form.password && form.password === form.confirmPassword && form.country && form.city;
      if (form.requesterType === 'organization') return baseValid && form.orgName;
      return baseValid;
    }
    return true;
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);

    const supabase = createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (authError || !authData.user) {
      setError(authError?.message || 'Failed to create account');
      setLoading(false);
      return;
    }

    const userId = authData.user.id;
    const displayName = `${form.firstName} ${form.lastName}`.trim();

    // 2. Create user_profiles row
    const { error: upError } = await supabase.from('user_profiles').insert({
      id: userId,
      role: 'requester',
      email: form.email,
    });
    if (upError) {
      setError('Failed to create user profile: ' + upError.message);
      setLoading(false);
      return;
    }

    // 3. Create requester_profiles row
    const { normalizeProfileFields } = await import('@/lib/normalize');
    const norm = normalizeProfileFields({ first_name: form.firstName, last_name: form.lastName, city: form.city, country_name: form.country });
    const normFirst = (norm.first_name as string) || form.firstName;
    const normLast = (norm.last_name as string) || form.lastName;
    const normDisplayName = `${normFirst} ${normLast}`.trim() || form.email;
    // TODO: Tech debt - remove requester_profiles.name column, derive from first_name + last_name
    const { error: rpError } = await supabase.from('requester_profiles').insert(syncNameFields({
      id: userId,
      user_id: userId,
      first_name: normFirst,
      last_name: normLast,
      email: form.email,
      phone: form.phone || null,
      country_name: (norm.country_name as string) || form.country,
      city: (norm.city as string) || form.city,
      org_name: form.requesterType === 'organization' ? form.orgName : null,
      org_type: form.requesterType === 'organization' ? form.orgType : null,
      requester_type: form.requesterType,
      comm_prefs: JSON.stringify(form.commPrefs),
    }));
    if (rpError) {
      setError('Failed to create requester profile: ' + rpError.message);
      setLoading(false);
      return;
    }

    // Create Stripe customer (fire-and-forget - not blocking signup)
    fetch('/api/stripe/customer', { method: 'POST' }).catch(() => {
      // Stripe customer will be created lazily on first payment settings visit
    });

    // Move to final step
    setStep(5);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Back link */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/request" style={{ fontSize: '0.85rem', color: 'var(--muted)', textDecoration: 'none' }}>
          ← Back to request portal
        </Link>
      </div>

      {/* Step indicator */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
            <div key={idx} style={{
              flex: 1, height: 3, borderRadius: '2px',
              background: idx < step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Step {step} of {TOTAL_STEPS}</div>
      </div>

      {/* Step 1 - How signpost Works */}
      {step === 1 && (
        <HowItWorks role="requester" onContinue={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
      )}

      {/* Step 2 - Role Selection */}
      {step === 2 && (
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 775, color: '#f0f2f8', marginBottom: '6px' }}>
            Your Role
          </h1>
          <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', marginBottom: '28px' }}>
            Select the option that best describes you.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {/* Organization / Institution */}
            <button
              type="button"
              onClick={() => update('requesterType', 'organization')}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                width: '100%', textAlign: 'left', padding: '20px',
                background: 'var(--surface)',
                border: `1px solid ${form.requesterType === 'organization' ? 'rgba(0,229,255,0.5)' : 'var(--border)'}`,
                borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'rgba(0,229,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <path d="M9 22v-4h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: 4 }}>
                  Organization / Institution
                </div>
                <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', lineHeight: 1.5 }}>
                  Schools, hospitals, courts, companies, non-profits, and other organizations that book interpreters.
                </div>
              </div>
            </button>

            {/* Deaf / Hard of Hearing - redirects */}
            <button
              type="button"
              onClick={() => router.push('/dhh')}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                width: '100%', textAlign: 'left', padding: '20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'rgba(157,135,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <path d="M9 9h.01M15 9h.01" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: 4 }}>
                  Deaf / Hard of Hearing
                </div>
                <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', lineHeight: 1.5 }}>
                  Personal interpreter requests for Deaf, DeafBlind, and Hard of Hearing individuals are free through our D/DB/HH portal.
                </div>
              </div>
            </button>

            {/* Personal Event */}
            <button
              type="button"
              onClick={() => update('requesterType', 'personal_event')}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                width: '100%', textAlign: 'left', padding: '20px',
                background: 'var(--surface)',
                border: `1px solid ${form.requesterType === 'personal_event' ? 'rgba(0,229,255,0.5)' : 'var(--border)'}`,
                borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'rgba(0,229,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: 4 }}>
                  Personal Event
                </div>
                <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', lineHeight: 1.5 }}>
                  Weddings, parties, conferences, or other events where you need an interpreter.
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 3 - Account Details */}
      {step === 3 && (
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 775, color: '#f0f2f8', marginBottom: '6px' }}>
            Account Details
          </h2>
          <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', marginBottom: '28px' }}>
            {"We'll use this to create your signpost account."}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Org fields (conditional) */}
            {form.requesterType === 'organization' && (
              <>
                <InputField label="Organization Name *" value={form.orgName} onChange={v => update('orgName', v)} placeholder="Acme Healthcare" />
                <div>
                  <label style={labelStyle}>Organization Type</label>
                  <select
                    value={form.orgType}
                    onChange={e => update('orgType', e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select type...</option>
                    {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Name row */}
            <div className="signup-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="First Name *" value={form.firstName} onChange={v => update('firstName', v)} placeholder="Alex" />
              <InputField label="Last Name" value={form.lastName} onChange={v => update('lastName', v)} placeholder="Rivera" />
            </div>

            <InputField label="Phone" type="tel" value={form.phone} onChange={v => update('phone', v)} placeholder="555 000 0000" />
            <InputField label="Email *" type="email" value={form.email} onChange={v => update('email', v)} placeholder="you@example.com" />

            {/* Location */}
            <div className="signup-location-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Country *" value={form.country} onChange={v => update('country', v)} placeholder="United States" />
              <InputField label="City / Region *" value={form.city} onChange={v => update('city', v)} placeholder="Los Angeles" />
            </div>

            {/* Communication Preferences */}
            <div>
              <label style={labelStyle}>Preferred Communication Method</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {COMM_OPTIONS.map(pref => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => toggleComm(pref)}
                    style={{
                      padding: '8px 16px', borderRadius: 10,
                      fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
                      background: form.commPrefs.includes(pref) ? 'rgba(0,229,255,0.12)' : 'var(--surface2)',
                      border: form.commPrefs.includes(pref) ? '1px solid rgba(0,229,255,0.4)' : '1px solid var(--border)',
                      color: form.commPrefs.includes(pref) ? 'var(--accent)' : 'var(--muted)',
                    }}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <InputField label="Password *" type="password" value={form.password} onChange={v => update('password', v)} placeholder="Minimum 8 characters" />
            <InputField label="Confirm Password *" type="password" value={form.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Re-enter password" />
            {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
              <p style={{ color: 'var(--accent3)', fontSize: '0.8rem', margin: '-8px 0 0' }}>Passwords do not match.</p>
            )}
          </div>
        </div>
      )}

      {/* Step 4 - Preview & Create */}
      {step === 4 && (
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 775, color: '#f0f2f8', marginBottom: '6px' }}>
            Preview &amp; Create
          </h2>
          <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', marginBottom: '28px' }}>
            Review what you can do with your signpost account, then create it.
          </p>

          {/* Your First Request info */}
          <div style={{
            padding: '20px 24px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: '12px', marginBottom: 16,
          }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: '8px' }}>
              Your First Request
            </div>
            <p style={{ fontWeight: 400, fontSize: '14px', color: '#c8cdd8', lineHeight: 1.6, margin: '0 0 10px' }}>
              Once your account is created, you can browse the interpreter directory and send your first booking request directly from your dashboard.
            </p>
            <p style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8', fontStyle: 'italic', margin: 0 }}>
              The request form walks you through event details, language needs, and interpreter selection. Most requests take under 2 minutes.
            </p>
          </div>

          {/* What you can do checklist */}
          <div style={{
            padding: '24px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: '12px',
          }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: '14px' }}>
              What you can do:
            </div>
            {[
              'Browse the global interpreter directory',
              'Filter by language, specialization, and region',
              'View profiles, rates, and availability',
              'Send booking requests directly',
              'Build your preferred interpreter list',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontWeight: 400, fontSize: '14px', color: '#c8cdd8' }}>
                <span style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }}>&#10003;</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 5 - Done */}
      {step === 5 && <DoneStep />}

      {/* Navigation (steps 2-4 only; step 1 has its own CTA, step 5 is done) */}
      {step > 1 && step < 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 2}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
              padding: '10px 20px', color: step === 2 ? 'var(--border)' : 'var(--muted)',
              fontSize: '0.9rem', cursor: step === 2 ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ← Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => {
                setError('');
                setStep(s => s + 1);
              }}
              disabled={!canContinue()}
              className="btn-primary"
              style={{ opacity: canContinue() ? 1 : 0.4, padding: '10px 24px' }}
            >
              Continue &#8594;
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
              style={{ opacity: loading ? 0.4 : 1, padding: '10px 24px' }}
            >
              {loading ? 'Creating account...' : 'Create Account \u2192'}
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 16, background: 'rgba(255,107,133,0.1)',
          border: '1px solid rgba(255,107,133,0.3)', borderRadius: '8px',
          padding: '12px 16px', color: 'var(--accent3)', fontSize: '0.85rem',
        }}>
          {error}
        </div>
      )}

      {/* Mobile styles */}
      <style>{`
        @media (max-width: 640px) {
          .signup-name-row {
            grid-template-columns: 1fr !important;
          }
          .signup-location-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Done Step with animated checkmark ── */
function DoneStep() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      {/* Animated checkmark */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
        background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(157,135,255,0.15))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: show ? 'scale(1)' : 'scale(0.5)',
        opacity: show ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{
          transform: show ? 'scale(1)' : 'scale(0)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
        }}>
          <path
            d="M12 20l6 6 10-12"
            stroke="url(#checkGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <defs>
            <linearGradient id="checkGrad" x1="12" y1="20" x2="28" y2="14">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#9d87ff" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h2 style={{
        fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 775,
        color: '#f0f2f8', marginBottom: 8,
        opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.4s ease 0.3s',
      }}>
        {"You're all set."}
      </h2>
      <p style={{
        fontWeight: 400, fontSize: '15px', color: '#96a0b8', marginBottom: 32, lineHeight: 1.6,
        opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 0.4s',
      }}>
        Your signpost account has been created. Start browsing interpreters or head to your dashboard.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
        opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 0.5s',
      }}>
        <button
          onClick={() => { router.refresh(); router.push('/request/dashboard'); }}
          className="btn-primary"
          style={{ padding: '12px 28px' }}
        >
          Go to My Dashboard
        </button>
        <Link
          href="/directory?context=requester"
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '12px 28px', borderRadius: 8,
            border: '1px solid var(--border)', color: 'var(--text)',
            textDecoration: 'none', fontSize: '0.92rem', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Browse Interpreters
        </Link>
      </div>
    </div>
  );
}

/* ── Shared form helpers ── */
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 500,
  color: '#c8cdd8', marginBottom: '6px',
  fontFamily: "'DM Sans', sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '12px 14px', color: 'var(--text)',
  fontSize: '0.95rem', outline: 'none', fontFamily: "'DM Sans', sans-serif",
};

function InputField({ label, type = 'text', value, onChange, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={e => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  );
}
