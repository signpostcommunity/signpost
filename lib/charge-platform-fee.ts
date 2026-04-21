/**
 * Shared server-side helper: charge the $15 platform fee for a booking.
 *
 * Called from the confirm-recipient route before marking a recipient as
 * confirmed. Idempotent -- safe to call multiple times for the same booking.
 *
 * Stripe test cards for verification:
 *   4242 4242 4242 4242        -- success
 *   4000 0000 0000 0002        -- generic decline
 *   4000 0000 0000 9995        -- insufficient funds
 *   4000 0027 6000 3184        -- requires authentication (3DS)
 */

import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export type ChargePlatformFeeResult =
  | { status: 'already_charged' }
  | { status: 'waived' }
  | { status: 'charged'; paymentIntentId: string }
  | { status: 'failed'; userMessage: string; code?: string }

const ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Your card was declined. Please update your payment method and try again.',
  insufficient_funds: 'Your card has insufficient funds. Please use a different card.',
  expired_card: 'Your card has expired. Please update your payment method.',
  authentication_required: 'Your bank requires additional authentication. Please complete the verification.',
}

const DEFAULT_ERROR_MESSAGE = 'Payment failed. Please try again or contact support.'

function mapStripeError(err: unknown): { userMessage: string; code?: string } {
  if (err instanceof Stripe.errors.StripeCardError) {
    const code = err.code || 'unknown'
    return {
      userMessage: ERROR_MESSAGES[code] || DEFAULT_ERROR_MESSAGE,
      code,
    }
  }
  return { userMessage: DEFAULT_ERROR_MESSAGE }
}

export async function chargePlatformFee(bookingId: string): Promise<ChargePlatformFeeResult> {
  const admin = getSupabaseAdmin()

  // 1. Read booking fee state
  const { data: booking, error: bookingErr } = await admin
    .from('bookings')
    .select('id, platform_fee_status, platform_fee_amount, requester_id')
    .eq('id', bookingId)
    .single()

  if (bookingErr || !booking) {
    console.error('[charge-platform-fee] booking lookup failed:', bookingErr?.message)
    return { status: 'failed', userMessage: DEFAULT_ERROR_MESSAGE }
  }

  // 2. Idempotency: already charged or waived
  if (booking.platform_fee_status === 'waived') {
    return { status: 'waived' }
  }
  if (booking.platform_fee_status === 'charged') {
    return { status: 'already_charged' }
  }

  // 3. Read requester Stripe info
  const { data: profile, error: profileErr } = await admin
    .from('requester_profiles')
    .select('stripe_customer_id, stripe_default_payment_method_id')
    .eq('id', booking.requester_id)
    .single()

  if (profileErr || !profile) {
    console.error('[charge-platform-fee] requester profile lookup failed:', profileErr?.message)
    return { status: 'failed', userMessage: 'Payment method not configured. Please add a card and try again.', code: 'no_profile' }
  }

  if (!profile.stripe_customer_id || !profile.stripe_default_payment_method_id) {
    return { status: 'failed', userMessage: 'Payment method not configured. Please add a card and try again.', code: 'no_payment_method' }
  }

  // 4. Create PaymentIntent (off-session, immediate confirm)
  const stripe = getStripe()
  const amountCents = Math.round((booking.platform_fee_amount || 15) * 100)

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'usd',
        customer: profile.stripe_customer_id,
        payment_method: profile.stripe_default_payment_method_id,
        off_session: true,
        confirm: true,
        description: `signpost platform fee - Booking #${bookingId}`,
        metadata: {
          booking_id: bookingId,
          type: 'platform_fee',
        },
      },
      {
        idempotencyKey: `platform_fee_${bookingId}`,
      },
    )

    // 5. Update booking on success
    const { error: updateErr } = await admin
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        platform_fee_status: 'charged',
      })
      .eq('id', bookingId)

    if (updateErr) {
      // Charge succeeded but DB update failed -- log loudly but don't fail
      // the confirmation. The webhook will reconcile.
      console.error('[charge-platform-fee] DB update failed after successful charge:', updateErr.message)
    }

    return { status: 'charged', paymentIntentId: paymentIntent.id }
  } catch (err) {
    console.error('[charge-platform-fee] Stripe charge failed:', err)
    const mapped = mapStripeError(err)
    return { status: 'failed', userMessage: mapped.userMessage, code: mapped.code }
  }
}
