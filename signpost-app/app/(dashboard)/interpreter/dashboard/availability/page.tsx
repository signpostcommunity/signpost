'use client';

import { useState } from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DaySlot {
  enabled: boolean;
  start: string;
  end: string;
}

const defaultSlots: DaySlot[] = [
  { enabled: false, start: '09:00', end: '17:00' },
  { enabled: true,  start: '09:00', end: '18:00' },
  { enabled: true,  start: '09:00', end: '18:00' },
  { enabled: true,  start: '09:00', end: '17:00' },
  { enabled: true,  start: '09:00', end: '18:00' },
  { enabled: true,  start: '10:00', end: '15:00' },
  { enabled: false, start: '09:00', end: '17:00' },
];

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<DaySlot[]>(defaultSlots);
  const [saved, setSaved] = useState(false);

  function toggleDay(idx: number) {
    setSlots((prev) => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  }

  function updateSlot(idx: number, field: 'start' | 'end', value: string) {
    setSlots((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px' }}>Availability</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
        Set your regular weekly availability. Clients will see this when viewing your profile.
      </p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '20px' }}>
        {DAYS.map((day, idx) => (
          <div
            key={day}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '14px 20px',
              borderBottom: idx < DAYS.length - 1 ? '1px solid var(--border)' : 'none',
              background: slots[idx].enabled ? 'rgba(0,229,255,0.02)' : 'none',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', width: 120, cursor: 'pointer', flexShrink: 0 }}>
              <input type="checkbox" checked={slots[idx].enabled} onChange={() => toggleDay(idx)} style={{ accentColor: 'var(--accent)' }} />
              <span style={{ fontSize: '0.88rem', color: slots[idx].enabled ? 'var(--text)' : 'var(--muted)', fontWeight: slots[idx].enabled ? 500 : 400 }}>{day}</span>
            </label>

            {slots[idx].enabled ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <input type="time" value={slots[idx].start} onChange={(e) => updateSlot(idx, 'start', e.target.value)}
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', color: 'var(--text)', fontSize: '0.85rem', outline: 'none' }} />
                <span style={{ color: 'var(--muted)' }}>–</span>
                <input type="time" value={slots[idx].end} onChange={(e) => updateSlot(idx, 'end', e.target.value)}
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', color: 'var(--text)', fontSize: '0.85rem', outline: 'none' }} />
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Unavailable</span>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="btn-primary" style={{ padding: '12px 28px' }}>
        {saved ? '✓ Saved' : 'Save Availability'}
      </button>
    </div>
  );
}
