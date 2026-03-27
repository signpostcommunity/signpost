'use client';

import { useEffect, useCallback } from 'react';
import { getVideoEmbedUrl, isValidVideoUrl } from '@/lib/videoUtils';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interpreterName: string;
  videoUrl: string | null;
  interpreterId: string;
}

export default function VideoPreviewModal({
  isOpen,
  onClose,
  interpreterName,
  videoUrl,
  interpreterId,
}: VideoPreviewModalProps) {
  const focusTrapRef = useFocusTrap(isOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const hasValidVideo = videoUrl && isValidVideoUrl(videoUrl);
  const embedUrl = hasValidVideo ? getVideoEmbedUrl(videoUrl) : null;

  return (
    <div
      className="video-preview-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(7, 9, 16, 0.88)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${interpreterName} video preview`}
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #16161f)',
          border: '1px solid var(--border, #1e2433)',
          borderRadius: '16px',
          maxWidth: '640px',
          width: '100%',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border, #1e2433)',
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '1.05rem',
              color: 'var(--text, #f0f2f8)',
            }}
          >
            {interpreterName}
          </div>
          <button
            onClick={onClose}
            aria-label="Close video preview"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted, #b0b8d0)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              lineHeight: 1,
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--text, #f0f2f8)';
              e.currentTarget.style.background = 'var(--surface2, #161923)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--muted, #b0b8d0)';
              e.currentTarget.style.background = 'none';
            }}
          >
            ✕
          </button>
        </div>

        {/* Video area */}
        <div style={{ padding: '0' }}>
          {embedUrl ? (
            <div
              style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                background: '#000',
              }}
            >
              <iframe
                src={embedUrl}
                title={`${interpreterName} intro video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                gap: '12px',
                color: 'var(--muted, #b0b8d0)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(0, 229, 255, 0.08)',
                  border: '1.5px solid rgba(0, 229, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                }}
              >
                ▶
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>
                No intro video available
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                This interpreter hasn&apos;t uploaded an introduction video yet.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border, #1e2433)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <a
            href={`/directory/${interpreterId}`}
            style={{
              color: 'var(--accent, #00e5ff)',
              fontSize: '0.87rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(0, 229, 255, 0.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            View Full Profile →
          </a>
        </div>
      </div>
    </div>
  );
}
