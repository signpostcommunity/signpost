'use client';

import { useState } from 'react';

type InquiryStatus = 'all' | 'pending' | 'accepted' | 'declined';

const INQUIRIES = [
  { id: '1', from: 'Acme Corp', email: 'hr@acme.com', type: 'Medical', date: '2026-03-10', timeStart: '09:00', timeEnd: '12:00', format: 'In-person', location: 'Madrid, Spain', status: 'pending', interpreters: 1, notes: 'Specialist consultation. ASL required.' },
  { id: '2', from: 'City Hospital', email: 'events@cityhospital.com', type: 'Conference', date: '2026-03-15', timeStart: '10:00', timeEnd: '16:00', format: 'Remote', location: 'Remote (Zoom)', status: 'pending', interpreters: 2, notes: 'Annual medical conference — two interpreters needed.' },
  { id: '3', from: 'Sarah Johnson', email: 'sarah@email.com', type: 'Legal', date: '2026-03-18', timeStart: '14:00', timeEnd: '16:00', format: 'In-person', location: 'Madrid Court House', status: 'pending', interpreters: 1, notes: '' },
  { id: '4', from: 'Tech Inc', email: 'office@tech.com', type: 'Technical', date: '2026-03-05', timeStart: '13:00', timeEnd: '15:00', format: 'Remote', location: 'Remote (Teams)', status: 'accepted', interpreters: 1, notes: 'Product demo for international client.' },
  { id: '5', from: 'NGO Relief', email: 'info@ngo.org', type: 'Conference', date: '2026-02-28', timeStart: '09:00', timeEnd: '17:00', format: 'In-person', location: 'Barcelona', status: 'declined', interpreters: 1, notes: '' },
];

export default function InquiriesPage() {
  const [tab, setTab] = useState<InquiryStatus>('all');

  const filtered = INQUIRIES.filter((i) => tab === 'all' || i.status === tab);

  const counts = {
    all: INQUIRIES.length,
    pending: INQUIRIES.filter((i) => i.status === 'pending').length,
    accepted: INQUIRIES.filter((i) => i.status === 'accepted').length,
    declined: INQUIRIES.filter((i) => i.status === 'declined').length,
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '24px' }}>
        Inquiries
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {(['all', 'pending', 'accepted', 'declined'] as InquiryStatus[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: '7px',
              background: tab === t ? 'var(--surface2)' : 'none',
              border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
              color: tab === t ? 'var(--text)' : 'var(--muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span style={{ background: tab === t ? 'var(--accent)' : 'var(--border)', color: tab === t ? '#000' : 'var(--muted)', borderRadius: '100px', padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((inquiry) => (
          <div
            key={inquiry.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1rem' }}>{inquiry.from}</span>
                  <StatusBadge status={inquiry.status} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '100px', padding: '2px 10px' }}>
                    {inquiry.type}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px 16px', fontSize: '0.82rem', color: 'var(--muted)' }}>
                  <span>📅 {inquiry.date}</span>
                  <span>🕐 {inquiry.timeStart} – {inquiry.timeEnd}</span>
                  <span>📍 {inquiry.location}</span>
                  <span>💻 {inquiry.format}</span>
                  <span>👥 {inquiry.interpreters} interpreter{inquiry.interpreters > 1 ? 's' : ''}</span>
                </div>
                {inquiry.notes && (
                  <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                    "{inquiry.notes}"
                  </div>
                )}
              </div>

              {inquiry.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '9px 18px', color: '#34d399', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
                    Accept
                  </button>
                  <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 18px', color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer' }}>
                    Decline
                  </button>
                  <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 18px', color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer' }}>
                    Negotiate
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    pending: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
    accepted: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
    declined: { bg: 'rgba(255,107,133,0.1)', border: 'rgba(255,107,133,0.3)', color: 'var(--accent3)' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: '100px', padding: '2px 10px', fontSize: '0.72rem', color: s.color, fontWeight: 600 }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
