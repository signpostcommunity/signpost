export default function TeamPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '24px' }}>Team</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '32px', fontSize: '0.9rem', lineHeight: 1.65 }}>
        Build a team of interpreters you work with regularly. When a client requests multiple interpreters, you can recommend your team members.
      </p>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>👥</div>
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: '8px' }}>No team members yet</div>
        <div style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Add other interpreters you collaborate with on multi-interpreter jobs.
        </div>
        <button className="btn-primary" style={{ padding: '10px 24px' }}>+ Invite a Team Member</button>
      </div>
    </div>
  );
}
