'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/ui/Toast'
import RequesterInterpreterPicker from '@/components/requester/RequesterInterpreterPicker'
import BetaTryThis from '@/components/ui/BetaTryThis'
import { createClient } from '@/lib/supabase/client'

/* -- Constants -- */

const EVENT_CATEGORIES = [
  'Medical', 'Legal', 'Education', 'Employment', 'Government',
  'Conference', 'Community', 'Religious', 'Family/Personal', 'Other',
]

const SIGN_LANGUAGES = [
  'ASL', 'BSL', 'IS', 'LSE', 'LSF', 'JSL', 'LIBRAS', 'PTASL', 'Auslan', 'DGS', 'ISL',
]

const SPOKEN_LANGUAGES = [
  'English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'Japanese', 'Hebrew', 'German', 'Italian',
]

const SPECIALIZATIONS = [
  'Medical', 'Legal', 'Conference', 'Mental Health', 'Academic', 'Technical',
  'Arts & Media', 'Diplomatic', 'Business', 'Education', 'Religious',
  'DeafBlind', 'Government',
]

const RECURRENCE_OPTIONS = ['One-time', 'Weekly', 'Bi-weekly', 'Monthly']

/* -- Types -- */

interface DeafListInterpreter {
  id: string
  name: string
  certifications: string[]
  specializations: string[]
  tier: string
  avatar_url: string | null
  avatar_color: string | null
  is_dnb: boolean
}

interface TaggedDeafPerson {
  identifier: string
  userId: string | null
  displayName: string
  status: 'loading' | 'list_available' | 'approval_pending' | 'not_on_signpost' | 'error'
  interpreters: DeafListInterpreter[]
}

/* -- Styles -- */

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.82rem', fontWeight: 600,
  color: 'var(--text)', marginBottom: 6,
  fontFamily: "'Inter', sans-serif",
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
  fontSize: '15px', fontFamily: "'Inter', sans-serif",
  outline: 'none', transition: 'border-color 0.15s',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238891a8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: 36,
}

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px',
  letterSpacing: '0.08em', textTransform: 'uppercase' as const,
  color: 'var(--accent)', margin: '32px 0 12px',
}

const errorStyle: React.CSSProperties = {
  fontSize: '0.78rem', color: 'var(--accent3)', marginTop: 4,
}

/* -- Component -- */

