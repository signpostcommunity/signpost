import Link from 'next/link';
import BetaFeedbackPanel from '@/components/beta/BetaFeedbackPanel';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-content-wrapper" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Dashboard top bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 57,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: 'rgba(7,9,16,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="wordmark" style={{ fontSize: '1.2rem' }}>
            sign<span>post</span>
          </div>
        </Link>
      </header>
      {children}
      {process.env.NEXT_PUBLIC_BETA_MODE === 'true' && <BetaFeedbackPanel />}
    </div>
  );
}
