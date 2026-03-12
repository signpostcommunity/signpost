'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  role: 'interpreter' | 'deaf' | 'requester';
  label?: string;
}

export default function GoogleSignInButton({ role, label = 'Continue with Google' }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) {
        console.error('Google OAuth error:', error);
        setLoading(false);
      }
      // If successful, browser redirects — loading state persists naturally
    } catch (e) {
      console.error('Google OAuth error:', e);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 16px',
        color: 'var(--text)',
        fontSize: '0.92rem',
        fontFamily: 'var(--font-dm)',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s, opacity 0.15s',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseOver={(e) => { if (!loading) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
      onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {loading ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="9" cy="9" r="7" stroke="var(--muted)" strokeWidth="2" strokeDasharray="32" strokeDashoffset="8" strokeLinecap="round" />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
      )}
      {loading ? 'Connecting...' : label}
    </button>
  );
}
