import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications-server'
import { chargePlatformFee } from '@/lib/charge-platform-fee'
import { decryptFields } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

interface ConfirmRequestBody {
  bookingId: string
  recipientId: string
  newDateTime?: {
    date: string
    timeStart: string
    timeEnd: string
  }
}

function formatBookingDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatBookingTime(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return ''
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as ConfirmRequestBody
    const { bookingId, recipientId, newDateTime } = body

    if (!bookingId || !recipientId) {
      return NextResponse.json({ success: false, error: 'Missing bookingId or recipientId' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // 1. Fetch booking
    const { data: booking, error: bookingErr } = await admin
      .from('bookings')
      .select('id, requester_id, request_type, title, date, time_start, time_end, location, format, location_name, location_address, location_city, location_state, onsite_contact_name, onsite_contact_phone, onsite_contact_email, prep_notes, interpreter_count, interpreters_confirmed, status')
      .eq('id', bookingId)
      .single()

    if (bookingErr || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    // Decrypt encrypted fields before use in notifications/emails
    // Only 'title' is in the select; description is not fetched here
    const decryptedBooking = decryptFields(booking, ['title'])

    // 2. Authorize: must be the requester, OR a tagged DHH client on a personal booking
    let authorized = booking.requester_id === user.id
    if (!authorized && booking.request_type === 'personal') {
      const { data: dhhClient } = await admin
        .from('booking_dhh_clients')
        .select('dhh_user_id')
        .eq('booking_id', bookingId)
        .eq('dhh_user_id', user.id)
        .maybeSingle()
      if (dhhClient) authorized = true
    }
    if (!authorized) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 3. Fetch the recipient row
    const { data: recipient, error: recFetchErr } = await admin
      .from('booking_recipients')
      .select('id, booking_id, interpreter_id, status')
      .eq('id', recipientId)
      .eq('booking_id', bookingId)
      .single()

    if (recFetchErr || !recipient) {
      return NextResponse.json({ success: false, error: 'Recipient not found' }, { status: 404 })
    }

    if (recipient.status === 'confirmed') {
      // Already confirmed -- idempotent return, no re-sending notifications
      return NextResponse.json({ success: true, bookingFilled: false })
    }

    // 3b. Pre-check gate: reject early if booking already filled
    if (booking.status === 'filled') {
      return NextResponse.json(
        { success: false, error: 'This booking is already filled by another interpreter.' },
        { status: 409 },
      )
    }

    const { count: preConfirmedCount } = await admin
      .from('booking_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('booking_id', bookingId)
      .eq('status', 'confirmed')

    if ((preConfirmedCount ?? 0) >= (booking.interpreter_count || 1)) {
      return NextResponse.json(
        { success: false, error: 'This booking is already filled.' },
        { status: 409 },
      )
    }

    // 4. Charge platform fee (blocks confirmation on failure)
    const chargeResult = await chargePlatformFee(bookingId)

    if (chargeResult.status === 'failed') {
      return NextResponse.json(
        { success: false, error: chargeResult.userMessage, code: chargeResult.code },
        { status: 402 },
      )
    }

    // If charged, already_charged, or waived -- proceed with confirmation

    // 5. Atomic confirm: locks booking row, rechecks count, updates recipient
    const { data: gateResult, error: gateErr } = await admin
      .rpc('confirm_recipient_if_available', {
        p_booking_id: bookingId,
        p_recipient_id: recipientId,
      })

    if (gateErr) {
      console.error('[confirm-recipient] atomic gate error:', gateErr.message)
      return NextResponse.json({ success: false, error: 'Failed to confirm recipient' }, { status: 500 })
    }

    if (gateResult === false) {
      return NextResponse.json(
        { success: false, error: 'This booking was just filled by another interpreter.' },
        { status: 409 },
      )
    }

    // 5. Optionally update booking date/time (proposed alternative time)
    let effectiveDate = booking.date as string
    let effectiveTimeStart = booking.time_start as string
    let effectiveTimeEnd = booking.time_end as string
    if (newDateTime) {
      const { error: dtErr } = await admin
        .from('bookings')
        .update({
          date: newDateTime.date,
          time_start: newDateTime.timeStart,
          time_end: newDateTime.timeEnd,
        })
        .eq('id', bookingId)
      if (dtErr) {
        console.error('[confirm-recipient] booking date/time update error:', dtErr.message)
      } else {
        effectiveDate = newDateTime.date
        effectiveTimeStart = newDateTime.timeStart
        effectiveTimeEnd = newDateTime.timeEnd
      }
    }

    // 6. Recount confirmed (interpreters_confirmed is unreliable)
    const { data: allRecs } = await admin
      .from('booking_recipients')
      .select('id, status, interpreter_id')
      .eq('booking_id', bookingId)

    const confirmedCount = (allRecs || []).filter(r => r.status === 'confirmed').length
    const interpreterCount = booking.interpreter_count || 1

    // 7. Update interpreters_confirmed (write-only)
    const { error: countErr } = await admin
      .from('bookings')
      .update({ interpreters_confirmed: confirmedCount })
      .eq('id', bookingId)
    if (countErr) {
      console.error('[confirm-recipient] confirmed count update error:', countErr.message)
    }

    // 8. Look up requester display name
    let requesterName = ''
    {
      const { data: reqProfile } = await admin
        .from('requester_profiles')
        .select('name, org_name')
        .eq('id', booking.requester_id)
        .maybeSingle()
      requesterName = reqProfile?.org_name || reqProfile?.name || ''
      if (!requesterName) {
        // Personal-booking requester is a Deaf user
        const { data: deafProfile } = await admin
          .from('deaf_profiles')
          .select('name, first_name, last_name')
          .or(`id.eq.${booking.requester_id},user_id.eq.${booking.requester_id}`)
          .maybeSingle()
        requesterName = deafProfile?.first_name && deafProfile?.last_name
          ? `${deafProfile.first_name} ${deafProfile.last_name}`
          : (deafProfile?.name || 'Requester')
      }
    }

    // 9. Look up chosen interpreter details
    const { data: chosenInterp } = await admin
      .from('interpreter_profiles')
      .select('id, user_id, name, first_name, last_name')
      .eq('id', recipient.interpreter_id)
      .single()

    const interpreterName = chosenInterp?.first_name && chosenInterp?.last_name
      ? `${chosenInterp.first_name} ${chosenInterp.last_name}`
      : chosenInterp?.name || 'Interpreter'

    const dateFormatted = formatBookingDate(effectiveDate)
    const timeFormatted = formatBookingTime(effectiveTimeStart, effectiveTimeEnd)
    const bookingTitle = decryptedBooking.title || 'Untitled Request'

    const sharedMeta = {
      booking_id: bookingId,
      booking_title: bookingTitle,
      booking_date: dateFormatted,
      booking_time: timeFormatted,
      booking_location: booking.location || '',
      booking_format: booking.format || '',
      requester_name: requesterName,
      interpreter_name: interpreterName,
    }

    // 10. Notify chosen interpreter
    if (chosenInterp?.user_id) {
      try {
        await createNotification({
          recipientUserId: chosenInterp.user_id,
          type: 'booking_confirmed',
          subject: `Booking confirmed: ${bookingTitle}${dateFormatted ? `, ${dateFormatted}` : ''}`,
          body: `Your booking with ${requesterName} has been confirmed.`,
          metadata: { ...sharedMeta, recipient_role: 'interpreter' },
          ctaText: 'View Confirmed Booking',
          ctaUrl: 'https://signpost.community/interpreter/dashboard/confirmed',
        })
      } catch (e) {
        console.error('[confirm-recipient] interpreter notification failed:', e instanceof Error ? e.message : e)
      }
    }

    // 11. Notify requester (receipt)
    try {
      await createNotification({
        recipientUserId: booking.requester_id,
        type: 'booking_confirmed',
        subject: `Booking confirmed: ${bookingTitle}${dateFormatted ? `, ${dateFormatted}` : ''}`,
        body: `${interpreterName} has been confirmed for your request.`,
        metadata: { ...sharedMeta, recipient_role: 'requester' },
        ctaText: 'View Booking Details',
        ctaUrl: 'https://signpost.community/request/dashboard/requests',
      })
    } catch (e) {
      console.error('[confirm-recipient] requester notification failed:', e instanceof Error ? e.message : e)
    }

    // 12. If booking is now full, mark filled and notify other responded/proposed interpreters
    let bookingFilled = false
    if (confirmedCount >= interpreterCount) {
      const { error: fillErr } = await admin
        .from('bookings')
        .update({ status: 'filled' })
        .eq('id', bookingId)
      if (fillErr) {
        console.error('[confirm-recipient] mark filled error:', fillErr.message)
      }
      bookingFilled = true

      // Find other recipients who responded but were not chosen
      const otherRecipients = (allRecs || []).filter(
        r => r.id !== recipientId && (r.status === 'responded' || r.status === 'proposed')
      )

      for (const other of otherRecipients) {
        try {
          const { data: otherInterp } = await admin
            .from('interpreter_profiles')
            .select('user_id, name, first_name, last_name')
            .eq('id', other.interpreter_id)
            .maybeSingle()

          if (!otherInterp?.user_id) continue

          await createNotification({
            recipientUserId: otherInterp.user_id,
            type: 'booking_filled_other_selected',
            subject: 'A booking you responded to has been filled',
            body: `Thanks for responding to ${requesterName}'s request for ${bookingTitle} on ${dateFormatted}. They've confirmed another interpreter, so this booking is now filled. You're free to take other work, as always. No action needed on your part.`,
            metadata: { ...sharedMeta, recipient_role: 'interpreter' },
            ctaText: 'View your inquiries',
            ctaUrl: 'https://signpost.community/interpreter/dashboard/inquiries',
          })
        } catch (e) {
          console.error('[confirm-recipient] other-interpreter notification failed:', e instanceof Error ? e.message : e)
        }
      }
    }

    return NextResponse.json({ success: true, bookingFilled })
  } catch (err) {
    console.error('[confirm-recipient] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
