'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import { syncNameFields } from '@/lib/nameSync';

type FormType = 'signup' | 'login' | null;

export default function DeafPortalClient() {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<FormType>(null);

  // Signup state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !signupEmail || !signupPassword) {
      setSignupError('Please fill in all fields.');
      return;
    }
    setSignupError('');
    setSignupLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: { data: { role: 'deaf' } },
    });

    if (authError || !authData.user) {
      setSignupError(authError?.message || 'Failed to create account');
      setSignupLoading(false);
      return;
    }

    const userId = authData.user.id;
    const { normalizeProfileFields } = await import('@/lib/normalize');
    const norm = normalizeProfileFields({ first_name: firstName, last_name: lastName });
    const normFirst = (norm.first_name as string) || firstName;
    const normLast = (norm.last_name as string) || lastName;
    const fullName = `${normFirst} ${normLast}`.trim();

    await supabase.from('user_profiles').insert({ id: userId, role: 'deaf' });
    // TODO: Tech debt — remove deaf_profiles.name column, derive from first_name + last_name
    await supabase.from('deaf_profiles').insert(syncNameFields({
      id: userId,
      user_id: userId,
      first_name: normFirst,
      last_name: normLast,
      email: signupEmail,
    }));

    // BETA: seed demo bookings + roster for new Deaf account
    try {
      await fetch('/api/seed-deaf-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (seedErr) {
      console.warn('Beta: deaf seed call failed, continuing', seedErr)
    }

    router.refresh();
    router.push('/dhh/dashboard');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter your email and password.');
      return;
    }
    setLoginError('');
    setLoginLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (authError) {
      setLoginError(authError.message);
      setLoginLoading(false);
      return;
    }

    router.refresh();
    router.push('/dhh/dashboard');
  }

  function showForm(type: FormType) {
    setActiveForm(type);
    setSignupError('');
    setLoginError('');
    setTimeout(() => {
      document.getElementById('deaf-inline-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '11px 14px',
    color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div className="deaf-portal-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 60px' }}>
      <div style={{ maxWidth: 960, width: '100%', margin: '0 auto' }}>

        {/* Back link */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none', marginBottom: 40 }}>
          &#8592; Back to Home
        </Link>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.4rem, 3vw, 27px)',
            fontWeight: 775, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 12,
            color: '#f0f2f8',
          }}>
            Your portal. Your preferences.<br />
            <em style={{
              fontStyle: 'normal',
              background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Your interpreters.</em>
          </h1>
          <p style={{ fontWeight: 400, fontSize: '15px', color: '#96a0b8', lineHeight: 1.75, maxWidth: 560 }}>
            Request interpreters directly, build your preferred interpreter list, and share your communication preferences, so every booking starts with the right context. Always free for Deaf individuals.
          </p>
        </div>

        {/* Two-card grid */}
        <div className="deaf-portal-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 48 }}>

          {/* Create profile card */}
          <div
            style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 36,
              display: 'flex', flexDirection: 'column', gap: 20,
              transition: 'border-color 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(157,135,255,0.4)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{
              width: 52, height: 52, background: 'rgba(157,135,255,0.1)',
              border: '1px solid rgba(157,135,255,0.25)', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <circle cx="13" cy="9" r="4.5" stroke="#9d87ff" strokeWidth="1.5" />
                <path d="M4 22c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="#9d87ff" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M19 4v6M16 7h6" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8' }}>New to signpost?</div>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: '0.83rem' }}>
                <span style={{ color: '#9d87ff', fontSize: '1rem' }}>&#10003;</span> Build your preferred interpreter list
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: '0.83rem' }}>
                <span style={{ color: '#9d87ff', fontSize: '1rem' }}>&#10003;</span> Share your communication preferences
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: '0.83rem' }}>
                <span style={{ color: '#9d87ff', fontSize: '1rem' }}>&#10003;</span> Request interpreters directly, always free
              </li>
            </ul>
            <button
              onClick={() => showForm('signup')}
              className="btn-primary"
              style={{ background: '#8b72ff', marginTop: 'auto', textAlign: 'center' }}
              onMouseOver={e => (e.currentTarget.style.background = '#7b61ff')}
              onMouseOut={e => (e.currentTarget.style.background = '#8b72ff')}
            >
              Create my account &#8594;
            </button>
          </div>

          {/* Sign in card */}
          <div
            style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 36,
              display: 'flex', flexDirection: 'column', gap: 20,
              transition: 'border-color 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{
              width: 52, height: 52, background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.2)', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="4" y="4" width="18" height="18" rx="4" stroke="#00e5ff" strokeWidth="1.5" />
                <path d="M9 13h8M14 10l3 3-3 3" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8' }}>Already have a profile?</div>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: '0.83rem' }}>
                <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>&#10003;</span> View &amp; update your preferred interpreter list
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: '0.83rem' }}>
                <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>&#10003;</span> Manage your communication preferences
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: '0.83rem' }}>
                <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>&#10003;</span> Review &amp; track your booking requests
              </li>
            </ul>
            <button
              onClick={() => showForm('login')}
              className="btn-primary"
              style={{ marginTop: 'auto', textAlign: 'center' }}
            >
              Sign in to my portal &#8594;
            </button>
          </div>
        </div>

        {/* Inline form area */}
        {activeForm && (
          <div
            id="deaf-inline-form"
            style={{
              maxWidth: 440, margin: '32px auto 0',
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 32,
            }}
          >
            {activeForm === 'login' ? (
              <>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: '#f0f2f8', marginBottom: 20 }}>Sign in</div>
                <GoogleSignInButton role="deaf" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {loginError && (
                    <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: '0.83rem', color: '#ff8099' }}>
                      {loginError}
                    </div>
                  )}
                  <input
                    type="email" placeholder="you@example.com" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    aria-label="Email address"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  <input
                    type="password" placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    aria-label="Password"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  <button type="submit" disabled={loginLoading} className="btn-primary" style={{ width: '100%', padding: 13, opacity: loginLoading ? 0.7 : 1 }}>
                    {loginLoading ? 'Signing in...' : 'Sign in \u2192'}
                  </button>
                  <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)' }}>
                    No account?{' '}
                    <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => showForm('signup')}>
                      Create one free &#8594;
                    </span>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: '#f0f2f8', marginBottom: 20 }}>Create your free account</div>
                <GoogleSignInButton role="deaf" label="Sign up with Google" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {signupError && (
                    <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: '0.83rem', color: '#ff8099' }}>
                      {signupError}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <input
                      type="text" placeholder="First name" value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      aria-label="First name"
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <input
                      type="text" placeholder="Last name" value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      aria-label="Last name"
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    />
                  </div>
                  <input
                    type="email" placeholder="you@example.com" value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    aria-label="Email address"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  <input
                    type="password" placeholder="Create a password" value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    aria-label="Password"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  <button
                    type="submit" disabled={signupLoading} className="btn-primary"
                    style={{ background: '#8b72ff', width: '100%', padding: 13, opacity: signupLoading ? 0.7 : 1 }}
                    onMouseOver={e => (e.currentTarget.style.background = '#7b61ff')}
                    onMouseOut={e => (e.currentTarget.style.background = '#8b72ff')}
                  >
                    {signupLoading ? 'Creating account...' : 'Create my account \u2192'}
                  </button>
                  <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)' }}>
                    Already have an account?{' '}
                    <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => showForm('login')}>
                      Sign in &#8594;
                    </span>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* Responsive grid */}
        <style>{`
          @media (max-width: 640px) {
            .deaf-portal-cards { grid-template-columns: 1fr !important; }
            .deaf-portal-cards > div { padding: 24px 20px !important; }
            .deaf-portal-wrapper { padding: 80px 16px 40px !important; }
          }
          @media (max-width: 390px) {
            .deaf-portal-cards > div { padding: 20px 16px !important; }
            .deaf-portal-wrapper { padding: 72px 16px 32px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
