'use client'

import { useEffect, useRef } from 'react'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

interface ConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}: ConfirmModalProps) {
  const containerRef = useFocusTrap(isOpen)

  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={onCancel}
    >
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="modal-dialog"
        style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '28px 32px',
          width: '100%', maxWidth: 440,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h2
            id="confirm-modal-title"
            style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
              fontSize: '1.1rem', margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0,
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{
          color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6,
          margin: '0 0 24px',
        }}>
          {description}
        </p>

        <div className="modal-actions modal-dialog-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 20px',
              color: 'var(--text)', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: destructive ? 'var(--accent3)' : 'var(--accent)',
              border: 'none', borderRadius: 8, padding: '10px 20px',
              color: destructive ? '#fff' : '#000',
              fontSize: '0.88rem', fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
