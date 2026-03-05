'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { DEMO_CONFIRMED } from '@/lib/data/demo'
import { BetaBanner, PageHeader, SectionLabel, StatusBadge, DemoBadge, GhostButton, DashMobileStyles } from '@/components/dashboard/interpreter/shared'

export default function ConfirmedPage() {
  const [search, setSearch] = useState('')

  const filtered = DEMO_CONFIRMED.filter(b =>
    !search || [b.title, b.client, b.category, b.location].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const upcoming = filtered.filter(b => b.upcoming)
  const all = filtered

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 900 }}>
      <BetaBanner />
      <PageHeader title="Confirmed Bookings" subtitle="All your accepted and confirmed jobs." />

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by client, location, type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '9px 14px',
            color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      {upcoming.length > 0 && (
        <>
          <SectionLabel>Upcoming — Next 14 Days</SectionLabel>
          {upcoming.map(b => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </>
      )}

      <SectionLabel>All Bookings</SectionLabel>
      {all.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          No bookings match your search.
        </div>
      )}
      {all.map(b => (
        <BookingCard key={b.id} booking={b} />
      ))}

      <DashMobileStyles />
    </div>
  )
}

function BookingCard({ booking }: { booking: typeof DEMO_CONFIRMED[0] }) {
  return (
    <div style={{
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
      <div className="dash-card-actions" style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <GhostButton>View Details</GhostButton>
        {booking.upcoming && <GhostButton>Add to Calendar</GhostButton>}
      </div>
    </div>
  )
}
