'use client'

type Role = 'interpreter' | 'dhh' | 'requester'

interface PrelaunchChipProps {
  role: Role
  onClick: () => void
}

const ACCENT: Record<Role, string> = {
  interpreter: '#00e5ff',
  dhh: '#a78bfa',
  requester: '#00e5ff',
}

export default function PrelaunchChip({ role, onClick }: PrelaunchChipProps) {
  const accent = ACCENT[role]

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        background: `${accent}1a`,
        border: `1px solid ${accent}40`,
        borderRadius: 100,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${accent}26` }}
      onMouseLeave={e => { e.currentTarget.style.background = `${accent}1a` }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: accent,
          flexShrink: 0,
          animation: 'prelaunch-pulse 2s ease-in-out infinite',
        }}
      />
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 11,
          color: accent,
          letterSpacing: '0.03em',
        }}
      >
        Opens May 1
      </span>
      <style>{`
        @keyframes prelaunch-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </button>
  )
}
