import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import BetaFeedbackPanel from '@/components/beta/BetaFeedbackPanel';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-content-wrapper">
      <Nav />
      <main style={{ paddingTop: '73px' }}>{children}</main>
      <Footer />
      {process.env.NEXT_PUBLIC_BETA_MODE === 'true' && <BetaFeedbackPanel />}
    </div>
  );
}
