'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'

const ORANGE = '#ff7e45'

type TemplateName = 'beta-update' | 'invitation' | 'profile-invite' | 'custom'
type RecipientMode = 'role' | 'manual'
type ManualMode = 'single' | 'batch'
type RoleName = 'interpreter' | 'deaf' | 'requester'

interface SentEntry {
  email: string
  name: string
  template: TemplateName
  status: 'success' | 'error'
  error?: string
  timestamp: Date
}

interface RoleCounts {
  interpreter: number
  deaf: number
  requester: number
}

const TEMPLATES: { key: TemplateName; label: string; description: string }[] = [
  {
    key: 'beta-update',
    label: 'Beta interpreter update',
    description: 'For interpreters who participated in the beta. Thanks them for feedback, highlights improvements, asks them to complete profiles.',
  },
  {
    key: 'invitation',
    label: 'Interpreter invitation',
    description: 'For friends and colleagues who haven\'t used signpost yet. Personal intro, explains the platform, asks them to join.',
  },
  {
    key: 'profile-invite',
    label: 'Interpreter beta: complete profile + invite',
    description: 'Thanks interpreters for beta feedback, asks them to complete their profile and invite colleagues. Includes forwarding buttons and feature highlights.',
  },
  {
    key: 'custom',
    label: 'Custom email',
    description: 'Write your own email with signpost branding applied automatically.',
  },
]

const TEMPLATE_SUBJECTS: Record<string, string> = {
  'beta-update': 'signpost is almost ready. We need your help.',
  'invitation': 'I built something I think you will want to see',
  'profile-invite': 'signpost is opening soon. Help us one more time and coffee\'s on us!',
}

const TEMPLATE_PREVIEWS: Record<string, string> = {
  'beta-update': `Hi [name],

Thank you SO MUCH for being part of the signpost beta. Your feedback has shaped every part of this platform, and we want you to see what it turned into.

Here are some of the biggest improvements we built based on what you told us:

  - Mentorship matching: You can now offer or seek mentorship from other interpreters.
  - Rating confidentiality: Deaf users can now rate interpreters privately.
  - Book Me badge: You now have a custom URL and badge for your personal booking page.
  - Built-in Invoicing: Use your own tools or use signpost's free invoicing feature.
  - Directory improvements: Batch add interpreters, new filters, cleaner browsing.

Now, we are very close to opening the door to requesters. But they need a directory full of interpreters to book from.

That's where you come in.

The single most important thing you can do right now is complete your profile.

[ Complete Your Profile ]

And if there's an interpreter you love working with who isn't on signpost yet, send them an invitation.

Thank you for helping us build something the community actually needs. We couldn't have gotten here without you.

Molly Sano-Mahgoub
Co-founder, signpost`,
  'profile-invite': `Hey [name]!

Thank you SO MUCH for being part of the signpost beta. Your feedback shaped every part of this platform, and we want you to see what it turned into.

We are very close to going live. Several requesters are already knocking on our door asking how soon we'll be ready for real requests.

Two things would make the biggest difference right now:

1. Complete your profile.
Upload a photo, fill in your bio, set your rate profiles, etc.

2. Invite interpreters you love working with.
Send this invite to the interpreters you want on your team, and Molly or Regina will take you out for coffee!

[ Send invite via email ]  [ Send invite via text ]

Feature highlights: Mentorship Matching, Confidential Interpreter Ratings, "Book Me" Badge.

Thank you for helping us build something special.

Molly and Regina`,
  'invitation': `Hi [name],

I've been building something over the past few months and I'd love for you to check it out.

It's called signpost. It's a directory and booking platform for freelance interpreters. Regina McGinnis and I co-founded it because we were frustrated with the same things you and I have talked about: agencies taking a huge cut, owning the client relationship, and deciding who shows up.

signpost puts interpreters in control. You set your own rates and terms. 100% of your rate goes to you. signpost charges the requester a flat $15 booking fee, and that's it.

A few things I'm really proud of:

  - Deaf clients can build a preferred interpreter list and share it with anyone who books for them.
  - You get a custom URL and Book Me badge.
  - We built mentorship matching for experienced and newer interpreters.
  - Free invoicing built in if you want it.

We're almost ready to start inviting requesters. But we need a solid directory of interpreters first. That's where you come in.

Would you set up a profile? It takes about 5 minutes:

[ Join signpost ]

I'd really appreciate your support on this.

Molly`,
}

