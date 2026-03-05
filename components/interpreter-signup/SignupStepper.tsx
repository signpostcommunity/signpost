'use client'

import { useRouter } from 'next/navigation'
import { useForm } from './FormContext'

const STEPS = [
  '1. Personal Info',
  '2. Languages',
  '3. Credentials',
  '4. Rates & Terms',
  '5. Intro Video',
  '6. Review',
]

export default function SignupStepper() {
  const { currentStep, setCurrentStep, saveDraft, isSaving, draftUserId } = useForm()
  const router = useRouter()

  async function handleSaveExit() {
    await saveDraft()
    router.push('/interpreter/signup/draft-saved')
  }

  return (
    <div>
      {/* Form header */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '2.4rem', fontWeight: 800,
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
              {isSaving ? 'Saving…' : 'Save & exit'}
            </button>
          )}
        </div>
      </div>

      {/* Step pills */}
      <div style={{
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
    </div>
  )
}
