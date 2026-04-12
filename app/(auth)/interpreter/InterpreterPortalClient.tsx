'use client';

import Link from 'next/link';

export default function InterpreterPortalClient() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 73px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--bg)',
      }}
    >
      <div
        className="interp-landing-card"
        style={{
          maxWidth: 480,
          width: '100%',
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: '40px 36px 36px',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="12" width="24" height="14" rx="3" stroke="#00e5ff" strokeWidth="1.5"/>
            <path d="M12 12V9a4 4 0 018 0v3" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M4 18h24" stroke="rgba(0,229,255,0.4)" strokeWidth="1"/>
            <circle cx="16" cy="18" r="2" stroke="#00e5ff" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: '#f0f2f8',
            textAlign: 'center',
            lineHeight: 1.4,
            margin: '0 0 20px',
          }}
        >
          Your interpreter profile, working for you.
        </h1>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

        {/* Founders */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: 15,
            color: '#96a0b8',
            lineHeight: 1.7,
            margin: '0 0 20px',
          }}
        >
          signpost started as a &ldquo;what if?&rdquo; chat between two best friends.{' '}
          <span style={{ color: '#a78bfa', fontWeight: 500 }}>Regina McGinnis</span> is a Deaf mental health professional.{' '}
          <span style={{ color: '#00e5ff', fontWeight: 500 }}>Molly Sano-Mahgoub</span> is a certified ASL interpreter, with a DeafBlind son.{' '}
          We have both experienced the challenges of booking interpreters firsthand, and we believe a new model is possible that works better for everyone.
          So we decided to build the platform we have always dreamt of.
        </p>

        {/* Mission */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: 17,
            color: '#96a0b8',
            lineHeight: 1.7,
            margin: '0 0 0',
          }}
        >
          Our goal is to give freelance interpreters full control over their own work. Set your own rates, connect directly with clients, and manage your bookings in one place.
        </p>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: 15,
            fontStyle: 'italic',
            color: '#00e5ff',
            lineHeight: 1.7,
            marginTop: 16,
            marginBottom: 28,
          }}
        >
          signpost is <em>your</em> interpreter platform.
        </p>

        {/* Buttons */}
        <div className="interp-landing-buttons" style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/interpreter/signup"
            style={{
              flex: 1,
              display: 'block',
              background: '#00e5ff',
              color: '#000',
              padding: '14px 16px',
              borderRadius: 10,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Create my interpreter profile
          </Link>
          <Link
            href="/interpreter/login"
            style={{
              flex: 1,
              display: 'block',
              background: 'transparent',
              border: '1px solid rgba(0,229,255,0.3)',
              color: '#00e5ff',
              padding: '14px 16px',
              borderRadius: 10,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .interp-landing-card {
            padding: 28px 24px 28px !important;
          }
          .interp-landing-buttons {
            flex-wrap: wrap !important;
          }
          .interp-landing-buttons a {
            flex-basis: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
