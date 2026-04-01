'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import LocationPicker from '@/components/shared/LocationPicker';
import { generateSlug } from '@/lib/slugUtils';
import { syncNameFields } from '@/lib/nameSync';
import HowItWorks from '@/components/onboarding/HowItWorks';

function DeafSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddRole = searchParams.get('addRole') === 'true';
  const [signupStep, setSignupStep] = useState(isAddRole ? 2 : 1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [pendingRoles, setPendingRoles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);

  // Add-role initialization: fetch existing user and pre-fill from existing profiles
  useEffect(() => {
    if (!isAddRole) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/dhh/login';
          return;
        }
        setExistingUserId(user.id);
        // Pre-fill from auth metadata
        const fullName = user.user_metadata?.full_name;
        if (fullName) setName(fullName);
        if (user.email) setEmail(user.email);

        // Pre-fill shared fields from existing profiles (e.g., interpreter profile)
        try {
          const res = await fetch('/api/profile-defaults');
          if (res.ok) {
            const defaults = await res.json();
            if (defaults.first_name) {
              const prefillName = [defaults.first_name, defaults.last_name].filter(Boolean).join(' ');
              if (prefillName && !fullName) setName(prefillName);
            }
            if (defaults.country) setCountry(defaults.country);
            if (defaults.state) setState(defaults.state);
            if (defaults.city) setCity(defaults.city);
          }
        } catch (prefillErr) {
          // Non-blocking — form still works without pre-fill
          console.warn('Failed to fetch profile defaults:', prefillErr);
        }
      } catch (e) {
        console.error('Add role init failed:', e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddRole]);

  function togglePendingRole(role: string) {
    setPendingRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || (!isAddRole && !password)) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      let userId: string;

      if (isAddRole && existingUserId) {
        // Skip account creation for existing users
        userId = existingUserId;
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError || !authData.user) {
          setError(authError?.message || 'Failed to create account');
          setLoading(false);
          return;
        }
        userId = authData.user.id;

        // Only insert user_profiles for new accounts
        await supabase.from('user_profiles').insert({
          id: userId, role: 'deaf',
          pending_roles: pendingRoles.length > 0 ? pendingRoles : [],
        });
      }

      const firstNameRaw = name.split(' ')[0] || '';
      const lastNameRaw = name.split(' ').slice(1).join(' ') || '';
      const { normalizeProfileFields } = await import('@/lib/normalize');
      const norm = normalizeProfileFields({ first_name: firstNameRaw, last_name: lastNameRaw, city, state, country_name: country });
      const firstName = (norm.first_name as string) || firstNameRaw;
      const lastNameVal = (norm.last_name as string) || lastNameRaw;
      const normName = `${firstName} ${lastNameVal}`.trim();

      // TODO: Tech debt — remove deaf_profiles.name column, derive from first_name + last_name
      await supabase.from('deaf_profiles').insert(syncNameFields({
        id: userId,
        user_id: userId,
        first_name: firstName,
        last_name: lastNameVal,
        email,
        country_name: (norm.country_name as string) || country,
        state: (norm.state as string) || state,
        city: (norm.city as string) || city,
      }));

      // Auto-generate vanity slug
      const baseSlug = generateSlug(firstName, lastNameVal).slice(0, 50);
      if (baseSlug && baseSlug.length >= 3) {
        let slug = baseSlug;
        let attempt = 1;
        while (attempt <= 20) {
          const { data: existing } = await supabase
            .from('deaf_profiles')
            .select('vanity_slug')
            .ilike('vanity_slug', slug)
            .maybeSingle();
          if (!existing) break;
          attempt++;
          slug = `${baseSlug}-${attempt}`;
        }
        await supabase
          .from('deaf_profiles')
          .update({ vanity_slug: slug })
          .eq('id', userId);
      }

      // Clean up pending_roles if adding a role
      if (isAddRole) {
        try {
          const { data: upProfile } = await supabase
            .from('user_profiles')
            .select('pending_roles')
            .eq('id', userId)
            .single();
          if (upProfile?.pending_roles?.includes('deaf')) {
            const updated = (upProfile.pending_roles as string[]).filter((r: string) => r !== 'deaf');
            await supabase
              .from('user_profiles')
              .update({ pending_roles: updated })
              .eq('id', userId);
          }
        } catch (cleanupErr) {
          console.error('Failed to clean pending_roles:', cleanupErr);
        }
      }

      router.push('/dhh/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
      setLoading(false);
    }
  }

  return (
    <div
      className="dhh-signup-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 73px)',
        padding: '40px 24px',
      }}
    >
      {signupStep === 1 && (
        <div style={{ maxWidth: 680, width: '100%' }}>
          <HowItWorks role="deaf" onContinue={() => { setSignupStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
        </div>
      )}
      {signupStep === 2 && (
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(157,135,255,0.08)',
            border: '1px solid rgba(157,135,255,0.25)',
            borderRadius: '100px',
            padding: '6px 16px',
            fontSize: '0.78rem',
            color: 'var(--accent2)',
            marginBottom: '16px',
          }}
        >
          D/DB/HH Portal
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 775, letterSpacing: '-0.03em', marginBottom: '8px', color: '#f0f2f8' }}>
          {isAddRole ? 'Add Deaf/DB/HH Profile' : 'Create Account'}
        </h1>
        {!isAddRole && (
          <p style={{ fontWeight: 400, fontSize: '15px', color: '#96a0b8', marginBottom: '12px' }}>
            Already have an account?{' '}
            <Link href="/dhh/login" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        )}
        {!isAddRole && (
          <p style={{
            color: 'var(--muted)',
            fontSize: '0.78rem',
            marginTop: 6,
            lineHeight: 1.5,
            marginBottom: '28px',
          }}>
            After completing signup, you'll have the option to add an interpreter or requester profile to your account.
          </p>
        )}
        {isAddRole && (
          <p style={{
            color: 'var(--muted)',
            fontSize: '0.78rem',
            marginTop: 6,
            lineHeight: 1.5,
            marginBottom: '28px',
          }}>
            Add a Deaf/DB/HH profile to your existing account.
          </p>
        )}

        {!isAddRole && (
          <>
            <GoogleSignInButton role="deaf" label="Sign up with Google" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </>
        )}
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)', borderRadius: '8px', padding: '12px 16px', color: 'var(--accent3)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          <AuthInput label="Full Name" value={name} onChange={setName} placeholder="Your name" required />
          <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
          {!isAddRole && (
            <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" required />
          )}
          <div style={{ marginTop: 4 }}>
            <LocationPicker
              country={country}
              state={state}
              city={city}
              onChange={({ country: c, state: s, city: ci }) => {
                setCountry(c)
                setState(s)
                setCity(ci)
              }}
              accentColor="var(--accent2)"
            />
          </div>
          {/* Multi-role checkboxes — hidden in add-role mode */}
          {!isAddRole && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={pendingRoles.includes('interpreter')}
                  onChange={() => togglePendingRole('interpreter')}
                  style={{ marginTop: 3, accentColor: 'var(--accent2)', flexShrink: 0, width: 'auto' }}
                />
                <span>I am also a sign language interpreter and would like to create an interpreter profile.</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={pendingRoles.includes('requester')}
                  onChange={() => togglePendingRole('requester')}
                  style={{ marginTop: 3, accentColor: 'var(--accent2)', flexShrink: 0, width: 'auto' }}
                />
                <span>I also coordinate interpreters for an organization and would like to have access to the full requester portal.</span>
              </label>
              {pendingRoles.length > 0 && (
                <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginLeft: 26, lineHeight: 1.5 }}>
                  You&apos;ll find a setup prompt in your portal after you finish here. Just look for the red dot on your role switcher.
                </p>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary btn-large" style={{ marginTop: '8px', opacity: loading ? 0.7 : 1, background: 'var(--accent2)', color: '#000' }}>
            {loading ? (isAddRole ? 'Adding profile...' : 'Creating account...') : (isAddRole ? 'Add Profile' : 'Create Account')}
          </button>
        </form>
      </div>
      )}
    </div>
  );
}

export default function DeafSignupPage() {
  return (
    <Suspense fallback={null}>
      <DeafSignupForm />
    </Suspense>
  );
}

function AuthInput({ label, type = 'text', value, onChange, placeholder, required = false }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#c8cdd8', marginBottom: '6px' }}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-required={required ? 'true' : undefined}
        style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text)', fontSize: '0.95rem', outline: 'none' }}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(157,135,255,0.5)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  );
}
