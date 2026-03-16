'use client'

import { useState, useRef } from 'react'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { createClient } from '@/lib/supabase/client'

interface SendMessageModalProps {
  recipientId: string
  recipientName: string
  recipientPhoto: string | null
  onClose: () => void
  onSent: () => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.csv']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getGradient(name: string): string {
  const gradients = [
    'linear-gradient(135deg,#00e5ff,#7b61ff)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#34d399,#7b61ff)',
    'linear-gradient(135deg,#a78bfa,#f472b6)',
    'linear-gradient(135deg,#f97316,#facc15)',
  ]
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return gradients[hash % gradients.length]
}

export default function SendMessageModal({ recipientId, recipientName, recipientPhoto, onClose, onSent }: SendMessageModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useFocusTrap(true)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    const valid: File[] = []
    for (const f of selected) {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXTENSIONS.includes(ext)) continue
      if (f.size > MAX_FILE_SIZE) continue
      valid.push(f)
    }
    setFiles(prev => [...prev, ...valid])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSend() {
    if (!body.trim() || sending) return
    setSending(true)
    setError(null)

    try {
      // Upload attachments
      const attachments: Array<{ fileName: string; fileType: string; fileSize: number; storagePath: string }> = []
      if (files.length > 0) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Not logged in'); setSending(false); return }

        for (const file of files) {
          const timestamp = Date.now()
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const path = `${user.id}/${timestamp}_${safeName}`
          const { error: uploadErr } = await supabase.storage
            .from('message-attachments')
            .upload(path, file)

          if (uploadErr) {
            console.error('Upload error:', uploadErr)
            continue
          }
          attachments.push({ fileName: file.name, fileType: file.type, fileSize: file.size, storagePath: path })
        }
      }

      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          body: body.trim(),
          subject: subject.trim() || undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })

      if (res.status === 403) {
        const errData = await res.json().catch(() => null)
        setError(errData?.error || 'You can message this interpreter after submitting a booking request')
        setSending(false)
        return
      }

      if (!res.ok) {
        setError('Failed to send message. Please try again.')
        setSending(false)
        return
      }

      onSent()
      onClose()
    } catch {
      setError('Failed to send message. Please try again.')
      setSending(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Message ${recipientName}`}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflow: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {recipientPhoto ? (
            <img
              src={recipientPhoto}
              alt=""
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: getGradient(recipientName),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: '#fff',
            }}>
              {getInitials(recipientName)}
            </div>
          )}
          <h2 style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.05rem',
            margin: 0, color: 'var(--text)', flex: 1,
          }}>
            Message {recipientName}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', padding: 4,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="text"
            placeholder="Subject (optional)"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />

          <textarea
            placeholder="Write your message..."
            value={body}
            onChange={e => setBody(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
              outline: 'none', resize: 'vertical', minHeight: 120,
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />

          {/* Attachments */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
              Attach files
            </button>

            {files.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {files.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: 20, padding: '4px 10px 4px 12px',
                      fontSize: '0.78rem', color: 'var(--text)',
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {f.name.length > 25 ? f.name.slice(0, 22) + '...' : f.name}
                    <button
                      onClick={() => removeFile(i)}
                      aria-label={`Remove ${f.name}`}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--muted)', padding: 0, lineHeight: 1,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{
              fontSize: '0.82rem', color: 'var(--accent3)',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '9px 20px',
              color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={!body.trim() || sending}
            style={{
              padding: '9px 22px', fontSize: '0.85rem',
              opacity: !body.trim() || sending ? 0.5 : 1,
              cursor: !body.trim() || sending ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
