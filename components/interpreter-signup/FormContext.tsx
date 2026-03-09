'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export type RateProfile = {
  id: string
  name: string
  hint: string
  dotColor: string
  isDefault?: boolean
  hourlyRate: string
  dailyRate: string
  currency: string
  afterHoursRate: string
  afterHoursPer: string
  minimumBooking: string
  cancellationPolicy: string
  lateCancellationFee: string
  minimumEngagement: string
  cancellationWindow: string
  eligibilityCriteria: string
  travel: string[]
  notes: string
  profileType: 'standard' | 'community' | 'multiday' | 'custom'
}

export type Certification = {
  id: string
  name: string
  issuingBody: string
  year: string
  verificationLink: string
}

export type Education = {
  id: string
  degree: string
  institution: string
  year: string
}

export type FormData = {
  // Step 1 - Personal Info
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
  country: string
  city: string
  state: string
  bio: string
  interpreterType: string
  modeOfWork: string
  yearsExperience: string
  regions: string[]
  eventCoordination: boolean
  coordinationBio: string
  // Community & Identity
  lgbtq: boolean
  deafParented: boolean
  bipoc: boolean
  bipocDetails: string[]
  religiousAffiliation: boolean
  religiousDetails: string[]
  genderIdentity: string
  // Step 2 - Languages
  signLanguages: string[]
  spokenLanguages: string[]
  specializations: string[]
  otherSpecializations: string
  // Step 3 - Credentials
  certifications: Certification[]
  education: Education[]
  // Step 4 - Rates
  rateProfiles: RateProfile[]
  // Step 5 - Photo & Video
  avatarUrl: string
  videoUrl: string
  videoDescription: string
  // Step 6 - Review
  agreeTerms: boolean
  agreeBooking: boolean
  agreeCredentials: boolean
}

const defaultRateProfiles: RateProfile[] = [
  {
    id: 'profile-1',
    name: 'Standard Rate',
    hint: 'Your default rate for most bookings',
    dotColor: '#00e5ff',
    isDefault: true,
    profileType: 'standard',
    hourlyRate: '', dailyRate: '', currency: 'USD — US Dollar',
    afterHoursRate: '', afterHoursPer: 'Per hour',
    minimumBooking: '2 hours', cancellationPolicy: '48 hours notice required',
    lateCancellationFee: '100% of booking fee',
    minimumEngagement: '', cancellationWindow: '',
    eligibilityCriteria: '', travel: [], notes: '',
  },
  {
    id: 'profile-2',
    name: 'Community Rate',
    hint: 'Reduced rate for community events and organizations',
    dotColor: '#34d399',
    profileType: 'community',
    hourlyRate: '', dailyRate: '', currency: 'USD — US Dollar',
    afterHoursRate: '', afterHoursPer: 'Per hour',
    minimumBooking: '2 hours', cancellationPolicy: '48 hours notice required',
    lateCancellationFee: '100% of booking fee',
    minimumEngagement: '', cancellationWindow: '',
    eligibilityCriteria: '', travel: [], notes: '',
  },
  {
    id: 'profile-3',
    name: 'Multi-Day / Extended Booking',
    hint: 'For conferences, multi-day events, and extended engagements',
    dotColor: '#7b61ff',
    profileType: 'multiday',
    hourlyRate: '', dailyRate: '', currency: 'USD — US Dollar',
    afterHoursRate: '', afterHoursPer: 'Per hour',
    minimumBooking: '', cancellationPolicy: '',
    lateCancellationFee: '100% of total booking',
    minimumEngagement: '2 days', cancellationWindow: '2 weeks notice required',
    eligibilityCriteria: '', travel: [], notes: '',
  },
]

const initialFormData: FormData = {
  firstName: '', lastName: '', phone: '', email: '', password: '',
  country: '', city: '', state: '', bio: '', interpreterType: '', modeOfWork: '',
  yearsExperience: '', regions: [],
  eventCoordination: false, coordinationBio: '',
  lgbtq: false, deafParented: false, bipoc: false, bipocDetails: [],
  religiousAffiliation: false, religiousDetails: [], genderIdentity: '',
  signLanguages: [], spokenLanguages: [], specializations: [], otherSpecializations: '',
  certifications: [{ id: 'cert-1', name: '', issuingBody: '', year: '', verificationLink: '' }],
  education: [{ id: 'edu-1', degree: '', institution: '', year: '' }],
  rateProfiles: defaultRateProfiles,
  avatarUrl: '', videoUrl: '', videoDescription: '',
  agreeTerms: false, agreeBooking: false, agreeCredentials: false,
}

type FormContextType = {
  formData: FormData
  currentStep: number
  setCurrentStep: (step: number) => void
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void
  updateFormData: (updates: Partial<FormData>) => void
  saveDraft: () => Promise<void>
  isSaving: boolean
  draftUserId: string | null
  setDraftUserId: (id: string | null) => void
}

const FormContext = createContext<FormContextType | null>(null)

export function FormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [draftUserId, setDraftUserId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const saveDraft = useCallback(async () => {
    if (!draftUserId) return
    setIsSaving(true)
    try {
      // Ensure user_profiles row exists (FK target for interpreter_profiles)
      await supabase.from('user_profiles').upsert(
        { id: draftUserId, role: 'interpreter' },
        { onConflict: 'id' }
      )
      await supabase
        .from('interpreter_profiles')
        .upsert({
          user_id: draftUserId,
          name: [formData.firstName, formData.lastName].filter(Boolean).join(' ') || formData.email || 'Draft',
          status: 'draft',
          draft_step: currentStep,
          draft_data: formData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
    } catch (e) {
      console.error('Draft save failed:', e)
    } finally {
      setIsSaving(false)
    }
  }, [draftUserId, currentStep, formData, supabase])

  return (
    <FormContext.Provider value={{
      formData, currentStep, setCurrentStep,
      updateField, updateFormData,
      saveDraft, isSaving, draftUserId, setDraftUserId,
    }}>
      {children}
    </FormContext.Provider>
  )
}

export function useForm() {
  const ctx = useContext(FormContext)
  if (!ctx) throw new Error('useForm must be used within FormProvider')
  return ctx
}
