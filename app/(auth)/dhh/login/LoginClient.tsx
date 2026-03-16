'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';

export default function DeafLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push('/dhh/dashboard');
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 73px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '8px' }}>D/DB/HH Sign In</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '32px', fontSize: '0.9rem' }}>
          Welcome back.{' '}
          <Link href="/dhh/signup" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>Create an account</Link>
        </p>
        <GoogleSignInButton role="deaf" />
        <Divider />
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)', borderRadius: '8px', padding: '12px 16px', color: 'var(--accent3)', fontSize: '0.85rem' }}>{error}</div>}
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" />
          <button type="submit" disabled={loading} className="btn-primary btn-large" style={{ marginTop: '8px', opacity: loading ? 0.7 : 1, background: 'var(--accent2)', color: '#000' }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.82rem' }}>
          <Link href="/dhh" style={{ color: 'var(--muted)', textDecoration: 'none' }}>← Back to D/DB/HH portal</Link>
        </p>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

function Input({ label, type = 'text', value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '6px' }}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        aria-required="true"
        style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text)', fontSize: '0.95rem', outline: 'none' }}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(157,135,255,0.5)')} onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
    </div>
  );
}
