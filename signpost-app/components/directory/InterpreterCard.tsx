import Link from 'next/link';
import type { Interpreter } from '@/lib/types';
import RatingStars from '@/components/ui/RatingStars';
import Chip from '@/components/ui/Chip';

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
        }}
      >
        {/* Card header / visual */}
        <div
          style={{
            height: 180,
            background: i.color,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <svg
            width="120"
            height="140"
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

          {/* Available badge */}
          {i.available && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(52,211,153,0.4)',
                borderRadius: '100px',
                padding: '4px 10px',
                fontSize: '0.7rem',
                color: '#34d399',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#34d399',
                  boxShadow: '0 0 6px #34d399',
                  display: 'inline-block',
                }}
              />
              Available
            </div>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '10px' }}>
            <div
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 700,
                fontSize: '1rem',
                marginBottom: '3px',
              }}
            >
              {i.name}
            </div>
            <div
              style={{
                color: 'var(--muted)',
                fontSize: '0.82rem',
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

          {/* Rating */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px',
            }}
          >
            <RatingStars rating={i.rating} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
              {i.rating.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              ({i.reviews})
            </span>
          </div>

          {/* Sign languages */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
            {i.signLangs.map((lang) => (
              <Chip key={lang} label={lang} variant="accent" size="sm" />
            ))}
          </div>

          {/* Specializations */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {i.specs.slice(0, 3).map((spec) => (
              <Chip key={spec} label={spec} size="sm" />
            ))}
          </div>

          {/* Certs */}
          <div
            style={{
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              alignItems: 'center',
            }}
          >
            {i.certs.map((cert) => (
              <span
                key={cert}
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--muted)',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                }}
              >
                {cert}
              </span>
            ))}
          </div>
        </div>

        <style>{`
          .interp-card:hover {
            border-color: rgba(0,229,255,0.3);
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    </Link>
  );
}
