import Link from 'next/link';
import Image from 'next/image';

const features = [
  {
    label: 'Your choice, always',
    body: 'Watch interpreters introduce themselves or see a sample of their work. Check specializations, read profiles, and choose the person who is genuinely the right fit.',
  },
  {
    label: 'Global reach, local knowledge',
    body: 'ASL, BSL, International Sign, Auslan, LSF, DGS and dozens more. Find interpreters who know your language, your region, and your community — wherever you are.',
  },
  {
    label: 'Transparent credentials & rates',
    body: "Every rate is set by the interpreter — you always know what you're agreeing to. Certifications are listed directly, with verified badges for documented credentials.",
  },
  {
    label: 'Direct booking, no middlemen',
    body: 'Communicate and confirm one-to-one with your interpreter. Legal, medical, technical, academic, conference — find the specialist your situation actually demands.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section
        style={{
          padding: '100px 64px 48px',
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
              src="/hero.jpg"
              alt="signpost"
              width={640}
              height={640}
              className="hero-logo-img"
              style={{ width: '100%', maxWidth: 640, height: 'auto', borderRadius: 12 }}
              priority
            />
          </div>

          {/* Copy column */}
          <div className="hero-copy-col">
            <h1
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: 'clamp(1.6rem, 3vw, 2.6rem)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                marginBottom: 20,
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

            <p
              style={{
                fontSize: '1rem',
                color: 'var(--muted)',
                maxWidth: 520,
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              No need to pay high agency fees, or wait through slow response times.
              Connect with and book sign language interpreters{' '}
              <strong style={{ color: 'var(--text)' }}>directly.</strong>
              <br />
              Browse real profiles, watch intro videos, and choose the right interpreter
              for your job.
            </p>

            <div className="hero-ctas">
              <Link
                href="/request"
                className="btn-primary btn-large"
                style={{ width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none' }}
              >
                Need an interpreter?<br />Submit a request →
              </Link>

              <Link
                href="/dhh"
                className="btn-large hero-deaf-btn"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  display: 'block',
                  background: 'none',
                  border: '1.5px solid rgba(157,135,255,0.35)',
                  color: 'var(--accent2)',
                  textDecoration: 'none',
                }}
              >
                Deaf or Hard of Hearing?<br />Build your preferred interpreter list →
              </Link>

              <Link
                href="/interpreter"
                className="btn-large hero-interp-btn"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  display: 'block',
                  background: 'none',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text)',
                  textDecoration: 'none',
                }}
              >
                Are you an interpreter?<br />Create your free profile →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 40px 100px',
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
              fontWeight: 800,
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
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
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

      <style>{`
        .hero-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }
        .hero-logo-col {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          max-width: 360px;
        }
        .hero-deaf-btn:hover {
          border-color: rgba(157,135,255,0.7) !important;
          color: #c4b5ff !important;
        }
        .hero-interp-btn:hover {
          border-color: rgba(0,229,255,0.4) !important;
          color: var(--accent) !important;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (max-width: 760px) {
          .hero-split { grid-template-columns: 1fr; text-align: center; }
          .hero-logo-col { order: -1; }
          .hero-logo-img { max-width: 340px !important; }
          .hero-ctas { justify-content: center; max-width: 100%; }
        }
        @media (max-width: 480px) {
          .hero-section { padding: 60px 24px !important; }
          .hero-logo-img { max-width: 260px !important; margin: 0 auto; display: block; }
          .hero-ctas { flex-direction: column; align-items: center; }
          .hero-ctas a { max-width: 320px; }
          .feature-highlights-section { padding: 0 16px 60px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
