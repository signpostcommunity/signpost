import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verify admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    const { data: userProfile } = await admin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch payment stats
    const [chargedRes, failedRes, creditsRes] = await Promise.all([
      admin
        .from('bookings')
        .select('platform_fee_amount')
        .eq('platform_fee_status', 'charged'),
      admin
        .from('bookings')
        .select('platform_fee_amount')
        .eq('platform_fee_status', 'failed'),
      admin
        .from('booking_credits')
        .select('amount')
        .eq('status', 'available'),
    ])

    const charged = chargedRes.data || []
    const failed = failedRes.data || []
    const credits = creditsRes.data || []

    const totalCollected = charged.reduce((sum, b) => sum + (b.platform_fee_amount || 0), 0)
    const totalFailed = failed.reduce((sum, b) => sum + (b.platform_fee_amount || 0), 0)
    const totalCredits = credits.reduce((sum, c) => sum + (c.amount || 0), 0)

    return NextResponse.json({
      feesCollected: { count: charged.length, total: totalCollected },
      feesFailed: { count: failed.length, total: totalFailed },
      creditsOutstanding: { count: credits.length, total: totalCredits },
    })
  } catch (err) {
    console.error('[admin/payment-stats] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
