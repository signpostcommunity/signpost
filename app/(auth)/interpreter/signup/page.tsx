'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { FormProvider, useForm } from '@/components/interpreter-signup/FormContext'
import SignupStepper from '@/components/interpreter-signup/SignupStepper'
import Step1Personal from '@/components/interpreter-signup/Step1Personal'
import Step2Languages from '@/components/interpreter-signup/Step2Languages'
import Step3Credentials from '@/components/interpreter-signup/Step3Credentials'
import Step4Rates from '@/components/interpreter-signup/Step4Rates'
import Step5Video from '@/components/interpreter-signup/Step5Video'
import Step6Review from '@/components/interpreter-signup/Step6Review'

function SignupForm() {
  const { currentStep, setCurrentStep, formData, updateFormData, setDraftUserId, saveDraft } = useForm()
  const [step1Error, setStep1Error] = useState<string | null>(null)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleStep1Continue() {
    setCurrentStep(2)
  }

  async function goToStep(step: number) {
    await saveDraft()
    setCurrentStep(step)
  }

  return (
    <div style={{ padding: '100px 40px 60px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <SignupStepper />

        {currentStep === 1 && (
          <>
            <Step1Personal onContinue={handleStep1Continue} />
            {step1Error && (
              <p style={{ color: 'var(--accent3)', fontSize: '0.85rem', marginTop: 12 }}>
                {step1Error}
              </p>
            )}
            {isCreatingAccount && (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 12 }}>
                Creating your account…
              </p>
            )}
          </>
        )}
        {currentStep === 2 && (
          <Step2Languages onBack={() => setCurrentStep(1)} onContinue={() => goToStep(3)} />
        )}
        {currentStep === 3 && (
          <Step3Credentials onBack={() => setCurrentStep(2)} onContinue={() => goToStep(4)} />
        )}
        {currentStep === 4 && (
          <Step4Rates onBack={() => setCurrentStep(3)} onContinue={() => goToStep(5)} />
        )}
        {currentStep === 5 && (
          <Step5Video onBack={() => setCurrentStep(4)} onContinue={() => goToStep(6)} />
        )}
        {currentStep === 6 && (
          <Step6Review onBack={() => setCurrentStep(5)} />
        )}
      </div>
    </div>
  )
}

export default function InterpreterSignupPage() {
  return (
    <FormProvider>
      <SignupForm />
    </FormProvider>
  )
}
