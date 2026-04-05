'use client'

import { useState, useEffect, useCallback } from 'react'

const ORANGE = '#ff7e45'

interface Booking {
  id: string
  description: string
  requester_name: string
  requester_email: string
  interpreter_names: string[]
  date: string | null
  time_start: string | null
  time_end: string | null
  status: string
  platform_fee_status: string
  platform_fee_amount: number
  created_at: string
  format: string
  location: string
  event_type: string
  timezone: string
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    draft: { bg: 'rgba(255,255,255,0.05)', color: 'var(--muted)' },
    open: { bg: 'rgba(0,229,255,0.1)', color: 'var(--accent)' },
    pending: { bg: `${ORANGE}22`, color: ORANGE },
    confirmed: { bg: 'rgba(52,211,153,0.1)', color: '#34d399' },
    completed: { bg: 'rgba(52,211,153,0.15)', color: '#22c55e' },
    cancelled: { bg: 'rgba(255,107,133,0.1)', color: 'var(--accent3)' },
    declined: { bg: 'rgba(255,107,133,0.1)', color: 'var(--accent3)' },
  }
  const c = colors[status] || colors.draft
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
      background: c.bg, color: c.color,
    }}>
      {status}
    </span>
  )
}

function FeeBadge({ status }: { status: string }) {
  if (!status) return <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{'\u2014'}</span>
  const colors: Record<string, { bg: string; color: string }> = {
    charged: { bg: 'rgba(52,211,153,0.1)', color: '#22c55e' },
    failed: { bg: 'rgba(255,107,133,0.1)', color: 'var(--accent3)' },
    pending: { bg: `${ORANGE}22`, color: ORANGE },
    credited: { bg: 'rgba(0,229,255,0.1)', color: 'var(--accent)' },
    waived: { bg: 'rgba(255,255,255,0.05)', color: 'var(--muted)' },
  }
  const c = colors[status] || colors.pending
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
      background: c.bg, color: c.color,
    }}>
      {status}
    </span>
  )
}

function BookingDetailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const rows: [string, string][] = [
    ['Title', booking.description || '\u2014'],
    ['Requester', `${booking.requester_name} (${booking.requester_email})`],
    ['Interpreter(s)', booking.interpreter_names.join(', ') || '\u2014'],
    ['Date', booking.date || '\u2014'],
    ['Time', booking.time_start && booking.time_end ? `${booking.time_start} - ${booking.time_end}` : '\u2014'],
    ['Timezone', booking.timezone || '\u2014'],
    ['Format', booking.format || '\u2014'],
    ['Location', booking.location || '\u2014'],
    ['Event Type', booking.event_type || '\u2014'],
    ['Status', booking.status],
    ['Fee Status', booking.platform_fee_status || '\u2014'],
    ['Fee Amount', booking.platform_fee_amount ? `$${Number(booking.platform_fee_amount).toFixed(2)}` : '\u2014'],
    ['Created', new Date(booking.created_at).toLocaleString()],
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: 32, maxWidth: 520, width: '100%',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.15rem', fontWeight: 650 }}>
            Booking Details
          </h3>
          <button onClick={onClose} aria-label="Close" style={{
            background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer',
            minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span aria-hidden="true">&#x2715;</span>
          </button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 120, flexShrink: 0, fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text)', wordBreak: 'break-word' }}>
                {label === 'Status' ? <StatusBadge status={value} /> :
                 label === 'Fee Status' && value !== '\u2014' ? <FeeBadge status={value} /> : value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BookingsClient() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [feeFilter, setFeeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selected, setSelected] = useState<Booking | null>(null)
  const perPage = 25

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (statusFilter) params.set('status', statusFilter)
    if (feeFilter) params.set('feeStatus', feeFilter)
    if (search) params.set('search', search)

    try {
      const res = await fetch(`/api/admin/bookings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, statusFilter, feeFilter, search])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const totalPages = Math.ceil(total / perPage)

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 650, marginBottom: 8 }}>
        Bookings
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24 }}>
        {total} booking{total !== 1 ? 's' : ''} total
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1) }} style={{ display: 'flex', flex: 1, minWidth: 200, gap: 8 }}>
          <input
            type="text"
            placeholder="Search by title or requester..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{
              flex: 1, padding: '8px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface2)',
              color: 'var(--text)', fontSize: '0.85rem',
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <button type="submit" style={{
            padding: '8px 16px', borderRadius: 10, border: `1px solid ${ORANGE}44`,
            background: 'none', color: ORANGE, fontSize: '0.85rem', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}>
            Search
          </button>
        </form>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={feeFilter} onChange={e => { setFeeFilter(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="">All Fee Statuses</option>
          <option value="charged">Charged</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="credited">Credited</option>
          <option value="waived">Waived</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Title', 'Requester', 'Interpreter(s)', 'Date/Time', 'Status', 'Fee Status', 'Created'].map(h => (
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
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>Loading...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>No bookings found.</td></tr>
              ) : bookings.map(b => (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,43,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 16px', color: 'var(--text)', maxWidth: 200 }}>
                    {b.description || '\u2014'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ color: 'var(--text)', fontSize: '0.84rem' }}>{b.requester_name || '\u2014'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{b.requester_email}</div>
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text)', fontSize: '0.84rem' }}>
                    {b.interpreter_names.length > 0 ? b.interpreter_names.join(', ') : '\u2014'}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {b.date ? (
                      <>
                        {new Date(b.date + 'T00:00:00').toLocaleDateString()}
                        {b.time_start && <><br />{b.time_start}{b.time_end ? ` - ${b.time_end}` : ''}</>}
                      </>
                    ) : '\u2014'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <FeeBadge status={b.platform_fee_status} />
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, alignItems: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'none', color: page === 1 ? 'var(--border)' : 'var(--muted)',
              fontSize: '0.85rem', cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'none', color: page === totalPages ? 'var(--border)' : 'var(--muted)',
              fontSize: '0.85rem', cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Booking detail modal */}
      {selected && <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />}

      <style>{`
        @media (max-width: 768px) {
          .admin-bookings-content { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  )
}
