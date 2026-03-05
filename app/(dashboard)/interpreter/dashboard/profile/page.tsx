'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { PageHeader, GhostButton } from '@/components/dashboard/interpreter/shared'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ color: 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: 16 }}>
      {children}
    </div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <div style={{ padding: '48px 56px', maxWidth: 720 }}>
      <PageHeader
        title="My Profile"
        subtitle="This is what requesters see when they view your listing. Keep it current — your profile is your first impression."
      />

      {/* Profile summary card */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#7b61ff,#00e5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#fff',
          }}>SR</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.15rem' }}>Sofia Reyes</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: 'var(--accent)', borderRadius: 6, padding: '2px 8px' }}>✓ Verified</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>RID, EFSLI</span>
            </div>
          </div>
          <Link href="/interpreter/signup">
            <GhostButton>Edit Profile</GhostButton>
          </Link>
        </div>
        <InfoRow label="Location" value="Seattle, WA" />
        <InfoRow label="Sign Languages" value="ASL, LSF" />
        <InfoRow label="Specializations" value="Medical, Legal, Conference, Mental Health" />
        <InfoRow label="Mode" value="On-site + Remote" />
        <InfoRow label="Service Area" value="Pacific Northwest · National (remote)" />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '0.88rem' }}>
          <span style={{ color: 'var(--muted)' }}>Profile visibility</span>
          <span style={{ color: 'var(--accent)' }}>● Public</span>
        </div>
      </Card>

      {/* Bio */}
      <Card>
        <CardLabel>Bio</CardLabel>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: '0 0 16px' }}>
          Certified ASL interpreter with 12 years of experience in medical, legal, and conference settings. I bring deep cultural fluency, strong preparation practices, and a commitment to accuracy under pressure. Available for both on-site and remote assignments throughout the Pacific Northwest.
        </p>
        <Link href="/interpreter/signup">
          <GhostButton>Edit Bio</GhostButton>
        </Link>
      </Card>

      {/* Credentials */}
      <Card>
        <CardLabel>Credentials</CardLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            'RID NIC-Master',
            'EFSLI Member',
            'WA State Interpreter License',
          ].map(cred => (
            <div key={cred} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.88rem' }}>{cred}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>✓ Verified</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <Link href="/interpreter/signup">
            <GhostButton>Manage Credentials</GhostButton>
          </Link>
        </div>
      </Card>
    </div>
  )
}
