'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
    error:   { bg: 'rgba(255,107,133,0.1)', border: 'rgba(255,107,133,0.3)', color: 'var(--accent3)' },
    info:    { bg: 'rgba(0,229,255,0.1)', border: 'rgba(0,229,255,0.3)', color: 'var(--accent)' },
  };
  const c = colors[type];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'var(--surface)',
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s, transform 0.3s',
        maxWidth: 320,
      }}
    >
      <span style={{ color: c.color, fontSize: '0.9rem' }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          fontSize: '0.9rem',
          padding: '0 4px',
          marginLeft: '4px',
        }}
      >
        ✕
      </button>
    </div>
  );
}
