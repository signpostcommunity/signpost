'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/dashboard/interpreter/shared'
import Toast from '@/components/ui/Toast'
import {
  SIGN_LANGUAGES_TOP6, SIGN_LANGUAGES_BY_REGION,
  SPOKEN_LANGUAGES_TOP6, SPOKEN_LANGUAGES_BY_REGION,
} from '@/lib/data/languages'
import { SPECIALIZATION_CATEGORIES, SPECIALIZED_SKILLS } from '@/lib/constants/specializations'
import { getVideoEmbedUrl, isValidVideoUrl } from '@/lib/videoUtils'
import { sendNotification } from '@/lib/notifications'
import LocationPicker from '@/components/shared/LocationPicker'

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
  bio_specializations?: string | null
  bio_extra?: string | null
  sign_languages?: string[] | null
  spoken_languages?: string[] | null
  specializations?: string[] | null
  specialized_skills?: string[] | null
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
  notification_preferences?: NotificationPreferences | null
  notification_phone?: string | null
  lgbtq?: boolean | null
  deaf_parented?: boolean | null
  bipoc?: boolean | null
  bipoc_details?: string[] | null
  religious_affiliation?: boolean | null
  religious_details?: string[] | null
  gender_identity?: string | null
}

interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  categories: Record<string, { email: boolean; sms: boolean }>
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  email_enabled: true,
  sms_enabled: false,
  categories: {
    new_request: { email: true, sms: false },
    booking_confirmed: { email: true, sms: false },
    rate_response: { email: true, sms: false },
    cancelled_by_requester: { email: true, sms: false },
    cancelled_by_you: { email: true, sms: false },
    sub_search_update: { email: true, sms: false },
    booking_reminder: { email: true, sms: false },
    new_message: { email: true, sms: false },
    invoice_paid: { email: true, sms: false },
    team_invite: { email: true, sms: false },
    added_to_preferred_list: { email: true, sms: false },
  },
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

