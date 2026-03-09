export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 40px' }}>

      {/* Hero headline — full width */}
      <h1 style={{
        fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
        fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.25, marginBottom: 32,
      }}>
        signpost grew out of a conversation between two best friends
      </h1>

      {/* Hero: photo left, story text right */}
      <div className="about-hero-grid" style={{
        display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 48,
        alignItems: 'start', marginBottom: 56,
      }}>
        <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', maxHeight: 480 }}>
          <Image
            src="/founders-together.png"
            alt="Regina McGinnis and Molly Sano-Mahgoub, co-founders of signpost"
            width={600}
            height={800}
            className="rounded-xl object-cover"
            style={{ width: '100%', height: '100%', maxHeight: 480, objectFit: 'cover' }}
          />
        </div>
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.75, marginBottom: 16 }}>
            ...a certified interpreter and a Deaf mental health professional, about something they&apos;d both been frustrated by for years.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.75, marginBottom: 16 }}>
            Finding the right interpreter is harder than it should be. Deaf people often have to rely on whoever an agency sends, with little visibility into that person&apos;s signing style, cultural background, or specialization. Too often, the person who matters most has the least say in the decision.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.75, marginBottom: 0 }}>
            We built signpost to change that. A place where interpreters present themselves fully and honestly, and where the Deaf community can make informed choices about who they work with.
          </p>
        </div>
      </div>

      {/* Founder cards */}
      <div style={{ marginBottom: 56 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
        }}>
          <div style={{
            fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)',
            whiteSpace: 'nowrap',
          }}>
            The people behind it
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div className="about-founders-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
        }}>
          {/* Regina — always first */}
          <div style={{
            padding: 28, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ width: 136, height: 136, marginBottom: 16 }}>
              <Image src="/regina-headshot.png" alt="Regina McGinnis" width={400} height={400} className="rounded-full object-cover" style={{ width: 136, height: 136 }} />
            </div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 2 }}>
              Regina McGinnis
            </div>
            <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 14 }}>
              Co-founder
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
              A Deaf mental health professional with 20 years of experience, and mama to two CODAs. Regina brings the perspective
              of someone who has spent decades navigating the interpreter booking process, and who has felt
              the impact of poor fit, limited transparency, and lack of choice. Her experience is at the center
              of how signpost is designed.
            </p>
          </div>

          {/* Molly */}
          <div style={{
            padding: 28, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ width: 136, height: 136, marginBottom: 16 }}>
              <Image src="/molly-headshot.jpg" alt="Molly Sano-Mahgoub" width={400} height={400} className="rounded-full object-cover" style={{ width: 136, height: 136 }} />
            </div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 2 }}>
              Molly Sano-Mahgoub
            </div>
            <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 14 }}>
              Co-founder
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
              A certified ASL interpreter (RID NIC-Master) with 18 years of experience. Molly has seen the
              interpreting process from every angle: as an interpreter, as a coordinator, as the spouse of a
              Deaf person and the mother of a DeafBlind kiddo. She has seen that the current system
              doesn&apos;t serve anyone well enough. With signpost she hopes to help change that.
            </p>
          </div>
        </div>
      </div>

      {/* Value cards */}
      {/* TODO: Revisit these boxes after beta — founders want to make more edits */}
      <div style={{ marginBottom: 56 }}>
        <div style={{
          fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20,
        }}>
          Who signpost serves
        </div>
        <div className="about-values-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { label: 'For the Deaf community', body: 'Build your personal roster of trusted interpreters. Track availability, set approvals, and always know who to call first.' },
            { label: 'For interpreters', body: 'Take control of your career. Set your own rates, showcase your certifications, and connect directly with clients who need your expertise.' },
            { label: 'For organizations', body: 'Find certified interpreters for any context: medical, legal, conference, academic. No agency markups, no slow processes.' },
            { label: 'For everyone', body: 'Transparent credentials. Real profiles. Intro videos. Choose the right person, not just whoever responds the fastest to the agency.' },
          ].map((item) => (
            <div key={item.label} style={{ padding: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--muted)' }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div style={{
        padding: '40px 32px', background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', marginBottom: 56,
      }}>
        <div style={{
          fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14,
        }}>
          Get in touch
        </div>
        <a
          href="mailto:hello@signpost.community"
          style={{
            fontFamily: 'var(--font-syne)', fontSize: '1.3rem', fontWeight: 700,
            color: 'var(--text)', textDecoration: 'none', display: 'inline-block', marginBottom: 10,
          }}
        >
          hello@signpost.community
        </a>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
          Questions, feedback, partnership inquiries? We&apos;d love to hear from you.
        </p>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
          Ready to get started?
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '0.9rem' }}>
          Browse the directory, create a profile, or submit your first request.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/directory" className="btn-primary btn-large" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Browse Interpreter Directory
          </Link>
          <Link href="/request" style={{ display: 'inline-block', padding: '14px 24px', background: 'none', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', textDecoration: 'none', fontSize: '0.95rem' }}>
            Request an Interpreter
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-hero-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .about-hero-grid { grid-template-columns: 1fr !important; }
          .about-founders-grid { grid-template-columns: 1fr !important; }
          .about-values-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
