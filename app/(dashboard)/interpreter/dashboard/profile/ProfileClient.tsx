'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/dashboard/interpreter/shared'
import Toast from '@/components/ui/Toast'
import {
  SIGN_LANGUAGES_TOP6, SIGN_LANGUAGES_BY_REGION,
  SPOKEN_LANGUAGES_TOP6, SPOKEN_LANGUAGES_BY_REGION,
  SPECIALIZATIONS,
} from '@/lib/data/languages'
import { getVideoEmbedUrl, isValidVideoUrl } from '@/lib/videoUtils'

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
  { label: '\u{1F30D} Worldwide', color: '#00e5ff' },
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
  state?: string | null
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
  event_coordination?: boolean | null
  event_coordination_desc?: string | null
  photo_url?: string | null
  draft_data?: Record<string, unknown> | null
  status?: string | null
  invoicing_preference?: string | null
  payment_methods?: PaymentMethod[] | null
  default_payment_terms?: string | null
}

interface PaymentMethod {
  type: string
  value: string
}

interface ProfileClientProps {
  profile: Record<string, unknown> | null
  userEmail: string
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Personal', 'Languages', 'Credentials', 'Bio & Video', 'Payment & Invoicing'] as const
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
  console.log('PROFILE LOAD - rawProfile from server:', JSON.stringify(rawProfile, null, 2))
  const p = (rawProfile || {}) as ProfileData
  const hasProfile = !!rawProfile
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('Personal')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Personal state ─────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(p.first_name || '')
  const [lastName, setLastName] = useState(p.last_name || '')
  const [city, setCity] = useState(p.city || '')
  const [stateProvince, setStateProvince] = useState(p.state || '')
  const [country, setCountry] = useState(p.country || '')
  const [phone, setPhone] = useState(p.phone || '')
  const [yearsExperience, setYearsExperience] = useState(p.years_experience || '')
  const [interpreterType, setInterpreterType] = useState(p.interpreter_type || '')
  const [modeOfWork, setModeOfWork] = useState(p.work_mode || '')
  const [eventCoordination, setEventCoordination] = useState(p.event_coordination || false)
  const [coordinationBio, setCoordinationBio] = useState(p.event_coordination_desc || '')

  // ── Languages state ────────────────────────────────────────────────────
  const [signLangs, setSignLangs] = useState<string[]>(p.sign_languages || [])
  const [spokenLangs, setSpokenLangs] = useState<string[]>(p.spoken_languages || [])
  const [specs, setSpecs] = useState<string[]>(p.specializations || [])
  const [otherSpecs, setOtherSpecs] = useState('')
  const [signRegional, setSignRegional] = useState<string[]>([])
  const [spokenRegional, setSpokenRegional] = useState<string[]>([])

  // ── Service area state ─────────────────────────────────────────────────
  const [regions, setRegions] = useState<string[]>(p.regions || [])