const TABS = ['Personal', 'Languages', 'Credentials', 'Bio & Video', 'Skills', 'Community & Identity', 'Account Settings'] as const
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
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 20,
      background: 'var(--card-bg)', borderTop: '1px solid var(--border)',
      padding: '14px 24px', marginTop: 32,
      display: 'flex', justifyContent: 'flex-end',
    }}>
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

  // Fall back to draft_data if individual columns are empty
  const dd = (p.draft_data || {}) as Record<string, unknown>
  function fallback<T>(column: T | null | undefined, draftKey: string, defaultVal: T): T {
    if (column !== null && column !== undefined && column !== '') return column
    const draftVal = dd[draftKey]
    if (draftVal !== null && draftVal !== undefined && draftVal !== '') return draftVal as T
    return defaultVal
  }
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialTab = (() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      const match = TABS.find(t => t.toLowerCase().replace(/\s+/g, '-') === tabParam)
      if (match) return match
    }
    return 'Personal' as Tab
  })()
  const [activeTab, setActiveTabRaw] = useState<Tab>(initialTab)
  function setActiveTab(tab: Tab) {
    setActiveTabRaw(tab)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Personal state (columns → draft_data fallback) ─────────────────────
  const [firstName, setFirstName] = useState(fallback(p.first_name, 'firstName', ''))
  const [lastName, setLastName] = useState(fallback(p.last_name, 'lastName', ''))
  const [city, setCity] = useState(fallback(p.city, 'city', ''))
  const [stateProvince, setStateProvince] = useState(fallback(p.state, 'state', ''))
  const [country, setCountry] = useState(fallback(p.country, 'country', ''))
  const [phone, setPhone] = useState(fallback(p.phone, 'phone', ''))
  const [yearsExperience, setYearsExperience] = useState(fallback(p.years_experience, 'yearsExperience', ''))
  const [interpreterType, setInterpreterType] = useState(fallback(p.interpreter_type, 'interpreterType', ''))
  const [modeOfWork, setModeOfWork] = useState(fallback(p.work_mode, 'modeOfWork', ''))
  const [eventCoordination, setEventCoordination] = useState(fallback(p.event_coordination, 'eventCoordination', false))
  const [coordinationBio, setCoordinationBio] = useState(fallback(p.event_coordination_desc, 'coordinationBio', ''))

  // ── Languages state ────────────────────────────────────────────────────
  const [signLangs, setSignLangs] = useState<string[]>(fallback(p.sign_languages, 'signLanguages', [] as string[]))
  const [spokenLangs, setSpokenLangs] = useState<string[]>(fallback(p.spoken_languages, 'spokenLanguages', [] as string[]))
  const [specs, setSpecs] = useState<string[]>(fallback(p.specializations, 'specializations', [] as string[]))
  const [specializedSkills, setSpecializedSkills] = useState<string[]>(fallback(p.specialized_skills, 'specializedSkills', [] as string[]))
  const [otherSpecs, setOtherSpecs] = useState('')
  const [signRegional, setSignRegional] = useState<string[]>([])
  const [spokenRegional, setSpokenRegional] = useState<string[]>([])

  // ── Service area state ─────────────────────────────────────────────────
  const [regions, setRegions] = useState<string[]>(fallback(p.regions, 'regions', [] as string[]))

  // ── Bio & Video state ──────────────────────────────────────────────────
  const [bio, setBio] = useState(fallback(p.bio, 'bio', ''))
  const [bioSpecializations, setBioSpecializations] = useState(fallback(p.bio_specializations, 'bioSpecializations', ''))
  const [bioExtra, setBioExtra] = useState(fallback(p.bio_extra, 'bioExtra', ''))
  const [videoUrl, setVideoUrl] = useState(fallback(p.video_url, 'videoUrl', ''))
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null)
  const [videoDescription, setVideoDescription] = useState(fallback(p.video_desc, 'videoDescription', ''))

  // ── Payment & Invoicing state ───────────────────────────────────────
  const [invoicingPref, setInvoicingPref] = useState(p.invoicing_preference || 'own')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(p.payment_methods || [])
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(p.default_payment_terms || 'net_30')

  // ── Notification state ──────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(p.notification_preferences || DEFAULT_NOTIFICATION_PREFS)
  const [notifPhone, setNotifPhone] = useState(p.notification_phone || '')
  const [notifSaving, setNotifSaving] = useState(false)

  // ── Community & Identity state ────────────────────────────────────
  const [lgbtq, setLgbtq] = useState(fallback(p.lgbtq, 'lgbtq', false))
  const [deafParented, setDeafParented] = useState(fallback(p.deaf_parented, 'deafParented', false))
  const [bipoc, setBipoc] = useState(fallback(p.bipoc, 'bipoc', false))
  const [bipocDetails, setBipocDetails] = useState<string[]>(fallback(p.bipoc_details, 'bipocDetails', [] as string[]))
  const [religiousAff, setReligiousAff] = useState(fallback(p.religious_affiliation, 'religiousAffiliation', false))
  const [religiousDetails, setReligiousDetails] = useState<string[]>(fallback(p.religious_details, 'religiousDetails', [] as string[]))

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
        .select('name, first_name, last_name, city, state, country, phone, years_experience, interpreter_type, work_mode, bio, bio_specializations, bio_extra, sign_languages, spoken_languages, specializations, specialized_skills, regions, video_url, video_desc, event_coordination, event_coordination_desc, draft_data, status, photo_url, invoicing_preference, payment_methods, default_payment_terms, notification_preferences, notification_phone, lgbtq, deaf_parented, bipoc, bipoc_details, religious_affiliation, religious_details, gender_identity')
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
      if (d.specialized_skills) setSpecializedSkills(d.specialized_skills)
      if (d.regions) setRegions(d.regions)
      if (d.bio != null) setBio(d.bio)
      if (d.bio_specializations != null) setBioSpecializations(d.bio_specializations)
      if (d.bio_extra != null) setBioExtra(d.bio_extra)
      if (d.video_url != null) setVideoUrl(d.video_url)
      if (d.video_desc != null) setVideoDescription(d.video_desc)
      if (d.photo_url != null) setPhotoUrl(d.photo_url)
      if (d.invoicing_preference != null) setInvoicingPref(d.invoicing_preference)
      if (d.payment_methods != null) setPaymentMethods(d.payment_methods)
      if (d.default_payment_terms != null) setDefaultPaymentTerms(d.default_payment_terms)
      if (d.notification_preferences != null) setNotifPrefs(d.notification_preferences)
      if (d.notification_phone != null) setNotifPhone(d.notification_phone)
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
      // Send profile_saved notification
      sendNotification({
        recipientUserId: user.id,
        type: 'profile_saved',
        subject: 'signpost — Profile changes saved',
        body: 'Your profile changes have been saved successfully.',
      }).catch(err => console.error('[profile] notification send failed:', err))
      // Refresh server components (sidebar name/photo)
      router.refresh()
    }
  }

  // ── Photo upload state ─────────────────────────────────────────────────
  const [photoUrl, setPhotoUrl] = useState(fallback(p.photo_url, 'avatarUrl', ''))
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
          <div style={{ marginBottom: 16 }}>
            <LocationPicker
              country={country}
              state={stateProvince}
              city={city}
              onChange={({ country: c, state: s, city: ci }) => {
                setCountry(c)
                setStateProvince(s)
                setCity(ci)
              }}
            />
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
            {REGIONS.map(r => {
              const isOther = r.label !== '🌍 Worldwide'
              const worldwideOn = regions.includes('🌍 Worldwide')
              const disabled = isOther && worldwideOn
              return (
                <div key={r.label} style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                  <ToggleTile
                    label={r.label} dotColor={r.color}
                    selected={regions.includes(r.label)}
                    onToggle={() => { if (!disabled) toggleInList(regions, r.label, setRegions) }}
                  />
                </div>
              )
            })}
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
                  <button onClick={() => { setSignRegional(prev => prev.filter(l => l !== lang)); setSignLangs(prev => prev.filter(l => l !== lang)) }} aria-label={`Remove ${lang}`} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem', color: 'inherit', padding: 0 }}><span aria-hidden="true">✕</span></button>
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
                  <button onClick={() => { setSpokenRegional(prev => prev.filter(l => l !== lang)); setSpokenLangs(prev => prev.filter(l => l !== lang)) }} aria-label={`Remove ${lang}`} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem', color: 'inherit', padding: 0 }}><span aria-hidden="true">✕</span></button>
                </span>
              ))}
            </div>
          )}

          <SaveButton saving={saving} onClick={() => saveFields({
            sign_languages: signLangs, spoken_languages: spokenLangs,
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
          <div style={sectionTitleStyle}>About You</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20, marginTop: -12, lineHeight: 1.6 }}>
            These prompts help you write a compelling profile. Your responses appear as a single About section on your public profile.
          </p>

          {/* Bio field 1: Background */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Describe your interpreting and community background <span style={{ color: 'var(--accent3)' }}>*</span></label>
            <textarea
              value={bio} onChange={e => { if (e.target.value.length <= 500) setBio(e.target.value) }}
              placeholder="Share your background, how you came to interpreting, and your connection to the Deaf community."
              rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              onFocus={handleFocus} onBlur={handleBlur}
            />
            <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: 4, color: bio.length > 450 ? '#ff6b2b' : 'var(--muted)' }}>
              {bio.length} / 500
            </div>
          </div>

          {/* Bio field 2: Specializations */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>What settings or populations do you specialize in serving, and what draws you to that work? <span style={{ color: 'var(--accent3)' }}>*</span></label>
            <textarea
              value={bioSpecializations} onChange={e => { if (e.target.value.length <= 500) setBioSpecializations(e.target.value) }}
              placeholder="Tell us about the settings you work in and why they matter to you."
              rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              onFocus={handleFocus} onBlur={handleBlur}
            />
            <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: 4, color: bioSpecializations.length > 450 ? '#ff6b2b' : 'var(--muted)' }}>
              {bioSpecializations.length} / 500
            </div>
          </div>

          {/* Bio field 3: Extra */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Something about my background or approach that doesn&apos;t fit neatly into a checkbox:</label>
            <textarea
              value={bioExtra} onChange={e => { if (e.target.value.length <= 300) setBioExtra(e.target.value) }}
              placeholder="Optional — share anything that makes your work yours."
              rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              onFocus={handleFocus} onBlur={handleBlur}
            />
            <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: 4, color: bioExtra.length > 250 ? '#ff6b2b' : 'var(--muted)' }}>
              {bioExtra.length} / 300
            </div>
          </div>

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
            saveFields({ bio, bio_specializations: bioSpecializations, bio_extra: bioExtra, video_url: videoUrl, video_desc: videoDescription })
          }} />
        </>
      )}

      {/* ── Tab 5: Skills ──────────────────────────────────────────────── */}
      {activeTab === 'Skills' && (
        <SkillsTab
          specs={specs}
          setSpecs={setSpecs}
          specializedSkills={specializedSkills}
          setSpecializedSkills={setSpecializedSkills}
          saving={saving}
          onSave={() => saveFields({ specializations: specs, specialized_skills: specializedSkills })}
        />
      )}

      {/* ── Tab 6: Community & Identity ────────────────────────────── */}
      {activeTab === 'Community & Identity' && (
        <>
          <div style={sectionTitleStyle}>Community &amp; Identity</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20, marginTop: -12, lineHeight: 1.6 }}>
            These fields are entirely optional and self-selected. Help requesters find interpreters who are exactly the right fit for their needs.
          </p>

          {/* LGBTQ+ */}
          <CommunityToggle label="LGBTQ+" helper="Select if you are available for and affirming of LGBTQ+ clients and settings" checked={lgbtq} onChange={() => setLgbtq(!lgbtq)} />

          {/* Deaf-parented / CODA */}
          <CommunityToggle label="Deaf-parented / CODA" helper="Select if you grew up with Deaf parents or are a Child of Deaf Adults" checked={deafParented} onChange={() => setDeafParented(!deafParented)} />

          {/* BIPOC */}
          <CommunityToggle label="BIPOC" checked={bipoc} onChange={() => { if (bipoc) { setBipoc(false); setBipocDetails([]) } else { setBipoc(true) } }} />
          {bipoc && (
            <div style={{ marginLeft: 16, marginBottom: 16, paddingLeft: 16, borderLeft: '2px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Black/African American', 'Asian/Pacific Islander', 'Hispanic/Latino(a)', 'Indigenous/Native American', 'Middle Eastern/North African', 'Multiracial'].map(opt => (
                <button key={opt} onClick={() => setBipocDetails(prev => prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt])} style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer',
                  border: bipocDetails.includes(opt) ? '1px solid rgba(0,229,255,0.5)' : '1px solid var(--border)',
                  background: bipocDetails.includes(opt) ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                  color: bipocDetails.includes(opt) ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                }}>{opt}</button>
              ))}
            </div>
          )}

          {/* Religious affiliation */}
          <CommunityToggle label="Religious affiliation" checked={religiousAff} onChange={() => { if (religiousAff) { setReligiousAff(false); setReligiousDetails([]) } else { setReligiousAff(true) } }} />
          {religiousAff && (
            <div style={{ marginLeft: 16, marginBottom: 16, paddingLeft: 16, borderLeft: '2px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Buddhist', 'Christian', 'Hindu', 'Jewish', 'Muslim', 'Sikh', 'Other'].map(opt => (
                <button key={opt} onClick={() => setReligiousDetails(prev => prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt])} style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer',
                  border: religiousDetails.includes(opt) ? '1px solid rgba(0,229,255,0.5)' : '1px solid var(--border)',
                  background: religiousDetails.includes(opt) ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                  color: religiousDetails.includes(opt) ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                }}>{opt}</button>
              ))}
            </div>
          )}

          <SaveButton saving={saving} onClick={() => saveFields({
            lgbtq,
            deaf_parented: deafParented,
            bipoc,
            bipoc_details: bipocDetails,
            religious_affiliation: religiousAff,
            religious_details: religiousDetails,
          })} />
        </>
      )}

      {/* ── Tab 7: Account Settings ──────────────────────────────────── */}
      {activeTab === 'Account Settings' && (
        <SettingsTab
          invoicingPref={invoicingPref}
          setInvoicingPref={setInvoicingPref}
          defaultPaymentTerms={defaultPaymentTerms}
          setDefaultPaymentTerms={setDefaultPaymentTerms}
          paymentMethods={paymentMethods}
          setPaymentMethods={setPaymentMethods}
          notifPrefs={notifPrefs}
          setNotifPrefs={setNotifPrefs}
          notifPhone={notifPhone}
          setNotifPhone={setNotifPhone}
          notifSaving={notifSaving}
          setNotifSaving={setNotifSaving}
          saving={saving}
          onSave={() => saveFields({
            invoicing_preference: invoicingPref,
            payment_methods: paymentMethods,
            default_payment_terms: defaultPaymentTerms,
          })}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── Credentials tab (isolated state) ─────────────────────────────────────────

interface CertEntry { id: string; name: string; issuingBody: string; year: string; verificationLink: string }
interface EduEntry { id: string; degree: string; institution: string; year: string }

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
    initialEducation?.length ? initialEducation : [{ id: `edu-${Date.now()}`, degree: '', institution: '', year: '' }]
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
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Degree / Qualification</label>
              <input value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} placeholder="MA Interpreter Studies" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Institution</label>
                <input value={edu.institution} onChange={e => updateEdu(edu.id, 'institution', e.target.value)} placeholder="Universidad de Salamanca" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Year</label>
                <input value={edu.year || ''} onChange={e => updateEdu(edu.id, 'year', e.target.value)} placeholder="2013" maxLength={4} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
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
        onClick={() => setEducation(prev => [...prev, { id: `edu-${Date.now()}`, degree: '', institution: '', year: '' }])}
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

// ── Skills tab ────────────────────────────────────────────────────────────────

function SkillsTab({ specs, setSpecs, specializedSkills, setSpecializedSkills, saving, onSave }: {
  specs: string[]
  setSpecs: (v: string[]) => void
  specializedSkills: string[]
  setSpecializedSkills: (v: string[]) => void
  saving: boolean
  onSave: () => void
}) {
  // Default all categories collapsed except the first one (Arts & Performance)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    const categories = Object.keys(SPECIALIZATION_CATEGORIES)
    categories.forEach((cat, idx) => {
      initial[cat] = idx !== 0 // first category starts expanded (not collapsed)
    })
    return initial
  })

  function toggleSpec(spec: string) {
    setSpecs(specs.includes(spec) ? specs.filter(s => s !== spec) : [...specs, spec])
  }

  function toggleSkill(skill: string) {
    setSpecializedSkills(specializedSkills.includes(skill) ? specializedSkills.filter(s => s !== skill) : [...specializedSkills, skill])
  }

  function toggleCategory(category: string) {
    setCollapsed(prev => ({ ...prev, [category]: !prev[category] }))
  }

  return (
    <>
      {/* Section 1: Settings & Specializations */}
      <div style={sectionTitleStyle}>Settings & Specializations</div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12, lineHeight: 1.6 }}>
        Select the settings and specialization areas where you work. These help clients find you.
      </p>

      <div style={{
        fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 16,
      }}>
        {specs.length} specialization{specs.length !== 1 ? 's' : ''} selected
      </div>

      {/* Selected tags */}
      {specs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
          {specs.map(spec => (
            <span key={spec} style={{
              padding: '4px 12px', fontSize: '0.78rem',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              borderRadius: 20, border: '1px solid rgba(0,229,255,0.4)',
              background: 'rgba(0,229,255,0.1)', color: 'var(--accent)',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {spec}
              <button onClick={() => toggleSpec(spec)} aria-label={`Remove ${spec}`} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem', color: 'inherit', padding: 0 }}><span aria-hidden="true">✕</span></button>
            </span>
          ))}
        </div>
      )}

      {/* Category groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        {Object.entries(SPECIALIZATION_CATEGORIES).map(([category, subs]) => {
          const isCollapsed = collapsed[category]
          const selectedCount = subs.filter(s => specs.includes(s)).length
          return (
            <div key={category} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', overflow: 'hidden',
            }}>
              <button
                onClick={() => toggleCategory(category)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontFamily: "'Syne', sans-serif", fontSize: '0.72rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: selectedCount > 0 ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                <span>{category}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedCount > 0 && (
                    <span style={{
                      background: 'rgba(0,229,255,0.15)', color: 'var(--accent)',
                      borderRadius: 100, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>{selectedCount}</span>
                  )}
                  <span style={{ fontSize: '0.7rem', transition: 'transform 0.15s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
                </span>
              </button>
              {!isCollapsed && (
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {subs.map(sub => (
                    <label key={sub} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                      background: specs.includes(sub) ? 'rgba(0,229,255,0.06)' : 'transparent',
                      transition: 'background 0.15s',
                      fontSize: '0.85rem', color: specs.includes(sub) ? 'var(--text)' : 'var(--muted)',
                    }}>
                      <input
                        type="checkbox"
                        checked={specs.includes(sub)}
                        onChange={() => toggleSpec(sub)}
                        style={{ accentColor: 'var(--accent)', width: 'auto', flexShrink: 0 }}
                      />
                      {sub}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Section 2: Specialized Skills */}
      <div style={sectionTitleStyle}>Specialized Skills</div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12, lineHeight: 1.6 }}>
        Select any highly specialized skills you hold. These are highlighted separately on your profile.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        {SPECIALIZED_SKILLS.map(skill => (
          <label key={skill} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            background: specializedSkills.includes(skill) ? 'rgba(123,97,255,0.08)' : 'var(--surface2)',
            border: specializedSkills.includes(skill) ? '1px solid rgba(123,97,255,0.3)' : '1px solid var(--border)',
            transition: 'all 0.15s',
            fontSize: '0.85rem', color: specializedSkills.includes(skill) ? 'var(--text)' : 'var(--muted)',
          }}>
            <input
              type="checkbox"
              checked={specializedSkills.includes(skill)}
              onChange={() => toggleSkill(skill)}
              style={{ accentColor: '#7b61ff', width: 'auto', flexShrink: 0 }}
            />
            {skill}
          </label>
        ))}
      </div>

      <SaveButton saving={saving} onClick={onSave} />
    </>
  )
}

