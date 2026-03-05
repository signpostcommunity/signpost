'use client'

import { useForm } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormRow, FormField, FieldLabel,
  TextInput, PasswordInput, SelectInput, TextareaInput, UrlInput,
  ToggleTile, FormNav,
} from './FormFields'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'

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

  function toggleRegion(label: string) {
    const current = formData.regions
    updateField('regions', current.includes(label)
      ? current.filter(r => r !== label)
      : [...current, label]
    )
  }

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

        {/* Or divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <GoogleSignInButton role="interpreter" />
      </FormSection>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', marginBottom: 36 }} />

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
            <FieldLabel>Country *</FieldLabel>
            <SelectInput
              value={formData.country}
              onChange={e => updateField('country', e.target.value)}
            >
              <option value="">Select country…</option>
              <option>United States</option>
              <option>United Kingdom</option>
              <option>Spain</option>
              <option>Australia</option>
              <option>Germany</option>
              <option>France</option>
              <option>Japan</option>
              <option>Brazil</option>
              <option>Canada</option>
              <option>Other</option>
            </SelectInput>
          </FormField>
          <FormField>
            <FieldLabel>City / Region *</FieldLabel>
            <TextInput
              placeholder="Madrid"
              value={formData.city}
              onChange={e => updateField('city', e.target.value)}
            />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField>
            <FieldLabel>Phone / WhatsApp</FieldLabel>
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

        <FormRow>
          <FormField>
            <FieldLabel>Website</FieldLabel>
            <UrlInput
              placeholder="https://yoursite.com"
              value={formData.website}
              onChange={e => updateField('website', e.target.value)}
            />
          </FormField>
          <FormField>
            <FieldLabel>LinkedIn Profile</FieldLabel>
            <UrlInput
              placeholder="https://linkedin.com/in/…"
              value={formData.linkedin}
              onChange={e => updateField('linkedin', e.target.value)}
            />
          </FormField>
        </FormRow>

        <FormRow full>
          <FormField>
            <FieldLabel>Professional Bio *</FieldLabel>
            <TextareaInput
              placeholder="Tell the Deaf community about yourself, your background, your approach to interpreting, and what you're passionate about…"
              value={formData.bio}
              onChange={e => updateField('bio', e.target.value)}
            />
          </FormField>
        </FormRow>
      </FormSection>

      {/* Regions */}
      <FormSection style={{ marginTop: 32 }}>
        <SectionTitle>Regions Available For Work Travel</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 12, marginTop: -12 }}>
          Select all regions where you are willing and able to work on-site. Remote work is available globally regardless of selection.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {REGIONS.map(r => (
            <ToggleTile
              key={r.label}
              label={r.label}
              dotColor={r.color}
              selected={formData.regions.includes(r.label)}
              onToggle={() => toggleRegion(r.label)}
            />
          ))}
        </div>
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
                <TextareaInput
                  placeholder="e.g. I have coordinated interpreter teams for UN General Assembly side events and international academic conferences, managing scheduling, relay logistics, and on-site briefings…"
                  value={formData.coordinationBio}
                  onChange={e => updateField('coordinationBio', e.target.value)}
                  style={{ minHeight: 80 }}
                />
              </FormField>
            </div>
          )}
        </div>
      </FormSection>

      <FormNav step={1} totalSteps={6} onBack={() => {}} onContinue={onContinue} />
    </StepWrapper>
  )
}
