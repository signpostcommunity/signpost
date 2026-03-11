'use client'

import { useState, useRef } from 'react'
import { useForm } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormRow, FormField, FieldLabel,
  TextInput, PasswordInput, SelectInput,
  ToggleTile, FormNav,
} from './FormFields'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'
import LocationPicker from '@/components/shared/LocationPicker'
import { createClient } from '@/lib/supabase/client'

const REGIONS = [
  { label: '🌍 Worldwide', color: '#00e5ff' },
  { label: 'NA — North America', color: '#f97316' },
  { label: 'LATAM — Latin America & Caribbean', color: '#a78bfa' },
  { label: 'EU — Europe', color: '#60a5fa' },
  { label: 'AF — Africa', color: '#34d399' },
  { label: 'ME — Middle East', color: '#fb923c' },
  { label: 'SA — South & Central Asia', color: '#f472b6' },
  { label: 'EA — East & Southeast Asia', color: '#facc15' },
  { label: 'OC — Oceania & Pacific', color: '#4dd9ac' },
]

export default function Step1Personal({ onContinue }: { onContinue: () => void }) {
  const { formData, updateField } = useForm()
  const supabase = createClient()

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

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

    if (file.size > 2 * 1024 * 1024) {
      setUploadMsg({ text: 'File must be under 2 MB.', type: 'error' })
      return
    }

    setUploading(true)
    setUploadMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUploading(false)
      setUploadMsg({ text: 'You must be signed in to upload. Complete account creation first.', type: 'error' })
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

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
      {/* Account credentials — top of form, before everything else */}
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
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: '#fff',
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
              JPG, PNG, or WebP. Max 2 MB.
            </div>
            {uploadMsg && (
              <div style={{
                fontSize: '0.78rem', marginTop: 6,
                color: uploadMsg.type === 'success' ? '#34d399' : 'var(--accent3)',
              }}>{uploadMsg.text}</div>
            )}
          </div>
        </div>
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
          </FormField>
          <FormField>
            <FieldLabel>Last Name *</FieldLabel>
            <TextInput
              placeholder="Reyes"
              value={formData.lastName}
              onChange={e => updateField('lastName', e.target.value)}
            />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField>
            <FieldLabel>Pronouns</FieldLabel>
            <SelectInput
              value={formData.pronouns}
              onChange={e => updateField('pronouns', e.target.value)}
            >
              <option value="">Select…</option>
              <option>she/her</option>
              <option>he/him</option>
              <option>they/them</option>
              <option>she/they</option>
              <option>he/they</option>
              <option>Other</option>
            </SelectInput>
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

        <FormRow>
          <FormField>
            <FieldLabel>Phone / VP</FieldLabel>
            <TextInput
              type="tel"
              placeholder="+1 555 000 0000"
              value={formData.phone}
              onChange={e => updateField('phone', e.target.value)}
            />
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
            </SelectInput>
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
                    ↳ You&apos;ll find a setup prompt in your portal after you finish here — just look for the 🔴 on your role switcher.
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
                    ↳ You&apos;ll find a setup prompt in your portal after you finish here — just look for the 🔴 on your role switcher.
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

      <FormNav step={1} totalSteps={6} onBack={() => {}} onContinue={onContinue} />
    </StepWrapper>
  )
}
