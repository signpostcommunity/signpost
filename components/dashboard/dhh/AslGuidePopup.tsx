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
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 50,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(167, 139, 250, 0.15)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease, transform 0.15s ease',
            animation: hasAppeared ? 'asl-trigger-pulse 2s ease-out 1' : 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(167, 139, 250, 0.25)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(167, 139, 250, 0.15)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <HandIcon size={22} color="#a78bfa" />
        </button>
        <style>{`
          @keyframes asl-trigger-pulse {
            0% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.4); }
            70% { box-shadow: 0 0 0 12px rgba(167, 139, 250, 0); }
            100% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0); }
          }
          @media (max-width: 639px) {
            button[aria-label="Watch ASL guide for this page"] {
              width: 40px !important;
              height: 40px !important;
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
            border: '1px solid rgba(167, 139, 250, 0.3)',
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
              width: 280,
              height: 'auto',
              maxHeight: 400,
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
            max-width: calc(100vw - 32px) !important;
          }
          .asl-popup-video {
            width: calc(100vw - 32px) !important;
            max-height: 50vh !important;
          }
        }
      `}</style>
    </>
  )
}
