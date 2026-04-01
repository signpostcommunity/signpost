'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { ASL_GUIDE_CLIPS, getClipForRoute, getVideoUrl, getTransparentVideoUrl } from '@/lib/asl-guide'

/** Route-to-clip map for DHH pages only */
const DHH_ROUTES = ASL_GUIDE_CLIPS.filter(c =>
  c.route.startsWith('/dhh/dashboard')
).map(c => c.route)

function hasClipForRoute(pathname: string): boolean {
  return DHH_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
}

function HandIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-4 0" />
      <path d="M14 10V4a2 2 0 0 0-4 0v7" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.3 16a2 2 0 0 1 3-2.5L8 15" />
    </svg>
  )
}

function CloseIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function AslGuidePopup() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [isTransparent, setIsTransparent] = useState(true)
  const [clipExists, setClipExists] = useState<boolean | null>(null)
  const [hasAppeared, setHasAppeared] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const clip = getClipForRoute(pathname)
  const isOnDhhRoute = hasClipForRoute(pathname)

  // Check if the clip's video exists (HEAD request)
  useEffect(() => {
    if (!isOnDhhRoute) {
      setClipExists(null)
      return
    }
    let cancelled = false
    async function check() {
      try {
        // Check transparent WebM first, then MP4
        const webmRes = await fetch(getTransparentVideoUrl(clip.slug), { method: 'HEAD' })
        if (!cancelled && webmRes.ok) { setClipExists(true); return }
        const mp4Res = await fetch(getVideoUrl(clip.slug), { method: 'HEAD' })
        if (!cancelled) setClipExists(mp4Res.ok)
      } catch {
        if (!cancelled) setClipExists(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [clip.slug, isOnDhhRoute])

  // Trigger pulse animation on first appearance
  useEffect(() => {
    if (clipExists && isOnDhhRoute && !hasAppeared) {
      setHasAppeared(true)
    }
  }, [clipExists, isOnDhhRoute, hasAppeared])

  // Detect which source loaded (WebM vs MP4)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    function onLoaded() {
      if (video) setIsTransparent(video.currentSrc.endsWith('.webm'))
    }
    video.addEventListener('loadeddata', onLoaded)
    return () => video.removeEventListener('loadeddata', onLoaded)
  }, [expanded, clip.slug])

  // Reset expanded state when navigating to a route without a clip
  useEffect(() => {
    if (!isOnDhhRoute) setExpanded(false)
  }, [isOnDhhRoute])

  const handleExpand = useCallback(() => {
    setExpanded(true)
    setTimeout(() => videoRef.current?.play(), 200)
  }, [])

  const handleMinimize = useCallback(() => {
    videoRef.current?.pause()
    setExpanded(false)
  }, [])

  // Escape key minimizes
  useEffect(() => {
    if (!expanded) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleMinimize()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [expanded, handleMinimize])

  // Don't render if not on a DHH route or clip doesn't exist
  if (!isOnDhhRoute || clipExists === false || clipExists === null) return null

  // --- Trigger button (collapsed state) ---
  if (!expanded) {
    return (
      <>
        <button
          onClick={handleExpand}
          aria-label="Watch ASL guide for this page"
          className="asl-trigger-btn"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 50,
            width: 'auto',
            minWidth: 64,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(0, 229, 255, 0.12)',
            border: '1.5px solid rgba(0, 229, 255, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            transition: 'background 0.15s ease, transform 0.15s ease',
            animation: hasAppeared ? 'asl-trigger-emanate 1.5s ease-out 5' : 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0, 229, 255, 0.2)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0, 229, 255, 0.12)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <HandIcon size={24} color="#00e5ff" />
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#00e5ff',
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}>
            ASL Guide
          </span>
        </button>
        <style>{`
          @keyframes asl-trigger-emanate {
            0% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.4); }
            70% { box-shadow: 0 0 0 12px rgba(0, 229, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0); }
          }
          @media (max-width: 639px) {
            .asl-trigger-btn {
              min-width: 56px !important;
              padding: 10px 12px !important;
            }
            .asl-trigger-btn svg {
              width: 20px !important;
              height: 20px !important;
            }
            .asl-trigger-btn span {
              font-size: 9px !important;
            }
          }
        `}</style>
      </>
    )
  }

  // --- Expanded video popup ---
  return (
    <>
      <div
        role="dialog"
        aria-label={`ASL Guide: ${clip.title}`}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {/* Minimize button */}
        <button
          onClick={handleMinimize}
          aria-label="Minimize ASL guide"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: 6,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)' }}
        >
          <CloseIcon size={14} color="#c8cdd8" />
        </button>

        {/* Video container */}
        <div
          className="asl-popup-video-wrap"
          style={{
            borderRadius: !isTransparent ? 12 : 0,
            overflow: !isTransparent ? 'hidden' : 'visible',
            background: !isTransparent ? '#111118' : 'transparent',
          }}
        >
          <video
            ref={videoRef}
            key={clip.slug}
            autoPlay
            muted
            playsInline
            controls
            preload="metadata"
            className="asl-popup-video"
            style={{
              width: 400,
              height: 'auto',
              maxHeight: 500,
              display: 'block',
              filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6))',
            }}
          >
            <source src={getTransparentVideoUrl(clip.slug)} type="video/webm" />
            <source src={getVideoUrl(clip.slug)} type="video/mp4" />
          </video>
        </div>

        {/* Title */}
        <div style={{
          marginTop: 6,
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          fontWeight: 400,
          color: '#96a0b8',
          textAlign: 'right',
        }}>
          ASL Guide: {clip.title}
        </div>
      </div>

      <style>{`
        @media (max-width: 639px) {
          .asl-popup-video-wrap {
            max-width: calc(100vw - 48px) !important;
          }
          .asl-popup-video {
            width: calc(100vw - 48px) !important;
            max-height: 50vh !important;
          }
        }
      `}</style>
    </>
  )
}
