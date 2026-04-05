'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const MAX_INTERPRETERS = 10

interface InterpreterItem {
  id: string
  name: string
  certifications: string[]
  specializations: string[]
  tier?: string
  avatar_url?: string | null
  avatar_color?: string | null
  badge?: string
  recommended?: boolean
  is_dnb?: boolean
}

interface InterpreterGroup {
  label: string
  accent: 'purple' | 'cyan'
  interpreters: InterpreterItem[]
  collapsed?: boolean
}

interface RequesterInterpreterPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  excludeIds?: string[]
  interpreterGroups?: InterpreterGroup[]
  showRosterFallback?: boolean
  rosterLabel?: string
  emptyMessage?: string
}

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
  interpreterGroups = [],
  showRosterFallback = true,
  rosterLabel = 'Your roster',
  emptyMessage,
}: RequesterInterpreterPickerProps) {
  const [rosterInterpreters, setRosterInterpreters] = useState<RosterInterpreter[]>([])
  const [rosterLoading, setRosterLoading] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({})

  // Initialize collapsed state from group defaults
  useEffect(() => {
    const initial: Record<number, boolean> = {}
    interpreterGroups.forEach((g, i) => {
      if (g.collapsed) initial[i] = true
    })
    // Roster group is the last one, starts collapsed if there are other groups
    if (interpreterGroups.length > 0) {
      initial[-1] = true // -1 is the roster group key
    }
    setCollapsedGroups(initial)
  }, [interpreterGroups.length])

  // Fetch requester's own roster (for fallback or secondary display)
  useEffect(() => {
    if (!showRosterFallback && interpreterGroups.length > 0) {
      setRosterLoading(false)
      return
    }

    async function fetchRoster() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setRosterLoading(false); return }

      const { data: rosterRows, error: rosterErr } = await supabase
        .from('requester_roster')
        .select('interpreter_id, tier')
        .eq('requester_user_id', user.id)

      if (rosterErr || !rosterRows || rosterRows.length === 0) {
        setRosterLoading(false)
        return
      }

      const interpIds = rosterRows.map(r => r.interpreter_id)
      const tierMap: Record<string, string> = {}
      for (const r of rosterRows) tierMap[r.interpreter_id] = r.tier

      const { data: profiles, error: profileErr } = await supabase
        .from('interpreter_profiles')
        .select('id, first_name, last_name, name, photo_url, avatar_color, specializations')
        .in('id', interpIds)

      if (profileErr) { setRosterLoading(false); return }

      const { data: certs } = await supabase
        .from('interpreter_certifications')
        .select('interpreter_id, name')
        .in('interpreter_id', interpIds)

      const certsMap: Record<string, string[]> = {}
      for (const c of certs || []) {
        if (!certsMap[c.interpreter_id]) certsMap[c.interpreter_id] = []
        certsMap[c.interpreter_id].push(c.name)
      }

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

      const filtered = excludeIds.length > 0
        ? mapped.filter(i => !excludeIds.includes(i.id))
        : mapped

      filtered.sort((a, b) => {
        if (a.tier === 'preferred' && b.tier !== 'preferred') return -1
        if (a.tier !== 'preferred' && b.tier === 'preferred') return 1
        return a.name.localeCompare(b.name)
      })

      setRosterInterpreters(filtered)
      setRosterLoading(false)
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

  function selectAllInGroup(interpreters: InterpreterItem[]) {
    const ids = interpreters.map(i => i.id)
    const merged = [...new Set([...selectedIds, ...ids])].slice(0, MAX_INTERPRETERS)
    onChange(merged)
  }

  function clearGroup(interpreters: InterpreterItem[]) {
    const ids = new Set(interpreters.map(i => i.id))
    onChange(selectedIds.filter(id => !ids.has(id)))
  }

  function toggleGroupCollapse(key: number) {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const atLimit = selectedIds.length >= MAX_INTERPRETERS
  const hasAnyGroups = interpreterGroups.length > 0

  // Build list of all interpreter IDs already shown in groups (to dedupe roster)
  const groupInterpreterIds = new Set<string>()
  for (const g of interpreterGroups) {
    for (const i of g.interpreters) {
      if (!i.is_dnb) groupInterpreterIds.add(i.id)
    }
  }

  // Filter roster to exclude those already shown in groups
  const filteredRoster = hasAnyGroups
    ? rosterInterpreters.filter(i => !groupInterpreterIds.has(i.id))
    : rosterInterpreters

  // If no groups and no roster, show empty state
  if (!hasAnyGroups && !rosterLoading && filteredRoster.length === 0) {
    if (emptyMessage) {
      return <div style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '12px 0' }}>{emptyMessage}</div>
    }
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

  if (rosterLoading && !hasAnyGroups) {
    return <div style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '12px 0' }}>Loading your interpreter list...</div>
  }

  return (
    <div>
      {/* Counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontSize: '0.82rem', fontWeight: 600,
          color: atLimit ? 'var(--accent3)' : 'var(--muted)',
          fontFamily: "'Inter', sans-serif",
        }}>
          {selectedIds.length} of {MAX_INTERPRETERS} selected
        </span>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '5px 12px',
              color: 'var(--muted)', fontSize: '0.75rem',
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Interpreter groups from Deaf lists */}
      {interpreterGroups.map((group, idx) => {
        const visibleInterpreters = group.interpreters.filter(i => !i.is_dnb)
        if (visibleInterpreters.length === 0) return null
        const isCollapsed = collapsedGroups[idx]
        const accentColor = group.accent === 'purple' ? '#a78bfa' : 'var(--accent)'
        const accentBg = group.accent === 'purple' ? 'rgba(167,139,250,0.08)' : 'rgba(0,229,255,0.08)'
        const accentBorder = group.accent === 'purple' ? 'rgba(167,139,250,0.25)' : 'rgba(0,229,255,0.25)'

        return (
          <div key={idx} style={{ marginBottom: 20 }}>
            {/* Group header */}
            <button
              type="button"
              onClick={() => toggleGroupCollapse(idx)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 14px', marginBottom: 10,
                background: accentBg, border: `1px solid ${accentBorder}`,
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <path d="M6 4l4 4-4 4" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: accentColor, fontFamily: "'Inter', sans-serif" }}>
                  {group.label}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: "'Inter', sans-serif" }}>
                  ({visibleInterpreters.length})
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); selectAllInGroup(visibleInterpreters) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); selectAllInGroup(visibleInterpreters) } }}
                  style={{ fontSize: '0.72rem', color: accentColor, cursor: 'pointer', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                >
                  Select all
                </span>
                <span style={{ color: 'var(--border)' }}>|</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); clearGroup(visibleInterpreters) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); clearGroup(visibleInterpreters) } }}
                  style={{ fontSize: '0.72rem', color: 'var(--muted)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
                >
                  Clear
                </span>
              </div>
            </button>

            {/* Group cards */}
            {!isCollapsed && (
              <div className="req-interp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {visibleInterpreters.map(interp => renderCard(interp, accentColor, accentBg, accentBorder))}
              </div>
            )}
          </div>
        )
      })}

      {/* Requester's own roster */}
      {(showRosterFallback || hasAnyGroups) && filteredRoster.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => toggleGroupCollapse(-1)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '10px 14px', marginBottom: 10,
              background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ transform: collapsedGroups[-1] ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                <path d="M6 4l4 4-4 4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)', fontFamily: "'Inter', sans-serif" }}>
                {rosterLabel}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: "'Inter', sans-serif" }}>
                ({filteredRoster.length})
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); selectAllInGroup(filteredRoster.map(r => ({ ...r, avatar_url: r.photo_url }))) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); selectAllInGroup(filteredRoster.map(r => ({ ...r, avatar_url: r.photo_url }))) } }}
                style={{ fontSize: '0.72rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
              >
                Select all
              </span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); clearGroup(filteredRoster.map(r => ({ ...r, avatar_url: r.photo_url }))) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); clearGroup(filteredRoster.map(r => ({ ...r, avatar_url: r.photo_url }))) } }}
                style={{ fontSize: '0.72rem', color: 'var(--muted)', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
              >
                Clear
              </span>
            </div>
          </button>

          {!collapsedGroups[-1] && (
            <div className="req-interp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {filteredRoster.map(interp => {
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
                    {interp.photo_url ? (
                      <img src={interp.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: interp.avatar_color || 'linear-gradient(135deg, #7b61ff, #00e5ff)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.78rem', color: '#fff',
                      }}>
                        {interp.initials}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{interp.name}</span>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px',
                          borderRadius: 100, whiteSpace: 'nowrap',
                          background: interp.tier === 'preferred' ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.06)',
                          color: interp.tier === 'preferred' ? 'var(--accent)' : 'var(--muted)',
                          border: `1px solid ${interp.tier === 'preferred' ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
                          fontFamily: "'Inter', sans-serif", letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}>
                          {interp.tier === 'preferred' ? 'Preferred' : 'Secondary'}
                        </span>
                      </div>
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
          )}
        </div>
      )}

      {/* Browse directory link */}
      <div style={{ marginTop: 14 }}>
        <a
          href="/directory?context=requester"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(0,229,255,0.04)', border: '1px dashed rgba(0,229,255,0.2)',
            color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600,
            textDecoration: 'none', fontFamily: "'Inter', sans-serif",
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

  function renderCard(interp: InterpreterItem, accentColor: string, accentBg: string, accentBorder: string) {
    const selected = selectedIds.includes(interp.id)
    const disabled = !selected && atLimit
    const firstName = interp.name.split(' ')[0] || ''
    const lastName = interp.name.split(' ').slice(1).join(' ')
    const initials = firstName
      ? `${firstName[0]}${(lastName[0] || '')}`.toUpperCase()
      : 'I'

    return (
      <label
        key={interp.id}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 16px', cursor: disabled ? 'not-allowed' : 'pointer',
          background: selected ? accentBg : 'var(--surface2)',
          border: `1px solid ${selected ? accentBorder : 'var(--border)'}`,
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
          style={{ width: 18, height: 18, accentColor: accentColor, flexShrink: 0, marginTop: 2 }}
        />

        {interp.avatar_url ? (
          <img src={interp.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: interp.avatar_color || 'linear-gradient(135deg, #7b61ff, #00e5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.78rem', color: '#fff',
          }}>
            {initials}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{interp.name}</span>
            {interp.recommended && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px',
                borderRadius: 100, whiteSpace: 'nowrap',
                background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
                border: '1px solid rgba(251,191,36,0.3)',
                fontFamily: "'Inter', sans-serif", letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                &#9733; Recommended
              </span>
            )}
            {interp.badge && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px',
                borderRadius: 100, whiteSpace: 'nowrap',
                background: accentBg, color: accentColor,
                border: `1px solid ${accentBorder}`,
                fontFamily: "'Inter', sans-serif", letterSpacing: '0.06em',
              }}>
                {interp.badge}
              </span>
            )}
          </div>
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
          {interp.specializations.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: '#96a0b8', lineHeight: 1.4 }}>
              {interp.specializations.slice(0, 3).join(', ')}
            </div>
          )}
        </div>
      </label>
    )
  }
}
