'use client'

import { useState } from 'react'

const INVITE_TEXT = "Hey! I love working with you and would like to add you to my Preferred Team list on signpost! It's a directory and booking platform to connect freelance interpreters and requesters directly, with no agency in the middle. You create your profile, set your own rates and terms, and connect directly with clients. Click here to join so we can team together: https://signpost.community/interpreter/signup"

const SHORT_SMS_TEXT = "Hey! Join me on signpost, a platform to connect freelance interpreters and requesters directly. You set your own rates and terms, no agency in the middle. Join here: signpost.community/interpreter/signup"

export default function InviteClient() {
  const [copied, setCopied] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [active, setActive] = useState<string | null>(null)

  function handleSms() {
    window.location.href = `sms:?body=${encodeURIComponent(SHORT_SMS_TEXT)}`
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(INVITE_TEXT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select-all-friendly textarea
      const ta = document.createElement('textarea')
      ta.value = INVITE_TEXT
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function btnStyle(key: string): React.CSSProperties {
    const isHover = hover === key
    const isActive = active === key
    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 20px',
      background: isActive
        ? 'rgba(0,229,255,0.12)'
        : isHover
          ? 'rgba(0,229,255,0.08)'
          : 'transparent',
      border: '1px solid #00e5ff',
      borderRadius: '8px',
      color: '#00e5ff',
      fontFamily: "'Inter', sans-serif",
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'background 0.15s',
    }
  }

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: 'calc(100vh - 73px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div
        className="invite-container"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '48px 24px 80px',
        }}
      >
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '24px',
            color: '#f0f2f8',
            letterSpacing: '-0.01em',
            margin: '0 0 12px',
          }}
        >
          Invite an interpreter to signpost
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
            color: '#96a0b8',
            lineHeight: 1.6,
            margin: '0 0 28px',
          }}
        >
          Know an interpreter who'd be a great fit? Text them this invite or copy it to share however you like.
        </p>

        <div
          style={{
            background: '#111118',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#c8ccd4',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Hey! I love working with you and would like to add you to my Preferred Team list on signpost! It's a directory and booking platform to connect freelance interpreters and requesters directly, with no agency in the middle. You create your profile, set your own rates and terms, and connect directly with clients. Click here to join so we can team together:{' '}
            <a
              href="https://signpost.community/interpreter/signup"
              style={{ color: '#00e5ff', textDecoration: 'none' }}
            >
              https://signpost.community/interpreter/signup
            </a>
          </p>
        </div>

        <div
          className="invite-buttons"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={handleSms}
            onMouseEnter={() => setHover('sms')}
            onMouseLeave={() => { setHover(null); setActive(null) }}
            onMouseDown={() => setActive('sms')}
            onMouseUp={() => setActive(null)}
            style={btnStyle('sms')}
          >
            Send via text
          </button>

          <button
            type="button"
            onClick={handleCopy}
            onMouseEnter={() => setHover('copy')}
            onMouseLeave={() => { setHover(null); setActive(null) }}
            onMouseDown={() => setActive('copy')}
            onMouseUp={() => setActive(null)}
            style={btnStyle('copy')}
          >
            Copy invite text
          </button>
        </div>

        <div style={{ minHeight: '24px', marginTop: '14px' }}>
          {copied && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: '#34d399',
                margin: 0,
                fontWeight: 600,
              }}
            >
              {'\u2713'} Copied!
            </p>
          )}
        </div>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            color: '#96a0b8',
            margin: '24px 0 0',
            lineHeight: 1.5,
          }}
        >
          Text button works on mobile devices.
        </p>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .invite-container {
            padding: 24px 20px 60px !important;
          }
          .invite-buttons {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>
    </div>
  )
}
