'use client';

import Link from 'next/link';

export default function DeafPortalClient() {
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
            fontSize: 24,
            color: '#f0f2f8',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: '0 0 18px',
          }}
        >
          How is signpost different from an agency?
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
            signpost started with two best friends.
            <br />
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>Regina</span> is a Deaf mental health professional.{' '}
            <span style={{ color: '#00e5ff', fontWeight: 600 }}>Molly</span> is a certified ASL interpreter. We have both lived the challenges of booking interpreters firsthand, and we believe a new model is possible that works better for everyone.
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              color: '#a78bfa',
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            Instead of an agency controlling who you get, signpost is an interpreter directory that{' '}
            <span style={{ color: '#f0f2f8', fontWeight: 500 }}>centers your preferences and needs</span>{' '}
            at every step.
          </p>
        </div>

        {/* 4. Signup buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            href="/dhh/signup"
            style={{
              display: 'block',
              background: '#7b61ff',
              color: '#ffffff',
              padding: '14px 24px',
              borderRadius: 10,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Create my free account
          </Link>
          <Link
            href="/dhh/login"
            style={{
              display: 'block',
              background: 'transparent',
              border: '1px solid rgba(123,97,255,0.3)',
              color: '#a78bfa',
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

        {/* Responsive styles */}
        <style>{`
          @media (max-width: 640px) {
            .deaf-landing-wrapper {
              padding: 24px 16px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
