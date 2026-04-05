'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const MAX_INTERPRETERS = 10

interface RosterInterpreter {
  id: string
  name: string
  photo_url: string | null
  avatar_color: string | null
  initials: string
  tier: 'preferred' | 'secondary'
  certifications: string[]
  specializations: string[]
}

export default function RequesterInterpreterPicker({
  selectedIds,
  onChange,
  excludeIds = [],
}: {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  excludeIds?: string[]
}) {
  const [interpreters, setInterpreters] = useState<RosterInterpreter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRoster() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Step 1: Fetch roster rows
      const { data: rosterRows, error: rosterErr } = await supabase
        .from('requester_roster')
        .select('interpreter_id, tier')
        .eq('requester_user_id', user.id)

      if (rosterErr) {
        console.error('[RequesterInterpreterPicker] roster fetch error:', rosterErr.message)
        setLoading(false)
        return
      }

      if (!rosterRows || rosterRows.length === 0) {
        setLoading(false)
        return
      }

      const interpIds = rosterRows.map(r => r.interpreter_id)
      const tierMap: Record<string, string> = {}
      for (const r of rosterRows) tierMap[r.interpreter_id] = r.tier

      // Step 2: Fetch interpreter profiles (separate query to avoid RLS join issues)
      const { data: profiles, error: profileErr } = await supabase
        .from('interpreter_profiles')
        .select('id, first_name, last_name, name, photo_url, avatar_color, specializations')
        .in('id', interpIds)

      if (profileErr) {
        console.error('[RequesterInterpreterPicker] profiles fetch error:', profileErr.message)
        setLoading(false)
        return
      }

      // Step 3: Fetch certifications
      const { data: certs } = await supabase
        .from('interpreter_certifications')
        .select('interpreter_id, name')
        .in('interpreter_id', interpIds)

      const certsMap: Record<string, string[]> = {}
      for (const c of certs || []) {
        if (!certsMap[c.interpreter_id]) certsMap[c.interpreter_id] = []
        certsMap[c.interpreter_id].push(c.name)
      }

      // Step 4: Map to display objects
      const mapped: RosterInterpreter[] = (profiles || [])
        .filter(p => tierMap[p.id] === 'preferred' || tierMap[p.id] === 'secondary')
        .map(p => {
          const firstName = p.first_name || ''
          const lastName = p.last_name || ''
          const displayName = firstName ? `${firstName} ${lastName}`.trim() : p.name || 'Interpreter'
          const initials = firstName
            ? `${firstName[0]}${(lastName[0] || '')}`.toUpperCase()
            : (p.name || 'I')[0].toUpperCase()

          return {
            id: p.id,
            name: displayName,
            photo_url: p.photo_url,
            avatar_color: p.avatar_color,
            initials,
            tier: tierMap[p.id] as 'preferred' | 'secondary',
            certifications: certsMap[p.id] || [],
            specializations: (p.specializations as string[]) || [],
          }
        })

      // Filter out excluded interpreters (already in previous waves)
      const filtered = excludeIds.length > 0
        ? mapped.filter(i => !excludeIds.includes(i.id))
        : mapped

      // Sort: preferred first, then alphabetical
      filtered.sort((a, b) => {
        if (a.tier === 'preferred' && b.tier !== 'preferred') return -1
        if (a.tier !== 'preferred' && b.tier === 'preferred') return 1
        return a.name.localeCompare(b.name)
      })

      setInterpreters(filtered)
      setLoading(false)
    }
    fetchRoster()
  }, [])

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id))
    } else if (selectedIds.length < MAX_INTERPRETERS) {
      onChange([...selectedIds, id])
    }
  }

  function selectAllPreferred() {
    const preferredIds = interpreters.filter(i => i.tier === 'preferred').map(i => i.id)
    const merged = [...new Set([...selectedIds, ...preferredIds])].slice(0, MAX_INTERPRETERS)
    onChange(merged)
  }

  function selectAll() {
    onChange(interpreters.map(i => i.id).slice(0, MAX_INTERPRETERS))
  }

  if (loading) {
    return <div style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '12px 0' }}>Loading your interpreter list...</div>
  }

  if (interpreters.length === 0) {
    return (
      <div style={{
        border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
          No interpreters on your list yet.
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
          Add interpreters from the directory to build your preferred roster.
        </p>
        <a
          href="/directory?context=requester"
          className="btn-primary"
          style={{ display: 'inline-block', padding: '10px 22px', fontSize: '0.85rem', textDecoration: 'none' }}
        >
          Browse the directory to add interpreters
        </a>
      </div>
    )
  }

  const hasPreferred = interpreters.some(i => i.tier === 'preferred')
  const atLimit = selectedIds.length >= MAX_INTERPRETERS

  return (
    <div>
      {/* Counter + quick actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hasPreferred && (
            <button
              type="button"
              onClick={selectAllPreferred}
              style={{
                background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
                borderRadius: 'var(--radius-sm)', padding: '6px 14px',
                color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600,
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
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '6px 14px',
              color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 600,
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
        <span style={{
          fontSize: '0.82rem', fontWeight: 600,
          color: atLimit ? 'var(--accent3)' : 'var(--muted)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {selectedIds.length} of {MAX_INTERPRETERS} selected
        </span>
      </div>

      {/* Interpreter cards */}
      <div className="req-interp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {interpreters.map(interp => {
          const selected = selectedIds.includes(interp.id)
          const disabled = !selected && atLimit

          return (
            <label
              key={interp.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px', cursor: disabled ? 'not-allowed' : 'pointer',
                background: selected ? 'rgba(0,229,255,0.06)' : 'var(--surface2)',
                border: `1px solid ${selected ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.15s',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={selected}
                disabled={disabled}
                onChange={() => toggle(interp.id)}
                style={{ width: 18, height: 18, accentColor: '#00e5ff', flexShrink: 0, marginTop: 2 }}
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
                  background: interp.avatar_color || 'linear-gradient(135deg, #7b61ff, #00e5ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.78rem', color: '#fff',
                }}>
                  {interp.initials}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name + tier badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
                    {interp.name}
                  </span>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px',
                    borderRadius: 100, whiteSpace: 'nowrap',
                    background: interp.tier === 'preferred' ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.06)',
                    color: interp.tier === 'preferred' ? 'var(--accent)' : 'var(--muted)',
                    border: `1px solid ${interp.tier === 'preferred' ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
                    fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    {interp.tier === 'preferred' ? 'Preferred' : 'Secondary'}
                  </span>
                </div>

                {/* Certifications */}
                {interp.certifications.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 3 }}>
                    {interp.certifications.slice(0, 3).map(cert => (
                      <span key={cert} style={{
                        padding: '1px 8px', borderRadius: 20,
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--muted)', fontSize: '0.7rem', fontWeight: 500,
                      }}>
                        {cert}
                      </span>
                    ))}
                  </div>
                )}

                {/* Specializations */}
                {interp.specializations.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#96a0b8', lineHeight: 1.4 }}>
                    {interp.specializations.slice(0, 3).join(', ')}
                  </div>
                )}
              </div>
            </label>
          )
        })}
      </div>

      {/* Browse directory link */}
      <div style={{ marginTop: 14 }}>
        <a
          href="/directory?context=requester"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(0,229,255,0.04)', border: '1px dashed rgba(0,229,255,0.2)',
            color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600,
            textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.15s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Browse directory for more interpreters
        </a>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .req-interp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
