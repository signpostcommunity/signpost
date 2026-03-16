export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function DraftSavedPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', background: 'var(--bg)',
    }}>
      <div style={{
        maxWidth: 480, width: '100%', textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          margin: '0 auto 24px', width: 64, height: 64,
          background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
          borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 14l5 5 11-11" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={{
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '2rem',
          letterSpacing: '-0.03em', marginBottom: 12,
        }}>
          Draft saved
        </h1>

        <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 8 }}>
          Your progress has been saved. You can pick up right where you left off.
        </p>

        <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 32 }}>
          To return to your profile, log in at{' '}
          <Link
            href="/interpreter/login"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
          >
            signpost.com/interpreter/login
          </Link>{' '}
          and you'll be taken back to where you stopped.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <Link
            href="/interpreter/login"
            className="btn-primary"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Log in to resume →
          </Link>
          <Link
            href="/"
            style={{ color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none' }}
          >
            Return to home
          </Link>
        </div>
      </div>
    </div>
  )
}
