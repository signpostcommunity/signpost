'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe, type Stripe as StripeJS } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

/* ── Types ── */

interface PaymentMethodInfo {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

interface PaymentMethodSectionProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

/* ── Stripe appearance (dark theme matching design system) ── */

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#f0f2f8',
      fontFamily: "'Inter', 'DM Sans', sans-serif",
      fontSize: '15px',
      '::placeholder': { color: '#96a0b8' },
      backgroundColor: 'transparent',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
}

/* ── Shared styles ── */

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '13px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#00e5ff',
  marginBottom: 20,
}

const cardStyle: React.CSSProperties = {
  background: '#111118',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '28px',
  marginBottom: 34,
}

/* ── Card brand display helpers ── */

function brandDisplayName(brand: string): string {
  const map: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  }
  return map[brand] || brand.charAt(0).toUpperCase() + brand.slice(1)
}

function CardBrandIcon({ brand }: { brand: string }) {
  // Simple SVG card icon — works for all brands
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="26" height="18" rx="3" stroke="#96a0b8" strokeWidth="1.2" />
      <rect x="1" y="5" width="26" height="4" fill="var(--border)" />
      <text x="4" y="16" fill="#96a0b8" fontSize="6" fontFamily="Inter, sans-serif" fontWeight="600">
        {brand === 'visa' ? 'VISA' : brand === 'mastercard' ? 'MC' : brand === 'amex' ? 'AMEX' : brand.toUpperCase().slice(0, 4)}
      </text>
    </svg>
  )
}

/* ── Inner form that uses Stripe hooks ── */

