'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getVideoEmbedUrl } from '@/lib/videoUtils'
import Toast from '@/components/ui/Toast'
import { saveDraftVideo, getDraftVideo, deleteDraftVideo } from '@/lib/videoDraft'

interface InlineVideoCaptureProps {
  onVideoSaved: (url: string, source: 'recorded' | 'uploaded' | 'url') => void
  accentColor?: string
  storageBucket?: string
  storagePath?: string
  /** If provided, enables IndexedDB draft persistence keyed on this id. */
  userId?: string
  /** Default state for the audio capture toggle. Default true. */
  audioDefault?: boolean
}

type Tab = 'record' | 'upload' | 'url'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_RECORD_SECONDS = 120
const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

export default function InlineVideoCapture({
  onVideoSaved,
  accentColor = '#7b61ff',
  storageBucket = 'videos',
  storagePath = '',
  userId,
  audioDefault = true,
}: InlineVideoCaptureProps) {
  const [activeTab, setActiveTab] = useState<Tab>('record')
  const [audioEnabled, setAudioEnabled] = useState(audioDefault)

  // Draft state (IndexedDB-backed, only active when userId is provided)
  const [draftBlob, setDraftBlob] = useState<Blob | null>(null)
  const [draftUrl, setDraftUrl] = useState('')
  const [draftLoading, setDraftLoading] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Record state
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [cameraStarted, setCameraStarted] = useState(false)
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
  const [toast, setToast] = useState<string | null>(null)
  const autoStoppedRef = useRef(false)

  const accentRgb = hexToRgb(accentColor)

  // Cleanup camera when switching away from record tab
  useEffect(() => {
    if (activeTab !== 'record') {
      stopCamera()
      setCameraStarted(false)
      setCameraReady(false)
    }
  }, [activeTab])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
      if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl)
      if (draftUrl) URL.revokeObjectURL(draftUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load any existing draft from IndexedDB on mount
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setDraftLoading(true)
    getDraftVideo(userId)
      .then(blob => {
        if (cancelled || !blob) return
        const url = URL.createObjectURL(blob)
        setDraftBlob(blob)
        setDraftUrl(url)
      })
      .catch(() => { /* IndexedDB unavailable, ignore */ })
      .finally(() => { if (!cancelled) setDraftLoading(false) })
    return () => { cancelled = true }
  }, [userId])

  // Camera setup
  async function startCamera() {
    setCameraError('')
    setCameraStarted(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: audioEnabled,
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
      setCameraStarted(false)
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
      setCameraStarted(false)
      setCameraReady(false)
    }

    recorder.start(1000)
    setRecording(true)

    autoStoppedRef.current = false
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (next >= MAX_RECORD_SECONDS) {
          autoStoppedRef.current = true
          stopRecording()
          setToast('Recording stopped \u2014 2 minute maximum reached')
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
      setUploadError(`File must be under 100MB. Yours is ${(file.size / 1024 / 1024).toFixed(1)}MB.`)
      return
    }

    // Check video duration
    const tempVideo = document.createElement('video')
    tempVideo.preload = 'metadata'
    const objectUrl = URL.createObjectURL(file)
    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      if (tempVideo.duration > MAX_RECORD_SECONDS) {
        setUploadError(`Video must be 2 minutes or less. Your video is ${formatTime(Math.round(tempVideo.duration))}.`)
        return
      }
      setUploadedFile(file)
      setUploadedPreviewUrl(URL.createObjectURL(file))
    }
    tempVideo.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      // Can't read metadata - allow it through, server can validate
      setUploadedFile(file)
      setUploadedPreviewUrl(URL.createObjectURL(file))
    }
    tempVideo.src = objectUrl
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

  // Upload to Supabase storage. On failure, persist the blob as a draft so
  // the recording is not lost if the user navigates away.
  async function uploadToStorage(blob: Blob, ext: string): Promise<string | null> {
    setUploading(true)
    setUploadProgress(0)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return null }

    const prefix = storagePath || user.id
    const filename = `${prefix}/${Date.now()}.${ext}`

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
      // Persist as draft so the recording is not lost
      const draftKey = userId || user.id
      try {
        await saveDraftVideo(draftKey, blob)
        setToast('Upload failed. Your video has been saved as a draft. You can try again anytime from your profile editor.')
      } catch {
        setToast(`Upload failed: ${error.message}`)
      }
      return null
    }

    setUploadProgress(100)
    const { data: { publicUrl } } = supabase.storage.from(storageBucket).getPublicUrl(filename)
    // Clear any draft now that the video is live
    try {
      const draftKey = userId || user.id
      await deleteDraftVideo(draftKey)
    } catch { /* ignore */ }
    setUploading(false)
    return publicUrl
  }

  async function handleUseRecorded() {
    if (!recordedBlob) return
    const ext = recordedBlob.type.includes('webm') ? 'webm' : 'mp4'
    const url = await uploadToStorage(recordedBlob, ext)
    if (url) {
      clearLocalDraftState()
      onVideoSaved(url, 'recorded')
    }
  }

  async function handleUseUploaded() {
    if (!uploadedFile) return
    const ext = uploadedFile.name.split('.').pop()?.toLowerCase() || 'mp4'
    const url = await uploadToStorage(uploadedFile, ext)
    if (url) {
      clearLocalDraftState()
      onVideoSaved(url, 'uploaded')
    }
  }

  function clearLocalDraftState() {
    if (draftUrl) URL.revokeObjectURL(draftUrl)
    setDraftBlob(null)
    setDraftUrl('')
  }

  // Save the current recording (or upload) to IndexedDB without publishing.
  async function handleSaveAsDraft(blob: Blob) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const draftKey = userId || user?.id
    if (!draftKey) {
      setToast('Could not save draft (not signed in).')
      return
    }
    try {
      await saveDraftVideo(draftKey, blob)
      // Refresh the draft preview
      if (draftUrl) URL.revokeObjectURL(draftUrl)
      const url = URL.createObjectURL(blob)
      setDraftBlob(blob)
      setDraftUrl(url)
      setToast('Draft saved. Your video is stored locally and is not yet visible on your public profile.')
    } catch {
      setToast('Could not save draft. Your browser may not support local storage.')
    }
  }

  async function handleGoLiveDraft() {
    if (!draftBlob) return
    const ext = draftBlob.type.includes('webm') ? 'webm' : 'mp4'
    const url = await uploadToStorage(draftBlob, ext)
    if (url) {
      clearLocalDraftState()
      onVideoSaved(url, 'recorded')
    }
  }

  async function handleDiscardDraft() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const draftKey = userId || user?.id
    if (draftKey) {
      try { await deleteDraftVideo(draftKey) } catch { /* ignore */ }
    }
    clearLocalDraftState()
    setShowDiscardConfirm(false)
    setToast('Draft discarded.')
  }

  function handleUsePastedUrl() {
    if (pastedUrl.trim() && urlValid) {
      onVideoSaved(pastedUrl.trim(), 'url')
    }
  }

  // ── Styles ──

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    borderBottom: activeTab === tab ? `2px solid ${accentColor}` : '2px solid transparent',
    color: activeTab === tab ? accentColor : 'var(--muted)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.88rem',
    fontWeight: activeTab === tab ? 600 : 500,
    padding: '10px 18px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  const btnPill: React.CSSProperties = {
    background: accentColor,
    color: '#0a0a0f',
    border: 'none',
    borderRadius: 10,
    padding: '12px 28px',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: '0.9rem',
    fontStyle: 'normal',
    cursor: uploading ? 'wait' : 'pointer',
    opacity: uploading ? 0.6 : 1,
    transition: 'opacity 0.15s',
  }

  const btnGhost: React.CSSProperties = {
    background: 'none',
    border: `1px solid rgba(${accentRgb}, 0.4)`,
    borderRadius: 24,
    padding: '10px 22px',
    color: accentColor,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  return (
    <div style={{
      background: '#16161f',
      border: '1px solid #1e2433',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Draft banner */}
      {draftBlob && draftUrl && (
        <div style={{
          background: 'rgba(255,193,7,0.05)',
          borderLeft: '3px solid #ffc107',
          padding: '16px 20px',
        }}>
          <div style={{
            color: '#ffc107', fontSize: '0.82rem', fontWeight: 600,
            marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Saved draft video
          </div>
          <p style={{
            color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 12px',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            You have a saved draft video. Go live to publish it on your public profile.
          </p>
          <div style={{
            width: '100%', aspectRatio: '16/9', borderRadius: 10,
            overflow: 'hidden', marginBottom: 12, background: '#000',
          }}>
            <video src={draftUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              style={{
                background: '#00e5ff', color: '#0a0a0f', border: 'none',
                borderRadius: 10, padding: '10px 22px',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.88rem',
                cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1,
              }}
              onClick={handleGoLiveDraft}
              disabled={uploading}
            >
              {uploading ? 'Publishing...' : 'Go Live'}
            </button>
            <button
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 22px', color: 'var(--muted)',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '0.88rem',
                cursor: 'pointer',
              }}
              onClick={() => setShowDiscardConfirm(true)}
              disabled={uploading}
            >
              Discard Draft
            </button>
          </div>
          {showDiscardConfirm && (
            <div style={{
              marginTop: 12, padding: 12,
              background: 'rgba(255,107,133,0.08)',
              border: '1px solid rgba(255,107,133,0.3)',
              borderRadius: 8,
            }}>
              <div style={{ color: 'var(--text)', fontSize: '0.85rem', marginBottom: 10 }}>
                Discard this draft permanently? This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  style={{
                    background: '#ff6b85', color: '#0a0a0f', border: 'none',
                    borderRadius: 8, padding: '8px 16px', fontWeight: 600,
                    fontSize: '0.82rem', cursor: 'pointer',
                  }}
                  onClick={handleDiscardDraft}
                >
                  Yes, discard
                </button>
                <button
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 16px', color: 'var(--muted)',
                    fontSize: '0.82rem', cursor: 'pointer',
                  }}
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {draftLoading && !draftBlob && (
        <div style={{ padding: '12px 20px', color: 'var(--muted)', fontSize: '0.8rem' }}>
          Checking for saved drafts...
        </div>
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1e2433',
        padding: '0 4px',
      }}>
        <button style={tabStyle('record')} onClick={() => setActiveTab('record')}>Record</button>
        <button style={tabStyle('upload')} onClick={() => setActiveTab('upload')}>Upload</button>
        <button style={tabStyle('url')} onClick={() => setActiveTab('url')}>Paste URL</button>
      </div>

      {/* Tab content */}
      <div style={{ padding: '20px' }}>
        {/* ── Record Tab ── */}
        {activeTab === 'record' && (
          <div>
            {cameraError && (
              <div style={{
                padding: 20, textAlign: 'center',
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
                {/* Preview area */}
                <div style={{
                  position: 'relative', width: '100%',
                  aspectRatio: '16/9', background: '#0a0a0f',
                  borderRadius: 10, overflow: 'hidden', marginBottom: 16,
                }}>
                  {cameraStarted ? (
                    <>
                      <video
                        ref={videoRef}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'cover', transform: 'scaleX(-1)',
                        }}
                        playsInline
                        muted
                      />
                      {!cameraReady && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--muted)', fontSize: '0.88rem',
                        }}>
                          Requesting camera access...
                        </div>
                      )}
                    </>
                  ) : (
                    /* Dark preview placeholder with camera icon */
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.25 }}>
                        <rect x="4" y="12" width="30" height="24" rx="4" stroke="#b8bfcf" strokeWidth="1.5" />
                        <path d="M34 20l10-5v18l-10-5V20z" stroke="#b8bfcf" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
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
                      <span style={{
                        color: elapsed >= 105 ? '#ff9800' : '#fff',
                        fontSize: '0.82rem',
                        fontFamily: 'monospace',
                        fontWeight: elapsed >= 105 ? 700 : 400,
                        transition: 'color 0.3s',
                      }}>
                        {formatTime(elapsed)} / {formatTime(MAX_RECORD_SECONDS)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  {!recording ? (
                    <button
                      style={{
                        ...btnPill,
                        opacity: cameraStarted && !cameraReady ? 0.4 : 1,
                      }}
                      onClick={() => {
                        if (!cameraStarted) {
                          startCamera()
                        } else if (cameraReady) {
                          startRecording()
                        }
                      }}
                      disabled={cameraStarted && !cameraReady}
                    >
                      Start Recording
                    </button>
                  ) : (
                    <button
                      style={{
                        ...btnPill,
                        background: '#ff4444',
                      }}
                      onClick={stopRecording}
                    >
                      Stop Recording
                    </button>
                  )}
                </div>
                <p style={{
                  textAlign: 'center', margin: '10px 0 0',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem',
                  color: 'var(--muted)', fontStyle: 'italic',
                }}>
                  Maximum length: 2 minutes
                </p>
              </>
            )}

            {/* Playback preview after recording */}
            {recordedBlob && (
              <>
                <div style={{
                  width: '100%', aspectRatio: '16/9',
                  borderRadius: 10, overflow: 'hidden', marginBottom: 16,
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
                      height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2,
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

                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button style={btnGhost} onClick={resetRecording} disabled={uploading}>
                    Record again
                  </button>
                  <button
                    style={btnGhost}
                    onClick={() => recordedBlob && handleSaveAsDraft(recordedBlob)}
                    disabled={uploading || !recordedBlob}
                  >
                    Save as Draft
                  </button>
                  <button style={btnPill} onClick={handleUseRecorded} disabled={uploading}>
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
                  border: '2px dashed rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `rgba(${accentRgb}, 0.5)`
                  e.currentTarget.style.background = `rgba(${accentRgb}, 0.03)`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ opacity: 0.4, marginBottom: 10 }}>
                  <rect x="5" y="12" width="26" height="18" rx="3" stroke="#b8bfcf" strokeWidth="1.5" />
                  <path d="M13 18l5-5 5 5M18 13v12" stroke="#b8bfcf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
                  Drag a video file here or <span style={{ color: accentColor, fontWeight: 600 }}>click to browse</span>
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 8, marginBottom: 0, opacity: 0.7 }}>
                  MP4, WebM, or MOV. Max 100MB.
                </p>
                <p style={{
                  color: 'var(--muted)', fontSize: '0.75rem', marginTop: 6, marginBottom: 0,
                  fontStyle: 'italic', opacity: 0.7,
                }}>
                  Maximum length: 2 minutes. Max file size: 100MB.
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  width: '100%', aspectRatio: '16/9',
                  borderRadius: 10, overflow: 'hidden', marginBottom: 16,
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
                      height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2,
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

                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button style={btnGhost} onClick={() => {
                    setUploadedFile(null)
                    if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl)
                    setUploadedPreviewUrl('')
                  }} disabled={uploading}>
                    Choose another
                  </button>
                  <button
                    style={btnGhost}
                    onClick={() => uploadedFile && handleSaveAsDraft(uploadedFile)}
                    disabled={uploading || !uploadedFile}
                  >
                    Save as Draft
                  </button>
                  <button style={btnPill} onClick={handleUseUploaded} disabled={uploading}>
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
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '11px 14px',
                color: 'var(--text)',
                fontSize: '0.9rem',
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.target.style.borderColor = accentColor
                e.target.style.boxShadow = `0 0 0 3px rgba(${accentRgb}, 0.1)`
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)'
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
                  marginTop: 16, borderRadius: 10, overflow: 'hidden',
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
                <button style={btnPill} onClick={handleUsePastedUrl}>
                  Use this video
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast} type="info" onClose={() => setToast(null)} duration={4000} />
      )}
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
