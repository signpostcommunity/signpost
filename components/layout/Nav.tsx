'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const langRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<Session | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isLoggedIn = !!session;

  // Check initial session and subscribe to auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => setSession(s)
    );
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 'var(--panel-offset, 0px)',
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
          {isLoggedIn ? (
            <>
              {/* ── Logged-in state ── */}
              <Link href="/directory" className="nav-btn" style={{ textDecoration: 'none' }}>
                Browse Interpreter Directory
              </Link>
              <Link href="/interpreter/dashboard" className="btn-primary-outline" style={{ textDecoration: 'none' }}>
                My Portal
              </Link>
            </>
          ) : (
            <>
              {/* ── Logged-out state ── */}
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
              <Link
                href="/interpreter/login"
                style={{
                  padding: '8px 18px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--muted)',
                  fontSize: '0.9rem',
                  fontFamily: "'DM Sans', sans-serif",
                  textDecoration: 'none',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                Log in
              </Link>
              <Link href="/request" className="btn-primary" style={{ textDecoration: 'none' }}>
                Request Interpreters
              </Link>
            </>
          )}

          {/* ── Language selector (always visible) ── */}
          <div ref={langRef} style={{ position: 'relative', marginLeft: '8px' }}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="lang-toggle"
              aria-label="Select language"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.7 }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span style={{ fontWeight: 600 }}>{selectedLang.toUpperCase()}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: 'transform 0.2s',
                  transform: langOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {langOpen && (
              <div className="lang-dropdown">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang.code);
                      setLangOpen(false);
                      // TODO: hook up i18n here when ready
                    }}
                    className="lang-option"
                    style={{
                      color: selectedLang === lang.code ? 'var(--accent)' : 'var(--text)',
                      fontWeight: selectedLang === lang.code ? 600 : 400,
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
              Browse Interpreter Directory
            </Link>

            {isLoggedIn ? (
              <Link
                href="/interpreter/dashboard"
                className="btn-primary-outline"
                onClick={() => setMobileOpen(false)}
                style={{ textAlign: 'center', marginTop: '8px', textDecoration: 'none' }}
              >
                My Portal
              </Link>
            ) : (
              <>
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
                  href="/interpreter/login"
                  className="mobile-nav-btn"
                  onClick={() => setMobileOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  Log in
                </Link>
                <Link
                  href="/request"
                  className="btn-primary"
                  onClick={() => setMobileOpen(false)}
                  style={{ textAlign: 'center', marginTop: '8px', textDecoration: 'none' }}
                >
                  Request Interpreters
                </Link>
              </>
            )}

            <Link
              href="/about"
              className="mobile-nav-btn"
              onClick={() => setMobileOpen(false)}
              style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '8px', textDecoration: 'none' }}
            >
              About signpost
            </Link>

            {/* Mobile language selector */}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '12px', paddingTop: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
                Language
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className="mobile-lang-option"
                    style={{
                      color: selectedLang === lang.code ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: selectedLang === lang.code ? 600 : 400,
                      background: selectedLang === lang.code ? 'var(--surface2)' : 'transparent',
                    }}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>
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
        .btn-primary-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 20px;
          border-radius: 999px;
          border: 1px solid var(--accent);
          background: transparent;
          color: var(--accent);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .btn-primary-outline:hover {
          background: var(--accent);
          color: var(--bg);
        }
        .lang-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: none;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .lang-toggle:hover {
          border-color: rgba(0, 229, 255, 0.4);
          color: var(--text);
        }
        .lang-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 8px;
          width: 192px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
          z-index: 300;
        }
        .lang-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 16px;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .lang-option:hover { background: var(--surface2); }
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
        .mobile-lang-option {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          border-radius: 8px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }
        .mobile-lang-option:hover { background: var(--surface2); }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
