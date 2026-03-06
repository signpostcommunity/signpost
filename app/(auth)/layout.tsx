import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import BetaFeedbackPanel from '@/components/beta/BetaFeedbackPanel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-content-wrapper" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav />
      {children}
      <Footer />
      {process.env.NEXT_PUBLIC_BETA_MODE === 'true' && <BetaFeedbackPanel />}
    </div>
  );
}
