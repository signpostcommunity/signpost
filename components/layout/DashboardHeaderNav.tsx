'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'en', label: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'es', label: 'Espa\u00f1ol', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr', label: 'Fran\u00e7ais', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de', label: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'pt', label: 'Portugu\u00eas', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'ja', label: '\u65E5\u672C\u8A9E', flag: '\u{1F1EF}\u{1F1F5}' },
];

export default function DashboardHeaderNav({ portalPath }: { portalPath: string }) {
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const langRef = useRef<HTMLDivElement>(null);

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
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
      <Link href="/directory" className="nav-btn" style={{ textDecoration: 'none' }}>
        Browse Interpreter Directory
      </Link>
      <Link href={portalPath} className="btn-primary" style={{ textDecoration: 'none' }}>
        My Portal
      </Link>

      {/* Language selector */}
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

      <style>{`
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
      `}</style>
    </div>
  );
}
