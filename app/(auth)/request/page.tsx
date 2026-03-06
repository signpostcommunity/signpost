import Link from 'next/link';
import ComingSoonOverlay from '@/components/beta/ComingSoonOverlay';

export default function RequestPortalPage() {
  return (
    <ComingSoonOverlay message="The Requester portal is opening soon. Want to be notified? Email hello@signpost.community">
      <RequestPortalContent />
    </ComingSoonOverlay>
  );
}

function RequestPortalContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 73px)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 580, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '100px', padding: '8px 20px', fontSize: '0.82rem', color: 'var(--accent)', marginBottom: '20px', fontWeight: 500 }}>
            Request Portal
          </div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '12px' }}>
            Find the right interpreter for every job.
          </h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.65, fontSize: '0.95rem' }}>
            Post a request, browse profiles, and connect directly with certified sign language interpreters.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link href="/request/signup" style={{ display: 'block', padding: '28px', background: 'var(--surface)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 'var(--radius)', textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--accent)', marginBottom: '8px' }}>New account</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Create your free account &rarr;</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>For individuals, organizations, and institutions that need sign language interpreters.</div>
          </Link>
          <Link href="/request/login" style={{ display: 'block', padding: '28px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '8px' }}>Existing account</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Sign in to your dashboard &rarr;</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>Manage your requests, messages, and bookings.</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
