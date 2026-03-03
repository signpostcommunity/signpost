interface ChipProps {
  label: string;
  variant?: 'default' | 'accent' | 'purple' | 'pink';
  size?: 'sm' | 'md';
}

export default function Chip({ label, variant = 'default', size = 'md' }: ChipProps) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)' },
    accent:  { background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', color: 'var(--accent)' },
    purple:  { background: 'rgba(157,135,255,0.1)', border: '1px solid rgba(157,135,255,0.3)', color: 'var(--accent2)' },
    pink:    { background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)', color: 'var(--accent3)' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '100px',
        padding: size === 'sm' ? '3px 9px' : '4px 12px',
        fontSize: size === 'sm' ? '0.7rem' : '0.78rem',
        whiteSpace: 'nowrap',
        ...styles[variant],
      }}
    >
      {label}
    </span>
  );
}
