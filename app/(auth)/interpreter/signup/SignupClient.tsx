'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { FormProvider, useForm } from '@/components/interpreter-signup/FormContext'
import SignupStepper from '@/components/interpreter-signup/SignupStepper'
import Step1Personal from '@/components/interpreter-signup/Step1Personal'
import Step2Languages from '@/components/interpreter-signup/Step2Languages'
import Step3Credentials from '@/components/interpreter-signup/Step3Credentials'
import Step4BioVideo from '@/components/interpreter-signup/Step4BioVideo'
import Step5Skills from '@/components/interpreter-signup/Step5Skills'
import Step6Mentorship from '@/components/interpreter-signup/Step6Mentorship'
import Step6Review from '@/components/interpreter-signup/Step6Review'
import HowItWorks from '@/components/onboarding/HowItWorks'

// TODO: Wire draft resume - load draft_data and draft_step from interpreter_profiles,
// pre-fill the signup form, and jump to the saved step when ?resume=true is in the URL

function SignupForm() {
  const { currentStep, setCurrentStep, formData, updateFormData, setDraftUserId, saveDraft, draftUserId } = useForm()
  const [step1Error, setStep1Error] = useState<string | null>(null)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const searchParams = useSearchParams()
  const isAddRole = searchParams.get('addRole') === 'true'
  const inviteToken = searchParams.get('invite') || null

  // Store invite token in sessionStorage for persistence through signup wizard
  useEffect(() => {
    if (inviteToken) {
      sessionStorage.setItem('signpost_invite_token', inviteToken)
      // Track click
      fetch('/api/invites/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken }),
      }).catch(() => { /* non-blocking */ })
    }
  }, [inviteToken])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check if user is already authenticated (e.g. via Google OAuth redirect)
  useEffect(() => {
    if (draftUserId) return // Already set
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setDraftUserId(user.id)
          // Pre-fill name from Google metadata if available
          const fullName = user.user_metadata?.full_name
          if (fullName && !formData.firstName) {
            const parts = fullName.split(' ')
            updateFormData({
              firstName: parts[0] || '',
              lastName: parts.slice(1).join(' ') || '',
              email: user.email || '',
            })
          } else if (user.email && !formData.email) {
            updateFormData({ email: user.email })
          }

          if (isAddRole) {
            // Skip to step 3 for add-role users (step 1=infographic, step 2=personal)
            setCurrentStep(3)
          }
        } else if (isAddRole) {
          // Not logged in but trying to add role - redirect to login
          window.location.href = '/interpreter/login'
        }
      } catch (e) {
        console.error('Auth check failed:', e)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleStep2Continue() {
    // If user is already authenticated (OAuth), skip account creation
    if (draftUserId) {
      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

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

      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setStep1Error(e instanceof Error ? e.message : 'Account creation failed.')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  async function goToStep(step: number) {
    await saveDraft()
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack(step: number) {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ padding: '100px 40px 60px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <SignupStepper />

        {currentStep === 1 && (
          <HowItWorks role="interpreter" onContinue={() => { setCurrentStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
        )}
        {currentStep === 2 && (
          <>
            <Step1Personal onContinue={handleStep2Continue} />
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
        {currentStep === 3 && (
          <Step2Languages onBack={() => goBack(2)} onContinue={() => goToStep(4)} />
        )}
        {currentStep === 4 && (
          <Step3Credentials onBack={() => goBack(3)} onContinue={() => goToStep(5)} />
        )}
        {currentStep === 5 && (
          <Step4BioVideo onBack={() => goBack(4)} onContinue={() => goToStep(6)} />
        )}
        {currentStep === 6 && (
          <Step5Skills onBack={() => goBack(5)} onContinue={() => goToStep(7)} />
        )}
        {currentStep === 7 && (
          <Step6Mentorship onBack={() => goBack(6)} onContinue={() => goToStep(8)} />
        )}
        {currentStep === 8 && (
          <Step6Review onBack={() => goBack(7)} />
        )}
      </div>
    </div>
  )
}

export default function SignupClient() {
  return (
    <FormProvider>
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </FormProvider>
  )
}
