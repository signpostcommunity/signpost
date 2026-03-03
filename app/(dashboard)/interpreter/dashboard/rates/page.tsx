'use client';

import { useState } from 'react';

const INITIAL_RATES = [
  { id: '1', label: 'Standard Rate', color: 'var(--accent)', hourlyRate: 120, currency: 'USD', minBooking: 60, cancellationPolicy: '48 hours notice required', isDefault: true },
  { id: '2', label: 'Conference Rate', color: 'var(--accent2)', hourlyRate: 180, currency: 'USD', minBooking: 120, cancellationPolicy: '72 hours notice required', isDefault: false },
];

export default function RatesPage() {
  const [rates] = useState(INITIAL_RATES);

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Rate Profiles</h1>
        <button className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.85rem' }}>+ Add Rate Profile</button>
      </div>

      <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.6 }}>
        Create multiple rate profiles for different types of work. Clients will see your rates when viewing your profile.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rates.map((rate) => (
          <div key={rate.id} style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: 'var(--radius)', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: rate.color }} />
                <div>
                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700 }}>{rate.label}</span>
                  {rate.isDefault && <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '100px', padding: '2px 8px', color: 'var(--accent)' }}>Default</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.1rem', color: rate.color }}>{rate.currency} {rate.hourlyRate}/hr</span>
                <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 14px', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>Edit</button>
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
              <span>Min booking: {rate.minBooking} min</span>
              <span>Cancellation: {rate.cancellationPolicy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
