import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { emailTemplate } from '@/lib/email-template'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const bookingId = pi.metadata?.booking_id
        if (!bookingId) break

        // Idempotent: only update if not already charged
        const { data: booking } = await admin
          .from('bookings')
          .select('platform_fee_status')
          .eq('id', bookingId)
          .single()

        if (booking && booking.platform_fee_status !== 'charged') {
          await admin
            .from('bookings')
            .update({
              platform_fee_status: 'charged',
              stripe_payment_intent_id: pi.id,
            })
            .eq('id', bookingId)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        const bookingId = pi.metadata?.booking_id
        const requesterId = pi.metadata?.requester_id
        if (!bookingId) break

        await admin
          .from('bookings')
          .update({ platform_fee_status: 'failed' })
          .eq('id', bookingId)

        // Notify requester
        if (requesterId) {
          const { data: profile } = await admin
            .from('requester_profiles')
            .select('email')
            .eq('user_id', requesterId)
            .single()

          if (profile?.email) {
            await sendEmail({
              to: profile.email,
              subject: 'Action needed: platform fee payment failed',
              html: emailTemplate({
                heading: 'Platform fee payment failed',
                body: `
                  <p>Your booking has been confirmed, but we couldn't charge the $15 platform fee.</p>
                  <p>Please update your payment method to avoid any issues.</p>
                `,
                ctaText: 'Update Payment Method',
                ctaUrl: 'https://signpost.community/request/dashboard/profile',
              }),
            }).catch(e => console.error('[stripe-webhook] email failed:', e))
          }
        }
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        console.warn('[stripe-webhook] Dispute created:', dispute.id, 'amount:', dispute.amount)

        // Notify admin
        await sendEmail({
          to: 'hello@signpost.community',
          subject: `Stripe dispute created: ${dispute.id}`,
          html: emailTemplate({
            heading: 'Stripe dispute alert',
            body: `
              <p>A dispute has been created for charge ${dispute.charge}.</p>
              <p>Amount: $${(dispute.amount / 100).toFixed(2)}</p>
              <p>Reason: ${dispute.reason || 'Not specified'}</p>
              <p>Please review in the Stripe dashboard.</p>
            `,
            ctaText: 'Open Stripe Dashboard',
            ctaUrl: 'https://dashboard.stripe.com/disputes',
          }),
        }).catch(e => console.error('[stripe-webhook] admin email failed:', e))
        break
      }

      case 'customer.subscription.deleted': {
        // Future-proofing for premium interpreter subscriptions
        const sub = event.data.object as Stripe.Subscription
        console.log('[stripe-webhook] Subscription deleted:', sub.id, 'customer:', sub.customer)
        break
      }

      default:
        // Unhandled event type — log and acknowledge
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error processing ${event.type}:`, err)
    // Still return 200 to prevent Stripe retries for processing errors
  }

  return NextResponse.json({ received: true })
}
