import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sanitizeText } from '@/lib/sanitize'

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
    } = body
    // Sanitize user-provided text fields
    const title = body.title ? sanitizeText(body.title) : null
    const location = body.location ? sanitizeText(body.location) : null
    const description = body.description ? sanitizeText(body.description) : null
    const notes = body.notes ? sanitizeText(body.notes) : null

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
    }

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
        .update(bookingData)
        .eq('id', bookingId)

      if (updateErr) {
        console.error('[request/booking] draft update failed:', updateErr.message)
        return NextResponse.json({ error: `Failed to update draft: ${updateErr.message}` }, { status: 500 })
      }

      booking = { id: bookingId }
    } else {
      const { data: newBooking, error: insertError } = await admin
        .from('bookings')
        .insert(bookingData)
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
    if (interpreterIds?.length) {
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
          console.error('[request/booking] booking_recipients insert failed:', recipientErr.message)
        }
      }
    }

    return NextResponse.json({ success: true, bookingId: booking.id })
  } catch (err) {
    console.error('[request/booking] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
