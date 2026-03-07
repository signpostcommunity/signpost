'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/dashboard/interpreter/shared'
import Toast from '@/components/ui/Toast'
import {
  SIGN_LANGUAGES_TOP6, SIGN_LANGUAGES_BY_REGION,
  SPOKEN_LANGUAGES_TOP6, SPOKEN_LANGUAGES_BY_REGION,
  SPECIALIZATIONS,
} from '@/lib/data/languages'

// ── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '11px 14px',
  color: 'var(--text)',
  fontSize: '0.9rem',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 500,
  color: 'var(--muted)',
  marginBottom: 6,
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  marginBottom: 20,
}

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--accent)'
  e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.07)'
}
function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = 'var(--border)'
  e.target.style.boxShadow = 'none'
}

// ── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <span
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
        minHeight: 36, fontSize: '0.85rem', cursor: 'pointer',
        transition: 'all 0.15s', userSelect: 'none',
        border: `1px solid ${selected ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
        background: selected ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
        color: selected ? 'var(--accent)' : 'var(--muted)',
        fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4, wordBreak: 'break-word',
      }}
    >
      {label}
    </span>
  )
}

// ── Region toggle tile ───────────────────────────────────────────────────────

const REGIONS = [
  { label: 'Worldwide', color: '#00e5ff' },
  { label: 'NA — North America', color: '#f97316' },
  { label: 'LATAM — Latin America & Caribbean', color: '#a78bfa' },
  { label: 'EU — Europe', color: '#60a5fa' },
  { label: 'AF — Africa', color: '#34d399' },
  { label: 'ME — Middle East', color: '#fb923c' },
  { label: 'SA — South & Central Asia', color: '#f472b6' },
  { label: 'EA — East & Southeast Asia', color: '#facc15' },
  { label: 'OC — Oceania & Pacific', color: '#4dd9ac' },
]

function ToggleTile({ label, selected, onToggle, dotColor }: {
  label: string; selected: boolean; onToggle: () => void; dotColor?: string
}) {
  return (
    <label onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
      border: `1px solid ${selected ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
      background: selected ? 'rgba(0,229,255,0.08)' : 'var(--surface2)',
      cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none', gap: 8,
    }}>
      {dotColor && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />}
      <span style={{ color: selected ? 'var(--text)' : 'var(--muted)', fontSize: '0.85rem', flex: 1 }}>{label}</span>
      <span style={{ color: 'var(--accent)', fontSize: '0.8rem', opacity: selected ? 1 : 0 }}>✓</span>
    </label>
  )
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  city?: string | null
  country?: string | null
  phone?: string | null
  years_experience?: string | null
  interpreter_type?: string | null
  work_mode?: string | null
  bio?: string | null
  sign_languages?: string[] | null
  spoken_languages?: string[] | null
  specializations?: string[] | null
  regions?: string[] | null
  video_url?: string | null
  video_desc?: string | null
  website_url?: string | null
  linkedin_url?: string | null
  event_coordination?: boolean | null
  event_coordination_desc?: string | null
  photo_url?: string | null
  draft_data?: Record<string, unknown> | null
  status?: string | null
}

