'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'

interface AdditionalCost {
  category: string
  description: string
  amount: number
}

interface InvoiceRow {
  id: string
  invoice_number: string
  status: string
  booking_id: string | null
  interpreter_id: string | null
  job_title: string | null
  job_date: string | null
  job_location: string | null
  requester_name: string | null
  total: number | null
  subtotal: number | null
  base_rate: number | null
  actual_hours: number | null
  payment_terms: string | null
  due_date: string | null
  additional_costs: AdditionalCost[] | null
  created_at: string
  sent_at: string | null
  paid_at: string | null
  interpreter_name?: string | null
}

type FilterTab = 'all' | 'unpaid' | 'paid'

const TERMS_LABELS: Record<string, string> = {
  due_on_receipt: 'Due on Receipt',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_45: 'Net 45',
  net_60: 'Net 60',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr.length <= 10 ? dateStr + 'T00:00:00' : dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return '$0.00'
  return `$${amount.toFixed(2)}`
}

function isUnpaid(inv: InvoiceRow): boolean {
  return inv.status === 'sent' || inv.status === 'draft'
}

export default function RequesterInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Find this requester's bookings
    const { data: myBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('requester_id', user.id)

    const bookingIds = (myBookings || []).map(b => b.id)
    if (bookingIds.length === 0) {
      setInvoices([])
      setLoading(false)
      return
    }

    // Fetch invoices for those bookings (interpreters submit them)
    const { data: invs, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, booking_id, interpreter_id, job_title, job_date, job_location, requester_name, total, subtotal, base_rate, actual_hours, payment_terms, due_date, additional_costs, created_at, sent_at, paid_at')
      .in('booking_id', bookingIds)
      .in('status', ['sent', 'paid', 'overdue'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[requester invoices] fetch failed:', error.message)
      setInvoices([])
      setLoading(false)
      return
    }

    // Hydrate interpreter names
    const interpreterIds = Array.from(new Set((invs || []).map(i => i.interpreter_id).filter(Boolean) as string[]))
    const nameMap: Record<string, string> = {}
    if (interpreterIds.length > 0) {
      const { data: profs } = await supabase
        .from('interpreter_profiles')
        .select('id, name, first_name, last_name')
        .in('id', interpreterIds)
      for (const p of profs || []) {
        nameMap[p.id] = p.name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Interpreter'
      }
    }

    setInvoices((invs || []).map(i => ({ ...i, interpreter_name: nameMap[i.interpreter_id || ''] || null })))
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleMarkPaid(inv: InvoiceRow) {
    const supabase = createClient()
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', inv.id)
    if (error) {
      setToast({ message: 'Failed to mark as paid', type: 'error' })
    } else {
      setToast({ message: `Invoice ${inv.invoice_number} marked as paid`, type: 'success' })
      fetchData()
    }
  }

  const counts = {
    all: invoices.length,
    unpaid: invoices.filter(isUnpaid).length,
    paid: invoices.filter(i => i.status === 'paid').length,
  }

  const filtered = invoices.filter(inv => {
    if (filter === 'unpaid' && !isUnpaid(inv)) return false
    if (filter === 'paid' && inv.status !== 'paid') return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const hay = [
        inv.interpreter_name || '',
        inv.job_title || '',
        inv.invoice_number || '',
        inv.total != null ? String(inv.total) : '',
      ].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const pillStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(0,229,255,0.12)' : 'transparent',
    border: `1px solid ${active ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
    color: active ? 'var(--accent)' : 'var(--muted)',
    borderRadius: 100,
    padding: '6px 16px',
    fontSize: '0.8rem',
    fontWeight: active ? 700 : 500,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  })

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <h1 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 725, fontSize: 27,
        margin: '0 0 8px',
      }}>
        Invoices
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.92rem', margin: '0 0 28px' }}>
        Invoices submitted by interpreters for your bookings.
      </p>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {(['all', 'unpaid', 'paid'] as FilterTab[]).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)} style={pillStyle(filter === tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}{counts[tab] > 0 ? ` (${counts[tab]})` : ''}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search by interpreter, booking title, or amount..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '10px 16px',
            color: 'var(--text)', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif",
            outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '40px 24px',
          textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem',
        }}>
          {invoices.length === 0
            ? 'No invoices yet. Interpreters will submit invoices here after completing your bookings.'
            : 'No invoices match your filter.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(inv => {
            const open = expanded === inv.id
            const unpaid = isUnpaid(inv)
            return (
              <div key={inv.id} style={{
                background: '#111118', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Inter', sans-serif" }}>
                      {inv.job_title || 'Booking'}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 3 }}>
                      {inv.interpreter_name || 'Interpreter'}{inv.job_date ? ` · ${formatDate(inv.job_date)}` : ''}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                    background: inv.status === 'paid' ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)',
                    border: `1px solid ${inv.status === 'paid' ? 'rgba(52,211,153,0.4)' : 'rgba(245,158,11,0.4)'}`,
                    color: inv.status === 'paid' ? '#34d399' : '#f59e0b',
                    fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>
                    {inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                <div style={{
                  fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600, marginBottom: 4,
                }}>
                  {formatCurrency(inv.total)}
                  {inv.actual_hours && inv.base_rate ? (
                    <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
                      ({inv.actual_hours} hrs @ {formatCurrency(inv.base_rate)}/hr)
                    </span>
                  ) : null}
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: 12 }}>
                  Received: {formatDate(inv.sent_at || inv.created_at)}
                  {inv.paid_at ? ` · Paid: ${formatDate(inv.paid_at)}` : ''}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setExpanded(open ? null : inv.id)}
                    style={{
                      background: 'transparent', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '8px 16px', color: 'var(--muted)',
                      fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {open ? 'Hide Details' : 'View Details'}
                  </button>
                  {unpaid && (
                    <button
                      className="btn-primary"
                      onClick={() => handleMarkPaid(inv)}
                      style={{ fontSize: '0.82rem', padding: '8px 18px' }}
                    >
                      Mark as Paid
                    </button>
                  )}
                  {inv.interpreter_id && (
                    <Link
                      href={`/request/dashboard/inbox`}
                      style={{
                        background: 'transparent', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '8px 16px', color: 'var(--muted)',
                        fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Message Interpreter
                    </Link>
                  )}
                </div>

                {open && (
                  <div style={{
                    marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    fontSize: '0.85rem', color: 'var(--text)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>
                        Hourly rate ({inv.actual_hours || 0} hrs @ {formatCurrency(inv.base_rate)}/hr)
                      </span>
                      <span>{formatCurrency((inv.actual_hours || 0) * (inv.base_rate || 0))}</span>
                    </div>
                    {(inv.additional_costs || []).map((c, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>{c.category}{c.description ? ` - ${c.description}` : ''}</span>
                        <span>{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      paddingTop: 10, borderTop: '1px solid var(--border)',
                      fontWeight: 700,
                    }}>
                      <span>Total</span>
                      <span>{formatCurrency(inv.total)}</span>
                    </div>
                    {inv.payment_terms && (
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                        Payment terms: {TERMS_LABELS[inv.payment_terms] || inv.payment_terms}
                        {inv.due_date ? ` · Due ${formatDate(inv.due_date)}` : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
