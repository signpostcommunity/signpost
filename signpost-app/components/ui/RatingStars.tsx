export default function RatingStars({ rating, size = 12 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={size} fill={1} />
      ))}
      {half && <Star key="h" size={size} fill={0.5} />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={size} fill={0} />
      ))}
    </span>
  );
}

function Star({ size, fill }: { size: number; fill: number }) {
  const color = fill > 0 ? '#fbbf24' : 'rgba(255,255,255,0.15)';
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1l1.35 2.73L10.5 4.27l-2.25 2.19.53 3.09L6 8.02 3.22 9.55l.53-3.09L1.5 4.27l3.15-.54L6 1z"
        fill={fill === 1 ? color : fill === 0.5 ? 'url(#half)' : color}
        stroke={fill > 0 ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
        strokeWidth="0.5"
      />
      {fill === 0.5 && (
        <defs>
          <linearGradient id="half" x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}
