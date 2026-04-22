'use client'

type Role = 'interpreter' | 'dhh' | 'requester'

interface PrelaunchChipProps {
  role: Role
  onClick: () => void
}

/* Contrast color logic: cyan portals get purple pill, purple portal gets cyan pill */
const PILL_COLOR: Record<Role, string> = {
  interpreter: '#a78bfa',
  dhh: '#00e5ff',
  requester: '#a78bfa',
}

const COPY: Record<Role, string> = {
  interpreter: 'signpost opens to requesters May 1st',
  dhh: 'signpost opens to requesters May 1st',
  requester: 'Preview access. Public launch May 1st',
}

const ARIA: Record<Role, string> = {
  interpreter: 'signpost opens to requesters May 1st. Click for more information.',
  dhh: 'signpost opens to requesters May 1st. Click for more information.',
  requester: 'Preview access. Public launch May 1st. Click for more information.',
}

export default function PrelaunchChip({ role, onClick }: PrelaunchChipProps) {
  const color = PILL_COLOR[role]
  const copy = COPY[role]
  const ariaLabel = ARIA[role]

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="prelaunch-pill"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 14px',
        background: `${color}14`,
        border: `1px solid ${color}40`,
        borderRadius: 100,
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease',
        outline: 'none',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.03)'
        e.currentTarget.style.boxShadow = `0 0 16px ${color}33`
        e.currentTarget.style.borderColor = `${color}66`
        e.currentTarget.style.background = `${color}22`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = `${color}40`
        e.currentTarget.style.background = `${color}14`
      }}
    >
      {/* Emanation ring 1 */}
      <span className="prelaunch-ring prelaunch-ring-1" style={{ borderColor: color }} />
      {/* Emanation ring 2 */}
      <span className="prelaunch-ring prelaunch-ring-2" style={{ borderColor: color }} />

      {/* Clock icon */}
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>

      {/* Copy */}
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 12,
          color: color,
          letterSpacing: '0.02em',
        }}
      >
        {copy}
      </span>

      {/* Trailing chevron */}
      <span
        style={{
          fontWeight: 500,
          fontSize: 13,
          color: color,
          lineHeight: 1,
          marginLeft: 1,
        }}
        aria-hidden="true"
      >
        &#x203A;
      </span>

      <style>{`
        .prelaunch-pill:focus-visible {
          outline: 2px solid ${color};
          outline-offset: 2px;
        }

        .prelaunch-ring {
          position: absolute;
          inset: -3px;
          border-radius: 100px;
          border: 1px solid;
          opacity: 0;
          pointer-events: none;
          animation: prelaunch-emanate 2s ease-out infinite;
        }
        .prelaunch-ring-2 {
          animation-delay: 1s;
        }

        @keyframes prelaunch-emanate {
          0% {
            inset: 0px;
            opacity: 0.5;
          }
          100% {
            inset: -10px;
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .prelaunch-ring {
            animation: none !important;
            display: none;
          }
        }

        @media (max-width: 640px) {
          .prelaunch-pill {
            padding: 4px 10px !important;
            gap: 5px !important;
          }
          .prelaunch-pill span:not(.prelaunch-ring) {
            font-size: 11px !important;
          }
          .prelaunch-ring {
            animation-duration: 3s !important;
          }
          .prelaunch-ring-2 {
            display: none;
          }
        }
      `}</style>
    </button>
  )
}
