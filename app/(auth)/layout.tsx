import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div id="site-content" className="site-content" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav initialSession={session} />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  );
}
