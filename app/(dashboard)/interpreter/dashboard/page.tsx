import Link from 'next/link';

const STATS = [
  { label: 'Active inquiries', value: '3', color: 'var(--accent)' },
  { label: 'Confirmed bookings', value: '7', color: '#34d399' },
  { label: 'Unread messages', value: '1', color: 'var(--accent2)' },
  { label: 'Profile views (30d)', value: '142', color: 'var(--muted)' },
];

const RECENT_INQUIRIES = [
  { id: '1', from: 'Acme Corp', type: 'Medical', date: '2026-03-10', format: 'In-person', status: 'pending' },
  { id: '2', from: 'City Hospital', type: 'Conference', date: '2026-03-15', format: 'Remote', status: 'pending' },
  { id: '3', from: 'Sarah Johnson', type: 'Legal', date: '2026-03-18', format: 'In-person', status: 'pending' },
];

export default function InterpreterDashboardPage() {
  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-syne)',
          fontSize: '1.6rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: '6px',
        }}
      >
        Dashboard
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '32px', fontSize: '0.9rem' }}>
        Welcome back, Sofia.
      </p>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '32px',
        }}
        className="stats-grid"
      >
        {STATS.map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px 20px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: s.color,
                marginBottom: '4px',
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Inquiries */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.9rem' }}>
            Pending Inquiries
          </h2>
          <Link
            href="/interpreter/dashboard/inquiries"
            style={{ color: 'var(--accent)', fontSize: '0.82rem', textDecoration: 'none' }}
          >
            View all →
          </Link>
        </div>

        <div>
          {RECENT_INQUIRIES.map((inquiry) => (
            <div
              key={inquiry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>
                  {inquiry.from}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {inquiry.type} · {inquiry.format} · {inquiry.date}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.3)',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    color: '#34d399',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  Accept
                </button>
                <button
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    color: 'var(--muted)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
