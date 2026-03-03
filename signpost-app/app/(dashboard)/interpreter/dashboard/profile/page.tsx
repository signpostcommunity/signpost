'use client';

import { useState } from 'react';

export default function InterpreterProfilePage() {
  const [bio, setBio] = useState('Certified interpreter with 12+ years experience across medical, legal, and conference settings in Spain and internationally.');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [eventCoord, setEventCoord] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '24px' }}>
        My Profile
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card title="Basic Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Full Name"><Input value="Sofia Reyes" onChange={() => {}} /></Field>
            <Field label="Country"><Input value="Spain" onChange={() => {}} /></Field>
            <Field label="State / Region"><Input value="Community of Madrid" onChange={() => {}} /></Field>
            <Field label="Years Experience"><Input value="12" onChange={() => {}} /></Field>
          </div>
        </Card>

        <Card title="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-dm)' }}
          />
        </Card>

        <Card title="Links">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Website"><Input value={website} onChange={setWebsite} placeholder="https://yourwebsite.com" /></Field>
            <Field label="LinkedIn"><Input value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/..." /></Field>
          </div>
        </Card>

        <Card title="Event Coordination">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={eventCoord} onChange={(e) => setEventCoord(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: '0.9rem' }}>I offer event coordination services</span>
          </label>
          {eventCoord && (
            <textarea
              placeholder="Describe your event coordination services..."
              rows={3}
              style={{ marginTop: '12px', width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-dm)' }}
            />
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} className="btn-primary" style={{ padding: '12px 28px' }}>
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
      <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: '16px' }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 13px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none' }}
      onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.4)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
    />
  );
}