const ROLE_LABELS: Record<RoleName, string> = {
  interpreter: 'All Interpreters',
  deaf: 'All Deaf/DB/HH',
  requester: 'All Requesters',
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return '1 min ago'
  return `${minutes} min ago`
}

function templateLabel(t: TemplateName): string {
  if (t === 'beta-update') return 'beta update'
  if (t === 'invitation') return 'invitation'
  if (t === 'profile-invite') return 'profile + invite'
  return 'custom'
}

function parseBatchRecipients(text: string): { email: string; name: string }[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(',').map(s => s.trim())
      if (parts.length < 2 || !isValidEmail(parts[0])) return null
      return { email: parts[0], name: parts.slice(1).join(', ') }
    })
    .filter((r): r is { email: string; name: string } => r !== null)
}

// ---- Styles ----

const cardStyle: React.CSSProperties = {
  background: 'var(--card-bg)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '18px 22px', marginBottom: 20,
}

const sectionLabel: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif", fontWeight: 600,
  fontSize: '13px', letterSpacing: '0.08em',
  textTransform: 'uppercase', color: ORANGE, marginBottom: 14,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', maxWidth: 420,
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
  fontSize: '15px', fontFamily: "'Inter', sans-serif",
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 500,
  color: '#c8cdd8', marginBottom: 6,
}

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '10px 24px', background: disabled ? 'var(--border)' : '#00e5ff',
  border: 'none', borderRadius: 'var(--radius-sm)',
  color: '#0a0a0f', fontSize: '0.85rem', fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: "'Inter', sans-serif",
  opacity: disabled ? 0.6 : 1,
})

const tabBtn = (active: boolean, position: 'left' | 'right' | 'middle'): React.CSSProperties => ({
  padding: '8px 20px',
  border: '1px solid var(--border)',
  borderLeft: position === 'left' ? '1px solid var(--border)' : 'none',
  borderRadius: position === 'left' ? '10px 0 0 10px' : position === 'right' ? '0 10px 10px 0' : '0',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif", fontSize: '0.82rem', fontWeight: 600,
  background: active ? ORANGE : 'transparent',
  color: active ? '#0a0a0f' : 'var(--muted)',
})

// ---- Component ----

