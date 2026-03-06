'use client'

import Link from 'next/link'

export default function ComingSoonOverlay({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 73px)' }}>
      <div style={{ filter: 'blur(4px) brightness(0.3)', pointerEvents: 'none' }}>
        {children}
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '48px 40px',
          maxWidth: 460, width: '100%', textAlign: 'center',
        }}>
          <div className="wordmark" style={{ fontSize: '1.4rem', marginBottom: 24 }}>
            sign<span>post</span>
          </div>
          <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 28 }}>
            {message}
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--muted)', textDecoration: 'none', fontSize: '0.88rem',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '9px 20px', transition: 'all 0.15s',
            }}
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
