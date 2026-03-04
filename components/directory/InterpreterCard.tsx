import Link from 'next/link';
import type { Interpreter } from '@/lib/types';

export default function InterpreterCard({ interpreter: i }: { interpreter: Interpreter }) {
  return (
    <Link
      href={`/directory/${i.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        className="interp-card"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'border-color 0.2s, transform 0.15s',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Card header / visual */}
        <div
          style={{
            height: 170,
            background: i.color,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <svg
            width="110"
            height="130"
            viewBox="0 0 120 140"
            fill="none"
            style={{ opacity: 0.35, flexShrink: 0 }}
          >
            <ellipse cx="60" cy="44" rx="24" ry="26" fill="white" />
            <path d="M10 140 C10 100 30 84 60 84 C90 84 110 100 110 140 Z" fill="white" />
          </svg>

          {/* Intro video button */}
          <button
            onClick={(e) => e.preventDefault()}
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '20px',
              padding: '5px 12px',
              color: '#fff',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backdropFilter: 'blur(4px)',
            }}
          >
            ▶ Intro
          </button>
        </div>

        {/* Card body */}
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Name + Add to my list */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  lineHeight: 1.2,
                  marginBottom: '3px',
                }}
              >
                {i.name}
              </div>
              <div
                style={{
                  color: 'var(--muted)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M5 1C3.34 1 2 2.34 2 4C2 6.5 5 9 5 9C5 9 8 6.5 8 4C8 2.34 6.66 1 5 1ZM5 5.5C4.17 5.5 3.5 4.83 3.5 4C3.5 3.17 4.17 2.5 5 2.5C5.83 2.5 6.5 3.17 6.5 4C6.5 4.83 5.83 5.5 5 5.5Z"
                    fill="var(--muted)"
                  />
                </svg>
                {i.location}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: hook up to saved list / Supabase
              }}
              className="add-to-list-btn"
            >
              + Add to my list
            </button>
          </div>

          {/* Sign languages */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
            {i.signLangs.map((lang) => (
              <span
                key={lang}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '100px',
                  padding: '3px 9px',
                  fontSize: '0.7rem',
                  border: '1px solid rgba(0,229,255,0.35)',
                  background: 'rgba(0,229,255,0.08)',
                  color: 'var(--accent)',
                }}
              >
                {lang}
              </span>
            ))}
            {i.spokenLangs.map((lang) => (
              <span
                key={lang}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '100px',
                  padding: '3px 9px',
                  fontSize: '0.7rem',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--muted)',
                }}
              >
                {lang}
              </span>
            ))}
          </div>

          {/* Specializations */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {i.specs.map((spec) => (
              <span
                key={spec}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '100px',
                  padding: '3px 9px',
                  fontSize: '0.7rem',
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                }}
              >
                {spec}
              </span>
            ))}
          </div>

          {/* Regions + Certs — pushed to bottom */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {i.regions.map((region) => (
                <span
                  key={region}
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--muted)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                  }}
                >
                  {region}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end' }}>
              {i.certs.map((cert) => (
                <span
                  key={cert}
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--accent)',
                    background: 'rgba(0,229,255,0.08)',
                    border: '1px solid rgba(0,229,255,0.25)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontWeight: 600,
                  }}
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          .interp-card:hover {
            border-color: rgba(0,229,255,0.3);
            transform: translateY(-2px);
          }
          .add-to-list-btn {
            flex-shrink: 0;
            background: none;
            border: 1px solid rgba(0,229,255,0.4);
            border-radius: 100px;
            padding: 4px 10px;
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--accent);
            cursor: pointer;
            transition: all 0.15s;
            white-space: nowrap;
            font-family: 'DM Sans', sans-serif;
          }
          .add-to-list-btn:hover {
            background: rgba(0,229,255,0.1);
            border-color: var(--accent);
          }
        `}</style>
      </div>
    </Link>
  );
}
