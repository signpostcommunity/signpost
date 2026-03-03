const CONFIRMED = [
  { id: '1', from: 'Tech Inc', type: 'Technical', date: '2026-03-20', timeStart: '13:00', timeEnd: '15:00', format: 'Remote', location: 'Remote (Teams)' },
  { id: '2', from: 'Greenway School', type: 'Education', date: '2026-03-22', timeStart: '09:00', timeEnd: '12:00', format: 'In-person', location: 'Madrid' },
  { id: '3', from: 'Law & Partners', type: 'Legal', date: '2026-03-25', timeStart: '10:00', timeEnd: '14:00', format: 'In-person', location: 'Madrid Court House' },
];

export default function ConfirmedPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Confirmed Bookings
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', color: 'var(--muted)', fontSize: '0.82rem', cursor: 'pointer' }}>
            Export to calendar ▾
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {CONFIRMED.map((booking) => (
          <div
            key={booking.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Date block */}
            <div
              style={{
                width: 56,
                height: 60,
                background: 'rgba(0,229,255,0.1)',
                border: '1px solid rgba(0,229,255,0.25)',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {new Date(booking.date).toLocaleString('default', { month: 'short' })}
              </div>
              <div style={{ fontFamily: 'var(--font-syne)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                {new Date(booking.date).getDate()}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: '4px' }}>{booking.from}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>{booking.type}</span>
                <span>🕐 {booking.timeStart} – {booking.timeEnd}</span>
                <span>📍 {booking.location}</span>
                <span>💻 {booking.format}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 14px', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
                Message
              </button>
              <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 14px', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
