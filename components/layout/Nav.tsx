'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 40px',
          background: 'rgba(7,9,16,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="wordmark nav-logo">
            sign<span>post</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div
          className="nav-links"
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <Link href="/directory" className="nav-btn" style={{ textDecoration: 'none' }}>
            Browse Directory
          </Link>
          <Link href="/interpreter" className="nav-btn" style={{ textDecoration: 'none' }}>
            Interpreter Portal
          </Link>
          <Link
            href="/dhh"
            className="nav-btn"
            style={{ color: 'var(--accent2)', textDecoration: 'none' }}
          >
            D/HH Portal
          </Link>
          <Link href="/request" className="btn-primary" style={{ textDecoration: 'none' }}>
            Request Interpreters
          </Link>
        </div>

        {/* Hamburger */}
        <button
          className="hamburger"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          style={{
            display: 'none',
            flexDirection: 'column',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <span style={{ width: 22, height: 2, background: 'var(--text)', display: 'block' }} />
          <span style={{ width: 22, height: 2, background: 'var(--text)', display: 'block' }} />
          <span style={{ width: 22, height: 2, background: 'var(--text)', display: 'block' }} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.7)',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 280,
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                alignSelf: 'flex-end',
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '1.2rem',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              ✕
            </button>
            <Link
              href="/directory"
              className="mobile-nav-btn"
              onClick={() => setMobileOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              Browse Directory
            </Link>
            <Link
              href="/interpreter"
              className="mobile-nav-btn"
              onClick={() => setMobileOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              Interpreter Portal
            </Link>
            <Link
              href="/dhh"
              className="mobile-nav-btn"
              onClick={() => setMobileOpen(false)}
              style={{ color: 'var(--accent2)', textDecoration: 'none' }}
            >
              D/HH Portal
            </Link>
            <Link
              href="/request"
              className="btn-primary"
              onClick={() => setMobileOpen(false)}
              style={{ textAlign: 'center', marginTop: '8px', textDecoration: 'none' }}
            >
              Request Interpreters
            </Link>
            <Link
              href="/about"
              className="mobile-nav-btn"
              onClick={() => setMobileOpen(false)}
              style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '8px', textDecoration: 'none' }}
            >
              About signpost
            </Link>
          </div>
        </div>
      )}

      <style>{`
        .nav-logo { font-size: 1.4rem; }
        .nav-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-btn:hover { color: var(--text); background: var(--surface2); }
        .mobile-nav-btn {
          display: block;
          padding: 12px 16px;
          border-radius: 8px;
          background: none;
          border: 1px solid var(--border);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .mobile-nav-btn:hover { background: var(--surface2); }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
