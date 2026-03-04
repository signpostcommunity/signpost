'use client';

import type { ReactNode } from 'react';

export function StepWrapper({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-syne)',
        fontSize: '1.6rem',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        marginBottom: '6px',
      }}>
        {title}
      </h2>
      <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '0.9rem' }}>{subtitle}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>{children}</div>
    </div>
  );
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function TextInput({ type = 'text', value, onChange, placeholder }: { type?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 14px',
        color: 'var(--text)',
        fontSize: '0.95rem',
        outline: 'none',
      }}
      onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
    />
  );
}

export function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 14px',
        color: 'var(--text)',
        fontSize: '0.95rem',
        outline: 'none',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function ChipPicker({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onToggle(item)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '100px',
            padding: '6px 14px',
            fontSize: '0.82rem',
            cursor: 'pointer',
            border: selected.includes(item) ? '1px solid rgba(0,229,255,0.5)' : '1px solid var(--border)',
            background: selected.includes(item) ? 'rgba(0,229,255,0.12)' : 'var(--surface)',
            color: selected.includes(item) ? 'var(--accent)' : 'var(--muted)',
            transition: 'all 0.15s',
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function CheckboxItem({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: '2px', accentColor: 'var(--accent)' }}
      />
      <span style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: 'var(--text)', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

export function StepNav({ onBack, onNext, nextLabel = 'Continue →', nextDisabled = false, loading = false, currentStep, totalSteps = 6 }: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  currentStep: number;
  totalSteps?: number;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
      {onBack ? (
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '10px 20px',
            color: 'var(--muted)',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      ) : (
        <div />
      )}
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        Step {currentStep} of {totalSteps}
      </div>
      <button
        onClick={onNext}
        disabled={nextDisabled || loading}
        className="btn-primary"
        style={{ opacity: !nextDisabled && !loading ? 1 : 0.4, padding: '10px 24px' }}
      >
        {loading ? 'Creating profile…' : nextLabel}
      </button>
    </div>
  );
}
