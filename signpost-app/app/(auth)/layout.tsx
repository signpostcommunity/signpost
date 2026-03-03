import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="wordmark" style={{ fontSize: '1.3rem' }}>
            sign<span>post</span>
          </div>
        </Link>
      </div>
      {children}
    </div>
  );
}
