'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import InterpreterPicker from '@/components/dhh/InterpreterPicker'
import CommPrefsDisplay from '@/components/dhh/CommPrefsDisplay'
import { BetaBanner, PageHeader, DashMobileStyles } from '@/components/dashboard/interpreter/shared'

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
  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem',
  marginBottom: 16, paddingBottom: 10,
  borderBottom: '1px solid var(--border)',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.82rem', fontWeight: 600,
  color: 'var(--text)', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
  fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif",
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

export default function DhhRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const interpreterParam = searchParams.get('interpreter')
  const [userId, setUserId] = useState<string | null>(null)
  const [commPrefs, setCommPrefs] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState('')
  const [format, setFormat] = useState('in-person')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [timezone, setTimezone] = useState('America/Los_Angeles')
  const [interpreterCount, setInterpreterCount] = useState(1)
  const [selectedInterpreters, setSelectedInterpreters] = useState<string[]>(interpreterParam ? [interpreterParam] : [])
  const [description, setDescription] = useState('')

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) { showToast('Please enter a title', 'error'); return }
    if (!date) { showToast('Please select a date', 'error'); return }
    if (!timeStart) { showToast('Please select a start time', 'error'); return }
    if (!timeEnd) { showToast('Please select an end time', 'error'); return }
    if (format !== 'remote' && !location.trim()) { showToast('Please enter a location', 'error'); return }
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
          location: format === 'remote' ? 'Remote' : location.trim(),
          eventType: eventType || null,
          eventCategory: eventType ? 'Personal & Life Events' : null,
          interpreterCount,
          description: description.trim(),
          interpreterIds: selectedInterpreters,
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
      <BetaBanner />
      <PageHeader
        title="New Interpreter Request"
        subtitle="Request an interpreter for a personal appointment. This is free — no platform fee for Deaf/DB/HH users."
      />

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
              placeholder="e.g. Family reunion, doctor appointment, wedding, church service"
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
              {(['in-person', 'remote', 'hybrid'] as const).map(f => (
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
                  {f === 'in-person' ? 'In-person' : f === 'remote' ? 'Remote' : 'Hybrid'}
                </label>
              ))}
            </div>
          </div>

          {format !== 'remote' && (
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Location *</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Address or location name"
                style={inputStyle}
                required={format !== 'remote'}
              />
            </div>
          )}
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
              placeholder="Anything the interpreter should know — context, prep materials, parking info, etc."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'right', marginTop: 4 }}>
              {description.length}/1000
            </div>
          </div>
        </div>

        {/* Section 5: Communication Preferences */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={sectionHeadingStyle}>Your Communication Preferences</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: 14, lineHeight: 1.55 }}>
            These preferences will be shared with the interpreter(s) you request.
            To update them, go to your{' '}
            <a href="/dhh/dashboard/preferences" style={{ color: '#9d87ff', textDecoration: 'underline' }}>Profile</a>.
          </p>
          <CommPrefsDisplay commPrefs={commPrefs as Record<string, unknown> & { signing_style?: string; preferred_domains?: string[]; cdi_preferred?: boolean; team_interpreting?: string; notes?: string } | null} editable />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%', padding: '14px 24px',
            background: submitting ? 'var(--surface2)' : 'linear-gradient(135deg, #9d87ff, #7b61ff)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: '#fff', fontSize: '1rem', fontWeight: 700,
            fontFamily: "'Syne', sans-serif", cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Sending...' : 'Send Request'}
        </button>
      </form>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
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
