'use client'

export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function RequestPortalPage() {
  return (
    <div
      className="req-landing-wrap"
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '40px 48px 80px',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      {/* Back link */}
      <div style={{ marginBottom: '28px' }}>
        <Link
          href="/"
          style={{
            fontSize: '0.85rem',
            color: 'var(--muted)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← Back to Home
        </Link>
      </div>

      {/* For Requesters pill badge */}
      <div style={{ marginBottom: '20px' }}>
        <span
          style={{
            display: 'inline-flex',
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.2)',
            borderRadius: '100px',
            padding: '8px 20px',
            fontSize: '0.82rem',
            color: 'var(--accent)',
            fontWeight: 500,
          }}
        >
          For Requesters
        </span>
      </div>

      {/* Hero headline */}
      <div style={{ marginBottom: '16px' }}>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '27px',
            fontWeight: 800,
            color: '#f0f2f8',
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Find the right interpreter,{' '}
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            every time.
          </span>
        </h1>
      </div>

      {/* Subheadline */}
      <p
        style={{
          fontWeight: 400,
          fontSize: '15px',
          color: '#96a0b8',
          lineHeight: 1.6,
          marginBottom: '40px',
        }}
      >
        Book directly with qualified interpreters. No agency markup.
        <br />
        Full transparency on rates, credentials, and availability.
      </p>

      {/* Two-column cards */}
      <div
        className="req-landing-cards"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '16px',
          width: '100%',
          maxWidth: 860,
        }}
      >
        {/* New to signpost */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          {/* Icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: 'rgba(0,229,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '20px',
              fontWeight: 700,
              color: '#f0f2f8',
              marginBottom: '16px',
            }}
          >
            New to signpost?
          </h2>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Browse interpreter profiles', 'Send booking requests directly', 'No agency markup or hidden fees'].map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 400, fontSize: '14px', color: '#c8cdd8' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '14px' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/request/signup"
            style={{
              display: 'block',
              width: '100%',
              background: 'var(--accent)',
              color: '#000',
              borderRadius: '8px',
              padding: '13px 0',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              marginTop: 'auto',
            }}
          >
            Create my first request →
          </Link>
        </div>

        {/* Been here before */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(157,135,255,0.4)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          {/* Icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: 'rgba(157,135,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>

          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '20px',
              fontWeight: 700,
              color: '#f0f2f8',
              marginBottom: '16px',
            }}
          >
            Been here before?
          </h2>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Manage your active requests', 'Review interpreter responses', 'Track bookings and invoices'].map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 400, fontSize: '14px', color: '#c8cdd8' }}>
                <span style={{ color: 'var(--accent2)', fontWeight: 700, fontSize: '14px' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/request/login"
            style={{
              display: 'block',
              width: '100%',
              background: 'var(--accent2)',
              color: '#000',
              borderRadius: '8px',
              padding: '13px 0',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              marginTop: 'auto',
            }}
          >
            Sign in to my portal →
          </Link>
        </div>
      </div>

      {/* Mobile styles */}
      <style>{`
        @media (max-width: 640px) {
          .req-landing-wrap {
            padding: 24px 20px 60px !important;
          }
          .req-landing-wrap h1 {
            font-size: 1.5rem !important;
          }
          .req-landing-cards {
            grid-template-columns: 1fr !important;
            min-width: 0 !important;
          }
          .req-landing-cards > div {
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
