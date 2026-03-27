import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

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
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Requester profile not found' }, { status: 404 })
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Stripe customer not set up. Visit payment settings first.' },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const setupIntent = await stripe.setupIntents.create({
      customer: profile.stripe_customer_id,
      payment_method_types: ['card'],
    })

    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (err) {
    console.error('Error creating SetupIntent:', err)
    return NextResponse.json({ error: 'Failed to create setup intent' }, { status: 500 })
  }
}
