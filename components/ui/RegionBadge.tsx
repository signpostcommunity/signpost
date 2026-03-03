const REGION_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  'EU':           { bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.25)', color: 'var(--accent)' },
  'UK':           { bg: 'rgba(0,229,255,0.08)', border: 'rgba(0,229,255,0.25)', color: 'var(--accent)' },
  'North America':{ bg: 'rgba(157,135,255,0.08)', border: 'rgba(157,135,255,0.25)', color: 'var(--accent2)' },
  'Latin America':{ bg: 'rgba(157,135,255,0.08)', border: 'rgba(157,135,255,0.25)', color: 'var(--accent2)' },
  'Asia Pacific': { bg: 'rgba(255,149,0,0.08)', border: 'rgba(255,149,0,0.25)', color: '#ff9500' },
  'Middle East':  { bg: 'rgba(255,107,133,0.08)', border: 'rgba(255,107,133,0.25)', color: 'var(--accent3)' },
  'Africa':       { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', color: '#34d399' },
  'Worldwide':    { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', color: 'var(--muted)' },
};

export default function RegionBadge({ region }: { region: string }) {
  const style = REGION_COLORS[region] || { bg: 'var(--surface2)', border: 'var(--border)', color: 'var(--muted)' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '100px',
        padding: '3px 10px',
        fontSize: '0.72rem',
        fontWeight: 500,
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      {region}
    </span>
  );
}
