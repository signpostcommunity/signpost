'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import LocationInput from '@/components/ui/LocationInput'
import type { LocationFields } from '@/components/ui/LocationInput'
import { getCountryName, getCountryCode } from '@/lib/countries'
import { PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import InlineVideoCapture from '@/components/ui/InlineVideoCapture'
import { getVideoEmbedUrl } from '@/lib/videoUtils'
import { generateSlug, validateSlug } from '@/lib/slugUtils'
import { resizeImage } from '@/lib/imageUtils'
import { syncNameFields } from '@/lib/nameSync'
import { TIMEZONE_LABELS, getTimezoneLabel } from '@/lib/timezones'
import { QRCodeSVG } from 'qrcode.react'

const SIGNING_STYLES = [
  'ASL',
  'PSE (Pidgin Signed English)',
  'SEE (Signing Exact English)',
  'Tactile ASL',
  'ProTactile',
  'Black ASL',
  'Other',
]

const VOICE_OPTIONS = [
  { value: 'interpreter', label: 'I always use the interpreter for voicing' },
  { value: 'self', label: 'I always voice for myself' },
  { value: 'depends', label: 'It depends on the situation' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
  fontSize: '0.88rem', fontFamily: "'Inter', sans-serif",
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 500,
  color: '#c8cdd8', marginBottom: 6,
}

const fieldGroupStyle: React.CSSProperties = { marginBottom: 18 }

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px',
  color: '#f0f2f8', marginBottom: 14, paddingBottom: 10,
  borderBottom: '1px solid var(--border)',
}

export default function DhhPreferencesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  // Profile fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('')
  const [stateProvince, setStateProvince] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [bio, setBio] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileVideoUrl, setProfileVideoUrl] = useState('')

  // Delete video file from Supabase storage when removing
  async function deleteVideoFromStorage(url: string) {
    if (!url || !url.includes('supabase.co/storage')) return
    try {
      const supabase = createClient()
      const match = url.match(/\/object\/public\/([^/]+)\/(.+)$/)
      if (match) {
        const [, bucket, path] = match
        await supabase.storage.from(bucket).remove([path])
      }
    } catch (e) {
      console.error('Failed to delete video from storage:', e)
    }
  }
  const [shareTextBefore, setShareTextBefore] = useState(true)
  const [shareVideoBefore, setShareVideoBefore] = useState(true)

  // Vanity slug
  const [vanitySlug, setVanitySlug] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [slugEditing, setSlugEditing] = useState(false)
  const [slugSaving, setSlugSaving] = useState(false)
  const [slugError, setSlugError] = useState('')
  const [slugCopied, setSlugCopied] = useState(false)

  // Timezone
  const [timezone, setTimezone] = useState('')
  const [editingTimezone, setEditingTimezone] = useState(false)
  const [timezoneDraft, setTimezoneDraft] = useState('')

  // Comm prefs
  const [signingStyles, setSigningStyles] = useState<string[]>([])
  const [voicePref, setVoicePref] = useState('')
  const [voiceNotes, setVoiceNotes] = useState('')
  const [diPreferred, setDiPreferred] = useState(false)
  const [commNotes, setCommNotes] = useState('')
  const [autoSharePrefList, setAutoSharePrefList] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      setAuthEmail(user.email || '')

      const { data: profile } = await supabase
        .from('deaf_profiles')
        .select('*')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle()

      if (profile) {
        setFirstName(profile.first_name || '')
        setLastName(profile.last_name || '')
        setEmail(profile.email || user.email || '')
        setPronouns(profile.pronouns || '')
        setAddress(profile.address || '')
        setCountry(profile.country || '')
        setStateProvince(profile.state || '')
        setCity(profile.city || '')
        setZip(profile.zip || '')
        setPhotoUrl(profile.photo_url || '')
        setBio(profile.bio || '')
        setProfileVideoUrl(profile.profile_video_url || '')
        setShareTextBefore(profile.share_intro_text_before_confirm !== false)
        setShareVideoBefore(profile.share_intro_video_before_confirm !== false)
        if (profile.vanity_slug) {
          setVanitySlug(profile.vanity_slug)
          setEditSlug(profile.vanity_slug)
        } else if (profile.first_name || profile.last_name) {
          // Auto-generate slug for existing users who don't have one
          const baseSlug = generateSlug(profile.first_name || '', profile.last_name || '').slice(0, 50)
          if (baseSlug && baseSlug.length >= 3) {
            let slug = baseSlug
            let attempt = 1
            while (attempt <= 20) {
              const { data: existing } = await supabase
                .from('deaf_profiles')
                .select('vanity_slug')
                .ilike('vanity_slug', slug)
                .maybeSingle()
              if (!existing) break
              attempt++
              slug = `${baseSlug}-${attempt}`
            }
            const { error: slugErr } = await supabase
              .from('deaf_profiles')
              .update({ vanity_slug: slug })
              .or(`user_id.eq.${user.id},id.eq.${user.id}`)
            if (!slugErr) {
              setVanitySlug(slug)
              setEditSlug(slug)
            }
          }
        }

        setAutoSharePrefList(profile.auto_share_pref_list !== false)

        const tz = (profile.timezone as string) || ''
        setTimezone(tz)
        setTimezoneDraft(tz)

        // Auto-detect timezone on first load if empty, and save silently
        if (!tz) {
          try {
            const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
            if (detected) {
              setTimezone(detected)
              setTimezoneDraft(detected)
              // Silently persist to DB so user doesn't stay NULL
              supabase
                .from('deaf_profiles')
                .update({ timezone: detected, updated_at: new Date().toISOString() })
                .or(`user_id.eq.${user.id},id.eq.${user.id}`)
                .then(({ error }) => {
                  if (error) console.error('[dhh-preferences] silent timezone save failed:', error.message)
                })
            }
          } catch { /* ignore detection errors */ }
        }

        const cp = profile.comm_prefs as Record<string, unknown> | null
        if (cp) {
          setSigningStyles(Array.isArray(cp.signing_styles) ? cp.signing_styles as string[] : cp.signing_style ? [cp.signing_style as string] : [])
          setVoicePref((cp.voice_preference as string) || '')
          setVoiceNotes((cp.voice_notes as string) || '')
          setDiPreferred(!!cp.cdi_preferred || !!cp.di_preferred)
          setCommNotes((cp.notes as string) || '')
        }
      } else {
        setEmail(user.email || '')
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    let uploadFile = file
    if (file.size > 2 * 1024 * 1024) {
      try {
        uploadFile = await resizeImage(file, 2)
        if (uploadFile.size > 2 * 1024 * 1024) {
          showToast('Image is too large even after resizing. Please use a smaller photo.')
          setUploading(false)
          return
        }
      } catch {
        showToast('Could not resize image. Please use a smaller photo.')
        setUploading(false)
        return
      }
    }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const ext = uploadFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, uploadFile, { upsert: true })

    if (uploadError) {
      showToast('Upload failed - please try again')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`
    setPhotoUrl(publicUrl)
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const commPrefs = {
      signing_styles: signingStyles,
      signing_style: signingStyles.join(', '), // backward-compat for CommPrefsDisplay
      voice_preference: voicePref,
      voice_notes: voiceNotes,
      cdi_preferred: diPreferred,
      di_preferred: diPreferred,
      notes: commNotes,
    }

    // TODO: Tech debt - remove deaf_profiles.name column, derive from first_name + last_name
    const updates = syncNameFields({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      pronouns: pronouns.trim(),
      address: address || null,
      country,
      country_name: getCountryName(country) || country || null,
      state: stateProvince,
      city,
      zip: zip || null,
      location: [city, stateProvince].filter(Boolean).join(', ') || null,
      photo_url: photoUrl,
      bio: bio.trim(),
      profile_video_url: profileVideoUrl || null,
      share_intro_text_before_confirm: shareTextBefore,
      share_intro_video_before_confirm: shareVideoBefore,
      auto_share_pref_list: autoSharePrefList,
      comm_prefs: commPrefs,
      timezone: timezone || null,
      updated_at: new Date().toISOString(),
    })

    const { error } = await supabase
      .from('deaf_profiles')
      .update(updates)
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)

    if (error) {
      console.error('[dhh-preferences] save failed:', error.message)
      showToast('Failed to save')
    } else {
      showToast('Preferences saved')
    }
    setSaving(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function toggleSigningStyle(style: string) {
    setSigningStyles(prev =>
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    )
  }

  async function handleSlugSave() {
    const slug = editSlug.toLowerCase().trim()
    const validation = validateSlug(slug)
    if (!validation.valid) {
      setSlugError(validation.error || 'Invalid URL')
      return
    }
    if (slug.length < 3 || slug.length > 50) {
      setSlugError('Must be between 3 and 50 characters')
      return
    }

    setSlugSaving(true)
    setSlugError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSlugSaving(false); return }

    // Check uniqueness
    const { data: existing } = await supabase
      .from('deaf_profiles')
      .select('vanity_slug, id')
      .ilike('vanity_slug', slug)
      .maybeSingle()

    if (existing && existing.id !== user.id) {
      setSlugError('This URL is already in use. Try another.')
      setSlugSaving(false)
      return
    }

    const { error } = await supabase
      .from('deaf_profiles')
      .update({ vanity_slug: slug })
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)

    if (error) {
      console.error('[dhh-preferences] slug save failed:', error.message)
      setSlugError('Failed to save. Please try again.')
    } else {
      setVanitySlug(slug)
      setSlugEditing(false)
      showToast('Request link updated')
    }
    setSlugSaving(false)
  }

  function handleCopyLink() {
    const url = `https://signpost.community/d/${vanitySlug}`
    navigator.clipboard.writeText(url).then(() => {
      setSlugCopied(true)
      setTimeout(() => setSlugCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="dash-page-content" style={{ padding: '48px 56px' }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <PageHeader title="Preferences & Profile" subtitle="Manage your profile and communication preferences." />

      <div style={{ maxWidth: 640 }}>
        {/* ── My Interpreter Request Link ── */}
        {vanitySlug && (
          <div style={{
            marginBottom: 34,
            background: 'rgba(0,229,255,0.03)',
            border: '1px solid rgba(0,229,255,0.15)',
            borderRadius: 'var(--radius)',
            padding: '28px 28px 24px',
          }}>
            {/* Horizontal layout: QR left, info right */}
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* QR Code */}
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  padding: 16,
                  background: '#111118',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}>
                  <QRCodeSVG
                    value={`https://signpost.community/d/${vanitySlug}`}
                    size={200}
                    bgColor="#111118"
                    fgColor="#00e5ff"
                    level="M"
                  />
                </div>
              </div>

              {/* Info column */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{
                  ...sectionHeadingStyle,
                  color: 'var(--accent)',
                  borderBottomColor: 'rgba(0,229,255,0.15)',
                  marginTop: 0,
                }}>
                  My Interpreter Request Link
                </h3>

                <p style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.7, marginTop: 0, marginBottom: 14 }}>
                  Share this link with anyone who books interpreters for you. They can use it to connect with your preferences and book interpreters based on your roster.
                </p>

                {/* URL display + Copy on same row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <code style={{
                    flex: 1, minWidth: 160,
                    padding: '10px 14px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    color: 'var(--accent)',
                    fontFamily: 'monospace',
                    userSelect: 'all',
                    wordBreak: 'break-all',
                  }}>
                    signpost.community/d/{vanitySlug}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      padding: '10px 20px',
                      background: slugCopied ? 'rgba(52,211,153,0.15)' : 'rgba(0,229,255,0.1)',
                      border: `1px solid ${slugCopied ? 'rgba(52,211,153,0.3)' : 'rgba(0,229,255,0.3)'}`,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem', fontWeight: 600,
                      color: slugCopied ? '#34d399' : 'var(--accent)',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {slugCopied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 14px' }}>
                  Show this to anyone who books interpreters for you
                </p>

                {/* Custom URL */}
                <div>
                  <label style={{
                    display: 'block', fontSize: '13px', fontWeight: 500,
                    color: '#c8cdd8', marginBottom: 6,
                  }}>
                    Custom URL
                  </label>
                  {!slugEditing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        signpost.community/d/<span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{vanitySlug}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSlugEditing(true)}
                        style={{
                          padding: '6px 14px',
                          background: 'none',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Slug editor - only visible when editing */}
            {slugEditing && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    signpost.community/d/
                  </span>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={e => {
                      setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      setSlugError('')
                    }}
                    maxLength={50}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      fontFamily: 'monospace',
                      borderColor: slugError ? 'rgba(255,107,133,0.5)' : 'var(--border)',
                    }}
                    aria-label="Custom URL slug"
                    aria-invalid={!!slugError}
                    aria-describedby={slugError ? 'slug-error' : undefined}
                  />
                </div>
                {slugError && (
                  <p id="slug-error" style={{ fontSize: '0.78rem', color: 'var(--accent3)', marginTop: 0, marginBottom: 8 }}>
                    {slugError}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleSlugSave}
                    disabled={slugSaving}
                    style={{
                      padding: '8px 20px',
                      background: 'rgba(0,229,255,0.1)',
                      border: '1px solid rgba(0,229,255,0.3)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem', fontWeight: 600,
                      color: 'var(--accent)',
                      cursor: slugSaving ? 'wait' : 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      opacity: slugSaving ? 0.6 : 1,
                    }}
                  >
                    {slugSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSlugEditing(false)
                      setEditSlug(vanitySlug)
                      setSlugError('')
                    }}
                    style={{
                      padding: '8px 20px',
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Profile Section ── */}
        <div style={{ marginBottom: 34 }}>
          <h3 style={sectionHeadingStyle}>Profile</h3>

          {/* Photo */}
          <div style={{ ...fieldGroupStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#fff',
              }}>
                {(firstName?.[0] || '').toUpperCase()}{(lastName?.[0] || '').toUpperCase()}
              </div>
            )}
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  background: 'rgba(157,135,255,0.1)', border: '1px solid rgba(157,135,255,0.3)',
                  borderRadius: 'var(--radius-sm)', padding: '7px 16px',
                  fontSize: '0.82rem', fontWeight: 600, color: '#9d87ff',
                  cursor: uploading ? 'wait' : 'pointer',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {uploading ? 'Uploading...' : 'Upload photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4, marginBottom: 0 }}>
                JPG or PNG. Large photos are auto-resized.
              </p>
            </div>
          </div>

          {/* Name */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>First name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Email */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                ...inputStyle,
                ...(email === authEmail ? { opacity: 0.7 } : {}),
              }}
              readOnly={email === authEmail}
            />
            {email === authEmail && (
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4, marginBottom: 0 }}>
                Linked to your sign-in account
              </p>
            )}
          </div>

          {/* Pronouns */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Pronouns</label>
            <input
              type="text"
              value={pronouns}
              onChange={e => setPronouns(e.target.value)}
              placeholder="e.g. she/her, he/him, they/them"
              style={inputStyle}
            />
          </div>

          {/* Location */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Location</label>
            <LocationInput
              address={address}
              city={city}
              state={stateProvince}
              zip={zip}
              country={country}
              onChange={(loc: LocationFields) => {
                setAddress(loc.address)
                setCity(loc.city)
                setStateProvince(loc.state)
                setZip(loc.zip)
                setCountry(loc.country)
              }}
              showLocationName={false}
              showMeetingLink={false}
              defaultCountry={country || 'US'}
              accent="purple"
            />
          </div>

          {/* Timezone */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Timezone</label>
            {!editingTimezone ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: '#f0f2f8', fontWeight: 500 }}>
                    {timezone ? getTimezoneLabel(timezone) : 'Not set'}
                  </div>
                  {timezone && (
                    <div style={{ fontSize: 13, color: '#96a0b8', marginTop: 4 }}>
                      Saved to your account
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setTimezoneDraft(timezone); setEditingTimezone(true) }}
                  style={{
                    background: 'transparent', border: '1px solid rgba(167,139,250,0.3)',
                    borderRadius: 10, padding: '8px 16px', fontSize: '13.5px',
                    color: '#a78bfa', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Select your timezone</label>
                  <select
                    value={timezoneDraft}
                    onChange={e => setTimezoneDraft(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select timezone...</option>
                    {Object.entries(TIMEZONE_LABELS).map(([tz, label]) => (
                      <option key={tz} value={tz}>{label}</option>
                    ))}
                    {timezoneDraft && !TIMEZONE_LABELS[timezoneDraft] && (
                      <option value={timezoneDraft}>{timezoneDraft}</option>
                    )}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => { setTimezone(timezoneDraft); setEditingTimezone(false) }}
                    style={{
                      background: '#a78bfa', color: '#0a0a0f', border: 'none',
                      borderRadius: 10, padding: '8px 16px', fontSize: '13.5px',
                      fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTimezoneDraft(timezone); setEditingTimezone(false) }}
                    style={{
                      background: 'transparent', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '8px 16px', fontSize: '13.5px',
                      color: 'var(--muted)', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Introduce Yourself Section ── */}
        <div style={{
          marginBottom: 34,
          background: 'rgba(157,135,255,0.03)',
          border: '1px solid rgba(157,135,255,0.15)',
          borderRadius: 'var(--radius)',
          padding: '28px 28px 24px',
        }}>
          <h3 style={{
            ...sectionHeadingStyle,
            color: '#f0f2f8',
            display: 'flex', alignItems: 'baseline', gap: 8,
          }}>
            Introduce Yourself
            <span style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8' }}>(optional)</span>
          </h3>

          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.7, marginTop: 0, marginBottom: 24 }}>
            Give a brief introduction, with whatever information you want.<br />
            For example: where you grew up, if you went to a Deaf school or mainstream, etc.<br />
            <strong style={{ color: 'var(--text)' }}>You can write, record a video, or both.</strong>
          </p>

          {/* ── Written sub-section ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' as const,
              letterSpacing: '0.08em', color: '#a78bfa', marginBottom: 10,
            }}>
              Written
            </div>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 500))}
              placeholder="Tell interpreters a little about yourself..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'right', marginTop: 4 }}>
              {bio.length} / 500
            </div>

            {/* Sharing toggle for text */}
            <button
              type="button"
              onClick={() => setShareTextBefore(!shareTextBefore)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 14px', marginTop: 8,
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                border: `1px solid ${shareTextBefore ? 'rgba(157,135,255,0.3)' : 'var(--border)'}`,
                background: shareTextBefore ? 'rgba(157,135,255,0.04)' : 'var(--surface2)',
                transition: 'all 0.15s', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)', flex: 1, fontFamily: "'Inter', sans-serif" }}>
                {shareTextBefore
                  ? 'Share with interpreters before they are confirmed'
                  : 'Wait until interpreters are confirmed to share'}
              </span>
              <span style={{
                width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                background: shareTextBefore ? '#9d87ff' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s',
                display: 'inline-block',
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff', position: 'absolute', top: 3,
                  left: shareTextBefore ? 21 : 3,
                  transition: 'left 0.2s',
                }} />
              </span>
            </button>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', marginBottom: 24 }} />

          {/* ── Video sub-section ── */}
          <div>
            <div style={{
              fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' as const,
              letterSpacing: '0.08em', color: '#a78bfa', marginBottom: 4,
            }}>
              Video
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 0, marginBottom: 14, lineHeight: 1.5 }}>
              Record, upload, or link a video. 2 minutes max.
            </p>

            {profileVideoUrl ? (
              <div>
                {(() => {
                  const embedUrl = getVideoEmbedUrl(profileVideoUrl)
                  if (!embedUrl) return null
                  return embedUrl.includes('supabase.co/storage') ? (
                    <video controls width="100%" src={embedUrl} style={{ borderRadius: 12, border: '1px solid var(--border)', maxHeight: 300, background: '#000', marginBottom: 12 }} />
                  ) : (
                    <iframe width="100%" height="280" src={embedUrl} title="Intro video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                      style={{ borderRadius: 12, border: 'none', marginBottom: 12 }} />
                  )
                })()}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setProfileVideoUrl('')}
                    style={{
                      background: 'none', border: '1px solid rgba(157,135,255,0.4)',
                      borderRadius: 'var(--radius-sm)', padding: '7px 16px',
                      fontSize: '0.82rem', fontWeight: 600, color: '#9d87ff',
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Replace video
                  </button>
                  <button
                    type="button"
                    onClick={() => { deleteVideoFromStorage(profileVideoUrl); setProfileVideoUrl('') }}
                    /* Save handler converts '' to null via profileVideoUrl || null */
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '7px 16px',
                      fontSize: '0.82rem', color: 'var(--muted)',
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Remove video
                  </button>
                </div>
              </div>
            ) : (
              <InlineVideoCapture
                onVideoSaved={(url) => setProfileVideoUrl(url)}
                accentColor="#7b61ff"
                storageBucket="videos"
                storagePath="deaf"
              />
            )}

            {/* Sharing toggle for video */}
            <button
              type="button"
              onClick={() => setShareVideoBefore(!shareVideoBefore)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 14px', marginTop: 14,
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                border: `1px solid ${shareVideoBefore ? 'rgba(157,135,255,0.3)' : 'var(--border)'}`,
                background: shareVideoBefore ? 'rgba(157,135,255,0.04)' : 'var(--surface2)',
                transition: 'all 0.15s', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)', flex: 1, fontFamily: "'Inter', sans-serif" }}>
                {shareVideoBefore
                  ? 'Share with interpreters before they are confirmed'
                  : 'Wait until interpreters are confirmed to share'}
              </span>
              <span style={{
                width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                background: shareVideoBefore ? '#9d87ff' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s',
                display: 'inline-block',
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff', position: 'absolute', top: 3,
                  left: shareVideoBefore ? 21 : 3,
                  transition: 'left 0.2s',
                }} />
              </span>
            </button>
          </div>

          {/* Cross-link to appointment-specific video */}
          <p style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 18, marginBottom: 0, lineHeight: 1.5, opacity: 0.85 }}>
            To give interpreters context about a specific appointment, add a video from the appointment card in{' '}
            <a href="/dhh/dashboard/requests" style={{ color: '#9d87ff', textDecoration: 'underline' }}>My Requests</a>.
          </p>
        </div>

        {/* ── Communication Preferences Section ── */}
        <div style={{ marginBottom: 34 }}>
          <h3 style={sectionHeadingStyle}>Communication preferences</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
            This information is shared with interpreters when you make a request, and when you are tagged in a request (interpreter is requested by someone else). It helps them prepare and decide if they&apos;re a good match.
          </p>

          {/* Signing style - multi-select pills */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Signing style</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SIGNING_STYLES.map(style => {
                const selected = signingStyles.includes(style)
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleSigningStyle(style)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 10,
                      border: `1px solid ${selected ? 'rgba(157,135,255,0.5)' : 'var(--border)'}`,
                      background: selected ? 'rgba(157,135,255,0.1)' : 'var(--surface2)',
                      color: selected ? '#9d87ff' : 'var(--muted)',
                      fontSize: '0.82rem', fontWeight: selected ? 600 : 400,
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.15s',
                    }}
                  >
                    {style}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Voice interpreting - radio */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Voice interpreting</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {VOICE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${voicePref === opt.value ? 'rgba(157,135,255,0.4)' : 'var(--border)'}`,
                    background: voicePref === opt.value ? 'rgba(157,135,255,0.06)' : 'var(--surface2)',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="voicePref"
                    value={opt.value}
                    checked={voicePref === opt.value}
                    onChange={() => setVoicePref(opt.value)}
                    style={{ accentColor: '#9d87ff' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: voicePref === opt.value ? 'var(--text)' : 'var(--muted)' }}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
            {voicePref === 'depends' && (
              <div style={{ marginTop: 10 }}>
                <input
                  type="text"
                  value={voiceNotes}
                  onChange={e => setVoiceNotes(e.target.value)}
                  placeholder="Tell interpreters more about when you voice and when you don't"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* DI preferred - toggle */}
          <div style={fieldGroupStyle}>
            <button
              type="button"
              onClick={() => setDiPreferred(!diPreferred)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '12px 16px',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                border: `1px solid ${diPreferred ? 'rgba(157,135,255,0.4)' : 'var(--border)'}`,
                background: diPreferred ? 'rgba(157,135,255,0.06)' : 'var(--surface2)',
                transition: 'all 0.15s', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: diPreferred ? 'var(--text)' : 'var(--muted)', flex: 1 }}>
                I prefer working with a Deaf Interpreter (DI)
              </span>
              {/* Toggle track */}
              <span style={{
                width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                background: diPreferred ? '#9d87ff' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s',
                display: 'inline-block',
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff', position: 'absolute', top: 3,
                  left: diPreferred ? 21 : 3,
                  transition: 'left 0.2s',
                }} />
              </span>
            </button>
          </div>

          {/* Communication notes */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Communication notes</label>
            <textarea
              value={commNotes}
              onChange={e => setCommNotes(e.target.value)}
              placeholder="Anything else interpreters should know about how you communicate? For example: I use a lot of fingerspelling, I prefer a specific regional signing style, I may need extra time for processing."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
            />
          </div>
        </div>

        {/* ── Interpreter List Sharing Section ── */}
        <div style={{ marginBottom: 34 }}>
          <h3 style={sectionHeadingStyle}>Interpreter list sharing</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
            When someone requests an interpreter for you (through a booking form, your QR code, or your request link), should they automatically see your preferred interpreter list?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${autoSharePrefList ? 'rgba(157,135,255,0.4)' : 'var(--border)'}`,
                background: autoSharePrefList ? 'rgba(157,135,255,0.06)' : 'var(--surface2)',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="autoSharePrefList"
                checked={autoSharePrefList}
                onChange={() => setAutoSharePrefList(true)}
                style={{ accentColor: '#9d87ff' }}
              />
              <div>
                <span style={{ fontSize: '0.85rem', color: autoSharePrefList ? 'var(--text)' : 'var(--muted)', fontWeight: 600 }}>
                  Yes, share automatically (recommended)
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Requesters will immediately see interpreters you trust, leading to better matches.
                </p>
              </div>
            </label>

            <label
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${!autoSharePrefList ? 'rgba(157,135,255,0.4)' : 'var(--border)'}`,
                background: !autoSharePrefList ? 'rgba(157,135,255,0.06)' : 'var(--surface2)',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="autoSharePrefList"
                checked={!autoSharePrefList}
                onChange={() => setAutoSharePrefList(false)}
                style={{ accentColor: '#9d87ff' }}
              />
              <div>
                <span style={{ fontSize: '0.85rem', color: !autoSharePrefList ? 'var(--text)' : 'var(--muted)', fontWeight: 600 }}>
                  Ask me first
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  You will be notified each time and can approve or decline.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Save button */}
        <button
          className="dhh-prefs-save-btn"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 32px',
            background: saving ? 'var(--surface2)' : 'linear-gradient(135deg, #9d87ff, #7b61ff)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: '#fff', fontSize: '0.92rem', fontWeight: 700,
            fontFamily: "'Inter', sans-serif", cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 'var(--radius)', padding: '14px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.85rem', color: '#34d399',
        }}>
          {toast}
        </div>
      )}

      <DashMobileStyles />

      <style>{`
        @media (max-width: 640px) {
          .dash-page-content button[type="button"]:last-of-type,
          .dhh-prefs-save-btn { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
