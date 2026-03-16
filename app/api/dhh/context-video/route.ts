import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, contextVideoUrl, contextVideoVisibleBeforeAccept } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Check the user is the requester OR listed in booking_dhh_clients
    const { data: booking } = await admin
      .from('bookings')
      .select('id, requester_id')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    let authorized = booking.requester_id === user.id

    if (!authorized) {
      const { data: dhhClient } = await admin
        .from('booking_dhh_clients')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('dhh_user_id', user.id)
        .maybeSingle()

      authorized = !!dhhClient
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Not authorized to update this booking' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (contextVideoUrl !== undefined) updates.context_video_url = contextVideoUrl
    if (contextVideoVisibleBeforeAccept !== undefined) updates.context_video_visible_before_accept = contextVideoVisibleBeforeAccept

    const { error: updateError } = await admin
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)

    if (updateError) {
      console.error('[context-video] update failed:', updateError.message)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[context-video] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
