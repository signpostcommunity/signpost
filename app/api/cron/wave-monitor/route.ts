import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const now = new Date()
  let triggered = 0

  // Fetch active bookings (open status, not cancelled/completed)
  const { data: bookings, error: bookingsErr } = await admin
    .from('bookings')
    .select('id, requester_id, title, date, time_start, time_end, location, interpreter_count, current_wave, wave_alerts_sent, status')
    .in('status', ['open', 'filled'])
    .eq('is_seed', false)

  if (bookingsErr || !bookings) {
    console.error('[wave-monitor] bookings fetch error:', bookingsErr?.message)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  type AlertEntry = { sent_at: string; type: string; booking_id?: string }
  for (const booking of bookings) {
    const alerts: Record<string, AlertEntry> =
      (booking.wave_alerts_sent as Record<string, AlertEntry>) || {}
    const wave = booking.current_wave || 1
    const waveKey = String(wave)
    const nowIso = now.toISOString()

    // Primary dedup: if we've already recorded an entry for this wave, skip the entire booking.
    // No new triggers fire on subsequent ticks until current_wave advances.
    if (alerts[waveKey]) {
      continue
    }

    // Fetch recipients for current wave
    const { data: recipients } = await admin
      .from('booking_recipients')
      .select('id, status, sent_at, response_rate, wave_number')
      .eq('booking_id', booking.id)
      .eq('wave_number', wave)

    if (!recipients || recipients.length === 0) continue

    // Count statuses
    const declined = recipients.filter(r => r.status === 'declined').length
    const pending = recipients.filter(r => r.status === 'sent' || r.status === 'viewed').length
    const responded = recipients.filter(r => r.status === 'responded' || r.status === 'confirmed').length
    const confirmed = recipients.filter(r => r.status === 'confirmed').length
    const terminal = recipients.filter(r =>
      ['declined', 'responded', 'confirmed', 'withdrawn'].includes(r.status)
    ).length
    const interpretersNeeded = booking.interpreter_count || 1

    const nudgeKey = `wave_${wave}_nudge`
    const urgentKey = `wave_${wave}_urgent`
    const timeoutKey = `wave_${wave}_timeout`
    const allRespondedKey = `wave_${wave}_all_responded`

    const bookingTitle = booking.title || 'Untitled request'
    const bookingDate = booking.date || ''

    // Record initial entry for this wave so subsequent ticks skip the booking.
    alerts[waveKey] = { sent_at: nowIso, type: wave === 1 ? 'initial' : 'escalation' }

    // TRIGGER A: Nudge (5+ declined)
    if (declined >= 5 && !alerts[nudgeKey]) {
      await createNotification({
        recipientUserId: booking.requester_id,
        type: 'wave_nudge',
        subject: `Your request for ${bookingTitle} needs more interpreters`,
        body: `${declined} interpreters have declined your request "${bookingTitle}". ${pending} are still pending and ${responded} have responded. You can send to more interpreters to improve your chances.`,
        metadata: {
          booking_id: booking.id,
          booking_title: bookingTitle,
          booking_date: bookingDate,
          declined_count: String(declined),
          pending_count: String(pending),
          responded_count: String(responded),
          wave_number: String(wave),
          trigger_type: 'nudge',
        },
        ctaText: 'Send to more interpreters',
        ctaUrl: 'https://signpost.community/request/dashboard/requests',
        channel: 'both',
      })
      alerts[nudgeKey] = { sent_at: nowIso, type: 'nudge', booking_id: booking.id }
      triggered++
    }

    // TRIGGER B: Urgent (7+ declined OR remaining pending < needed + 2)
    const isUrgent = declined >= 7 || (pending < interpretersNeeded + 2 && declined >= 3)
    if (isUrgent && !alerts[urgentKey]) {
      await createNotification({
        recipientUserId: booking.requester_id,
        type: 'wave_urgent',
        subject: `Urgent: Your request for ${bookingTitle} is at risk`,
        body: `Your request "${bookingTitle}" is at risk. Only ${pending} interpreters haven't responded and you still need ${interpretersNeeded}. We recommend sending to more interpreters now.`,
        metadata: {
          booking_id: booking.id,
          booking_title: bookingTitle,
          booking_date: bookingDate,
          declined_count: String(declined),
          pending_count: String(pending),
          responded_count: String(responded),
          wave_number: String(wave),
          trigger_type: 'urgent',
        },
        ctaText: 'Send to more interpreters',
        ctaUrl: 'https://signpost.community/request/dashboard/requests',
        channel: 'both',
      })
      alerts[urgentKey] = { sent_at: nowIso, type: 'urgent', booking_id: booking.id }
      triggered++
    }

    // TRIGGER C: Non-response timeout
    if (!alerts[timeoutKey]) {
      const earliestSent = recipients.reduce((min, r) => {
        if (!r.sent_at) return min
        const d = new Date(r.sent_at).getTime()
        return d < min ? d : min
      }, Infinity)

      if (earliestSent !== Infinity) {
        const hoursSinceSent = (now.getTime() - earliestSent) / (1000 * 60 * 60)
        const eventDate = booking.date ? new Date(booking.date + 'T00:00:00') : null
        const daysUntilEvent = eventDate ? (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : 999
        const timeoutHours = daysUntilEvent <= 5 ? 24 : 48

        const respondedWithRate = recipients.filter(r => r.response_rate != null).length
        if (hoursSinceSent >= timeoutHours && respondedWithRate < interpretersNeeded) {
          await createNotification({
            recipientUserId: booking.requester_id,
            type: 'wave_timeout',
            subject: `${bookingTitle}: interpreters haven't responded yet`,
            body: `It's been ${timeoutHours} hours since your request "${bookingTitle}" was sent. ${responded} have responded and ${pending} haven't replied yet. You may want to send to more interpreters.`,
            metadata: {
              booking_id: booking.id,
              booking_title: bookingTitle,
              booking_date: bookingDate,
              declined_count: String(declined),
              pending_count: String(pending),
              responded_count: String(responded),
              wave_number: String(wave),
              trigger_type: 'timeout',
            },
            ctaText: 'Send to more interpreters',
            ctaUrl: 'https://signpost.community/request/dashboard/requests',
            channel: 'both',
          })
          alerts[timeoutKey] = { sent_at: nowIso, type: 'timeout', booking_id: booking.id }
          triggered++
        }
      }
    }

    // TRIGGER D: All responded, still need more
    if (!alerts[allRespondedKey] && terminal === recipients.length && confirmed < interpretersNeeded) {
      await createNotification({
        recipientUserId: booking.requester_id,
        type: 'wave_all_responded',
        subject: `Your interpreters have responded. ${bookingTitle} still needs ${interpretersNeeded - confirmed} more.`,
        body: `All ${recipients.length} interpreters in wave ${wave} have responded to your request "${bookingTitle}". ${confirmed} confirmed, ${declined} declined, ${responded - confirmed} responded with a rate. You still need ${interpretersNeeded - confirmed} more interpreter${interpretersNeeded - confirmed !== 1 ? 's' : ''}.`,
        metadata: {
          booking_id: booking.id,
          booking_title: bookingTitle,
          booking_date: bookingDate,
          declined_count: String(declined),
          pending_count: '0',
          responded_count: String(responded),
          confirmed_count: String(confirmed),
          wave_number: String(wave),
          trigger_type: 'all_responded',
        },
        ctaText: 'Send to more interpreters',
        ctaUrl: 'https://signpost.community/request/dashboard/requests',
        channel: 'both',
      })
      alerts[allRespondedKey] = { sent_at: nowIso, type: 'all_responded', booking_id: booking.id }
      triggered++
    }

    // Always persist alerts after first processing of a wave so subsequent ticks dedup.
    const { error: updErr } = await admin
      .from('bookings')
      .update({ wave_alerts_sent: alerts })
      .eq('id', booking.id)
    if (updErr) {
      console.error('[wave-monitor] failed to persist wave_alerts_sent for', booking.id, updErr.message)
    }
  }

  return NextResponse.json({ ok: true, bookingsChecked: bookings.length, triggered })
}
