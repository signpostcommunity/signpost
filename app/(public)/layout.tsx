import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main style={{ paddingTop: '73px' }}>{children}</main>
      <Footer />
    </>
  );
}
