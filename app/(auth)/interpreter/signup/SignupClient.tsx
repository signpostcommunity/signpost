'use client'

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
    if (!formData.email || !formData.password) {
      setStep1Error('Email and password are required.')
      return
    }
    if (formData.password.length < 8) {
      setStep1Error('Password must be at least 8 characters.')
      return
    }

    setStep1Error(null)
    setIsCreatingAccount(true)

    try {
      // Try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (signUpError) {
        // If user already exists, try to sign in instead (resume flow)
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          })
          if (signInError) {
            setStep1Error(signInError.message)
            return
          }
          if (signInData.user) {
            setDraftUserId(signInData.user.id)
          }
        } else {
          setStep1Error(signUpError.message)
          return
        }
      } else if (signUpData.user) {
        setDraftUserId(signUpData.user.id)
      }

      setCurrentStep(2)
    } catch (e) {
      setStep1Error(e instanceof Error ? e.message : 'Account creation failed.')
    } finally {
      setIsCreatingAccount(false)
    }
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

export default function SignupClient() {
  return (
    <FormProvider>
      <SignupForm />
    </FormProvider>
  )
}
