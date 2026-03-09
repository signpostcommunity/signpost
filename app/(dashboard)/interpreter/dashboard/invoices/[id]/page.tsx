'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdditionalCost = {
  category: string
  description: string
  amount: number
}

type PaymentMethod = {
  type: string
  value: string
}

type InterpreterInfo = {
  name: string | null
  first_name: string | null
  last_name: string | null
  city: string | null
  state: string | null
  country: string | null
}

type Invoice = {
  id: string
  invoice_number: string
  status: string
  job_title: string
  job_date: string
  job_location: string
  job_format: string
  requester_name: string
  requester_billing_email: string
  actual_start_time: string
  actual_end_time: string
  actual_hours: number
  base_rate: number
  base_rate_type: string
  additional_costs: AdditionalCost[] | null
  subtotal: number
  total: number
  payment_terms: string
  due_date: string
  payment_methods_snapshot: PaymentMethod[] | null
  created_at: string
  sent_at: string | null
  paid_at: string | null
  interpreter_profiles: InterpreterInfo
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'))
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '—'
  const [hours, minutes] = timeStr.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`
}

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  due_on_receipt: 'Due on Receipt',
  net_7: 'Net 7',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_45: 'Net 45',
  net_60: 'Net 60',
}

function getInterpreterName(info: InterpreterInfo): string {
  if (info.first_name && info.last_name) {
    return `${info.first_name} ${info.last_name}`
  }
  return info.name || 'Unknown'
}

function getInterpreterLocation(info: InterpreterInfo): string {
  const parts = [info.city, info.state, info.country].filter(Boolean)
  return parts.join(', ')
}

export default function InvoiceViewPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInvoice() {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select(
          'id, invoice_number, status, job_title, job_date, job_location, job_format, requester_name, requester_billing_email, actual_start_time, actual_end_time, actual_hours, base_rate, base_rate_type, additional_costs, subtotal, total, payment_terms, due_date, payment_methods_snapshot, created_at, sent_at, paid_at, interpreter_profiles:interpreter_id(name, first_name, last_name, city, state, country)'
        )
        .eq('id', invoiceId)
        .single()

      if (fetchError) {
        setError('Invoice not found')
        setLoading(false)
        return
      }

      setInvoice(data as unknown as Invoice)
      setLoading(false)
    }

    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#b0b8d0' }}>
        <p style={{ fontSize: '16px' }}>Loading invoice...</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#b0b8d0', gap: '16px' }}>
        <p style={{ fontSize: '18px' }}>Invoice not found</p>
        <button
          onClick={() => router.push('/interpreter/dashboard/invoices')}
          style={{
            background: 'none',
            border: '1px solid #1e2433',
            color: '#00e5ff',
            padding: '8px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Back to Invoices
        </button>
      </div>
    )
  }

  const interpreterInfo = invoice.interpreter_profiles
  const invoiceDate = invoice.sent_at || invoice.created_at
  const additionalCosts = invoice.additional_costs || []
  const paymentMethods = invoice.payment_methods_snapshot || []
  const paymentTermsLabel = PAYMENT_TERMS_LABELS[invoice.payment_terms] || invoice.payment_terms
  const interpreterServicesAmount = (invoice.actual_hours || 0) * (invoice.base_rate || 0)

  return (
    <>
      <style>{`
        @media print {
          .invoice-actions, .dash-sidebar-desktop, .dash-sidebar-mobile-bar, nav { display: none !important; }
          body { background: white !important; }
          @page { margin: 0.5in; }
        }
      `}</style>

      {/* Action bar — hidden in print */}
      <div
        className="invoice-actions"
        style={{
          maxWidth: '800px',
          margin: '0 auto 24px',
          padding: '0 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => router.push('/interpreter/dashboard/invoices')}
          style={{
            background: 'none',
            border: '1px solid #1e2433',
            color: '#00e5ff',
            padding: '8px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          &larr; Back to Invoices
        </button>
        <button
          onClick={() => window.print()}
          style={{
            background: 'linear-gradient(135deg, #00e5ff, #00b8d4)',
            border: 'none',
            color: '#000',
            padding: '10px 24px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice content */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '48px',
          background: '#ffffff',
          color: '#1a1a1a',
          borderRadius: '12px',
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.6,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: '28px',
                color: '#1a1a1a',
                letterSpacing: '-0.5px',
              }}
            >
              signpost
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#1a1a1a' }}>
              INVOICE
            </div>
            <div style={{ fontSize: '14px', color: '#555', marginTop: '4px' }}>
              {invoice.invoice_number}
            </div>
            <div style={{ fontSize: '13px', color: '#777', marginTop: '2px' }}>
              {formatDate(invoiceDate)}
            </div>
          </div>
        </div>

        {/* Due Date */}
        <div style={{ marginBottom: '32px', fontSize: '17px', fontWeight: 700, color: '#1a1a1a' }}>
          {invoice.payment_terms === 'due_on_receipt'
            ? 'Payment Due: Upon Receipt'
            : `Payment Due: ${formatDate(invoice.due_date)}`}
        </div>

        {/* From / Bill To */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', gap: '40px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#999', marginBottom: '6px', fontWeight: 600 }}>
              From
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>
              {getInterpreterName(interpreterInfo)}
            </div>
            <div style={{ fontSize: '13px', color: '#555' }}>
              {getInterpreterLocation(interpreterInfo)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#999', marginBottom: '6px', fontWeight: 600 }}>
              Bill To
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>
              {invoice.requester_name}
            </div>
            <div style={{ fontSize: '13px', color: '#555' }}>
              {invoice.requester_billing_email}
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div
          style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '32px',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#999', marginBottom: '12px', fontWeight: 600 }}>
            Job Details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#777' }}>Title</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>{invoice.job_title || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#777' }}>Date</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>{formatDate(invoice.job_date)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#777' }}>Time</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>
                {formatTime(invoice.actual_start_time)} – {formatTime(invoice.actual_end_time)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#777' }}>Location</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>{invoice.job_location || '—'}</div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '32px',
            fontSize: '14px',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid #dee2e6' }}>
              <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#777', fontWeight: 600 }}>
                Description
              </th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#777', fontWeight: 600, width: '100px' }}>
                Hours/Qty
              </th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#777', fontWeight: 600, width: '100px' }}>
                Rate
              </th>
              <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#777', fontWeight: 600, width: '110px' }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Interpreting services row */}
            <tr style={{ borderBottom: '1px solid #e9ecef' }}>
              <td style={{ padding: '12px 8px', color: '#1a1a1a' }}>
                Interpreting Services — {invoice.job_title}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1a1a1a' }}>
                {invoice.actual_hours}
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1a1a1a' }}>
                ${Number(invoice.base_rate).toFixed(2)}/hr
              </td>
              <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1a1a1a' }}>
                ${interpreterServicesAmount.toFixed(2)}
              </td>
            </tr>

            {/* Additional costs */}
            {additionalCosts.map((cost, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e9ecef' }}>
                <td style={{ padding: '12px 8px', color: '#1a1a1a' }}>
                  {cost.category}{cost.description ? ` — ${cost.description}` : ''}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#999' }}>—</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', color: '#999' }}>—</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1a1a1a' }}>
                  ${Number(cost.amount).toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Separator */}
            <tr>
              <td colSpan={4} style={{ borderBottom: '2px solid #dee2e6', padding: 0 }} />
            </tr>

            {/* Subtotal */}
            <tr>
              <td colSpan={3} style={{ padding: '10px 8px', textAlign: 'right', color: '#555', fontWeight: 500 }}>
                Subtotal
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1a1a1a', fontWeight: 500 }}>
                ${Number(invoice.subtotal).toFixed(2)}
              </td>
            </tr>

            {/* Total */}
            <tr>
              <td colSpan={3} style={{ padding: '10px 8px', textAlign: 'right', color: '#1a1a1a', fontWeight: 700, fontSize: '17px' }}>
                Total
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1a1a1a', fontWeight: 700, fontSize: '17px' }}>
                ${Number(invoice.total).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Payment Terms */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#999', marginBottom: '6px', fontWeight: 600 }}>
            Payment Terms
          </div>
          <div style={{ fontSize: '14px', color: '#1a1a1a' }}>
            {invoice.payment_terms === 'due_on_receipt'
              ? `${paymentTermsLabel} — Due on Receipt`
              : `${paymentTermsLabel} — Due by ${formatDate(invoice.due_date)}`}
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px', color: '#999', marginBottom: '10px', fontWeight: 600 }}>
            Payment Methods
          </div>
          {paymentMethods.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {paymentMethods.map((method, index) => (
                <div key={index} style={{ fontSize: '14px', color: '#1a1a1a' }}>
                  <span style={{ fontWeight: 600 }}>
                    {method.type.charAt(0).toUpperCase() + method.type.slice(1)}
                  </span>
                  : {method.value}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#777', fontStyle: 'italic' }}>
              No payment methods specified. Please contact the interpreter directly.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #e9ecef',
            paddingTop: '20px',
            fontSize: '12px',
            color: '#999',
            lineHeight: 1.7,
            textAlign: 'center',
          }}
        >
          This invoice was generated through signpost. signpost does not process payments.
          Please remit payment directly to the interpreter using the payment methods listed above.
        </div>
      </div>
    </>
  )
}
