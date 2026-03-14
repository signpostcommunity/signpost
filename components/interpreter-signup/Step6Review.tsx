'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useForm } from './FormContext'
import { StepWrapper, FormSection, SectionTitle, FormNav } from './FormFields'

function CommunityToggle({ label, helper, checked, onChange }: {
  label: string
  helper?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button type="button" onClick={onChange} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
      padding: '10px 0', marginBottom: 8, background: 'none', border: 'none',
      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
    }}>
      <div style={{
        width: 40, height: 20, borderRadius: 100, flexShrink: 0,
        background: checked ? 'var(--accent)' : 'var(--surface2)',
        border: checked ? 'none' : '1px solid var(--border)',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: checked ? '#000' : 'var(--muted)',
          position: 'absolute', top: 2,
          left: checked ? 22 : 2, transition: 'left 0.2s',
        }} />
      </div>
      <div>
        <span style={{
          fontSize: '0.9rem',
          color: checked ? 'var(--accent)' : 'var(--muted)',
          fontWeight: checked ? 600 : 400,
          display: 'block',
        }}>{label}</span>
        {helper && <span style={{ fontSize: '0.78rem', color: 'var(--muted)', opacity: 0.7, lineHeight: 1.4 }}>{helper}</span>}
      </div>
    </button>
  )
}

