'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { interpreters } from '@/lib/data/seed';
import RatingStars from '@/components/ui/RatingStars';

const INITIAL_ROSTER = [
  { ...interpreters[0], tier: 'top', approveWork: true, approvePersonal: true, notes: '' },
  { ...interpreters[1], tier: 'preferred', approveWork: true, approvePersonal: false, notes: 'Available Tues/Thurs only' },
  { ...interpreters[4], tier: 'preferred', approveWork: true, approvePersonal: false, notes: '' },
  { ...interpreters[7], tier: 'backup', approveWork: true, approvePersonal: false, notes: '' },
];

type Tier = 'top' | 'preferred' | 'backup';

export default function DeafDashboardPage() {
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [filterTier, setFilterTier] = useState<'all' | Tier>('all');

  const filtered = filterTier === 'all' ? roster : roster.filter((r) => r.tier === filterTier);

  const tierColors: Record<Tier, { bg: string; border: string; color: string }> = {
    top:       { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
    preferred: { bg: 'rgba(0,229,255,0.1)', border: 'rgba(0,229,255,0.3)', color: 'var(--accent)' },
    backup:    { bg: 'rgba(157,135,255,0.1)', border: 'rgba(157,135,255,0.3)', color: 'var(--accent2)' },
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px 64px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>My Interpreter Roster</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{roster.length} interpreter{roster.length !== 1 ? 's' : ''} on your list</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href="/directory"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 16px', color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none' }}
            >
              Browse Directory
            </Link>
            <button
              style={{ background: 'var(--accent2)', color: '#000', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Share Roster
            </button>
          </div>
        </div>

        {/* Tier filter tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {(['all', 'top', 'preferred', 'backup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTier(t)}
              style={{
                padding: '7px 16px',
                borderRadius: '100px',
                background: filterTier === t ? 'rgba(157,135,255,0.12)' : 'none',
                border: filterTier === t ? '1px solid rgba(157,135,255,0.4)' : '1px solid var(--border)',
                color: filterTier === t ? 'var(--accent2)' : 'var(--muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontWeight: filterTier === t ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {t === 'all' ? 'All' : t}
              <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                ({t === 'all' ? roster.length : roster.filter((r) => r.tier === t).length})
              </span>
            </button>
          ))}
        </div>

        {/* Roster list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((item) => {
            const tc = tierColors[item.tier as Tier];
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {item.initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                    <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700 }}>{item.name}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: '100px', padding: '2px 8px', fontSize: '0.68rem', color: tc.color, fontWeight: 700, textTransform: 'capitalize' as const }}>
                      {item.tier}
                    </span>
                    {item.available && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#34d399' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                        Available
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {item.location} · {item.signLangs.join(', ')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                    <RatingStars rating={item.rating} size={11} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{item.rating}</span>
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '4px' }}>
                      Note: {item.notes}
                    </div>
                  )}
                </div>

                {/* Approval toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                  <ApprovalToggle label="Work" approved={item.approveWork} />
                  <ApprovalToggle label="Personal" approved={item.approvePersonal} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', color: 'var(--muted)', fontSize: '0.75rem', cursor: 'pointer' }}>
                    Request
                  </button>
                  <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', color: 'var(--muted)', fontSize: '0.75rem', cursor: 'pointer' }}>
                    ⋮
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>📋</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: '8px' }}>No interpreters in this tier</div>
            <Link href="/directory" style={{ color: 'var(--accent2)', textDecoration: 'none', fontSize: '0.9rem' }}>Browse the directory →</Link>
          </div>
        )}
    </div>
  );
}

function ApprovalToggle({ label, approved }: { label: string; approved: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: approved ? '#34d399' : 'var(--border)', display: 'inline-block' }} />
      <span style={{ color: approved ? 'var(--text)' : 'var(--muted)' }}>{label}</span>
    </div>
  );
}
