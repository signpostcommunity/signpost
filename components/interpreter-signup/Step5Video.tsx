'use client'

import { useForm } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormField, FieldLabel,
  UrlInput, TextareaInput, FormNav,
} from './FormFields'

export default function Step5Video({ onBack, onContinue }: {
  onBack: () => void
  onContinue: () => void
}) {
  const { formData, updateField } = useForm()

  return (
    <StepWrapper>
      {/* Profile Photo */}
      <FormSection>
        <SectionTitle>Profile Photo</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
          This photo appears on your directory card and profile page. Use a clear, professional headshot. Deaf clients will see this before reaching out.
        </p>
        <div
          style={{
            border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
            padding: 40, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'
            e.currentTarget.style.background = 'rgba(0,229,255,0.02)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <div style={{ opacity: 0.5 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="15" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 34c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
            <strong style={{ color: 'var(--accent)' }}>Click to upload or drag &amp; drop</strong>
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
            JPG or PNG · Max 5MB · Square crop recommended
          </p>
        </div>
      </FormSection>

      {/* Introduction Video */}
      <FormSection>
        <SectionTitle>Introduction Video</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
          Upload a short video (about 90 seconds) of yourself. This can either be an introduction, or a (non-confidential) work sample. This is the first thing Deaf clients will see — show them your signing style, your languages, and your personality. No production quality required, just authentic and clear.
        </p>

        {/* Upload area */}
        <div
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius)',
            padding: 48,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'
            e.currentTarget.style.background = 'rgba(0,229,255,0.02)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.5 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="6" y="14" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 20l6-6 6 6M20 14v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 10h24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
            <strong style={{ color: 'var(--accent)' }}>Click to upload or drag &amp; drop</strong>
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: 6, marginBottom: 0 }}>
            MP4, MOV or WebM · Max 500MB
          </p>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 12 }}>
          Or paste a link to an existing video:
        </p>
        <FormField style={{ marginTop: 8 }}>
          <UrlInput
            placeholder="https://youtube.com/… or https://vimeo.com/…"
            value={formData.videoUrl}
            onChange={e => updateField('videoUrl', e.target.value)}
          />
        </FormField>
      </FormSection>

      {/* Video Description */}
      <FormSection>
        <SectionTitle>Video Description</SectionTitle>
        <FormField>
          <FieldLabel>Brief description of your video (shown to clients)</FieldLabel>
          <TextareaInput
            placeholder="In this video I introduce myself in ASL and International Sign and explain my background in medical and conference interpreting…"
            value={formData.videoDescription}
            onChange={e => updateField('videoDescription', e.target.value)}
          />
        </FormField>
      </FormSection>

      <FormNav step={5} totalSteps={6} onBack={onBack} onContinue={onContinue} />
    </StepWrapper>
  )
}
