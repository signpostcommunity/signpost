import Link from 'next/link';
import type { Interpreter } from '@/lib/types';

interface Props {
  interpreter: Interpreter;
  onVideoPreview?: (interpreter: Interpreter) => void;
  onAddToList?: (interpreter: Interpreter) => void;
  userRole?: string | null;
  contextParam?: string | null;
  isOnList?: boolean;
}

const CERT_ABBREVIATIONS: Record<string, string> = {
  'NIC': 'NIC',
  'CI': 'CI',
  'CT': 'CT',
  'CDI': 'CDI',
  'SC:L': 'SC:L',
  'EFSLI': 'EFSLI',
  'NIC-Master': 'NIC-Master',
  'NIC-Advanced': 'NIC-Advanced',
  'NAD': 'NAD',
  'RID': 'RID',
  'BEI': 'BEI',
  'CASLI': 'CASLI',
};

function abbreviateCert(cert: string): string {
  if (cert.length <= 25) return cert;
  for (const [abbr] of Object.entries(CERT_ABBREVIATIONS)) {
    if (cert.includes(abbr)) return abbr;
  }
  return cert;
}

export default function InterpreterCard({ interpreter: i, onVideoPreview, onAddToList, userRole, contextParam, isOnList }: Props) {
  const profileHref = `/directory/${i.id}${contextParam ? `?context=${contextParam}` : ''}`;
  return (
    <Link
      href={profileHref}
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
            aspectRatio: '1 / 1',
            background: i.color,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          {i.photoUrl ? (
            <img
              src={i.photoUrl}
              alt={i.name}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 20%',
              }}
            />
          ) : (
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
          )}

          {/* Intro video button - only show when interpreter has a video */}
          {i.videoUrl && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onVideoPreview?.(i);
              }}
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
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Name */}
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '1rem',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {i.name}
          </div>
          {/* Add to list - own row */}
          <div style={{ marginTop: '6px' }}>
            {isOnList ? (
              <span
                className="on-list-label"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {userRole === 'interpreter' ? 'On your team' : userRole === 'deaf' ? 'On your list' : 'On your roster'}
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToList?.(i);
                }}
                className="add-to-list-btn"
              >
                {userRole === 'interpreter' ? '+ Add to my team' : userRole === 'deaf' ? '+ Add to my list' : '+ Add to my roster'}
              </button>
            )}
          </div>
          {/* Location - full width below name */}
          <div
            style={{
              color: 'var(--muted)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '3px',
              marginBottom: '4px',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
              <path
                d="M5 1C3.34 1 2 2.34 2 4C2 6.5 5 9 5 9C5 9 8 6.5 8 4C8 2.34 6.66 1 5 1ZM5 5.5C4.17 5.5 3.5 4.83 3.5 4C3.5 3.17 4.17 2.5 5 2.5C5.83 2.5 6.5 3.17 6.5 4C6.5 4.83 5.83 5.5 5 5.5Z"
                fill="var(--muted)"
              />
            </svg>
            {i.location}
            {i.distance != null && (
              <span style={{ color: 'var(--accent)', fontSize: '0.72rem', marginLeft: '4px' }}>
                ~{i.distance} mi
              </span>
            )}
          </div>

          {/* Sign languages + Spoken languages */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px', marginBottom: '12px' }}>
            {i.signLangs.map((lang) => (
              <span
                key={lang}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  border: '1px solid rgba(123,97,255,0.25)',
                  background: 'rgba(123,97,255,0.1)',
                  color: '#a891ff',
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
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  border: '1px solid rgba(255,77,109,0.2)',
                  background: 'rgba(255,77,109,0.08)',
                  color: '#ff8099',
                }}
              >
                {lang}
              </span>
            ))}
          </div>

          {/* Specializations removed from card - visible on profile page */}

          {/* Certs - pushed to bottom */}
          {i.certs.length > 0 && (
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '10px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                borderTop: '1px solid var(--border)',
              }}
            >
              {i.certs.map((cert) => {
                const isVerified = i.certDetails?.some(d => d.name === cert && d.verificationLink);
                const displayCert = abbreviateCert(cert);
                return (
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
                  {displayCert}{isVerified && <span style={{ color: '#34d399', marginLeft: 3 }}>✓</span>}
                </span>
                );
              })}
            </div>
          )}

          {/* Mentorship badge - interpreter-only */}
          {userRole === 'interpreter' && i.mentorshipOffering && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              marginTop: 8, paddingTop: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#96a0b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              <span style={{ fontSize: '0.68rem', color: '#96a0b8' }}>Offering mentorship</span>
            </div>
          )}
        </div>

        <style>{`
          .interp-card:hover {
            border-color: rgba(0,229,255,0.3);
            transform: translateY(-4px);
            box-shadow: 0 20px 48px rgba(0,0,0,0.4);
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
          .on-list-label {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            border: 1px solid rgba(200,207,224,0.25);
            border-radius: 100px;
            padding: 4px 10px;
            font-size: 0.7rem;
            font-weight: 600;
            color: var(--muted);
            white-space: nowrap;
            font-family: 'DM Sans', sans-serif;
          }
          @media (max-width: 768px) {
            .add-to-list-btn {
              width: 100% !important;
              text-align: center !important;
              padding: 8px 10px !important;
            }
          }
        `}</style>
      </div>
    </Link>
  );
}
