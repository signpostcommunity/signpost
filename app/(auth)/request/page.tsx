'use client'

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

function BetaWelcomeBanner() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const val = localStorage.getItem('requester_beta_welcome_dismissed')
    if (val !== 'true') setDismissed(false)
  }, [])

  if (dismissed) return null

  const items: { n: number; body: React.ReactNode }[] = [
    { n: 1, body: 'Sample requests and interpreter profiles are included so you can explore without affecting real data.' },
    { n: 2, body: 'A feedback panel will appear on the right side of every page. Share your honest thoughts as you go.' },
    { n: 3, body: 'Look for orange "Try This!" prompts on several pages to discover key features.' },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="requester-welcome-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          localStorage.setItem('requester_beta_welcome_dismissed', 'true')
          setDismissed(true)
        }
      }}
    >
      <div style={{
        background: '#111118',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        maxWidth: 560,
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '36px 32px',
      }}>
        <h2
          id="requester-welcome-title"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '22px',
            color: '#f0f2f8',
            margin: '0 0 12px',
          }}
        >
          Welcome to signpost!
        </h2>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          fontSize: '15px',
          color: '#96a0b8',
          lineHeight: 1.6,
          margin: '0 0 22px',
        }}>
          You&apos;re one of the first to test our interpreter booking system. Everything here is fully functional.
        </p>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: '13px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#00e5ff',
          margin: '0 0 14px',
        }}>
          What to know
        </div>
        <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((it) => (
            <li key={it.n} style={{ display: 'flex', gap: 12, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '14px', color: '#c8ccd4', lineHeight: 1.55 }}>
              <span style={{ color: '#00e5ff', fontWeight: 700, minWidth: 18 }}>{it.n}.</span>
              <span>{it.body}</span>
            </li>
          ))}
        </ol>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: '#c8ccd4',
          lineHeight: 1.6,
          margin: '0 0 20px',
        }}>
          To get started, click <strong style={{ color: '#00e5ff', fontWeight: 700 }}>Create My First Request</strong> and follow the process.
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          color: '#96a0b8',
          margin: '0 0 28px',
        }}>
          Questions? <a href="mailto:hello@signpost.community" style={{ color: '#00e5ff', textDecoration: 'none' }}>hello@signpost.community</a>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => {
              localStorage.setItem('requester_beta_welcome_dismissed', 'true')
              setDismissed(true)
            }}
            style={{
              padding: '12px 36px',
              fontSize: '14.5px',
              fontWeight: 700,
              borderRadius: '10px',
              cursor: 'pointer',
              border: 'none',
              background: '#00e5ff',
              color: '#0a0a0f',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Let&apos;s Go
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RequestPortalPage() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 73px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--bg)',
      }}
    >
      {/* Beta Welcome Banner */}
      <BetaWelcomeBanner />

      <div
        className="req-landing-card"
        style={{
          maxWidth: 560,
          width: '100%',
          background: '#111118',
          border: '1px solid rgba(0, 229, 255, 0.15)',
          borderRadius: 16,
          padding: '0 36px 36px',
        }}
      >
        {/* Gradient accent bar */}
        <div
          style={{
            height: 3,
            background: 'linear-gradient(90deg, #00e5ff, #a78bfa)',
            margin: '0 -36px 40px',
            width: 'calc(100% + 72px)',
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 24,
            color: '#f0f2f8',
            textAlign: 'center',
            lineHeight: 1.4,
            margin: '0 0 20px',
          }}
        >
          How is signpost <span style={{ fontStyle: 'italic', color: '#00e5ff' }}>different</span> from an agency?
        </h1>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

        {/* Lead-in subheading */}
        <p
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: 18,
            color: '#f0f2f8',
            textAlign: 'center',
            lineHeight: 1.5,
            marginBottom: 20,
            marginTop: 0,
          }}
        >
          signpost connects you directly with sign language interpreters.
        </p>

        {/* Body paragraph */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: 15,
            color: '#96a0b8',
            lineHeight: 1.65,
            margin: '0 0 0',
          }}
        >
          Browse real interpreter profiles with credentials, specializations, and intro videos. Connect easily with the interpreters Deaf people prefer. Full transparency, no hidden fees.
        </p>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: 16,
            color: '#00e5ff',
            textAlign: 'center',
            marginTop: 16,
            marginBottom: 24,
          }}
        >
          signpost is <em>your</em> interpreter platform.
        </p>

        {/* Buttons */}
        <div className="req-landing-buttons" style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/request/signup"
            style={{
              flex: 1,
              display: 'block',
              background: '#00e5ff',
              color: '#000',
              padding: '14px 16px',
              borderRadius: 10,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Create my account
          </Link>
          <Link
            href="/request/login"
            style={{
              flex: 1,
              display: 'block',
              background: 'transparent',
              border: '1px solid rgba(0,229,255,0.3)',
              color: '#00e5ff',
              padding: '14px 16px',
              borderRadius: 10,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .req-landing-card {
            padding: 28px 24px 28px !important;
          }
          .req-landing-buttons {
            flex-wrap: wrap !important;
          }
          .req-landing-buttons a {
            flex-basis: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
