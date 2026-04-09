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
      <div style={{ maxWidth: 540, width: '100%' }}>

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
            margin: '0 0 24px',
          }}
        >
          How is signpost different from an agency?
        </h1>

        {/* 3. Founders intro */}
        <div style={{ marginBottom: 28 }}>
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
            signpost started with two best friends.{' '}
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>Regina</span> is a Deaf mental health professional.{' '}
            <span style={{ color: '#00e5ff', fontWeight: 600 }}>Molly</span> is a certified ASL interpreter. We have both lived the challenges of booking interpreters firsthand, and we believe a new model is possible that works better for everyone.
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 15,
              color: '#c8cdd8',
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            Instead of an agency controlling who you get, signpost is an interpreter directory that{' '}
            <span style={{ color: '#f0f2f8', fontWeight: 500 }}>centers your preferences and needs</span>{' '}
            at every step.
          </p>
        </div>

        {/* 4. Three feature points */}
        <div style={{ marginBottom: 28 }}>

          {/* Feature 1 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '18px 0',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                borderRadius: 8,
                background: 'rgba(123,97,255,0.1)',
                border: '1px solid rgba(123,97,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#f0f2f8',
                  marginBottom: 4,
                }}
              >
                See interpreters sign before you choose
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: 13,
                  color: '#96a0b8',
                  lineHeight: 1.6,
                }}
              >
                View interpreters' signing skills first in their Intro Videos, then fill your Preferred Interpreter List with people you trust.
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

          {/* Feature 2 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '18px 0',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                borderRadius: 8,
                background: 'rgba(0,229,255,0.08)',
                border: '1px solid rgba(0,229,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#f0f2f8',
                  marginBottom: 4,
                }}
              >
                Track every request in one place
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: 13,
                  color: '#96a0b8',
                  lineHeight: 1.6,
                }}
              >
                See the status of all your interpreter requests. The tracker shows which interpreters have been requested, who has replied, and who has been booked.
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

          {/* Feature 3 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '18px 0',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                minWidth: 36,
                borderRadius: 8,
                background: 'rgba(123,97,255,0.1)',
                border: '1px solid rgba(123,97,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#f0f2f8',
                  marginBottom: 4,
                }}
              >
                Rate honestly
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: 13,
                  color: '#96a0b8',
                  lineHeight: 1.6,
                }}
              >
                Rate interpreters confidentially, so you can be honest without worrying about impacting relationships.
              </div>
            </div>
          </div>
        </div>

        {/* 5. Closing callout */}
        <div
          style={{
            borderLeft: '3px solid #00e5ff',
            borderRadius: '0 8px 8px 0',
            background: 'rgba(0,229,255,0.04)',
            padding: '14px 18px',
            marginBottom: 28,
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 13,
              color: '#96a0b8',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            signpost also gives interpreters full visibility and control over their own rates, terms, and professional identity. And it makes booking interpreters cheaper for requesters by eliminating agency commissions. We hope signpost will help improve interpreter booking for everyone.
          </p>
        </div>

        {/* 6. Signup buttons */}
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
