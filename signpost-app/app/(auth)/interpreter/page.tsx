import Link from 'next/link';

export default function InterpreterPortalPage() {
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
        {/* Badge */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: '100px',
              padding: '8px 20px',
              fontSize: '0.82rem',
              color: 'var(--accent)',
              marginBottom: '20px',
              fontWeight: 500,
            }}
          >
            Interpreter Portal
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
            Your interpreter career, on your terms.
          </h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.95rem' }}>
            Create your profile, set your own rates, and connect directly with clients who need your expertise.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link
            href="/interpreter/signup"
            style={{
              display: 'block',
              padding: '28px 28px',
              background: 'var(--surface)',
              border: '1px solid rgba(0,229,255,0.3)',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              transition: 'border-color 0.2s, transform 0.15s',
            }}
            className="portal-card"
          >
            <div
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: '8px',
              }}
            >
              New interpreter
            </div>
            <div
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '6px',
              }}
            >
              Create your free profile →
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Set up your profile in minutes. Add your certifications, languages, rates, and availability.
            </div>
          </Link>

          <Link
            href="/interpreter/login"
            style={{
              display: 'block',
              padding: '28px 28px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}
            className="portal-card"
          >
            <div
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: '8px',
              }}
            >
              Existing account
            </div>
            <div
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '6px',
              }}
            >
              Sign in to your dashboard →
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Access your booking requests, inbox, rates, and profile settings.
            </div>
          </Link>
        </div>
      </div>

      <style>{`
        .portal-card:hover { border-color: rgba(0,229,255,0.5) !important; transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
