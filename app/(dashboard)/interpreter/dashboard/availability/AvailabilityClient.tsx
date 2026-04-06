'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader, GhostButton } from '@/components/dashboard/interpreter/shared'
import CalendarSyncCard from '@/components/dashboard/interpreter/CalendarSyncCard'

/* ── Types ── */

interface AwayPeriod {
  id: string
  start_date: string
  end_date: string
  message: string
  dim_profile: boolean
}

interface DaySchedule {
  interpreter_id: string
  day_of_week: number
  status: 'available' | 'by_request' | 'not_available'
  start_time: string | null
  end_time: string | null
}

type DayStatus = 'available' | 'by_request' | 'not_available'

/* ── Constants ── */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const STATUS_CONFIG: Record<DayStatus, { color: string; label: string; dot: string }> = {
  available: { color: '#00e5ff', label: 'Available', dot: '#00e5ff' },
  by_request: { color: '#f59e0b', label: 'By request', dot: '#f59e0b' },
  not_available: { color: 'var(--border)', label: 'Not available', dot: '#555' },
}

const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    const mStr = m === 0 ? '00' : '30'
    TIME_OPTIONS.push(`${h12}:${mStr} ${ampm}`)
  }
}

function timeDisplayTo24(display: string): string {
  const match = display.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return '09:00'
  let h = parseInt(match[1])
  const m = match[2]
  const ampm = match[3].toUpperCase()
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m}`
}

function time24ToDisplay(t: string | null): string {
  if (!t) return ''
  const [hStr, mStr] = t.split(':')
  let h = parseInt(hStr)
  const m = mStr || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

const DEFAULT_SCHEDULE: Omit<DaySchedule, 'interpreter_id'>[] = [
  { day_of_week: 0, status: 'not_available', start_time: null, end_time: null },
  { day_of_week: 1, status: 'available', start_time: '09:00', end_time: '17:00' },
  { day_of_week: 2, status: 'available', start_time: '09:00', end_time: '17:00' },
  { day_of_week: 3, status: 'available', start_time: '09:00', end_time: '17:00' },
  { day_of_week: 4, status: 'available', start_time: '09:00', end_time: '17:00' },
  { day_of_week: 5, status: 'available', start_time: '09:00', end_time: '17:00' },
  { day_of_week: 6, status: 'not_available', start_time: null, end_time: null },
]

const AWAY_MESSAGES = [
  'On vacation. Back [end_date].',
  'Away for a conference. Returning [end_date].',
  'On parental leave. Returning [end_date].',
  'Taking a personal break. Back [end_date].',
]

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateForMessage(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function isCurrentlyActive(start: string, end: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return today >= start && today <= end
}

/* ── Toast ── */

function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: '#1a1a2e', border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-sm)', padding: '10px 18px',
      color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600,
      fontFamily: "'Inter', sans-serif",
      animation: 'fadeIn 0.2s ease-out',
    }}>
      {message}
    </div>
  )
}

/* ── Main Component ── */

export default function AvailabilityClient({
  interpreterProfileId,
  calendarToken,
}: {
  interpreterProfileId: string | null
  calendarToken: string | null
}) {
  const [awayPeriods, setAwayPeriods] = useState<AwayPeriod[]>([])
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [showAwayModal, setShowAwayModal] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null)
  const [savedRows, setSavedRows] = useState<Record<number, boolean>>({})
  const [currentCalendarToken, setCurrentCalendarToken] = useState(calendarToken || '')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  /* ── Load data ── */
  useEffect(() => {
    if (!interpreterProfileId) { setLoading(false); return }
    const supabase = createClient()

    async function load() {
      const today = new Date().toISOString().split('T')[0]

      const [awayRes, schedRes] = await Promise.all([
        supabase
          .from('interpreter_away_periods')
          .select('*')
          .eq('interpreter_id', interpreterProfileId!)
          .gte('end_date', today)
          .order('start_date', { ascending: true }),
        supabase
          .from('interpreter_availability')
          .select('*')
          .eq('interpreter_id', interpreterProfileId!)
          .order('day_of_week', { ascending: true }),
      ])

      if (awayRes.data) setAwayPeriods(awayRes.data)

      if (schedRes.data && schedRes.data.length > 0) {
        setSchedule(schedRes.data)
      } else {
        // Use defaults for new interpreters
        setSchedule(DEFAULT_SCHEDULE.map(d => ({
          ...d,
          interpreter_id: interpreterProfileId!,
        })))
      }
      setLoading(false)
    }
    load()
  }, [interpreterProfileId])

  /* ── Away period handlers ── */

  const nonExpiredCount = awayPeriods.length // already filtered by query

  async function removeAwayPeriod(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('interpreter_away_periods')
      .delete()
      .eq('id', id)
    if (error) {
      showToast('Failed to remove away period')
    } else {
      setAwayPeriods(prev => prev.filter(p => p.id !== id))
      showToast('Away period removed')
    }
    setRemoveConfirm(null)
  }

  async function updateVisibility(id: string, dimProfile: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from('interpreter_away_periods')
      .update({ dim_profile: dimProfile })
      .eq('id', id)
    if (error) {
      showToast('Failed to update visibility')
    } else {
      setAwayPeriods(prev => prev.map(p => p.id === id ? { ...p, dim_profile: dimProfile } : p))
    }
  }

  /* ── Schedule handlers ── */

  const savingRef = useRef(false)

  async function saveDay(dayOfWeek: number, updates: Partial<DaySchedule>) {
    if (!interpreterProfileId || savingRef.current) return
    savingRef.current = true

    const current = schedule.find(s => s.day_of_week === dayOfWeek)
    const row = {
      interpreter_id: interpreterProfileId,
      day_of_week: dayOfWeek,
      status: updates.status ?? current?.status ?? 'available',
      start_time: updates.start_time !== undefined ? updates.start_time : (current?.start_time ?? null),
      end_time: updates.end_time !== undefined ? updates.end_time : (current?.end_time ?? null),
    }

    // Clear times if not_available
    if (row.status === 'not_available') {
      row.start_time = null
      row.end_time = null
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('interpreter_availability')
      .upsert(row, { onConflict: 'interpreter_id,day_of_week' })

    if (error) {
      showToast('Failed to save')
    } else {
      setSchedule(prev => {
        const exists = prev.find(s => s.day_of_week === dayOfWeek)
        if (exists) return prev.map(s => s.day_of_week === dayOfWeek ? row : s)
        return [...prev, row].sort((a, b) => a.day_of_week - b.day_of_week)
      })
      setSavedRows(prev => ({ ...prev, [dayOfWeek]: true }))
      setTimeout(() => setSavedRows(prev => ({ ...prev, [dayOfWeek]: false })), 2000)
    }
    savingRef.current = false
  }

  function handleStatusChange(dayOfWeek: number, newStatus: DayStatus) {
    // Optimistic update
    setSchedule(prev => prev.map(s => {
      if (s.day_of_week !== dayOfWeek) return s
      return {
        ...s,
        status: newStatus,
        start_time: newStatus === 'not_available' ? null : s.start_time,
        end_time: newStatus === 'not_available' ? null : s.end_time,
      }
    }))
    saveDay(dayOfWeek, { status: newStatus })
  }

  function handleTimeChange(dayOfWeek: number, field: 'start_time' | 'end_time', value: string) {
    const time24 = timeDisplayTo24(value)
    setSchedule(prev => prev.map(s =>
      s.day_of_week === dayOfWeek ? { ...s, [field]: time24 } : s
    ))
    saveDay(dayOfWeek, { [field]: time24 })
  }

  if (loading) {
    return (
      <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
        <PageHeader title="Availability" subtitle="Set your working status for each day. Requesters see this on your profile." />
        <div style={{ color: 'var(--muted)', fontSize: '0.9rem', padding: 40, textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '7px 10px',
    color: 'var(--text)', fontFamily: "'Inter', sans-serif",
    fontSize: '0.82rem', outline: 'none', cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2300e5ff' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 28,
  }

  // Reorder days: Mon-Sun
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
      <PageHeader title="Availability" subtitle="Set your working status for each day. Requesters see this on your profile." />

      {/* ── TIMEZONE ── */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '18px 22px', marginBottom: 34,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 4 }}>Your Timezone</div>
          <div style={{ fontSize: '0.9rem' }}>Pacific Time (UTC-8)</div>
        </div>
        <GhostButton>Change Timezone</GhostButton>
      </div>

      {/* ── AWAY PERIODS ── */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 34,
      }}>
        <div style={{
          fontWeight: 600, fontSize: '13px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#00e5ff', marginBottom: 16,
        }}>
          Away Periods
        </div>

        {awayPeriods.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No upcoming away periods.</span>
            <button onClick={() => setShowAwayModal(true)} style={{
              background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
              color: 'var(--accent)', borderRadius: 8, padding: '8px 16px',
              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}>
              + Schedule time away
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {awayPeriods.map(period => {
                const active = isCurrentlyActive(period.start_date, period.end_date)
                const daysAway = daysUntil(period.start_date)
                return (
                  <div key={period.id} style={{
                    background: 'var(--surface2)', border: `1px solid ${active ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '16px 20px',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', fontFamily: "'Inter', sans-serif" }}>
                        {formatDateShort(period.start_date)} — {formatDateShort(period.end_date)}
                      </span>
                      <button
                        onClick={() => setRemoveConfirm(period.id)}
                        style={{
                          background: 'none', border: '1px solid var(--border)',
                          borderRadius: 6, padding: '4px 12px', fontSize: '0.75rem',
                          color: 'var(--muted)', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    {/* Message */}
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: 12 }}>
                      &ldquo;{period.message}&rdquo;
                    </div>

                    {/* Visibility dropdown */}
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginRight: 8 }}>Directory visibility:</span>
                      <select
                        value={period.dim_profile ? 'dimmed' : 'full'}
                        onChange={(e) => updateVisibility(period.id, e.target.value === 'dimmed')}
                        style={{ ...selectStyle, fontSize: '0.78rem', padding: '5px 28px 5px 8px' }}
                      >
                        <option value="full">Full visibility</option>
                        <option value="dimmed">Dimmed</option>
                      </select>
                    </div>

                    {/* Visibility explanation */}
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>
                      {period.dim_profile ? (
                        <>Requesters will see &ldquo;Away until {formatDateShort(period.end_date)}&rdquo; near your Request Booking button. Your profile card will appear slightly faded in directory search results.</>
                      ) : (
                        <>Requesters will see &ldquo;Away until {formatDateShort(period.end_date)}&rdquo; near your Request Booking button. Your profile will appear normally in search results.</>
                      )}
                    </div>

                    {/* Status */}
                    {active ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#34d399' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                        Currently active
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Starts in {daysAway} day{daysAway !== 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Remove confirmation */}
                    {removeConfirm === period.id && (
                      <div style={{
                        marginTop: 12, padding: '12px 16px', background: 'rgba(255,107,133,0.08)',
                        border: '1px solid rgba(255,107,133,0.25)', borderRadius: 8,
                      }}>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 }}>
                          Remove this away period? {active && 'If it\'s currently active, your profile will return to normal immediately.'}
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => removeAwayPeriod(period.id)}
                            style={{
                              background: 'rgba(255,107,133,0.15)', border: '1px solid rgba(255,107,133,0.4)',
                              color: '#ff6b85', borderRadius: 6, padding: '6px 14px',
                              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Yes, remove
                          </button>
                          <button
                            onClick={() => setRemoveConfirm(null)}
                            style={{
                              background: 'none', border: '1px solid var(--border)',
                              color: 'var(--muted)', borderRadius: 6, padding: '6px 14px',
                              fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {nonExpiredCount < 3 && (
              <button onClick={() => setShowAwayModal(true)} style={{
                marginTop: 14, background: 'rgba(0,229,255,0.1)',
                border: '1px solid rgba(0,229,255,0.3)',
                color: 'var(--accent)', borderRadius: 8, padding: '8px 16px',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}>
                + Schedule time away
              </button>
            )}
          </>
        )}
      </div>

      {/* ── WEEKLY SCHEDULE ── */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 34,
      }}>
        <div style={{
          fontWeight: 600, fontSize: '13px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#00e5ff', marginBottom: 16,
        }}>
          Weekly Schedule
        </div>

        <div className="avail-schedule-grid" style={{ display: 'flex', flexDirection: 'column' }}>
          {orderedDays.map((dow, i) => {
            const day = schedule.find(s => s.day_of_week === dow) || {
              interpreter_id: interpreterProfileId || '',
              day_of_week: dow,
              status: 'not_available' as DayStatus,
              start_time: null,
              end_time: null,
            }
            const cfg = STATUS_CONFIG[day.status]
            const showTimes = day.status !== 'not_available'
            const isLast = i === orderedDays.length - 1

            return (
              <div
                key={dow}
                className="avail-day-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 0',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  flexWrap: 'wrap',
                }}
              >
                {/* Dot */}
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: cfg.dot, flexShrink: 0,
                }} />

                {/* Day name */}
                <span className="avail-day-name" style={{
                  fontWeight: 700, fontSize: '0.9rem', minWidth: 100,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {DAY_NAMES[dow]}
                </span>

                {/* Status dropdown */}
                <select
                  value={day.status}
                  onChange={e => handleStatusChange(dow, e.target.value as DayStatus)}
                  style={{
                    ...selectStyle,
                    color: cfg.color,
                    minWidth: 130,
                  }}
                >
                  <option value="available" style={{ color: '#00e5ff' }}>Available</option>
                  <option value="by_request" style={{ color: '#f59e0b' }}>By request</option>
                  <option value="not_available" style={{ color: '#999' }}>Not available</option>
                </select>

                {/* Time dropdowns */}
                {showTimes && (
                  <div className="avail-time-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                      value={time24ToDisplay(day.start_time)}
                      onChange={e => handleTimeChange(dow, 'start_time', e.target.value)}
                      style={{ ...selectStyle, minWidth: 110 }}
                    >
                      <option value="">--</option>
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>&mdash;</span>
                    <select
                      value={time24ToDisplay(day.end_time)}
                      onChange={e => handleTimeChange(dow, 'end_time', e.target.value)}
                      style={{ ...selectStyle, minWidth: 110 }}
                    >
                      <option value="">--</option>
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}

                {/* By request helper */}
                {day.status === 'by_request' && !day.start_time && !day.end_time && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                    Optional. Leave blank if your hours vary.
                  </span>
                )}

                {/* Saved indicator */}
                {savedRows[dow] && (
                  <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                    Saved
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CALENDAR SYNC ── */}
      {currentCalendarToken && (
        <CalendarSyncCard
          calendarToken={currentCalendarToken}
          onTokenChange={setCurrentCalendarToken}
          onToast={showToast}
        />
      )}

      {/* ── AWAY MODAL ── */}
      {showAwayModal && (
        <AwayModal
          interpreterProfileId={interpreterProfileId!}
          existingPeriods={awayPeriods}
          onClose={() => setShowAwayModal(false)}
          onSaved={(newPeriod) => {
            setAwayPeriods(prev => [...prev, newPeriod].sort((a, b) => (a.start_date || '').localeCompare(b.start_date || '')))
            setShowAwayModal(false)
            showToast('Away period saved')
          }}
        />
      )}

      {toast && <Toast message={toast} />}

      <style>{`
        @media (max-width: 768px) {
          .dash-page-content { padding: 20px 16px !important; }
          .avail-day-row { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .avail-day-name { min-width: auto !important; }
          .avail-time-row { width: 100%; }
        }
      `}</style>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   AWAY MODAL
   ══════════════════════════════════════════════════════ */

function AwayModal({
  interpreterProfileId,
  existingPeriods,
  onClose,
  onSaved,
}: {
  interpreterProfileId: string
  existingPeriods: AwayPeriod[]
  onClose: () => void
  onSaved: (p: AwayPeriod) => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [messageChoice, setMessageChoice] = useState(0) // index into AWAY_MESSAGES, 4 = custom
  const [customMessage, setCustomMessage] = useState('')
  const [dimProfile, setDimProfile] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const endDateFormatted = formatDateForMessage(endDate)

  function getResolvedMessage(): string {
    if (messageChoice === 4) return customMessage
    return AWAY_MESSAGES[messageChoice].replace('[end_date]', endDateFormatted)
  }

  function validate(): string[] {
    const errs: string[] = []
    if (!startDate) errs.push('Start date is required.')
    if (!endDate) errs.push('End date is required.')
    if (startDate && endDate && endDate < startDate) errs.push('End date must be on or after start date.')
    if (startDate < today) errs.push('Start date cannot be in the past.')

    const msg = getResolvedMessage()
    if (!msg.trim()) errs.push('Message is required.')
    if (msg.length > 200) errs.push('Message must be 200 characters or fewer.')

    // Overlap check
    for (const p of existingPeriods) {
      if (startDate <= p.end_date && endDate >= p.start_date) {
        errs.push(`Overlaps with existing period ${formatDateShort(p.start_date)} — ${formatDateShort(p.end_date)}.`)
        break
      }
    }

    return errs
  }

  async function handleSave() {
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setSaving(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('interpreter_away_periods')
      .insert({
        interpreter_id: interpreterProfileId,
        start_date: startDate,
        end_date: endDate,
        message: getResolvedMessage(),
        dim_profile: dimProfile,
      })
      .select()
      .single()

    setSaving(false)
    if (error) {
      setErrors([error.message || 'Failed to save away period.'])
    } else if (data) {
      onSaved(data)
    }
  }

  const dateInputStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '9px 12px',
    color: 'var(--text)', fontFamily: "'Inter', sans-serif",
    fontSize: '0.88rem', outline: 'none', width: '100%',
    colorScheme: 'dark',
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '7px 10px',
    color: 'var(--text)', fontFamily: "'Inter', sans-serif",
    fontSize: '0.82rem', outline: 'none', cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2300e5ff' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 28,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '28px 32px',
          maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', fontWeight: 750,
          marginBottom: 24,
        }}>
          Schedule Time Away
        </div>

        {/* Date range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>Start date</label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={e => setStartDate(e.target.value)}
              style={dateInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>End date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={e => setEndDate(e.target.value)}
              style={dateInputStyle}
            />
          </div>
        </div>

        {/* Message selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 10 }}>Message to requesters</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {AWAY_MESSAGES.map((template, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="radio"
                  name="awayMsg"
                  checked={messageChoice === idx}
                  onChange={() => setMessageChoice(idx)}
                  style={{ accentColor: '#00e5ff' }}
                />
                <span style={{ color: 'var(--text)' }}>
                  {template.replace('[end_date]', endDateFormatted)}
                </span>
              </label>
            ))}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="radio"
                name="awayMsg"
                checked={messageChoice === 4}
                onChange={() => setMessageChoice(4)}
                style={{ accentColor: '#00e5ff', marginTop: 3 }}
              />
              <span style={{ color: 'var(--text)' }}>Write your own</span>
            </label>
            {messageChoice === 4 && (
              <div style={{ marginLeft: 26 }}>
                <input
                  type="text"
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  maxLength={200}
                  placeholder="Your away message..."
                  style={{
                    ...dateInputStyle, width: '100%',
                    fontSize: '0.85rem', padding: '8px 12px',
                  }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>
                  {customMessage.length}/200
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visibility */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 6 }}>Directory visibility</label>
          <select
            value={dimProfile ? 'dimmed' : 'full'}
            onChange={e => setDimProfile(e.target.value === 'dimmed')}
            style={selectStyle}
          >
            <option value="full">Full visibility</option>
            <option value="dimmed">Dimmed</option>
          </select>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: 8 }}>
            {dimProfile ? (
              <>Requesters will see &ldquo;Away until {formatDateShort(endDate)}&rdquo; near your Request Booking button. Your profile card will appear slightly faded in directory search results.</>
            ) : (
              <>Requesters will see &ldquo;Away until {formatDateShort(endDate)}&rdquo; near your Request Booking button. Your profile will appear normally in search results.</>
            )}
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.25)', borderRadius: 8 }}>
            {errors.map((e, i) => (
              <div key={i} style={{ color: '#ff6b85', fontSize: '0.82rem', lineHeight: 1.5 }}>{e}</div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--muted)', borderRadius: 8, padding: '10px 20px',
              fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.85rem', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
