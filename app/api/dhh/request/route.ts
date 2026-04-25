import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sanitizeText } from '@/lib/sanitize'
import { encryptFields, decryptFields, BOOKING_ENCRYPTED_FIELDS } from '@/lib/encryption'
import { displayBookingFormat } from '@/lib/bookingFormat'
import { autoAcceptSeeds, getSeedInterpreterIds } from '@/lib/auto-accept-seeds'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify DHH role - check deaf_profiles existence (reliable for multi-role users)
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
      date, timeStart, timeEnd, timezone,
      format, eventType, eventCategory,
      interpreterCount, interpreterIds,
      contextVideoUrl, contextVideoVisibleBeforeAccept,
      saveAsDraft, // Optional: save as draft instead of submitting
      bookingId, // Optional: existing draft ID to update in-place
    } = body
    // Sanitize user-provided text fields
    const title = body.title ? sanitizeText(body.title) : ''
    const location = body.location ? sanitizeText(body.location) : null
    const description = body.description ? sanitizeText(body.description) : null
    // Structured location fields
    const locationName = body.location_name ? sanitizeText(body.location_name) : null
    const locationAddress = body.location_address ? sanitizeText(body.location_address) : null
    const locationCity = body.location_city ? sanitizeText(body.location_city) : null
    const locationState = body.location_state ? sanitizeText(body.location_state) : null
    const locationZip = body.location_zip ? sanitizeText(body.location_zip) : null
    const locationCountry = body.location_country ? sanitizeText(body.location_country) : null
    const meetingLink = body.meeting_link ? sanitizeText(body.meeting_link) : null

    if (!saveAsDraft && (!title || !date || !timeStart || !timeEnd || !format || !interpreterIds?.length)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch the Deaf user's comm prefs and name
    const { data: deafProfile, error: deafError } = await admin
      .from('deaf_profiles')
      .select('comm_prefs, first_name, last_name, name, bio, profile_video_url, share_intro_text_before_confirm, share_intro_video_before_confirm')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()

    if (deafError) {
      console.error('[dhh/request] deaf_profiles lookup failed:', deafError.message)
    }

    const commPrefs = deafProfile?.comm_prefs ?? null
    const dhhClientName = deafProfile?.first_name
      ? `${deafProfile.first_name} ${deafProfile.last_name || ''}`.trim()
      : deafProfile?.name || 'A Deaf user'
    const dbFormat = format
    // Build booking data
    const bookingData = {
      requester_id: user.id,
      status: saveAsDraft ? 'draft' : 'open',
      request_type: 'personal' as const,
      title: title || null,
      date: date || null,
      time_start: timeStart || null,
      time_end: timeEnd || null,
      timezone: timezone || 'America/Los_Angeles',
      format: dbFormat || null,
      location: location || null,
      location_name: locationName,
      location_address: locationAddress,
      location_city: locationCity,
      location_state: locationState,
      location_zip: locationZip,
      location_country: locationCountry,
      meeting_link: meetingLink,
      event_type: eventType || null,
      event_category: eventCategory || null,
      interpreter_count: interpreterCount || (interpreterIds?.length || 1),
      description: description || null,
      notes: description || null,
      requester_name: dhhClientName,
      is_seed: false,
      context_video_url: contextVideoUrl || null,
      context_video_visible_before_accept: contextVideoVisibleBeforeAccept !== false,
    }

    // Encrypt sensitive fields before writing to DB
    const encryptedBookingData = encryptFields(bookingData, [...BOOKING_ENCRYPTED_FIELDS])

    let booking: { id: string }

    // If updating an existing draft, update in-place
    if (bookingId && saveAsDraft) {
      const { data: existing, error: checkErr } = await admin
        .from('bookings')
        .select('id, status, requester_id')
        .eq('id', bookingId)
        .eq('requester_id', user.id)
        .eq('status', 'draft')
        .maybeSingle()

      if (checkErr || !existing) {
        console.error('[dhh/request] draft lookup failed:', checkErr?.message || 'not found')
        return NextResponse.json({ error: 'Draft not found or already submitted' }, { status: 404 })
      }

      const { error: updateErr } = await admin
        .from('bookings')
        .update(encryptedBookingData)
        .eq('id', bookingId)

      if (updateErr) {
        console.error('[dhh/request] draft update failed:', updateErr.message)
        return NextResponse.json({ error: `Failed to update draft: ${updateErr.message}` }, { status: 500 })
      }

      booking = { id: bookingId }

      // For drafts, return early - don't create recipients or send notifications
      return NextResponse.json({ success: true, bookingIds: [booking.id] })
    } else {
      const { data: newBooking, error: insertError } = await admin
        .from('bookings')
        .insert(encryptedBookingData)
        .select('id')
        .single()

      if (insertError) {
        console.error('[dhh/request] booking insert failed:', insertError.message)
        return NextResponse.json({ error: `Failed to create booking: ${insertError.message}` }, { status: 500 })
      }

      booking = newBooking

      // For new drafts, return early - don't create recipients or send notifications
      if (saveAsDraft) {
        return NextResponse.json({ success: true, bookingIds: [booking.id] })
      }
    }

    // Create booking_dhh_client entry (include intro data + sharing prefs in snapshot)
    const shareTextBefore = deafProfile?.share_intro_text_before_confirm !== false
    const shareVideoBefore = deafProfile?.share_intro_video_before_confirm !== false
    const commPrefsSnapshot = {
      ...(commPrefs as Record<string, unknown> || {}),
      bio: deafProfile?.bio || null,
      profile_video_url: deafProfile?.profile_video_url || null,
      share_intro_text_before_confirm: shareTextBefore,
      share_intro_video_before_confirm: shareVideoBefore,
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

    // Pre-fetch seed IDs to skip notifications for seeds
    const seedIds = await getSeedInterpreterIds(interpreterIds)

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

      // Skip notification for seed interpreters (auto-accept handles them below)
      if (seedIds.has(interpreterId)) continue

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
          const formatDisplay = displayBookingFormat(dbFormat)
          const dateDisplay = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''
          const timeDisplay = timeStart && timeEnd ? `${timeStart} - ${timeEnd}` : (timeStart || '')

          const notifBody = {
            recipientUserId: interpProfile.user_id,
            type: 'new_request',
            subject: `New request on signpost: ${title}${date ? ', ' + dateDisplay : ''}`,
            body: `${dhhClientName} has sent you a request. Review the details and respond with your rate.`,
            metadata: {
              bookingId: booking.id,
              requestType: 'personal',
              dhhClientName,
              booking_title: title,
              booking_date: dateDisplay,
              booking_time: timeDisplay,
              booking_location: location || '',
              booking_format: dbFormat || '',
              requester_name: dhhClientName,
              title,
              date: dateDisplay,
              time: timeDisplay,
              location: location || '',
              format: dbFormat || '',
            },
            ctaText: 'Review and Respond',
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

    // Auto-accept any seed interpreter recipients
    if (seedIds.size > 0) {
      try {
        const dateDisplay = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : undefined
        const timeDisplay = timeStart && timeEnd ? `${timeStart} - ${timeEnd}` : undefined

        await autoAcceptSeeds({
          bookingId: booking.id,
          interpreterIds,
          requesterUserId: user.id,
          bookingTitle: title || 'Untitled',
          bookingDate: dateDisplay,
          bookingTime: timeDisplay,
          bookingLocation: location || undefined,
          bookingFormat: dbFormat || undefined,
          requesterName: dhhClientName,
        })
      } catch (autoAcceptErr) {
        console.error('[dhh/request] auto-accept seeds failed:', autoAcceptErr)
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
        location_name, location_address, location_city, location_state,
        location_zip, location_country, meeting_link,
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

    // Build a set of booking IDs that were made FOR this user (not BY them)
    const onBehalfBookingIds = new Set(
      dhhBookingIds.filter(id => !reqBookingIds.includes(id))
    )

    // Fetch requester info for on-behalf bookings
    let requesterMap: Record<string, { name: string; org_name: string | null }> = {}
    if (onBehalfBookingIds.size > 0) {
      const onBehalfBookings = (bookings || []).filter(b => onBehalfBookingIds.has(b.id))
      const requesterIds = [...new Set(onBehalfBookings.map(b => (b as Record<string, unknown>).requester_id as string).filter(Boolean))]

      if (requesterIds.length > 0) {
        // Check requester_profiles for org names
        const { data: reqProfiles } = await admin
          .from('requester_profiles')
          .select('id, name, org_name')
          .in('id', requesterIds)

        for (const rp of reqProfiles || []) {
          requesterMap[rp.id] = { name: rp.name, org_name: rp.org_name }
        }

        // Also check dhh_requester_connections for stored org names
        if (dhhEntries && dhhEntries.length > 0) {
          const { data: connections } = await admin
            .from('dhh_requester_connections')
            .select('requester_id, requester_org_name')
            .in('requester_id', requesterIds)

          for (const conn of connections || []) {
            if (conn.requester_org_name && requesterMap[conn.requester_id]) {
              requesterMap[conn.requester_id].org_name = conn.requester_org_name
            }
          }
        }
      }
    }

    const enriched = (bookings || []).map(rawBooking => {
      const b = decryptFields(rawBooking, [...BOOKING_ENCRYPTED_FIELDS])
      // On professional bookings the Deaf user is a participant, not the
      // requester, and must not see interpreter rates, response notes, or
      // decline reasons. On personal bookings the Deaf user IS the requester
      // and needs those fields to pick an interpreter. Redact on the way out
      // rather than in the select so TypeScript sees consistent shapes.
      const redactRateFields = b.request_type !== 'personal'
      const bookingRecipients = (recipientsByBooking[b.id] || []).map(r => ({
        ...r,
        interpreter: interpreterMap[r.interpreter_id] || null,
        ...(redactRateFields ? {
          response_rate: null,
          response_notes: null,
          decline_reason: null,
        } : {}),
      }))

      const isOnBehalf = onBehalfBookingIds.has(b.id)
      const requesterId = (b as Record<string, unknown>).requester_id as string
      const requesterInfo = isOnBehalf && requesterId ? requesterMap[requesterId] : null
      const requestedByDisplay = requesterInfo
        ? requesterInfo.org_name
          ? `Requested by ${requesterInfo.org_name}`
          : `Requested by ${requesterInfo.name}`
        : isOnBehalf
          ? `Requested by ${b.requester_name || 'a requester'}`
          : null

      return {
        ...b,
        recipients: bookingRecipients,
        is_on_behalf: isOnBehalf,
        requested_by_display: requestedByDisplay,
      }
    })

    return NextResponse.json({ bookings: enriched })
  } catch (err) {
    console.error('[dhh/request] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
