'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'

interface CollapsibleSectionProps {
  storageKey: string
  defaultCollapsed?: boolean
  accentColor: string
  children: ReactNode
  header: ReactNode
}

function ChevronIcon({ expanded, color }: { expanded: boolean; color: string }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <path d="M6 4l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function CollapsibleSection({
  storageKey,
  defaultCollapsed = false,
  accentColor,
  header,
  children,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) return stored === 'true'
    }
    return defaultCollapsed
  })

  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  })

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(next))
    }
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          width: '100%', textAlign: 'left',
          marginBottom: collapsed ? 0 : 12,
          paddingBottom: 8,
          borderBottom: `1px solid ${accentColor}22`,
          transition: 'margin-bottom 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        <ChevronIcon expanded={!collapsed} color={accentColor} />
        {header}
      </button>

      <div
        ref={contentRef}
        style={{
          overflow: 'hidden',
          maxHeight: collapsed ? 0 : contentHeight !== undefined ? contentHeight : 'none',
          transition: contentHeight !== undefined ? 'max-height 0.2s ease' : 'none',
          opacity: collapsed ? 0 : 1,
        }}
      >
        {children}
      </div>
    </div>
  )
}
