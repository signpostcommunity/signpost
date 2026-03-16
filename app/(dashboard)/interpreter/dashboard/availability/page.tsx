'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { PageHeader, GhostButton } from '@/components/dashboard/interpreter/shared'

type DayStatus = 'available' | 'request' | 'unavailable'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const STATUS_STYLES: Record<DayStatus, { color: string; label: string }> = {
  available: { color: 'var(--accent)', label: 'Standard hours' },
  request: { color: '#f97316', label: 'By request' },
  unavailable: { color: 'var(--border)', label: 'Not available' },
}

export default function AvailabilityPage() {
  const [days, setDays] = useState<Record<string, DayStatus>>({
    Monday: 'available', Tuesday: 'available', Wednesday: 'available',
    Thursday: 'available', Friday: 'request', Saturday: 'unavailable', Sunday: 'unavailable',
  })
  const [startTime, setStartTime] = useState('9:00 AM')
  const [endTime, setEndTime] = useState('6:00 PM')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  function cycleDay(day: string) {
    const order: DayStatus[] = ['available', 'request', 'unavailable']
    const current = days[day]
    const next = order[(order.indexOf(current) + 1) % order.length]
    setDays(prev => ({ ...prev, [day]: next }))
  }

  const inputStyle = {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '9px 12px',
    color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.88rem', outline: 'none',
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <PageHeader title="Availability" subtitle="Set your working status for each day. Requesters see this on your profile." />

      {/* Timezone */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>Your Timezone</div>
          <div style={{ fontSize: '0.9rem' }}>Pacific Time (UTC−8)</div>
        </div>
        <GhostButton>Change Timezone</GhostButton>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20, fontSize: '0.8rem', color: 'var(--muted)', alignItems: 'center' }}>
        {Object.entries(STATUS_STYLES).map(([key, s]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            {s.label}
          </span>
        ))}
      </div>

      {/* Day rows */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 20 }}>
        {DAYS.map((day, i) => {
          const status = days[day]
          const s = STATUS_STYLES[status]
          return (
            <div
              key={day}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 22px',
                borderBottom: i < DAYS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500, minWidth: 90 }}>{day}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{s.label}</span>
              </div>
              <button
                onClick={() => cycleDay(day)}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
                  fontSize: '0.75rem', padding: '5px 14px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
              >
                Change
              </button>
            </div>
          )
        })}
      </div>

      {/* Standard hours */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>Standard Working Hours</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>Start time</label>
            <select value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            >
              {['7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>End time</label>
            <select value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            >
              {['3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 12, lineHeight: 1.5 }}>
          These hours apply to all days marked as Standard. Days marked By Request have no set hours. Requesters know to enquire first.
        </p>
      </div>

      {/* Note to requesters */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
          Note to Requesters <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.75rem' }}>(optional)</span>
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Available for urgent requests outside standard hours — please message first. Taking on limited bookings in April due to conference commitments."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
            outline: 'none', resize: 'vertical', minHeight: 80,
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>

      <div style={{
        position: 'sticky', bottom: 0, zIndex: 20,
        background: 'var(--card-bg)', borderTop: '1px solid var(--border)',
        padding: '14px 24px', marginTop: 16,
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <button
          className="btn-primary"
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          style={{ padding: '11px 28px' }}
        >
          {saved ? 'Saved ✓' : 'Save Availability'}
        </button>
      </div>
    </div>
  )
}
