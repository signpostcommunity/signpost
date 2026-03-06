'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

const REQUESTS = [
  { id: '1', interpreter: 'Sofia Reyes', type: 'Medical', date: '2026-03-10', status: 'pending', format: 'In-person' },
  { id: '2', interpreter: 'Léa Martin', type: 'Conference', date: '2026-03-15', status: 'pending', format: 'Remote' },
  { id: '3', interpreter: 'James Thornton', type: 'Legal', date: '2026-02-20', status: 'confirmed', format: 'In-person' },
  { id: '4', interpreter: 'Amara Wilson', type: 'Academic', date: '2026-02-10', status: 'completed', format: 'Remote' },
];

const STATUS_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  pending:   { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
  confirmed: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
  completed: { bg: 'rgba(157,135,255,0.1)', border: 'rgba(157,135,255,0.3)', color: 'var(--accent2)' },
  declined:  { bg: 'rgba(255,107,133,0.1)', border: 'rgba(255,107,133,0.3)', color: 'var(--accent3)' },
};

export default function RequesterDashboardPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  const filtered = activeTab === 'all' ? REQUESTS : REQUESTS.filter((r) => r.status === activeTab);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>My Requests</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Track and manage your interpreter requests</p>
          </div>
          <Link
            href="/directory"
            className="btn-primary"
            style={{ textDecoration: 'none', padding: '9px 18px', fontSize: '0.88rem' }}
          >
            + New Request
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {(['all', 'pending', 'confirmed', 'completed'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: '8px 16px', borderRadius: '7px', background: activeTab === t ? 'var(--surface2)' : 'none', border: activeTab === t ? '1px solid var(--border)' : '1px solid transparent', color: activeTab === t ? 'var(--text)' : 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize' as const }}>
              {t}
            </button>
          ))}
        </div>

        {/* Requests list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((req) => {
            const ss = STATUS_STYLES[req.status];
            return (
              <div key={req.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700 }}>{req.interpreter}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: '100px', padding: '2px 10px', fontSize: '0.72rem', color: ss.color, fontWeight: 600, textTransform: 'capitalize' as const }}>{req.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>{req.type}</span>
                    <span>📅 {req.date}</span>
                    <span>💻 {req.format}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 14px', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>View</button>
                  <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 14px', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>Message</button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: '8px' }}>No requests found</div>
            <Link href="/directory" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>Browse interpreters →</Link>
          </div>
        )}
    </div>
  );
}
