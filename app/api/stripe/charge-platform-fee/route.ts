import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { sendEmail } from '@/lib/email'
import { emailTemplate } from '@/lib/email-template'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await req.json()
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify the booking belongs to this requester
    const { data: booking, error: bookingErr } = await admin
      .from('bookings')
      .select('id, requester_id, platform_fee_status, stripe_payment_intent_id')
      .eq('id', bookingId)
      .single()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.requester_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Already charged - idempotent
    if (booking.platform_fee_status === 'charged' && booking.stripe_payment_intent_id) {
      return NextResponse.json({ status: 'already_charged' })
    }

    // Get requester's Stripe info
    const { data: profile, error: profileErr } = await admin
      .from('requester_profiles')
      .select('stripe_customer_id, stripe_default_payment_method_id, name, email')
      .eq('user_id', user.id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Requester profile not found' }, { status: 404 })
    }

    if (!profile.stripe_customer_id || !profile.stripe_default_payment_method_id) {
      // No payment method - mark as failed but don't block
      await admin
        .from('bookings')
        .update({ platform_fee_status: 'failed' })
        .eq('id', bookingId)

      return NextResponse.json({ status: 'no_payment_method' })
    }

    // Check for available booking credits (FIFO, oldest first)
    const { data: credits } = await admin
      .from('booking_credits')
      .select('id, amount')
      .eq('requester_id', user.id)
      .eq('status', 'available')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(1)

    if (credits && credits.length > 0) {
      const credit = credits[0]

      // Apply the credit
      await admin
        .from('booking_credits')
        .update({
          status: 'applied',
          applied_to_booking_id: bookingId,
        })
        .eq('id', credit.id)

      await admin
        .from('bookings')
        .update({
          platform_fee_status: 'credited',
          platform_fee_amount: 15.00,
        })
        .eq('id', bookingId)

      return NextResponse.json({ status: 'credited', creditId: credit.id })
    }

    // Charge $15 platform fee via Stripe
    const stripe = getStripe()

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1500,
        currency: 'usd',
        customer: profile.stripe_customer_id,
        payment_method: profile.stripe_default_payment_method_id,
        off_session: true,
        confirm: true,
        description: `signpost platform fee - Booking #${bookingId}`,
        metadata: {
          booking_id: bookingId,
          requester_id: user.id,
        },
      })

      // Update booking with charge info
      await admin
        .from('bookings')
        .update({
          platform_fee_status: 'charged',
          platform_fee_amount: 15.00,
          stripe_payment_intent_id: paymentIntent.id,
        })
        .eq('id', bookingId)

      return NextResponse.json({ status: 'charged', paymentIntentId: paymentIntent.id })
    } catch (chargeError) {
      console.error('[charge-platform-fee] Stripe charge failed:', chargeError)

      // Charge failed - booking still confirms, fee marked as failed
      await admin
        .from('bookings')
        .update({
          platform_fee_status: 'failed',
          platform_fee_amount: 15.00,
        })
        .eq('id', bookingId)

      // Notify requester about failed charge
      const requesterEmail = profile.email || user.email
      if (requesterEmail) {
        try {
          await sendEmail({
            to: requesterEmail,
            subject: 'Action needed: platform fee payment failed',
            html: emailTemplate({
              heading: 'Platform fee payment failed',
              body: `
                <p>Your booking has been confirmed, but we couldn't charge the $15 platform fee.</p>
                <p>Please update your payment method to avoid any issues with future bookings.</p>
              `,
              ctaText: 'Update Payment Method',
              ctaUrl: 'https://signpost.community/request/dashboard/profile',
            }),
          })
        } catch (emailErr) {
          console.error('[charge-platform-fee] Failed to send failure notification:', emailErr)
        }
      }

      return NextResponse.json({ status: 'failed' })
    }
  } catch (err) {
    console.error('[charge-platform-fee] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
