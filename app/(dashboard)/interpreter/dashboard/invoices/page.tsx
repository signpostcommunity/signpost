'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BetaBanner, PageHeader, SectionLabel, GhostButton, DashMobileStyles } from '@/components/dashboard/interpreter/shared'
import Toast from '@/components/ui/Toast'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { sendNotification } from '@/lib/notifications'

/* ── Types ── */

interface CompletedBooking {
  id: string
  title: string | null
  requester_name: string | null
  specialization: string | null
  date: string
  time_start: string
  time_end: string
  location: string | null
  format: string | null
  is_seed: boolean | null
}

interface Invoice {
  id: string
  invoice_number: string
  status: string
  booking_id: string | null
  job_title: string | null
  job_date: string | null
  job_location: string | null
  job_format: string | null
  requester_name: string | null
  requester_billing_email: string | null
  total: number | null
  subtotal: number | null
  base_rate: number | null
  base_rate_type: string | null
  actual_hours: number | null
  payment_terms: string | null
  due_date: string | null
  created_at: string
  sent_at: string | null
  paid_at: string | null
  last_reminder_sent_at: string | null
}

type FilterTab = 'all' | 'draft' | 'sent' | 'paid' | 'overdue'

/* ── Helpers ── */

const TERMS_LABELS: Record<string, string> = {
  'due_on_receipt': 'Due on Receipt',
  'net_15': 'Net 15',
  'net_30': 'Net 30',
  'net_45': 'Net 45',
  'net_60': 'Net 60',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDatetime(dtStr: string): string {
  const d = new Date(dtStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return '$0.00'
  return `$${amount.toFixed(2)}`
}

function isOverdue(invoice: Invoice): boolean {
  return invoice.status === 'sent' && !!invoice.due_date && new Date(invoice.due_date + 'T00:00:00') < new Date(new Date().toDateString())
}

function getDisplayStatus(invoice: Invoice): string {
  if (isOverdue(invoice)) return 'overdue'
  return invoice.status
}

/* ── Status Badge ── */

function InvoiceStatusBadge({ invoice }: { invoice: Invoice }) {
  const display = getDisplayStatus(invoice)
  const styles: Record<string, { bg: string; color: string; label: string; strike?: boolean }> = {
    draft:   { bg: 'rgba(176,184,208,0.1)', color: 'var(--muted)', label: 'Draft' },
    sent:    { bg: 'rgba(0,229,255,0.1)', color: 'var(--accent)', label: 'Sent' },
    paid:    { bg: 'rgba(52,211,153,0.1)', color: '#34d399', label: 'Paid' },
    overdue: { bg: 'rgba(255,107,133,0.1)', color: 'var(--accent3)', label: 'Overdue' },
    void:    { bg: 'rgba(176,184,208,0.06)', color: 'var(--muted)', label: 'Void', strike: true },
  }
  const s = styles[display] || styles.draft
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: 100, background: s.bg, color: s.color,
      fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em', whiteSpace: 'nowrap',
      textDecoration: s.strike ? 'line-through' : 'none',
    }}>
      {s.label}
    </span>
  )
}

/* ── Send Reminder Modal ── */

