'use client'

import { useState } from 'react'

type TargetListRole = 'interpreter_team' | 'dhh_pref_list' | 'requester_pref_list'

interface InviteFormProps {
  targetListRole: TargetListRole
  senderName?: string
  senderEmail?: string
  senderRole?: string
  accentColor?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
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

export default function InviteForm({
  targetListRole,
  senderName,
  senderEmail,
  senderRole,
  accentColor = '#00e5ff',
  onSuccess,
  onCancel,
}: InviteFormProps) {
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSend() {
    if (!recipientName.trim()) {
      setError('Name is required.')
      return
    }
    if (!recipientEmail.trim()) {
      setError('Email is required.')
      return
    }

    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim(),
          senderName: senderName || undefined,
          senderEmail: senderEmail || undefined,
          senderRole: senderRole || undefined,
          channel: 'email',
          targetListRole,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send invite.')
        return
      }

      setSuccess(true)
      onSuccess?.()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{'\u2713'}</div>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 600,
          fontSize: '0.95rem', color: accentColor, marginBottom: 8,
        }}>
          Invite sent to {recipientName}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0 0 16px', lineHeight: 1.5 }}>
          Once they create a profile and are approved, they will be automatically added to your list.
        </p>
        <button
          onClick={() => {
            setSuccess(false)
            setRecipientName('')
            setRecipientEmail('')
          }}
          style={{
            background: 'none', border: 'none', color: accentColor,
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            padding: 0, fontFamily: "'Inter', sans-serif",
            textDecoration: 'underline', textUnderlineOffset: '2px',
          }}
        >
          Send another invite
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabelStyle}>Their name</label>
        <input
          type="text"
          value={recipientName}
          onChange={e => setRecipientName(e.target.value)}
          placeholder="First and last name"
          style={fieldInputStyle}
          onFocus={e => { e.target.style.borderColor = accentColor }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={fieldLabelStyle}>Their email</label>
        <input
          type="email"
          value={recipientEmail}
          onChange={e => setRecipientEmail(e.target.value)}
          placeholder="colleague@example.com"
          onKeyDown={e => { if (e.key === 'Enter' && !sending) handleSend() }}
          style={fieldInputStyle}
          onFocus={e => { e.target.style.borderColor = accentColor }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      <p style={{
        color: 'var(--muted)', fontSize: '0.78rem', margin: '0 0 14px',
        lineHeight: 1.5,
      }}>
        They will receive an email inviting them to create a signpost profile. Once they sign up and are approved, they will be automatically added to your preferred list.
      </p>

      {error && (
        <p style={{ color: '#f87171', fontSize: '0.82rem', margin: '0 0 12px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 10, padding: '9px 20px',
              color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={sending}
          style={{
            background: accentColor, border: 'none',
            borderRadius: 10, padding: '9px 20px',
            color: '#0a0a0f', fontSize: '0.85rem', fontWeight: 600,
            cursor: sending ? 'wait' : 'pointer',
            fontFamily: "'Inter', sans-serif",
            opacity: sending ? 0.6 : 1,
          }}
        >
          {sending ? 'Sending...' : 'Send invite'}
        </button>
      </div>
    </div>
  )
}
