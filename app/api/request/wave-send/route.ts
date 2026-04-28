import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications-server'
import { sanitizeText } from '@/lib/sanitize'
import { autoAcceptSeeds, getSeedInterpreterIds } from '@/lib/auto-accept-seeds'
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
    const { bookingId, interpreterIds } = body

    if (!bookingId || !interpreterIds?.length) {
      return NextResponse.json({ error: 'Missing bookingId or interpreterIds' }, { status: 400 })
    }

    if (interpreterIds.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 interpreters per wave' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify booking belongs to this requester
    const { data: booking, error: bookingErr } = await admin
      .from('bookings')
      .select('id, requester_id, title, date, time_start, time_end, location, format, current_wave, status, tagged_deaf_user_ids')
      .eq('id', bookingId)
      .eq('requester_id', user.id)
      .maybeSingle()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Decrypt encrypted fields before use in notifications/emails
    // Only 'title' is used here; description is not in the select
    const decryptedBooking = decryptFields(booking, ['title'])

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return NextResponse.json({ error: 'Cannot send to more interpreters for this booking' }, { status: 400 })
    }

    // Check for duplicate interpreter IDs (already in any wave)
    const { data: existingRecipients } = await admin
      .from('booking_recipients')
      .select('interpreter_id')
      .eq('booking_id', bookingId)

    const existingIds = new Set((existingRecipients || []).map(r => r.interpreter_id))
    const newIds = interpreterIds.filter((id: string) => !existingIds.has(id))

    if (newIds.length === 0) {
      return NextResponse.json({ error: 'All selected interpreters have already been contacted' }, { status: 400 })
    }

    // DNB filter: exclude interpreters on any tagged Deaf user's Do Not Book list
    let filteredIds = newIds as string[]
    const taggedDeafIds = (booking as Record<string, unknown>).tagged_deaf_user_ids as string[] | null
    if (taggedDeafIds && taggedDeafIds.length > 0) {
      const { data: dnbRows, error: dnbError } = await admin
        .from('deaf_roster')
        .select('interpreter_id')
        .in('deaf_user_id', taggedDeafIds)
        .in('interpreter_id', filteredIds)
        .or('do_not_book.eq.true,tier.eq.dnb')

      if (dnbError) {
        console.error('[wave-send] DNB filter query failed:', dnbError.message)
        return NextResponse.json({ error: 'DNB filter query failed; aborting wave to protect DNB rule' }, { status: 500 })
      }

      const dnbIds = new Set((dnbRows || []).map(r => r.interpreter_id))
      if (dnbIds.size > 0) {
        console.log(`[wave-send] DNB filter excluded ${dnbIds.size} interpreter(s) from wave`)
        filteredIds = filteredIds.filter(id => !dnbIds.has(id))
      }
    }

    if (filteredIds.length === 0) {
      return NextResponse.json({ error: 'All selected interpreters are excluded (DNB or already contacted)' }, { status: 400 })
    }

    const newWave = (booking.current_wave || 1) + 1

    // Get requester name
    const { data: reqProfile } = await admin
      .from('requester_profiles')
      .select('name, org_name')
      .eq('id', user.id)
      .maybeSingle()

    const requesterName = reqProfile?.org_name || reqProfile?.name || 'Requester'
    const bookingTitle = decryptedBooking.title || 'Untitled'

    // Pre-fetch seed IDs to skip notifications for seeds
    const seedIds = await getSeedInterpreterIds(filteredIds)

    // Insert new booking_recipients
    for (const interpreterId of filteredIds) {
      const { error: recipientErr } = await admin
        .from('booking_recipients')
        .insert({
          booking_id: bookingId,
          interpreter_id: interpreterId,
          status: 'sent',
          wave_number: newWave,
          sent_at: new Date().toISOString(),
        })

      if (recipientErr) {
        console.error('[wave-send] booking_recipients insert failed:', recipientErr.message)
        continue
      }

      // Skip notification for seed interpreters (auto-accept handles them below)
      if (seedIds.has(interpreterId)) continue

      // Send notification to interpreter
      try {
        const { data: interpProfile } = await admin
          .from('interpreter_profiles')
          .select('user_id')
          .eq('id', interpreterId)
          .maybeSingle()

        if (interpProfile?.user_id) {
          await createNotification({
            recipientUserId: interpProfile.user_id,
            type: 'new_request',
            subject: `New interpreter request: ${bookingTitle}`,
            body: `${requesterName} has sent you an interpreter request${booking.date ? ` for ${booking.date}` : ''}. Review the details and respond with your rate.`,
            metadata: {
              booking_id: bookingId,
              booking_title: bookingTitle,
              booking_date: booking.date || '',
              booking_time: booking.time_start && booking.time_end ? `${booking.time_start} - ${booking.time_end}` : '',
              booking_location: booking.location || '',
              booking_format: booking.format || '',
              requester_name: requesterName,
            },
            ctaText: 'View Request',
            ctaUrl: '/interpreter/dashboard/inquiries',
            channel: 'both',
          })
        }
      } catch (notifErr) {
        console.error('[wave-send] notification send failed:', notifErr)
      }
    }

    // Auto-accept any seed interpreter recipients
    if (seedIds.size > 0) {
      try {
        await autoAcceptSeeds({
          bookingId,
          interpreterIds: filteredIds,
          requesterUserId: user.id,
          bookingTitle,
          bookingDate: booking.date || undefined,
          bookingTime: booking.time_start && booking.time_end ? `${booking.time_start} - ${booking.time_end}` : undefined,
          bookingLocation: booking.location || undefined,
          bookingFormat: booking.format || undefined,
          requesterName,
        })
      } catch (autoAcceptErr) {
        console.error('[wave-send] auto-accept seeds failed:', autoAcceptErr)
      }
    }

    // Update booking current_wave
    await admin
      .from('bookings')
      .update({ current_wave: newWave })
      .eq('id', bookingId)

    return NextResponse.json({ success: true, waveNumber: newWave, sentCount: filteredIds.length })
  } catch (err) {
    console.error('[wave-send] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
