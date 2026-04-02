export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
const features = [
  {
    label: 'Your choice, always',
    body: 'Watch interpreters introduce themselves or see a sample of their work. Check specializations, read profiles, and choose the person who is genuinely the right fit.',
  },
  {
    label: 'Global reach, local knowledge',
    body: 'ASL, BSL, International Sign, Auslan, LSF, DGS and dozens more. Find interpreters who know your language, your region, and your community, wherever you are.',
  },
  {
    label: 'Transparent credentials & rates',
    body: "Every rate is set by the interpreter, so you always know what you're agreeing to. Certifications are listed directly, with verified badges for documented credentials.",
  },
  {
    label: 'Direct booking, no middlemen',
    body: 'Communicate and confirm one-to-one with your interpreter. Legal, medical, technical, academic, conference. Find the specialist your situation actually demands.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section
        style={{
          padding: '60px 64px 52px',
          maxWidth: 1200,
          margin: '0 auto',
          position: 'relative',
        }}
        className="hero-section"
      >
        <div className="hero-split">
          {/* Image column */}
          <div className="hero-logo-col">
            <Image
              src="/Logotransparent.png"
              alt="signpost"
              width={370}
              height={370}
              className="hero-logo-img"
              style={{ width: '100%', maxWidth: 370, height: 'auto' }}
              priority
            />
          </div>

          {/* Copy column */}
          <div className="hero-copy-col">
            <h1
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: 'clamp(1.6rem, 3vw, 2.6rem)',
                fontWeight: 775,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                marginBottom: 30,
              }}
            >
              We are<br />
              <em
                style={{
                  fontStyle: 'normal',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                the un-agency.
              </em>
            </h1>

            <div
              style={{
                maxWidth: 520,
                lineHeight: 1.85,
                marginBottom: 34,
                marginLeft: 18,
              }}
            >
              <span style={{ display: 'block', color: '#f0f2f8', fontSize: 16, fontWeight: 500 }}>
                Finding the right interpreter shouldn&apos;t be out of your hands.
              </span>
              <span style={{ display: 'block', color: '#b0b6c8', fontSize: 15, fontWeight: 400 }}>
                View profiles, watch video intros, book directly, and track your request at every step.
              </span>
              <span style={{ display: 'block', color: '#00e5ff', fontSize: 15, fontWeight: 600 }}>
                Full transparency, no agency markup.
              </span>
            </div>

            <div className="hero-ctas">
              <Link
                href="/request"
                className="btn-primary btn-large"
                style={{ width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none' }}
              >
                Need an interpreter?<br />Submit a request →
              </Link>

              <div className="hero-secondary-ctas">
                <Link
                  href="/dhh"
                  className="btn-large hero-deaf-btn"
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    display: 'block',
                    background: 'none',
                    border: '1.5px solid rgba(157,135,255,0.35)',
                    textDecoration: 'none',
                    padding: '12px 16px',
                  }}
                >
                  <span style={{ display: 'block', color: '#f0f2f8', fontSize: 15, fontWeight: 600 }}>Deaf, DeafBlind, or Hard of Hearing?</span>
                  <span style={{ display: 'block', color: 'var(--accent2)', fontSize: 13, fontWeight: 400 }}>Create your free account →</span>
                </Link>

                <Link
                  href="/interpreter"
                  className="btn-large hero-interp-btn"
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    display: 'block',
                    background: 'none',
                    border: '1.5px solid rgba(0,229,255,0.35)',
                    textDecoration: 'none',
                    padding: '12px 16px',
                  }}
                >
                  <span style={{ display: 'block', color: '#f0f2f8', fontSize: 15, fontWeight: 600 }}>For interpreters</span>
                  <span style={{ display: 'block', color: 'var(--accent)', fontSize: 13, fontWeight: 400 }}>Create your free account →</span>
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
              <div style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--muted)' }}>
                {f.body}
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>

      <style>{`
        .hero-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: center;
        }
        .hero-logo-col {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-ctas {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 360px;
        }
        .hero-secondary-ctas {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .hero-deaf-btn:hover {
          border-color: rgba(157,135,255,0.7) !important;
          color: #c4b5ff !important;
        }
        .hero-interp-btn:hover {
          border-color: rgba(0,229,255,0.7) !important;
          color: #a8f0ff !important;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width: 760px) {
          .hero-split { grid-template-columns: 1fr; text-align: center; }
          .hero-logo-col { order: -1; }
          .hero-logo-img { max-width: 260px !important; }
          .hero-ctas { justify-content: center; max-width: 100%; }
        }
        @media (max-width: 480px) {
          .hero-section { padding: 40px 16px !important; }
          .hero-logo-img { max-width: 200px !important; margin: 0 auto; display: block; }
          .hero-ctas { flex-direction: column; align-items: center; }
          .hero-ctas a { max-width: 100%; }
          .feature-highlights-section { padding: 0 16px 60px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 390px) {
          .hero-section { padding: 32px 16px !important; }
          .hero-logo-img { max-width: 170px !important; }
        }
      `}</style>
    </div>
  );
}