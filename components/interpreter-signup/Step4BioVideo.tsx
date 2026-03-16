'use client'

import { useState } from 'react'
import { useForm } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormField, FieldLabel,
  FormNav,
} from './FormFields'
import { getVideoEmbedUrl } from '@/lib/videoUtils'
import InlineVideoCapture from '@/components/ui/InlineVideoCapture'

const inputStyle: React.CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '11px 14px',
  color: 'var(--text)',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--accent)'
  e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.07)'
}
function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--border)'
  e.target.style.boxShadow = 'none'
}

export default function Step4BioVideo({ onBack, onContinue }: {
  onBack: () => void
  onContinue: () => void
}) {
  const { formData, updateField, saveDraft } = useForm()
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null)
  // videoRecorderOpen removed — using inline capture

  return (
    <StepWrapper>
      {/* About You — three guided prompts */}
      <FormSection>
        <SectionTitle>About You</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20, marginTop: -12, lineHeight: 1.6 }}>
          These prompts help you write a compelling profile. Your responses appear as a single About section on your public profile.
        </p>

        {/* Bio field 1: Background */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
            Describe your interpreting and community background <span style={{ color: 'var(--accent3)' }}>*</span>
          </label>
          <textarea
            value={formData.bio}
            onChange={e => { if (e.target.value.length <= 500) updateField('bio', e.target.value) }}
            placeholder="Share your background, how you came to interpreting, and your connection to the Deaf community."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: 4, color: formData.bio.length > 450 ? '#ff7e45' : 'var(--muted)' }}>
            {formData.bio.length} / 500 characters
          </div>
        </div>

        {/* Bio field 2: Specializations */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
            What settings or populations do you specialize in serving, and what draws you to that work? <span style={{ color: 'var(--accent3)' }}>*</span>
          </label>
          <textarea
            value={formData.bioSpecializations}
            onChange={e => { if (e.target.value.length <= 500) updateField('bioSpecializations', e.target.value) }}
            placeholder="Tell us about the settings you work in and why they matter to you."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: 4, color: formData.bioSpecializations.length > 450 ? '#ff7e45' : 'var(--muted)' }}>
            {formData.bioSpecializations.length} / 500 characters
          </div>
        </div>

        {/* Bio field 3: Extra */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
            Something about my background or approach that doesn&apos;t fit neatly into a checkbox:
          </label>
          <textarea
            value={formData.bioExtra}
            onChange={e => { if (e.target.value.length <= 300) updateField('bioExtra', e.target.value) }}
            placeholder="Optional — share anything that makes your work yours."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: 4, color: formData.bioExtra.length > 250 ? '#ff7e45' : 'var(--muted)' }}>
            {formData.bioExtra.length} / 300
          </div>
        </div>
      </FormSection>

      {/* Introduction Video */}
      <FormSection>
        <SectionTitle>INTRO VIDEO</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12 }}>
          Record a short intro video so clients can see your signing style before they request you.
        </p>

        {formData.videoUrl ? (
          <div style={{ marginBottom: 16 }}>
            {(() => {
              const embedUrl = getVideoEmbedUrl(formData.videoUrl)
              if (!embedUrl) return null
              return embedUrl.includes('supabase.co/storage') ? (
                <video controls width="100%" style={{ borderRadius: 12, border: '1px solid var(--border)', maxHeight: 340, background: '#000' }} src={embedUrl} />
              ) : (
                <iframe width="100%" height="315" src={embedUrl} title="Introduction video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                  style={{ borderRadius: 12, border: 'none' }} />
              )
            })()}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={() => updateField('videoUrl', '')}
                style={{
                  background: 'none', border: '1px solid rgba(0,229,255,0.4)',
                  borderRadius: 8, padding: '8px 16px', color: 'var(--accent)',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
                }}
              >
                Replace video
              </button>
              <button
                type="button"
                onClick={() => updateField('videoUrl', '')}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 16px', color: 'var(--muted)',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <InlineVideoCapture
            onVideoSaved={(url) => {
              updateField('videoUrl', url)
            }}
            accentColor="#00e5ff"
            storageBucket="interpreter-videos"
          />
        )}
      </FormSection>

      {/* Video Description */}
      <FormSection>
        <SectionTitle>Video Description</SectionTitle>
        <FormField>
          <FieldLabel>Brief description of your video (shown to clients)</FieldLabel>
          <textarea
            value={formData.videoDescription}
            onChange={e => updateField('videoDescription', e.target.value)}
            placeholder="In this video I introduce myself in ASL and explain my background..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </FormField>
      </FormSection>

      <FormNav step={4} totalSteps={6} onBack={onBack} onContinue={onContinue} onSaveDraft={saveDraft} />
    </StepWrapper>
  )
}
