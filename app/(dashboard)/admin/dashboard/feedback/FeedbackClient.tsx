'use client'

import { useState } from 'react'

const ORANGE = '#ff6b2b'

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

export default function FeedbackClient({ feedback }: { feedback: FeedbackItem[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

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

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
        Beta Feedback
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24 }}>
        {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
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
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(f => (
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
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
        {filtered.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
            No feedback submissions yet.
          </div>
        )}
      </div>
    </div>
  )
}
