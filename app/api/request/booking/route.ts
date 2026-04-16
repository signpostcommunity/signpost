import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sanitizeText } from '@/lib/sanitize'
import { encryptFields, BOOKING_ENCRYPTED_FIELDS } from '@/lib/encryption'
import { logAudit } from '@/lib/audit'
import { createNotification } from '@/lib/notifications-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      date, timeStart, timeEnd, timezone,
      format, eventType, eventCategory,
      interpreterCount, interpreterIds,
      forDhhUserId, // Optional: DHH user ID from connection system
      specialization, recurrence,
      saveAsDraft, // Optional: save as draft instead of submitting
      bookingId, // Optional: existing draft ID to update in-place
      tagged_deaf_user_ids, // Optional: Deaf user IDs tagged on this request
    } = body
    // Sanitize user-provided text fields
    const title = body.title ? sanitizeText(body.title) : null
    const location = body.location ? sanitizeText(body.location) : null
    const description = body.description ? sanitizeText(body.description) : null
    const notes = body.notes ? sanitizeText(body.notes) : null
    const prepNotes = body.prep_notes ? sanitizeText(body.prep_notes) : null
    const onsiteContactName = body.onsite_contact_name ? sanitizeText(body.onsite_contact_name) : null
    const onsiteContactPhone = body.onsite_contact_phone ? sanitizeText(body.onsite_contact_phone) : null
    const onsiteContactEmail = body.onsite_contact_email ? sanitizeText(body.onsite_contact_email) : null
    // Structured location fields
    const locationName = body.location_name ? sanitizeText(body.location_name) : null
    const locationAddress = body.location_address ? sanitizeText(body.location_address) : null
    const locationCity = body.location_city ? sanitizeText(body.location_city) : null
    const locationState = body.location_state ? sanitizeText(body.location_state) : null
    const locationZip = body.location_zip ? sanitizeText(body.location_zip) : null
    const locationCountry = body.location_country ? sanitizeText(body.location_country) : null
    const meetingLink = body.meeting_link ? sanitizeText(body.meeting_link) : null

    if (!saveAsDraft && (!title || !date || !timeStart || !timeEnd || !format)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Get requester profile (includes payment method check)
    const { data: reqProfile } = await admin
      .from('requester_profiles')
      .select('name, org_name, stripe_default_payment_method_id')
      .eq('id', user.id)
      .maybeSingle()

    // Gate: require payment method for non-draft submissions
    if (!saveAsDraft && !reqProfile?.stripe_default_payment_method_id) {
      return NextResponse.json(
        { error: 'A payment method is required to submit requests. Add one in your profile settings.' },
        { status: 402 }
      )
    }

    const requesterName = reqProfile?.org_name || reqProfile?.name || 'Requester'

    // Map format value for DB constraint
    const dbFormat = format === 'in-person' ? 'in_person' : format

    const count = interpreterCount || (interpreterIds?.length || 1)

    const bookingData = {
      requester_id: user.id,
      status: saveAsDraft ? 'draft' : 'open',
      request_type: 'professional' as const,
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
      specialization: specialization || null,
      recurrence: recurrence || 'one-time',
      interpreter_count: count,
      description: description || null,
      notes: notes || null,
      requester_name: requesterName,
      platform_fee_amount: 15.0 * count,
      platform_fee_status: 'pending',
      is_seed: false,
      tagged_deaf_user_ids: Array.isArray(tagged_deaf_user_ids) ? tagged_deaf_user_ids : [],
      prep_notes: prepNotes,
      onsite_contact_name: onsiteContactName,
      onsite_contact_phone: onsiteContactPhone,
      onsite_contact_email: onsiteContactEmail,
    }

    // Encrypt sensitive fields before writing to DB
    const encryptedBookingData = encryptFields(bookingData, [...BOOKING_ENCRYPTED_FIELDS])

    let booking: { id: string }

    // If updating an existing draft, update in-place instead of creating new
    if (bookingId && saveAsDraft) {
      const { data: existing, error: checkErr } = await admin
        .from('bookings')
        .select('id, status, requester_id')
        .eq('id', bookingId)
        .eq('requester_id', user.id)
        .eq('status', 'draft')
        .maybeSingle()

      if (checkErr || !existing) {
        console.error('[request/booking] draft lookup failed:', checkErr?.message || 'not found')
        return NextResponse.json({ error: 'Draft not found or already submitted' }, { status: 404 })
      }

      const { error: updateErr } = await admin
        .from('bookings')
        .update(encryptedBookingData)
        .eq('id', bookingId)

      if (updateErr) {
        console.error('[request/booking] draft update failed:', updateErr.message)
        return NextResponse.json({ error: `Failed to update draft: ${updateErr.message}` }, { status: 500 })
      }

      booking = { id: bookingId }
    } else {
      const { data: newBooking, error: insertError } = await admin
        .from('bookings')
        .insert(encryptedBookingData)
        .select('id')
        .single()

      if (insertError) {
        console.error('[request/booking] booking insert failed:', insertError.message)
        return NextResponse.json({ error: `Failed to create booking: ${insertError.message}` }, { status: 500 })
      }

      booking = newBooking
    }

    // If booking is for a connected DHH user, add them to booking_dhh_clients
    if (forDhhUserId) {
      const { data: deafProfile, error: deafError } = await admin
        .from('deaf_profiles')
        .select('id, comm_prefs')
        .eq('id', forDhhUserId)
        .maybeSingle()

      if (deafError) {
        console.error('[request/booking] deaf_profiles lookup failed:', deafError.message)
      }

      if (deafProfile) {
        const { error: dhhClientErr } = await admin
          .from('booking_dhh_clients')
          .insert({
            booking_id: booking.id,
            dhh_user_id: deafProfile.id,
            comm_prefs_snapshot: deafProfile.comm_prefs || {},
            added_at: new Date().toISOString(),
          })

        if (dhhClientErr) {
          // Log but don't fail the booking
          console.error('[request/booking] booking_dhh_clients insert failed:', dhhClientErr.message)
        }
      }
    }

    // Create booking_recipients for each interpreter (if provided)
    if (interpreterIds?.length && !saveAsDraft) {
      for (const interpreterId of interpreterIds) {
        const { error: recipientErr } = await admin
          .from('booking_recipients')
          .insert({
            booking_id: booking.id,
            interpreter_id: interpreterId,
            status: 'sent',
            wave_number: 1,
            sent_at: new Date().toISOString(),
          })

        if (recipientErr) {
          console.error('[request/booking] booking_recipients insert failed:', recipientErr.message)
        }

        // Send notification to interpreter
        try {
          // Look up the interpreter's user_id from interpreter_profiles
          const { data: interpProfile } = await admin
            .from('interpreter_profiles')
            .select('user_id')
            .eq('id', interpreterId)
            .maybeSingle()

          if (interpProfile?.user_id) {
            await createNotification({
              recipientUserId: interpProfile.user_id,
              type: 'new_request',
              subject: `New interpreter request: ${title || 'Untitled'}`,
              body: `${requesterName} has sent you an interpreter request${date ? ` for ${date}` : ''}. Review the details and respond with your rate.`,
              metadata: { booking_id: booking.id },
              ctaText: 'View Request',
              ctaUrl: `/interpreter/dashboard/inquiries`,
              channel: 'both',
            })
          }
        } catch (notifErr) {
          console.error('[request/booking] notification send failed:', notifErr)
        }
      }
    }

    logAudit({
      user_id: user.id,
      action: saveAsDraft ? 'update' : (bookingId ? 'update' : 'create'),
      resource_type: 'booking',
      resource_id: booking.id,
      metadata: { status: saveAsDraft ? 'draft' : 'open', interpreter_count: count },
    })

    return NextResponse.json({ success: true, bookingId: booking.id })
  } catch (err) {
    console.error('[request/booking] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
