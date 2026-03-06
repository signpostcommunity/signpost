import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import BetaFeedbackPanel from '@/components/beta/BetaFeedbackPanel';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: '73px' }}>{children}</main>
      <Footer />
      {process.env.NEXT_PUBLIC_BETA_MODE === 'true' && <BetaFeedbackPanel />}
    </>
  );
}
