'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from './FormContext'

const STEPS = [
  '1. Personal Info',
  '2. Languages',
  '3. Credentials',
  '4. Bio & Video',
  '5. Skills',
  '6. Mentorship',
  '7. Community',
]

export default function SignupStepper() {
  const { currentStep, setCurrentStep, saveDraft, isSaving, draftUserId } = useForm()
  const [draftToast, setDraftToast] = useState(false)
  const searchParams = useSearchParams()
  const isAddRole = searchParams.get('addRole') === 'true'
  const displaySteps = isAddRole
    ? STEPS.slice(1).map((s, i) => `${i + 1}. ${s.split('. ')[1]}`)
    : STEPS
  const stepOffset = isAddRole ? 1 : 0

  async function handleSaveExit() {
    await saveDraft()
    setDraftToast(true)
    setTimeout(() => setDraftToast(false), 2000)
  }

  return (
    <div>
      {/* Form header */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 'clamp(1.5rem, 5vw, 2.4rem)', fontWeight: 700,
          letterSpacing: '-0.04em', marginBottom: 8,
        }}>
          Create Your Profile
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Join the <span className="wordmark">sign<span>post</span></span> community and connect with the global Deaf community.
          </p>
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
        {displaySteps.map((label, i) => {
          const stepNum = i + 1 + stepOffset
          const isActive = stepNum === currentStep
          const isDone = stepNum < currentStep
          return (
            <button
              key={stepNum}
              onClick={() => { if (isDone) { setCurrentStep(stepNum); window.scrollTo({ top: 0, behavior: 'smooth' }) } }}
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

      {/* Step circles — mobile only */}
      <div className="signup-step-mobile" style={{
        display: 'none', marginBottom: 32,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10,
        }}>
          {displaySteps.map((_, i) => {
            const stepNum = i + 1 + stepOffset
            const isActive = stepNum === currentStep
            const isDone = stepNum < currentStep
            return (
              <button
                key={stepNum}
                onClick={() => { if (isDone) { setCurrentStep(stepNum); window.scrollTo({ top: 0, behavior: 'smooth' }) } }}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  border: isActive ? '2px solid var(--accent)' : isDone ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: isActive ? 'rgba(0,229,255,0.15)' : isDone ? 'rgba(0,229,255,0.08)' : 'var(--surface2)',
                  color: isActive ? 'var(--accent)' : isDone ? 'var(--accent)' : 'var(--muted)',
                  cursor: isDone ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  padding: 0,
                  minWidth: 32, minHeight: 32,
                }}
              >
                {isDone ? '\u2713' : i + 1}
              </button>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
          {displaySteps[currentStep - 1 - stepOffset] || ''}
        </div>
      </div>

      {/* Draft saved toast */}
      {draftToast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#00c875', color: '#000', padding: '12px 24px',
          borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', zIndex: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          Draft saved
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .signup-step-pills { display: none !important; }
          .signup-step-mobile { display: block !important; }
        }
      `}</style>
    </div>
  )
}