// ── Community toggle ──────────────────────────────────────────────────────────

function CommunityToggle({ label, helper, checked, onChange }: { label: string; helper?: string; checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
      padding: '10px 0', marginBottom: 8, background: 'none', border: 'none',
      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
    }}>
      <div style={{
        width: 40, height: 20, borderRadius: 100, flexShrink: 0,
        background: checked ? 'var(--accent)' : 'var(--surface2)',
        border: checked ? 'none' : '1px solid var(--border)',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: checked ? '#000' : 'var(--muted)',
          position: 'absolute', top: 2,
          left: checked ? 22 : 2, transition: 'left 0.2s',
        }} />
      </div>
      <div>
        <span style={{
          fontSize: '0.9rem',
          color: checked ? 'var(--accent)' : 'var(--muted)',
          fontWeight: checked ? 600 : 400,
          display: 'block',
        }}>{label}</span>
        {helper && <span style={{ fontSize: '0.78rem', color: 'var(--muted)', opacity: 0.7, lineHeight: 1.4 }}>{helper}</span>}
      </div>
    </button>
  )
}

// ── Notification category config ──────────────────────────────────────────────

const NOTIF_SECTIONS: { section: string; items: { key: string; label: string; desc: string }[] }[] = [
  {
    section: 'Bookings',
    items: [
      { key: 'new_request', label: 'New request received', desc: 'Date, time, and location in subject' },
      { key: 'booking_confirmed', label: 'Booking confirmed', desc: 'Requester accepted your rate' },
      { key: 'rate_response', label: 'Rate response', desc: 'Requester responded to your rate' },
      { key: 'cancelled_by_requester', label: 'Cancelled by requester', desc: 'Date, time, and location in subject' },
      { key: 'cancelled_by_you', label: 'Cancellation confirmation', desc: 'Your cancellation processed' },
      { key: 'sub_search_update', label: 'Sub search update', desc: 'Replacement interpreter responded' },
      { key: 'booking_reminder', label: 'Booking reminder', desc: '24 hours before assignment' },
    ],
  },
  {
    section: 'Communication',
    items: [
      { key: 'new_message', label: 'New message', desc: 'New message in signpost inbox' },
    ],
  },
  {
    section: 'Invoicing',
    items: [
      { key: 'invoice_paid', label: 'Invoice marked as paid', desc: 'Requester confirmed payment' },
    ],
  },
  {
    section: 'Community',
    items: [
      { key: 'team_invite', label: 'Preferred team invite', desc: 'Another interpreter added you' },
      { key: 'added_to_preferred_list', label: 'Added to preferred list', desc: 'A Deaf individual added you' },
    ],
  },
]

