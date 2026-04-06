import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sanitizeText } from '@/lib/sanitize'
import { logAudit } from '@/lib/audit'
import { processQualityAlerts } from '@/lib/qualityAlerts'

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
      bookingId,
      interpreterId,
      ratingMetNeeds,
      ratingProfessional,
      wouldBookAgain,
      sharedWithInterpreter,
    } = body
    const feedbackText = body.feedbackText ? sanitizeText(body.feedbackText) : null

    if (!bookingId || !interpreterId || !ratingMetNeeds || !ratingProfessional || !wouldBookAgain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate rating values
    if (ratingMetNeeds < 1 || ratingMetNeeds > 5 || ratingProfessional < 1 || ratingProfessional > 5) {
      return NextResponse.json({ error: 'Ratings must be between 1 and 5' }, { status: 400 })
    }

    if (!['yes', 'maybe', 'no'].includes(wouldBookAgain)) {
      return NextResponse.json({ error: 'Invalid would_book_again value' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify the booking belongs to this user and is completed/past
    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id, status, date, requester_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check the booking belongs to this user (via booking_dhh_clients or requester_id)
    const { data: dhhClientEntry } = await admin
      .from('booking_dhh_clients')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('dhh_user_id', user.id)
      .maybeSingle()

    const isOwner = !!dhhClientEntry || booking.requester_id === user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Not your booking' }, { status: 403 })
    }

    // Check booking is completed or past filled
    const isPast = new Date(booking.date + 'T23:59:59') < new Date()
    if (booking.status !== 'completed' && !(booking.status === 'filled' && isPast)) {
      return NextResponse.json({ error: 'Booking is not completed' }, { status: 400 })
    }

    // Check if already rated (per interpreter per booking)
    const { data: existingRating } = await admin
      .from('interpreter_ratings')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('interpreter_id', interpreterId)
      .maybeSingle()

    if (existingRating) {
      return NextResponse.json({ error: 'Already rated' }, { status: 409 })
    }

    // Insert rating
    const { error: insertError } = await admin
      .from('interpreter_ratings')
      .insert({
        deaf_user_id: user.id,
        interpreter_id: interpreterId,
        booking_id: bookingId,
        rating_met_needs: ratingMetNeeds,
        rating_professional: ratingProfessional,
        would_book_again: wouldBookAgain,
        feedback_text: feedbackText || null,
        shared_with_interpreter: sharedWithInterpreter || false,
      })

    if (insertError) {
      console.error('[dhh/ratings] insert failed:', insertError.message)
      return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
    }

    logAudit({
      user_id: user.id,
      action: 'create',
      resource_type: 'rating',
      resource_id: interpreterId,
      metadata: { booking_id: bookingId },
    })

    // Fire-and-forget quality check after rating
    Promise.resolve(
      admin
        .from('interpreter_profiles')
        .select('name, first_name, last_name')
        .eq('id', interpreterId)
        .maybeSingle()
    )
      .then(({ data: ip }) => {
        const name = ip?.first_name ? `${ip.first_name} ${ip.last_name || ''}`.trim() : ip?.name || 'Interpreter'
        processQualityAlerts(interpreterId, name)
      })
      .catch((e: unknown) => console.error('[dhh/ratings] quality check failed:', e))

    // If shared_with_interpreter is true and there's feedback text, send as a message
    if (sharedWithInterpreter && feedbackText?.trim()) {
      try {
        // Look up interpreter's user_id
        const { data: interpProfile } = await admin
          .from('interpreter_profiles')
          .select('user_id')
          .eq('id', interpreterId)
          .maybeSingle()

        if (interpProfile?.user_id) {
          // Send via the messages API
          const baseUrl = request.nextUrl.origin
          await fetch(`${baseUrl}/api/messages/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: request.headers.get('cookie') || '',
            },
            body: JSON.stringify({
              recipientId: interpProfile.user_id,
              body: feedbackText.trim(),
              subject: 'Feedback on a recent booking',
            }),
          })
        }
      } catch (msgErr) {
        // Non-critical — don't fail the rating if message fails
        console.error('[dhh/ratings] message send failed:', msgErr instanceof Error ? msgErr.message : msgErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[dhh/ratings] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