export default function AdminAnnouncementsPage() {
  const [template, setTemplate] = useState<TemplateName | null>(null)
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('manual')
  const [manualMode, setManualMode] = useState<ManualMode>('single')
  const [selectedRole, setSelectedRole] = useState<RoleName | null>(null)
  const [singleEmail, setSingleEmail] = useState('')
  const [singleName, setSingleName] = useState('')
  const [batchText, setBatchText] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [roleResult, setRoleResult] = useState<{ sent: number; failed: number } | null>(null)
  const [sentLog, setSentLog] = useState<SentEntry[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [counts, setCounts] = useState<RoleCounts | null>(null)
  const sentEmails = useRef(new Set<string>())

  // Fetch role counts on mount
  useEffect(() => {
    fetch('/api/admin/send-announcement?action=counts', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCounts(data) })
      .catch(() => {})
  }, [])

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function addLogEntry(entry: SentEntry) {
    setSentLog(prev => [entry, ...prev])
    sentEmails.current.add(entry.email.toLowerCase())
  }

  function getPayload(overrides: Record<string, unknown> = {}) {
    const base: Record<string, unknown> = { template }
    if (template === 'custom') {
      base.subject = customSubject
      base.customBody = customBody
    }
    return { ...base, ...overrides }
  }

  async function sendSingle(email: string, name: string): Promise<boolean> {
    if (!template) return false
    const trimmedEmail = email.trim().toLowerCase()
    if (sentEmails.current.has(trimmedEmail)) {
      showToast(`Already sent to ${trimmedEmail} this session`, 'error')
      return false
    }

    try {
      const res = await fetch('/api/admin/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(getPayload({ recipientEmail: trimmedEmail, recipientName: name.trim() })),
      })
      const data = await res.json()
      if (!res.ok) {
        addLogEntry({ email: trimmedEmail, name: name.trim(), template, status: 'error', error: data.error, timestamp: new Date() })
        return false
      }
      addLogEntry({ email: trimmedEmail, name: name.trim(), template, status: 'success', timestamp: new Date() })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      addLogEntry({ email: trimmedEmail, name: name.trim(), template, status: 'error', error: msg, timestamp: new Date() })
      return false
    }
  }

  async function handleSingleSend() {
    if (!template) { showToast('Select a template first', 'error'); return }
    if (template === 'custom' && !customSubject.trim()) { showToast('Subject is required for custom emails', 'error'); return }
    if (!singleEmail.trim() || !isValidEmail(singleEmail)) { showToast('Enter a valid email address', 'error'); return }
    if (!singleName.trim()) { showToast('Name is required', 'error'); return }

    setSending(true)
    const ok = await sendSingle(singleEmail, singleName)
    if (ok) {
      showToast(`Sent to ${singleEmail.trim()}`, 'success')
      setSingleEmail('')
      setSingleName('')
    } else {
      showToast('Failed to send. Check the log below.', 'error')
    }
    setSending(false)
  }

  async function handleBatchSend() {
    if (!template) { showToast('Select a template first', 'error'); return }
    if (template === 'custom' && !customSubject.trim()) { showToast('Subject is required for custom emails', 'error'); return }

    const recipients = parseBatchRecipients(batchText)
    if (recipients.length === 0) {
      showToast('No valid recipients found. Use format: email, name (one per line)', 'error')
      return
    }

    setSending(true)
    setProgress({ current: 0, total: recipients.length })
    let successCount = 0

    for (let i = 0; i < recipients.length; i++) {
      setProgress({ current: i + 1, total: recipients.length })
      const ok = await sendSingle(recipients[i].email, recipients[i].name)
      if (ok) successCount++
    }

    setProgress(null)
    showToast(`Sent ${successCount} of ${recipients.length} emails`, successCount === recipients.length ? 'success' : 'error')
    if (successCount === recipients.length) setBatchText('')
    setSending(false)
  }

  async function handleRoleSend() {
    if (!template || !selectedRole) return
    if (template === 'custom' && !customSubject.trim()) { showToast('Subject is required for custom emails', 'error'); return }

    setSending(true)
    setRoleResult(null)

    try {
      const res = await fetch('/api/admin/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(getPayload({ role: selectedRole })),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Failed to send', 'error')
      } else {
        setRoleResult({ sent: data.sent, failed: data.failed })
        showToast(`Complete: ${data.sent} sent, ${data.failed} failed`, data.failed === 0 ? 'success' : 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
    setSending(false)
  }

  const batchRecipientCount = parseBatchRecipients(batchText).length

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          padding: '10px 20px', borderRadius: 'var(--radius-sm)',
          background: toast.type === 'error' ? 'rgba(255,107,133,0.15)' : 'rgba(52,211,153,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(255,107,133,0.3)' : 'rgba(52,211,153,0.3)'}`,
          color: toast.type === 'error' ? '#ff6b85' : '#34d399',
          fontSize: '0.82rem', fontWeight: 600,
          fontFamily: "'Inter', sans-serif",
        }}>
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <h1 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: '27px',
        color: '#f0f2f8', letterSpacing: '-0.02em', margin: '0 0 6px',
      }}>
        Send Announcement
      </h1>
      <p style={{ color: '#96a0b8', fontSize: '0.88rem', margin: '0 0 32px' }}>
        Send branded signpost emails using pre-approved templates or write your own.
      </p>

      {/* ---- TEMPLATE ---- */}
      <div style={cardStyle}>
        <div style={sectionLabel}>Template</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TEMPLATES.map(t => (
            <label
              key={t.key}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${template === t.key ? ORANGE : 'var(--border)'}`,
                background: template === t.key ? 'rgba(255,126,69,0.06)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="template"
                value={t.key}
                checked={template === t.key}
                onChange={() => setTemplate(t.key)}
                style={{ marginTop: 3, accentColor: ORANGE }}
              />
              <div>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 600,
                  fontSize: '0.88rem', color: 'var(--text)', marginBottom: 4,
                }}>
                  {t.label}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#96a0b8', lineHeight: 1.5 }}>
                  {t.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ---- SUBJECT + BODY (pre-built: read-only preview / custom: editable) ---- */}
      {template && (
        <div style={cardStyle}>
          <div style={sectionLabel}>Email Content</div>

          {/* Subject */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Subject</label>
            {template === 'custom' ? (
              <input
                type="text"
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                placeholder="Your email subject line"
                style={inputStyle}
                disabled={sending}
              />
            ) : (
              <div style={{
                padding: '11px 14px', maxWidth: 420,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: '#96a0b8',
                fontSize: '15px', fontFamily: "'Inter', sans-serif",
              }}>
                {TEMPLATE_SUBJECTS[template]}
              </div>
            )}
          </div>

          {/* Body */}
          {template === 'custom' ? (
            <div>
              <label style={labelStyle}>Email Body</label>
              <textarea
                value={customBody}
                onChange={e => setCustomBody(e.target.value)}
                placeholder={'Write your email here. Use [name] to insert the recipient\'s name. Double line breaks become paragraph breaks. signpost branding is applied automatically.'}
                rows={12}
                disabled={sending}
                style={{
                  ...inputStyle,
                  maxWidth: '100%',
                  resize: 'vertical',
                  minHeight: 200,
                  lineHeight: '1.6',
                }}
              />
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Preview</label>
              <pre style={{
                padding: '16px 20px',
                background: '#111118', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: '#96a0b8',
                fontSize: '0.82rem', fontFamily: "'Inter', sans-serif",
                lineHeight: 1.6, whiteSpace: 'pre-wrap', wordWrap: 'break-word',
                maxHeight: 360, overflowY: 'auto', margin: 0,
              }}>
                {TEMPLATE_PREVIEWS[template]}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ---- RECIPIENTS ---- */}
      {template && (
        <div style={cardStyle}>
          <div style={sectionLabel}>Recipients</div>

          {/* Mode tabs: By Role / Manual */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
            <button onClick={() => setRecipientMode('role')} style={tabBtn(recipientMode === 'role', 'left')}>
              By Role
            </button>
            <button onClick={() => setRecipientMode('manual')} style={tabBtn(recipientMode === 'manual', 'right')}>
              Manual
            </button>
          </div>

          {recipientMode === 'role' ? (
            <div>
              {/* Role buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {(['interpreter', 'deaf', 'requester'] as RoleName[]).map(role => {
                  const isSelected = selectedRole === role
                  const count = counts ? counts[role] : '...'
                  return (
                    <button
                      key={role}
                      onClick={() => { setSelectedRole(isSelected ? null : role); setRoleResult(null) }}
                      disabled={sending}
                      style={{
                        padding: '10px 20px',
                        border: `1.5px solid ${isSelected ? '#00e5ff' : 'rgba(0, 229, 255, 0.3)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                        color: isSelected ? '#00e5ff' : 'var(--muted)',
                        fontSize: '0.85rem', fontWeight: 600,
                        fontFamily: "'Inter', sans-serif",
                        cursor: sending ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {ROLE_LABELS[role]} ({count})
                    </button>
                  )
                })}
              </div>

              {selectedRole && (
                <div>
                  <p style={{ color: '#96a0b8', fontSize: '0.85rem', margin: '0 0 14px', fontFamily: "'Inter', sans-serif" }}>
                    Sending to: {ROLE_LABELS[selectedRole]} ({counts ? counts[selectedRole] : '...'} recipients)
                  </p>

                  {sending && progress && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.82rem', color: '#96a0b8', fontFamily: "'Inter', sans-serif", marginBottom: 6 }}>
                        Sending... {progress.current} of {progress.total}
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2, background: '#00e5ff',
                          width: `${(progress.current / progress.total) * 100}%`,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  )}

                  {roleResult && (
                    <p style={{
                      fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", margin: '0 0 14px',
                      color: roleResult.failed === 0 ? '#34d399' : '#ff6b85',
                    }}>
                      Complete: {roleResult.sent} sent, {roleResult.failed} failed
                    </p>
                  )}

                  <button
                    onClick={handleRoleSend}
                    disabled={sending}
                    style={primaryBtn(sending)}
                  >
                    {sending ? 'Sending...' : `Send to ${ROLE_LABELS[selectedRole]}`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Manual sub-toggle: Single / Batch */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
                <button onClick={() => setManualMode('single')} style={tabBtn(manualMode === 'single', 'left')}>
                  Single
                </button>
                <button onClick={() => setManualMode('batch')} style={tabBtn(manualMode === 'batch', 'right')}>
                  Batch
                </button>
              </div>

              {manualMode === 'single' ? (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="email"
                      value={singleEmail}
                      onChange={e => setSingleEmail(e.target.value)}
                      placeholder="sarah@example.com"
                      style={inputStyle}
                      disabled={sending}
                    />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Name</label>
                    <input
                      type="text"
                      value={singleName}
                      onChange={e => setSingleName(e.target.value)}
                      placeholder="Sarah"
                      style={inputStyle}
                      disabled={sending}
                    />
                  </div>
                  <button
                    onClick={handleSingleSend}
                    disabled={sending || !template}
                    style={primaryBtn(sending || !template)}
                  >
                    {sending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>One recipient per line: email, name</label>
                  <textarea
                    value={batchText}
                    onChange={e => setBatchText(e.target.value)}
                    placeholder={'sarah@example.com, Sarah\nmike@example.com, Mike'}
                    rows={6}
                    disabled={sending}
                    style={{
                      ...inputStyle,
                      maxWidth: '100%',
                      resize: 'vertical',
                      minHeight: 120,
                    }}
                  />

                  {batchText.trim() && (
                    <p style={{ color: '#96a0b8', fontSize: '0.82rem', margin: '8px 0 0', fontFamily: "'Inter', sans-serif" }}>
                      {batchRecipientCount} recipient{batchRecipientCount !== 1 ? 's' : ''} detected
                    </p>
                  )}

                  {progress && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: '0.82rem', color: '#96a0b8', fontFamily: "'Inter', sans-serif", marginBottom: 6 }}>
                        Sending {progress.current} of {progress.total}...
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2, background: '#00e5ff',
                          width: `${(progress.current / progress.total) * 100}%`,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 14 }}>
                    <button
                      onClick={handleBatchSend}
                      disabled={sending || !template}
                      style={primaryBtn(sending || !template)}
                    >
                      {sending ? 'Sending...' : 'Send to All'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---- SENT LOG ---- */}
      {sentLog.length > 0 && (
        <div style={cardStyle}>
          <div style={sectionLabel}>Sent Log</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sentLog.map((entry, i) => (
              <div
                key={`${entry.email}-${i}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: '0.82rem', fontFamily: "'Inter', sans-serif",
                  padding: '8px 0',
                  borderBottom: i < sentLog.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{
                  color: entry.status === 'success' ? '#34d399' : '#ff6b85',
                  fontSize: '14px', flexShrink: 0,
                }}>
                  {entry.status === 'success' ? '\u2713' : '\u2717'}
                </span>
                <span style={{ color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.email}
                </span>
                <span style={{ color: '#96a0b8', fontSize: '0.78rem', flexShrink: 0 }}>
                  {templateLabel(entry.template)}
                </span>
                <span style={{ color: '#666', fontSize: '0.75rem', flexShrink: 0 }}>
                  {timeAgo(entry.timestamp)}
                </span>
                {entry.error && (
                  <span style={{ color: '#ff6b85', fontSize: '0.75rem', flexShrink: 0 }} title={entry.error}>
                    {entry.error.length > 30 ? entry.error.slice(0, 30) + '...' : entry.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .dash-page-content { padding: 24px 20px !important; }
        }
      `}</style>
    </div>
  )
}
