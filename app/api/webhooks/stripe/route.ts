import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { emailTemplate } from '@/lib/email-template'
import { sendAdminAlert } from '@/lib/adminAlerts'
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

        // Admin alert: payment failed
        const bookingTitle = pi.metadata?.booking_title || 'Untitled booking'
        const requesterEmail = pi.metadata?.requester_email || 'Unknown'
        const stripeError = pi.last_payment_error?.message || 'No details available'
        sendAdminAlert({
          type: 'payment_failed',
          emailSubject: '[signpost] Platform fee payment failed',
          emailBody: [
            'A $15 platform fee payment failed on signpost.',
            '',
            `Booking: ${bookingTitle}`,
            `Requester: ${requesterEmail}`,
            `Error: ${stripeError}`,
            '',
            'The booking was still confirmed. The requester has been notified to update their payment method.',
            '',
            'Review: https://signpost.community/admin/dashboard/bookings',
          ].join('\n'),
          smsMessage: `[signpost] Payment failed: $15 fee for ${bookingTitle}. Requester: ${requesterEmail}. Review at signpost.community/admin/dashboard/bookings`,
        }).catch(e => console.error('[stripe-webhook] admin alert failed:', e))

        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        console.warn('[stripe-webhook] Dispute created:', dispute.id, 'amount:', dispute.amount)

        const disputeAmount = `$${(dispute.amount / 100).toFixed(2)}`
        const disputeReason = dispute.reason || 'Not specified'

        // Notify admin (legacy direct email — kept for backwards compat)
        await sendEmail({
          to: 'hello@signpost.community',
          subject: `Stripe dispute created: ${dispute.id}`,
          html: emailTemplate({
            heading: 'Stripe dispute alert',
            body: `
              <p>A dispute has been created for charge ${dispute.charge}.</p>
              <p>Amount: ${disputeAmount}</p>
              <p>Reason: ${disputeReason}</p>
              <p>Please review in the Stripe dashboard.</p>
            `,
            ctaText: 'Open Stripe Dashboard',
            ctaUrl: 'https://dashboard.stripe.com/disputes',
          }),
        }).catch(e => console.error('[stripe-webhook] admin email failed:', e))

        // Admin alert: dispute opened (per-admin preferences)
        sendAdminAlert({
          type: 'dispute_opened',
          emailSubject: '[signpost] Stripe dispute opened',
          emailBody: [
            'A payment dispute has been opened on signpost.',
            '',
            `Amount: ${disputeAmount}`,
            `Reason: ${disputeReason}`,
            '',
            'Action required: respond in the Stripe dashboard within the deadline.',
            'Stripe dashboard: https://dashboard.stripe.com',
          ].join('\n'),
          smsMessage: `[signpost] Dispute opened: ${disputeAmount}. Respond in Stripe dashboard ASAP.`,
        }).catch(e => console.error('[stripe-webhook] admin dispute alert failed:', e))

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
