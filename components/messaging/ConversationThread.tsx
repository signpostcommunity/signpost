'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Attachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
}

interface Message {
  id: string
  senderId: string
  body: string
  createdAt: string
  editedAt: string | null
  isDeleted: boolean
  attachments: Attachment[]
}

interface ConversationData {
  conversation: {
    id: string
    subject: string | null
    lastMessageAt: string | null
  }
  otherParticipant: {
    userId: string
    name: string
    photoUrl: string | null
  } | null
  messages: Message[]
  currentUserId: string
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.csv']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

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

function Avatar({ name, photo, size = 32 }: { name: string; photo: string | null; size?: number }) {
  if (photo) {
    return <img src={photo} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: getGradient(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Syne', sans-serif", fontWeight: 700,
      fontSize: size <= 32 ? '0.7rem' : '0.85rem', color: '#fff',
    }}>
      {getInitials(name)}
    </div>
  )
}

export default function ConversationThread({ conversationId, backHref }: { conversationId: string; backHref: string }) {
  const router = useRouter()
  const [data, setData] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>(null)

  const fetchConversation = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`)
      if (!res.ok) { setLoading(false); return }
      const json = await res.json()

      // Get current user ID
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      setData({
        ...json,
        currentUserId: user?.id || '',
      })
    } catch (err) {
      console.error('[thread] fetch error:', err)
    }
    setLoading(false)
  }, [conversationId])

  const markAsRead = useCallback(async () => {
    await fetch(`/api/messages/conversations/${conversationId}/read`, { method: 'POST' })
    window.dispatchEvent(new Event('signpost:unread-changed'))
  }, [conversationId])

  useEffect(() => {
    fetchConversation().then(() => markAsRead())
    pollRef.current = setInterval(() => {
      fetchConversation()
    }, 30000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchConversation, markAsRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.messages?.length])

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 100) + 'px'
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    const valid = selected.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return ALLOWED_EXTENSIONS.includes(ext) && f.size <= MAX_FILE_SIZE
    })
    setFiles(prev => [...prev, ...valid])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSend() {
    if ((!input.trim() && files.length === 0) || sending || !data?.otherParticipant) return
    setSending(true)

    try {
      // Upload attachments
      const attachments: Array<{ fileName: string; fileType: string; fileSize: number; storagePath: string }> = []
      if (files.length > 0) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          for (const file of files) {
            const timestamp = Date.now()
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
            const path = `${user.id}/${timestamp}_${safeName}`
            const { error } = await supabase.storage
              .from('message-attachments')
              .upload(path, file)
            if (!error) {
              attachments.push({
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                storagePath: path,
              })
            }
          }
        }
      }

      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: data.otherParticipant.userId,
          body: input.trim() || '(attachment)',
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })

      if (res.ok) {
        // Optimistic update
        const now = new Date().toISOString()
        setData(prev => prev ? {
          ...prev,
          messages: [...prev.messages, {
            id: 'temp-' + Date.now(),
            senderId: prev.currentUserId,
            body: input.trim() || '(attachment)',
            createdAt: now,
            editedAt: null,
            isDeleted: false,
            attachments: [],
          }],
        } : prev)
        setInput('')
        setFiles([])
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    } catch (err) {
      console.error('Send error:', err)
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '48px 56px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
        Loading conversation...
      </div>
    )
  }

  if (!data || !data.otherParticipant) {
    return (
      <div style={{ padding: '48px 56px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
        Conversation not found.
        <br />
        <button onClick={() => router.push(backHref)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>Back to inbox</button>
      </div>
    )
  }

  const other = data.otherParticipant

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', width: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        background: 'var(--surface)',
      }}>
        <button
          onClick={() => router.push(backHref)}
          aria-label="Back to inbox"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', padding: 4, display: 'flex', alignItems: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar name={other.name} photo={other.photoUrl} size={36} />
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.95rem' }}>
            {other.name}
          </span>
          {data.conversation.subject && (
            <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 2 }}>{data.conversation.subject}</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', padding: '40px 0' }}>
            No messages yet. Start the conversation below.
          </div>
        )}
        {data.messages.map(msg => {
          const isMine = msg.senderId === data.currentUserId
          return (
            <div key={msg.id} style={{
              display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row',
              alignItems: 'flex-end', gap: 8,
            }}>
              {!isMine && <Avatar name={other.name} photo={other.photoUrl} size={28} />}
              <div style={{ maxWidth: '70%' }}>
                <div style={{
                  background: isMine ? '#00e5ff' : '#16161f',
                  color: isMine ? '#0a0a0f' : 'var(--text)',
                  borderRadius: 14, padding: '10px 14px',
                  fontSize: '0.86rem', lineHeight: 1.55,
                  fontFamily: "'DM Sans', sans-serif",
                  wordBreak: 'break-word',
                  opacity: msg.isDeleted ? 0.5 : 1,
                  fontStyle: msg.isDeleted ? 'italic' : 'normal',
                }}>
                  {msg.body}
                </div>
                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                    {msg.attachments.map((att) => {
                      const isImage = IMAGE_TYPES.includes(att.fileType)
                      return (
                        <div
                          key={att.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'var(--surface2)', border: '1px solid var(--border)',
                            borderRadius: 8, padding: '8px 12px',
                            color: 'var(--accent)', fontSize: '0.82rem',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {isImage ? (
                              <>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </>
                            ) : (
                              <>
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </>
                            )}
                          </svg>
                          <span style={{ flex: 1 }}>{att.fileName}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div style={{
                  fontSize: '0.68rem', color: 'var(--muted)', marginTop: 4,
                  textAlign: isMine ? 'right' : 'left',
                }}>
                  {timeAgo(msg.createdAt)}
                  {msg.editedAt && ' (edited)'}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose bar */}
      <div style={{
        padding: '12px 24px', borderTop: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        {files.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {files.map((f, i) => (
              <span key={i} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '3px 10px', fontSize: '0.75rem',
                color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {f.name.length > 20 ? f.name.slice(0, 18) + '...' : f.name}
                <button
                  onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, lineHeight: 1 }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
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
            aria-label="Attach file"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', padding: 6, flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            placeholder="Write a message..."
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              flex: 1, boxSizing: 'border-box',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem',
              outline: 'none', resize: 'none', maxHeight: 100, lineHeight: 1.4,
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && files.length === 0) || sending}
            aria-label="Send message"
            style={{
              background: 'var(--accent)', border: 'none', cursor: 'pointer',
              borderRadius: '50%', width: 36, height: 36, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (!input.trim() && files.length === 0) || sending ? 0.4 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
