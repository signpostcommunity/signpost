'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/dashboard/interpreter/shared'
import Toast from '@/components/ui/Toast'
import {
  SIGN_LANGUAGES_TOP6, SIGN_LANGUAGES_BY_REGION,
  SPOKEN_LANGUAGES_TOP6, SPOKEN_LANGUAGES_BY_REGION,
} from '@/lib/data/languages'
import { SPECIALIZATION_CATEGORIES, SPECIALIZED_SKILLS } from '@/lib/constants/specializations'
import { MENTORSHIP_CATEGORIES, type MentorshipCategory } from '@/lib/mentorship-categories'
import { getVideoEmbedUrl, isValidVideoUrl } from '@/lib/videoUtils'
import { TIMEZONE_LABELS, getTimezoneLabel } from '@/lib/timezones'
import InlineVideoCapture from '@/components/ui/InlineVideoCapture'
import LocationPicker from '@/components/shared/LocationPicker'
import { useDialCode } from '@/components/shared/PhoneWithDialCode'
import { generateSlug, validateSlug } from '@/lib/slugUtils'
import { resizeImage } from '@/lib/imageUtils'
import PhotoCropModal from '@/components/PhotoCropModal'
import { readFileAsDataUrl } from '@/lib/cropImage'
import BookMeBadge from '@/components/interpreter/BookMeBadge'
import { syncNameFields } from '@/lib/nameSync'

// ── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '11px 14px',
  color: 'var(--text)',
  fontSize: '0.9rem',
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#c8cdd8',
  marginBottom: 6,
}

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '13px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#00e5ff',
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
        fontFamily: "'Inter', sans-serif", lineHeight: 1.4, wordBreak: 'break-word',
      }}
    >
      {label}
    </span>
  )
}

// ── Region toggle tile ───────────────────────────────────────────────────────

const REGIONS = [
  { label: '\u{1F30D} Worldwide', color: '#00e5ff' },
  { label: 'NA - North America', color: '#f97316' },
  { label: 'LATAM - Latin America & Caribbean', color: '#a78bfa' },
  { label: 'EU - Europe', color: '#60a5fa' },
  { label: 'AF - Africa', color: '#34d399' },
  { label: 'ME - Middle East', color: '#fb923c' },
  { label: 'SA - South & Central Asia', color: '#f472b6' },
  { label: 'EA - East & Southeast Asia', color: '#facc15' },
  { label: 'OC - Oceania & Pacific', color: '#4dd9ac' },
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
  id?: string | null
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  pronouns?: string | null
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
  aspirational_specializations?: string[] | null
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
  vanity_slug?: string | null
  mentorship_offering?: boolean | null
  mentorship_seeking?: boolean | null
  mentorship_types?: string[] | null
  mentorship_types_offering?: string[] | null
  mentorship_types_seeking?: string[] | null
  mentorship_paid?: string | null
  mentorship_bio_offering?: string | null
  mentorship_bio_seeking?: string | null
  directory_visible?: boolean | null
  timezone?: string | null
}

interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  categories: Record<string, { email: boolean; sms: boolean }>
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  email_enabled: true,
  sms_enabled: true,
  categories: {
    new_request: { email: true, sms: true },
    booking_confirmed: { email: true, sms: true },
    rate_response: { email: true, sms: true },
    cancelled_by_requester: { email: true, sms: true },
    cancelled_by_you: { email: true, sms: true },
    sub_search_update: { email: true, sms: true },
    booking_reminder: { email: true, sms: true },
    new_message: { email: true, sms: true },
    invoice_paid: { email: true, sms: true },
    team_invite: { email: true, sms: true },
    added_to_preferred_list: { email: true, sms: true },
    welcome: { email: true, sms: true },
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

const TABS = ['Personal', 'Languages', 'Credentials', 'Bio & Video', 'Skills', 'Community & Identity', 'Mentorship', 'Account Settings'] as const
type Tab = typeof TABS[number]

function ProfileSidebarNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <>
      {/* Desktop: vertical left sidebar */}
      <nav aria-label="Profile sections" className="profile-sidebar-desktop" style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        paddingTop: 8,
      }}>
        {TABS.map(tab => {
          const isActive = active === tab
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 16px',
                background: isActive ? 'rgba(0,229,255,0.04)' : 'transparent',
                borderLeft: isActive ? '2px solid #00e5ff' : '2px solid transparent',
                border: 'none', borderLeftStyle: 'solid', borderLeftWidth: 2,
                borderLeftColor: isActive ? '#00e5ff' : 'transparent',
                cursor: 'pointer',
                fontSize: '14px', fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
                color: isActive ? '#f0f2f8' : '#96a0b8',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#f0f2f8'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#96a0b8'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {tab}
            </button>
          )
        })}
      </nav>

      {/* Mobile: dropdown selector */}
      <div className="profile-sidebar-mobile" style={{ display: 'none', marginBottom: 24 }}>
        <select
          value={active}
          onChange={e => onChange(e.target.value as Tab)}
          aria-label="Profile section"
          style={{
            width: '100%',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '11px 14px',
            color: 'var(--text)',
            fontSize: '0.9rem',
            fontFamily: "'Inter', sans-serif",
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2396a0b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            paddingRight: 36,
          }}
        >
          {TABS.map(tab => (
            <option key={tab} value={tab}>{tab}</option>
          ))}
        </select>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .profile-sidebar-desktop { display: block !important; }
          .profile-sidebar-mobile { display: none !important; }
        }
        @media (max-width: 768px) {
          .profile-sidebar-desktop { display: none !important; }
          .profile-sidebar-mobile { display: block !important; }
        }
      `}</style>
    </>
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
    // Also scroll the dashboard main container (has its own overflow)
    document.querySelector('.dash-main')?.scrollTo({ top: 0, behavior: 'instant' })
  }
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Personal state (columns → draft_data fallback) ─────────────────────
  const [firstName, setFirstName] = useState(fallback(p.first_name, 'firstName', ''))
  const [lastName, setLastName] = useState(fallback(p.last_name, 'lastName', ''))
  const [city, setCity] = useState(fallback(p.city, 'city', ''))
  const [stateProvince, setStateProvince] = useState(fallback(p.state, 'state', ''))
  const [country, setCountry] = useState(fallback(p.country, 'country', ''))
  const dialCode = useDialCode(country)
  const [phone, setPhone] = useState(fallback(p.phone, 'phone', ''))
  const [yearsExperience, setYearsExperience] = useState(fallback(p.years_experience, 'yearsExperience', ''))
  const [interpreterType, setInterpreterType] = useState(fallback(p.interpreter_type, 'interpreterType', ''))
  const [modeOfWork, setModeOfWork] = useState(fallback(p.work_mode, 'modeOfWork', ''))
  const [eventCoordination, setEventCoordination] = useState(fallback(p.event_coordination, 'eventCoordination', false))
  const [coordinationBio, setCoordinationBio] = useState(fallback(p.event_coordination_desc, 'coordinationBio', ''))
  const [pronouns, setPronouns] = useState(fallback(p.pronouns, 'pronouns', ''))
  const [genderIdentity, setGenderIdentity] = useState(fallback(p.gender_identity, 'genderIdentity', ''))

  // ── Book Me slug state ──────────────────────────────────────────────
  const [vanitySlug, setVanitySlug] = useState(p.vanity_slug || '')
  const [editingSlug, setEditingSlug] = useState(false)
  const [slugDraft, setSlugDraft] = useState(p.vanity_slug || '')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [slugError, setSlugError] = useState<string | null>(null)
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [slugSaving, setSlugSaving] = useState(false)

  function checkSlugAvailability(slug: string) {
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current)
    const validation = validateSlug(slug)
    if (!validation.valid) {
      setSlugStatus('invalid')
      setSlugError(validation.error || 'Invalid')
      return
    }
    setSlugStatus('checking')
    setSlugError(null)
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`)
        const data = await res.json()
        if (data.available) {
          setSlugStatus('available')
          setSlugError(null)
        } else {
          setSlugStatus(data.reason === 'taken' ? 'taken' : 'invalid')
          setSlugError(data.reason === 'taken' ? 'Already taken' : data.reason === 'reserved' ? 'This URL is reserved' : 'Invalid')
        }
      } catch {
        setSlugStatus('invalid')
        setSlugError('Could not check availability')
      }
    }, 500)
  }

  async function saveSlug() {
    if (slugStatus !== 'available' && slugDraft !== vanitySlug) return
    setSlugSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSlugSaving(false); return }
    const { error } = await supabase
      .from('interpreter_profiles')
      .update({ vanity_slug: slugDraft, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
    setSlugSaving(false)
    if (error) {
      setToast({ message: `Error saving slug: ${error.message}`, type: 'error' })
    } else {
      setVanitySlug(slugDraft)
      setEditingSlug(false)
      setToast({ message: 'Book Me link saved.', type: 'success' })
    }
  }

  // ── Languages state ────────────────────────────────────────────────────
  const [signLangs, setSignLangs] = useState<string[]>(fallback(p.sign_languages, 'signLanguages', [] as string[]))
  const [spokenLangs, setSpokenLangs] = useState<string[]>(fallback(p.spoken_languages, 'spokenLanguages', [] as string[]))
  const [specs, setSpecs] = useState<string[]>(fallback(p.specializations, 'specializations', [] as string[]))
  const [aspirationalSpecs, setAspirationalSpecs] = useState<string[]>(fallback(p.aspirational_specializations, 'aspirationalSpecializations', [] as string[]))
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

  // Multi-video state
  interface InterpreterVideo {
    id: string
    language: string
    label: string | null
    video_url: string
    video_source: string
    sort_order: number
  }
  const [interpreterVideos, setInterpreterVideos] = useState<InterpreterVideo[]>([])
  // videoRecorderOpen removed - using inline capture
  const [newVideoLanguage, setNewVideoLanguage] = useState('')
  const [newVideoLabel, setNewVideoLabel] = useState('')
  const [pendingVideoUrl, setPendingVideoUrl] = useState('')
  const [pendingVideoSource, setPendingVideoSource] = useState<'recorded' | 'uploaded' | 'url'>('url')
  const [showVideoForm, setShowVideoForm] = useState(false)
  const [videosLoading, setVideosLoading] = useState(false)

  // ── Payment & Invoicing state ───────────────────────────────────────
  const [invoicingPref, setInvoicingPref] = useState(p.invoicing_preference || 'own')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(p.payment_methods || [])
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(p.default_payment_terms || 'net_30')

  // ── Notification state ──────────────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(p.notification_preferences || DEFAULT_NOTIFICATION_PREFS)
  const [notifPhone, setNotifPhone] = useState(p.notification_phone || p.phone || '')
  const [notifSaving, setNotifSaving] = useState(false)

  // ── Directory visibility (pause profile) ─────────────────────────────
  const [directoryVisible, setDirectoryVisible] = useState<boolean>(
    p.directory_visible === false ? false : true
  )

  // ── Timezone (auto-detected from browser, editable in Account Settings) ──
  const [timezone, setTimezone] = useState<string>(p.timezone || '')

  // Auto-detect from browser if missing, then save silently
  useEffect(() => {
    if (timezone) return
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (!tz) return
      setTimezone(tz)
      const supabase = createClient()
      ;(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        await supabase
          .from('interpreter_profiles')
          .update({ timezone: tz, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
      })()
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Community & Identity state ────────────────────────────────────
  const [lgbtq, setLgbtq] = useState(fallback(p.lgbtq, 'lgbtq', false))
  const [deafParented, setDeafParented] = useState(fallback(p.deaf_parented, 'deafParented', false))
  const [bipoc, setBipoc] = useState(fallback(p.bipoc, 'bipoc', false))
  const [bipocDetails, setBipocDetails] = useState<string[]>(fallback(p.bipoc_details, 'bipocDetails', [] as string[]))
  const [religiousAff, setReligiousAff] = useState(fallback(p.religious_affiliation, 'religiousAffiliation', false))
  const [religiousDetails, setReligiousDetails] = useState<string[]>(fallback(p.religious_details, 'religiousDetails', [] as string[]))

  // ── Mentorship state ────────────────────────────────────────────────
  const [mentorshipOffering, setMentorshipOffering] = useState(fallback(p.mentorship_offering, 'mentorshipOffering', false))
  const [mentorshipSeeking, setMentorshipSeeking] = useState(fallback(p.mentorship_seeking, 'mentorshipSeeking', false))
  const [mentorshipTypes, setMentorshipTypes] = useState<string[]>(fallback(p.mentorship_types, 'mentorshipTypes', [] as string[]))
  const [mentorshipTypesOffering, setMentorshipTypesOffering] = useState<string[]>(
    fallback(p.mentorship_types_offering, 'mentorshipTypesOffering', fallback(p.mentorship_types, 'mentorshipTypes', [] as string[]))
  )
  const [mentorshipTypesSeeking, setMentorshipTypesSeeking] = useState<string[]>(
    fallback(p.mentorship_types_seeking, 'mentorshipTypesSeeking', fallback(p.mentorship_types, 'mentorshipTypes', [] as string[]))
  )
  const [mentorshipPaid, setMentorshipPaid] = useState<string>(fallback(p.mentorship_paid, 'mentorshipPaid', ''))
  const [mentorshipBioOffering, setMentorshipBioOffering] = useState(fallback(p.mentorship_bio_offering, 'mentorshipBioOffering', ''))
  const [mentorshipBioSeeking, setMentorshipBioSeeking] = useState(fallback(p.mentorship_bio_seeking, 'mentorshipBioSeeking', ''))

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
        .select('id, name, first_name, last_name, email, pronouns, city, state, country, phone, years_experience, interpreter_type, work_mode, bio, bio_specializations, bio_extra, sign_languages, spoken_languages, specializations, aspirational_specializations, specialized_skills, regions, video_url, video_desc, event_coordination, event_coordination_desc, draft_data, status, photo_url, invoicing_preference, payment_methods, default_payment_terms, notification_preferences, notification_phone, lgbtq, deaf_parented, bipoc, bipoc_details, religious_affiliation, religious_details, gender_identity, vanity_slug, mentorship_offering, mentorship_seeking, mentorship_types, mentorship_types_offering, mentorship_types_seeking, mentorship_paid, mentorship_bio_offering, mentorship_bio_seeking, directory_visible, timezone')
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
      if ((d as ProfileData).pronouns != null) setPronouns((d as ProfileData).pronouns || '')
      if ((d as ProfileData).gender_identity != null) setGenderIdentity((d as ProfileData).gender_identity || '')
      if (d.sign_languages) setSignLangs(d.sign_languages)
      if (d.spoken_languages) setSpokenLangs(d.spoken_languages)
      if (d.specializations) setSpecs(d.specializations)
      if (d.aspirational_specializations) setAspirationalSpecs(d.aspirational_specializations)
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
      if ((d as ProfileData).vanity_slug != null) {
        setVanitySlug((d as ProfileData).vanity_slug || '')
        setSlugDraft((d as ProfileData).vanity_slug || '')
      }
      if (d.mentorship_offering != null) setMentorshipOffering(d.mentorship_offering)
      if (d.mentorship_seeking != null) setMentorshipSeeking(d.mentorship_seeking)
      if (d.mentorship_types) setMentorshipTypes(d.mentorship_types)
      if (d.mentorship_types_offering) setMentorshipTypesOffering(d.mentorship_types_offering)
      if (d.mentorship_types_seeking) setMentorshipTypesSeeking(d.mentorship_types_seeking)
      if (d.mentorship_paid != null) setMentorshipPaid(d.mentorship_paid || '')
      if (d.mentorship_bio_offering != null) setMentorshipBioOffering(d.mentorship_bio_offering || '')
      if (d.mentorship_bio_seeking != null) setMentorshipBioSeeking(d.mentorship_bio_seeking || '')
      if (d.directory_visible != null) setDirectoryVisible(d.directory_visible)
      if (d.timezone != null) setTimezone(d.timezone)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Load interpreter_videos ──────────────────────────────────────────
  useEffect(() => {
    if (!p.id) return
    setVideosLoading(true)
    const supabase = createClient()
    supabase
      .from('interpreter_videos')
      .select('id, language, label, video_url, video_source, sort_order')
      .eq('interpreter_id', p.id)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setInterpreterVideos(data)
        setVideosLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id])

  async function loadVideos() {
    if (!p.id) return
    const supabase = createClient()
    const { data } = await supabase
      .from('interpreter_videos')
      .select('id, language, label, video_url, video_source, sort_order')
      .eq('interpreter_id', p.id)
      .order('sort_order')
    if (data) setInterpreterVideos(data)
  }

  async function deleteVideo(videoId: string) {
    const supabase = createClient()
    await supabase.from('interpreter_videos').delete().eq('id', videoId)
    setInterpreterVideos(prev => prev.filter(v => v.id !== videoId))
  }

  async function saveNewVideo() {
    if (!p.id || !pendingVideoUrl || !newVideoLanguage) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('interpreter_videos')
      .insert({
        interpreter_id: p.id,
        language: newVideoLanguage,
        label: newVideoLabel || null,
        video_url: pendingVideoUrl,
        video_source: pendingVideoSource,
        sort_order: interpreterVideos.length,
      })
      .select()
      .single()

    if (!error && data) {
      setInterpreterVideos(prev => [...prev, data])
      // Notify video request fulfillment (fire and forget)
      fetch('/api/video-request/fulfilled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interpreter_id: p.id }),
      }).catch(() => {})
    }
    setPendingVideoUrl('')
    setPendingVideoSource('url')
    setNewVideoLanguage('')
    setNewVideoLabel('')
    setShowVideoForm(false)
    setSaving(false)
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  function toggleInList(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  async function saveFields(fields: Record<string, unknown>) {
    setSaving(true)
    const { normalizeProfileFields } = await import('@/lib/normalize')
    fields = normalizeProfileFields(fields)
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

    // Task 4: Keep name in sync with first_name + last_name
    // TODO: Tech debt - remove interpreter_profiles.name column, derive display name from first_name + last_name
    const normFirst = (fields.first_name as string) || firstName
    const normLast = (fields.last_name as string) || lastName
    const payload = {
      user_id: user.id,
      name: [normFirst, normLast].filter(Boolean).join(' ') || userEmail,
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
      console.error('Save returned no rows - RLS may be blocking the write')
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

      // If location fields changed, geocode and update lat/lng (non-blocking)
      if ('city' in fields || 'state' in fields || 'country' in fields) {
        const locCity = ('city' in fields ? fields.city : city) as string
        const locState = ('state' in fields ? fields.state : stateProvince) as string
        const locCountry = ('country' in fields ? fields.country : country) as string
        if (locCity || locState || locCountry) {
          try {
            const geoRes = await fetch('/api/geocode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ city: locCity, state: locState, country: locCountry }),
            })
            if (geoRes.ok) {
              const { latitude, longitude } = await geoRes.json()
              await supabase.from('interpreter_profiles')
                .update({ latitude, longitude })
                .eq('user_id', user.id)
            }
          } catch (geoErr) {
            console.warn('[profile] Geocoding failed, continuing without coordinates:', geoErr)
          }
        }
      }
    }
  }

  // ── Photo upload state ─────────────────────────────────────────────────
  const [photoUrl, setPhotoUrl] = useState(fallback(p.photo_url, 'avatarUrl', ''))
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadMsg(null)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setCropSrc(dataUrl)
    } catch {
      setUploadMsg({ text: 'Could not read image.', type: 'error' })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handlePhotoUpload(croppedBlob: Blob) {
    setCropSrc(null)
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })

    setUploading(true)
    setUploadMsg(null)

    let uploadFile: File = file
    if (file.size > 2 * 1024 * 1024) {
      try {
        uploadFile = await resizeImage(file, 2)
        if (uploadFile.size > 2 * 1024 * 1024) {
          setUploadMsg({ text: 'Image is too large even after resizing. Please use a smaller photo.', type: 'error' })
          setUploading(false)
          return
        }
      } catch {
        setUploadMsg({ text: 'Could not resize image. Please use a smaller photo.', type: 'error' })
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
      setUploading(false)
      setUploadMsg({ text: `Upload failed: ${uploadError.message}`, type: 'error' })
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    let dbData, dbError;
    // Try to update existing row
    const updateResult = await supabase
      .from('interpreter_profiles')
      .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()

    dbData = updateResult.data;
    dbError = updateResult.error;

    // If no row found, create one
    if (!dbError && (!dbData || dbData.length === 0)) {
      // TODO: Tech debt - remove interpreter_profiles.name column, derive from first_name + last_name
      const insertResult = await supabase
        .from('interpreter_profiles')
        .insert(syncNameFields({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          name: [firstName, lastName].filter(Boolean).join(' ') || userEmail,
          photo_url: publicUrl,
          status: 'approved',
          updated_at: new Date().toISOString(),
        }))
        .select()
      dbData = insertResult.data;
      dbError = insertResult.error;
    }

    console.log('Photo save response:', { data: dbData, error: dbError })

    setUploading(false)
    if (dbError) {
      setUploadMsg({ text: `Save failed: ${dbError.message}`, type: 'error' })
    } else if (!dbData || dbData.length === 0) {
      setUploadMsg({ text: 'Your profile is still being created. Please refresh the page and try again in a moment.', type: 'error' })
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
    <>
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <PageHeader
          title="My Profile"
          subtitle={hasProfile
            ? "This is what requesters see when they view your listing. Keep it current."
            : "Complete your profile below to get listed in the directory."
          }
        />
      </div>

      {/* Profile header card with Preview Profile button */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.3rem' }}>{displayName}</div>
          {(p.city || p.state) && (
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
              {[p.city, p.state].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
        {p.id && (
          <a
            href={`/directory/${p.id}`}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: '#00e5ff',
              textDecoration: 'none',
              background: 'transparent',
              border: '1px solid #00e5ff',
              padding: '8px 16px',
              borderRadius: 10,
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            Preview Profile
          </a>
        )}
      </div>

      {/* Sidebar + Content layout */}
      <div className="profile-editor-layout" style={{ display: 'flex', gap: 0, minHeight: '60vh' }}>
        <ProfileSidebarNav active={activeTab} onChange={setActiveTab} />

        <div className="profile-editor-content" style={{ flex: 1, padding: '0 0 0 32px', minWidth: 0, maxWidth: 720 }}>
          {/* Active section label */}
          <div style={{
            fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: '#00e5ff', marginBottom: 20,
          }}>
            {activeTab}
          </div>

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
                objectPosition: 'center 20%',
                border: '2px solid var(--accent)', flexShrink: 0,
              }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#7b61ff,#00e5ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: '#fff',
              }}>{initials}</div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoFileSelect}
                style={{ display: 'none' }}
              />
              {cropSrc && (
                <PhotoCropModal
                  imageSrc={cropSrc}
                  onCropped={handlePhotoUpload}
                  onCancel={() => setCropSrc(null)}
                />
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  background: 'none', border: '1px solid rgba(0,229,255,0.4)',
                  color: 'var(--accent)', borderRadius: 8, padding: '8px 16px',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading ? 'Uploading...' : photoUrl ? 'Change photo' : 'Upload photo'}
              </button>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>
                JPG, PNG, or WebP. Large photos are auto-resized.
              </div>
              {uploadMsg && (
                <div style={{
                  fontSize: '0.78rem', marginTop: 6,
                  color: uploadMsg.type === 'success' ? '#34d399' : 'var(--accent3)',
                }}>{uploadMsg.text}</div>
              )}
            </div>
          </div>

          {/* ── Book Me Badges ─────────────────────────────── */}
          <div style={sectionTitleStyle}>Book Me Badges</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 20, marginTop: -12, lineHeight: 1.5 }}>
            Add this badge to your email signature, website, or LinkedIn to make it easy to book you directly. When someone clicks the badge, it takes them straight to your signpost profile where they can send a booking request directly to you.
          </p>
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '24px', marginBottom: 24,
          }}>
            {/* ── Badge preview ── */}
            {vanitySlug && p.id && (
              <div style={{ marginBottom: 24 }}>
                <BookMeBadge
                  interpreterProfileId={p.id}
                  displayName={displayName || 'Interpreter'}
                />
              </div>
            )}

            {/* ── Your link ── */}
            <div style={{ marginBottom: vanitySlug ? 24 : 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Your link</div>
              {vanitySlug && !editingSlug ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '1rem', fontWeight: 600, color: 'var(--accent)',
                      fontFamily: "'Inter', sans-serif", wordBreak: 'break-all',
                    }}>
                      signpost.community/book/{vanitySlug}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://signpost.community/book/${vanitySlug}`)
                        setToast({ message: 'Copied to clipboard!', type: 'success' })
                      }}
                      style={{
                        background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
                        color: 'var(--accent)', borderRadius: 8, padding: '6px 14px',
                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Copy link
                    </button>
                    <button
                      onClick={() => { setEditingSlug(true); setSlugDraft(vanitySlug); setSlugStatus('idle') }}
                      style={{
                        background: 'none', border: '1px solid var(--border)',
                        color: 'var(--muted)', borderRadius: 8, padding: '6px 14px',
                        fontSize: '0.82rem', cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {!vanitySlug && <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 12 }}>You don&apos;t have a Book Me link yet.</p>}
                  <div style={{
                    display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 8,
                  }}>
                    <div style={{
                      background: 'var(--surface)', padding: '11px 12px', fontSize: '0.85rem',
                      color: 'var(--muted)', whiteSpace: 'nowrap', borderRight: '1px solid var(--border)',
                      flexShrink: 0, fontFamily: "'Inter', sans-serif",
                    }}>
                      signpost.community/book/
                    </div>
                    <input
                      type="text"
                      value={slugDraft}
                      placeholder={generateSlug(firstName, lastName) || 'your-name'}
                      onChange={e => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        setSlugDraft(val)
                        if (val.length >= 3) {
                          checkSlugAvailability(val)
                        } else if (val.length > 0) {
                          setSlugStatus('invalid')
                          setSlugError('Must be at least 3 characters')
                        } else {
                          setSlugStatus('idle')
                        }
                      }}
                      style={{
                        flex: 1, background: 'var(--card-bg)', border: 'none', padding: '11px 14px',
                        color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                        fontFamily: "'Inter', sans-serif", minWidth: 0,
                      }}
                    />
                  </div>
                  {slugDraft && slugStatus !== 'idle' && (
                    <div style={{
                      fontSize: '0.78rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4,
                      color: slugStatus === 'available' ? '#34d399'
                        : slugStatus === 'checking' ? 'var(--muted)'
                        : 'var(--accent3)',
                    }}>
                      {slugStatus === 'checking' && 'Checking...'}
                      {slugStatus === 'available' && <><span style={{ fontWeight: 600 }}>&#10003;</span> Available</>}
                      {slugStatus === 'taken' && <><span style={{ fontWeight: 600 }}>&#10005;</span> {slugError}</>}
                      {slugStatus === 'invalid' && <><span style={{ fontWeight: 600 }}>&#10005;</span> {slugError}</>}
                    </div>
                  )}
                  {editingSlug && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--accent3)', marginBottom: 8, lineHeight: 1.5 }}>
                      Changing your link means your old link will stop working. Update it anywhere you&apos;ve shared it.
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={saveSlug}
                      disabled={slugSaving || (slugStatus !== 'available' && slugDraft !== vanitySlug)}
                      className="btn-primary"
                      style={{
                        fontSize: '0.82rem', padding: '8px 18px',
                        opacity: (slugSaving || (slugStatus !== 'available' && slugDraft !== vanitySlug)) ? 0.5 : 1,
                      }}
                    >
                      {slugSaving ? 'Saving...' : 'Save'}
                    </button>
                    {editingSlug && (
                      <button
                        onClick={() => { setEditingSlug(false); setSlugDraft(vanitySlug); setSlugStatus('idle') }}
                        style={{
                          background: 'none', border: '1px solid var(--border)',
                          color: 'var(--muted)', borderRadius: 8, padding: '6px 14px',
                          fontSize: '0.82rem', cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            {vanitySlug && (
              <>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const html = `<a href="https://signpost.community/book/${vanitySlug}" style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px;background:#111118;border:1px solid #1e2433;border-radius:10px;text-decoration:none;font-family:sans-serif"><img src="${photoUrl || ''}" alt="${displayName}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" /><span><strong style="color:#f0f2f8;font-size:13px">${displayName}</strong><br/><span style="color:#00e5ff;font-size:11px;font-weight:700">Book me on signpost</span></span></a>`
                      navigator.clipboard.writeText(html)
                      setToast({ message: 'Badge HTML copied!', type: 'success' })
                    }}
                    style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                  >
                    Copy badge for email
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://signpost.community/book/${vanitySlug}`)
                      setToast({ message: 'Image link copied!', type: 'success' })
                    }}
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      color: 'var(--muted)', borderRadius: 8, padding: '8px 16px',
                      fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Copy badge image link
                  </button>
                </div>

                {/* ── How to add your badge ── */}
                <details style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <summary style={{
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                    color: 'var(--accent)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    <span style={{ transition: 'transform 0.15s', display: 'inline-block' }}>&#9654;</span>
                    How to add your badge
                  </summary>
                  <div style={{ marginTop: 14, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.7 }}>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Email signature (Gmail)</div>
                      Settings &rarr; See all settings &rarr; General &rarr; Signature &rarr; Click the image icon &rarr; Paste your badge image URL &rarr; Link the image to your Book Me URL.
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Email signature (Outlook)</div>
                      Settings &rarr; View all Outlook settings &rarr; Mail &rarr; Compose and reply &rarr; Email signature &rarr; Insert an image or paste the badge HTML.
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Website</div>
                      Copy the badge HTML using &ldquo;Copy badge for email&rdquo; above and paste it into your site&apos;s HTML where you want it to appear.
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>LinkedIn</div>
                      Edit your profile &rarr; Contact info &rarr; Add your Book Me link as a website. You can also add it to your About section or featured links.
                    </div>
                  </div>
                </details>
              </>
            )}
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
              <label style={labelStyle}>Pronouns</label>
              <input value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="e.g. she/her, he/him, they/them" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Gender Identity</label>
              <select
                value={['Woman', 'Man', 'Non-binary', 'Genderqueer', 'Genderfluid', 'Agender', 'Two-Spirit', 'Prefer not to say', ''].includes(genderIdentity) ? genderIdentity : 'Other'}
                onChange={e => {
                  if (e.target.value === 'Other') {
                    setGenderIdentity('Other')
                  } else {
                    setGenderIdentity(e.target.value)
                  }
                }}
                style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
              >
                <option value="">Select…</option>
                <option>Woman</option>
                <option>Man</option>
                <option>Non-binary</option>
                <option>Genderqueer</option>
                <option>Genderfluid</option>
                <option>Agender</option>
                <option>Two-Spirit</option>
                <option>Prefer not to say</option>
                <option>Other</option>
              </select>
              {(genderIdentity === 'Other' || (genderIdentity && !['Woman', 'Man', 'Non-binary', 'Genderqueer', 'Genderfluid', 'Agender', 'Two-Spirit', 'Prefer not to say', ''].includes(genderIdentity))) && (
                <input
                  value={genderIdentity === 'Other' ? '' : genderIdentity}
                  onChange={e => setGenderIdentity(e.target.value || 'Other')}
                  placeholder="Enter your gender identity"
                  style={{ ...inputStyle, marginTop: 8 }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              )}
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 6, lineHeight: 1.4 }}>
                Optional. Helps requesters accommodate specific client preferences when requested.
              </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <span style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRight: 'none', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                  padding: '10px 10px', color: 'var(--muted)', fontSize: '0.9rem',
                  whiteSpace: 'nowrap', lineHeight: 1.4,
                }}>{dialCode}</span>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="555 000 0000" style={{ ...inputStyle, borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
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
            first_name: firstName, last_name: lastName, pronouns, gender_identity: genderIdentity,
            city, state: stateProvince, country, phone,
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
          <div style={{ fontWeight: 500, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#96a0b8', marginBottom: 10 }}>
            Most common
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, marginBottom: 12 }}>
            {SIGN_LANGUAGES_TOP6.map(lang => (
              <Chip key={lang} label={lang} selected={signLangs.includes(lang)} onToggle={() => toggleInList(signLangs, lang, setSignLangs)} />
            ))}
          </div>
          <div style={{ fontWeight: 500, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#96a0b8', marginBottom: 6 }}>
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
                  fontFamily: "'Inter', sans-serif",
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
          <div style={{ fontWeight: 500, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#96a0b8', marginBottom: 10 }}>
            Most common
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, marginBottom: 12 }}>
            {SPOKEN_LANGUAGES_TOP6.map(lang => (
              <Chip key={lang} label={lang} selected={spokenLangs.includes(lang)} onToggle={() => toggleInList(spokenLangs, lang, setSpokenLangs)} />
            ))}
          </div>
          <div style={{ fontWeight: 500, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#96a0b8', marginBottom: 6 }}>
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
                  fontFamily: "'Inter', sans-serif",
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
          profileId={p.id || null}
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
            <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: 4, color: bio.length > 450 ? '#ff7e45' : 'var(--muted)' }}>
              {bio.length} / 500 characters
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
            <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: 4, color: bioSpecializations.length > 450 ? '#ff7e45' : 'var(--muted)' }}>
              {bioSpecializations.length} / 500 characters
            </div>
          </div>

          {/* Bio field 3: Extra */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Something about my background or approach that doesn&apos;t fit neatly into a checkbox:</label>
            <textarea
              value={bioExtra} onChange={e => { if (e.target.value.length <= 300) setBioExtra(e.target.value) }}
              placeholder="Optional - share anything that makes your work yours."
              rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              onFocus={handleFocus} onBlur={handleBlur}
            />
            <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: 4, color: bioExtra.length > 250 ? '#ff7e45' : 'var(--muted)' }}>
              {bioExtra.length} / 300
            </div>
          </div>

          <div style={sectionTitleStyle}>INTRO VIDEO</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12 }}>
            Record a short intro video so clients can see your signing style before they request you.
          </p>

          {/* Prominent CTA when no videos exist */}
          {!videosLoading && interpreterVideos.length === 0 && !showVideoForm && (
            <div style={{
              background: 'rgba(0,229,255,0.04)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: 'var(--radius)',
              padding: 32,
              textAlign: 'center',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 8 }}>
                Record your intro video
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 auto 18px', maxWidth: 460 }}>
                Deaf users consistently rate interpreter intro videos as one of their most valued features of signpost. Record directly in your browser. It takes less than 2 minutes.
              </p>
            </div>
          )}

          {/* Existing videos */}
          {videosLoading ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16 }}>Loading videos...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {interpreterVideos.map(v => {
                const embedUrl = getVideoEmbedUrl(v.video_url)
                return (
                  <div key={v.id} style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600,
                          background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: 'var(--accent)',
                        }}>
                          {v.language}
                        </span>
                        {v.label && <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{v.label}</span>}
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete this video?')) deleteVideo(v.id) }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--accent3)', fontSize: '0.78rem', fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    {embedUrl && (
                      embedUrl.includes('supabase.co/storage') ? (
                        <video controls width="100%" src={embedUrl} style={{ borderRadius: 8, maxHeight: 200, background: '#000' }} />
                      ) : (
                        <iframe
                          width="100%" height="200" src={embedUrl}
                          title={`${v.language} intro video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ borderRadius: 8, border: 'none' }}
                        />
                      )
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Add video form (after recorder saves) */}
          {showVideoForm && pendingVideoUrl && (
            <div style={{
              background: 'var(--surface2)', border: '1px solid rgba(0,229,255,0.3)',
              borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16,
            }}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Language *</label>
                <select
                  value={newVideoLanguage}
                  onChange={e => setNewVideoLanguage(e.target.value)}
                  style={{ ...inputStyle, appearance: 'auto' as unknown as undefined }}
                  onFocus={handleFocus} onBlur={handleBlur}
                >
                  <option value="">Select language...</option>
                  {(signLangs.length > 0 ? signLangs : ['ASL']).map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Label (optional)</label>
                <input
                  type="text"
                  value={newVideoLabel}
                  onChange={e => setNewVideoLabel(e.target.value)}
                  placeholder="e.g. Medical interpreting introduction"
                  style={inputStyle}
                  onFocus={handleFocus} onBlur={handleBlur}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setShowVideoForm(false); setPendingVideoUrl('') }}
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 16px', color: 'var(--muted)',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveNewVideo}
                  disabled={!newVideoLanguage || saving}
                  style={{
                    background: 'var(--accent)', color: '#000', border: 'none',
                    borderRadius: 8, padding: '8px 16px', fontWeight: 600,
                    cursor: !newVideoLanguage || saving ? 'not-allowed' : 'pointer',
                    fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
                    opacity: !newVideoLanguage || saving ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Saving...' : 'Save video'}
                </button>
              </div>
            </div>
          )}

          {/* Add video - inline capture */}
          {!showVideoForm && (
            <InlineVideoCapture
              onVideoSaved={(url, source) => {
                setPendingVideoUrl(url)
                setPendingVideoSource(source)
                setShowVideoForm(true)
                if (signLangs.length > 0) setNewVideoLanguage(signLangs[0])
              }}
              accentColor="#00e5ff"
              storageBucket="interpreter-videos"
              storagePath={p.id ? `${p.id}` : undefined}
              userId={p.id || undefined}
              audioDefault={false}
            />
          )}

          <SaveButton saving={saving} onClick={() => {
            saveFields({ bio, bio_specializations: bioSpecializations, bio_extra: bioExtra })
          }} />
        </>
      )}

      {/* ── Tab 5: Skills ──────────────────────────────────────────────── */}
      {activeTab === 'Skills' && (
        <SkillsTab
          specs={specs}
          setSpecs={setSpecs}
          aspirationalSpecs={aspirationalSpecs}
          setAspirationalSpecs={setAspirationalSpecs}
          specializedSkills={specializedSkills}
          setSpecializedSkills={setSpecializedSkills}
          saving={saving}
          onSave={() => saveFields({ specializations: specs, aspirational_specializations: aspirationalSpecs, specialized_skills: specializedSkills })}
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

          {/* Deaf-Parented Interpreter / CODA */}
          <CommunityToggle label="Deaf-Parented Interpreter / CODA" helper="Select if you grew up with Deaf parents or are a Child of Deaf Adults" checked={deafParented} onChange={() => setDeafParented(!deafParented)} />

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
                  fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
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
                  fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
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

      {/* ── Tab 7: Mentorship ──────────────────────────────────────── */}
      {activeTab === 'Mentorship' && (
        <>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 24, lineHeight: 1.6 }}>
            Connect with other interpreters for professional growth. You can offer mentorship, seek it, or both.
          </p>

          {/* ── Offering mentorship ── */}
          <CommunityToggle
            label="I'm offering mentorship"
            helper="Let other interpreters know you're available to mentor"
            checked={mentorshipOffering}
            onChange={() => setMentorshipOffering(!mentorshipOffering)}
          />

          {mentorshipOffering && (
            <div style={{ marginLeft: 16, paddingLeft: 16, borderLeft: '2px solid var(--border)', marginBottom: 24 }}>
              <label style={labelStyle}>What areas are you offering mentorship in?</label>
              <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {MENTORSHIP_CATEGORIES.map((cat, catIdx) => {
                  const selectedCount = cat.items.filter(item => mentorshipTypesOffering.includes(item.id)).length
                  return (
                    <MentorshipAccordion
                      key={cat.id}
                      category={cat}
                      selectedCount={selectedCount}
                      selectedIds={mentorshipTypesOffering}
                      onToggle={(itemId) => setMentorshipTypesOffering(prev =>
                        prev.includes(itemId) ? prev.filter(v => v !== itemId) : [...prev, itemId]
                      )}
                      showBorder={catIdx < MENTORSHIP_CATEGORIES.length - 1}
                    />
                  )
                })}
              </div>

              {/* Compensation */}
              <div style={{ marginTop: 20, marginBottom: 20 }}>
                <label style={labelStyle}>Compensation</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {([
                    { value: 'pro_bono', label: 'Pro bono' },
                    { value: 'paid', label: 'Paid mentorship' },
                    { value: 'either', label: 'Either -- open to discussing' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setMentorshipPaid(mentorshipPaid === opt.value ? '' : opt.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${mentorshipPaid === opt.value ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
                        background: mentorshipPaid === opt.value ? 'rgba(0,229,255,0.08)' : 'var(--surface2)',
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                        fontSize: '0.85rem', color: mentorshipPaid === opt.value ? 'var(--text)' : 'var(--muted)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: mentorshipPaid === opt.value ? '5px solid var(--accent)' : '2px solid var(--border)',
                        background: mentorshipPaid === opt.value ? '#000' : 'transparent',
                        flexShrink: 0,
                      }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio: offering */}
              <div>
                <label style={labelStyle}>What do you bring as a mentor? (optional)</label>
                <textarea
                  value={mentorshipBioOffering}
                  onChange={e => setMentorshipBioOffering(e.target.value)}
                  placeholder="Your experience, approach, what you enjoy helping with..."
                  rows={3}
                  onFocus={handleFocus as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                  onBlur={handleBlur as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                />
              </div>
            </div>
          )}

          {/* ── Seeking mentorship ── */}
          <CommunityToggle
            label="I'm seeking mentorship"
            helper="Find experienced interpreters who can help you grow"
            checked={mentorshipSeeking}
            onChange={() => setMentorshipSeeking(!mentorshipSeeking)}
          />

          {mentorshipSeeking && (
            <div style={{ marginLeft: 16, paddingLeft: 16, borderLeft: '2px solid var(--border)', marginBottom: 24 }}>
              <label style={labelStyle}>What areas are you looking for mentorship in?</label>
              <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {MENTORSHIP_CATEGORIES.map((cat, catIdx) => {
                  const selectedCount = cat.items.filter(item => mentorshipTypesSeeking.includes(item.id)).length
                  return (
                    <MentorshipAccordion
                      key={cat.id}
                      category={cat}
                      selectedCount={selectedCount}
                      selectedIds={mentorshipTypesSeeking}
                      onToggle={(itemId) => setMentorshipTypesSeeking(prev =>
                        prev.includes(itemId) ? prev.filter(v => v !== itemId) : [...prev, itemId]
                      )}
                      showBorder={catIdx < MENTORSHIP_CATEGORIES.length - 1}
                    />
                  )
                })}
              </div>

              {/* Bio: seeking */}
              <div style={{ marginTop: 20 }}>
                <label style={labelStyle}>What are you looking for? (optional)</label>
                <textarea
                  value={mentorshipBioSeeking}
                  onChange={e => setMentorshipBioSeeking(e.target.value)}
                  placeholder="Specific skills, guidance areas, what kind of support would help you grow..."
                  rows={3}
                  onFocus={handleFocus as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                  onBlur={handleBlur as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                />
              </div>
            </div>
          )}

          <SaveButton saving={saving} onClick={() => saveFields({
            mentorship_offering: mentorshipOffering,
            mentorship_seeking: mentorshipSeeking,
            mentorship_types: [...new Set([...mentorshipTypesOffering, ...mentorshipTypesSeeking])],
            mentorship_types_offering: mentorshipTypesOffering,
            mentorship_types_seeking: mentorshipTypesSeeking,
            mentorship_paid: mentorshipPaid || null,
            mentorship_bio_offering: mentorshipBioOffering || null,
            mentorship_bio_seeking: mentorshipBioSeeking || null,
          })} />
        </>
      )}

      {/* ── Tab 8: Account Settings ──────────────────────────────────── */}
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
          directoryVisible={directoryVisible}
          setDirectoryVisible={setDirectoryVisible}
          timezone={timezone}
          setTimezone={setTimezone}
          setToast={setToast}
          saving={saving}
          onSave={() => saveFields({
            invoicing_preference: invoicingPref,
            payment_methods: paymentMethods,
            default_payment_terms: defaultPaymentTerms,
          })}
        />
      )}

        </div>{/* end profile-editor-content */}
      </div>{/* end profile-editor-layout */}

      <style>{`
        @media (max-width: 768px) {
          .profile-editor-layout { flex-direction: column !important; }
          .profile-editor-content { padding: 0 !important; }
        }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
    </>
  )
}

// ── Credentials tab (isolated state) ─────────────────────────────────────────

interface CertEntry { id: string; name: string; issuingBody: string; year: string; verificationLink: string }
interface EduEntry { id: string; degree: string; institution: string; year: string }

function CredentialsTab({ saving, onSave, profileId, initialCerts, initialEducation, existingDraftData }: {
  saving: boolean
  onSave: (fields: Record<string, unknown>) => Promise<void>
  profileId: string | null
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
  const [loadedFromDb, setLoadedFromDb] = useState(false)

  // Load certs/education from dedicated tables on mount
  useEffect(() => {
    if (!profileId) return
    const supabase = createClient()
    ;(async () => {
      const [certsResult, eduResult] = await Promise.all([
        supabase.from('interpreter_certifications').select('id, name, issuing_body, year, verification_url').eq('interpreter_id', profileId),
        supabase.from('interpreter_education').select('id, degree, institution, year').eq('interpreter_id', profileId),
      ])
      if (certsResult.data && certsResult.data.length > 0) {
        setCerts(certsResult.data.map((c: { id: string; name: string; issuing_body: string; year: number | null; verification_url: string | null }) => ({
          id: c.id,
          name: c.name || '',
          issuingBody: c.issuing_body || '',
          year: c.year ? String(c.year) : '',
          verificationLink: c.verification_url || '',
        })))
      }
      if (eduResult.data && eduResult.data.length > 0) {
        setEducation(eduResult.data.map((e: { id: string; degree: string; institution: string; year: number | null }) => ({
          id: e.id,
          degree: e.degree || '',
          institution: e.institution || '',
          year: e.year ? String(e.year) : '',
        })))
      }
      setLoadedFromDb(true)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId])

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
              <label style={labelStyle}>Issuing Body</label>
              <input value={cert.issuingBody} onChange={e => updateCert(cert.id, 'issuingBody', e.target.value)} placeholder="e.g. RID" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Certification Name</label>
                <input value={cert.name} onChange={e => updateCert(cert.id, 'name', e.target.value)} placeholder="e.g. NIC Advanced" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <label style={labelStyle}>Year earned</label>
                <input value={cert.year} onChange={e => updateCert(cert.id, 'year', e.target.value)} placeholder="2018" maxLength={4} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Verification link</label>
                <input type="url" value={cert.verificationLink} onChange={e => updateCert(cert.id, 'verificationLink', e.target.value)} placeholder="https://rid.org/verify/..." style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 6, lineHeight: 1.4 }}>
                  Paste a link to your certification on your certifying body&apos;s website. For RID members: myaccount.rid.org/Public/Search/Member.aspx
                </div>
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
          fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
          transition: 'all 0.2s', marginTop: 10,
        }}
      >
        + Add Another Credential
      </button>

      {/* Education */}
      <div style={{ ...sectionTitleStyle, marginTop: 36 }}>Education</div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12, lineHeight: 1.6 }}>
        Include interpreting-specific education and training. General education is optional.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {education.map(edu => (
          <div key={edu.id} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '20px 24px',
          }}>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Institution</label>
              <input value={edu.institution} onChange={e => updateEdu(edu.id, 'institution', e.target.value)} placeholder="Universidad de Salamanca" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Degree / Qualification</label>
                <input value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} placeholder="MA Interpreter Studies" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
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
          fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
          transition: 'all 0.2s', marginTop: 10,
        }}
      >
        + Add More Education
      </button>

      <SaveButton saving={saving} onClick={async () => {
        if (!profileId) {
          // No profile yet - save to draft_data as fallback
          const validCerts = certs.filter(c => c.name.trim())
          const validEdu = education.filter(e => e.degree.trim())
          onSave({
            draft_data: { ...existingDraftData, certifications: validCerts, education: validEdu },
          })
          return
        }
        const supabase = createClient()
        const validCerts = certs.filter(c => c.name.trim())
        const validEdu = education.filter(e => e.degree.trim())

        // Delete existing + re-insert certifications
        const { error: delCertErr } = await supabase.from('interpreter_certifications').delete().eq('interpreter_id', profileId)
        if (delCertErr) console.error('[profile] Failed to clear certs:', delCertErr)

        for (const cert of validCerts) {
          const { error: certErr } = await supabase.from('interpreter_certifications').insert({
            interpreter_id: profileId,
            name: cert.name,
            issuing_body: cert.issuingBody,
            year: cert.year ? parseInt(cert.year, 10) : null,
            verification_url: cert.verificationLink || null,
            verified: false,
          })
          if (certErr) console.error('[profile] Failed to save cert:', cert.name, certErr)
        }

        // Delete existing + re-insert education
        const { error: delEduErr } = await supabase.from('interpreter_education').delete().eq('interpreter_id', profileId)
        if (delEduErr) console.error('[profile] Failed to clear education:', delEduErr)

        for (const edu of validEdu) {
          const { error: eduErr } = await supabase.from('interpreter_education').insert({
            interpreter_id: profileId,
            degree: edu.degree,
            institution: edu.institution,
            year: edu.year ? parseInt(edu.year, 10) : null,
          })
          if (eduErr) console.error('[profile] Failed to save education:', edu.degree, eduErr)
        }

        // Also update draft_data backup
        onSave({
          draft_data: { ...existingDraftData, certifications: validCerts, education: validEdu },
        })
      }} />
    </>
  )
}

// ── Skills tab ────────────────────────────────────────────────────────────────

function SkillsTab({ specs, setSpecs, aspirationalSpecs, setAspirationalSpecs, specializedSkills, setSpecializedSkills, saving, onSave }: {
  specs: string[]
  setSpecs: (v: string[]) => void
  aspirationalSpecs: string[]
  setAspirationalSpecs: (v: string[]) => void
  specializedSkills: string[]
  setSpecializedSkills: (v: string[]) => void
  saving: boolean
  onSave: () => void
}) {
  const [aspCollapsed, setAspCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    Object.keys(SPECIALIZATION_CATEGORIES).forEach((cat) => { initial[cat] = true })
    return initial
  })
  function toggleAspirational(spec: string) {
    if (specs.includes(spec)) return
    setAspirationalSpecs(aspirationalSpecs.includes(spec) ? aspirationalSpecs.filter(s => s !== spec) : [...aspirationalSpecs, spec])
  }
  function toggleAspCategory(category: string) {
    setAspCollapsed(prev => ({ ...prev, [category]: !prev[category] }))
  }
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
              fontFamily: "'Inter', sans-serif",
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
                  fontSize: '12px', fontWeight: 500,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: selectedCount > 0 ? '#00e5ff' : '#96a0b8',
                }}
              >
                <span>{category}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedCount > 0 && (
                    <span style={{
                      background: 'rgba(0,229,255,0.15)', color: 'var(--accent)',
                      borderRadius: 100, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700,
                      fontFamily: "'Inter', sans-serif",
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

      {/* Section 1b: Working Towards (aspirational specializations) */}
      <div style={{
        fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: '#00e5ff', marginBottom: 8,
      }}>
        Working Towards
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 8, lineHeight: 1.6 }}>
        Select areas you&apos;re actively developing skills in. These show on your profile as aspirational, not current expertise.
      </p>
      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginBottom: 12, lineHeight: 1.6, opacity: 0.85 }}>
        Items already in your active specializations won&apos;t appear here.
      </p>
      <div style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>
        {aspirationalSpecs.length} working towards selected
      </div>
      {aspirationalSpecs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
          {aspirationalSpecs.map(spec => (
            <span key={spec} style={{
              padding: '4px 12px', fontSize: '0.78rem',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              borderRadius: 20, border: '1px dashed rgba(0,229,255,0.4)',
              background: 'rgba(0,229,255,0.06)', color: 'var(--accent)',
              opacity: 0.85, fontFamily: "'Inter', sans-serif",
            }}>
              {spec}
              <button onClick={() => toggleAspirational(spec)} aria-label={`Remove ${spec}`} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem', color: 'inherit', padding: 0 }}><span aria-hidden="true">✕</span></button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {Object.entries(SPECIALIZATION_CATEGORIES).map(([category, subs]) => {
          const isCollapsed = aspCollapsed[category]
          const selectedCount = subs.filter(s => aspirationalSpecs.includes(s)).length
          return (
            <div key={category} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', overflow: 'hidden',
            }}>
              <button
                onClick={() => toggleAspCategory(category)}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: '12px', fontWeight: 500,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: selectedCount > 0 ? '#00e5ff' : '#96a0b8',
                }}
              >
                <span>{category}</span>
                <span style={{ fontSize: '0.7rem', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
              </button>
              {!isCollapsed && (
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {subs.map(sub => {
                    const disabled = specs.includes(sub)
                    const checked = aspirationalSpecs.includes(sub)
                    return (
                      <label key={sub} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 8,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        background: checked ? 'rgba(0,229,255,0.06)' : 'transparent',
                        opacity: disabled ? 0.4 : 1,
                        fontSize: '0.85rem', color: checked ? 'var(--text)' : 'var(--muted)',
                      }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleAspirational(sub)}
                          style={{ accentColor: 'var(--accent)', width: 'auto', flexShrink: 0 }}
                        />
                        {sub}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginBottom: 32, lineHeight: 1.6, opacity: 0.85 }}>
        These will be visible on your public profile so Deaf community members and requesters can see your growth areas.
      </p>

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
              style={{ accentColor: '#a78bfa', width: 'auto', flexShrink: 0 }}
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

function MentorshipAccordion({ category, selectedCount, selectedIds, onToggle, showBorder }: {
  category: MentorshipCategory
  selectedCount: number
  selectedIds: string[]
  onToggle: (itemId: string) => void
  showBorder: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: showBorder ? '1px solid var(--border)' : 'none' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 14px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            stroke="#96a0b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
          >
            <path d="M3 1l4 4-4 4" />
          </svg>
          <span style={{
            fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: '#96a0b8',
          }}>
            {category.label}
          </span>
        </div>
        {selectedCount > 0 && (
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)',
            background: 'rgba(0,229,255,0.1)', borderRadius: 100,
            padding: '1px 8px',
          }}>
            {selectedCount} selected
          </span>
        )}
      </button>
      <div style={{
        maxHeight: open ? `${category.items.length * 56 + 8}px` : '0px',
        overflow: 'hidden', transition: 'max-height 0.2s ease',
      }}>
        <div style={{ padding: '0 14px 8px' }}>
          {category.items.map(item => {
            const checked = selectedIds.includes(item.id)
            return (
              <button
                key={item.id}
                onClick={() => onToggle(item.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  width: '100%', padding: '8px 0',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", textAlign: 'left',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  border: checked ? 'none' : '2px solid var(--border)',
                  background: checked ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {checked && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#f0f2f8', lineHeight: 1.4 }}>
                    {item.label}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: '12px', color: '#96a0b8', lineHeight: 1.4, marginTop: 2 }}>
                      {item.description}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CommunityToggle({ label, helper, checked, onChange }: { label: string; helper?: string; checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
      padding: '10px 0', marginBottom: 8, background: 'none', border: 'none',
      cursor: 'pointer', fontFamily: "'Inter', sans-serif", textAlign: 'left',
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
  directoryVisible, setDirectoryVisible,
  timezone, setTimezone,
  setToast,
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
  directoryVisible: boolean
  setDirectoryVisible: (v: boolean) => void
  timezone: string
  setTimezone: (v: string) => void
  setToast: (t: { message: string; type: 'success' | 'error' } | null) => void
  saving: boolean
  onSave: () => void
}) {
  const [notifToast, setNotifToast] = useState<string | null>(null)
  const [visibilitySaving, setVisibilitySaving] = useState(false)

  async function toggleDirectoryVisible() {
    const next = !directoryVisible
    setDirectoryVisible(next)
    setVisibilitySaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setVisibilitySaving(false); return }
    const { error } = await supabase
      .from('interpreter_profiles')
      .update({ directory_visible: next, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
    setVisibilitySaving(false)
    if (error) {
      // Roll back optimistic update
      setDirectoryVisible(!next)
      setToast({ message: `Failed to update visibility: ${error.message}`, type: 'error' })
      return
    }
    setToast({
      message: next ? 'Profile visible in directory' : 'Profile hidden from directory',
      type: 'success',
    })
  }

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
      {/* ── Profile visibility (pause) ──────────────────────────────── */}
      <div style={{
        background: '#111118',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={sectionTitleStyle}>Profile Visibility</div>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14,
              color: '#f0f2f8', marginBottom: 8,
            }}>
              {directoryVisible
                ? 'Your profile is currently visible in the directory.'
                : 'Your profile is currently hidden from the directory.'}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14,
              color: '#96a0b8', lineHeight: 1.6,
            }}>
              {directoryVisible
                ? "Turn this off to hide your profile from the directory and public search. You'll keep full access to your account, messages, and bookings. You can turn it back on anytime."
                : "Your account is fully active. Turn this on when you're ready to appear in the directory again."}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={directoryVisible}
            aria-label="Toggle directory visibility"
            onClick={toggleDirectoryVisible}
            disabled={visibilitySaving}
            style={{
              position: 'relative',
              width: 44, height: 26, borderRadius: 13,
              background: directoryVisible ? '#00e5ff' : '#2a2f3d',
              border: 'none',
              cursor: visibilitySaving ? 'wait' : 'pointer',
              transition: 'background 0.15s',
              padding: 0, flexShrink: 0, marginTop: 2,
              opacity: visibilitySaving ? 0.6 : 1,
            }}
          >
            <span style={{
              position: 'absolute',
              top: 2, left: directoryVisible ? 20 : 2,
              width: 22, height: 22, borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.15s',
            }} />
          </button>
        </div>
      </div>

      {/* ── Timezone ───────────────────────────────────────────────── */}
      <TimezoneSection
        timezone={timezone}
        setTimezone={setTimezone}
        setToast={setToast}
      />

      {/* ── Section 1: Invoicing ─────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Invoicing</div>

        {/* Invoicing Preference */}
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
          This controls whether the &ldquo;Submit Invoice&rdquo; button appears on your confirmed bookings. You can change this anytime.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {([
            { value: 'own', label: 'I use my own invoicing system', desc: 'You handle invoicing entirely outside signpost. Our invoicing tool is optional. It is here if you want a simple way to track and send invoices, but it is not required.' },
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
                flexShrink: 0, fontFamily: "'Inter', sans-serif",
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
            fontFamily: "'Inter', sans-serif", transition: 'all 0.15s', marginBottom: 4,
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

        <div style={{
          background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20,
          fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.5,
        }}>
          You&apos;re receiving all notifications by default. Customize which notifications you receive below.
        </div>

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
              fontWeight: 600, fontSize: '13px',
              letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff',
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
                        <span style={{ fontSize: '12px', color: '#96a0b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</span>
                        <ToggleSwitch
                          on={notifPrefs.email_enabled && pref.email}
                          onChange={() => toggleCategory(item.key, 'email')}
                          disabled={notifSaving || !notifPrefs.email_enabled}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: '12px', color: '#96a0b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>SMS</span>
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

      {/* ── Section 3: Calendar Sync ─────────────────────────────────── */}
      <CalendarSyncSettings />
    </>
  )
}

/* ── Calendar Sync (Settings) ── */

function CalendarSyncSettings() {
  const [calendarToken, setCalendarToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('interpreter_profiles')
        .select('calendar_token')
        .eq('user_id', user.id)
        .single()
      if (data) setCalendarToken(data.calendar_token)
      setLoading(false)
    }
    load()
  }, [])

  async function regenerateToken() {
    if (!confirm('This will break any existing calendar subscriptions. You\'ll need to re-add the new link. Continue?')) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newToken = crypto.randomUUID()
    const { error } = await supabase
      .from('interpreter_profiles')
      .update({ calendar_token: newToken })
      .eq('user_id', user.id)
    if (error) {
      setToast('Failed to regenerate link')
    } else {
      setCalendarToken(newToken)
      setToast('Calendar link regenerated')
    }
    setTimeout(() => setToast(null), 3000)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  if (loading || !calendarToken) return null

  const feedUrl = `https://signpost.community/api/calendar/${calendarToken}.ics`

  const cardStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '28px 28px',
    marginBottom: 24,
  }

  return (
    <div style={{ ...cardStyle, marginTop: 8 }}>
      <div style={sectionTitleStyle}>Calendar Sync</div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.55 }}>
        Subscribe to your booking calendar so confirmed appointments automatically
        appear in Google Calendar, Outlook, or any calendar app. One-time setup.
      </p>

      {/* Feed URL + Copy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{
          fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)',
          fontFamily: "'Inter', sans-serif", wordBreak: 'break-all',
        }}>
          {feedUrl}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(feedUrl)
            showToast('Calendar link copied!')
          }}
          style={{
            background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
            color: 'var(--accent)', borderRadius: 8, padding: '6px 14px',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Copy link
        </button>
      </div>

      {/* Help page link */}
      <Link
        href="/help/calendar-sync"
        style={{
          display: 'inline-block', color: 'var(--accent)', fontSize: '0.82rem',
          fontWeight: 600, fontFamily: "'Inter', sans-serif",
          textDecoration: 'none', marginBottom: 12,
        }}
      >
        How to add this to my calendar &rarr;
      </Link>

      {/* Regenerate */}
      <button
        onClick={regenerateToken}
        style={{
          display: 'block', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 500,
          fontFamily: "'Inter', sans-serif", padding: '2px 0',
          textDecoration: 'underline', textUnderlineOffset: '3px',
        }}
      >
        Regenerate link
      </button>

      {/* Toast */}
      {toast && (
        <div style={{
          padding: '8px 14px', borderRadius: 'var(--radius-sm)',
          background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
          fontSize: '0.82rem', color: 'var(--accent)', marginTop: 12,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ── Timezone section in Account Settings ─────────────────────────────────────
function TimezoneSection({
  timezone,
  setTimezone,
  setToast,
}: {
  timezone: string
  setTimezone: (v: string) => void
  setToast: (t: { message: string; type: 'success' | 'error' } | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(timezone)
  const [savingTz, setSavingTz] = useState(false)

  useEffect(() => { setDraft(timezone) }, [timezone])

  async function save() {
    setSavingTz(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingTz(false); return }
    const { error } = await supabase
      .from('interpreter_profiles')
      .update({ timezone: draft || null, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
    setSavingTz(false)
    if (error) {
      setToast({ message: `Failed to save timezone: ${error.message}`, type: 'error' })
      return
    }
    setTimezone(draft)
    setEditing(false)
    setToast({ message: 'Timezone saved.', type: 'success' })
  }

  const knownTzs = Object.keys(TIMEZONE_LABELS)
  const showRaw = timezone && !TIMEZONE_LABELS[timezone]

  return (
    <div style={{
      background: '#111118',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 20,
      marginBottom: 24,
    }}>
      <div style={sectionTitleStyle}>Timezone</div>
      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 14,
              color: '#f0f2f8', marginBottom: 6,
            }}>
              {timezone ? (showRaw ? timezone : getTimezoneLabel(timezone)) : 'Not set'}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              color: '#96a0b8', lineHeight: 1.6,
            }}>
              Auto-detected from your browser.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={{
              background: 'none', border: '1px solid rgba(0,229,255,0.4)',
              color: 'var(--accent)', borderRadius: 8, padding: '8px 16px',
              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select
            value={knownTzs.includes(draft) ? draft : (draft ? '__custom__' : '')}
            onChange={e => {
              if (e.target.value === '__custom__') return
              setDraft(e.target.value)
            }}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px',
              color: 'var(--text)', fontFamily: "'Inter', sans-serif",
              fontSize: '0.9rem', outline: 'none', width: '100%',
            }}
          >
            <option value="">Select a timezone...</option>
            {knownTzs.map(tz => (
              <option key={tz} value={tz}>{TIMEZONE_LABELS[tz]}</option>
            ))}
            {draft && !knownTzs.includes(draft) && (
              <option value="__custom__">{draft}</option>
            )}
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={save}
              disabled={savingTz}
              className="btn-primary"
              style={{ padding: '8px 18px', opacity: savingTz ? 0.6 : 1 }}
            >
              {savingTz ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setDraft(timezone); setEditing(false) }}
              style={{
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--muted)', borderRadius: 8, padding: '8px 16px',
                fontSize: '0.85rem', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