export default function NewRequestPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null)
  const paymentNoticeRef = useRef<HTMLDivElement>(null)
  const lookupInputRef = useRef<HTMLInputElement>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    async function checkPaymentMethod() {
      try {
        const res = await fetch('/api/stripe/payment-method')
        const data = await res.json()
        setHasPaymentMethod(!!data.paymentMethod)
      } catch {
        setHasPaymentMethod(false)
      }
    }
    checkPaymentMethod()
  }, [])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Section 1: Event details
  const [title, setTitle] = useState('')
  const [eventCategory, setEventCategory] = useState('')
  const [date, setDate] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [recurrence, setRecurrence] = useState('One-time')
  const [format, setFormat] = useState<'in_person' | 'remote'>('in_person')
  const [location, setLocation] = useState('')
  const [remotePlatform, setRemotePlatform] = useState('')
  const [signLanguage, setSignLanguage] = useState('ASL')
  const [spokenLanguage, setSpokenLanguage] = useState('English')
  const [interpreterCount, setInterpreterCount] = useState(1)
  const [specialization, setSpecialization] = useState('')

  // Section 2: Who is this for?
  const [taggedDeafPersons, setTaggedDeafPersons] = useState<TaggedDeafPerson[]>([])
  const [currentLookupInput, setCurrentLookupInput] = useState('')
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [skipDeafTag, setSkipDeafTag] = useState(false)
  const [continuedWithoutList, setContinuedWithoutList] = useState(false)
  const [inviteSending, setInviteSending] = useState<Record<number, 'idle' | 'sending' | 'sent' | 'error'>>({})

  // Section 3: Interpreter selection
  const [selectedInterpreters, setSelectedInterpreters] = useState<string[]>([])

  // Section 4: Notes
  const [notes, setNotes] = useState('')

  // Preparation Details (optional)
  const [onsiteContactName, setOnsiteContactName] = useState('')
  const [onsiteContactPhone, setOnsiteContactPhone] = useState('')
  const [onsiteContactEmail, setOnsiteContactEmail] = useState('')
  const [prepNotes, setPrepNotes] = useState('')
  interface UploadedAttachment {
    id: string
    file_name: string
    file_url: string
    file_type: string | null
    file_size: number | null
  }
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ATTACH_ACCEPT = '.pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const MAX_FILE_BYTES = 10 * 1024 * 1024
  const MAX_FILES = 5

  async function ensureDraftBookingId(): Promise<string | null> {
    if (draftId) return draftId
    try {
      const res = await fetch('/api/request/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), saveAsDraft: true, bookingId: null }),
      })
      const data = await res.json()
      if (!res.ok || !data.bookingId) return null
      setDraftId(data.bookingId)
      return data.bookingId as string
    } catch {
      return null
    }
  }

  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null)
    const files = Array.from(e.target.files || [])
    if (e.target) e.target.value = ''
    if (files.length === 0) return
    if (attachments.length + files.length > MAX_FILES) {
      setUploadError(`Maximum ${MAX_FILES} files allowed.`)
      return
    }
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        setUploadError(`${f.name} exceeds 10MB limit.`)
        return
      }
    }
    setUploading(true)
    const bookingIdForUpload = await ensureDraftBookingId()
    if (!bookingIdForUpload) {
      setUploadError('Could not save draft to attach files. Please try again.')
      setUploading(false)
      return
    }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUploadError('You must be signed in to upload files.')
      setUploading(false)
      return
    }
    const newAttachments: UploadedAttachment[] = []
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${bookingIdForUpload}/${Date.now()}-${safeName}`
      const { error: upErr } = await supabase.storage
        .from('booking-attachments')
        .upload(path, file, { contentType: file.type || undefined, upsert: false })
      if (upErr) {
        setUploadError(`Failed to upload ${file.name}: ${upErr.message}`)
        continue
      }
      const { data: row, error: insErr } = await supabase
        .from('booking_attachments')
        .insert({
          booking_id: bookingIdForUpload,
          uploaded_by: user.id,
          file_name: file.name,
          file_url: path,
          file_type: file.type || null,
          file_size: file.size,
        })
        .select('id, file_name, file_url, file_type, file_size')
        .single()
      if (insErr || !row) {
        setUploadError(`Failed to record ${file.name}: ${insErr?.message || 'unknown error'}`)
        continue
      }
      newAttachments.push(row as UploadedAttachment)
    }
    setAttachments(prev => [...prev, ...newAttachments])
    setUploading(false)
  }

  async function handleDeleteAttachment(att: UploadedAttachment) {
    const supabase = createClient()
    await supabase.storage.from('booking-attachments').remove([att.file_url])
    await supabase.from('booking_attachments').delete().eq('id', att.id)
    setAttachments(prev => prev.filter(a => a.id !== att.id))
  }

  async function handleDownloadAttachment(att: UploadedAttachment) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('booking-attachments')
      .createSignedUrl(att.file_url, 60 * 5)
    if (error || !data?.signedUrl) {
      setToast({ message: 'Could not generate download link.', type: 'error' })
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!eventCategory) errs.eventCategory = 'Category is required'
    if (!date) errs.date = 'Date is required'
    if (!timeStart) errs.timeStart = 'Start time is required'
    if (!timeEnd) errs.timeEnd = 'End time is required'
    if (!signLanguage) errs.signLanguage = 'Sign language is required'
    if (format === 'in_person' && !location.trim()) errs.location = 'Location is required for in-person events'
    if (date) {
      const today = new Date().toISOString().split('T')[0]
      if (date < today) errs.date = 'Date must be today or in the future'
    }
    if (timeStart && timeEnd && timeStart >= timeEnd) {
      errs.timeEnd = 'End time must be after start time'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function buildPayload() {
    const taggedIds = taggedDeafPersons
      .filter(p => p.userId)
      .map(p => p.userId)

    return {
      title: title || null,
      date: date || null,
      timeStart: timeStart || null,
      timeEnd: timeEnd || null,
      format,
      location: format === 'in_person' ? location : remotePlatform,
      eventCategory: eventCategory || null,
      specialization: specialization || null,
      recurrence: recurrence.toLowerCase().replace('-', '_'),
      interpreterCount,
      interpreterIds: selectedInterpreters.length > 0 ? selectedInterpreters : undefined,
      description: `Sign language: ${signLanguage}. Spoken language: ${spokenLanguage}.`,
      notes: notes || null,
      tagged_deaf_user_ids: taggedIds.length > 0 ? taggedIds : undefined,
      prep_notes: prepNotes || null,
      onsite_contact_name: onsiteContactName || null,
      onsite_contact_phone: onsiteContactPhone || null,
      onsite_contact_email: onsiteContactEmail || null,
    }
  }

  async function handleSaveDraft() {
    if (saveState === 'saving') return
    setSaveState('saving')
    try {
      const res = await fetch('/api/request/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), saveAsDraft: true, bookingId: draftId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveState('error')
        setTimeout(() => setSaveState('idle'), 3000)
        return
      }
      if (data.bookingId) setDraftId(data.bookingId)
      setSaveState('saved')
      setToast({ message: 'Draft saved. You can find it in your All Requests page under Drafts.', type: 'success' })
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  async function handleSubmit() {
    if (!validate()) return

    if (!hasPaymentMethod) {
      setToast({ message: 'Please add a payment method before submitting a request.', type: 'error' })
      if (paymentNoticeRef.current) {
        paymentNoticeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        paymentNoticeRef.current.style.animation = 'none'
        void paymentNoticeRef.current.offsetWidth
        paymentNoticeRef.current.style.animation = 'pulse-highlight 1.5s ease-out'
      }
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/request/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), saveAsDraft: false, bookingId: draftId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || 'Failed to submit request', type: 'error' })
        setSubmitting(false)
        return
      }

      const interpMsg = selectedInterpreters.length > 0
        ? `Request sent to ${selectedInterpreters.length} interpreter${selectedInterpreters.length !== 1 ? 's' : ''}.`
        : 'Request submitted. Interpreters will be notified.'
      setToast({ message: interpMsg, type: 'success' })
      setTimeout(() => router.push('/request/dashboard'), 1500)
    } catch {
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' })
      setSubmitting(false)
    }
  }

  async function handleDeafLookup() {
    const input = currentLookupInput.trim()
    if (!input) return

    // Prevent duplicate lookups
    if (taggedDeafPersons.some(p => p.identifier.toLowerCase() === input.toLowerCase())) {
      setLookupError('This person has already been added.')
      return
    }

    setLookupError(null)
    const newPerson: TaggedDeafPerson = {
      identifier: input,
      userId: null,
      displayName: '',
      status: 'loading',
      interpreters: [],
    }
    const idx = taggedDeafPersons.length
    setTaggedDeafPersons(prev => [...prev, newPerson])
    setCurrentLookupInput('')

    try {
      const res = await fetch('/api/request/deaf-list-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deafUserIdentifier: input }),
      })
      const data = await res.json()

      setTaggedDeafPersons(prev => {
        const updated = [...prev]
        if (!updated[idx]) return prev
        if (data.status === 'list_available') {
          updated[idx] = {
            ...updated[idx],
            userId: data.userId,
            displayName: data.displayName || 'this person',
            status: 'list_available',
            interpreters: data.interpreters || [],
          }
        } else if (data.status === 'approval_pending') {
          updated[idx] = {
            ...updated[idx],
            userId: data.userId,
            displayName: data.displayName || 'this person',
            status: 'approval_pending',
            interpreters: [],
          }
        } else {
          updated[idx] = {
            ...updated[idx],
            status: 'not_on_signpost',
            interpreters: [],
          }
        }
        return updated
      })
    } catch {
      setTaggedDeafPersons(prev => {
        const updated = [...prev]
        if (updated[idx]) {
          updated[idx] = { ...updated[idx], status: 'error' }
        }
        return updated
      })
    }
  }

  function removeTaggedPerson(idx: number) {
    setTaggedDeafPersons(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSendInvite(idx: number, identifier: string) {
    setInviteSending(prev => ({ ...prev, [idx]: 'sending' }))
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: identifier,
          template: 'dhh-invite',
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setInviteSending(prev => ({ ...prev, [idx]: 'sent' }))
    } catch {
      setInviteSending(prev => ({ ...prev, [idx]: 'error' }))
    }
  }

  // Build interpreter groups from Deaf person lists
  function buildInterpreterGroups() {
    const groups: Array<{
      label: string
      accent: 'purple' | 'cyan'
      interpreters: Array<{
        id: string; name: string; certifications: string[]; specializations: string[]
        tier?: string; avatar_url?: string | null; avatar_color?: string | null
        badge?: string; recommended?: boolean; is_dnb?: boolean
      }>
      collapsed?: boolean
    }> = []

    const listsAvailable = taggedDeafPersons.filter(p => p.status === 'list_available' && p.interpreters.length > 0)
    if (listsAvailable.length === 0) return groups

    // Collect all DNB IDs across all lists
    const allDnbIds = new Set<string>()
    for (const person of listsAvailable) {
      for (const interp of person.interpreters) {
        if (interp.is_dnb) allDnbIds.add(interp.id)
      }
    }

    // Count how many lists each interpreter appears on (excluding DNB)
    const interpListCount: Record<string, number> = {}
    for (const person of listsAvailable) {
      for (const interp of person.interpreters) {
        if (!interp.is_dnb && !allDnbIds.has(interp.id)) {
          interpListCount[interp.id] = (interpListCount[interp.id] || 0) + 1
        }
      }
    }

    // Group 1: Recommended (appears on multiple lists)
    if (listsAvailable.length > 1) {
      const recommended = new Map<string, DeafListInterpreter>()
      for (const person of listsAvailable) {
        for (const interp of person.interpreters) {
          if (!interp.is_dnb && !allDnbIds.has(interp.id) && (interpListCount[interp.id] || 0) >= 2) {
            if (!recommended.has(interp.id)) {
              recommended.set(interp.id, interp)
            }
          }
        }
      }

      if (recommended.size > 0) {
        groups.push({
          label: 'Recommended: appears on multiple lists',
          accent: 'purple',
          interpreters: Array.from(recommended.values()).map(i => ({
            ...i,
            badge: undefined,
            recommended: true,
          })),
        })
      }
    }

    // Group 2+: Per-person lists
    const recommendedIds = new Set(
      groups.length > 0 ? groups[0].interpreters.map(i => i.id) : []
    )

    for (const person of listsAvailable) {
      const personInterpreters = person.interpreters
        .filter(i => !i.is_dnb && !allDnbIds.has(i.id) && !recommendedIds.has(i.id))
        .map(i => ({
          ...i,
          badge: `On ${person.displayName}'s list`,
        }))

      if (personInterpreters.length > 0) {
        groups.push({
          label: `${person.displayName}'s preferred interpreters`,
          accent: 'purple',
          interpreters: personInterpreters,
        })
      }
    }

    return groups
  }

  // Check if any Deaf lists had DNB conflicts
  function hasDnbConflicts() {
    const listsAvailable = taggedDeafPersons.filter(p => p.status === 'list_available')
    if (listsAvailable.length < 2) return false

    const allDnbIds = new Set<string>()
    const allPreferredIds = new Set<string>()
    for (const person of listsAvailable) {
      for (const interp of person.interpreters) {
        if (interp.is_dnb) allDnbIds.add(interp.id)
        else allPreferredIds.add(interp.id)
      }
    }

    // If any preferred interpreter is also on a DNB list
    for (const id of allPreferredIds) {
      if (allDnbIds.has(id)) return true
    }
    return false
  }

  const interpreterGroups = buildInterpreterGroups()
  const hasDeafLists = interpreterGroups.length > 0
  const showRosterOnly = skipDeafTag || continuedWithoutList ||
    (taggedDeafPersons.length > 0 && taggedDeafPersons.every(p => p.status === 'not_on_signpost'))

  const platformFee = 15.0 * interpreterCount

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: '27px', letterSpacing: '-0.02em', margin: '0 0 6px', color: '#f0f2f8' }}>
          New Interpreter Request
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0 0 26px' }}>
          Fill out the details below to request an interpreter for your event.
        </p>

        {/* ================================================================ */}
        {/* SECTION 1: EVENT DETAILS                                         */}
        {/* ================================================================ */}
        <h3 style={sectionLabelStyle}>Event Details</h3>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>What is this event? *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Medical appointment, Staff meeting, Conference keynote"
            style={inputStyle}
          />
          {errors.title && <div style={errorStyle}>{errors.title}</div>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Event Category *</label>
          <select value={eventCategory} onChange={e => setEventCategory(e.target.value)} style={selectStyle}>
            <option value="">Select a category</option>
            {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.eventCategory && <div style={errorStyle}>{errors.eventCategory}</div>}
        </div>

        <div className="req-date-time-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            {errors.date && <div style={errorStyle}>{errors.date}</div>}
          </div>
          <div>
            <label style={labelStyle}>Start Time *</label>
            <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} style={inputStyle} />
            {errors.timeStart && <div style={errorStyle}>{errors.timeStart}</div>}
          </div>
          <div>
            <label style={labelStyle}>End Time *</label>
            <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} style={inputStyle} />
            {errors.timeEnd && <div style={errorStyle}>{errors.timeEnd}</div>}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Recurrence</label>
          <select value={recurrence} onChange={e => setRecurrence(e.target.value)} style={selectStyle}>
            {RECURRENCE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Format *</label>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['in_person', 'remote'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: format === f ? 'rgba(0,229,255,0.1)' : 'var(--surface)',
                  border: `1px solid ${format === f ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  color: format === f ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: 600, fontSize: '0.88rem',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                {f === 'in_person' ? 'In-person' : 'Remote'}
              </button>
            ))}
          </div>
        </div>

        {format === 'in_person' && (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Location *</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Full address"
              style={inputStyle}
            />
            {errors.location && <div style={errorStyle}>{errors.location}</div>}
          </div>
        )}

        {format === 'remote' && (
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Remote Platform</label>
            <input
              type="text"
              value={remotePlatform}
              onChange={e => setRemotePlatform(e.target.value)}
              placeholder="e.g. Zoom, Microsoft Teams, Google Meet"
              style={inputStyle}
            />
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Sign Language Needed *</label>
          <select value={signLanguage} onChange={e => setSignLanguage(e.target.value)} style={selectStyle}>
            {SIGN_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {errors.signLanguage && <div style={errorStyle}>{errors.signLanguage}</div>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Spoken Language Needed</label>
          <select value={spokenLanguage} onChange={e => setSpokenLanguage(e.target.value)} style={selectStyle}>
            {SPOKEN_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Number of Interpreters Needed</label>
          <input
            type="number"
            min={1}
            max={10}
            value={interpreterCount}
            onChange={e => setInterpreterCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            style={{ ...inputStyle, maxWidth: 120 }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Specialization Needed</label>
          <select value={specialization} onChange={e => setSpecialization(e.target.value)} style={selectStyle}>
            <option value="">None specified</option>
            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* ================================================================ */}
        {/* PREPARATION DETAILS (optional)                                   */}
        {/* ================================================================ */}
        <h3 style={sectionLabelStyle}>Preparation Details (optional)</h3>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>On-site Contact</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }} className="req-date-time-grid">
            <input
              type="text"
              value={onsiteContactName}
              onChange={e => setOnsiteContactName(e.target.value)}
              placeholder="Name"
              style={inputStyle}
            />
            <input
              type="tel"
              value={onsiteContactPhone}
              onChange={e => setOnsiteContactPhone(e.target.value)}
              placeholder="Phone"
              style={inputStyle}
            />
            <input
              type="email"
              value={onsiteContactEmail}
              onChange={e => setOnsiteContactEmail(e.target.value)}
              placeholder="Email"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Prep Notes</label>
          <textarea
            value={prepNotes}
            onChange={e => setPrepNotes(e.target.value)}
            placeholder="Any details interpreters should know before the assignment. e.g. arrive 15 minutes early for badge pickup."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Attachments</label>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0 0 8px', lineHeight: 1.5 }}>
            Up to 5 files, 10MB max each. PDF, Word, or images.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ATTACH_ACCEPT}
            onChange={handleAttachmentUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || attachments.length >= MAX_FILES}
            style={{
              padding: '9px 18px',
              background: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: (uploading || attachments.length >= MAX_FILES) ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
              opacity: (uploading || attachments.length >= MAX_FILES) ? 0.6 : 1,
            }}
          >
            {uploading ? 'Uploading...' : 'Add files'}
          </button>
          {uploadError && <div style={errorStyle}>{uploadError}</div>}
          {attachments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {attachments.map(a => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '8px 12px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleDownloadAttachment(a)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--text)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: "'Inter', sans-serif",
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    {a.file_name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(a)}
                    aria-label={`Remove ${a.file_name}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '2px 6px',
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* SECTION 2: WHO IS THIS FOR?                                      */}
        {/* ================================================================ */}
        <BetaTryThis storageKey="beta_try_new_request_deaf">
          Try entering jordan.rivera.test@signpost.community in the field below to see how a Deaf client&apos;s preferred interpreter list works. Then click &apos;+ Add another person&apos; and enter maria.chen.test@signpost.community. Notice which interpreters are recommended because they appear on both lists.
        </BetaTryThis>

        <h3 style={sectionLabelStyle}>Who is this for?</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
          Enter the email or phone number of the Deaf, DeafBlind, or Hard of Hearing person this interpreter is for. Their preferred interpreter list will help you find the best match.
        </p>

        {!skipDeafTag && (
          <>
            {/* Tagged persons */}
            {taggedDeafPersons.map((person, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                {person.status === 'loading' && (
                  <div style={{
                    padding: '16px 20px', background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 16, height: 16, border: '2px solid var(--accent)',
                      borderTopColor: 'transparent', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Looking up {person.identifier}...</span>
                  </div>
                )}

                {/* State A: List available */}
                {person.status === 'list_available' && (
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(0,229,255,0.04)',
                    border: '1px solid rgba(0,229,255,0.2)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l3.5 3.5L13 5" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent)' }}>
                          {person.displayName}&apos;s preferred interpreter list has been shared with you.
                        </span>
                      </div>
                      <button type="button" onClick={() => removeTaggedPerson(idx)} style={{
                        background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '2px 6px',
                      }}>&times;</button>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
                      These are interpreters {person.displayName} trusts and has worked with.
                    </p>
                  </div>
                )}

                {/* State B: Approval pending */}
                {person.status === 'approval_pending' && (
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(251,191,36,0.04)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="#fbbf24" strokeWidth="1.5" />
                          <path d="M8 5v3" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="8" cy="10.5" r="0.5" fill="#fbbf24" />
                        </svg>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fbbf24' }}>
                          Waiting for {person.displayName}&apos;s approval
                        </span>
                      </div>
                      <button type="button" onClick={() => removeTaggedPerson(idx)} style={{
                        background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '2px 6px',
                      }}>&times;</button>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '6px 0 12px', lineHeight: 1.5 }}>
                      {person.displayName} manages access to their preferred interpreter list. We have sent them a request to share it with you. You can save this as a draft and come back when they respond, or continue with interpreters from your own roster.
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="btn-primary"
                        style={{ padding: '9px 18px', fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setContinuedWithoutList(true)}
                        style={{
                          background: 'none', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)', padding: '9px 18px',
                          fontSize: '0.82rem', color: 'var(--muted)', cursor: 'pointer',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Continue without their list
                      </button>
                    </div>
                  </div>
                )}

                {/* State C: Not on signpost */}
                {person.status === 'not_on_signpost' && (
                  <div style={{
                    padding: '16px 20px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {person.identifier} does not have a signpost account yet.
                      </span>
                      <button type="button" onClick={() => removeTaggedPerson(idx)} style={{
                        background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '2px 6px',
                      }}>&times;</button>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
                      You can invite them to create one so their interpreter preferences are included in future bookings.
                    </p>
                    <div style={{ marginTop: 10 }}>
                      {(!inviteSending[idx] || inviteSending[idx] === 'idle') && (
                        <button
                          type="button"
                          onClick={() => handleSendInvite(idx, person.identifier)}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(0,229,255,0.08)',
                            border: '1px solid rgba(0,229,255,0.3)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Send invite
                        </button>
                      )}
                      {inviteSending[idx] === 'sending' && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Sending...</span>
                      )}
                      {inviteSending[idx] === 'sent' && (
                        <span style={{ fontSize: '0.82rem', color: '#34d399' }}>Invite sent to {person.identifier}</span>
                      )}
                      {inviteSending[idx] === 'error' && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--accent3)' }}>
                          Failed to send invite.{' '}
                          <button
                            type="button"
                            onClick={() => handleSendInvite(idx, person.identifier)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', padding: 0 }}
                          >
                            Retry
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Error state */}
                {person.status === 'error' && (
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(255,107,133,0.04)',
                    border: '1px solid rgba(255,107,133,0.2)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent3)' }}>
                        Could not look up {person.identifier}. Please try again.
                      </span>
                      <button type="button" onClick={() => removeTaggedPerson(idx)} style={{
                        background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '2px 6px',
                      }}>&times;</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Lookup input */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <input
                ref={lookupInputRef}
                type="text"
                value={currentLookupInput}
                onChange={e => { setCurrentLookupInput(e.target.value); setLookupError(null) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleDeafLookup() } }}
                placeholder="Email or phone number"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={handleDeafLookup}
                disabled={!currentLookupInput.trim()}
                style={{
                  padding: '11px 20px',
                  background: currentLookupInput.trim() ? 'rgba(0,229,255,0.1)' : 'var(--surface)',
                  border: `1px solid ${currentLookupInput.trim() ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: currentLookupInput.trim() ? 'var(--accent)' : 'var(--muted)',
                  fontSize: '0.85rem', fontWeight: 600, cursor: currentLookupInput.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                Look up
              </button>
            </div>
            {lookupError && <div style={errorStyle}>{lookupError}</div>}

            {taggedDeafPersons.length > 0 && (
              <button
                type="button"
                onClick={() => { setCurrentLookupInput(''); setLookupError(null); setTimeout(() => lookupInputRef.current?.focus(), 0) }}
                style={{
                  background: 'none', border: 'none', padding: '4px 0',
                  color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  marginBottom: 8,
                }}
              >
                + Add another person
              </button>
            )}
          </>
        )}

        {/* State D: Skip */}
        {!skipDeafTag && taggedDeafPersons.length === 0 && (
          <button
            type="button"
            onClick={() => setSkipDeafTag(true)}
            style={{
              background: 'none', border: 'none', padding: '4px 0',
              color: 'var(--muted)', fontSize: '0.82rem',
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              textDecoration: 'underline', marginTop: 4,
            }}
          >
            I don&apos;t have a specific person to tag (conference, event with unknown attendees, etc.)
          </button>
        )}

        {skipDeafTag && (
          <div style={{
            padding: '12px 16px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              No specific Deaf/DB/HH person tagged. Showing your roster.
            </span>
            <button
              type="button"
              onClick={() => setSkipDeafTag(false)}
              style={{
                background: 'none', border: 'none', color: 'var(--accent)',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Undo
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* SECTION 3: CHOOSE INTERPRETERS                                   */}
        {/* ================================================================ */}
        {hasDeafLists && (
          <BetaTryThis storageKey="beta_try_new_request_interp">
            The interpreters below come from your tagged client&apos;s preferred list. These are interpreters the Deaf client trusts. Notice how they appear above your own roster, giving priority to the client&apos;s preferences.
          </BetaTryThis>
        )}

        <h3 style={sectionLabelStyle}>Choose Interpreters</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
          Select up to 10 interpreters for this request. Each one will receive a personalized notification with your booking details and can respond with their availability and rates.
        </p>

        {/* "Why is there a limit?" accordion */}
        <details style={{
          marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', overflow: 'hidden',
        }}>
          <summary style={{
            padding: '12px 16px', cursor: 'pointer', fontSize: '0.82rem',
            fontWeight: 600, color: 'var(--accent)', fontFamily: "'Inter', sans-serif",
            listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s' }}>
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Why is there a limit?
          </summary>
          <div style={{ padding: '0 16px 14px', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.65 }}>
            Interpreters respond best to requests from people who selected them for their skills. Sending targeted requests (rather than blasting hundreds of interpreters at once) means faster responses, better fit, and a better experience for everyone. If you need to reach more interpreters, signpost will monitor your request and make it easy to send additional rounds.
          </div>
        </details>

        {/* Continued-without-list reminder */}
        {continuedWithoutList && taggedDeafPersons.some(p => p.status === 'approval_pending') && (
          <div style={{
            padding: '12px 16px', marginBottom: 16,
            background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.15)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
              You are selecting interpreters without input from {taggedDeafPersons.find(p => p.status === 'approval_pending')?.displayName || 'the tagged person'}. If they share their list later, you can send to their preferred interpreters from the request detail page.
            </p>
          </div>
        )}

        <div style={{ marginBottom: 32 }}>
          <RequesterInterpreterPicker
            selectedIds={selectedInterpreters}
            onChange={setSelectedInterpreters}
            interpreterGroups={hasDeafLists && !showRosterOnly ? interpreterGroups : []}
            showRosterFallback={true}
            rosterLabel={hasDeafLists && !showRosterOnly ? 'Your roster' : undefined}
          />

          {/* DNB conflict note */}
          {hasDnbConflicts() && (
            <p style={{
              fontSize: '0.78rem', color: 'var(--muted)', marginTop: 10, lineHeight: 1.5,
              fontStyle: 'italic',
            }}>
              Some interpreters were excluded due to booking preferences from your tagged clients.
            </p>
          )}

          {selectedInterpreters.length >= 10 && (
            <p style={{
              fontSize: '0.82rem', color: 'var(--accent)', marginTop: 10, lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif",
            }}>
              Maximum reached for this round. If your selected interpreters are unavailable, signpost will notify you so you can send to more.
            </p>
          )}
        </div>

        {/* ================================================================ */}
        {/* SECTION 4: ADDITIONAL CONTEXT                                    */}
        {/* ================================================================ */}
        <h3 style={sectionLabelStyle}>Additional Context</h3>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Additional Notes for Interpreters</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional context, preparation materials, or special requirements"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' as const }}
          />
        </div>

        {/* ================================================================ */}
        {/* SECTION 5: PAYMENT + SUBMIT                                     */}
        {/* ================================================================ */}
        <h3 style={sectionLabelStyle}>Review &amp; Platform Fee</h3>

        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 20,
        }}>
          <div className="req-review-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', fontSize: '0.85rem', marginBottom: 16 }}>
            <div>
              <span style={{ color: 'var(--muted)' }}>Event: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{title || '\u2014'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Category: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{eventCategory || '\u2014'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Date: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{date || '\u2014'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Time: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                {timeStart && timeEnd ? `${timeStart} \u2013 ${timeEnd}` : '\u2014'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Format: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{format === 'in_person' ? 'In-person' : 'Remote'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Interpreters: </span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{interpreterCount}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 10 }}>
              A <strong style={{ color: 'var(--text)' }}>$15.00 platform fee</strong> per interpreter will be charged when a booking is confirmed. This fee supports signpost and is separate from the interpreter&apos;s rate.
            </p>
            <div style={{
              background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)',
              borderRadius: 'var(--radius-sm)', padding: '12px 16px',
              fontSize: '0.88rem', color: 'var(--accent)', fontWeight: 600,
            }}>
              $15.00 x {interpreterCount} interpreter{interpreterCount !== 1 ? 's' : ''} = ${platformFee.toFixed(2)} platform fee
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>
              No additional fees are charged by signpost, to any party. Interpreters receive 100% of their rate, signpost does not take a commission. You will not be charged until you confirm an interpreter&apos;s rate and accept the booking.
            </p>
          </div>
        </div>

        {/* Smart directory link */}
        {(() => {
          const params = new URLSearchParams({ context: 'requester' })
          if (signLanguage) params.set('signLang', signLanguage)
          if (spokenLanguage) params.set('spokenLang', spokenLanguage)
          if (specialization) params.set('spec', specialization)
          if (location) params.set('location', location)
          if (format) params.set('workMode', format)
          return (
            <Link
              href={`/directory?${params.toString()}`}
              target="_blank"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
                color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600,
                textDecoration: 'none', fontFamily: "'Inter', sans-serif",
                marginTop: 20, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.06)' }}
            >
              Browse matching interpreters &#8594;
            </Link>
          )
        })()}

        {/* Payment method gate warning */}
        {hasPaymentMethod === false && (
          <div
            ref={paymentNoticeRef}
            style={{
              marginTop: 24,
              padding: '20px 24px',
              background: 'rgba(255,107,133,0.06)',
              border: '1px solid rgba(255,107,133,0.25)',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
                  Payment method required
                </p>
                <p style={{ fontSize: '14px', color: '#c8cdd8', margin: '0 0 14px' }}>
                  Please add a payment method before submitting a request. You won&apos;t be charged until you confirm an interpreter.
                </p>
                <Link
                  href="/request/dashboard/profile"
                  className="btn-primary"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', fontSize: '14px', fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Go to Profile to add payment method
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="req-form-actions" style={{ display: 'flex', gap: 12, marginTop: 32, marginBottom: 48 }}>
          <button
            className="btn-primary"
            disabled={submitting}
            onClick={() => handleSubmit()}
            style={{
              padding: '14px 32px', fontSize: '0.92rem', fontWeight: 700,
              opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
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
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes pulse-highlight {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); border-color: rgba(239,68,68,0.6); }
          50% { box-shadow: 0 0 12px 4px rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.6); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); border-color: rgba(239,68,68,0.2); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
        }
        @media (max-width: 640px) {
          .req-date-time-grid { grid-template-columns: 1fr !important; }
          .req-review-grid { grid-template-columns: 1fr !important; }
          .req-form-actions { flex-direction: column !important; }
          .req-form-actions button { width: 100% !important; text-align: center !important; }
        }
        @media (max-width: 480px) {
          .dash-page-content { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}