interface ProfileClientProps {
  profile: Record<string, unknown> | null
  userEmail: string
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Personal', 'Languages', 'Credentials', 'Bio & Video'] as const
type Tab = typeof TABS[number]

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{
      display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
      marginBottom: 32,
    }}>
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 20px',
            fontSize: '0.88rem', fontWeight: active === tab ? 700 : 400,
            fontFamily: "'DM Sans', sans-serif",
            color: active === tab ? 'var(--accent)' : 'var(--muted)',
            borderBottom: active === tab ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.15s',
            marginBottom: -1,
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ── Save button ──────────────────────────────────────────────────────────────

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div style={{ paddingTop: 24, borderTop: '1px solid var(--border)', marginTop: 32 }}>
      <button
        onClick={onClick}
        disabled={saving}
        className="btn-primary"
        style={{ opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ProfileClient({ profile: rawProfile, userEmail }: ProfileClientProps) {
  const p = (rawProfile || {}) as ProfileData
  const hasProfile = !!rawProfile

  const [activeTab, setActiveTab] = useState<Tab>('Personal')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Personal state ─────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(p.first_name || '')
  const [lastName, setLastName] = useState(p.last_name || '')
  const [city, setCity] = useState(p.city || '')
  const [country, setCountry] = useState(p.country || '')
  const [phone, setPhone] = useState(p.phone || '')
  const [yearsExperience, setYearsExperience] = useState(p.years_experience || '')
  const [interpreterType, setInterpreterType] = useState(p.interpreter_type || '')
  const [modeOfWork, setModeOfWork] = useState(p.work_mode || '')
  const [website, setWebsite] = useState(p.website_url || '')
  const [linkedin, setLinkedin] = useState(p.linkedin_url || '')
  const [eventCoordination, setEventCoordination] = useState(p.event_coordination || false)
  const [coordinationBio, setCoordinationBio] = useState(p.event_coordination_desc || '')

  // ── Languages state ────────────────────────────────────────────────────
  const [signLangs, setSignLangs] = useState<string[]>(p.sign_languages || [])
  const [spokenLangs, setSpokenLangs] = useState<string[]>(p.spoken_languages || [])
  const [specs, setSpecs] = useState<string[]>(p.specializations || [])
  const [signRegional, setSignRegional] = useState<string[]>([])
  const [spokenRegional, setSpokenRegional] = useState<string[]>([])

  // ── Service area state ─────────────────────────────────────────────────
  const [regions, setRegions] = useState<string[]>(p.regions || [])

  // ── Bio & Video state ──────────────────────────────────────────────────
  const [bio, setBio] = useState(p.bio || '')
  const [videoUrl, setVideoUrl] = useState(p.video_url || '')
  const [videoDescription, setVideoDescription] = useState(p.video_desc || '')

  // ── Helpers ────────────────────────────────────────────────────────────

  function toggleInList(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  async function saveFields(fields: Record<string, unknown>) {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // Ensure user_profiles row exists (FK target for interpreter_profiles)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!userProfile) {
      await supabase.from('user_profiles').insert({
        id: user.id,
        role: 'interpreter',
      })
    }

    const { data: existing } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const payload = {
      user_id: user.id,
      name: [firstName, lastName].filter(Boolean).join(' ') || userEmail,
      status: 'draft' as const,
      ...fields,
      updated_at: new Date().toISOString(),
    }

    const result = existing
      ? await supabase.from('interpreter_profiles').update(payload).eq('user_id', user.id).select()
      : await supabase.from('interpreter_profiles').insert(payload).select()

    console.log('Save response:', { data: result.data, error: result.error })

    setSaving(false)
    if (result.error) {
      console.error('Save error:', result.error)
      setToast({ message: `Error: ${result.error.message}`, type: 'error' })
    } else if (!result.data || result.data.length === 0) {
      console.error('Save returned no rows — RLS may be blocking the write')
      setToast({ message: 'Error: save returned no data. Check RLS policies.', type: 'error' })
    } else {
      setToast({ message: 'Changes saved.', type: 'success' })
    }
  }

  // ── Photo upload state ─────────────────────────────────────────────────
  const [photoUrl, setPhotoUrl] = useState(p.photo_url || '')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setUploadMsg({ text: 'File must be under 2 MB.', type: 'error' })
      return
    }

    setUploading(true)
    setUploadMsg(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setUploading(false)
      setUploadMsg({ text: `Upload failed: ${uploadError.message}`, type: 'error' })
      return
    }

    const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    const { data: dbData, error: dbError } = await supabase
      .from('interpreter_profiles')
      .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()

    console.log('Photo save response:', { data: dbData, error: dbError })

    setUploading(false)
    if (dbError) {
      setUploadMsg({ text: `Save failed: ${dbError.message}`, type: 'error' })
    } else if (!dbData || dbData.length === 0) {
      setUploadMsg({ text: 'Save failed: no profile row found. Save your profile first.', type: 'error' })
    } else {
      setPhotoUrl(publicUrl)
      setUploadMsg({ text: 'Photo updated.', type: 'success' })
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Display info ───────────────────────────────────────────────────────

  const displayName = `${firstName || p.first_name || ''} ${lastName || p.last_name || ''}`.trim()
    || (p.name as string) || userEmail
  const initialsSource = firstName || p.first_name || (p.name as string) || userEmail
  const initials = `${initialsSource[0] || ''}${(lastName || p.last_name || '')[0] || ''}`.toUpperCase() || '?'

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 780 }}>
      <PageHeader
        title="My Profile"
        subtitle={hasProfile
          ? "This is what requesters see when they view your listing. Keep it current."
          : "Complete your profile below to get listed in the directory."
        }
      />

      {/* Profile header card */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              objectFit: 'cover', border: '2px solid var(--accent)',
            }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#7b61ff,#00e5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#fff',
            }}>{initials}</div>
          )}
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>{displayName}</div>
            {p.status && (
              <span style={{
                display: 'inline-block', marginTop: 4,
                fontSize: '0.72rem', fontWeight: 700,
                background: p.status === 'approved' ? 'rgba(0,229,255,0.1)' : 'rgba(255,165,0,0.12)',
                border: p.status === 'approved' ? '1px solid rgba(0,229,255,0.25)' : '1px solid rgba(255,165,0,0.3)',
                color: p.status === 'approved' ? 'var(--accent)' : '#f97316',
                borderRadius: 6, padding: '2px 8px',
              }}>
                {p.status === 'approved' ? '✓ Approved' : p.status === 'pending' ? '⏳ Pending Review' : p.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* ── Tab 1: Personal ─────────────────────────────────────────────── */}
      {activeTab === 'Personal' && (
        <>
          {/* Photo upload */}
          <div style={sectionTitleStyle}>Profile Photo</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '20px 24px',
          }}>
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" style={{
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
                {uploading ? 'Uploading...' : photoUrl ? 'Change photo' : 'Upload photo'}
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

          <div style={sectionTitleStyle}>Personal Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}>
                <option value="">Select country...</option>
                <option>United States</option><option>United Kingdom</option><option>Spain</option>
                <option>Australia</option><option>Germany</option><option>France</option>
                <option>Japan</option><option>Brazil</option><option>Canada</option><option>Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>City / Region</label>
              <input value={city} onChange={e => setCity(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Phone / WhatsApp</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Years of Experience</label>
              <select value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}>
                <option value="">Select...</option>
                <option>Less than 1 year</option><option>1–3 years</option><option>3–5 years</option>
                <option>5–10 years</option><option>10–15 years</option><option>15–20 years</option><option>20+ years</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Interpreter Type</label>
              <select value={interpreterType} onChange={e => setInterpreterType(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}>
                <option value="">Select...</option>
                <option>Hearing Interpreter</option><option>Deaf Interpreter</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mode of Work</label>
              <select value={modeOfWork} onChange={e => setModeOfWork(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}>
                <option value="">Select...</option>
                <option>Remote only</option><option>On-site only</option><option>Both remote and on-site</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Website</label>
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>LinkedIn Profile</label>
              <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>

          {/* Event Coordination */}
          <div style={sectionTitleStyle}>Event Coordination</div>
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '16px 18px', marginBottom: 16,
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', color: 'var(--text)', fontSize: '0.88rem' }}>
              <input
                type="checkbox" checked={eventCoordination}
                onChange={e => setEventCoordination(e.target.checked)}
                style={{ width: 'auto', marginTop: 3, accentColor: 'var(--accent)' }}
              />
              <span>I am available to coordinate interpreter teams for complex and/or large-scale events</span>
            </label>
            {eventCoordination && (
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Coordination experience</label>
                <textarea
                  value={coordinationBio} onChange={e => setCoordinationBio(e.target.value)}
                  placeholder="Describe your coordination experience..."
                  rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={handleFocus} onBlur={handleBlur}
                />
              </div>
            )}
          </div>

          {/* Regions */}
          <div style={sectionTitleStyle}>Regions Available For Work Travel</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
            {REGIONS.map(r => (
              <ToggleTile
                key={r.label} label={r.label} dotColor={r.color}
                selected={regions.includes(r.label)}
                onToggle={() => toggleInList(regions, r.label, setRegions)}
              />
            ))}
          </div>

          <SaveButton saving={saving} onClick={() => saveFields({
            first_name: firstName, last_name: lastName, city, country, phone,
            years_experience: yearsExperience, interpreter_type: interpreterType,
            work_mode: modeOfWork, website_url: website, linkedin_url: linkedin,
            event_coordination: eventCoordination, event_coordination_desc: coordinationBio,
            regions,
          })} />
        </>
      )}

      {/* ── Tab 2: Languages ────────────────────────────────────────────── */}
      {activeTab === 'Languages' && (
        <>
          {/* Sign Languages */}
          <div style={sectionTitleStyle}>Sign Languages</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12 }}>
            Select all sign languages in which you have professional-level fluency.
          </p>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
            Most common
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, marginBottom: 12 }}>
            {SIGN_LANGUAGES_TOP6.map(lang => (
              <Chip key={lang} label={lang} selected={signLangs.includes(lang)} onToggle={() => toggleInList(signLangs, lang, setSignLangs)} />
            ))}
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
            More languages by region
          </div>
          <select
            value="" onChange={e => { if (e.target.value && !signRegional.includes(e.target.value)) { setSignRegional(prev => [...prev, e.target.value]); setSignLangs(prev => prev.includes(e.target.value) ? prev : [...prev, e.target.value]) } }}
            style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
          >
            <option value="">Select a language...</option>
            {Object.entries(SIGN_LANGUAGES_BY_REGION).sort().map(([region, langs]) => (
              <optgroup key={region} label={region}>
                {langs.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </optgroup>
            ))}
          </select>
          {signRegional.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {signRegional.map(lang => (
                <span key={lang} style={{
                  padding: '0 10px 0 12px', height: 30, fontSize: '0.8rem',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  borderRadius: 20, border: '1px solid rgba(0,229,255,0.4)',
                  background: 'rgba(0,229,255,0.1)', color: 'var(--accent)',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {lang}
                  <span onClick={() => { setSignRegional(prev => prev.filter(l => l !== lang)); setSignLangs(prev => prev.filter(l => l !== lang)) }} style={{ cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem' }}>✕</span>
                </span>
              ))}
            </div>
          )}

          {/* Spoken Languages */}
          <div style={{ ...sectionTitleStyle, marginTop: 36 }}>Spoken Languages</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12 }}>
            Select all spoken languages in which you have professional-level fluency.
          </p>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
            Most common
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, marginBottom: 12 }}>
            {SPOKEN_LANGUAGES_TOP6.map(lang => (
              <Chip key={lang} label={lang} selected={spokenLangs.includes(lang)} onToggle={() => toggleInList(spokenLangs, lang, setSpokenLangs)} />
            ))}
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
            More languages by region
          </div>
          <select
            value="" onChange={e => { if (e.target.value && !spokenRegional.includes(e.target.value)) { setSpokenRegional(prev => [...prev, e.target.value]); setSpokenLangs(prev => prev.includes(e.target.value) ? prev : [...prev, e.target.value]) } }}
            style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
          >
            <option value="">Select a language...</option>
            {Object.entries(SPOKEN_LANGUAGES_BY_REGION).sort().map(([region, langs]) => (
              <optgroup key={region} label={region}>
                {langs.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </optgroup>
            ))}
          </select>
          {spokenRegional.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {spokenRegional.map(lang => (
                <span key={lang} style={{
                  padding: '0 10px 0 12px', height: 30, fontSize: '0.8rem',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  borderRadius: 20, border: '1px solid rgba(0,229,255,0.4)',
                  background: 'rgba(0,229,255,0.1)', color: 'var(--accent)',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {lang}
                  <span onClick={() => { setSpokenRegional(prev => prev.filter(l => l !== lang)); setSpokenLangs(prev => prev.filter(l => l !== lang)) }} style={{ cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem' }}>✕</span>
                </span>
              ))}
            </div>
          )}

          {/* Specializations */}
          <div style={{ ...sectionTitleStyle, marginTop: 36 }}>Specializations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: 6, marginBottom: 16 }}>
            {SPECIALIZATIONS.map(spec => (
              <Chip key={spec} label={spec} selected={specs.includes(spec)} onToggle={() => toggleInList(specs, spec, setSpecs)} />
            ))}
          </div>

          <SaveButton saving={saving} onClick={() => saveFields({
            sign_languages: signLangs, spoken_languages: spokenLangs, specializations: specs,
          })} />
        </>
      )}

      {/* ── Tab 3: Credentials ──────────────────────────────────────────── */}
      {activeTab === 'Credentials' && (
        <CredentialsTab saving={saving} onSave={saveFields} />
      )}

      {/* ── Tab 4: Bio & Video ──────────────────────────────────────────── */}
      {activeTab === 'Bio & Video' && (
        <>
          <div style={sectionTitleStyle}>Professional Bio</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12 }}>
            Tell the signpost community about yourself: your background, professional experience, specializations, etc.
          </p>
          <textarea
            value={bio} onChange={e => setBio(e.target.value)}
            rows={6} style={{ ...inputStyle, resize: 'vertical', minHeight: 120, marginBottom: 24 }}
            onFocus={handleFocus} onBlur={handleBlur}
          />

          <div style={sectionTitleStyle}>Introduction Video</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12 }}>
            Paste a link to a short video introduction. This is the first thing Deaf clients will see.
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Video URL</label>
            <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/... or https://vimeo.com/..." style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          <div style={sectionTitleStyle}>Video Description</div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Brief description of your video (shown to clients)</label>
            <textarea
              value={videoDescription} onChange={e => setVideoDescription(e.target.value)}
              placeholder="In this video I introduce myself in ASL and explain my background..."
              rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>

          <SaveButton saving={saving} onClick={() => saveFields({
            bio, video_url: videoUrl, video_desc: videoDescription,
          })} />
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── Credentials tab (isolated state) ─────────────────────────────────────────

