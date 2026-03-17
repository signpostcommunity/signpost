'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import LocationPicker from '@/components/shared/LocationPicker'
import { PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import InlineVideoCapture from '@/components/ui/InlineVideoCapture'
import { getVideoEmbedUrl } from '@/lib/videoUtils'

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
  fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.82rem', fontWeight: 600,
  color: 'var(--text)', marginBottom: 6,
}

const fieldGroupStyle: React.CSSProperties = { marginBottom: 18 }

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1rem',
  marginBottom: 16, paddingBottom: 10,
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
  const [country, setCountry] = useState('')
  const [stateProvince, setStateProvince] = useState('')
  const [city, setCity] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [bio, setBio] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileVideoUrl, setProfileVideoUrl] = useState('')
  const [shareTextBefore, setShareTextBefore] = useState(true)
  const [shareVideoBefore, setShareVideoBefore] = useState(true)

  // Comm prefs
  const [signingStyles, setSigningStyles] = useState<string[]>([])
  const [voicePref, setVoicePref] = useState('')
  const [voiceNotes, setVoiceNotes] = useState('')
  const [diPreferred, setDiPreferred] = useState(false)
  const [commNotes, setCommNotes] = useState('')

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
        setCountry(profile.country || '')
        setStateProvince(profile.state || '')
        setCity(profile.city || '')
        setPhotoUrl(profile.photo_url || '')
        setBio(profile.bio || '')
        setProfileVideoUrl(profile.profile_video_url || '')
        setShareTextBefore(profile.share_intro_text_before_confirm !== false)
        setShareVideoBefore(profile.share_intro_video_before_confirm !== false)

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

    if (file.size > 2 * 1024 * 1024) {
      showToast('File must be under 2 MB')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      showToast('Upload failed — please try again')
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

    const updates = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
      pronouns: pronouns.trim(),
      country,
      state: stateProvince,
      city,
      photo_url: photoUrl,
      bio: bio.trim(),
      profile_video_url: profileVideoUrl || null,
      share_intro_text_before_confirm: shareTextBefore,
      share_intro_video_before_confirm: shareVideoBefore,
      comm_prefs: commPrefs,
      updated_at: new Date().toISOString(),
    }

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
        {/* ── Profile Section ── */}
        <div style={{ marginBottom: 40 }}>
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
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#fff',
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
                  fontFamily: "'DM Sans', sans-serif",
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
                Max 2 MB. JPG or PNG.
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
            <LocationPicker
              country={country}
              state={stateProvince}
              city={city}
              onChange={({ country: c, state: s, city: ci }) => {
                setCountry(c)
                setStateProvince(s)
                setCity(ci)
              }}
              accentColor="#9d87ff"
            />
          </div>

        </div>

        {/* ── Introduce Yourself Section ── */}
        <div style={{
          marginBottom: 40,
          background: 'rgba(157,135,255,0.03)',
          border: '1px solid rgba(157,135,255,0.15)',
          borderRadius: 'var(--radius)',
          padding: '28px 28px 24px',
        }}>
          <h3 style={{
            ...sectionHeadingStyle,
            color: '#9d87ff',
            display: 'flex', alignItems: 'baseline', gap: 8,
          }}>
            Introduce Yourself
            <span style={{ fontWeight: 400, fontSize: '0.82rem', color: 'var(--muted)' }}>(optional)</span>
          </h3>

          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.7, marginTop: 0, marginBottom: 24 }}>
            Give a brief introduction, with whatever information you want.<br />
            For example: where you grew up, if you went to a Deaf school or mainstream, etc.<br />
            <strong style={{ color: 'var(--text)' }}>You can write, record a video, or both.</strong>
          </p>

          {/* ── Written sub-section ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10,
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
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)', flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
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
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4,
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
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Replace video
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileVideoUrl('')}
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '7px 16px',
                      fontSize: '0.82rem', color: 'var(--muted)',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
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
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)', flex: 1, fontFamily: "'DM Sans', sans-serif" }}>
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
        <div style={{ marginBottom: 40 }}>
          <h3 style={sectionHeadingStyle}>Communication preferences</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
            This information is shared with interpreters when you make a request, and when you are tagged in a request (interpreter is requested by someone else). It helps them prepare and decide if they&apos;re a good match.
          </p>

          {/* Signing style — multi-select pills */}
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
                      borderRadius: 100,
                      border: `1px solid ${selected ? 'rgba(157,135,255,0.5)' : 'var(--border)'}`,
                      background: selected ? 'rgba(157,135,255,0.1)' : 'var(--surface2)',
                      color: selected ? '#9d87ff' : 'var(--muted)',
                      fontSize: '0.82rem', fontWeight: selected ? 600 : 400,
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.15s',
                    }}
                  >
                    {style}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Voice interpreting — radio */}
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

          {/* DI preferred — toggle */}
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

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 32px',
            background: saving ? 'var(--surface2)' : 'linear-gradient(135deg, #9d87ff, #7b61ff)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: '#fff', fontSize: '0.92rem', fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif", cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 'var(--radius)', padding: '14px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.85rem', color: '#34d399',
        }}>
          {toast}
        </div>
      )}

      <DashMobileStyles />
    </div>
  )
}
