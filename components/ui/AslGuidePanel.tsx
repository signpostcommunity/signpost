'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { ASL_GUIDE_CLIPS, AslGuideClip, getClipForRoute, getVideoUrl } from '@/lib/asl-guide'

const NUDGE_KEY = 'signpost-asl-guide-nudge-dismissed'

const ALLOWED_ROUTE_PREFIXES = [
  '/dhh/dashboard',
  '/interpreter/dashboard',
  '/directory',
  '/about',
]

function shouldShowTrigger(pathname: string): boolean {
  if (pathname === '/') return true
  return ALLOWED_ROUTE_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

// SVG icons
function VideoIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="14" height="16" rx="2" />
      <path d="M16 8l4-2v12l-4-2" />
    </svg>
  )
}

function PlayIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <polygon points="6,3 17,10 6,17" />
    </svg>
  )
}

function CloseIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function AslGuidePanel() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [currentClip, setCurrentClip] = useState<AslGuideClip>(() => getClipForRoute(pathname))
  const [userSelectedClip, setUserSelectedClip] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [showNudge, setShowNudge] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const clipListRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Check nudge on mount
  useEffect(() => {
    if (pathname === '/dhh/dashboard') {
      const dismissed = localStorage.getItem(NUDGE_KEY)
      if (!dismissed) setShowNudge(true)
    } else {
      setShowNudge(false)
    }
  }, [pathname])

  // Route change: update clip if user hasn't manually selected one
  useEffect(() => {
    if (!userSelectedClip) {
      const clip = getClipForRoute(pathname)
      setCurrentClip(clip)
      setVideoError(false)
    }
  }, [pathname, userSelectedClip])

  const openPanel = useCallback(() => {
    setUserSelectedClip(false)
    setCurrentClip(getClipForRoute(pathname))
    setVideoError(false)
    setIsClosing(false)
    setIsOpen(true)
    setIsAnimating(true)
    // Dismiss nudge
    if (showNudge) {
      setShowNudge(false)
      localStorage.setItem(NUDGE_KEY, '1')
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsAnimating(false))
    })
  }, [pathname, showNudge])

  const closePanel = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      setUserSelectedClip(false)
    }, 250)
  }, [])

  const selectClip = useCallback((clip: AslGuideClip) => {
    setCurrentClip(clip)
    setUserSelectedClip(true)
    setVideoError(false)
    // Scroll video into view
    if (videoRef.current) {
      videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const dismissNudge = useCallback(() => {
    setShowNudge(false)
    localStorage.setItem(NUDGE_KEY, '1')
  }, [])

  // Escape key closes panel
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, closePanel])

  // Scroll active clip into view in list
  useEffect(() => {
    if (!isOpen || !clipListRef.current) return
    const active = clipListRef.current.querySelector('[data-active="true"]')
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isOpen, currentClip.slug])

  const visible = shouldShowTrigger(pathname)
  if (!visible && !isOpen) return null

  const videoUrl = getVideoUrl(currentClip.slug)
  const slideTransform = isAnimating || isClosing ? 'translateX(100%)' : 'translateX(0)'

  return (
    <>
      {/* Trigger button */}
      {!isOpen && visible && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 40 }}>
          {/* Nudge tooltip */}
          {showNudge && (
            <div
              onClick={dismissNudge}
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: 10,
                background: '#16161f',
                border: '1px solid #1e2433',
                borderRadius: 8,
                padding: '10px 14px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 400, color: '#f0f2f8' }}>
                New here? Watch a quick ASL tour
              </span>
              {/* Caret arrow pointing down */}
              <div style={{
                position: 'absolute',
                bottom: -6,
                right: 20,
                width: 12,
                height: 12,
                background: '#16161f',
                border: '1px solid #1e2433',
                borderTop: 'none',
                borderLeft: 'none',
                transform: 'rotate(45deg)',
              }} />
            </div>
          )}
          <button
            onClick={openPanel}
            aria-label="Open ASL site guide"
            style={{
              background: '#a78bfa',
              color: '#0a0a0f',
              padding: '8px 16px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 2px 12px rgba(167,139,250,0.3)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(167,139,250,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(167,139,250,0.3)'
            }}
          >
            <VideoIcon size={14} color="#0a0a0f" />
            ASL Guide
          </button>
        </div>
      )}

      {/* Panel + backdrop */}
      {isOpen && (
        <>
          {/* Desktop backdrop */}
          <div
            className="asl-guide-backdrop"
            onClick={closePanel}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 49,
              opacity: isClosing ? 0 : 1,
              transition: 'opacity 200ms ease',
            }}
          />

          {/* Panel */}
          <div
            ref={panelRef}
            role="dialog"
            aria-label="ASL site guide"
            className="asl-guide-panel"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              width: 'min(450px, 45vw)',
              background: '#0a0a0f',
              borderLeft: '1px solid #1e2433',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              transform: slideTransform,
              transition: 'transform 250ms ease-out',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid #1e2433',
              background: '#0a0a0f',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <VideoIcon size={16} color="#a78bfa" />
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 12,
                  color: '#a78bfa',
                  letterSpacing: '0.03em',
                }}>
                  ASL SITE GUIDE
                </span>
              </div>
              <button
                onClick={closePanel}
                aria-label="Close ASL site guide"
                className="asl-guide-close"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#96a0b8',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f0f2f8' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#96a0b8' }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {/* Video player */}
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative' }}>
                {videoError ? (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ color: '#96a0b8', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                      This guide is coming soon
                    </span>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    key={currentClip.slug}
                    controls
                    playsInline
                    preload="metadata"
                    onError={() => setVideoError(true)}
                    style={{ width: '100%', height: '100%', display: 'block', background: '#000' }}
                  >
                    <source src={videoUrl} type="video/mp4" />
                  </video>
                )}
              </div>

              {/* Current clip info */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2433' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, color: '#f0f2f8' }}>
                  {currentClip.title}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 12, color: '#96a0b8', marginTop: 3 }}>
                  {currentClip.subtitle}
                </div>
              </div>

              {/* Clip list */}
              <div ref={clipListRef}>
                {ASL_GUIDE_CLIPS.map(clip => {
                  const isActive = clip.slug === currentClip.slug
                  return (
                    <button
                      key={clip.slug}
                      data-active={isActive}
                      onClick={() => selectClip(clip)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '12px 20px',
                        background: isActive ? 'rgba(167,139,250,0.06)' : 'transparent',
                        borderTop: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        borderLeft: isActive ? '3px solid #a78bfa' : '3px solid transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div style={{ flexShrink: 0 }}>
                        <PlayIcon size={12} color={isActive ? '#a78bfa' : '#96a0b8'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: 13,
                          color: isActive ? '#f0f2f8' : '#c8cdd8',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {clip.title}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, fontFamily: 'Inter, sans-serif', fontSize: 11 }}>
                        {isActive ? (
                          <span style={{ color: '#a78bfa' }}>Playing</span>
                        ) : (
                          <span style={{ color: '#96a0b8' }}>{clip.durationLabel}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #1e2433',
              background: '#0a0a0f',
              textAlign: 'center',
              flexShrink: 0,
            }}>
              <a
                href="/about#faq"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  color: '#96a0b8',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f0f2f8' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#96a0b8' }}
              >
                Read in English &rarr;
              </a>
            </div>
          </div>

          {/* Mobile & responsive overrides */}
          <style>{`
            @media (max-width: 767px) {
              .asl-guide-backdrop { display: none !important; }
              .asl-guide-panel {
                width: 100vw !important;
                border-left: none !important;
              }
              .asl-guide-close {
                min-width: 44px !important;
                min-height: 44px !important;
              }
            }
          `}</style>
        </>
      )}
    </>
  )
}
