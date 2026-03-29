'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
    }}>
      <p style={{
        color: '#96a0b8',
        fontSize: '14px',
        lineHeight: '1.6',
        marginBottom: '20px',
        maxWidth: '400px',
      }}>
        This page didn&apos;t load correctly. This is usually temporary.
      </p>
      <button
        onClick={reset}
        style={{
          background: '#00e5ff',
          color: '#0a0a0f',
          border: 'none',
          borderRadius: '10px',
          padding: '10px 24px',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
