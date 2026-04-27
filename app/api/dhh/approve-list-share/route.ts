import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications-server'
import { decryptFields } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { connectionId, approved } = body

    if (!connectionId || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Missing connectionId or approved' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify connection belongs to this Deaf user and is pending
    const { data: connection, error: connErr } = await admin
      .from('dhh_requester_connections')
      .select('id, dhh_user_id, requester_id, status')
      .eq('id', connectionId)
      .eq('status', 'pending')
      .maybeSingle()

    if (connErr || !connection) {
      return NextResponse.json({ error: 'Connection not found or not pending' }, { status: 404 })
    }

    // Verify the Deaf user owns this connection
    const { data: deafProfile } = await admin
      .from('deaf_profiles')
      .select('id, first_name')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()

    if (!deafProfile || deafProfile.id !== connection.dhh_user_id) {
      return NextResponse.json({ error: 'Not authorized to manage this connection' }, { status: 403 })
    }

    if (approved) {
      // Update connection to active
      const { error: updateErr } = await admin
        .from('dhh_requester_connections')
        .update({
          status: 'active',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', connectionId)

      if (updateErr) {
        console.error('[approve-list-share] update failed:', updateErr.message)
        return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
      }

      const dhhName = deafProfile.first_name || 'A Deaf/DB/HH user'

      // Check for open bookings where this requester tagged this Deaf user
      const { data: openBookings } = await admin
        .from('bookings')
        .select('id, title, status')
        .eq('requester_id', connection.requester_id)
        .contains('tagged_deaf_user_ids', [deafProfile.id])
        .in('status', ['draft', 'open'])

      // Send notification to requester
      const { data: requesterAuthUser } = await admin.auth.admin.getUserById(connection.requester_id)
      const requesterUserId = requesterAuthUser?.user?.id || connection.requester_id

      if (openBookings && openBookings.length > 0) {
        for (const booking of openBookings) {
          // Only 'title' is in the select; description is not fetched here
          const decryptedBooking = decryptFields(booking, ['title'])
          await createNotification({
            recipientUserId: requesterUserId,
            type: 'preferred_list_shared',
            subject: `${dhhName} shared their preferred interpreter list with you`,
            body: `${dhhName} shared their preferred interpreter list with you. You can now send your request for ${decryptedBooking.title || 'your booking'} to interpreters ${dhhName} trusts.`,
            metadata: {
              dhh_name: dhhName,
              booking_id: booking.id,
              booking_title: decryptedBooking.title || '',
            },
            ctaText: 'View Request',
            ctaUrl: 'https://signpost.community/request/dashboard',
            channel: 'both',
          })
        }
      } else {
        await createNotification({
          recipientUserId: requesterUserId,
          type: 'preferred_list_shared',
          subject: `${dhhName} shared their preferred interpreter list with you`,
          body: `${dhhName} shared their preferred interpreter list with you. When you create a booking for them, you will see their preferred interpreters.`,
          metadata: {
            dhh_name: dhhName,
          },
          ctaText: 'View Dashboard',
          ctaUrl: 'https://signpost.community/request/dashboard',
          channel: 'both',
        })
      }

      return NextResponse.json({ success: true, status: 'approved' })
    } else {
      // Declined: update connection to revoked
      const { error: updateErr } = await admin
        .from('dhh_requester_connections')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        })
        .eq('id', connectionId)

      if (updateErr) {
        console.error('[approve-list-share] revoke failed:', updateErr.message)
        return NextResponse.json({ error: 'Failed to decline' }, { status: 500 })
      }

      return NextResponse.json({ success: true, status: 'declined' })
    }
  } catch (err) {
    console.error('[approve-list-share] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
