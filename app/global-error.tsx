'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ background: '#0a0a0f', color: '#f0f2f8', fontFamily: "'Inter', 'DM Sans', sans-serif", margin: 0 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 775,
            fontSize: '27px',
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
          }}>
            Something went wrong
          </h1>
          <p style={{ color: '#96a0b8', fontSize: '14px', marginBottom: '24px', maxWidth: '400px', lineHeight: 1.6 }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#00e5ff',
              color: '#0a0a0f',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              fontSize: '14.5px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              minHeight: 44,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