  // ── Bio & Video state ──────────────────────────────────────────────────
  const [bio, setBio] = useState(p.bio || '')
  const [videoUrl, setVideoUrl] = useState(p.video_url || '')
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null)
  const [videoDescription, setVideoDescription] = useState(p.video_desc || '')

  // ── Payment & Invoicing state ───────────────────────────────────────
  const [invoicingPref, setInvoicingPref] = useState(p.invoicing_preference || 'own')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(p.payment_methods || [])
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(p.default_payment_terms || 'net_30')

  // ── Client-side fallback: load profile if server prop was null ──────
  useEffect(() => {
    if (rawProfile) return // Server already provided data
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('DIAG - auth.getUser():', user?.id, user?.email)
      if (!user) return

      // Check what auth.uid() Postgres sees
      const { data: session } = await supabase.auth.getSession()
      console.log('DIAG - session access_token exists:', !!session?.session?.access_token)
      console.log('DIAG - session access_token prefix:', session?.session?.access_token?.substring(0, 20))

      // Test: can RLS see this user on user_profiles? (simpler RLS: auth.uid() = id)
      const { data: upTest, error: upErr } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()
      console.log('DIAG - user_profiles read:', JSON.stringify({ upTest, upErr }, null, 2))

      // Now try interpreter_profiles
      const { data, error, status, statusText } = await supabase
        .from('interpreter_profiles')
        .select('name, first_name, last_name, city, state, country, phone, years_experience, interpreter_type, work_mode, bio, sign_languages, spoken_languages, specializations, regions, video_url, video_desc, event_coordination, event_coordination_desc, draft_data, status, photo_url, invoicing_preference, payment_methods, default_payment_terms')
        .eq('user_id', user.id)
        .maybeSingle()
      console.log('PROFILE CLIENT-SIDE LOAD:', JSON.stringify({ data, error, status, statusText, userId: user.id }, null, 2))
      if (!data) return
      const d = data as ProfileData
      if (d.first_name != null) setFirstName(d.first_name)
      if (d.last_name != null) setLastName(d.last_name)
      if (d.city != null) setCity(d.city)
      if (d.state != null) setStateProvince(d.state)
      if (d.country != null) setCountry(d.country)
      if (d.phone != null) setPhone(d.phone)
      if (d.years_experience != null) setYearsExperience(d.years_experience)
      if (d.interpreter_type != null) setInterpreterType(d.interpreter_type)
      if (d.work_mode != null) setModeOfWork(d.work_mode)
      if (d.event_coordination != null) setEventCoordination(d.event_coordination)
      if (d.event_coordination_desc != null) setCoordinationBio(d.event_coordination_desc)
      if (d.sign_languages) setSignLangs(d.sign_languages)
      if (d.spoken_languages) setSpokenLangs(d.spoken_languages)
      if (d.specializations) setSpecs(d.specializations)
      if (d.regions) setRegions(d.regions)
      if (d.bio != null) setBio(d.bio)
      if (d.video_url != null) setVideoUrl(d.video_url)
      if (d.video_desc != null) setVideoDescription(d.video_desc)
      if (d.photo_url != null) setPhotoUrl(d.photo_url)
      if (d.invoicing_preference != null) setInvoicingPref(d.invoicing_preference)
      if (d.payment_methods != null) setPaymentMethods(d.payment_methods)
      if (d.default_payment_terms != null) setDefaultPaymentTerms(d.default_payment_terms)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      const { error: upError } = await supabase.from('user_profiles').insert({
        id: user.id,
        role: 'interpreter',
      }).select()
      if (upError) {
        console.error('user_profiles insert error:', upError)
        setSaving(false)
        setToast({ message: `Error creating user profile: ${upError.message}`, type: 'error' })
        return
      }
    }

    const { data: existing } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const payload = {
      user_id: user.id,
      name: [firstName, lastName].filter(Boolean).join(' ') || userEmail,
      // BETA: auto-approve profiles. Revert to 'draft' when admin review flow is built.
      status: 'approved' as const,
      ...fields,
      updated_at: new Date().toISOString(),
    }

    console.log('PROFILE SAVE - user_id:', user.id)
    console.log('PROFILE SAVE - existing row:', JSON.stringify(existing, null, 2))
    console.log('PROFILE SAVE - payload:', JSON.stringify(payload, null, 2))

    const result = existing
      ? await supabase.from('interpreter_profiles').update(payload).eq('user_id', user.id).select()
      : await supabase.from('interpreter_profiles').insert(payload).select()

    console.log('PROFILE SAVE - response:', JSON.stringify({ data: result.data, error: result.error, status: result.status }, null, 2))

    setSaving(false)
    if (result.error) {
      console.error('Save error:', result.error)
      setToast({ message: `Error: ${result.error.message}`, type: 'error' })
    } else if (!result.data || result.data.length === 0) {
      console.error('Save returned no rows — RLS may be blocking the write')
      setToast({ message: 'Error: save returned no data. Check RLS policies.', type: 'error' })
    } else {
      // Update local state from DB response
      const saved = result.data[0] as ProfileData
      if (saved.first_name !== undefined) setFirstName(saved.first_name || '')
      if (saved.last_name !== undefined) setLastName(saved.last_name || '')
      if (saved.city !== undefined) setCity(saved.city || '')
      if (saved.state !== undefined) setStateProvince(saved.state || '')
      if (saved.country !== undefined) setCountry(saved.country || '')
      if (saved.phone !== undefined) setPhone(saved.phone || '')
      if (saved.photo_url !== undefined) setPhotoUrl(saved.photo_url || '')
      if (saved.bio !== undefined) setBio(saved.bio || '')
      if (saved.video_url !== undefined) setVideoUrl(saved.video_url || '')
      if (saved.video_desc !== undefined) setVideoDescription(saved.video_desc || '')
      // Verify the row is readable immediately after save
      const { data: verifyData, error: verifyError } = await supabase
        .from('interpreter_profiles')
        .select('id, user_id, first_name, status')
        .eq('user_id', user.id)
        .maybeSingle()
      console.log('PROFILE SAVE - verify read-back:', JSON.stringify({ verifyData, verifyError }, null, 2))

      setToast({ message: 'Changes saved.', type: 'success' })
      // Refresh server components (sidebar name/photo)
      router.refresh()
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
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setUploading(false)
      setUploadMsg({ text: `Upload failed: ${uploadError.message}`, type: 'error' })
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
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
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.3rem' }}>{displayName}</div>
        {(p.city || p.state) && (
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
            {[p.city, p.state].filter(Boolean).join(', ')}
          </div>
        )}
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
              <label style={labelStyle}>City</label>
              <input value={city} onChange={e => setCity(e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>State / Province / Region</label>
              <input value={stateProvince} onChange={e => setStateProvince(e.target.value)} placeholder="e.g. California, Ontario..." style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
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
            first_name: firstName, last_name: lastName, city, state: stateProvince, country, phone,
            years_experience: yearsExperience, interpreter_type: interpreterType,
            work_mode: modeOfWork,
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
          <div style={{ marginTop: 4 }}>
            <label style={labelStyle}>Other specializations <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(comma-separated)</span></label>
            <input
              type="text"
              placeholder="e.g. Sports, Veterinary..."
              value={otherSpecs}
              onChange={e => setOtherSpecs(e.target.value)}
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <SaveButton saving={saving} onClick={() => saveFields({
            sign_languages: signLangs, spoken_languages: spokenLangs, specializations: specs,
          })} />
        </>
      )}

      {/* ── Tab 3: Credentials ──────────────────────────────────────────── */}
      {activeTab === 'Credentials' && (
        <CredentialsTab
          saving={saving}
          onSave={saveFields}
          initialCerts={(p.draft_data as Record<string, unknown>)?.certifications as CertEntry[] | undefined}
          initialEducation={(p.draft_data as Record<string, unknown>)?.education as EduEntry[] | undefined}
          existingDraftData={p.draft_data || {}}
        />
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
            <input
              type="text"
              value={videoUrl}
              onChange={e => { setVideoUrl(e.target.value); setVideoUrlError(null) }}
              onBlur={() => {
                if (videoUrl.trim() && !isValidVideoUrl(videoUrl)) {
                  setVideoUrlError('Please enter a YouTube or Vimeo link. Direct file upload coming soon.')
                } else {
                  setVideoUrlError(null)
                }
              }}
              placeholder="YouTube or Vimeo link (e.g. youtube.com/watch?v=...)"
              style={{ ...inputStyle, borderColor: videoUrlError ? 'var(--accent3)' : undefined }}
              onFocus={handleFocus}
            />
            {videoUrlError && (
              <div style={{ color: 'var(--accent3)', fontSize: '0.78rem', marginTop: 6 }}>{videoUrlError}</div>
            )}
            {/* TODO: direct video upload — spec in master doc */}
          </div>

          {/* Live preview */}
          {(() => {
            const embedUrl = getVideoEmbedUrl(videoUrl)
            if (!embedUrl) return null
            if (embedUrl.includes('supabase.co/storage')) {
              return (
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Preview</label>
                  <video controls width="100%" style={{ borderRadius: 12, border: '1px solid var(--border)', maxHeight: 340, background: '#000' }} src={embedUrl} />
                </div>
              )
            }
            return (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Preview</label>
                <iframe
                  width="100%" height="315" src={embedUrl}
                  title="Interpreter introduction video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ borderRadius: 12, border: 'none' }}
                />
              </div>
            )
          })()}

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

          <SaveButton saving={saving} onClick={() => {
            if (videoUrl.trim() && !isValidVideoUrl(videoUrl)) {
              setVideoUrlError('Please enter a YouTube or Vimeo link. Direct file upload coming soon.')
              return
            }
            saveFields({ bio, video_url: videoUrl, video_desc: videoDescription })
          }} />
        </>
      )}

      {/* ── Tab 5: Payment & Invoicing ─────────────────────────────────── */}
      {activeTab === 'Payment & Invoicing' && (
        <>
          {/* Invoicing Preference */}
          <div style={sectionTitleStyle}>Invoicing Preference</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12, lineHeight: 1.6 }}>
            This controls whether the &ldquo;Submit Invoice&rdquo; button appears on your confirmed bookings. You can change this anytime.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {([
              { value: 'own', label: 'I use my own invoicing system', desc: 'No invoice tools will appear in signpost.' },
              { value: 'signpost', label: "I'd like to submit invoices through signpost", desc: 'A "Submit Invoice" button will appear on confirmed bookings.' },
            ] as const).map(opt => (
              <label
                key={opt.value}
                onClick={() => setInvoicingPref(opt.value)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                  background: invoicingPref === opt.value ? 'rgba(0,229,255,0.06)' : 'var(--surface2)',
                  border: `1.5px solid ${invoicingPref === opt.value ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  border: `2px solid ${invoicingPref === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {invoicingPref === opt.value && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: invoicingPref === opt.value ? 'var(--text)' : 'var(--muted)' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Default Payment Terms */}
          <div style={sectionTitleStyle}>Default Payment Terms</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12, marginTop: -12, lineHeight: 1.6 }}>
            This sets the default due date on new invoices. You can adjust it per invoice.
          </p>
          <div style={{ marginBottom: 28, maxWidth: 320 }}>
            <select
              value={defaultPaymentTerms}
              onChange={e => setDefaultPaymentTerms(e.target.value)}
              style={inputStyle}
              onFocus={handleFocus} onBlur={handleBlur}
            >
              <option value="due_on_receipt">Due on Receipt</option>
              <option value="net_15">Net 15</option>
              <option value="net_30">Net 30</option>
              <option value="net_45">Net 45</option>
              <option value="net_60">Net 60</option>
            </select>
          </div>

          {/* Payment Methods */}
          <div style={sectionTitleStyle}>Payment Methods</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12, lineHeight: 1.6 }}>
            These payment links appear on your invoices so requesters know how to pay you. signpost does not process payments or store financial account information.
          </p>

          {paymentMethods.map((pm, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start',
            }}>
              <select
                value={pm.type}
                onChange={e => {
                  const updated = [...paymentMethods]
                  updated[i] = { ...updated[i], type: e.target.value }
                  setPaymentMethods(updated)
                }}
                style={{ ...inputStyle, width: 160, flexShrink: 0 }}
                onFocus={handleFocus} onBlur={handleBlur}
              >
                <option value="venmo">Venmo</option>
                <option value="paypal">PayPal</option>
                <option value="zelle">Zelle</option>
                <option value="melio">Melio</option>
                <option value="check">Check</option>
                <option value="ach">ACH</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                value={pm.value}
                onChange={e => {
                  const updated = [...paymentMethods]
                  updated[i] = { ...updated[i], value: e.target.value }
                  setPaymentMethods(updated)
                }}
                placeholder={
                  pm.type === 'venmo' ? '@username' :
                  pm.type === 'paypal' ? 'paypal.me/yourlink' :
                  pm.type === 'zelle' ? 'Email or phone registered with Zelle' :
                  pm.type === 'melio' ? 'melio.me/yourlink' :
                  pm.type === 'check' ? 'Mailing address for checks' :
                  pm.type === 'ach' ? 'Contact me for ACH details' :
                  'Payment instructions'
                }
                style={{ ...inputStyle, flex: 1 }}
                onFocus={handleFocus} onBlur={handleBlur}
              />
              <button
                onClick={() => setPaymentMethods(paymentMethods.filter((_, j) => j !== i))}
                style={{
                  background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--muted)', fontSize: '0.85rem', padding: '9px 12px', cursor: 'pointer',
                  flexShrink: 0, fontFamily: "'DM Sans', sans-serif",
                }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={() => setPaymentMethods([...paymentMethods, { type: 'venmo', value: '' }])}
            style={{
              background: 'transparent', border: '1.5px dashed var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 16px',
              color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', marginBottom: 28,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            + Add payment method
          </button>

          <SaveButton saving={saving} onClick={() => saveFields({
            invoicing_preference: invoicingPref,
            payment_methods: paymentMethods,
            default_payment_terms: defaultPaymentTerms,
          })} />
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── Credentials tab (isolated state) ─────────────────────────────────────────

interface CertEntry { id: string; name: string; issuingBody: string; year: string; verificationLink: string }
interface EduEntry { id: string; degree: string; institution: string }

function CredentialsTab({ saving, onSave, initialCerts, initialEducation, existingDraftData }: {
  saving: boolean
  onSave: (fields: Record<string, unknown>) => Promise<void>
  initialCerts?: CertEntry[]
  initialEducation?: EduEntry[]
  existingDraftData: Record<string, unknown>
}) {
  const [certs, setCerts] = useState<CertEntry[]>(
    initialCerts?.length ? initialCerts : [{ id: `cert-${Date.now()}`, name: '', issuingBody: '', year: '', verificationLink: '' }]
  )
  const [education, setEducation] = useState<EduEntry[]>(
    initialEducation?.length ? initialEducation : [{ id: `edu-${Date.now()}`, degree: '', institution: '' }]
  )

  function updateCert(id: string, field: keyof CertEntry, value: string) {
    setCerts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  function removeCert(id: string) {
    if (certs.length === 1) return
    setCerts(prev => prev.filter(c => c.id !== id))
  }

  function updateEdu(id: string, field: keyof EduEntry, value: string) {
    setEducation(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function removeEdu(id: string) {
    if (education.length === 1) return
    setEducation(prev => prev.filter(e => e.id !== id))
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
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Certification Name</label>
              <input value={cert.name} onChange={e => updateCert(cert.id, 'name', e.target.value)} placeholder="e.g. NIC Advanced" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Issuing Body</label>
                <input value={cert.issuingBody} onChange={e => updateCert(cert.id, 'issuingBody', e.target.value)} placeholder="e.g. RID" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Year</label>
                <input value={cert.year} onChange={e => updateCert(cert.id, 'year', e.target.value)} placeholder="2018" maxLength={4} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
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
        onClick={() => setCerts(prev => [...prev, { id: `cert-${Date.now()}`, name: '', issuingBody: '', year: '', verificationLink: '' }])}
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

      {/* Education */}
      <div style={{ ...sectionTitleStyle, marginTop: 36 }}>Education</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {education.map(edu => (
          <div key={edu.id} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '20px 24px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 16, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Degree / Qualification</label>
                <input value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} placeholder="MA Interpreter Studies" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Institution &amp; Year</label>
                <input value={edu.institution} onChange={e => updateEdu(edu.id, 'institution', e.target.value)} placeholder="Universidad de Salamanca · 2013" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
            </div>
            {education.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => removeEdu(edu.id)} style={{
                  background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)',
                  color: 'var(--accent3)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
                  fontSize: '0.9rem', transition: 'all 0.2s',
                }}>✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={() => setEducation(prev => [...prev, { id: `edu-${Date.now()}`, degree: '', institution: '' }])}
        style={{
          background: 'none', border: '1px dashed var(--border)',
          color: 'var(--muted)', borderRadius: 'var(--radius-sm)',
          padding: 10, width: '100%', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
          transition: 'all 0.2s', marginTop: 10,
        }}
      >
        + Add More Education
      </button>

      <SaveButton saving={saving} onClick={() => {
        const validCerts = certs.filter(c => c.name.trim())
        const validEdu = education.filter(e => e.degree.trim())
        onSave({
          draft_data: { ...existingDraftData, certifications: validCerts, education: validEdu },
        })
      }} />
    </>
  )
}
