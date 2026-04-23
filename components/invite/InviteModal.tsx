'use client'

import { useEffect } from 'react'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import InviteForm from './InviteForm'
import { InviteHeaderIcon } from './InviteHeaderIcon'

type TargetListRole = 'interpreter_team' | 'dhh_pref_list' | 'requester_pref_list'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  targetListRole: TargetListRole
  senderName?: string
  senderEmail?: string
  senderRole?: string
  accentColor?: string
  onSuccess?: () => void
}

export default function InviteModal({
  isOpen,
  onClose,
  title,
  subtitle,
  targetListRole,
  senderName,
  senderEmail,
  senderRole,
  accentColor = '#00e5ff',
  onSuccess,
}: InviteModalProps) {
  const focusTrapRef = useFocusTrap(isOpen)

  useEffect(() => {
    if (!isOpen) return
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          width: '100%', maxWidth: 480,
          padding: '28px 32px',
        }}
      >
        <InviteHeaderIcon portal={accentColor === '#a78bfa' ? 'deaf' : 'interpreter'} />
        <h2 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px',
          margin: '0 0 8px', color: '#f0f2f8',
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6,
            margin: '0 0 20px',
          }}>
            {subtitle}
          </p>
        )}
        <InviteForm
          targetListRole={targetListRole}
          senderName={senderName}
          senderEmail={senderEmail}
          senderRole={senderRole}
          accentColor={accentColor}
          onSuccess={onSuccess}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}
