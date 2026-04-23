'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import InterpreterPicker from '@/components/dhh/InterpreterPicker'
import CommPrefsDisplay from '@/components/dhh/CommPrefsDisplay'
import { PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import InlineVideoCapture from '@/components/ui/InlineVideoCapture'
import { getVideoEmbedUrl } from '@/lib/videoUtils'
import LocationInput from '@/components/ui/LocationInput'
import type { LocationFields } from '@/components/ui/LocationInput'

const TIMEZONES = [
  { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
  { label: 'Mountain Time (MT)', value: 'America/Denver' },
  { label: 'Central Time (CT)', value: 'America/Chicago' },
  { label: 'Eastern Time (ET)', value: 'America/New_York' },
  { label: 'Alaska Time (AKT)', value: 'America/Anchorage' },
  { label: 'Hawaii Time (HT)', value: 'Pacific/Honolulu' },
]

const PERSONAL_EVENT_TYPES = [
  'Wedding',
  'Funeral / Memorial',
  'Family reunion / Celebration',
  'Private appointment',
]

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px',
  color: '#f0f2f8', marginBottom: 14, paddingBottom: 10,
  borderBottom: '1px solid var(--border)',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 500,
  color: '#c8cdd8', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
  fontSize: '15px', fontFamily: "'Inter', sans-serif",
  outline: 'none',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23b8bfcf' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: 36,
}

const fieldGroupStyle: React.CSSProperties = { marginBottom: 18 }

function RequestCallout() {
  const [slug, setSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchSlug() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('deaf_profiles')
        .select('vanity_slug')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle()
      if (data?.vanity_slug) setSlug(data.vanity_slug)
    }
    fetchSlug()
  }, [])

  function handleCopy() {
    if (!slug) return
    navigator.clipboard.writeText(`https://signpost.community/d/${slug}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      maxWidth: 640, marginBottom: 32,
      background: 'var(--surface)', borderLeft: '3px solid #9d87ff',
      border: '1px solid var(--border)', borderLeftWidth: 3, borderLeftColor: '#9d87ff',
      borderRadius: 'var(--radius-sm)', padding: '20px 24px',
    }}>
      <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.65, margin: '0 0 10px' }}>
        This page is for booking interpreters for your own personal events (family gatherings, celebrations, private appointments).
      </p>
      <p style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.65, margin: '0 0 14px' }}>
        Need interpreters for work, medical appointments, or school? Share your Interpreter Request Link with your coordinator and they can book interpreters for you using your preferred list.
      </p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {slug && (
          <button
            type="button"
            onClick={handleCopy}
            style={{
              padding: '8px 18px',
              background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(157,135,255,0.1)',
              border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(157,135,255,0.3)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem', fontWeight: 600,
              color: copied ? '#34d399' : '#9d87ff',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            {copied ? 'Copied!' : 'Copy My Link'}
          </button>
        )}
        <a
          href="/dhh/dashboard/preferences"
          style={{
            fontSize: '0.82rem', color: '#9d87ff', textDecoration: 'none',
            fontWeight: 500, fontFamily: "'Inter', sans-serif",
          }}
        >
          Go to My Request Link
        </a>
      </div>
    </div>
  )
}

export default function DhhRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const interpreterParam = searchParams.get('interpreter')
  const [userId, setUserId] = useState<string | null>(null)
  const [commPrefs, setCommPrefs] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Form state
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState('')
  const [format, setFormat] = useState('in_person')
  const [locationFields, setLocationFields] = useState<LocationFields>({
    locationName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    meetingLink: '',
  })
  const [date, setDate] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [timezone, setTimezone] = useState('America/Los_Angeles')
  const [interpreterCount, setInterpreterCount] = useState(1)
  const [selectedInterpreters, setSelectedInterpreters] = useState<string[]>(interpreterParam ? [interpreterParam] : [])
  const [description, setDescription] = useState('')
  const [contextVideoUrl, setContextVideoUrl] = useState('')
  const [contextVideoVisible, setContextVideoVisible] = useState(true)
  // videoRecorderOpen state removed - inline capture is always visible

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      // Fetch comm_prefs
      const { data: deafProfile, error } = await supabase
        .from('deaf_profiles')
        .select('comm_prefs')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle()

      if (error) {
        console.error('[dhh-request] comm_prefs fetch failed:', error.message)
      }

      setCommPrefs(deafProfile?.comm_prefs ?? null)
      setLoading(false)
    }
    init()
  }, [])

  async function handleSaveDraft() {
    if (saveState === 'saving') return
    setSaveState('saving')
    try {
      const res = await fetch('/api/dhh/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          date: date || null,
          timeStart: timeStart || null,
          timeEnd: timeEnd || null,
          timezone,
          format,
          location: format === 'remote' ? 'Remote' : [locationFields.locationName, locationFields.address, locationFields.city, locationFields.state, locationFields.zip].filter(Boolean).join(', ') || null,
          location_name: locationFields.locationName || null,
          location_address: locationFields.address || null,
          location_city: locationFields.city || null,
          location_state: locationFields.state || null,
          location_zip: locationFields.zip || null,
          location_country: locationFields.country || null,
          meeting_link: locationFields.meetingLink || null,
          eventType: eventType || null,
          eventCategory: eventType ? 'Personal & Life Events' : null,
          interpreterCount,
          description: description.trim() || null,
          interpreterIds: selectedInterpreters.length > 0 ? selectedInterpreters : [],
          contextVideoUrl: contextVideoUrl || null,
          contextVideoVisibleBeforeAccept: contextVideoVisible,
          saveAsDraft: true,
          bookingId: draftId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveState('error')
        setTimeout(() => setSaveState('idle'), 3000)
        return
      }
      if (data.bookingIds?.[0]) setDraftId(data.bookingIds[0])
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) { showToast('Please enter a title', 'error'); return }
    if (!date) { showToast('Please select a date', 'error'); return }
    if (!timeStart) { showToast('Please select a start time', 'error'); return }
    if (!timeEnd) { showToast('Please select an end time', 'error'); return }
    if (format !== 'remote' && !locationFields.city.trim()) { showToast('Please enter at least a city for the location', 'error'); return }
    if (selectedInterpreters.length === 0) { showToast('Please select at least one interpreter', 'error'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/dhh/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          date,
          timeStart,
          timeEnd,
          timezone,
          format,
          location: format === 'remote' ? 'Remote' : [locationFields.locationName, locationFields.address, locationFields.city, locationFields.state, locationFields.zip].filter(Boolean).join(', '),
          location_name: locationFields.locationName || null,
          location_address: locationFields.address || null,
          location_city: locationFields.city || null,
          location_state: locationFields.state || null,
          location_zip: locationFields.zip || null,
          location_country: locationFields.country || null,
          meeting_link: locationFields.meetingLink || null,
          eventType: eventType || null,
          eventCategory: eventType ? 'Personal & Life Events' : null,
          interpreterCount,
          description: description.trim(),
          interpreterIds: selectedInterpreters,
          contextVideoUrl: contextVideoUrl || null,
          contextVideoVisibleBeforeAccept: contextVideoVisible,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        showToast(result.error || 'Failed to send request', 'error')
        setSubmitting(false)
        return
      }

      showToast(`Request sent to ${selectedInterpreters.length} interpreter${selectedInterpreters.length !== 1 ? 's' : ''}!`, 'success')
      setTimeout(() => router.push('/dhh/dashboard/requests'), 1200)
    } catch {
      showToast('Network error. Please try again.', 'error')
      setSubmitting(false)
    }
  }

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
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
      <PageHeader
        title="New Interpreter Request"
        subtitle="Request an interpreter for a personal event. Submitting booking requests for personal events is always free for Deaf/DB/HH users and their families."
      />
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: -16, marginBottom: 28, maxWidth: 640, lineHeight: 1.5 }}>
        (Note: this is separate from what the interpreter charges for their services. They will send you their rate directly.)
      </p>

      {/* Callout box */}
      <RequestCallout />

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        {/* Section 1: Event Details */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={sectionHeadingStyle}>Event Details</h3>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Wedding, family reunion, birthday party"
              style={inputStyle}
              required
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Event Type</label>
            <select
              value={eventType}
              onChange={e => setEventType(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select event type...</option>
              {PERSONAL_EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Format *</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {(['in_person', 'remote'] as const).map(f => (
                <label key={f} style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '8px 16px',
                  background: format === f ? 'rgba(157,135,255,0.08)' : 'var(--surface2)',
                  border: `1px solid ${format === f ? 'rgba(157,135,255,0.4)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                  transition: 'all 0.15s',
                }}>
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    style={{ accentColor: '#9d87ff' }}
                  />
                  {f === 'in_person' ? 'In-person' : 'Remote'}
                </label>
              ))}
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <LocationInput
              locationName={locationFields.locationName}
              address={locationFields.address}
              city={locationFields.city}
              state={locationFields.state}
              zip={locationFields.zip}
              country={locationFields.country}
              meetingLink={locationFields.meetingLink}
              onChange={setLocationFields}
              showLocationName={format !== 'remote'}
              showMeetingLink={format === 'remote'}
              accent="purple"
              defaultCountry="US"
            />
          </div>
        </div>

        {/* Section 2: Schedule */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={sectionHeadingStyle}>Schedule</h3>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Date *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={labelStyle}>Start Time *</label>
              <input
                type="time"
                value={timeStart}
                onChange={e => setTimeStart(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={labelStyle}>End Time *</label>
              <input
                type="time"
                value={timeEnd}
                onChange={e => setTimeEnd(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={labelStyle}>Time Zone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                style={selectStyle}
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={labelStyle}>Number of Interpreters</label>
              <input
                type="number"
                value={interpreterCount}
                onChange={e => setInterpreterCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                min={1}
                max={5}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Choose Interpreters */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={sectionHeadingStyle}>Choose Interpreters</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: 14, lineHeight: 1.55 }}>
            Select interpreters from your preferred list. They&apos;ll each receive your request with your communication preferences attached.
          </p>
          {userId && (
            <InterpreterPicker
              selectedIds={selectedInterpreters}
              onChange={setSelectedInterpreters}
              userId={userId}
            />
          )}
        </div>

        {/* Section 4: Notes */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={sectionHeadingStyle}>Notes for the Interpreter</h3>
          <div style={fieldGroupStyle}>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 1000))}
              placeholder="Anything the interpreter should know - context, prep materials, parking info, etc."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'right', marginTop: 4 }}>
              {description.length}/1000
            </div>
          </div>
        </div>

        {/* Section 5: Context Video */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em',
            textTransform: 'uppercase' as const, color: '#a78bfa', marginBottom: 8,
          }}>
            ADD A VIDEO FOR CONTEXT (OPTIONAL)
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: 14, lineHeight: 1.55 }}>
            Sign your request details instead of typing them.
          </p>

          {contextVideoUrl ? (
            <div>
              {(() => {
                const embedUrl = getVideoEmbedUrl(contextVideoUrl)
                if (!embedUrl) return null
                return embedUrl.includes('supabase.co/storage') ? (
                  <video controls width="100%" src={embedUrl} style={{ borderRadius: 12, border: '1px solid var(--border)', maxHeight: 260, background: '#000', marginBottom: 12 }} />
                ) : (
                  <iframe width="100%" height="260" src={embedUrl} title="Context video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                    style={{ borderRadius: 12, border: 'none', marginBottom: 12 }} />
                )
              })()}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setContextVideoUrl('')}
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
              onVideoSaved={(url) => {
                setContextVideoUrl(url)
              }}
              accentColor="#7b61ff"
              storageBucket="videos"
              storagePath="context"
            />
          )}

          {contextVideoUrl && (
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setContextVideoVisible(!contextVideoVisible)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '10px 14px', cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${contextVideoVisible ? 'rgba(157,135,255,0.4)' : 'var(--border)'}`,
                  background: contextVideoVisible ? 'rgba(157,135,255,0.06)' : 'var(--surface2)',
                  transition: 'all 0.15s', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '0.84rem', color: contextVideoVisible ? 'var(--text)' : 'var(--muted)' }}>
                  Show this video to interpreters before they accept
                </span>
                <span style={{
                  width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                  background: contextVideoVisible ? '#9d87ff' : 'var(--border)',
                  position: 'relative', transition: 'background 0.2s',
                  display: 'inline-block',
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#fff', position: 'absolute', top: 3,
                    left: contextVideoVisible ? 19 : 3,
                    transition: 'left 0.2s',
                  }} />
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Section 6: Communication Preferences */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={sectionHeadingStyle}>Your Communication Preferences</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: 14, lineHeight: 1.55 }}>
            These preferences will be shared with the interpreter(s) you request.
            To update them, go to your{' '}
            <a href="/dhh/dashboard/preferences" style={{ color: '#9d87ff', textDecoration: 'underline' }}>Profile</a>.
          </p>
          <CommPrefsDisplay commPrefs={commPrefs as Record<string, unknown> & { signing_style?: string; preferred_domains?: string[]; cdi_preferred?: boolean; team_interpreting?: string; notes?: string } | null} editable />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 1, padding: '14px 24px',
              background: submitting ? 'var(--surface2)' : 'linear-gradient(135deg, #9d87ff, #7b61ff)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: '#fff', fontSize: '1rem', fontWeight: 700,
              fontFamily: "'Inter', sans-serif", cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </button>
          <button
            type="button"
            disabled={submitting || saveState === 'saving'}
            onClick={handleSaveDraft}
            style={{
              background: 'none',
              border: `1px solid ${saveState === 'saved' ? 'rgba(52,211,153,0.4)' : saveState === 'error' ? 'rgba(255,107,133,0.4)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '14px 24px',
              color: saveState === 'saved' ? '#34d399' : saveState === 'error' ? '#ff6b85' : 'var(--muted)',
              fontSize: '0.88rem', fontWeight: 600,
              cursor: (submitting || saveState === 'saving') ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s',
              opacity: (submitting || saveState === 'saving') ? 0.6 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {saveState === 'saved' && (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {{ idle: 'Save as Draft', saving: 'Saving...', saved: 'Saved', error: 'Save failed' }[saveState]}
          </button>
        </div>
      </form>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(255,107,133,0.3)'}`,
          borderRadius: 'var(--radius)', padding: '14px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.85rem',
          color: toast.type === 'success' ? '#34d399' : '#ff6b85',
        }}>
          {toast.msg}
        </div>
      )}

      <DashMobileStyles />
    </div>
  )
}
