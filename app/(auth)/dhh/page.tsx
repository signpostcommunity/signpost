export const dynamic = 'force-dynamic';

import Link from 'next/link';
import ComingSoonOverlay from '@/components/beta/ComingSoonOverlay';

export default function DeafPortalPage() {
  return (
    <ComingSoonOverlay message="The Deaf/DB/HH portal is coming soon. We're building out our interpreter roster first. Stay tuned!">
      <DeafPortalContent />
    </ComingSoonOverlay>
  );
}

function DeafPortalContent() {
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
      <div style={{ maxWidth: 580, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(157,135,255,0.08)',
              border: '1px solid rgba(157,135,255,0.25)',
              borderRadius: '100px',
              padding: '8px 20px',
              fontSize: '0.82rem',
              color: 'var(--accent2)',
              marginBottom: '20px',
              fontWeight: 500,
            }}
          >
            D/DB/HH Portal
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              marginBottom: '12px',
            }}
          >
            Your preferred interpreter list, always ready.
          </h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.95rem' }}>
            Build and manage your curated list of trusted sign language interpreters.
            Know who&apos;s available, who you prefer, and who to call first.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link
            href="/dhh/signup"
            style={{
              display: 'block',
              padding: '28px',
              background: 'var(--surface)',
              border: '1px solid rgba(157,135,255,0.35)',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--accent2)',
                marginBottom: '8px',
              }}
            >
              New account
            </div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Create your free account &rarr;
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Build your preferred interpreter list, manage approvals, and track your bookings.
            </div>
          </Link>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link href="/dhh/login" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: '40px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {[
            { title: 'Your roster', body: 'Tier your preferred interpreters — Top, Preferred, and Backup.' },
            { title: 'Availability at a glance', body: "See who's available before you request." },
            { title: 'Per-interpreter approvals', body: 'Control which interpreters can accept work or personal bookings.' },
            { title: 'Direct messaging', body: 'Communicate directly with interpreters on your list.' },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                padding: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent2)', marginBottom: '4px' }}>
                {f.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
