import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

// POST: Create or retrieve Stripe Customer for the authenticated requester
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: profile, error: profileError } = await admin
      .from('requester_profiles')
      .select('id, stripe_customer_id, name, org_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Requester profile not found' }, { status: 404 })
    }

    // Already has a Stripe customer
    if (profile.stripe_customer_id) {
      return NextResponse.json({ customerId: profile.stripe_customer_id })
    }

    // Create new Stripe customer
    const stripe = getStripe()
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile.org_name || profile.name || undefined,
      metadata: {
        supabase_user_id: user.id,
        requester_profile_id: profile.id,
      },
    })

    // Store the Stripe customer ID
    const { error: updateError } = await admin
      .from('requester_profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to store stripe_customer_id:', updateError)
      return NextResponse.json({ error: 'Failed to save customer ID' }, { status: 500 })
    }

    return NextResponse.json({ customerId: customer.id })
  } catch (err) {
    console.error('Error creating Stripe customer:', err)
    return NextResponse.json({ error: 'Failed to create Stripe customer' }, { status: 500 })
  }
}
