'use client'

import { useForm } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormRow, FormField, FieldLabel,
  TextInput, PasswordInput, SelectInput, TextareaInput,
  ToggleTile, FormNav,
} from './FormFields'

function CommunityToggle({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={{
      background: 'var(--surface2)', border: `1px solid ${checked ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)', padding: '14px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      transition: 'border-color 0.2s',
    }}>
      <div>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--accent)' : 'var(--border)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          width: 20, height: 20, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  )
}
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'
import LocationPicker from '@/components/shared/LocationPicker'

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

        {/* Or label */}
        <p style={{ color: 'var(--muted)', fontSize: '0.78rem', textAlign: 'center', margin: '4px 0 12px' }}>
          or continue with
        </p>

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
            {formData.interpreterType === 'Deaf Interpreter' && (
              <p style={{
                color: 'var(--muted)',
                fontSize: '0.78rem',
                marginTop: 6,
                lineHeight: 1.5,
              }}>
                After completing signup, you'll have the option to add a D/DB/HH personal or requester profile to your account.
              </p>
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

        <FormRow full>
          <FormField>
            <FieldLabel>Professional Bio *</FieldLabel>
            <TextareaInput
              placeholder="Tell the signpost community about yourself: your background, professional experience, specializations, etc."
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

      {/* Community & Identity */}
      <FormSection style={{ marginTop: 32 }}>
        <SectionTitle>Community &amp; Identity (Optional)</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12 }}>
          Help requesters find interpreters who share their lived experience. All fields are optional and visible on your public profile.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CommunityToggle
            label="LGBTQ+"
            description="I identify as a member of the LGBTQ+ community"
            checked={formData.lgbtq}
            onChange={v => updateField('lgbtq', v)}
          />
          <CommunityToggle
            label="Deaf-parented"
            description="I was raised by Deaf parent(s) (CODA)"
            checked={formData.deafParented}
            onChange={v => updateField('deafParented', v)}
          />
          <CommunityToggle
            label="BIPOC"
            description="I identify as Black, Indigenous, or a Person of Color"
            checked={formData.bipoc}
            onChange={v => updateField('bipoc', v)}
          />
          {formData.bipoc && (
            <div style={{ paddingLeft: 20, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Black/African American', 'Indigenous/Native American', 'Hispanic/Latine', 'Asian/Pacific Islander', 'Middle Eastern/North African', 'Multiracial'].map(opt => {
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
                      padding: '5px 12px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 500,
                      border: `1px solid ${selected ? 'rgba(0,229,255,0.5)' : 'var(--border)'}`,
                      background: selected ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                      color: selected ? 'var(--accent)' : 'var(--muted)',
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          )}
          <CommunityToggle
            label="Religious Affiliation"
            description="I'd like to share my religious or spiritual background"
            checked={formData.religiousAffiliation}
            onChange={v => updateField('religiousAffiliation', v)}
          />
          {formData.religiousAffiliation && (
            <div style={{ paddingLeft: 20, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Christian', 'Jewish', 'Muslim', 'Buddhist', 'Hindu', 'Sikh', 'Other'].map(opt => {
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
                      padding: '5px 12px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 500,
                      border: `1px solid ${selected ? 'rgba(0,229,255,0.5)' : 'var(--border)'}`,
                      background: selected ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                      color: selected ? 'var(--accent)' : 'var(--muted)',
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          )}
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '14px 18px',
          }}>
            <FieldLabel>Gender Identity (optional)</FieldLabel>
            <SelectInput
              value={formData.genderIdentity}
              onChange={e => updateField('genderIdentity', e.target.value)}
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="nonbinary">Non-binary</option>
            </SelectInput>
          </div>
        </div>
      </FormSection>

      <FormNav step={1} totalSteps={6} onBack={() => {}} onContinue={onContinue} />
    </StepWrapper>
  )
}