function CardForm({
  onSuccess,
  onCancel,
  onToast,
}: {
  onSuccess: (pm: PaymentMethodInfo) => void
  onCancel: () => void
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)

    try {
      // 1. Create SetupIntent on server
      const intentRes = await fetch('/api/stripe/setup-intent', { method: 'POST' })
      const intentData = await intentRes.json()
      if (!intentRes.ok) {
        onToast(intentData.error || 'Failed to set up payment', 'error')
        setProcessing(false)
        return
      }

      // 2. Confirm the SetupIntent with the card element
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        onToast('Card element not found', 'error')
        setProcessing(false)
        return
      }

      const { error, setupIntent } = await stripe.confirmCardSetup(intentData.clientSecret, {
        payment_method: { card: cardElement },
      })

      if (error) {
        onToast(error.message || 'Failed to save card', 'error')
        setProcessing(false)
        return
      }

      if (!setupIntent?.payment_method) {
        onToast('Failed to save card', 'error')
        setProcessing(false)
        return
      }

      // 3. Save the payment method on server
      const pmId = typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method.id

      const saveRes = await fetch('/api/stripe/payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: pmId }),
      })
      const saveData = await saveRes.json()

      if (!saveRes.ok) {
        onToast(saveData.error || 'Failed to save payment method', 'error')
        setProcessing(false)
        return
      }

      onSuccess(saveData.paymentMethod)
      onToast('Payment method saved', 'success')
    } catch {
      onToast('Something went wrong. Please try again.', 'error')
    }
    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        background: '#16161f',
        border: '1px solid #1e2433',
        borderRadius: 10,
        padding: '14px 16px',
        marginBottom: 16,
      }}>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="btn-primary"
          style={{
            padding: '10px 22px',
            fontSize: '14.5px',
            opacity: (!stripe || processing) ? 0.4 : 1,
          }}
        >
          {processing ? 'Saving...' : 'Save Card'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 18px',
            color: '#96a0b8',
            fontSize: '14.5px',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

/* ── Main section component ── */

export default function PaymentMethodSection({ onToast }: PaymentMethodSectionProps) {
  const [stripePromise, setStripePromise] = useState<Promise<StripeJS | null> | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodInfo | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(false)
  const [showRemoveWarning, setShowRemoveWarning] = useState(false)

  // Load Stripe publishable key and existing payment method
  useEffect(() => {
    async function init() {
      try {
        // Ensure Stripe customer exists (lazy creation for existing accounts)
        await fetch('/api/stripe/customer', { method: 'POST' })

        // Load publishable key
        const keyRes = await fetch('/api/stripe')
        const keyData = await keyRes.json()
        if (keyData.publishableKey) {
          setStripePromise(loadStripe(keyData.publishableKey))
        }

        // Load existing payment method
        const pmRes = await fetch('/api/stripe/payment-method')
        const pmData = await pmRes.json()
        if (pmData.paymentMethod) {
          setPaymentMethod(pmData.paymentMethod)
        }
      } catch {
        // Stripe not configured — section will show fallback
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleRemove = useCallback(async () => {
    setRemoving(true)
    try {
      const res = await fetch('/api/stripe/payment-method', { method: 'DELETE' })
      if (res.ok) {
        setPaymentMethod(null)
        setShowRemoveWarning(false)
        onToast('Payment method removed', 'info')
      } else {
        onToast('Failed to remove payment method', 'error')
      }
    } catch {
      onToast('Failed to remove payment method', 'error')
    }
    setRemoving(false)
  }, [onToast])

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>Payment Method</div>
        <p style={{ color: '#96a0b8', fontSize: '14px', margin: 0 }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={sectionTitleStyle}>Payment Method</div>

      {/* No payment method, no form showing */}
      {!paymentMethod && !showForm && (
        <div>
          <p style={{ fontWeight: 400, fontSize: '14px', color: '#c8cdd8', lineHeight: 1.6, margin: '0 0 12px' }}>
            Add a payment method to start submitting requests. You&apos;ll only be charged when you confirm an interpreter&apos;s booking.
          </p>
          <p style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 600, margin: '0 0 20px' }}>
            $15 per interpreter, per confirmed booking.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '14.5px' }}
          >
            Add Payment Method
          </button>
        </div>
      )}

      {/* Stripe card form */}
      {showForm && !paymentMethod && stripePromise && (
        <Elements stripe={stripePromise}>
          <CardForm
            onSuccess={(pm) => {
              setPaymentMethod(pm)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
            onToast={onToast}
          />
        </Elements>
      )}

      {/* Saved payment method display */}
      {paymentMethod && !showForm && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CardBrandIcon brand={paymentMethod.brand} />
              <div>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  color: '#f0f2f8',
                  letterSpacing: '0.03em',
                }}>
                  {brandDisplayName(paymentMethod.brand)} ending in {paymentMethod.last4}
                </span>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13px',
                  color: '#96a0b8',
                  marginLeft: 12,
                }}>
                  Expires {String(paymentMethod.expMonth).padStart(2, '0')}/{String(paymentMethod.expYear).slice(-2)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                onClick={() => {
                  setShowForm(true)
                }}
                style={{
                  background: 'none', border: 'none', color: '#96a0b8',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Update
              </button>
              <button
                onClick={() => setShowRemoveWarning(true)}
                style={{
                  background: 'none', border: 'none', color: '#96a0b8',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Remove
              </button>
            </div>
          </div>

          {/* Remove warning */}
          {showRemoveWarning && (
            <div style={{
              marginTop: 16, padding: '14px 16px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
            }}>
              <p style={{ color: '#c8cdd8', fontSize: '14px', margin: '0 0 12px', lineHeight: 1.5 }}>
                A payment method is required to submit requests. You won&apos;t be able to submit new requests without one.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  style={{
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 10, padding: '8px 16px', color: '#ef4444',
                    fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: removing ? 0.5 : 1,
                  }}
                >
                  {removing ? 'Removing...' : 'Remove Payment Method'}
                </button>
                <button
                  onClick={() => setShowRemoveWarning(false)}
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '8px 16px', color: '#96a0b8',
                    fontSize: '13.5px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Keep
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Update flow — show form inline below existing card */}
      {showForm && paymentMethod && stripePromise && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: '#96a0b8', fontSize: '13px', margin: '0 0 12px' }}>
            Enter a new card to replace your current payment method.
          </p>
          <Elements stripe={stripePromise}>
            <CardForm
              onSuccess={(pm) => {
                setPaymentMethod(pm)
                setShowForm(false)
              }}
              onCancel={() => setShowForm(false)}
              onToast={onToast}
            />
          </Elements>
        </div>
      )}

      <p style={{
        fontWeight: 400, fontSize: '14px', color: '#96a0b8', marginTop: 16, marginBottom: 0,
      }}>
        Powered by Stripe. Your card details are securely stored by Stripe and never touch our servers.
      </p>
    </div>
  )
}
