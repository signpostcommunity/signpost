import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import BetaFeedbackPanel from '@/components/beta/BetaFeedbackPanel';
import AslGuidePanel from '@/components/ui/AslGuidePanel';
import { createClient } from '@/lib/supabase/server';

const BETA_UI_ENABLED = false;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <>
      <div id="site-content" className="site-content">
        <Nav initialSession={session} />
        <main id="main-content" style={{ paddingTop: '73px' }}>{children}</main>
        <Footer />
      </div>
      {/* Beta UI hidden — re-enable when Deaf/DB/HH beta launches */}
      {BETA_UI_ENABLED && process.env.NEXT_PUBLIC_BETA_MODE === 'true' && <BetaFeedbackPanel />}
      <AslGuidePanel />
    </>
  );
}
