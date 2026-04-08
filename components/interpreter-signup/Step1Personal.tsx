'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormRow, FormField, FieldLabel,
  TextInput, PasswordInput, SelectInput,
  ToggleTile, FormNav, FieldError,
} from './FormFields'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'
import LocationPicker from '@/components/shared/LocationPicker'
import { useDialCode } from '@/components/shared/PhoneWithDialCode'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { generateSlug, validateSlug } from '@/lib/slugUtils'
import { resizeImage } from '@/lib/imageUtils'

const REGIONS = [
  { label: '🌍 Worldwide', color: '#00e5ff' },
  { label: 'NA - North America', color: '#f97316' },
  { label: 'LATAM - Latin America & Caribbean', color: '#a78bfa' },
  { label: 'EU - Europe', color: '#60a5fa' },
  { label: 'AF - Africa', color: '#34d399' },
  { label: 'ME - Middle East', color: '#fb923c' },
  { label: 'SA - South & Central Asia', color: '#f472b6' },
  { label: 'EA - East & Southeast Asia', color: '#facc15' },
  { label: 'OC - Oceania & Pacific', color: '#4dd9ac' },
]

export default function Step1Personal({ onContinue }: { onContinue: () => void }) {
  const { formData, updateField, updateFormData, saveDraft } = useForm()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validateAndContinue() {
    const next: Record<string, string> = {}
    if (!formData.firstName.trim()) next.firstName = 'Please enter your first name.'
    if (!formData.lastName.trim()) next.lastName = 'Please enter your last name.'
    if (!formData.avatarUrl) next.avatarUrl = "A profile photo is required. Requesters and Deaf community members want to see who they're connecting with."
    if (!formData.city.trim()) next.city = 'Please enter your city.'
    if (!formData.state.trim()) next.state = 'Please enter your state or region.'
    if (!formData.interpreterType) next.interpreterType = 'Please select your interpreter type.'
    if (!formData.modeOfWork) next.modeOfWork = 'Please select your availability for remote and/or in-person work.'
    if (!formData.yearsExperience) next.yearsExperience = 'Please select your experience range.'
    setErrors(next)
    if (Object.keys(next).length === 0) {
      onContinue()
    } else {
      setTimeout(() => {
        const el = document.querySelector('[data-step1-error="true"]') as HTMLElement | null
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }
  const supabase = createClient()
  const searchParams = useSearchParams()
  const isAddRole = searchParams.get('addRole') === 'true'
  const dialCode = useDialCode(formData.country)

  // Pre-fill shared fields from existing profiles when adding a role
  useEffect(() => {
    if (!isAddRole) return
    // Only pre-fill if the form is still empty (not already loaded from draft)
    if (formData.firstName || formData.email) return
    ;(async () => {
      try {
        const res = await fetch('/api/profile-defaults')
        if (!res.ok) return
        const defaults = await res.json()
        const updates: Record<string, string> = {}
        if (defaults.first_name) updates.firstName = defaults.first_name
        if (defaults.last_name) updates.lastName = defaults.last_name
        if (defaults.email) updates.email = defaults.email
        if (defaults.phone) updates.phone = defaults.phone
        if (defaults.country) updates.country = defaults.country
        if (defaults.state) updates.state = defaults.state
        if (defaults.city) updates.city = defaults.city
        if (Object.keys(updates).length > 0) {
          updateFormData(updates as Partial<import('./FormContext').FormData>)
        }
      } catch (e) {
        // Non-blocking - form still works without pre-fill
        console.warn('Failed to fetch profile defaults:', e)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddRole])

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Slug state
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [slugError, setSlugError] = useState<string | null>(null)
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkSlugAvailability = useCallback((slug: string) => {
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current)
    const validation = validateSlug(slug)
    if (!validation.valid) {
      setSlugStatus('invalid')
      setSlugError(validation.error || 'Invalid slug')
      return
    }
    setSlugStatus('checking')
    setSlugError(null)
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()
        if (data.available) {
          setSlugStatus('available')
          setSlugError(null)
        } else {
          setSlugStatus(data.reason === 'taken' ? 'taken' : data.reason === 'reserved' ? 'invalid' : 'invalid')
          setSlugError(data.reason === 'taken' ? 'Already taken' : data.reason === 'reserved' ? 'This URL is reserved' : 'Invalid slug')
        }
      } catch {
        setSlugStatus('invalid')
        setSlugError('Could not check availability')
      }
    }, 500)
  }, [])

  // Auto-generate slug from name when not manually edited
  useEffect(() => {
    if (slugManuallyEdited) return
    const slug = generateSlug(formData.firstName, formData.lastName)
    if (slug && slug.length >= 3) {
      updateField('vanitySlug', slug)
      checkSlugAvailability(slug)
    } else {
      updateField('vanitySlug', slug)
      setSlugStatus('idle')
    }
  }, [formData.firstName, formData.lastName, slugManuallyEdited, updateField, checkSlugAvailability])

  const worldwideSelected = formData.regions.includes('🌍 Worldwide')

  function toggleRegion(label: string) {
    const current = formData.regions
    if (label !== '🌍 Worldwide' && worldwideSelected) return
    updateField('regions', current.includes(label)
      ? current.filter(r => r !== label)
      : [...current, label]
    )
  }

  function togglePendingRole(role: string) {
    const current = formData.pendingRoles
    updateField('pendingRoles', current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role]
    )
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadMsg(null)

    let uploadFile = file
    if (file.size > 2 * 1024 * 1024) {
      try {
        uploadFile = await resizeImage(file, 2)
        if (uploadFile.size > 2 * 1024 * 1024) {
          setUploadMsg({ text: 'Image is too large even after resizing. Please use a smaller photo.', type: 'error' })
          setUploading(false)
          return
        }
      } catch {
        setUploadMsg({ text: 'Could not resize image. Please use a smaller photo.', type: 'error' })
        setUploading(false)
        return
      }
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUploading(false)
      setUploadMsg({ text: 'You must be signed in to upload. Complete account creation first.', type: 'error' })
      return
    }

    const ext = uploadFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, uploadFile, { upsert: true })

    if (uploadError) {
      setUploading(false)
      setUploadMsg({ text: `Upload failed: ${uploadError.message}`, type: 'error' })
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    updateField('avatarUrl', urlData.publicUrl)
    setUploading(false)
    setUploadMsg({ text: 'Photo uploaded.', type: 'success' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const initials = `${(formData.firstName || '')[0] || ''}${(formData.lastName || '')[0] || ''}`.toUpperCase() || '?'

  return (
    <StepWrapper>
      {/* Account credentials - top of form, before everything else */}
      <FormSection>
        <SectionTitle>Create Your Account</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12 }}>
          Enter your email and a password now so your profile is saved as a draft at each step. You can close the form and return to finish it any time.
        </p>
        <FormRow>
          <FormField>
            <FieldLabel>Email Address *</FieldLabel>
            <TextInput
              type="email"
              placeholder="sofia@example.com"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
            />
          </FormField>
          <FormField>
            <FieldLabel>Password *</FieldLabel>
            <PasswordInput
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={e => updateField('password', e.target.value)}
            />
          </FormField>
        </FormRow>

        {/* Or label */}
        <p style={{ color: 'var(--muted)', fontSize: '0.78rem', textAlign: 'center', margin: '4px 0 12px' }}>
          or continue with
        </p>

        <GoogleSignInButton role="interpreter" />
      </FormSection>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', marginBottom: 36 }} />

      {/* Profile Photo */}
      <FormSection>
        <SectionTitle>Profile Photo</SectionTitle>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '20px 24px',
        }}>
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt="Profile" style={{
              width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
              border: '2px solid var(--accent)', flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#7b61ff,#00e5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: '#fff',
            }}>{initials}</div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                background: 'none', border: '1px solid rgba(0,229,255,0.4)',
                color: 'var(--accent)', borderRadius: 8, padding: '8px 16px',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? 'Uploading...' : formData.avatarUrl ? 'Change photo' : 'Upload photo'}
            </button>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>
              JPG, PNG, or WebP. Large photos are auto-resized.
            </div>
            {uploadMsg && (
              <div style={{
                fontSize: '0.78rem', marginTop: 6,
                color: uploadMsg.type === 'success' ? '#34d399' : 'var(--accent3)',
              }}>{uploadMsg.text}</div>
            )}
          </div>
        </div>
        {errors.avatarUrl && (
          <div data-step1-error="true">
            <FieldError>{errors.avatarUrl}</FieldError>
          </div>
        )}
      </FormSection>

      {/* Personal Information */}
      <FormSection>
        <SectionTitle>Personal Information</SectionTitle>
        <FormRow>
          <FormField>
            <FieldLabel>First Name *</FieldLabel>
            <TextInput
              placeholder="Sofia"
              value={formData.firstName}
              onChange={e => updateField('firstName', e.target.value)}
            />
            <FieldError>{errors.firstName}</FieldError>
          </FormField>
          <FormField>
            <FieldLabel>Last Name *</FieldLabel>
            <TextInput
              placeholder="Reyes"
              value={formData.lastName}
              onChange={e => updateField('lastName', e.target.value)}
            />
            <FieldError>{errors.lastName}</FieldError>
          </FormField>
        </FormRow>

        {/* Book Me Link */}
        <FormField>
          <FieldLabel>Your Book Me Link</FieldLabel>
          <div style={{
            display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)',
            overflow: 'hidden', border: '1px solid var(--border)',
          }}>
            <div style={{
              background: 'var(--surface2)', padding: '11px 12px', fontSize: '0.85rem',
              color: 'var(--muted)', whiteSpace: 'nowrap', borderRight: '1px solid var(--border)',
              flexShrink: 0, fontFamily: "'DM Sans', sans-serif",
            }}>
              signpost.community/book/
            </div>
            <input
              type="text"
              value={formData.vanitySlug}
              placeholder="your-name"
              onChange={e => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                setSlugManuallyEdited(true)
                updateField('vanitySlug', val)
                if (val.length >= 3) {
                  checkSlugAvailability(val)
                } else if (val.length > 0) {
                  setSlugStatus('invalid')
                  setSlugError('Must be at least 3 characters')
                } else {
                  setSlugStatus('idle')
                  setSlugError(null)
                }
              }}
              style={{
                flex: 1, background: 'var(--surface)', border: 'none', padding: '11px 14px',
                color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                fontFamily: "'DM Sans', sans-serif", minWidth: 0,
              }}
            />
          </div>
          {formData.vanitySlug && slugStatus !== 'idle' && (
            <div style={{
              fontSize: '0.78rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4,
              color: slugStatus === 'available' ? '#34d399'
                : slugStatus === 'checking' ? 'var(--muted)'
                : 'var(--accent3)',
            }}>
              {slugStatus === 'checking' && 'Checking...'}
              {slugStatus === 'available' && <><span style={{ fontWeight: 600 }}>&#10003;</span> Available</>}
              {slugStatus === 'taken' && <><span style={{ fontWeight: 600 }}>&#10005;</span> {slugError}</>}
              {slugStatus === 'invalid' && <><span style={{ fontWeight: 600 }}>&#10005;</span> {slugError}</>}
            </div>
          )}
        </FormField>

        <FormRow>
          <FormField>
            <FieldLabel>Pronouns</FieldLabel>
            <SelectInput
              value={formData.pronouns === 'she/her' || formData.pronouns === 'he/him' || formData.pronouns === 'they/them' || formData.pronouns === 'she/they' || formData.pronouns === 'he/they' || formData.pronouns === '' ? formData.pronouns : 'Other'}
              onChange={e => {
                if (e.target.value === 'Other') {
                  updateField('pronouns', 'Other')
                } else {
                  updateField('pronouns', e.target.value)
                }
              }}
            >
              <option value="">Select…</option>
              <option>she/her</option>
              <option>he/him</option>
              <option>they/them</option>
              <option>she/they</option>
              <option>he/they</option>
              <option>Other</option>
            </SelectInput>
            {(formData.pronouns === 'Other' || (formData.pronouns && !['she/her', 'he/him', 'they/them', 'she/they', 'he/they', ''].includes(formData.pronouns))) && (
              <TextInput
                placeholder="Enter your pronouns (e.g. ze/zir/zim)"
                value={formData.pronouns === 'Other' ? '' : formData.pronouns}
                onChange={e => updateField('pronouns', e.target.value || 'Other')}
                style={{ marginTop: 8 }}
              />
            )}
          </FormField>
          <FormField>
            <FieldLabel>Gender Identity</FieldLabel>
            <SelectInput
              value={['Woman', 'Man', 'Non-binary', 'Genderqueer', 'Genderfluid', 'Agender', 'Two-Spirit', 'Prefer not to say', ''].includes(formData.genderIdentity) ? formData.genderIdentity : 'Other'}
              onChange={e => {
                if (e.target.value === 'Other') {
                  updateField('genderIdentity', 'Other')
                } else {
                  updateField('genderIdentity', e.target.value)
                }
              }}
            >
              <option value="">Select…</option>
              <option>Woman</option>
              <option>Man</option>
              <option>Non-binary</option>
              <option>Genderqueer</option>
              <option>Genderfluid</option>
              <option>Agender</option>
              <option>Two-Spirit</option>
              <option>Prefer not to say</option>
              <option>Other</option>
            </SelectInput>
            {(formData.genderIdentity === 'Other' || (formData.genderIdentity && !['Woman', 'Man', 'Non-binary', 'Genderqueer', 'Genderfluid', 'Agender', 'Two-Spirit', 'Prefer not to say', ''].includes(formData.genderIdentity))) && (
              <TextInput
                placeholder="Enter your gender identity"
                value={formData.genderIdentity === 'Other' ? '' : formData.genderIdentity}
                onChange={e => updateField('genderIdentity', e.target.value || 'Other')}
                style={{ marginTop: 8 }}
              />
            )}
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 6, lineHeight: 1.4 }}>
              Optional. Helps requesters accommodate specific client preferences when requested.
            </div>
          </FormField>
        </FormRow>

        <LocationPicker
          country={formData.country}
          state={formData.state}
          city={formData.city}
          onChange={({ country, state, city }) => {
            updateField('country', country)
            updateField('state', state)
            updateField('city', city)
          }}
        />
        {(errors.city || errors.state) && (
          <FieldError>{errors.city || errors.state}</FieldError>
        )}

        <FormRow>
          <FormField>
            <FieldLabel>Phone / VP</FieldLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <span style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRight: 'none', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                padding: '10px 10px', color: 'var(--muted)', fontSize: '0.9rem',
                whiteSpace: 'nowrap', lineHeight: 1.4,
              }}>{dialCode}</span>
              <TextInput
                type="tel"
                placeholder="555 000 0000"
                value={formData.phone}
                onChange={e => updateField('phone', e.target.value)}
                style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}
              />
            </div>
          </FormField>
          <FormField>
            <FieldLabel>Years of Experience *</FieldLabel>
            <SelectInput
              value={formData.yearsExperience}
              onChange={e => updateField('yearsExperience', e.target.value)}
            >
              <option value="">Select…</option>
              <option>Less than 1 year</option>
              <option>1–3 years</option>
              <option>3–5 years</option>
              <option>5–10 years</option>
              <option>10–15 years</option>
              <option>15–20 years</option>
              <option>20+ years</option>
            </SelectInput>
            <FieldError>{errors.yearsExperience}</FieldError>
          </FormField>
        </FormRow>

        <FormRow>
          <FormField>
            <FieldLabel>Interpreter Type *</FieldLabel>
            <SelectInput
              value={formData.interpreterType}
              onChange={e => updateField('interpreterType', e.target.value)}
            >
              <option value="">Select…</option>
              <option>Hearing Interpreter</option>
              <option>Deaf Interpreter</option>
              <option>Deaf-Parented Interpreter / CODA</option>
            </SelectInput>
            <FieldError>{errors.interpreterType}</FieldError>
            {formData.interpreterType === 'Deaf Interpreter' && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  <input
                    type="checkbox"
                    checked={formData.pendingRoles.includes('deaf')}
                    onChange={() => togglePendingRole('deaf')}
                    style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0, width: 'auto' }}
                  />
                  <span>I would also like to create a personal signpost account. In my personal account I can build my preferred interpreter list, make personal interpreter requests, etc.</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  <input
                    type="checkbox"
                    checked={formData.pendingRoles.includes('requester')}
                    onChange={() => togglePendingRole('requester')}
                    style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0, width: 'auto' }}
                  />
                  <span>I would also like to create a requester account. I also coordinate interpreters for an organization and would like to have access to the full requester portal.</span>
                </label>
                {formData.pendingRoles.length > 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginLeft: 26, lineHeight: 1.5 }}>
                    ↳ You&apos;ll find a setup prompt in your portal after you finish here. Just look for the 🔴 on your role switcher.
                  </p>
                )}
              </div>
            )}
            {formData.interpreterType === 'Hearing Interpreter' && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  <input
                    type="checkbox"
                    checked={formData.pendingRoles.includes('requester')}
                    onChange={() => togglePendingRole('requester')}
                    style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0, width: 'auto' }}
                  />
                  <span>I would also like to create a requester account. I also coordinate interpreters for an organization and would like to have access to the full requester portal.</span>
                </label>
                {formData.pendingRoles.length > 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginLeft: 26, lineHeight: 1.5 }}>
                    ↳ You&apos;ll find a setup prompt in your portal after you finish here. Just look for the 🔴 on your role switcher.
                  </p>
                )}
              </div>
            )}
          </FormField>
          <FormField>
            <FieldLabel>Mode of Work *</FieldLabel>
            <SelectInput
              value={formData.modeOfWork}
              onChange={e => updateField('modeOfWork', e.target.value)}
            >
              <option value="">Select…</option>
              <option>Remote only</option>
              <option>On-site only</option>
              <option>Both remote and on-site</option>
            </SelectInput>
            <FieldError>{errors.modeOfWork}</FieldError>
          </FormField>
        </FormRow>
      </FormSection>

      {/* Event Coordination */}
      <FormSection style={{ marginTop: 32 }}>
        <SectionTitle>Event Coordination</SectionTitle>
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '16px 18px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={formData.eventCoordination}
              onChange={e => updateField('eventCoordination', e.target.checked)}
              style={{ width: 'auto', marginTop: 3, accentColor: 'var(--accent)' }}
            />
            <span>I am available to coordinate interpreter teams for complex and/or large-scale events (conferences, summits, multi-day institutional events, and more)</span>
          </label>

          {formData.eventCoordination && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)',
                borderRadius: 8, padding: '12px 14px', fontSize: '0.82rem',
                color: 'var(--muted)', lineHeight: 1.6,
              }}>
                Coordination rates are negotiated directly with the requester. You'll discuss the scope, team size, and your fee once an inquiry comes in.
              </div>
              <FormField>
                <FieldLabel>Brief description of your coordination experience</FieldLabel>
                <textarea
                  placeholder="e.g. I have coordinated interpreter teams for UN General Assembly side events and international academic conferences, managing scheduling, relay logistics, and on-site briefings…"
                  value={formData.coordinationBio}
                  onChange={e => updateField('coordinationBio', e.target.value)}
                  style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '11px 14px',
                    color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.9rem', outline: 'none', width: '100%',
                    boxSizing: 'border-box', resize: 'vertical', minHeight: 80,
                  }}
                />
              </FormField>
            </div>
          )}
        </div>
      </FormSection>

      {/* Regions */}
      <FormSection style={{ marginTop: 32 }}>
        <SectionTitle>Regions Available For Work Travel</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 12, marginTop: -12 }}>
          Select all regions where you are willing and able to work on-site. Remote work is available globally regardless of selection.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {REGIONS.map(r => {
            const isOther = r.label !== '🌍 Worldwide'
            const disabled = isOther && worldwideSelected
            return (
              <div key={r.label} style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                <ToggleTile
                  label={r.label}
                  dotColor={r.color}
                  selected={formData.regions.includes(r.label)}
                  onToggle={() => toggleRegion(r.label)}
                />
              </div>
            )
          })}
        </div>
      </FormSection>

      <FormNav step={1} totalSteps={6} onBack={() => {}} onContinue={validateAndContinue} onSaveDraft={saveDraft} />
    </StepWrapper>
  )
}
