import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'var(--bg)',
      }}
    >
      <div className="wordmark" style={{ fontSize: '1.1rem' }}>
        sign<span>post</span>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/directory" className="footer-link">Browse Interpreter Directory</Link>
        <Link href="/interpreter" className="footer-link">Interpreter Portal</Link>
        <Link href="/request" className="footer-link">Request Interpreters</Link>
        <Link href="/about" className="footer-link">About Us</Link>
        <a href="mailto:hello@signpost.community" className="footer-link">hello@signpost.community</a>
        <Link href="/privacy" className="footer-link">Privacy Policy</Link>
        <Link href="/policies" className="footer-link">Terms &amp; Policies</Link>
      </div>

      <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
        © 2026 signpost. Built with care by and for the Deaf community.
      </div>

      <style>{`
        .footer-link {
          color: var(--muted);
          font-size: 0.82rem;
          text-decoration: none;
          padding: 6px 10px;
          border-radius: 6px;
          transition: color 0.15s;
        }
        .footer-link:hover { color: var(--text); }
      `}</style>
    </footer>
  );
}
