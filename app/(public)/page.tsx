export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
const features = [
  {
    label: 'Discover interpreters who are the right fit',
    body: 'Browse the directory and find interpreters based on real skills you can see. Watch videos of interpreters introducing themselves, read their bios, and learn about their specialized skills. Discover talented interpreters who are the right fit for you.',
  },
  {
    label: 'Deaf-centered booking',
    body: 'Deaf and Hard of Hearing users build a preferred interpreter list and easily share it with anyone who books on their behalf. Finding the right interpreter is easy when you start with a strong foundation.',
  },
  {
    label: 'Skip the agency markup',
    body: 'Agencies add <em>hourly</em> fees on top of what the interpreter charges. signpost doesn\'t. Interpreters set their own rates and clients pay them directly. signpost\'s only fee is a flat $15 for each interpreter confirmed on a booking.',
  },
  {
    label: 'Track your request at every step',
    body: 'Know where your request stands at all times. See when it\'s been sent, which interpreters have responded, and when a booking is confirmed. No more wondering if the message got through or if anyone is working on it.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section
        style={{
          padding: '100px 80px 120px',
          maxWidth: 1400,
          margin: '0 auto',
          position: 'relative',
        }}
        className="hero-section"
      >
        <div className="hero-split">
          {/* Logo column */}
          <div className="hero-logo-col">
            <div className="hero-logo-wrap">
              <Image
                src="https://udyddevceuulwkqpxkxp.supabase.co/storage/v1/object/public/avatars/signpostlogo.png"
                alt="signpost logo with hand and wordmark"
                width={480}
                height={480}
                className="hero-logo-img"
                style={{
                  width: '100%',
                  maxWidth: 480,
                  height: 'auto',
                  filter: 'drop-shadow(0 0 40px rgba(0,229,255,0.2))',
                  position: 'relative',
                  zIndex: 1,
                }}
                priority
              />
            </div>
          </div>

          {/* Content column */}
          <div className="hero-content">
            <h1
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: 'clamp(2.5rem, 4.8vw, 4.2rem)',
                fontWeight: 800,
                lineHeight: 1.0,
                letterSpacing: '-0.04em',
                marginBottom: 28,
              }}
            >
              We are<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                the un-agency.
              </span>
            </h1>

            <div style={{ marginBottom: 32 }}>
              <p style={{ color: '#f0f2f8', fontSize: '1.05rem', fontWeight: 500, marginBottom: 6, lineHeight: 1.6 }}>
                Finding the right interpreter shouldn&apos;t be out of your hands.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', fontWeight: 400, marginBottom: 6, lineHeight: 1.6 }}>
                View profiles, watch video intros, book directly, and track your request at every step.
              </p>
              <p style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.6 }}>
                Full transparency, no agency markup.
              </p>
            </div>

            {/* Primary CTA */}
            <Link
              href="/request"
              className="hero-cta-btn"
              style={{ textDecoration: 'none' }}
            >
              Request an interpreter <span className="hero-cta-arrow">&rarr;</span>
            </Link>

            {/* Account creation pills */}
            <div className="hero-account-section">
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: 10, display: 'block' }}>
                Create an account:
              </span>
              <div className="hero-pills">
                <Link href="/dhh/signup" className="hero-pill hero-pill-deaf" style={{ textDecoration: 'none' }}>
                  Deaf / DB / HH <span>&rarr;</span>
                </Link>
                <Link href="/interpreter/signup" className="hero-pill" style={{ textDecoration: 'none' }}>
                  Interpreter <span>&rarr;</span>
                </Link>
                <Link href="/request/signup" className="hero-pill" style={{ textDecoration: 'none' }}>
                  Requester <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <div style={{ background: '#111118', borderTop: '1px solid #1e2433' }}>
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '64px 40px',
        }}
        className="feature-highlights-section"
      >
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: 100,
              padding: '8px 20px',
              fontSize: '0.9rem',
              color: 'var(--accent)',
              marginBottom: 20,
              fontWeight: 500,
            }}
          >
            How it works
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(1.2rem, 2vw, 1.7rem)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
            }}
          >
            A direct line between you and your interpreter.
          </h2>
        </div>

        <div className="features-grid">
          {features.map((f) => (
            <div
              key={f.label}
              style={{
                padding: '28px 24px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                  marginBottom: 10,
                }}
              >
                {f.label}
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--muted)' }} dangerouslySetInnerHTML={{ __html: f.body }} />
            </div>
          ))}
        </div>
      </section>
      </div>

      <style>{`
        .hero-split {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .hero-logo-col {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-logo-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-logo-wrap::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .hero-content {
          display: flex;
          flex-direction: column;
        }
        .hero-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--accent);
          color: #0a0a0f;
          font-family: var(--font-dm), 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          padding: 18px 36px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          width: 100%;
          max-width: 420px;
          text-align: center;
          transition: all 0.2s;
        }
        .hero-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,229,255,0.35);
        }
        .hero-cta-arrow {
          display: inline-block;
          transition: transform 0.2s;
        }
        .hero-cta-btn:hover .hero-cta-arrow {
          transform: translateX(4px);
        }
        .hero-account-section {
          margin-top: 28px;
          max-width: 420px;
        }
        .hero-pills {
          display: flex;
          gap: 8px;
        }
        .hero-pill {
          flex: 1;
          min-width: 130px;
          white-space: nowrap;
          background: var(--card-bg);
          border: 1px solid var(--border);
          font-family: var(--font-dm), 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 0.82rem;
          padding: 12px 14px;
          border-radius: 10px;
          text-align: center;
          color: var(--text);
          transition: all 0.2s;
          cursor: pointer;
        }
        .hero-pill:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(0,229,255,0.06);
          transform: translateY(-1px);
        }
        .hero-pill-deaf:hover {
          border-color: var(--accent2) !important;
          color: var(--accent2) !important;
          background: rgba(167,139,250,0.06) !important;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) {
          .hero-section { padding: 60px 24px 80px !important; }
          .hero-split { grid-template-columns: 1fr !important; text-align: center; gap: 40px !important; }
          .hero-logo-col { order: -1; }
          .hero-logo-img { max-width: 280px !important; }
          .hero-logo-wrap::before { width: 400px; height: 400px; }
          .hero-content { align-items: center; }
          .hero-cta-btn { max-width: 100% !important; }
          .hero-account-section { max-width: 100%; margin-left: auto; margin-right: auto; }
          .hero-pills { justify-content: center; }
        }
        @media (max-width: 480px) {
          .hero-section { padding: 40px 16px 60px !important; }
          .hero-logo-img { max-width: 200px !important; }
          .hero-pills { flex-direction: column; }
          .hero-pill { min-width: auto; }
          .feature-highlights-section { padding: 0 16px 60px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}