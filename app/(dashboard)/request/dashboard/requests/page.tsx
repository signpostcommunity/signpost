import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AllRequestsPage() {
  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.6rem', margin: '0 0 6px' }}>
          All Requests
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
          View and manage all your interpreter requests.
        </p>
      </div>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '48px 32px', textAlign: 'center',
      }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.92rem', marginBottom: 20 }}>
          Coming in the next update.
        </p>
        <Link
          href="/directory?context=requester"
          className="btn-primary"
          style={{ display: 'inline-block', padding: '12px 24px', fontSize: '0.88rem', textDecoration: 'none' }}
        >
          Browse Interpreter Directory
        </Link>
      </div>
      <style>{`@media (max-width: 768px) { .dash-page-content { padding: 24px 20px !important; } }`}</style>
    </div>
  )
}
