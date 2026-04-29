import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, requesterId, reason } = await req.json()
    if (!bookingId || !requesterId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify the booking exists and the cancellation is legitimate
    const { data: booking, error: bookingErr } = await admin
      .from('bookings')
      .select('id, requester_id, status, platform_fee_status')
      .eq('id', bookingId)
      .single()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Prevent duplicate credits for the same booking
    const { data: existingCredit } = await admin
      .from('booking_credits')
      .select('id')
      .eq('source_booking_id', bookingId)
      .maybeSingle()

    if (existingCredit) {
      return NextResponse.json({ status: 'already_credited' })
    }

    // Issue the credit
    const { data: credit, error: creditErr } = await admin
      .from('booking_credits')
      .insert({
        requester_id: requesterId,
        amount: 15.00,
        reason,
        source_booking_id: bookingId,
        status: 'available',
      })
      .select('id')
      .single()

    if (creditErr) {
      console.error('[booking-credit] insert failed:', creditErr.message)
      return NextResponse.json({ error: 'Failed to issue credit' }, { status: 500 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
    try {
      logAudit({ user_id: user.id, action: 'issue_credit', resource_type: 'booking_credit', resource_id: credit.id, metadata: { amount: 15.00, booking_id: bookingId, reason }, ip_address: ip })
    } catch (auditErr) {
      console.error('[audit] booking credit:', auditErr)
    }

    return NextResponse.json({ status: 'credited', creditId: credit.id })
  } catch (err) {
    console.error('[booking-credit] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
