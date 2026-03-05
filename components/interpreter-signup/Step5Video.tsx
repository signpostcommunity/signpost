'use client'

import { useState, useRef } from 'react'
import { useForm } from './FormContext'
import { createClient } from '@/lib/supabase/client'
import {
  StepWrapper, FormSection, SectionTitle, FormField, FieldLabel,
  UrlInput, TextareaInput, FormNav,
} from './FormFields'

const MAX_PHOTO_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024 // 200MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png']
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

function fileExt(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || 'bin'
}

export default function Step5Video({ onBack, onContinue }: {
  onBack: () => void
  onContinue: () => void
}) {
  const { formData, updateField } = useForm()
  const supabase = createClient()

  // Photo state
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')

  // Video state
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoError, setVideoError] = useState('')

  async function getUserId() {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setPhotoError('Please select a JPG or PNG image.')
      return
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError('Image must be under 5MB.')
      return
    }

    const userId = await getUserId()
    if (!userId) {
      setPhotoError('You must be signed in to upload. Complete Step 1 first.')
      return
    }

    setPhotoUploading(true)
    const path = `${userId}/${Date.now()}.${fileExt(file)}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

    if (error) {
      setPhotoError(error.message)
      setPhotoUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    updateField('avatarUrl', publicUrl)
    setPhotoUploading(false)
  }

  async function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoError('')

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setVideoError('Please select an MP4, MOV, or WebM video.')
      return
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setVideoError(`Video must be under 200MB. Your file is ${(file.size / 1024 / 1024).toFixed(0)}MB.`)
      return
    }

    const userId = await getUserId()
    if (!userId) {
      setVideoError('You must be signed in to upload. Complete Step 1 first.')
      return
    }

    setVideoUploading(true)
    const path = `${userId}/${Date.now()}.${fileExt(file)}`
    const { error } = await supabase.storage.from('interpreter-videos').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

    if (error) {
      setVideoError(error.message)
      setVideoUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('interpreter-videos').getPublicUrl(path)
    updateField('videoUrl', publicUrl)
    setVideoUploading(false)
  }

  return (
    <StepWrapper>
      {/* Profile Photo */}
      <FormSection>
        <SectionTitle>Profile Photo</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
          This photo appears on your directory card and profile page. Use a clear, professional headshot. Deaf clients will see this before reaching out.
        </p>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handlePhotoSelect}
          style={{ display: 'none' }}
        />
        <div
          onClick={() => !photoUploading && photoInputRef.current?.click()}
          style={{
            border: `2px dashed ${formData.avatarUrl ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            padding: formData.avatarUrl ? 20 : 40,
            textAlign: 'center',
            cursor: photoUploading ? 'wait' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'
            e.currentTarget.style.background = 'rgba(0,229,255,0.02)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = formData.avatarUrl ? 'rgba(0,229,255,0.4)' : 'var(--border)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {photoUploading ? (
            <div style={{ color: 'var(--accent)', fontSize: '0.88rem', padding: 20 }}>
              Uploading photo...
            </div>
          ) : formData.avatarUrl ? (
            <>
              <img
                src={formData.avatarUrl}
                alt="Profile preview"
                style={{
                  width: 120, height: 120, borderRadius: '50%',
                  objectFit: 'cover', border: '2px solid rgba(0,229,255,0.3)',
                }}
              />
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
                Click to replace
              </p>
            </>
          ) : (
            <>
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
                JPG or PNG &middot; Max 5MB &middot; Square crop recommended
              </p>
            </>
          )}
        </div>
        {photoError && (
          <p style={{ color: 'var(--accent3)', fontSize: '0.82rem', marginTop: 8 }}>
            {photoError}
          </p>
        )}
      </FormSection>

      {/* Introduction Video */}
      <FormSection>
        <SectionTitle>Introduction Video</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
          Upload a short video (about 90 seconds) of yourself. This can either be an introduction, or a (non-confidential) work sample. This is the first thing Deaf clients will see — show them your signing style, your languages, and your personality. No production quality required, just authentic and clear.
        </p>

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleVideoSelect}
          style={{ display: 'none' }}
        />

        {/* Upload area */}
        <div
          onClick={() => !videoUploading && videoInputRef.current?.click()}
          style={{
            border: `2px dashed ${formData.videoUrl && !formData.videoUrl.startsWith('http') ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            padding: 48,
            textAlign: 'center',
            cursor: videoUploading ? 'wait' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'
            e.currentTarget.style.background = 'rgba(0,229,255,0.02)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = formData.videoUrl ? 'rgba(0,229,255,0.4)' : 'var(--border)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {videoUploading ? (
            <div style={{ color: 'var(--accent)', fontSize: '0.88rem' }}>
              Uploading video — this may take a moment...
            </div>
          ) : formData.videoUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p style={{ color: 'var(--accent)', fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>
                Video uploaded
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
                Click to replace
              </p>
            </div>
          ) : (
            <>
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
                MP4, MOV or WebM &middot; Max 200MB
              </p>
            </>
          )}
        </div>
        {videoError && (
          <p style={{ color: 'var(--accent3)', fontSize: '0.82rem', marginTop: 8 }}>
            {videoError}
          </p>
        )}

        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 12 }}>
          Or paste a link to an existing video:
        </p>
        <FormField style={{ marginTop: 8 }}>
          <UrlInput
            placeholder="https://youtube.com/... or https://vimeo.com/..."
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
            placeholder="In this video I introduce myself in ASL and International Sign and explain my background in medical and conference interpreting..."
            value={formData.videoDescription}
            onChange={e => updateField('videoDescription', e.target.value)}
          />
        </FormField>
      </FormSection>

      <FormNav step={5} totalSteps={6} onBack={onBack} onContinue={onContinue} />
    </StepWrapper>
  )
}
