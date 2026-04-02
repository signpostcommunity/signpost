'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'

const ORANGE = '#ff7e45'

type TemplateName = 'beta-update' | 'invitation'

interface SentEntry {
  email: string
  name: string
  template: TemplateName
  status: 'success' | 'error'
  error?: string
  timestamp: Date
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
]

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

export default function AdminAnnouncementsPage() {
  const [template, setTemplate] = useState<TemplateName | null>(null)
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [singleEmail, setSingleEmail] = useState('')
  const [singleName, setSingleName] = useState('')
  const [batchText, setBatchText] = useState('')
  const [sending, setSending] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)
  const [sentLog, setSentLog] = useState<SentEntry[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const sentEmails = useRef(new Set<string>())

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function addLogEntry(entry: SentEntry) {
    setSentLog(prev => [entry, ...prev])
    sentEmails.current.add(entry.email.toLowerCase())
  }

  async function sendOne(email: string, name: string, tmpl: TemplateName): Promise<boolean> {
    const trimmedEmail = email.trim().toLowerCase()
    if (sentEmails.current.has(trimmedEmail)) {
      showToast(`Already sent to ${trimmedEmail} this session`, 'error')
      return false
    }

    try {
      const res = await fetch('/api/admin/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: tmpl, recipientEmail: trimmedEmail, recipientName: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        addLogEntry({ email: trimmedEmail, name: name.trim(), template: tmpl, status: 'error', error: data.error, timestamp: new Date() })
        return false
      }
      addLogEntry({ email: trimmedEmail, name: name.trim(), template: tmpl, status: 'success', timestamp: new Date() })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      addLogEntry({ email: trimmedEmail, name: name.trim(), template: tmpl, status: 'error', error: msg, timestamp: new Date() })
      return false
    }
  }

  async function handleSingleSend() {
    if (!template) { showToast('Select a template first', 'error'); return }
    if (!singleEmail.trim() || !isValidEmail(singleEmail)) { showToast('Enter a valid email address', 'error'); return }
    if (!singleName.trim()) { showToast('Name is required', 'error'); return }

    setSending(true)
    const ok = await sendOne(singleEmail, singleName, template)
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

    const lines = batchText.split('\n').map(l => l.trim()).filter(Boolean)
    const recipients: { email: string; name: string }[] = []

    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim())
      if (parts.length < 2 || !isValidEmail(parts[0])) continue
      recipients.push({ email: parts[0], name: parts.slice(1).join(', ') })
    }

    if (recipients.length === 0) {
      showToast('No valid recipients found. Use format: email, name (one per line)', 'error')
      return
    }

    setSending(true)
    setBatchProgress({ current: 0, total: recipients.length })
    let successCount = 0

    for (let i = 0; i < recipients.length; i++) {
      setBatchProgress({ current: i + 1, total: recipients.length })
      const ok = await sendOne(recipients[i].email, recipients[i].name, template)
      if (ok) successCount++
    }

    setBatchProgress(null)
    showToast(`Sent ${successCount} of ${recipients.length} emails`, successCount === recipients.length ? 'success' : 'error')
    if (successCount === recipients.length) setBatchText('')
    setSending(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', maxWidth: 420,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
    fontSize: '15px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 500,
    color: '#c8cdd8', marginBottom: 6,
  }

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
          fontFamily: "'DM Sans', sans-serif",
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
        Send branded signpost emails to interpreters using pre-approved templates.
      </p>

      {/* Template selector */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '18px 22px', marginBottom: 20,
      }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
          fontSize: '13px', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: ORANGE, marginBottom: 14,
        }}>
          Template
        </div>
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
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
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

      {/* Mode toggle */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: '18px 22px', marginBottom: 20,
      }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
          fontSize: '13px', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: ORANGE, marginBottom: 14,
        }}>
          Recipients
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
          <button
            onClick={() => setMode('single')}
            style={{
              padding: '8px 20px', border: '1px solid var(--border)',
              borderRadius: '10px 0 0 10px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600,
              background: mode === 'single' ? ORANGE : 'transparent',
              color: mode === 'single' ? '#0a0a0f' : 'var(--muted)',
            }}
          >
            Single
          </button>
          <button
            onClick={() => setMode('batch')}
            style={{
              padding: '8px 20px', border: '1px solid var(--border)',
              borderLeft: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600,
              background: mode === 'batch' ? ORANGE : 'transparent',
              color: mode === 'batch' ? '#0a0a0f' : 'var(--muted)',
            }}
          >
            Batch
          </button>
        </div>

        {mode === 'single' ? (
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
              style={{
                padding: '10px 24px', background: sending ? 'var(--border)' : '#00e5ff',
                border: 'none', borderRadius: 'var(--radius-sm)',
                color: '#0a0a0f', fontSize: '0.85rem', fontWeight: 700,
                cursor: sending ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: sending || !template ? 0.6 : 1,
              }}
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
            {batchProgress && (
              <div style={{
                marginTop: 12, fontSize: '0.82rem', color: '#96a0b8',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Sending {batchProgress.current} of {batchProgress.total}...
                <div style={{
                  marginTop: 6, height: 4, borderRadius: 2,
                  background: 'var(--border)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: '#00e5ff',
                    width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <button
                onClick={handleBatchSend}
                disabled={sending || !template}
                style={{
                  padding: '10px 24px', background: sending ? 'var(--border)' : '#00e5ff',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  color: '#0a0a0f', fontSize: '0.85rem', fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: sending || !template ? 0.6 : 1,
                }}
              >
                {sending ? 'Sending...' : 'Send to All'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sent log */}
      {sentLog.length > 0 && (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '18px 22px',
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            fontSize: '13px', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: ORANGE, marginBottom: 14,
          }}>
            Sent Log
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sentLog.map((entry, i) => (
              <div
                key={`${entry.email}-${i}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif",
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
                <span style={{ color: 'var(--text)', flex: 1 }}>
                  {entry.email}
                </span>
                <span style={{ color: '#96a0b8', fontSize: '0.78rem' }}>
                  {entry.template === 'beta-update' ? 'beta update' : 'invitation'}
                </span>
                <span style={{ color: '#666', fontSize: '0.75rem', flexShrink: 0 }}>
                  {timeAgo(entry.timestamp)}
                </span>
                {entry.error && (
                  <span style={{ color: '#ff6b85', fontSize: '0.75rem' }} title={entry.error}>
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
