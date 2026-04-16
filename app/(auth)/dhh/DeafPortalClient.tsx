'use client';

import Link from 'next/link';

export default function DeafPortalClient() {
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
        className="dhh-landing-card"
        style={{
          maxWidth: 560,
          width: '100%',
          background: '#111118',
          border: '1px solid rgba(167, 139, 250, 0.15)',
          borderRadius: 16,
          padding: '0 36px 36px',
        }}
      >
        {/* Gradient accent bar */}
        <div
          style={{
            height: 3,
            background: 'linear-gradient(90deg, #a78bfa, #00e5ff)',
            margin: '0 -36px 40px',
            width: 'calc(100% + 72px)',
          }}
        />
        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'rgba(123,97,255,0.08)',
            border: '1px solid rgba(123,97,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M8 14a4 4 0 018 0" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="9" r="3" stroke="#a78bfa" strokeWidth="1.5"/>
            <path d="M18 14a4 4 0 018 0" stroke="#7b61ff" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="22" cy="9" r="3" stroke="#7b61ff" strokeWidth="1.5"/>
            <path d="M6 28v-2a6 6 0 016-6h8a6 6 0 016 6v2" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M16 18v4M14 20h4" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: '#f0f2f8',
            textAlign: 'center',
            lineHeight: 1.4,
            margin: '0 0 20px',
          }}
        >
          How is signpost <span style={{ fontStyle: 'italic', color: '#a78bfa' }}>different</span> from an agency?
        </h1>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Mission inset */}
        <div
          style={{
            background: 'rgba(123,97,255,0.06)',
            borderLeft: '3px solid #7b61ff',
            borderRadius: 0,
            padding: '16px 20px',
            marginTop: 24,
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              color: '#c8cdd8',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Our core mission is to put the control into{' '}
            <span style={{ fontWeight: 600, color: '#f0f2f8' }}>YOUR</span>{' '}
            hands. Pick your preferred interpreters, track the status of all your requests, and give honest feedback.
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: 16,
              color: '#a78bfa',
              lineHeight: 1.7,
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            signpost is <em>your</em> interpreter platform.
          </p>
        </div>

        {/* Second divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginTop: 32 }} />

        {/* Founders */}
        <p
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: '#f0f2f8',
            textAlign: 'center',
            lineHeight: 1.5,
            marginBottom: 16,
            marginTop: 28,
          }}
        >
          signpost started as a &ldquo;what if?&rdquo; chat between two best friends.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, marginBottom: 20, fontFamily: "'Inter', sans-serif" }}>
          <p style={{ fontSize: 15, color: '#96a0b8', lineHeight: 1.65, margin: '0 0 6px' }}>
            <span style={{ color: '#a78bfa', fontWeight: 500 }}>Regina McGinnis</span> is a Deaf mental health professional.
          </p>
          <p style={{ fontSize: 15, color: '#96a0b8', lineHeight: 1.65, margin: '0 0 16px' }}>
            <span style={{ color: '#00e5ff', fontWeight: 500 }}>Molly Sano-Mahgoub</span> is a certified ASL interpreter, with a DeafBlind son.
          </p>
          <p style={{ fontSize: 15, color: '#96a0b8', lineHeight: 1.65, margin: '0 0 12px' }}>
            We have both experienced the challenges of booking interpreters firsthand, and we believe a new model is possible that works better for everyone.
          </p>
          <p style={{ fontSize: 15, color: '#c8cdd8', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
            So we decided to build the platform we have always dreamt of.
          </p>
        </div>

        {/* Buttons */}
        <div className="dhh-landing-buttons" style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/dhh/signup"
            style={{
              flex: 1,
              display: 'block',
              background: '#7b61ff',
              color: '#fff',
              padding: '14px 16px',
              borderRadius: 10,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Create my free account
          </Link>
          <Link
            href="/dhh/login"
            style={{
              flex: 1,
              display: 'block',
              background: 'transparent',
              border: '1px solid rgba(123,97,255,0.3)',
              color: '#a78bfa',
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
          .dhh-landing-card {
            padding: 28px 24px 28px !important;
          }
          .dhh-landing-buttons {
            flex-wrap: wrap !important;
          }
          .dhh-landing-buttons a {
            flex-basis: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
