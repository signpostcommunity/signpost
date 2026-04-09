'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Contact = {
  name: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  selected: boolean
}

type InviteResult = {
  name: string
  channel: string
  success: boolean
  error?: string
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: '#111118',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '24px',
  marginBottom: '20px',
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box' as const,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '11px 14px',
  color: 'var(--text)',
  fontFamily: "'Inter', sans-serif",
  fontSize: '15px',
  outline: 'none',
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: '#c8cdd8',
  fontWeight: 500,
  marginBottom: 6,
}

const btnPrimaryStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '10px 20px',
  background: '#00e5ff',
  border: 'none',
  borderRadius: '10px',
  color: '#0a0a0f',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14.5px',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnSecondaryStyle: React.CSSProperties = {
  ...btnPrimaryStyle,
  background: 'transparent',
  border: '1px solid rgba(0,229,255,0.3)',
  color: '#00e5ff',
}

const btnGhostStyle: React.CSSProperties = {
  ...btnPrimaryStyle,
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--muted)',
}

// ── Google Contacts Picker ────────────────────────────────────────────────────

function ContactsPicker({
  contacts,
  onSend,
  onClose,
  sending,
}: {
  contacts: Contact[]
  onSend: (selected: Contact[]) => void
  onClose: () => void
  sending: boolean
}) {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<Contact[]>(contacts)
  const [allSelected, setAllSelected] = useState(false)

  const filtered = items.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.name?.toLowerCase().includes(q)) ||
      (c.email?.toLowerCase().includes(q)) ||
      (c.phone?.includes(q))
  })

  const sendable = filtered.filter(c => c.email || c.phone)
  const selected = items.filter(c => c.selected)

  function toggleAll() {
    const newVal = !allSelected
    setAllSelected(newVal)
    setItems(prev => prev.map(c => ({
      ...c,
      selected: (c.email || c.phone) ? newVal : false,
    })))
  }

  function toggle(idx: number) {
    const realIdx = items.findIndex(c => c === filtered[idx])
    if (realIdx === -1) return
    setItems(prev => {
      const next = [...prev]
      next[realIdx] = { ...next[realIdx], selected: !next[realIdx].selected }
      return next
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: '#111118', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '100%', maxWidth: 560,
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', margin: 0 }}>
              Select contacts to invite
            </h3>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              x
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...fieldInputStyle, marginBottom: 12 }}
          />

          {/* Select all */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            fontSize: '13px', color: 'var(--muted)',
          }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              style={{ accentColor: '#00e5ff' }}
            />
            Select all ({sendable.length} contacts with email or phone)
          </label>
        </div>

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px' }}>
          {filtered.map((contact, i) => {
            const canSend = !!(contact.email || contact.phone)
            return (
              <label
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid rgba(30,36,51,0.5)',
                  cursor: canSend ? 'pointer' : 'default',
                  opacity: canSend ? 1 : 0.4,
                }}
              >
                <input
                  type="checkbox"
                  checked={contact.selected}
                  disabled={!canSend}
                  onChange={() => toggle(i)}
                  style={{ accentColor: '#00e5ff', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', color: '#f0f2f8', fontWeight: 500 }}>
                    {contact.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>
                    {[contact.email, contact.phone].filter(Boolean).join(' / ') || 'No contact info'}
                  </div>
                </div>
              </label>
            )
          })}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '14px', padding: '20px 0', textAlign: 'center' }}>
              No contacts found.
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {selected.length} selected
          </span>
          <button
            onClick={() => onSend(selected)}
            disabled={selected.length === 0 || sending}
            style={{
              ...btnPrimaryStyle,
              opacity: (selected.length === 0 || sending) ? 0.5 : 1,
              cursor: (selected.length === 0 || sending) ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? 'Sending...' : `Send ${selected.length} Invite${selected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Batch Results ─────────────────────────────────────────────────────────────

function BatchResults({ results, onReset }: { results: InviteResult[]; onReset: () => void }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', margin: '0 0 16px' }}>
        Invites sent
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: '14px', color: r.success ? '#34d399' : '#f87171',
          }}>
            <span>{r.success ? '\u2713' : '\u2717'}</span>
            <span>{r.name} invited via {r.channel}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onReset}
        style={{
          background: 'none', border: 'none', color: '#00e5ff',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          marginTop: 16, padding: 0, fontFamily: "'Inter', sans-serif",
          textDecoration: 'underline', textUnderlineOffset: '2px',
        }}
      >
        Send more invites
      </button>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

function InviteContent() {
  const searchParams = useSearchParams()

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [senderRole, setSenderRole] = useState('interpreter')
  const [loading, setLoading] = useState(true)

  // Manual form
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [manualSenderName, setManualSenderName] = useState('')
  const [manualSenderEmail, setManualSenderEmail] = useState('')

  // State
  const [sending, setSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Google contacts
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [batchResults, setBatchResults] = useState<InviteResult[] | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load user profile
  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) { setLoading(false); return }
        setUser(authUser)

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, email')
          .eq('id', authUser.id)
          .maybeSingle()

        const role = profile?.role || 'interpreter'
        setSenderRole(role)
        setSenderEmail(profile?.email || authUser.email || '')

        if (role === 'deaf') {
          const { data: dp } = await supabase
            .from('deaf_profiles')
            .select('first_name, last_name, email')
            .or(`id.eq.${authUser.id},user_id.eq.${authUser.id}`)
            .maybeSingle()
          if (dp) {
            setSenderName(`${dp.first_name || ''} ${dp.last_name || ''}`.trim())
            setSenderEmail(dp.email || profile?.email || authUser.email || '')
          }
        } else {
          const { data: ip } = await supabase
            .from('interpreter_profiles')
            .select('first_name, last_name, email')
            .eq('user_id', authUser.id)
            .maybeSingle()
          if (ip) {
            setSenderName(`${ip.first_name || ''} ${ip.last_name || ''}`.trim())
            setSenderEmail(ip.email || profile?.email || authUser.email || '')
          }
        }
      } catch (e) {
        console.error('Auth check failed:', e)
      }
      setLoading(false)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen for Google Contacts postMessage
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'google-contacts-success') {
        const mapped: Contact[] = (event.data.contacts || []).map((c: {
          name: string; firstName: string | null; lastName: string | null;
          email: string | null; phone: string | null
        }) => ({
          ...c,
          selected: false,
        }))
        setContacts(mapped)
        setContactsLoading(false)
      }
      if (event.data?.type === 'google-contacts-error') {
        setContactsLoading(false)
        setErrorMsg('Could not load contacts. Please try again.')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Google Contacts OAuth popup
  async function handleImportContacts() {
    setContactsLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/google-contacts?action=auth-url')
      const { url, error } = await res.json()
      if (error || !url) {
        setErrorMsg('Google Contacts is not configured yet.')
        setContactsLoading(false)
        return
      }
      const popup = window.open(url, 'google-contacts', 'width=500,height=700,left=200,top=100')
      if (!popup) {
        setErrorMsg('Popup was blocked. Please allow popups for this site.')
        setContactsLoading(false)
      }
    } catch {
      setErrorMsg('Failed to start Google Contacts import.')
      setContactsLoading(false)
    }
  }

  // Send single invite
  async function sendInvite(channel: 'email' | 'sms' | 'clipboard') {
    const name = recipientName.trim()
    const email = recipientEmail.trim()
    const phone = recipientPhone.trim()
    const sName = user ? senderName : manualSenderName.trim()
    const sEmail = user ? senderEmail : manualSenderEmail.trim()

    if (!name) { setErrorMsg('Recipient name is required.'); return }
    if (channel === 'email' && !email) { setErrorMsg('Email is required to send via email.'); return }
    if (channel === 'sms' && !phone) { setErrorMsg('Phone is required to send via text.'); return }
    if (!email && !phone && channel !== 'clipboard') { setErrorMsg('At least an email or phone is required.'); return }
    if (!sName) { setErrorMsg('Your name is required.'); return }

    setSending(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: name,
          recipientEmail: email || null,
          recipientPhone: phone || null,
          senderName: sName,
          senderEmail: sEmail,
          senderRole,
          channel,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send invite.')
        return
      }

      if (channel === 'clipboard') {
        const clipText = `I want to add you to my preferred interpreter team on signpost! It's a new interpreter directory and booking platform. You set your own rates and terms, and connect directly with clients, with no agency fees added on top.\n\nJoin here so we can team together: ${data.signup_url}`
        try {
          await navigator.clipboard.writeText(clipText)
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        } catch {
          // Fallback
          const ta = document.createElement('textarea')
          ta.value = clipText
          document.body.appendChild(ta)
          ta.select()
          try { document.execCommand('copy') } catch { /* ignore */ }
          document.body.removeChild(ta)
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        }
      }

      const channelLabel = channel === 'email' ? 'email' : channel === 'sms' ? 'text' : 'clipboard'
      setSuccessMsg(`${name} invited via ${channelLabel}.`)
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Send batch from Google Contacts
  async function sendBatch(selected: Contact[]) {
    setSending(true)
    setErrorMsg(null)
    const results: InviteResult[] = []

    for (const contact of selected) {
      const channel = contact.email ? 'email' : 'sms'
      try {
        const res = await fetch('/api/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientName: contact.name,
            recipientEmail: contact.email || null,
            recipientPhone: contact.phone || null,
            senderName,
            senderEmail,
            senderRole,
            channel,
          }),
        })
        const data = await res.json()
        results.push({
          name: contact.name,
          channel,
          success: res.ok,
          error: data.error,
        })
      } catch {
        results.push({ name: contact.name, channel, success: false, error: 'Network error' })
      }
    }

    setBatchResults(results)
    setContacts(null)
    setSending(false)
  }

  function resetForm() {
    setRecipientName('')
    setRecipientEmail('')
    setRecipientPhone('')
    setSuccessMsg(null)
    setErrorMsg(null)
    setBatchResults(null)
  }

  if (loading) {
    return (
      <div style={{ padding: '100px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg)', minHeight: 'calc(100vh - 73px)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    }}>
      <div className="invite-container" style={{ width: '100%', maxWidth: 560, padding: '48px 24px 80px' }}>
        {/* Page header */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '24px',
          color: '#f0f2f8', letterSpacing: '-0.01em', margin: '0 0 8px',
        }}>
          Invite an interpreter to signpost
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: '15px',
          color: '#96a0b8', lineHeight: 1.6, margin: '0 0 28px',
        }}>
          Know an interpreter you love working with? Invite them to your preferred team. It takes 10 seconds.
        </p>

        {/* Batch results */}
        {batchResults && (
          <BatchResults results={batchResults} onReset={resetForm} />
        )}

        {/* Sign in prompt (not logged in) */}
        {!user && !batchResults && (
          <div style={{
            ...cardStyle,
            background: 'rgba(0,229,255,0.04)',
            border: '1px dashed rgba(0,229,255,0.2)',
          }}>
            <p style={{ color: '#c8cdd8', fontSize: '14px', margin: '0 0 14px', lineHeight: 1.6 }}>
              Sign in to import contacts from Google and send personalized invites.
            </p>
            <a
              href="/interpreter/login?redirect=/invite"
              style={{
                ...btnPrimaryStyle,
                textDecoration: 'none',
                display: 'inline-flex',
              }}
            >
              Sign in
            </a>
          </div>
        )}

        {/* Google Contacts (logged in) */}
        {user && !batchResults && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={handleImportContacts}
              disabled={contactsLoading}
              style={{
                ...btnPrimaryStyle,
                width: '100%',
                padding: '14px 20px',
                fontSize: '15px',
                opacity: contactsLoading ? 0.6 : 1,
                cursor: contactsLoading ? 'wait' : 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#0a0a0f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="#0a0a0f" strokeWidth="1.8"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#0a0a0f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {contactsLoading ? 'Loading contacts...' : 'Import from Google Contacts'}
            </button>
          </div>
        )}

        {/* Manual invite form */}
        {!batchResults && !successMsg && (
          <>
            {user && (
              <div style={{
                fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase' as const, color: '#00e5ff',
                marginBottom: 14,
              }}>
                OR INVITE MANUALLY
              </div>
            )}

            <div style={cardStyle}>
              {/* Recipient fields */}
              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabelStyle}>Recipient's name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="Their name"
                  style={fieldInputStyle}
                  onFocus={e => { e.target.style.borderColor = '#00e5ff' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabelStyle}>Recipient's email (optional if phone provided)</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  style={fieldInputStyle}
                  onFocus={e => { e.target.style.borderColor = '#00e5ff' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabelStyle}>Recipient's phone (optional if email provided)</label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  style={fieldInputStyle}
                  onFocus={e => { e.target.style.borderColor = '#00e5ff' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />
              </div>

              {/* Sender fields (only if not logged in) */}
              {!user && (
                <>
                  <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

                  <div style={{ marginBottom: 14 }}>
                    <label style={fieldLabelStyle}>Your name</label>
                    <input
                      type="text"
                      value={manualSenderName}
                      onChange={e => setManualSenderName(e.target.value)}
                      placeholder="Your name"
                      style={fieldInputStyle}
                      onFocus={e => { e.target.style.borderColor = '#00e5ff' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={fieldLabelStyle}>Your email</label>
                    <input
                      type="email"
                      value={manualSenderEmail}
                      onChange={e => setManualSenderEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={fieldInputStyle}
                      onFocus={e => { e.target.style.borderColor = '#00e5ff' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Send buttons */}
            <div className="invite-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
              <button
                onClick={() => sendInvite('email')}
                disabled={sending}
                style={{ ...btnPrimaryStyle, opacity: sending ? 0.6 : 1 }}
              >
                {sending ? 'Sending...' : 'Send via email'}
              </button>
              <button
                onClick={() => sendInvite('sms')}
                disabled={sending}
                style={{ ...btnSecondaryStyle, opacity: sending ? 0.6 : 1 }}
              >
                Send via text
              </button>
              <button
                onClick={() => sendInvite('clipboard')}
                disabled={sending}
                style={{ ...btnGhostStyle, opacity: sending ? 0.6 : 1 }}
              >
                {copied ? '\u2713 Copied!' : 'Copy invite text'}
              </button>
            </div>
          </>
        )}

        {/* Success state */}
        {successMsg && !batchResults && (
          <div style={cardStyle}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              color: '#34d399', fontSize: '15px', fontWeight: 600, marginBottom: 12,
            }}>
              <span style={{ fontSize: '1.2rem' }}>{'\u2713'}</span>
              {successMsg}
            </div>
            <button
              onClick={resetForm}
              style={{
                background: 'none', border: 'none', color: '#00e5ff',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                padding: 0, fontFamily: "'Inter', sans-serif",
                textDecoration: 'underline', textUnderlineOffset: '2px',
              }}
            >
              Send another
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <p style={{ color: '#f87171', fontSize: '13px', marginTop: 8 }}>
            {errorMsg}
          </p>
        )}

        {/* Google Contacts picker modal */}
        {contacts && (
          <ContactsPicker
            contacts={contacts}
            onSend={sendBatch}
            onClose={() => setContacts(null)}
            sending={sending}
          />
        )}
      </div>

      <style>{`
        @media (max-width: 480px) {
          .invite-container {
            padding: 24px 20px 60px !important;
          }
          .invite-buttons {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function InviteClient() {
  return (
    <Suspense fallback={
      <div style={{ padding: '100px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
        Loading...
      </div>
    }>
      <InviteContent />
    </Suspense>
  )
}
