'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from './FormContext'

const STEPS = [
  '1. Personal Info',
  '2. Languages',
  '3. Credentials',
  '4. Bio & Video',
  '5. Skills',
  '6. Community',
]

export default function SignupStepper() {
  const { currentStep, setCurrentStep, saveDraft, isSaving, draftUserId } = useForm()
  const router = useRouter()
  const [draftToast, setDraftToast] = useState(false)

  async function handleSaveExit() {
    await saveDraft()
    setDraftToast(true)
    setTimeout(() => {
      router.push(draftUserId ? '/interpreter/dashboard' : '/interpreter')
    }, 1500)
  }

  return (
    <div>
      {/* Form header */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(1.5rem, 5vw, 2.4rem)', fontWeight: 800,
          letterSpacing: '-0.04em', marginBottom: 8,
        }}>
          Create Your Profile
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Join the <span className="wordmark">sign<span>post</span></span> community and connect with the global Deaf community.
          </p>
          {draftUserId && (
            <button
              onClick={handleSaveExit}
              disabled={isSaving}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--muted)',
                fontSize: '0.8rem',
                padding: '6px 14px',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--accent)'
                ;(e.target as HTMLButtonElement).style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--border)'
                ;(e.target as HTMLButtonElement).style.color = 'var(--muted)'
              }}
            >
              {isSaving ? 'Saving…' : 'Save Draft'}
            </button>
          )}
        </div>
      </div>

      {/* Step pills — desktop */}
      <div className="signup-step-pills" style={{
        display: 'flex', gap: 0, marginBottom: 48,
        background: 'var(--surface2)', borderRadius: 12,
        padding: 6, border: '1px solid var(--border)',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const isActive = stepNum === currentStep
          const isDone = stepNum < currentStep
          return (
            <button
              key={stepNum}
              onClick={() => isDone && setCurrentStep(stepNum)}
              style={{
                flex: '1 1 0', minWidth: 0, textAlign: 'center',
                padding: '10px 4px', borderRadius: 8,
                fontSize: '0.79rem', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                transition: 'all 0.2s', border: 'none',
                cursor: isDone ? 'pointer' : isActive ? 'default' : 'default',
                background: isActive ? 'var(--surface)' : 'transparent',
                color: isActive ? 'var(--text)' : isDone ? 'var(--accent)' : 'var(--muted)',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Step label — mobile only */}
      <div className="signup-step-mobile" style={{
        display: 'none', textAlign: 'center', marginBottom: 48,
        color: 'var(--muted)', fontSize: '0.82rem',
      }}>
        Step {currentStep} of {STEPS.length}
      </div>

      {/* Draft saved toast */}
      {draftToast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#00c875', color: '#000', padding: '12px 24px',
          borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', zIndex: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          Draft saved. You can pick up where you left off from your dashboard.
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .signup-step-pills { display: none !important; }
          .signup-step-mobile { display: block !important; }
        }
      `}</style>
    </div>
  )
}
