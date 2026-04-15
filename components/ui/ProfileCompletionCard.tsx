'use client'

import { useState, useEffect, useRef } from 'react'

export interface ProfileCompletionCardProps {
  items: Array<{
    label: string
    completed: boolean
    linkText?: string
    linkHref?: string
    onLinkClick?: () => void
  }>
  storageKey?: string
}

export default function ProfileCompletionCard({
  items,
  storageKey = 'profile-completion-expanded',
}: ProfileCompletionCardProps) {
  const done = items.filter(i => i.completed).length
  const total = items.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  // Read persisted state on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey)
      if (stored === 'true') setExpanded(true)
    } catch {
      // sessionStorage unavailable
    }
    setMounted(true)
  }, [storageKey])

  // Persist expand/collapse
  useEffect(() => {
    if (!mounted) return
    try {
      sessionStorage.setItem(storageKey, expanded ? 'true' : 'false')
    } catch {
      // sessionStorage unavailable
    }
  }, [expanded, mounted, storageKey])

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [items, expanded])

  // Don't render at 100%
  if (done === total) return null

  // Don't render until mounted (avoids hydration mismatch with sessionStorage)
  if (!mounted) return null

  return (
    <div
      style={{
        background: '#111118',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: 24,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {/* Collapsed row: progress bar + percentage + chevron */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          width: '100%',
          padding: '14px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {/* Progress bar */}
        <div style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            background: '#00e5ff',
            boxShadow: '0 0 8px rgba(0,229,255,0.3)',
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Percentage */}
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 13,
          color: '#f0f2f8',
          whiteSpace: 'nowrap',
        }}>
          {pct}% complete
        </span>

        {/* Chevron */}
        <svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          style={{
            flexShrink: 0,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          }}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="#00e5ff"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Expandable checklist */}
      <div
        style={{
          maxHeight: expanded ? contentHeight : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div ref={contentRef} style={{ padding: '0 20px 16px' }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: 12,
            color: '#96a0b8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}>
            Complete your profile
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
              }}>
                {/* Checkbox */}
                <span style={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  borderRadius: 3,
                  border: `1.5px solid ${item.completed ? '#22c55e' : '#5a6070'}`,
                  background: item.completed ? '#22c55e' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: '#0a0a0f',
                  fontWeight: 700,
                }}>
                  {item.completed ? '\u2713' : ''}
                </span>

                {/* Label */}
                <span style={{
                  color: item.completed ? '#96a0b8' : '#f0f2f8',
                  flex: 1,
                }}>
                  {item.label}
                </span>

                {/* Link arrow */}
                {!item.completed && (item.onLinkClick || item.linkHref) && (
                  item.onLinkClick ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        item.onLinkClick!()
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#00e5ff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                        <path d="M2 6H10M7 3L10 6L7 9" stroke="#00e5ff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item.linkText}
                    </button>
                  ) : (
                    <a
                      href={item.linkHref}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        fontSize: 13,
                        color: '#00e5ff',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                        <path d="M2 6H10M7 3L10 6L7 9" stroke="#00e5ff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item.linkText}
                    </a>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
