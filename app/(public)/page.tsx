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
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
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
                  whiteSpace: 'nowrap',
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

            {/* Role cards */}
            <div className="roles-cards">
              <div className="roles-cards-label">New here? Create an account:</div>
              <div className="role-cards-grid">
                <Link href="/dhh/signup" className="role-card role-card-deaf" style={{ textDecoration: 'none' }}>
                  <svg className="role-card-icon" viewBox="0 3 26 17" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="13" cy="7" r="2.5"/>
                    <path d="M13 10.5 C 11 10.5, 9.5 12, 9.5 18 L 16.5 18 C 16.5 12, 15 10.5, 13 10.5 Z"/>
                    <path d="M4.5 16 Q 3 14, 4.5 12" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5"/>
                    <path d="M7.5 16 Q 6 14, 7.5 12" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5"/>
                    <path d="M18.5 16 Q 20 14, 18.5 12" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5"/>
                    <path d="M21.5 16 Q 23 14, 21.5 12" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5"/>
                  </svg>
                  <div className="role-card-name">Deaf / DB / HH</div>
                </Link>
                <Link href="/interpreter/signup" className="role-card role-card-interpreter" style={{ textDecoration: 'none' }}>
                  <svg className="role-card-icon" viewBox="0 3 32 17" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="4" cy="7" r="2.5"/>
                    <path d="M4 10.5 C 2 10.5, 0.5 12, 0.5 18 L 7.5 18 C 7.5 12, 6 10.5, 4 10.5 Z"/>
                    <circle cx="16" cy="7" r="2.5"/>
                    <path d="M16 10.5 C 14 10.5, 12.5 12, 12.5 18 L 19.5 18 C 19.5 12, 18 10.5, 16 10.5 Z"/>
                    <circle cx="28" cy="7" r="2.5"/>
                    <path d="M28 10.5 C 26 10.5, 24.5 12, 24.5 18 L 31.5 18 C 31.5 12, 30 10.5, 28 10.5 Z"/>
                    <line x1="8" y1="11.5" x2="12" y2="11.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
                    <line x1="20" y1="11.5" x2="24" y2="11.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
                  </svg>
                  <div className="role-card-name">Interpreter</div>
                </Link>
                <Link href="/request/signup" className="role-card role-card-requester" style={{ textDecoration: 'none' }}>
                  <svg className="role-card-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="6" width="24" height="22" rx="2.5"/>
                    <path d="M21 3v6M11 3v6M4 13h24"/>
                    <path d="M11 21l3 3 6-6"/>
                  </svg>
                  <div className="role-card-name">Requester</div>
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
        .roles-cards {
          margin-top: 28px;
          max-width: 540px;
        }
        .roles-cards-label {
          color: var(--muted);
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 14px;
          letter-spacing: 0.01em;
        }
        .role-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .role-card {
          background: #16161f;
          border: 1px solid #2a3044;
          border-radius: 12px;
          padding: 18px 14px 16px;
          cursor: pointer;
          color: var(--text);
          transition: all 0.18s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          position: relative;
          overflow: hidden;
          text-align: center;
          min-height: 96px;
        }
        .role-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-color);
          opacity: 0.7;
          transition: opacity 0.2s, height 0.2s;
        }
        .role-card-deaf { --accent-color: #a78bfa; }
        .role-card-interpreter { --accent-color: #00e5ff; }
        .role-card-requester { --accent-color: #00e5ff; }
        .role-card:hover {
          background: #1a1a25;
          border-color: var(--accent-color);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .role-card:hover::before {
          height: 3px;
          opacity: 1;
        }
        .role-card-icon {
          height: 36px;
          width: auto;
          color: var(--accent-color);
          flex-shrink: 0;
        }
        .role-card-name {
          font-family: var(--font-syne), 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.92rem;
          color: var(--text);
          letter-spacing: -0.01em;
          line-height: 1.2;
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
          .roles-cards { max-width: 100%; margin-left: auto; margin-right: auto; }
        }
        @media (max-width: 480px) {
          .hero-section { padding: 40px 16px 60px !important; }
          .hero-logo-img { max-width: 200px !important; }
          .role-cards-grid { grid-template-columns: 1fr; }
          .feature-highlights-section { padding: 0 16px 60px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}