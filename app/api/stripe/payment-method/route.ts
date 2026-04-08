import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

// GET: Retrieve the requester's saved payment method details
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: profile, error: profileError } = await admin
      .from('requester_profiles')
      .select('stripe_customer_id, stripe_default_payment_method_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Requester profile not found' }, { status: 404 })
    }

    if (!profile.stripe_default_payment_method_id) {
      return NextResponse.json({ paymentMethod: null })
    }

    const stripe = getStripe()
    try {
      const pm = await stripe.paymentMethods.retrieve(profile.stripe_default_payment_method_id)
      return NextResponse.json({
        paymentMethod: {
          id: pm.id,
          brand: pm.card?.brand || 'unknown',
          last4: pm.card?.last4 || '****',
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year,
        },
      })
    } catch {
      // Payment method no longer exists in Stripe - clear the local reference
      await admin
        .from('requester_profiles')
        .update({ stripe_default_payment_method_id: null })
        .eq('user_id', user.id)
      return NextResponse.json({ paymentMethod: null })
    }
  } catch (err) {
    console.error('Error fetching payment method:', err)
    return NextResponse.json({ error: 'Failed to fetch payment method' }, { status: 500 })
  }
}

// POST: Save a payment method after SetupIntent confirmation
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = await req.json()
    if (!paymentMethodId) {
      return NextResponse.json({ error: 'paymentMethodId is required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data: profile, error: profileError } = await admin
      .from('requester_profiles')
      .select('stripe_customer_id, stripe_default_payment_method_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || !profile.stripe_customer_id) {
      return NextResponse.json({ error: 'Stripe customer not found' }, { status: 404 })
    }

    const stripe = getStripe()

    // Detach old payment method if one exists
    if (profile.stripe_default_payment_method_id) {
      try {
        await stripe.paymentMethods.detach(profile.stripe_default_payment_method_id)
      } catch {
        // Old method may already be detached - continue
      }
    }

    // Set as default payment method on the Stripe customer
    await stripe.customers.update(profile.stripe_customer_id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Store reference locally
    const { error: updateError } = await admin
      .from('requester_profiles')
      .update({ stripe_default_payment_method_id: paymentMethodId })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to store payment method ID:', updateError)
      return NextResponse.json({ error: 'Failed to save payment method' }, { status: 500 })
    }

    // Return the card details
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    return NextResponse.json({
      paymentMethod: {
        id: pm.id,
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '****',
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      },
    })
  } catch (err) {
    console.error('Error saving payment method:', err)
    return NextResponse.json({ error: 'Failed to save payment method' }, { status: 500 })
  }
}

// DELETE: Remove saved payment method
export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: profile, error: profileError } = await admin
      .from('requester_profiles')
      .select('stripe_default_payment_method_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Requester profile not found' }, { status: 404 })
    }

    if (!profile.stripe_default_payment_method_id) {
      return NextResponse.json({ success: true })
    }

    const stripe = getStripe()
    try {
      await stripe.paymentMethods.detach(profile.stripe_default_payment_method_id)
    } catch {
      // Already detached - continue
    }

    const { error: updateError } = await admin
      .from('requester_profiles')
      .update({ stripe_default_payment_method_id: null })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to clear payment method ID:', updateError)
      return NextResponse.json({ error: 'Failed to remove payment method' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error removing payment method:', err)
    return NextResponse.json({ error: 'Failed to remove payment method' }, { status: 500 })
  }
}
