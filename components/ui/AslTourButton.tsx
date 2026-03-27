'use client'

import { useState, useEffect, useRef } from 'react'

export default function AslTourButton() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="ASL site guide"
        aria-expanded={isOpen}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          height: 48,
          borderRadius: 24,
          background: '#0a0a0f',
          border: '1.5px solid #7b61ff',
          padding: '0 20px 0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          zIndex: 50,
          transition: 'transform 0.15s ease, border-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
          e.currentTarget.style.borderColor = '#a78bfa'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.borderColor = '#7b61ff'
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#7b61ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <polygon points="8,5 15,10 8,15" fill="white" />
          </svg>
        </span>
        <span
          style={{
            color: '#a78bfa',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          ASL guide
        </span>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="ASL site guide"
          style={{
            position: 'fixed',
            bottom: 84,
            right: 24,
            width: 340,
            background: '#16161f',
            border: '1px solid #2a2a3a',
            borderRadius: 12,
            padding: 24,
            zIndex: 51,
          }}
        >
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close ASL site guide panel"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'none',
              border: 'none',
              color: '#96a0b8',
              cursor: 'pointer',
              padding: 4,
              fontSize: 18,
              lineHeight: 1,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f0f2f8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#96a0b8'
            }}
          >
            &#x2715;
          </button>

          <h3
            style={{
              color: '#a78bfa',
              fontSize: 15,
              fontWeight: 500,
              margin: '0 0 12px 0',
            }}
          >
            ASL site guide
          </h3>

          <p
            style={{
              fontSize: 13,
              color: '#c4c4d4',
              lineHeight: 1.7,
              margin: '0 0 10px 0',
            }}
          >
            signpost is building an ASL video tour of every page, presented by
            a Deaf native signer from our team.
          </p>

          <p
            style={{
              fontSize: 13,
              color: '#c4c4d4',
              lineHeight: 1.7,
              margin: '0 0 16px 0',
            }}
          >
            Each page will have a short ASL video explaining its features, so
            you can learn about signpost in your language.
          </p>

          <span
            style={{
              display: 'inline-block',
              background: 'rgba(123,97,255,0.12)',
              border: '1px solid rgba(123,97,255,0.25)',
              color: '#a78bfa',
              fontSize: 12,
              fontWeight: 500,
              padding: '3px 10px',
              borderRadius: 100,
              marginBottom: 16,
            }}
          >
            Coming soon
          </span>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: 12,
              color: '#96a0b8',
              lineHeight: 1.8,
            }}
          >
            {[
              'Page-by-page ASL walkthrough',
              'Presented by a Deaf native signer',
              'English captions on all videos',
              'Available on every page via this button',
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#7b61ff',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
