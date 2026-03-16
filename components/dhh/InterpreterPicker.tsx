'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RosterInterpreter {
  id: string // interpreter_profiles.id
  name: string
  photo_url: string | null
  tier: string
  initials: string
}

export default function InterpreterPicker({
  selectedIds,
  onChange,
  userId,
}: {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  userId: string
}) {
  const [interpreters, setInterpreters] = useState<RosterInterpreter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()

      // Get deaf_roster entries for this user
      const { data: roster, error: rosterError } = await supabase
        .from('deaf_roster')
        .select('interpreter_id, tier')
        .eq('deaf_user_id', userId)
        .in('tier', ['preferred', 'approved'])

      if (rosterError) {
        console.error('[InterpreterPicker] roster fetch failed:', rosterError.message)
        setLoading(false)
        return
      }

      if (!roster || roster.length === 0) {
        setLoading(false)
        return
      }

      const interpIds = roster.map(r => r.interpreter_id)
      const tierMap: Record<string, string> = {}
      for (const r of roster) {
        tierMap[r.interpreter_id] = r.tier
      }

      // Fetch interpreter profiles
      const { data: profiles, error: profileError } = await supabase
        .from('interpreter_profiles')
        .select('id, name, first_name, last_name, photo_url')
        .in('id', interpIds)

      if (profileError) {
        console.error('[InterpreterPicker] profiles fetch failed:', profileError.message)
        setLoading(false)
        return
      }

      const mapped: RosterInterpreter[] = (profiles || []).map(p => {
        const displayName = p.first_name
          ? `${p.first_name} ${p.last_name || ''}`.trim()
          : p.name || 'Interpreter'
        const initials = p.first_name
          ? `${p.first_name[0]}${p.last_name?.[0] || ''}`.toUpperCase()
          : (p.name || 'I')[0].toUpperCase()
        return {
          id: p.id,
          name: displayName,
          photo_url: p.photo_url,
          tier: tierMap[p.id] || 'approved',
          initials,
        }
      })

      // Sort preferred first
      mapped.sort((a, b) => {
        if (a.tier === 'preferred' && b.tier !== 'preferred') return -1
        if (a.tier !== 'preferred' && b.tier === 'preferred') return 1
        return a.name.localeCompare(b.name)
      })

      // If there are pre-selected IDs not in the roster (e.g. from directory ?interpreter= param), fetch those too
      const rosterIds = new Set(mapped.map(m => m.id))
      const extraIds = selectedIds.filter(id => !rosterIds.has(id))
      if (extraIds.length > 0) {
        const { data: extraProfiles } = await supabase
          .from('interpreter_profiles')
          .select('id, name, first_name, last_name, photo_url')
          .in('id', extraIds)
        if (extraProfiles) {
          for (const p of extraProfiles) {
            const displayName = p.first_name
              ? `${p.first_name} ${p.last_name || ''}`.trim()
              : p.name || 'Interpreter'
            const initials = p.first_name
              ? `${p.first_name[0]}${p.last_name?.[0] || ''}`.toUpperCase()
              : (p.name || 'I')[0].toUpperCase()
            mapped.push({ id: p.id, name: displayName, photo_url: p.photo_url, tier: 'directory', initials })
          }
        }
      }

      setInterpreters(mapped)
      setLoading(false)
    }
    fetch()
  }, [userId, selectedIds])

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function selectAllPreferred() {
    const preferredIds = interpreters.filter(i => i.tier === 'preferred').map(i => i.id)
    const merged = [...new Set([...selectedIds, ...preferredIds])]
    onChange(merged)
  }

  function selectAll() {
    onChange(interpreters.map(i => i.id))
  }

  if (loading) {
    return <div style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '12px 0' }}>Loading your interpreter list...</div>
  }

  if (interpreters.length === 0) {
    return (
      <div style={{
        border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
        padding: '24px', textAlign: 'center', color: 'var(--muted)',
        fontSize: '0.88rem', lineHeight: 1.6,
      }}>
        You haven&apos;t added any preferred interpreters yet.{' '}
        <a href="/directory" style={{ color: '#9d87ff', textDecoration: 'underline' }}>
          Browse the directory
        </a>{' '}
        to find interpreters you trust.
      </div>
    )
  }

  const hasPreferred = interpreters.some(i => i.tier === 'preferred')

  return (
    <div>
      {/* Quick select buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {hasPreferred && (
          <button
            type="button"
            onClick={selectAllPreferred}
            style={{
              background: 'rgba(157,135,255,0.1)', border: '1px solid rgba(157,135,255,0.3)',
              borderRadius: 'var(--radius-sm)', padding: '6px 14px',
              color: '#9d87ff', fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Select All Preferred
          </button>
        )}
        <button
          type="button"
          onClick={selectAll}
          style={{
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: 'var(--radius-sm)', padding: '6px 14px',
            color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Select All
        </button>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '6px 14px',
              color: 'var(--muted)', fontSize: '0.78rem',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Interpreter cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {interpreters.map(interp => {
          const selected = selectedIds.includes(interp.id)
          return (
            <label
              key={interp.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', cursor: 'pointer',
                background: selected ? 'rgba(157,135,255,0.06)' : 'var(--surface2)',
                border: `1px solid ${selected ? 'rgba(157,135,255,0.4)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(interp.id)}
                style={{ width: 18, height: 18, accentColor: '#9d87ff', flexShrink: 0 }}
              />

              {/* Avatar */}
              {interp.photo_url ? (
                <img
                  src={interp.photo_url}
                  alt=""
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.78rem', color: '#fff',
                }}>
                  {interp.initials}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{interp.name}</div>
              </div>

              {/* Tier badge */}
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                borderRadius: 100, whiteSpace: 'nowrap',
                background: interp.tier === 'preferred' ? 'rgba(157,135,255,0.12)' : interp.tier === 'directory' ? 'rgba(255,255,255,0.06)' : 'rgba(0,229,255,0.1)',
                color: interp.tier === 'preferred' ? '#9d87ff' : interp.tier === 'directory' ? 'var(--muted)' : 'var(--accent)',
                border: `1px solid ${interp.tier === 'preferred' ? 'rgba(157,135,255,0.3)' : interp.tier === 'directory' ? 'var(--border)' : 'rgba(0,229,255,0.25)'}`,
                fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>
                {interp.tier === 'preferred' ? 'Preferred' : interp.tier === 'directory' ? 'Directory' : 'Approved'}
              </span>
            </label>
          )
        })}
      </div>

      {selectedIds.length > 0 && (
        <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--muted)' }}>
          {selectedIds.length} interpreter{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
