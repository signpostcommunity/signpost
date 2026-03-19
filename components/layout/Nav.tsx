'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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

interface NavProps {
  initialSession?: Session | null;
}

export default function Nav({ initialSession = null }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const langRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [role, setRole] = useState<string>('interpreter');
  const pathname = usePathname();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isLoggedIn = !!session;

  function portalPath(r: string) {
    if (r === 'deaf') return '/dhh/dashboard';
    if (r === 'requester' || r === 'org') return '/request/dashboard';
    if (r === 'admin') return '/admin/dashboard';
    return '/interpreter/dashboard';
  }

  // Persist last active portal role when user is on a dashboard route
  useEffect(() => {
    if (pathname.startsWith('/dhh')) {
      try { localStorage.setItem('signpost:lastRole', 'deaf') } catch {}
    } else if (pathname.startsWith('/request')) {
      try { localStorage.setItem('signpost:lastRole', 'requester') } catch {}
    } else if (pathname.startsWith('/interpreter')) {
      try { localStorage.setItem('signpost:lastRole', 'interpreter') } catch {}
    } else if (pathname.startsWith('/admin')) {
      try { localStorage.setItem('signpost:lastRole', 'admin') } catch {}
    }
  }, [pathname]);

  // Determine portal link: URL context → localStorage last role → DB role
  function getPortalHref() {
    if (pathname.startsWith('/dhh')) return '/dhh/dashboard';
    if (pathname.startsWith('/request')) return '/request/dashboard';
    if (pathname.startsWith('/interpreter')) return '/interpreter/dashboard';
    if (pathname.startsWith('/admin')) return '/admin/dashboard';
    // Off-dashboard: check last active role
    try {
      const lastRole = localStorage.getItem('signpost:lastRole');
      if (lastRole) return portalPath(lastRole);
    } catch {}
    return portalPath(role);
  }

  // Fetch role from user_profiles table (reliable source of truth)
  function fetchRole(userId: string) {
    supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data?.role) setRole(data.role);
      });
  }

  // Check initial session and subscribe to auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchRole(s.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s?.user) fetchRole(s.user.id);
      }
    );
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
        aria-label="Main navigation"
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
              <Link href={getPortalHref()} className="btn-primary" style={{ textDecoration: 'none' }}>
                My Portal
              </Link>
            </>
          ) : (
            <>
              {/* ── Logged-out state ── */}
              <Link href="/directory" className="nav-btn" style={{ textDecoration: 'none' }}>
                Browse Interpreter Directory
              </Link>
              <Link href="/interpreter" className="nav-btn" style={{ textDecoration: 'none' }}>
                Interpreter Portal
              </Link>
              <Link
                href="/dhh"
                className="nav-btn"
                style={{ color: 'var(--accent2)', textDecoration: 'none' }}
              >
                D/DB/HH Portal
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
              aria-expanded={langOpen}
            >
              <svg
                aria-hidden="true"
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
                aria-hidden="true"
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
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          style={{
            display: 'none',
            flexDirection: 'column',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            minWidth: 44,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span aria-hidden="true" style={{ width: 22, height: 2, background: 'var(--accent)', display: 'block', borderRadius: 1 }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: 'var(--accent)', display: 'block', borderRadius: 1 }} />
          <span aria-hidden="true" style={{ width: 22, height: 2, background: 'var(--accent)', display: 'block', borderRadius: 1 }} />
        </button>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 200,
            background: 'rgba(7,9,16,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '20px',
          }}
        >
          {/* Top bar: wordmark left, close right */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
            }}
          >
            <Link href="/" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
              <div className="wordmark" style={{ fontSize: '1.2rem' }}>
                sign<span>post</span>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '8px',
                minWidth: 44,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span aria-hidden="true">&#10005;</span>
            </button>
          </div>

          <Link
            href="/directory"
            className="mobile-nav-btn"
            onClick={() => setMobileOpen(false)}
            style={{ textDecoration: 'none' }}
          >
            Browse Interpreter Directory
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href={getPortalHref()}
                className="mobile-nav-btn mobile-nav-btn-primary"
                onClick={() => setMobileOpen(false)}
                style={{ textDecoration: 'none' }}
              >
                My Portal
              </Link>
              <button
                onClick={async () => {
                  setMobileOpen(false);
                  await supabase.auth.signOut();
                  window.location.href = '/';
                }}
                className="mobile-nav-btn"
                style={{ color: 'var(--accent3)', cursor: 'pointer' }}
              >
                Log out
              </button>
            </>
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
                style={{ color: 'var(--accent2)', borderColor: 'rgba(157,135,255,0.3)', textDecoration: 'none' }}
              >
                D/DB/HH Portal
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
                className="mobile-nav-btn mobile-nav-btn-primary"
                onClick={() => setMobileOpen(false)}
                style={{ textDecoration: 'none' }}
              >
                Request Interpreters
              </Link>
            </>
          )}

          <Link
            href="/about"
            onClick={() => setMobileOpen(false)}
            style={{
              width: '100%',
              maxWidth: 320,
              fontSize: '0.9rem',
              color: 'var(--text)',
              opacity: 0.6,
              textDecoration: 'none',
              textAlign: 'center',
              marginTop: '8px',
              fontFamily: "'DM Sans', sans-serif",
              display: 'block',
            }}
          >
            About signpost
          </Link>
        </div>
      )}

      <style>{`
        .nav-logo { font-size: 1.4rem; flex-shrink: 0; margin-right: 16px; }
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
          width: 100%;
          max-width: 320px;
          padding: 16px 20px;
          border-radius: var(--radius);
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          min-height: 44px;
          box-sizing: border-box;
        }
        .mobile-nav-btn:hover { border-color: rgba(0,229,255,0.4); color: var(--accent); }
        .mobile-nav-btn-primary {
          background: var(--accent) !important;
          border-color: var(--accent) !important;
          color: #000 !important;
          font-weight: 700 !important;
          text-align: center !important;
        }
        .mobile-nav-btn-primary:hover { background: #00cceb !important; }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
