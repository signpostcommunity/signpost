'use client';

// components/interpreter-signup/SignupStepper.tsx
// Matches prototype .form-header + .form-steps block (index.html ~line 2835)

const STEPS = [
  '1. Personal Info',
  '2. Languages',
  '3. Credentials',
  '4. Rates & Terms',
  '5. Intro Video',
  '6. Review',
];

interface SignupStepperProps {
  currentStep: number; // 1-indexed
  onStepClick?: (step: number) => void; // only fires for 'done' steps
}

export default function SignupStepper({ currentStep, onStepClick }: SignupStepperProps) {
  return (
    <div className="form-header-block">
      {/* Hero */}
      <div style={{ marginBottom: '48px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: '2.4rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            marginBottom: '8px',
            color: 'var(--text)',
          }}
        >
          Create Your Profile
        </h1>
        <p style={{ color: 'var(--muted)' }}>
          Join the{' '}
          <span
            style={{
              fontFamily: 'var(--font-syne), Syne, sans-serif',
              fontWeight: 800,
              color: 'var(--text)',
            }}
          >
            sign<span style={{ color: 'var(--accent)' }}>post</span>
          </span>{' '}
          community and connect with the global Deaf community.
        </p>
      </div>

      {/* Step indicator bar */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: '48px',
          background: 'var(--surface2)',
          borderRadius: '12px',
          padding: '6px',
          border: '1px solid var(--border)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <button
              key={label}
              onClick={() => isDone && onStepClick?.(stepNum)}
              style={{
                flex: '1 1 0',
                minWidth: 0,
                textAlign: 'center',
                padding: '10px 4px',
                borderRadius: '8px',
                fontSize: '0.79rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                border: 'none',
                cursor: isDone ? 'pointer' : isActive ? 'default' : 'default',
                transition: 'all 0.2s',
                background: isActive ? 'var(--surface)' : 'transparent',
                color: isActive
                  ? 'var(--text)'
                  : isDone
                  ? 'var(--accent)'
                  : 'var(--muted)',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
