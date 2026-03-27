'use client'

import { useState } from 'react'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

interface RequestVideoModalProps {
  isOpen: boolean
  onClose: () => void
  interpreterName: string
  interpreterId: string
  userId: string
  onSuccess: () => void
  onDuplicate: () => void
}

export default function RequestVideoModal({
  isOpen,
  onClose,
  interpreterName,
  interpreterId,
  userId,
  onSuccess,
  onDuplicate,
}: RequestVideoModalProps) {
  const [shareName, setShareName] = useState(true)
  const [loading, setLoading] = useState(false)
  const containerRef = useFocusTrap(isOpen)

  if (!isOpen) return null

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch('/api/video-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interpreter_id: interpreterId,
          anonymous: !shareName,
        }),
      })

      if (res.status === 409) {
        onDuplicate()
        return
      }

      if (!res.ok) {
        console.error('[RequestVideoModal] request failed:', res.status)
        return
      }

      onSuccess()
    } catch (err) {
      console.error('[RequestVideoModal] error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-video-title"
        style={{
          background: '#111118', border: '1px solid #1e2433',
          borderRadius: 16, padding: 24,
          maxWidth: 420, width: '100%',
        }}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      >
        <h2
          id="request-video-title"
          style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 600,
            fontSize: '17px', color: '#f0f2f8',
            margin: '0 0 12px',
          }}
        >
          Request an intro video
        </h2>

        <p style={{
          fontFamily: "'Inter', 'DM Sans', sans-serif", fontWeight: 400,
          fontSize: '14px', color: '#96a0b8',
          margin: '0 0 20px', lineHeight: 1.5,
        }}>
          Let {interpreterName} know you&apos;d love to see their intro video.
        </p>

        {/* Checkbox */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          cursor: 'pointer', marginBottom: 20,
        }}>
          <input
            type="checkbox"
            checked={shareName}
            onChange={(e) => setShareName(e.target.checked)}
            style={{
              marginTop: 2, accentColor: '#00e5ff',
              width: 16, height: 16, cursor: 'pointer',
            }}
          />
          <div>
            <div style={{
              fontSize: '14px', color: '#f0f2f8', lineHeight: 1.4,
            }}>
              Share my name with this interpreter
            </div>
            <div style={{
              fontSize: '12.5px', color: '#96a0b8', marginTop: 4, lineHeight: 1.4,
            }}>
              {shareName
                ? 'Your name will be included in the request notification.'
                : 'Your request will be counted anonymously.'}
            </div>
          </div>
        </label>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none', border: 'none',
              color: '#96a0b8', fontSize: '13.5px',
              cursor: 'pointer', padding: '8px 16px',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: 'none',
              border: '1px solid rgba(0,229,255,0.5)',
              color: '#00e5ff', fontSize: '13.5px',
              borderRadius: 10, padding: '8px 16px',
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Sending...' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  )
}
