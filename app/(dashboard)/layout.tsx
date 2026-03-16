import Link from 'next/link';
import BetaFeedbackPanel from '@/components/beta/BetaFeedbackPanel';
import DashboardHeaderNav from '@/components/layout/DashboardHeaderNav';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Query user_profiles for reliable role (user_metadata may not be set)
  let role = user?.user_metadata?.role || 'interpreter';
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role) role = profile.role;
  }
  const portalPath = role === 'deaf' ? '/dhh/dashboard' : role === 'requester' || role === 'org' ? '/request/dashboard' : '/interpreter/dashboard';

  return (
    <>
      <div id="site-content" className="site-content" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Dashboard top bar — hidden on mobile where sidebar mobile bar takes over */}
        <header
          className="dash-top-bar"
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
          <DashboardHeaderNav portalPath={portalPath} />
        </header>
        <main id="main-content">{children}</main>
        <Footer />
      </div>
      {process.env.NEXT_PUBLIC_BETA_MODE === 'true' && <BetaFeedbackPanel />}
    </>
  );
}
