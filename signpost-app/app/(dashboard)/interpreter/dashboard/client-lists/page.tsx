export default function ClientListsPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '24px' }}>Client Lists</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '32px', fontSize: '0.9rem', lineHeight: 1.65 }}>
        Manage approved client relationships. You can create exclusive rate profiles visible only to specific clients on your list.
      </p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.9rem' }}>Preferred Clients</span>
          <button className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.8rem' }}>+ Add Client</button>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          No preferred clients yet. Add clients to offer them custom rates.
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.9rem' }}>Blocked Clients</span>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          No blocked clients.
        </div>
      </div>
    </div>
  );
}
