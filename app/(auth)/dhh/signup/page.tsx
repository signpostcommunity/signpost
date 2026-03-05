'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';

export default function DeafSignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) {
      setError(authError?.message || 'Failed to create account');
      setLoading(false);
      return;
    }

    const userId = authData.user.id;
    await supabase.from('user_profiles').insert({ id: userId, role: 'deaf' });
    await supabase.from('deaf_profiles').insert({ id: userId, name, country });

    router.push('/dhh/dashboard');
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 73px)',
        padding: '40px 24px',
      }}
    >
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
          D/HH Portal
        </div>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>
          Create Account
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: '12px', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link href="/dhh/login" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
        <p style={{
          color: 'var(--muted)',
          fontSize: '0.78rem',
          marginTop: 6,
          lineHeight: 1.5,
          marginBottom: '28px',
        }}>
          After completing signup, you'll have the option to add an interpreter or requester profile to your account.
        </p>

        <GoogleSignInButton role="deaf" label="Sign up with Google" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)', borderRadius: '8px', padding: '12px 16px', color: 'var(--accent3)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          <AuthInput label="Full Name" value={name} onChange={setName} placeholder="Your name" />
          <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" />
          <AuthInput label="Country (optional)" value={country} onChange={setCountry} placeholder="United States" />
          <button type="submit" disabled={loading} className="btn-primary btn-large" style={{ marginTop: '8px', opacity: loading ? 0.7 : 1, background: 'var(--accent2)', color: '#000' }}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AuthInput({ label, type = 'text', value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '6px' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text)', fontSize: '0.95rem', outline: 'none' }}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(157,135,255,0.5)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  );
}
