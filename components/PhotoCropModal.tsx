'use client'
import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'

interface Props {
  imageSrc: string
  onCropped: (blob: Blob) => void
  onCancel: () => void
}

export default function PhotoCropModal({ imageSrc, onCropped, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: unknown, croppedPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropped(blob)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#111118', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '90%', maxWidth: 480,
        padding: '28px 24px',
      }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: 20 }}>
          Adjust Your Photo
        </h3>

        <div style={{ position: 'relative', width: '100%', height: 320, marginBottom: 20, background: '#000' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: '#96a0b8' }}>Zoom</span>
          <input
            type="range" min={1} max={3} step={0.1}
            value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#00e5ff' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onCancel} disabled={saving} style={{
            padding: '8px 20px', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 8,
            color: '#96a0b8', fontSize: 14, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '8px 20px', background: '#00e5ff',
            border: 'none', borderRadius: 8, color: '#0a0a0f',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>{saving ? 'Saving...' : 'Save Photo'}</button>
        </div>
      </div>
    </div>
  )
}
