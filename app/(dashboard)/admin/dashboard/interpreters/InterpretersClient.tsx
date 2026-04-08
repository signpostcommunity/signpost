// TODO: Add rating summary to admin interpreter detail panel
//   - Total ratings, average met_needs / professional scores
//   - Would book again breakdown (% yes / maybe / no)
// TODO: Surface interpreters with 3+ "would not book again" ratings to admin dashboard

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ORANGE = '#ff7e45'

interface InterpreterRow {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  location: string | null
  state: string | null
  country: string | null
  status: string
  draft_step: number | null
  created_at: string
}

export default function InterpretersClient({ interpreters }: { interpreters: InterpreterRow[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  const incomplete = interpreters.filter(i => i.status === 'draft' && (i.draft_step ?? 0) < 6)
  const rest = interpreters.filter(i => !(i.status === 'draft' && (i.draft_step ?? 0) < 6))

  function filterList(list: InterpreterRow[]) {
    return list.filter(i => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const name = `${i.first_name || ''} ${i.last_name || ''}`.toLowerCase()
        return name.includes(q) || (i.email || '').toLowerCase().includes(q)
      }
      return true
    })
  }

  async function changeStatus(id: string, newStatus: string) {
    setUpdating(id)
    const supabase = createClient()
    await supabase
      .from('interpreter_profiles')
      .update({ status: newStatus })
      .eq('id', id)
    router.refresh()
    setUpdating(null)
  }

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
  }

  function renderTable(list: InterpreterRow[], showDraftStep: boolean) {
    const headers = ['Name', 'Email', 'Location', 'Status']
    if (showDraftStep) headers.push('Draft Step')
    headers.push('Signup Date', 'Actions')

    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {headers.map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontFamily: "'Inter', sans-serif", fontWeight: 700,
                    fontSize: '0.7rem', textTransform: 'uppercase',
                    letterSpacing: '0.1em', color: 'var(--muted)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(i => {
                const name = `${i.first_name || ''} ${i.last_name || ''}`.trim() || 'Unnamed'
                const loc = [i.location || i.state, i.country].filter(Boolean).join(', ')
                return (
                  <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text)' }}>{name}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)' }}>{i.email || '-'}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: '0.82rem' }}>{loc || '-'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                        background: i.status === 'approved' ? 'rgba(0,229,255,0.1)' : i.status === 'suspended' ? 'rgba(255,107,133,0.15)' : i.status === 'draft' ? 'rgba(255,255,255,0.05)' : `${ORANGE}22`,
                        color: i.status === 'approved' ? 'var(--accent)' : i.status === 'suspended' ? 'var(--accent3)' : i.status === 'draft' ? 'var(--muted)' : ORANGE,
                      }}>
                        {i.status}
                      </span>
                    </td>
                    {showDraftStep && (
                      <td style={{ padding: '10px 16px', color: 'var(--muted)' }}>
                        Step {i.draft_step ?? 0}/6
                      </td>
                    )}
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {new Date(i.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {i.status === 'approved' && (
                          <a
                            href={`/directory/${i.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: ORANGE, fontSize: '0.8rem', textDecoration: 'none', padding: '3px 0' }}
                          >
                            View
                          </a>
                        )}
                        {(i.status === 'pending' || i.status === 'draft') && (
                          <button
                            onClick={() => changeStatus(i.id, 'approved')}
                            disabled={updating === i.id}
                            style={{
                              padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(0,229,255,0.3)',
                              background: 'none', color: 'var(--accent)', fontSize: '0.75rem',
                              cursor: 'pointer', opacity: updating === i.id ? 0.5 : 1,
                            }}
                          >
                            Approve
                          </button>
                        )}
                        {i.status === 'approved' && (
                          <button
                            onClick={() => changeStatus(i.id, 'suspended')}
                            disabled={updating === i.id}
                            style={{
                              padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,107,133,0.3)',
                              background: 'none', color: 'var(--accent3)', fontSize: '0.75rem',
                              cursor: 'pointer', opacity: updating === i.id ? 0.5 : 1,
                            }}
                          >
                            Suspend
                          </button>
                        )}
                        {i.status === 'suspended' && (
                          <button
                            onClick={() => changeStatus(i.id, 'approved')}
                            disabled={updating === i.id}
                            style={{
                              padding: '3px 10px', borderRadius: 6, border: `1px solid ${ORANGE}44`,
                              background: 'none', color: ORANGE, fontSize: '0.75rem',
                              cursor: 'pointer', opacity: updating === i.id ? 0.5 : 1,
                            }}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={headers.length} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                    No interpreters match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const filteredIncomplete = filterList(incomplete)
  const filteredRest = filterList(rest)

  return (
    <div className="admin-interp-content" style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 725, marginBottom: 8 }}>
        Interpreters
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24 }}>
        {interpreters.length} interpreter profile{interpreters.length !== 1 ? 's' : ''}
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text)', fontSize: '0.85rem',
            fontFamily: "'Inter', sans-serif",
          }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Incomplete signups */}
      {filteredIncomplete.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            padding: '8px 14px', borderRadius: 8,
            background: `${ORANGE}11`, border: `1px solid ${ORANGE}33`,
          }}>
            <span style={{ color: ORANGE, fontWeight: 600, fontSize: '0.85rem' }}>
              Incomplete Signups ({filteredIncomplete.length})
            </span>
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
              . Started signup but didn&apos;t finish
            </span>
          </div>
          {renderTable(filteredIncomplete, true)}
          <div style={{ height: 24 }} />
        </>
      )}

      {/* All interpreters */}
      <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>
        All Interpreters
      </h2>
      {renderTable(filteredRest, false)}

      <style>{`
        @media (max-width: 768px) {
          .admin-interp-content { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  )
}
