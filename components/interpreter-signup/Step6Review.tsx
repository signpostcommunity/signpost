'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useForm } from './FormContext'
import { StepWrapper, FormNav } from './FormFields'

export default function Step6Review({ onBack }: { onBack: () => void }) {
  const { formData, updateField, draftUserId } = useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const allAgreed = formData.agreeTerms && formData.agreeBooking && formData.agreeCredentials

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit() {
    if (!allAgreed || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    try {
      let userId = draftUserId

      if (!userId) {
        // Create the Supabase auth account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        })
        if (signUpError) throw signUpError
        userId = signUpData.user?.id ?? null
        if (!userId) throw new Error('Account creation failed — no user ID returned.')

        // Insert user_profiles row
        await supabase.from('user_profiles').insert({
          id: userId,
          role: 'interpreter',
          email: formData.email,
        })
      }

      // Upsert interpreter_profiles with status: pending (awaiting admin review)
      await supabase.from('interpreter_profiles').upsert({
        user_id: userId,
        status: 'pending',
        draft_step: 6,
        draft_data: formData,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        city: formData.city,
        bio: formData.bio,
        interpreter_type: formData.interpreterType,
        mode_of_work: formData.modeOfWork,
        years_experience: formData.yearsExperience,
        website: formData.website,
        linkedin: formData.linkedin,
        regions: formData.regions,
        event_coordination: formData.eventCoordination,
        coordination_bio: formData.coordinationBio,
        sign_languages: formData.signLanguages,
        spoken_languages: formData.spokenLanguages,
        specializations: formData.specializations,
        video_url: formData.videoUrl,
        video_description: formData.videoDescription,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      router.push('/interpreter/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <StepWrapper>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: 32, textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          margin: '0 auto 20px', width: 64, height: 64,
          background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
          borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M8 17l5 5 11-12" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="16" r="12" stroke="#00e5ff" strokeWidth="1.5" />
          </svg>
        </div>

        <h2 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, marginBottom: 8,
        }}>
          Ready to Submit
        </h2>
        <p style={{ color: 'var(--muted)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
          Your profile will go live once submitted. Credentials you've linked or uploaded documentation for will display a{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>✓ Verified</span>{' '}
          badge. You can update your profile and add verification links at any time.
        </p>

        {/* Platform Agreement */}
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '20px 24px',
          textAlign: 'left', margin: '0 auto 24px', maxWidth: 480,
        }}>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--accent)', marginBottom: 14,
          }}>
            Platform Agreement
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              cursor: 'pointer', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6,
            }}>
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={e => updateField('agreeTerms', e.target.checked)}
                style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0, width: 'auto' }}
              />
              <span>
                I have read and agree to the{' '}
                <a href="/policies" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  Signpost Platform Policies &amp; Terms of Use
                </a>
                , including the limitation of liability and dispute resolution provisions.
              </span>
            </label>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              cursor: 'pointer', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6,
            }}>
              <input
                type="checkbox"
                checked={formData.agreeBooking}
                onChange={e => updateField('agreeBooking', e.target.checked)}
                style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0, width: 'auto' }}
              />
              <span>
                I understand that connections made through Signpost are platform connections. Work relationships that originate here — whether with a new client or a returning one — will continue to be booked through the platform. Routing bookings outside Signpost to avoid the platform fee is not permitted.
              </span>
            </label>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              cursor: 'pointer', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6,
            }}>
              <input
                type="checkbox"
                checked={formData.agreeCredentials}
                onChange={e => updateField('agreeCredentials', e.target.checked)}
                style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0, width: 'auto' }}
              />
              <span>
                I confirm that all credential and experience information I have provided is accurate to the best of my knowledge. I understand that misrepresentation may result in removal from the platform.
              </span>
            </label>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p style={{
            color: 'var(--accent3)', fontSize: '0.85rem',
            marginBottom: 16, maxWidth: 400, margin: '0 auto 16px',
          }}>
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!allAgreed || isSubmitting}
          className="btn-primary btn-large"
          style={{
            opacity: allAgreed && !isSubmitting ? 1 : 0.4,
            pointerEvents: allAgreed && !isSubmitting ? 'auto' : 'none',
          }}
        >
          {isSubmitting ? 'Submitting…' : 'Submit Profile for Review'}
        </button>
      </div>

      <FormNav
        step={6}
        totalSteps={6}
        onBack={onBack}
        onContinue={handleSubmit}
        continueLabel={isSubmitting ? 'Submitting…' : 'Submit Profile for Review'}
        continueDisabled={!allAgreed || isSubmitting}
      />
    </StepWrapper>
  )
}
