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
  pronouns: string
  phone: string
  email: string
  password: string
  country: string
  city: string
  state: string
  interpreterType: string
  modeOfWork: string
  yearsExperience: string
  regions: string[]
  eventCoordination: boolean
  coordinationBio: string
  avatarUrl: string
  // Step 2 - Languages
  signLanguages: string[]
  spokenLanguages: string[]
  // Step 3 - Credentials
  certifications: Certification[]
  education: Education[]
  // Step 4 - Bio & Video
  bio: string
  bioSpecializations: string
  bioExtra: string
  videoUrl: string
  videoDescription: string
  // Step 5 - Skills
  specializations: string[]
  specializedSkills: string[]
  // Step 6 - Community & Identity
  lgbtq: boolean
  deafParented: boolean
  bipoc: boolean
  bipocDetails: string[]
  religiousAffiliation: boolean
  religiousDetails: string[]
  // Step 7 - Mentorship (optional)
  mentorshipOffering: boolean
  mentorshipSeeking: boolean
  mentorshipTypesOffering: string[]
  mentorshipTypesSeeking: string[]
  mentorshipPaid: string
  mentorshipBioOffering: string
  mentorshipBioSeeking: string
  // Multi-role
  pendingRoles: string[]
  // Agreement
  agreeTerms: boolean
  agreeBooking: boolean
  agreeCredentials: boolean
  // Book Me link
  vanitySlug: string
  // Legacy (kept for compatibility)
  rateProfiles: RateProfile[]
  otherSpecializations: string
  genderIdentity: string
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
    minimumBooking: '', cancellationPolicy: '',
    lateCancellationFee: '',
    minimumEngagement: '', cancellationWindow: '',
    eligibilityCriteria: '', travel: [], notes: '',
  },
]

const initialFormData: FormData = {
  firstName: '', lastName: '', pronouns: '', phone: '', email: '', password: '',
  country: '', city: '', state: '', interpreterType: '', modeOfWork: '',
  yearsExperience: '', regions: [],
  eventCoordination: false, coordinationBio: '',
  avatarUrl: '',
  signLanguages: [], spokenLanguages: [],
  certifications: [{ id: 'cert-1', name: '', issuingBody: '', year: '', verificationLink: '' }],
  education: [{ id: 'edu-1', degree: '', institution: '', year: '' }],
  bio: '', bioSpecializations: '', bioExtra: '',
  videoUrl: '', videoDescription: '',
  specializations: [], specializedSkills: [],
  lgbtq: false, deafParented: false, bipoc: false, bipocDetails: [],
  religiousAffiliation: false, religiousDetails: [],
  mentorshipOffering: false, mentorshipSeeking: false,
  mentorshipTypesOffering: [], mentorshipTypesSeeking: [],
  mentorshipPaid: '', mentorshipBioOffering: '', mentorshipBioSeeking: '',
  pendingRoles: [],
  agreeTerms: false, agreeBooking: false, agreeCredentials: false,
  vanitySlug: '',
  rateProfiles: defaultRateProfiles, otherSpecializations: '', genderIdentity: '',
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
      // Save draft_data AND copy all fields to individual columns
      await supabase
        .from('interpreter_profiles')
        .upsert({
          user_id: draftUserId,
          name: [formData.firstName, formData.lastName].filter(Boolean).join(' ') || formData.email || 'Draft',
          status: 'draft',
          draft_step: currentStep,
          draft_data: formData,
          // Copy all form fields to individual columns
          first_name: formData.firstName,
          last_name: formData.lastName,
          pronouns: formData.pronouns || null,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          city: formData.city,
          state: formData.state,
          bio: formData.bio,
          bio_specializations: formData.bioSpecializations,
          bio_extra: formData.bioExtra,
          interpreter_type: formData.interpreterType,
          work_mode: formData.modeOfWork,
          years_experience: formData.yearsExperience,
          regions: formData.regions,
          event_coordination: formData.eventCoordination,
          event_coordination_desc: formData.coordinationBio,
          sign_languages: formData.signLanguages,
          spoken_languages: formData.spokenLanguages,
          specializations: formData.specializations,
          specialized_skills: formData.specializedSkills,
          lgbtq: formData.lgbtq,
          deaf_parented: formData.deafParented,
          bipoc: formData.bipoc,
          bipoc_details: formData.bipocDetails,
          religious_affiliation: formData.religiousAffiliation,
          religious_details: formData.religiousDetails,
          video_url: formData.videoUrl,
          video_desc: formData.videoDescription,
          photo_url: formData.avatarUrl,
          gender_identity: formData.genderIdentity,
          other_specializations: formData.otherSpecializations || null,
          vanity_slug: formData.vanitySlug || null,
          mentorship_offering: formData.mentorshipOffering,
          mentorship_seeking: formData.mentorshipSeeking,
          mentorship_types: [...new Set([...formData.mentorshipTypesOffering, ...formData.mentorshipTypesSeeking])],
          mentorship_types_offering: formData.mentorshipTypesOffering,
          mentorship_types_seeking: formData.mentorshipTypesSeeking,
          mentorship_paid: formData.mentorshipPaid || null,
          mentorship_bio_offering: formData.mentorshipBioOffering || null,
          mentorship_bio_seeking: formData.mentorshipBioSeeking || null,
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
