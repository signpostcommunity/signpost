'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { DEMO_INQUIRIES, DEMO_CONFIRMED } from '@/lib/data/demo'
import { BetaBanner, PageHeader, SectionLabel, StatusBadge, Avatar, DemoBadge, GhostButton } from '@/components/dashboard/interpreter/shared'

function StatCard({ num, label, href }: { num: number; label: string; href: string }) {
  const [hover, setHover] = useState(false)
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: 'var(--card-bg)',
          border: `1px solid ${hover ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '24px 28px',
          transition: 'border-color 0.2s', cursor: 'pointer',
        }}
      >
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem', color: 'var(--accent)' }}>{num}</div>
        <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 4 }}>{label}</div>
      </div>
    </Link>
  )
}

export default function OverviewPage() {
  return (
    <div style={{ padding: '48px 56px', maxWidth: 900 }}>
      <BetaBanner />

      <PageHeader
        title="Welcome back, Sofia."
        subtitle="Here's a snapshot of your activity on signpost."
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 40 }}>
        <StatCard num={2} label="New Inquiries" href="/interpreter/dashboard/inquiries" />
        <StatCard num={3} label="Confirmed This Month" href="/interpreter/dashboard/confirmed" />
        <StatCard num={4} label="Interpreters in Your Preferred Team" href="/interpreter/dashboard/team" />
        <StatCard num={4} label="Days Available This Week" href="/interpreter/dashboard/availability" />
      </div>

      {/* Pending Inquiries */}
      <SectionLabel>Pending Inquiries</SectionLabel>
      {DEMO_INQUIRIES.map(inq => (
        <div key={inq.id} style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif" }}>{inq.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>
                From: {inq.from} · {inq.category} · {inq.receivedDate}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <DemoBadge />
              <StatusBadge status="pending" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
            <span>📅 {inq.date}</span>
            <span>🕐 {inq.time}</span>
            <span>📍 {inq.location}</span>
            <span>{inq.mode}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <Link href="/interpreter/dashboard/inquiries">
              <button className="btn-primary" style={{ fontSize: '0.82rem', padding: '8px 18px' }}>
                Accept &amp; Send Rate
              </button>
            </Link>
            <GhostButton>View Details</GhostButton>
            <GhostButton danger>Decline</GhostButton>
          </div>
        </div>
      ))}

      {/* Upcoming Confirmed */}
      <SectionLabel>Upcoming Confirmed</SectionLabel>
      {DEMO_CONFIRMED.filter(b => b.upcoming).map(booking => (
        <div key={booking.id} style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif" }}>{booking.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>{booking.client} · {booking.category}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <DemoBadge />
              <StatusBadge status="confirmed" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
            <span>📅 {booking.date}</span>
            <span>🕐 {booking.time}</span>
            <span>📍 {booking.location}</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <GhostButton>Add to Calendar</GhostButton>
          </div>
        </div>
      ))}
    </div>
  )
}
