import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import BetaFeedbackPanel from '@/components/beta/BetaFeedbackPanel';
import { createClient } from '@/lib/supabase/server';

const BETA_UI_ENABLED = false;

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <>
      <div id="site-content" className="site-content" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Nav initialSession={session} />
        <main id="main-content">{children}</main>
        <Footer />
      </div>
      {/* Beta UI hidden — re-enable when Deaf/DB/HH beta launches */}
      {BETA_UI_ENABLED && process.env.NEXT_PUBLIC_BETA_MODE === 'true' && <BetaFeedbackPanel />}
    </>
  );
}