export default function Step6Review({ onBack }: { onBack: () => void }) {
  const { formData, updateField, draftUserId, saveDraft } = useForm()
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

        // Insert user_profiles row (must happen before interpreter_profiles due to FK)
        const { error: upError } = await supabase.from('user_profiles').upsert(
          { id: userId, role: 'interpreter', pending_roles: formData.pendingRoles.length > 0 ? formData.pendingRoles : [] },
          { onConflict: 'id' }
        )
        if (upError) {
          console.error('[signup] Failed to upsert user_profiles:', upError.code, upError.message, upError.details)
          throw new Error('Failed to create user profile: ' + upError.message)
        }
      }

      // Upsert interpreter_profiles — BETA: auto-approve, no admin review
      const { data: profileRow, error: profileError } = await supabase.from('interpreter_profiles').upsert({
        user_id: userId,
        name: [formData.firstName, formData.lastName].filter(Boolean).join(' ') || formData.email || 'Interpreter',
        status: 'approved',
        draft_step: null,
        draft_data: formData,
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
        gender_identity: formData.genderIdentity,
        video_url: formData.videoUrl,
        video_desc: formData.videoDescription,
        photo_url: formData.avatarUrl,
        other_specializations: formData.otherSpecializations || null,
        vanity_slug: formData.vanitySlug || null,
        notification_preferences: {
          email_enabled: true,
          sms_enabled: true,
          categories: {
            new_request: { email: true, sms: true },
            booking_confirmed: { email: true, sms: true },
            rate_response: { email: true, sms: true },
            cancelled_by_requester: { email: true, sms: true },
            cancelled_by_you: { email: true, sms: true },
            sub_search_update: { email: true, sms: true },
            booking_reminder: { email: true, sms: true },
            new_message: { email: true, sms: true },
            invoice_paid: { email: true, sms: true },
            team_invite: { email: true, sms: true },
            added_to_preferred_list: { email: true, sms: true },
            welcome: { email: true, sms: true },
          },
        },
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' }).select('id').single()

      if (profileError) {
        console.error('[signup] Failed to save profile fields:', profileError.code, profileError.message, profileError.details)
        throw new Error('Save failed: ' + profileError.message)
      }
      const profileId = profileRow?.id
      if (!profileId) {
        console.error('[signup] No profile ID returned after upsert')
        throw new Error('Save failed: could not find your profile')
      }

      // Write certifications to interpreter_certifications table
      const validCerts = formData.certifications.filter(c => c.name.trim())
      if (validCerts.length > 0) {
        // Delete existing certs to avoid duplicates on re-submit
        const { error: delCertError } = await supabase
          .from('interpreter_certifications')
          .delete()
          .eq('interpreter_id', profileId)
        if (delCertError) {
          console.error('[signup] Failed to clear existing certifications:', delCertError.code, delCertError.message)
        }

        for (const cert of validCerts) {
          const { error: certError } = await supabase
            .from('interpreter_certifications')
            .insert({
              interpreter_id: profileId,
              name: cert.name,
              issuing_body: cert.issuingBody,
              year: cert.year ? parseInt(cert.year, 10) : null,
              verification_url: cert.verificationLink || null,
              verified: false,
            })
          if (certError) {
            console.error('[signup] Failed to save certification:', cert.name, certError.code, certError.message)
          }
        }
      }

      // Write education to interpreter_education table
      const validEdu = formData.education.filter(e => e.degree.trim())
      if (validEdu.length > 0) {
        // Delete existing education to avoid duplicates on re-submit
        const { error: delEduError } = await supabase
          .from('interpreter_education')
          .delete()
          .eq('interpreter_id', profileId)
        if (delEduError) {
          console.error('[signup] Failed to clear existing education:', delEduError.code, delEduError.message)
        }

        for (const edu of validEdu) {
          const { error: eduError } = await supabase
            .from('interpreter_education')
            .insert({
              interpreter_id: profileId,
              degree: edu.degree,
              institution: edu.institution,
              year: edu.year ? parseInt(edu.year, 10) : null,
            })
          if (eduError) {
            console.error('[signup] Failed to save education:', edu.degree, eduError.code, eduError.message)
          }
        }
      }

      // Geocode location and update lat/lng (non-blocking)
      if (formData.city || formData.state || formData.country) {
        try {
          const geoRes = await fetch('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: formData.city, state: formData.state, country: formData.country }),
          })
          if (geoRes.ok) {
            const { latitude, longitude } = await geoRes.json()
            await supabase.from('interpreter_profiles')
              .update({ latitude, longitude })
              .eq('user_id', userId)
          }
        } catch (geoErr) {
          console.warn('[signup] Geocoding failed, continuing without coordinates:', geoErr)
        }
      }

      // BETA: seed demo bookings + messages for new interpreter
      try {
        await fetch('/api/seed-interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interpreterProfileId: profileId }),
        })
      } catch (seedErr) {
        console.warn('Beta: seed call failed, continuing', seedErr)
      }

      // Send welcome notification (email + in-app) — fires once on signup only
      try {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientUserId: userId,
            type: 'welcome',
            channel: 'both',
            subject: 'Welcome to signpost!',
            body: 'Thanks for joining signpost! Your interpreter profile is live. Visit your dashboard to complete your profile, set your rates, and start receiving requests.',
            ctaText: 'Go to My Dashboard',
            ctaUrl: 'https://signpost.community/interpreter/dashboard',
            metadata: { vanity_slug: formData.vanitySlug || null },
          }),
        })
      } catch (welcomeErr) {
        console.warn('Welcome notification failed, continuing', welcomeErr)
      }
    } catch (insertError) {
      console.error('[signup] Profile save failed:', insertError)
      setError(`Profile save failed: ${(insertError as Error).message || 'Unknown error'}. Please try again.`)
      setIsSubmitting(false)
      return
    }

    // BETA: unconditional auto sign-in and redirect
    try {
      // For OAuth users, they're already signed in — just redirect
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.refresh()
        router.push('/interpreter/dashboard')
        return
      }

      // For email/password users, sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      if (data?.session) {
        router.refresh()
        router.push('/interpreter/dashboard')
        return
      }
      if (signInError) {
        console.error('Beta sign-in error:', signInError.message)
        router.push('/interpreter/login')
      }
    } catch (e) {
      console.error('Beta redirect error:', e)
      router.push('/interpreter/login')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <StepWrapper>
      {/* Community & Identity */}
      <FormSection>
        <SectionTitle>Community &amp; Identity</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20, marginTop: -12, lineHeight: 1.6 }}>
          These fields are entirely optional and self-selected. Help requesters find interpreters who are exactly the right fit for their needs.
        </p>

        {/* LGBTQ+ */}
        <CommunityToggle
          label="LGBTQ+"
          helper="Select if you are available for and affirming of LGBTQ+ clients and settings"
          checked={formData.lgbtq}
          onChange={() => updateField('lgbtq', !formData.lgbtq)}
        />

        {/* Deaf-Parented Interpreter / CODA */}
        <CommunityToggle
          label="Deaf-Parented Interpreter / CODA"
          helper="Select if you grew up with Deaf parents or are a Child of Deaf Adults"
          checked={formData.deafParented}
          onChange={() => updateField('deafParented', !formData.deafParented)}
        />

        {/* BIPOC */}
        <CommunityToggle
          label="BIPOC"
          checked={formData.bipoc}
          onChange={() => {
            if (formData.bipoc) {
              updateField('bipoc', false)
              updateField('bipocDetails', [])
            } else {
              updateField('bipoc', true)
            }
          }}
        />
        {formData.bipoc && (
          <div style={{ marginLeft: 16, marginBottom: 16, paddingLeft: 16, borderLeft: '2px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Black/African American', 'Asian/Pacific Islander', 'Hispanic/Latino(a)', 'Indigenous/Native American', 'Middle Eastern/North African', 'Multiracial'].map(opt => {
              const selected = formData.bipocDetails.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateField('bipocDetails', selected
                    ? formData.bipocDetails.filter(x => x !== opt)
                    : [...formData.bipocDetails, opt]
                  )}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer',
                    border: selected ? '1px solid rgba(0,229,255,0.5)' : '1px solid var(--border)',
                    background: selected ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                    color: selected ? 'var(--accent)' : 'var(--muted)',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                  }}
                >{opt}</button>
              )
            })}
          </div>
        )}

        {/* Religious affiliation */}
        <CommunityToggle
          label="Religious affiliation"
          checked={formData.religiousAffiliation}
          onChange={() => {
            if (formData.religiousAffiliation) {
              updateField('religiousAffiliation', false)
              updateField('religiousDetails', [])
            } else {
              updateField('religiousAffiliation', true)
            }
          }}
        />
        {formData.religiousAffiliation && (
          <div style={{ marginLeft: 16, marginBottom: 16, paddingLeft: 16, borderLeft: '2px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Buddhist', 'Christian', 'Hindu', 'Jewish', 'Muslim', 'Sikh', 'Other'].map(opt => {
              const selected = formData.religiousDetails.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateField('religiousDetails', selected
                    ? formData.religiousDetails.filter(x => x !== opt)
                    : [...formData.religiousDetails, opt]
                  )}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer',
                    border: selected ? '1px solid rgba(0,229,255,0.5)' : '1px solid var(--border)',
                    background: selected ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                    color: selected ? 'var(--accent)' : 'var(--muted)',
                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                  }}
                >{opt}</button>
              )
            })}
          </div>
        )}
      </FormSection>

      {/* Platform Agreement & Submit */}
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
                  signpost Platform Policies &amp; Terms of Use
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
                I understand that connections made through signpost are platform connections. Work relationships that originate here, whether with a new client or a returning one, will continue to be booked through the platform. Routing bookings outside signpost to avoid the platform fee is not permitted.
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
      </div>

      <FormNav
        step={6}
        totalSteps={6}
        onBack={onBack}
        onContinue={handleSubmit}
        onSaveDraft={saveDraft}
        continueLabel={isSubmitting ? 'Submitting…' : 'Submit Profile'}
        continueDisabled={!allAgreed || isSubmitting}
      />
    </StepWrapper>
  )
}
