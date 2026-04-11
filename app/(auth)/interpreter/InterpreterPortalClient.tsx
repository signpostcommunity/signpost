'use client';

import Link from 'next/link';

export default function InterpreterPortalClient() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        padding: '36px 28px',
        background: 'var(--bg)',
      }}
    >
      <div style={{ maxWidth: 680, width: '100%' }}>

        {/* 1. Wordmark */}
        <div className="wordmark" style={{ fontSize: 22, marginBottom: 32 }}>
          sign<span>post</span>
        </div>

        {/* 2. Headline */}
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: '#f0f2f8',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            margin: '0 0 18px',
          }}
        >
          Your interpreter profile, working for you.
        </h1>

        {/* 3. Founders intro */}
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              color: '#c8cdd8',
              lineHeight: 1.75,
              margin: '0 0 16px',
            }}
          >
            Built by{' '}
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>Regina</span>{' '}
            (Deaf professional, 20 years experience) and{' '}
            <span style={{ color: '#00e5ff', fontWeight: 600 }}>Molly</span>{' '}
            (interpreter, RID NIC-Master, 18 years experience).
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              color: '#00e5ff',
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            Instead of an agency controlling who you get, signpost is an interpreter directory that{' '}
            <span style={{ color: '#f0f2f8', fontWeight: 500 }}>centers your preferences and needs</span>{' '}
            at every step.
          </p>
        </div>

        {/* 4. Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            href="/interpreter/signup"
            style={{
              display: 'block',
              background: '#00e5ff',
              color: '#0a0a0f',
              padding: '14px 24px',
              borderRadius: 10,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Create my interpreter profile
          </Link>
          <Link
            href="/interpreter/login"
            style={{
              display: 'block',
              background: 'transparent',
              border: '1px solid rgba(0,229,255,0.3)',
              color: '#00e5ff',
              padding: '14px 24px',
              borderRadius: 10,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Sign in to my portal
          </Link>
        </div>
      </div>
    </div>
  );
}
