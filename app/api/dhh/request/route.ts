import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify DHH role — check deaf_profiles existence (reliable for multi-role users)
    const admin = getSupabaseAdmin()
    const { data: deafRow, error: deafCheckError } = await admin
      .from('deaf_profiles')
      .select('id')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()

    if (deafCheckError) {
      console.error('[dhh/request] deaf_profiles check failed:', deafCheckError.message)
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    if (!deafRow) {
      // Fallback: check user_profiles.role or pending_roles
      const { data: userProfile } = await admin
        .from('user_profiles')
        .select('role, pending_roles')
        .eq('id', user.id)
        .single()

      const hasDeafRole = userProfile?.role === 'deaf' ||
        (Array.isArray(userProfile?.pending_roles) && userProfile.pending_roles.includes('deaf'))

      if (!hasDeafRole) {
        return NextResponse.json({ error: 'Only Deaf/DB/HH users can create personal requests' }, { status: 403 })
      }
    }

    const body = await request.json()
    const {
      title, date, timeStart, timeEnd, timezone,
      format, location, eventType, eventCategory,
      interpreterCount, description, interpreterIds,
      contextVideoUrl, contextVideoVisibleBeforeAccept,
    } = body

    if (!title || !date || !timeStart || !timeEnd || !format || !interpreterIds?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch the Deaf user's comm prefs and name
    const { data: deafProfile, error: deafError } = await admin
      .from('deaf_profiles')
      .select('comm_prefs, first_name, last_name, name, profile_video_url')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()

    if (deafError) {
      console.error('[dhh/request] deaf_profiles lookup failed:', deafError.message)
    }

    const commPrefs = deafProfile?.comm_prefs ?? null
    const dhhClientName = deafProfile?.first_name
      ? `${deafProfile.first_name} ${deafProfile.last_name || ''}`.trim()
      : deafProfile?.name || 'A Deaf user'

    // Map format value for DB constraint (in_person, remote, hybrid)
    const dbFormat = format === 'in-person' ? 'in_person' : format

    // Create ONE booking (the request)
    const { data: booking, error: insertError } = await admin
      .from('bookings')
      .insert({
        requester_id: user.id,
        status: 'open',
        request_type: 'personal',
        title,
        date,
        time_start: timeStart,
        time_end: timeEnd,
        timezone: timezone || 'America/Los_Angeles',
        format: dbFormat,
        location: location || null,
        event_type: eventType || null,
        event_category: eventCategory || null,
        interpreter_count: interpreterCount || interpreterIds.length,
        description: description || null,
        notes: description || null,
        requester_name: dhhClientName,
        is_seed: false,
        context_video_url: contextVideoUrl || null,
        context_video_visible_before_accept: contextVideoVisibleBeforeAccept !== false,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[dhh/request] booking insert failed:', insertError.message)
      return NextResponse.json({ error: `Failed to create booking: ${insertError.message}` }, { status: 500 })
    }

    // Create booking_dhh_client entry (include profile_video_url in snapshot)
    const commPrefsSnapshot = {
      ...(commPrefs as Record<string, unknown> || {}),
      profile_video_url: deafProfile?.profile_video_url || null,
    }
    const { error: dhhClientErr } = await admin
      .from('booking_dhh_clients')
      .insert({
        booking_id: booking.id,
        dhh_user_id: user.id,
        comm_prefs_snapshot: commPrefsSnapshot,
        added_at: new Date().toISOString(),
      })

    if (dhhClientErr) {
      console.error('[dhh/request] booking_dhh_clients insert failed:', dhhClientErr.message)
    }

    // Create booking_recipients for each interpreter
    for (const interpreterId of interpreterIds) {
      const { error: recipientErr } = await admin
        .from('booking_recipients')
        .insert({
          booking_id: booking.id,
          interpreter_id: interpreterId,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })

      if (recipientErr) {
        console.error('[dhh/request] booking_recipients insert failed:', recipientErr.message)
      }

      // Look up interpreter's user_id for notification
      const { data: interpProfile, error: interpError } = await admin
        .from('interpreter_profiles')
        .select('user_id')
        .eq('id', interpreterId)
        .maybeSingle()

      if (interpError) {
        console.error('[dhh/request] interpreter_profiles lookup failed:', interpError.message)
      }

      if (interpProfile?.user_id) {
        // Fire notification via the notifications API
        try {
          const notifBody = {
            recipientUserId: interpProfile.user_id,
            type: 'new_request',
            subject: `New request: ${date}, ${timeStart}, ${dhhClientName}`,
            body: `${dhhClientName} has sent you a personal interpreter request:\n• ${title}\n• ${date}, ${timeStart} - ${timeEnd} (${timezone || 'PT'})\n• ${location || 'Remote'}`,
            metadata: {
              bookingId: booking.id,
              requestType: 'personal',
              dhhClientName,
            },
            ctaText: 'View Request',
            ctaUrl: `https://signpost.community/interpreter/dashboard/inquiries`,
            channel: 'both',
          }

          // Use internal fetch to the notifications API
          const baseUrl = request.nextUrl.origin
          await fetch(`${baseUrl}/api/notifications/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: request.headers.get('cookie') || '',
            },
            body: JSON.stringify(notifBody),
          })
        } catch (notifErr) {
          console.error('[dhh/request] notification send failed:', notifErr instanceof Error ? notifErr.message : notifErr)
          // Don't fail the booking creation if notification fails
        }
      }
    }

    return NextResponse.json({ success: true, bookingIds: [booking.id] })
  } catch (err) {
    console.error('[dhh/request] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Get bookings where this user is a DHH client (via booking_dhh_clients)
    const { data: dhhEntries, error: dhhErr } = await admin
      .from('booking_dhh_clients')
      .select('booking_id')
      .eq('dhh_user_id', user.id)

    // Also check bookings where user is the requester (for backwards compat)
    const { data: reqBookings, error: reqErr } = await admin
      .from('bookings')
      .select('id')
      .eq('requester_id', user.id)

    const dhhBookingIds = (dhhEntries || []).map(e => e.booking_id)
    const reqBookingIds = (reqBookings || []).map(b => b.id)
    const allBookingIds = [...new Set([...dhhBookingIds, ...reqBookingIds])]

    if (allBookingIds.length === 0) {
      return NextResponse.json({ bookings: [] })
    }

    const { data: bookings, error: fetchError } = await admin
      .from('bookings')
      .select(`
        id, title, date, time_start, time_end, timezone, location, format,
        status, request_type, event_type, event_category, interpreter_count,
        description, notes, is_seed,
        cancellation_reason, cancelled_by, cancelled_at, sub_search_initiated,
        created_at, requester_name,
        context_video_url, context_video_visible_before_accept
      `)
      .in('id', allBookingIds)
      .order('date', { ascending: false })

    if (fetchError) {
      console.error('[dhh/request] GET bookings failed:', fetchError.message)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    // Get full recipient data for each booking via booking_recipients
    const { data: recipients } = await admin
      .from('booking_recipients')
      .select(`
        id, booking_id, interpreter_id, status, wave_number,
        sent_at, viewed_at, responded_at, confirmed_at, declined_at, withdrawn_at,
        response_rate, response_notes, decline_reason
      `)
      .in('booking_id', allBookingIds)

    // Build per-booking recipient lookup
    const recipientsByBooking: Record<string, NonNullable<typeof recipients>> = {}
    for (const r of recipients || []) {
      if (!recipientsByBooking[r.booking_id]) recipientsByBooking[r.booking_id] = []
      recipientsByBooking[r.booking_id].push(r)
    }

    const allInterpreterIds = [...new Set((recipients || []).map(r => r.interpreter_id))]
    let interpreterMap: Record<string, { name: string; first_name: string | null; last_name: string | null; photo_url: string | null }> = {}

    if (allInterpreterIds.length > 0) {
      const { data: interpreters, error: interpError } = await admin
        .from('interpreter_profiles')
        .select('id, name, first_name, last_name, photo_url')
        .in('id', allInterpreterIds)

      if (interpError) {
        console.error('[dhh/request] interpreter lookup failed:', interpError.message)
      }

      for (const interp of interpreters || []) {
        interpreterMap[interp.id] = {
          name: interp.first_name ? `${interp.first_name} ${interp.last_name || ''}`.trim() : interp.name || 'Interpreter',
          first_name: interp.first_name,
          last_name: interp.last_name,
          photo_url: interp.photo_url,
        }
      }
    }

    const enriched = (bookings || []).map(b => {
      const bookingRecipients = (recipientsByBooking[b.id] || []).map(r => ({
        ...r,
        interpreter: interpreterMap[r.interpreter_id] || null,
      }))
      return {
        ...b,
        recipients: bookingRecipients,
      }
    })

    return NextResponse.json({ bookings: enriched })
  } catch (err) {
    console.error('[dhh/request] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
