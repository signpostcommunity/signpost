'use client'

import { useState, useEffect } from 'react'

interface BetaTryThisProps {
  children: React.ReactNode
  storageKey?: string
}

export default function BetaTryThis({ children, storageKey }: BetaTryThisProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const val = localStorage.getItem(storageKey)
      if (val === 'true') setDismissed(true)
    }
  }, [storageKey])

  if (dismissed) return null

  return (
    <div style={{
      background: 'rgba(249, 115, 22, 0.06)',
      borderLeft: '3px solid #f97316',
      borderRadius: '0 8px 8px 0',
      padding: '14px 18px',
      marginBottom: 20,
      position: 'relative',
    }}>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: '11px',
        textTransform: 'uppercase',
        color: '#f97316',
        letterSpacing: '0.1em',
        marginBottom: 6,
      }}>
        TRY THIS
      </div>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 400,
        fontSize: '13px',
        color: '#c8cdd8',
        lineHeight: 1.6,
      }}>
        {children}
      </div>
      {storageKey && (
        <button
          onClick={() => {
            setDismissed(true)
            localStorage.setItem(storageKey, 'true')
          }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'none',
            border: 'none',
            color: '#f97316',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px 4px',
            opacity: 0.7,
          }}
          aria-label="Dismiss"
        >
          x
        </button>
      )}
    </div>
  )
}