interface CertEntry { id: string; name: string; issuingBody: string; verificationLink: string }

function CredentialsTab({ saving, onSave }: { saving: boolean; onSave: (fields: Record<string, unknown>) => Promise<void> }) {
  const [certs, setCerts] = useState<CertEntry[]>([
    { id: `cert-${Date.now()}`, name: '', issuingBody: '', verificationLink: '' },
  ])

  function updateCert(id: string, field: keyof CertEntry, value: string) {
    setCerts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  function removeCert(id: string) {
    if (certs.length === 1) return
    setCerts(prev => prev.filter(c => c.id !== id))
  }

  return (
    <>
      <div style={sectionTitleStyle}>Certifications &amp; Credentials</div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12 }}>
        List your certifications and qualifications. To earn a{' '}
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>✓ Verified</span>{' '}
        badge, paste a link to your certifying body for each credential.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {certs.map(cert => (
          <div key={cert.id} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '20px 24px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Certification Name</label>
                <input value={cert.name} onChange={e => updateCert(cert.id, 'name', e.target.value)} placeholder="e.g. NIC Advanced" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Issuing Body &amp; Year</label>
                <input value={cert.issuingBody} onChange={e => updateCert(cert.id, 'issuingBody', e.target.value)} placeholder="e.g. RID, USA, 2018" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Verification link</label>
                <input type="url" value={cert.verificationLink} onChange={e => updateCert(cert.id, 'verificationLink', e.target.value)} placeholder="https://rid.org/verify/..." style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              {certs.length > 1 && (
                <button onClick={() => removeCert(cert.id)} style={{
                  background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)',
                  color: 'var(--accent3)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                  fontSize: '0.9rem', transition: 'all 0.2s',
                }}>✕</button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setCerts(prev => [...prev, { id: `cert-${Date.now()}`, name: '', issuingBody: '', verificationLink: '' }])}
        style={{
          background: 'none', border: '1px dashed var(--border)',
          color: 'var(--muted)', borderRadius: 'var(--radius-sm)',
          padding: 10, width: '100%', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
          transition: 'all 0.2s', marginTop: 10,
        }}
      >
        + Add Another Credential
      </button>

      <SaveButton saving={saving} onClick={() => {
        const validCerts = certs.filter(c => c.name.trim())
        onSave({
          // Store credentials as JSON array — the separate table isn't used by the signup flow
          draft_data: { certifications: validCerts },
        })
      }} />
    </>
  )
}
