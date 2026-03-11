'use client'

import { ReactNode, CSSProperties } from 'react'

// ── Wrappers ──────────────────────────────────────────────────────────────────

export function StepWrapper({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

export function FormSection({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ marginBottom: 36, ...style }}>{children}</div>
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Syne', sans-serif",
      fontSize: '0.7rem', fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'var(--accent)', marginBottom: 20,
    }}>
      {children}
    </div>
  )
}

export function FormRow({ children, full, three, style }: {
  children: ReactNode
  full?: boolean
  three?: boolean
  style?: CSSProperties
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: full ? '1fr' : three ? 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))' : 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
      gap: 16,
      marginBottom: 16,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function FormField({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {children}
    </div>
  )
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 500 }}>
      {children}
    </label>
  )
}

// ── Inputs ────────────────────────────────────────────────────────────────────

const inputStyle: CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '11px 14px',
  color: 'var(--text)',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--accent)'
  e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.07)'
}
function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border)'
  e.target.style.boxShadow = 'none'
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...props.style }}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="password"
      {...props}
      style={{ ...inputStyle, ...props.style }}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, ...props.style }}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}

export function TextareaInput(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: 'vertical', minHeight: 100, ...props.style }}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}

export function UrlInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="url"
      {...props}
      style={{ ...inputStyle, ...props.style }}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}

export function MoneyInput({ value, onChange, placeholder, style }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  style?: CSSProperties
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--muted)', fontSize: '0.9rem', pointerEvents: 'none',
      }}>$</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '0.00'}
        style={{ ...inputStyle, paddingLeft: 28, ...style }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  )
}

// ── Buttons ───────────────────────────────────────────────────────────────────

export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: '1px dashed var(--border)',
        color: 'var(--muted)', borderRadius: 'var(--radius-sm)',
        padding: 10, width: '100%', cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
        transition: 'all 0.2s', marginTop: 10,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--accent)'
        el.style.color = 'var(--accent)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--border)'
        el.style.color = 'var(--muted)'
      }}
    >
      {children}
    </button>
  )
}

export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)',
        color: 'var(--accent3)', borderRadius: 8,
        padding: '8px 10px', cursor: 'pointer',
        fontSize: '0.9rem', transition: 'all 0.2s',
        alignSelf: 'flex-end',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.1)' }}
    >
      ✕
    </button>
  )
}

// ── Form Nav ──────────────────────────────────────────────────────────────────

export function FormNav({
  step, totalSteps, onBack, onContinue, continueLabel, continueDisabled,
}: {
  step: number
  totalSteps: number
  onBack: () => void
  onContinue: () => void
  continueLabel?: string
  continueDisabled?: boolean
}) {
  return (
    <>
      <div className="signup-form-nav" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 32, borderTop: '1px solid var(--border)', marginTop: 40,
        flexWrap: 'wrap', gap: 12,
      }}>
        <button
          className="signup-nav-back"
          onClick={onBack}
          style={{
            visibility: step === 1 ? 'hidden' : 'visible',
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
            padding: '10px 20px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          ← Back
        </button>

        <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
          Step {step} of {totalSteps}
        </div>

        <button
          className="btn-primary signup-nav-continue"
          onClick={onContinue}
          disabled={continueDisabled}
          style={{ opacity: continueDisabled ? 0.4 : 1, pointerEvents: continueDisabled ? 'none' : 'auto' }}
        >
          {continueLabel || 'Continue →'}
        </button>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .signup-form-nav {
            flex-direction: column-reverse !important;
          }
          .signup-nav-back,
          .signup-nav-continue {
            width: 100% !important;
            text-align: center !important;
            justify-content: center !important;
          }
          .signup-nav-back {
            display: ${step === 1 ? 'none' : 'block'} !important;
          }
        }
      `}</style>
    </>
  )
}

// ── Toggle tile (region / travel) ─────────────────────────────────────────────

export function ToggleTile({
  label, selected, onToggle, dotColor,
}: {
  label: string
  selected: boolean
  onToggle: () => void
  dotColor?: string
}) {
  return (
    <label
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 'var(--radius-sm)',
        border: `1px solid ${selected ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
        background: selected ? 'rgba(0,229,255,0.08)' : 'var(--surface2)',
        cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
        gap: 8,
      }}
    >
      {dotColor && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      )}
      <span style={{ color: selected ? 'var(--text)' : 'var(--muted)', fontSize: '0.85rem', flex: 1 }}>
        {label}
      </span>
      <span style={{ color: 'var(--accent)', fontSize: '0.8rem', opacity: selected ? 1 : 0 }}>✓</span>
    </label>
  )
}

// ── Chip (specializations) ────────────────────────────────────────────────────

export function Chip({ label, selected, onToggle }: {
  label: string; selected: boolean; onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
        minHeight: 36, fontSize: '0.85rem', cursor: 'pointer',
        transition: 'all 0.15s', userSelect: 'none',
        border: `1px solid ${selected ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
        background: selected ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
        color: selected ? 'var(--accent)' : 'var(--muted)',
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1.4, wordBreak: 'break-word',
      }}
    >
      {label}
    </button>
  )
}
