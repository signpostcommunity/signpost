import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div id="site-content" className="site-content">
      <Nav initialSession={session} />
      <main id="main-content" style={{ paddingTop: '73px' }}>{children}</main>
      <Footer />
    </div>
  );
}
