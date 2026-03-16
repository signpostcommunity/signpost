'use client'

import { useState } from 'react'

const ORANGE = '#ff7e45'

interface FeedbackItem {
  id: string
  tester_name: string | null
  tester_email: string | null
  feedback_type: string | null
  page: string | null
  page_area: string | null
  notes: string | null
  specific_answer: string | null
  survey_answers: Record<string, unknown> | null
  created_at: string
}

function FeedbackCard({ f }: { f: FeedbackItem }) {
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
            background: f.feedback_type === 'end_of_session' ? 'rgba(157,135,255,0.1)' : `${ORANGE}22`,
            color: f.feedback_type === 'end_of_session' ? 'var(--accent2)' : ORANGE,
          }}>
            {f.feedback_type === 'end_of_session' ? 'End of Session' : 'Page Note'}
          </span>
          {(f.page || f.page_area) && (
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              {f.page_area || f.page}
            </span>
          )}
        </div>
        <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
          {new Date(f.created_at).toLocaleDateString()} {new Date(f.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {f.notes && (
        <div style={{
          padding: 10, borderRadius: 6, background: 'var(--surface)',
          fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5,
          marginBottom: f.specific_answer || f.survey_answers ? 8 : 0,
        }}>
          {f.notes}
        </div>
      )}

      {f.specific_answer && (
        <div style={{ fontSize: '0.85rem', marginBottom: f.survey_answers ? 8 : 0 }}>
          <span style={{ color: 'var(--muted)' }}>Answer: </span>
          <span style={{ color: 'var(--text)' }}>{f.specific_answer}</span>
        </div>
      )}

      {f.survey_answers && Object.keys(f.survey_answers).length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Survey Answers
          </div>
          <div style={{ padding: 10, borderRadius: 6, background: 'var(--surface)', fontSize: '0.82rem' }}>
            {Object.entries(f.survey_answers).map(([key, val]) => (
              <div key={key} style={{ marginBottom: 3 }}>
                <span style={{ color: 'var(--muted)' }}>{key}: </span>
                <span style={{ color: 'var(--text)' }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function GroupedView({ feedback }: { feedback: FeedbackItem[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Group by tester email (or name as fallback key)
  const groups = new Map<string, { name: string; email: string; items: FeedbackItem[] }>()
  for (const f of feedback) {
    const key = f.tester_email || f.tester_name || 'anonymous'
    if (!groups.has(key)) {
      groups.set(key, { name: f.tester_name || 'Anonymous', email: f.tester_email || '', items: [] })
    }
    groups.get(key)!.items.push(f)
  }

  // Sort groups by total feedback count descending
  const sortedGroups = [...groups.entries()].sort((a, b) => b[1].items.length - a[1].items.length)

  function toggleCollapse(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sortedGroups.map(([key, group]) => {
        const isCollapsed = collapsed.has(key)
        const pageNotes = group.items.filter(f => f.feedback_type !== 'end_of_session')
        const endOfSession = group.items.filter(f => f.feedback_type === 'end_of_session')

        return (
          <div key={key} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', overflow: 'hidden',
          }}>
            {/* User header */}
            <button
              onClick={() => toggleCollapse(key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '16px 20px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7b61ff, #00e5ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.75rem', color: '#fff',
                }}>
                  {(group.name[0] || '?').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{group.name}</div>
                  {group.email && <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{group.email}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                  background: `${ORANGE}22`, color: ORANGE,
                }}>
                  {group.items.length} submission{group.items.length !== 1 ? 's' : ''}
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{
                  transition: 'transform 0.2s',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                }}>
                  <path d="M3 5l4 4 4-4" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>

            {/* Expandable content */}
            {!isCollapsed && (
              <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pageNotes.length > 0 && (
                  <>
                    {endOfSession.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, marginBottom: 2 }}>
                        Page Notes
                      </div>
                    )}
                    {pageNotes.map(f => <FeedbackCard key={f.id} f={f} />)}
                  </>
                )}
                {endOfSession.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: pageNotes.length > 0 ? 8 : 4, marginBottom: 2 }}>
                      End of Session
                    </div>
                    {endOfSession.map(f => <FeedbackCard key={f.id} f={f} />)}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
      {sortedGroups.length === 0 && (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
          No feedback submissions yet.
        </div>
      )}
    </div>
  )
}

function FlatView({ feedback }: { feedback: FeedbackItem[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {feedback.map(f => (
        <div key={f.id} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                {f.tester_name || 'Anonymous'}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{f.tester_email || ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                background: f.feedback_type === 'end_of_session' ? 'rgba(157,135,255,0.1)' : `${ORANGE}22`,
                color: f.feedback_type === 'end_of_session' ? 'var(--accent2)' : ORANGE,
              }}>
                {f.feedback_type === 'end_of_session' ? 'End of Session' : 'Page Note'}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                {new Date(f.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {(f.page || f.page_area) && (
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 8 }}>
              Page: {f.page_area || f.page || '—'}
            </div>
          )}

          {f.notes && (
            <div style={{
              padding: 12, borderRadius: 8, background: 'var(--surface2)',
              fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5,
              marginBottom: f.specific_answer || f.survey_answers ? 12 : 0,
            }}>
              {f.notes}
            </div>
          )}

          {f.specific_answer && (
            <div style={{ fontSize: '0.85rem', marginBottom: f.survey_answers ? 12 : 0 }}>
              <span style={{ color: 'var(--muted)' }}>Answer: </span>
              <span style={{ color: 'var(--text)' }}>{f.specific_answer}</span>
            </div>
          )}

          {f.survey_answers && Object.keys(f.survey_answers).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Survey Answers
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface2)', fontSize: '0.82rem' }}>
                {Object.entries(f.survey_answers).map(([key, val]) => (
                  <div key={key} style={{ marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted)' }}>{key}: </span>
                    <span style={{ color: 'var(--text)' }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      {feedback.length === 0 && (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
          No feedback submissions yet.
        </div>
      )}
    </div>
  )
}

export default function FeedbackClient({ feedback }: { feedback: FeedbackItem[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped')

  const filtered = feedback.filter(f => {
    if (typeFilter === 'page_note' && f.feedback_type !== 'page_note') return false
    if (typeFilter === 'end_of_session' && f.feedback_type !== 'end_of_session') return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (f.tester_name || '').toLowerCase().includes(q) ||
        (f.notes || '').toLowerCase().includes(q) ||
        (f.tester_email || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const uniqueTesters = new Set(feedback.map(f => f.tester_email || f.tester_name || 'anonymous')).size

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
        Beta Feedback
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24 }}>
        {filtered.length} submission{filtered.length !== 1 ? 's' : ''} from {uniqueTesters} tester{uniqueTesters !== 1 ? 's' : ''}
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by tester name or notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text)', fontSize: '0.85rem',
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text)', fontSize: '0.85rem',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <option value="all">All Types</option>
          <option value="page_note">Page Notes</option>
          <option value="end_of_session">End of Session</option>
        </select>

        {/* View toggle */}
        <div style={{ display: 'flex', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <button
            onClick={() => setViewMode('grouped')}
            style={{
              padding: '6px 14px', border: 'none', fontSize: '0.82rem',
              fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              background: viewMode === 'grouped' ? ORANGE : 'var(--surface2)',
              color: viewMode === 'grouped' ? '#fff' : 'var(--muted)',
              fontWeight: viewMode === 'grouped' ? 600 : 400,
            }}
          >
            Group by user
          </button>
          <button
            onClick={() => setViewMode('flat')}
            style={{
              padding: '6px 14px', border: 'none', borderLeft: '1px solid var(--border)',
              fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              background: viewMode === 'flat' ? ORANGE : 'var(--surface2)',
              color: viewMode === 'flat' ? '#fff' : 'var(--muted)',
              fontWeight: viewMode === 'flat' ? 600 : 400,
            }}
          >
            Show all
          </button>
        </div>
      </div>

      {viewMode === 'grouped' ? (
        <GroupedView feedback={filtered} />
      ) : (
        <FlatView feedback={filtered} />
      )}
    </div>
  )
}