function SendReminderModal({ invoice, onClose, onSent }: {
  invoice: Invoice
  onClose: () => void
  onSent: () => void
}) {
  const termsLabel = invoice.payment_terms ? (TERMS_LABELS[invoice.payment_terms] || invoice.payment_terms) : ''
  const dueDateFormatted = invoice.due_date ? formatDate(invoice.due_date) : 'N/A'
  const isPastDue = invoice.due_date ? new Date(invoice.due_date + 'T00:00:00') < new Date(new Date().toDateString()) : false
  const duePhrase = isPastDue ? 'past due' : `due on ${dueDateFormatted}`

  const defaultMessage = `Hi,

This is a friendly reminder that Invoice ${invoice.invoice_number} for ${invoice.job_title || 'your booking'} on ${invoice.job_date ? formatDate(invoice.job_date) : 'N/A'} is ${duePhrase}.

Amount due: ${formatCurrency(invoice.total)}
Payment terms: ${termsLabel}

Please let me know if you have any questions.

Thank you`

  const [toEmail, setToEmail] = useState(invoice.requester_billing_email || '')
  const [subject, setSubject] = useState(`Payment Reminder — Invoice ${invoice.invoice_number} for ${invoice.job_title || 'your booking'}`)
  const [message, setMessage] = useState(defaultMessage)
  const [saving, setSaving] = useState(false)

  // TODO: Wire actual email delivery via Supabase Edge Function or Resend

  async function handleCopyAndClose() {
    setSaving(true)
    try {
      await navigator.clipboard.writeText(message)
    } catch {
      // fallback: textarea select
    }

    const supabase = createClient()
    await supabase
      .from('invoices')
      .update({ last_reminder_sent_at: new Date().toISOString() })
      .eq('id', invoice.id)

    setSaving(false)
    onSent()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    color: 'var(--text)', fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }} onClick={onClose}>
      <div className="modal-dialog" style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '28px 32px',
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem', margin: '0 0 20px' }}>
          Send Payment Reminder
        </h2>

        {/* Invoice summary */}
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: 20,
          fontSize: '0.84rem', color: 'var(--muted)', lineHeight: 1.7,
        }}>
          <div><strong style={{ color: 'var(--text)' }}>Invoice:</strong> {invoice.invoice_number}</div>
          <div><strong style={{ color: 'var(--text)' }}>Job:</strong> {invoice.job_title || '—'}</div>
          <div><strong style={{ color: 'var(--text)' }}>Total:</strong> {formatCurrency(invoice.total)}</div>
          <div><strong style={{ color: 'var(--text)' }}>Due:</strong> {dueDateFormatted}</div>
        </div>

        {/* To field */}
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>To</span>
          <input type="email" value={toEmail} onChange={e => setToEmail(e.target.value)} style={inputStyle} />
        </label>

        {/* Subject field */}
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Subject</span>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle} />
        </label>

        {/* Message field */}
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Message</span>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={10}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
        </label>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button className="btn-primary" disabled={saving} onClick={handleCopyAndClose}
            style={{ fontSize: '0.88rem', padding: '10px 20px', cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Copying…' : 'Copy & Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null)
  const [interpreterId, setInterpreterId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ invoice: Invoice; type: 'delete' | 'void' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type })
  }

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Get interpreter profile id
    const { data: profile, error: profileErr } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) { setLoading(false); return }
    setInterpreterId(profile.id)

    // Fetch invoices
    const { data: invData, error: invErr } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, booking_id, job_title, job_date, job_location, job_format, requester_name, requester_billing_email, total, subtotal, base_rate, base_rate_type, actual_hours, payment_terms, due_date, created_at, sent_at, paid_at, last_reminder_sent_at')
      .eq('interpreter_id', profile.id)
      .order('created_at', { ascending: false })

    if (invErr) {
      console.error('[invoices] fetch failed:', invErr.message)
    }
    const allInvoices = invData || []
    setInvoices(allInvoices)

    // Fetch completed bookings
    const { data: bookingsData, error: bookingsErr } = await supabase
      .from('bookings')
      .select('id, title, requester_name, specialization, date, time_start, time_end, location, format, is_seed')
      .eq('interpreter_id', profile.id)
      .eq('status', 'completed')
      .order('date', { ascending: false })

    if (bookingsErr) {
      console.error('[invoices] completed bookings fetch failed:', bookingsErr.message)
    }

    // Filter out bookings that already have an invoice
    const invoicedBookingIds = new Set(allInvoices.map(inv => inv.booking_id).filter(Boolean))
    const uninvoiced = (bookingsData || []).filter(b => !invoicedBookingIds.has(b.id))
    setCompletedBookings(uninvoiced)

    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── Actions ── */

  async function handleMarkPaid(invoice: Invoice) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoice.id)

    if (error) {
      showToast('Failed to mark as paid', 'error')
    } else {
      showToast(`Invoice ${invoice.invoice_number} marked as paid`)
      fetchData()

      // Notify interpreter that invoice was paid
      if (user) {
        sendNotification({
          recipientUserId: user.id,
          type: 'invoice_paid',
          subject: `Invoice paid: ${invoice.invoice_number}`,
          body: `Your invoice ${invoice.invoice_number} for ${invoice.job_title || 'a booking'} ($${invoice.total?.toFixed(2) || '0.00'}) has been marked as paid.`,
          metadata: { invoice_id: invoice.id },
          ctaText: 'View Invoice',
          ctaUrl: `https://signpost.community/interpreter/dashboard/invoices/${invoice.id}`,
        }).catch(err => console.error('[invoices] paid notification failed:', err))
      }
    }
  }

  function handleDelete(invoice: Invoice) {
    setConfirmAction({ invoice, type: 'delete' })
  }

  function handleVoid(invoice: Invoice) {
    setConfirmAction({ invoice, type: 'void' })
  }

  async function executeConfirmAction() {
    if (!confirmAction) return
    const { invoice, type } = confirmAction
    const supabase = createClient()

    if (type === 'delete') {
      const { error } = await supabase.from('invoices').delete().eq('id', invoice.id)
      if (error) {
        showToast('Failed to delete invoice', 'error')
      } else {
        showToast(`Invoice ${invoice.invoice_number} deleted`)
        fetchData()
      }
    } else {
      const { error } = await supabase.from('invoices').update({ status: 'void' }).eq('id', invoice.id)
      if (error) {
        showToast('Failed to void invoice', 'error')
      } else {
        showToast(`Invoice ${invoice.invoice_number} voided`)
        fetchData()
      }
    }
    setConfirmAction(null)
  }

  function handleReminderSent() {
    setReminderInvoice(null)
    showToast('Reminder copied to clipboard. Paste it into your email to send.', 'info')
    fetchData()
  }

  /* ── Filtering ── */

  const filtered = invoices.filter(inv => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchesSearch =
        (inv.requester_name || '').toLowerCase().includes(q) ||
        (inv.job_title || '').toLowerCase().includes(q) ||
        (inv.invoice_number || '').toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    // Tab filter
    if (filter === 'all') return true
    if (filter === 'overdue') return isOverdue(inv)
    if (filter === 'sent') return inv.status === 'sent' && !isOverdue(inv)
    return inv.status === filter
  })

  /* ── Filter pill counts ── */

  const counts = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent' && !isOverdue(i)).length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => isOverdue(i)).length,
  }

  /* ── Filter pill style ── */

  const pillStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'rgba(0,229,255,0.12)' : 'transparent',
    border: `1px solid ${active ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
    color: active ? 'var(--accent)' : 'var(--muted)',
    borderRadius: 100,
    padding: '6px 16px',
    fontSize: '0.8rem',
    fontWeight: active ? 700 : 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  })

  /* ── Render ── */

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <DashMobileStyles />
      <PageHeader title="Invoices" subtitle="Manage invoices for completed jobs." />

      {/* Section 1: Past Jobs — Not Yet Invoiced */}
      {!loading && (
        <>
          <SectionLabel>Past Jobs — Not Yet Invoiced</SectionLabel>
          {completedBookings.length === 0 ? (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '32px 24px',
              color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
              marginBottom: 28,
            }}>
              All caught up — no uninvoiced jobs.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {completedBookings.map(b => (
                <div key={b.id} style={{
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '20px 24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif" }}>
                        {b.title || 'Booking'}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 3 }}>
                        {b.requester_name || 'Client'} · {b.specialization || 'General'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
                      borderRadius: 100, whiteSpace: 'nowrap',
                      background: 'rgba(52,211,153,0.1)', color: '#34d399',
                      border: '1px solid rgba(52,211,153,0.3)',
                      fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em',
                    }}>
                      Completed
                    </span>
                  </div>
                  <div style={{
                    display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)',
                    padding: '10px 0', borderTop: '1px solid var(--border)',
                  }}>
                    <span>📅 {formatDate(b.date)}</span>
                    <span>🕐 {(() => {
                      const fmt = (t: string) => { const [h, m] = t.split(':').map(Number); const ampm = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12; return `${h12}:${String(m).padStart(2, '0')} ${ampm}` }
                      return `${fmt(b.time_start)} – ${fmt(b.time_end)}`
                    })()}</span>
                    <span>📍 {b.location || 'TBD'}</span>
                  </div>
                  <div className="dash-card-actions" style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button
                      className="btn-primary"
                      onClick={() => router.push(`/interpreter/dashboard/confirmed?invoice=${b.id}`)}
                      style={{ fontSize: '0.82rem', padding: '8px 18px' }}
                    >
                      Submit Invoice →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Section 2: Invoiced */}
      {!loading && <SectionLabel>Invoiced</SectionLabel>}

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by requester, job title, or invoice number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '10px 16px',
            color: 'var(--text)', fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif",
            outline: 'none',
          }}
        />
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {(['all', 'draft', 'sent', 'paid', 'overdue'] as FilterTab[]).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)} style={pillStyle(filter === tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}{counts[tab] > 0 ? ` (${counts[tab]})` : ''}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '40px 24px',
          textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7,
        }}>
          {invoices.length === 0
            ? 'No invoices yet. Submit your first invoice from a completed job above.'
            : 'No invoices match your current filter.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(inv => {
            const displayStatus = getDisplayStatus(inv)
            return (
              <div key={inv.id} style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px 24px',
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Syne', sans-serif" }}>
                      {inv.invoice_number}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 3 }}>
                      {inv.job_title || '—'}
                      {inv.job_date && ` · ${formatDate(inv.job_date)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <InvoiceStatusBadge invoice={inv} />
                  </div>
                </div>

                {/* Details row */}
                <div style={{
                  display: 'flex', gap: 16, flexWrap: 'wrap',
                  fontSize: '0.8rem', color: 'var(--muted)',
                  padding: '10px 0', borderTop: '1px solid var(--border)',
                }}>
                  {inv.requester_name && <span>Requester: {inv.requester_name}</span>}
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                    {formatCurrency(inv.total)}
                  </span>
                  {inv.status === 'sent' && inv.due_date && (
                    <span style={{ color: isOverdue(inv) ? 'var(--accent3)' : 'var(--muted)' }}>
                      Due: {formatDate(inv.due_date)}
                    </span>
                  )}
                  {displayStatus === 'overdue' && inv.due_date && (
                    <span style={{ color: 'var(--accent3)' }}>
                      Due: {formatDate(inv.due_date)}
                    </span>
                  )}
                  {inv.sent_at && (
                    <span>Sent: {formatDatetime(inv.sent_at)}</span>
                  )}
                  {inv.paid_at && (
                    <span>Paid: {formatDatetime(inv.paid_at)}</span>
                  )}
                </div>

                {/* Actions row */}
                <div className="dash-card-actions" style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  {displayStatus === 'draft' && (
                    <>
                      <GhostButton onClick={() => router.push(`/interpreter/dashboard/invoices/${inv.id}?edit=true`)}>
                        Edit
                      </GhostButton>
                      <GhostButton danger onClick={() => handleDelete(inv)}>
                        Delete
                      </GhostButton>
                    </>
                  )}
                  {displayStatus === 'sent' && (
                    <>
                      <GhostButton onClick={() => router.push(`/interpreter/dashboard/invoices/${inv.id}`)}>
                        View
                      </GhostButton>
                      <button className="btn-primary" onClick={() => handleMarkPaid(inv)}
                        style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
                        Mark as Paid
                      </button>
                      <GhostButton danger onClick={() => handleVoid(inv)}>
                        Void
                      </GhostButton>
                    </>
                  )}
                  {displayStatus === 'overdue' && (
                    <>
                      <GhostButton onClick={() => router.push(`/interpreter/dashboard/invoices/${inv.id}`)}>
                        View
                      </GhostButton>
                      <button className="btn-primary" onClick={() => setReminderInvoice(inv)}
                        style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
                        Send Reminder
                      </button>
                      <button className="btn-primary" onClick={() => handleMarkPaid(inv)}
                        style={{ fontSize: '0.82rem', padding: '8px 16px', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.3)', color: 'var(--accent)' }}>
                        Mark as Paid
                      </button>
                      <GhostButton danger onClick={() => handleVoid(inv)}>
                        Void
                      </GhostButton>
                    </>
                  )}
                  {displayStatus === 'paid' && (
                    <GhostButton onClick={() => router.push(`/interpreter/dashboard/invoices/${inv.id}`)}>
                      View
                    </GhostButton>
                  )}
                  {displayStatus === 'void' && (
                    <GhostButton onClick={() => router.push(`/interpreter/dashboard/invoices/${inv.id}`)}>
                      View
                    </GhostButton>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Send Reminder Modal */}
      {reminderInvoice && (
        <SendReminderModal
          invoice={reminderInvoice}
          onClose={() => setReminderInvoice(null)}
          onSent={handleReminderSent}
        />
      )}

      {/* Confirm Modal (replaces window.confirm) */}
      <ConfirmModal
        isOpen={!!confirmAction}
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmAction(null)}
        title={confirmAction?.type === 'delete' ? 'Delete Invoice' : 'Void Invoice'}
        description={
          confirmAction?.type === 'delete'
            ? `Delete draft invoice ${confirmAction.invoice.invoice_number}? This cannot be undone.`
            : 'Void this invoice? This marks it as cancelled and cannot be undone.'
        }
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : 'Void Invoice'}
        destructive
      />

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
