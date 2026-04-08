'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getVideoEmbedUrl } from '@/lib/videoUtils'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

interface VideoRecorderProps {
  isOpen: boolean
  onClose: () => void
  onVideoSaved: (url: string, source: 'recorded' | 'uploaded' | 'url') => void
  accentColor?: string
  storageBucket?: string
  storagePath?: string
  /** Default state for the audio capture toggle. Default true. */
  audioDefault?: boolean
}

type Tab = 'record' | 'upload' | 'url'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_RECORD_SECONDS = 120
const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export default function VideoRecorder({
  isOpen,
  onClose,
  onVideoSaved,
  accentColor = '#00e5ff',
  storageBucket = 'interpreter-videos',
  storagePath = '',
  audioDefault = true,
}: VideoRecorderProps) {
  const focusTrapRef = useFocusTrap(isOpen)
  const [activeTab, setActiveTab] = useState<Tab>('record')
  const [audioEnabled, setAudioEnabled] = useState(audioDefault)

  // Record state
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [recording, setRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState('')
  const [elapsed, setElapsed] = useState(0)

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState('')
  const [uploadError, setUploadError] = useState('')

  // URL state
  const [pastedUrl, setPastedUrl] = useState('')
  const [urlValid, setUrlValid] = useState(false)

  // Shared state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const accentRgb = hexToRgb(accentColor)

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setActiveTab('record')
      setCameraReady(false)
      setCameraError('')
      setRecording(false)
      setRecordedBlob(null)
      setRecordedUrl('')
      setElapsed(0)
      setUploadedFile(null)
      setUploadedPreviewUrl('')
      setUploadError('')
      setPastedUrl('')
      setUrlValid(false)
      setUploading(false)
      setUploadProgress(0)
    }
  }, [isOpen])

  // ESC to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // Camera setup
  async function startCamera() {
    return startCameraWithAudio(audioEnabled)
  }

  async function startCameraWithAudio(audioOn: boolean) {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: audioOn,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        await videoRef.current.play()
      }
      setCameraReady(true)
    } catch {
      setCameraError('Camera access denied. Please allow camera and microphone permissions.')
    }
  }

  function stopCamera() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    mediaRecorderRef.current = null
  }

  // Start camera when Record tab opens
  useEffect(() => {
    if (isOpen && activeTab === 'record' && !cameraReady && !recordedBlob) {
      startCamera()
    }
    if (activeTab !== 'record') {
      stopCamera()
      setCameraReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab])

  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []
    setElapsed(0)

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4'

    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType.split(';')[0] })
      const url = URL.createObjectURL(blob)
      setRecordedBlob(blob)
      setRecordedUrl(url)
      stopCamera()
      setCameraReady(false)
    }

    recorder.start(1000)
    setRecording(true)

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (next >= MAX_RECORD_SECONDS) {
          stopRecording()
        }
        return next
      })
    }, 1000)
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  function resetRecording() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedBlob(null)
    setRecordedUrl('')
    setElapsed(0)
    startCamera()
  }

  // File upload handler
  function handleFileSelect(file: File) {
    setUploadError('')
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Please select an MP4, WebM, or MOV video.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File must be under 50MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`)
      return
    }
    setUploadedFile(file)
    setUploadedPreviewUrl(URL.createObjectURL(file))
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  // URL validation
  function validateUrl(url: string) {
    setPastedUrl(url)
    if (!url.trim()) { setUrlValid(false); return }
    const isYoutube = /youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/shorts\//.test(url)
    const isVimeo = /vimeo\.com\/\d+/.test(url)
    setUrlValid(isYoutube || isVimeo)
  }

  // Upload to Supabase storage
  async function uploadToStorage(blob: Blob, ext: string): Promise<string | null> {
    setUploading(true)
    setUploadProgress(0)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return null }

    const prefix = storagePath || user.id
    const filename = `${prefix}/${Date.now()}.${ext}`

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 8, 90))
    }, 200)

    const { error } = await supabase.storage.from(storageBucket).upload(filename, blob, {
      cacheControl: '3600',
      upsert: true,
    })

    clearInterval(progressInterval)

    if (error) {
      setUploading(false)
      setUploadProgress(0)
      setUploadError(error.message)
      return null
    }

    setUploadProgress(100)
    const { data: { publicUrl } } = supabase.storage.from(storageBucket).getPublicUrl(filename)
    setUploading(false)
    return publicUrl
  }

  // "Use this video" handlers
  async function handleUseRecorded() {
    if (!recordedBlob) return
    const ext = recordedBlob.type.includes('webm') ? 'webm' : 'mp4'
    const url = await uploadToStorage(recordedBlob, ext)
    if (url) onVideoSaved(url, 'recorded')
  }

  async function handleUseUploaded() {
    if (!uploadedFile) return
    const ext = uploadedFile.name.split('.').pop()?.toLowerCase() || 'mp4'
    const url = await uploadToStorage(uploadedFile, ext)
    if (url) onVideoSaved(url, 'uploaded')
  }

  function handleUsePastedUrl() {
    if (pastedUrl.trim() && urlValid) {
      onVideoSaved(pastedUrl.trim(), 'url')
    }
  }

  if (!isOpen) return null

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    borderBottom: activeTab === tab ? `2px solid ${accentColor}` : '2px solid transparent',
    color: activeTab === tab ? accentColor : 'var(--muted)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.88rem',
    fontWeight: activeTab === tab ? 600 : 400,
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  const btnPrimary: React.CSSProperties = {
    background: accentColor,
    color: '#0a0a0f',
    border: 'none',
    borderRadius: 10,
    padding: '10px 20px',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: '0.88rem',
    fontStyle: 'normal',
    cursor: uploading ? 'wait' : 'pointer',
    opacity: uploading ? 0.6 : 1,
    transition: 'opacity 0.15s',
  }

  const btnGhost: React.CSSProperties = {
    background: 'none',
    border: `1px solid ${accentColor}`,
    borderRadius: 8,
    padding: '10px 20px',
    color: accentColor,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(7, 9, 16, 0.88)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add a video"
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          maxWidth: 600,
          width: '100%',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
            fontSize: '1rem', color: 'var(--text)',
          }}>
            Add a video
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: 'none',
              color: 'var(--muted)', fontSize: '1.2rem',
              cursor: 'pointer', padding: '4px 8px',
              borderRadius: 6, lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button style={tabStyle('record')} onClick={() => setActiveTab('record')}>Record</button>
          <button style={tabStyle('upload')} onClick={() => setActiveTab('upload')}>Upload</button>
          <button style={tabStyle('url')} onClick={() => setActiveTab('url')}>Paste URL</button>
        </div>

        {/* Tab content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* ── Record Tab ── */}
          {activeTab === 'record' && (
            <div>
              {cameraError && (
                <div style={{
                  padding: 24, textAlign: 'center',
                  color: 'var(--accent3)', fontSize: '0.88rem',
                }}>
                  {cameraError}
                  <div style={{ marginTop: 12 }}>
                    <button style={btnGhost} onClick={startCamera}>Try again</button>
                  </div>
                </div>
              )}

              {!cameraError && !recordedBlob && (
                <>
                  {/* Live preview */}
                  <div style={{
                    position: 'relative', width: '100%',
                    aspectRatio: '16/9', background: '#000',
                    borderRadius: 12, overflow: 'hidden', marginBottom: 16,
                  }}>
                    <video
                      ref={videoRef}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', transform: 'scaleX(-1)',
                      }}
                      playsInline
                      muted
                    />
                    {!cameraReady && !cameraError && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--muted)', fontSize: '0.88rem',
                      }}>
                        Requesting camera access...
                      </div>
                    )}
                    {/* Timer overlay */}
                    {recording && (
                      <div style={{
                        position: 'absolute', top: 12, right: 12,
                        background: 'rgba(0,0,0,0.6)', borderRadius: 6,
                        padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: '#ff4444', animation: 'trackerPulse 1.5s infinite',
                        }} />
                        <span style={{ color: '#fff', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                          {formatTime(elapsed)} / {formatTime(MAX_RECORD_SECONDS)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Audio toggle */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 10, marginBottom: 12,
                  }}>
                    <span style={{
                      color: 'var(--muted)', fontSize: '0.82rem',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      Audio {audioEnabled ? 'on' : 'off'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={audioEnabled}
                      aria-label="Toggle microphone audio"
                      onClick={() => {
                        const next = !audioEnabled
                        setAudioEnabled(next)
                        if (cameraReady && !recording) {
                          stopCamera()
                          setCameraReady(false)
                          setTimeout(() => startCameraWithAudio(next), 0)
                        }
                      }}
                      disabled={recording}
                      style={{
                        position: 'relative',
                        width: 38, height: 22, borderRadius: 11,
                        background: audioEnabled ? accentColor : '#2a2f3d',
                        border: 'none',
                        cursor: recording ? 'not-allowed' : 'pointer',
                        transition: 'background 0.15s',
                        padding: 0,
                        opacity: recording ? 0.5 : 1,
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: 2, left: audioEnabled ? 18 : 2,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.15s',
                      }} />
                    </button>
                  </div>

                  {/* Record controls */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    {!recording ? (
                      <button
                        style={{
                          ...btnPrimary,
                          padding: '12px 32px',
                          borderRadius: 10,
                          fontSize: '0.92rem',
                          opacity: cameraReady ? 1 : 0.4,
                        }}
                        onClick={startRecording}
                        disabled={!cameraReady}
                      >
                        Start Recording
                      </button>
                    ) : (
                      <button
                        style={{
                          background: '#ff4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 100,
                          padding: '12px 32px',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                        }}
                        onClick={stopRecording}
                      >
                        Stop Recording
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Playback preview after recording */}
              {recordedBlob && (
                <>
                  <div style={{
                    width: '100%', aspectRatio: '16/9',
                    borderRadius: 12, overflow: 'hidden', marginBottom: 16,
                    background: '#000',
                  }}>
                    <video
                      src={recordedUrl}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  {uploading && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{
                        height: 4, background: 'var(--surface2)', borderRadius: 2,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', width: `${uploadProgress}%`,
                          background: accentColor, borderRadius: 2,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4, textAlign: 'center' }}>
                        Uploading... {uploadProgress}%
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button style={btnGhost} onClick={resetRecording} disabled={uploading}>
                      Record again
                    </button>
                    <button style={btnPrimary} onClick={handleUseRecorded} disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Use this video'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Upload Tab ── */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                style={{ display: 'none' }}
              />

              {!uploadedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                  style={{
                    border: `2px dashed var(--border)`,
                    borderRadius: 12,
                    padding: 48,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = accentColor
                    e.currentTarget.style.background = `rgba(${accentRgb}, 0.02)`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.5, marginBottom: 12 }}>
                    <rect x="6" y="14" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M14 20l6-6 6 6M20 14v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
                    <strong style={{ color: accentColor }}>Click to upload or drag and drop</strong>
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 6, marginBottom: 0 }}>
                    MP4, WebM, or MOV. Max 50MB.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{
                    width: '100%', aspectRatio: '16/9',
                    borderRadius: 12, overflow: 'hidden', marginBottom: 16,
                    background: '#000',
                  }}>
                    <video
                      src={uploadedPreviewUrl}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  {uploading && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{
                        height: 4, background: 'var(--surface2)', borderRadius: 2,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', width: `${uploadProgress}%`,
                          background: accentColor, borderRadius: 2,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4, textAlign: 'center' }}>
                        Uploading... {uploadProgress}%
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button style={btnGhost} onClick={() => {
                      setUploadedFile(null)
                      if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl)
                      setUploadedPreviewUrl('')
                    }} disabled={uploading}>
                      Choose another
                    </button>
                    <button style={btnPrimary} onClick={handleUseUploaded} disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Use this video'}
                    </button>
                  </div>
                </>
              )}

              {uploadError && (
                <div style={{ color: 'var(--accent3)', fontSize: '0.82rem', marginTop: 12, textAlign: 'center' }}>
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* ── Paste URL Tab ── */}
          {activeTab === 'url' && (
            <div>
              <input
                type="text"
                value={pastedUrl}
                onChange={e => validateUrl(e.target.value)}
                placeholder="Paste a YouTube or Vimeo URL"
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '11px 14px',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  fontFamily: "'DM Sans', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.target.style.borderColor = accentColor
                  e.target.style.boxShadow = `0 0 0 3px rgba(${accentRgb}, 0.07)`
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />

              {pastedUrl.trim() && !urlValid && (
                <div style={{ color: 'var(--accent3)', fontSize: '0.82rem', marginTop: 8 }}>
                  Please enter a valid YouTube or Vimeo URL.
                </div>
              )}

              {urlValid && (() => {
                const embedUrl = getVideoEmbedUrl(pastedUrl)
                if (!embedUrl) return null
                return (
                  <div style={{
                    marginTop: 16, borderRadius: 12, overflow: 'hidden',
                    position: 'relative', paddingBottom: '56.25%', height: 0,
                    background: '#000',
                  }}>
                    <iframe
                      src={embedUrl}
                      title="Video preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%', border: 'none',
                      }}
                    />
                  </div>
                )
              })()}

              {urlValid && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                  <button style={btnPrimary} onClick={handleUsePastedUrl}>
                    Use this video
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helpers
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r},${g},${b}`
}