// ── Toggle switch component ───────────────────────────────────────────────────

function ToggleSwitch({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: disabled ? 'default' : 'pointer',
        background: on ? 'var(--accent)' : 'var(--border)',
        position: 'relative', transition: 'background 0.15s', flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2,
        left: on ? 18 : 2,
        transition: 'left 0.15s',
      }} />
    </button>
  )
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab({
  invoicingPref, setInvoicingPref,
  defaultPaymentTerms, setDefaultPaymentTerms,
  paymentMethods, setPaymentMethods,
  notifPrefs, setNotifPrefs,
  notifPhone, setNotifPhone,
  notifSaving, setNotifSaving,
  saving, onSave,
}: {
  invoicingPref: string
  setInvoicingPref: (v: string) => void
  defaultPaymentTerms: string
  setDefaultPaymentTerms: (v: string) => void
  paymentMethods: PaymentMethod[]
  setPaymentMethods: (v: PaymentMethod[]) => void
  notifPrefs: NotificationPreferences
  setNotifPrefs: (v: NotificationPreferences) => void
  notifPhone: string
  setNotifPhone: (v: string) => void
  notifSaving: boolean
  setNotifSaving: (v: boolean) => void
  saving: boolean
  onSave: () => void
}) {
  const [notifToast, setNotifToast] = useState<string | null>(null)

  // Save notification prefs immediately to DB
  async function saveNotifPrefs(updated: NotificationPreferences, phone?: string) {
    setNotifSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setNotifSaving(false); return }

    const payload: Record<string, unknown> = { notification_preferences: updated }
    if (phone !== undefined) payload.notification_phone = phone

    const { error } = await supabase
      .from('interpreter_profiles')
      .update(payload)
      .eq('user_id', user.id)

    if (error) {
      console.error('[settings] notification prefs save failed:', error.message)
      setNotifToast('Failed to save notification preferences')
    } else {
      setNotifToast('Notification preferences saved')
    }
    setNotifSaving(false)
    setTimeout(() => setNotifToast(null), 2000)
  }

  function toggleMasterEmail() {
    const updated = { ...notifPrefs, email_enabled: !notifPrefs.email_enabled }
    setNotifPrefs(updated)
    saveNotifPrefs(updated)
  }

  function toggleMasterSms() {
    const updated = { ...notifPrefs, sms_enabled: !notifPrefs.sms_enabled }
    setNotifPrefs(updated)
    saveNotifPrefs(updated)
  }

  function toggleCategory(key: string, channel: 'email' | 'sms') {
    const current = notifPrefs.categories[key] ?? { email: true, sms: false }
    const updated = {
      ...notifPrefs,
      categories: {
        ...notifPrefs.categories,
        [key]: { ...current, [channel]: !current[channel] },
      },
    }
    setNotifPrefs(updated)
    saveNotifPrefs(updated)
  }

  function savePhone() {
    saveNotifPrefs(notifPrefs, notifPhone)
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '28px 28px',
    marginBottom: 24,
  }

  return (
    <>
      {/* ── Section 1: Invoicing ─────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Invoicing</div>

        {/* Invoicing Preference */}
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
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
        <div style={{ ...sectionTitleStyle, marginTop: 0 }}>Default Payment Terms</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12, lineHeight: 1.6 }}>
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
        <div style={{ ...sectionTitleStyle, marginTop: 0 }}>Payment Methods</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
          These payment links appear on your invoices so requesters know how to pay you. signpost does not process payments or store financial account information.
        </p>

        {paymentMethods.map((pm, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
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
            fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', marginBottom: 4,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
        >
          + Add payment method
        </button>
      </div>

      {/* Save button for invoicing section */}
      <SaveButton saving={saving} onClick={onSave} />

      {/* ── Section 2: Notifications ─────────────────────────────────── */}
      <div style={{ ...cardStyle, marginTop: 8 }}>
        <div style={sectionTitleStyle}>Notifications</div>

        {/* Master toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Email notifications</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>Receive notifications via email</div>
            </div>
            <ToggleSwitch on={notifPrefs.email_enabled} onChange={toggleMasterEmail} disabled={notifSaving} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>SMS notifications</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>Standard messaging rates may apply. You can opt out anytime.</div>
              </div>
              <ToggleSwitch on={notifPrefs.sms_enabled} onChange={toggleMasterSms} disabled={notifSaving} />
            </div>
            {notifPrefs.sms_enabled && (
              <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: 400 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Phone number for SMS</label>
                  <input
                    type="tel"
                    value={notifPhone}
                    onChange={e => setNotifPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
                <button
                  onClick={savePhone}
                  className="btn-primary"
                  style={{ padding: '10px 16px', fontSize: '0.82rem', flexShrink: 0, marginBottom: 0 }}
                  disabled={notifSaving}
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category toggles */}
        {NOTIF_SECTIONS.map(section => (
          <div key={section.section} style={{ marginBottom: 20 }}>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontSize: '0.65rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)',
              marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)',
            }}>
              {section.section}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.items.map(item => {
                const pref = notifPrefs.categories[item.key] ?? { email: true, sms: false }
                return (
                  <div key={item.key} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 500 }}>{item.label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 1 }}>{item.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                        <ToggleSwitch
                          on={notifPrefs.email_enabled && pref.email}
                          onChange={() => toggleCategory(item.key, 'email')}
                          disabled={notifSaving || !notifPrefs.email_enabled}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SMS</span>
                        <ToggleSwitch
                          on={notifPrefs.sms_enabled && pref.sms}
                          onChange={() => toggleCategory(item.key, 'sms')}
                          disabled={notifSaving || !notifPrefs.sms_enabled}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Subtle save confirmation */}
        {notifToast && (
          <div style={{
            padding: '8px 14px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
            fontSize: '0.82rem', color: 'var(--accent)', marginTop: 8,
            transition: 'opacity 0.3s',
          }}>
            {notifToast}
          </div>
        )}

        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', opacity: 0.7, marginTop: 16, lineHeight: 1.5 }}>
          Every email notification includes a link to manage these settings.
        </p>
      </div>

      {/* Section 3 reserved for future account settings */}
    </>
  )
}
