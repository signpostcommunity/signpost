export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 40px' }}>
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '100px', padding: '8px 20px', fontSize: '0.82rem', color: 'var(--accent)', marginBottom: '20px', fontWeight: 500 }}>
          About signpost
        </div>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '20px' }}>
          Built with care, for the Deaf community.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '16px' }}>
          signpost was created to fix a broken system. Finding a qualified sign language interpreter shouldn't mean navigating slow agencies, hidden fees, and intermediaries who don't understand the nuances of Deaf culture and communication.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.75 }}>
          We built a direct marketplace where Deaf and Hard-of-Hearing individuals, organizations, and anyone who needs an interpreter can connect straight with certified professionals — transparently, quickly, and fairly.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '60px' }}>
        {[
          { label: 'For the Deaf community', body: 'Build your personal roster of trusted interpreters. Track availability, set approvals, and always know who to call first.' },
          { label: 'For interpreters', body: 'Take control of your career. Set your own rates, showcase your certifications, and connect directly with clients who need your expertise.' },
          { label: 'For organizations', body: 'Find certified interpreters for any context — medical, legal, conference, academic. No agency markups, no slow processes.' },
          { label: 'For everyone', body: 'Transparent credentials. Real profiles. Intro videos. Choose the right person, not just whoever\'s available through an agency.' },
        ].map((item) => (
          <div key={item.label} style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '10px' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--muted)' }}>{item.body}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '12px' }}>
          Ready to get started?
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Browse the directory, create a profile, or submit your first request.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/directory" className="btn-primary btn-large" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Browse Directory
          </Link>
          <Link href="/interpreter" style={{ display: 'inline-block', padding: '14px 24px', background: 'none', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', textDecoration: 'none', fontSize: '0.95rem' }}>
            Interpreter Portal
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
