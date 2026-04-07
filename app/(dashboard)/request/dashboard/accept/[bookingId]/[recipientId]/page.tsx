import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AcceptClient from './AcceptClient'

export const dynamic = 'force-dynamic'

export default async function AcceptPage({ params }: { params: Promise<{ bookingId: string; recipientId: string }> }) {
  const { bookingId, recipientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/request/login')

  // Fetch booking
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, title, description, date, time_start, time_end, location, format, specialization, event_category, interpreter_count, interpreters_confirmed, status, platform_fee_amount, platform_fee_status, requester_id')
    .eq('id', bookingId)
    .eq('requester_id', user.id)
    .single()

  if (bookingErr || !booking) {
    redirect('/request/dashboard/requests')
  }

  // Fetch recipient
  const { data: recipient, error: recErr } = await supabase
    .from('booking_recipients')
    .select('id, booking_id, interpreter_id, status, response_rate, response_notes, rate_profile_id')
    .eq('id', recipientId)
    .eq('booking_id', bookingId)
    .single()

  if (recErr || !recipient) {
    redirect('/request/dashboard/requests')
  }

  // Fetch interpreter name
  const admin = getSupabaseAdmin()
  const { data: interp } = await admin
    .from('interpreter_profiles')
    .select('id, name, first_name, last_name')
    .eq('id', recipient.interpreter_id)
    .single()

  const interpreterName = interp?.first_name && interp?.last_name
    ? `${interp.first_name} ${interp.last_name}`
    : interp?.name || 'Unknown Interpreter'

  // Fetch rate profile if available
  let rateProfile: {
    hourly_rate: number | null
    currency: string | null
    min_booking: number | null
    after_hours_diff: number | null
    after_hours_description: string | null
    cancellation_policy: string | null
    late_cancel_fee: number | null
    travel_expenses: Record<string, unknown> | null
    additional_terms: string | null
  } | null = null

  if (recipient.rate_profile_id) {
    const { data: rp } = await admin
      .from('interpreter_rate_profiles')
      .select('hourly_rate, currency, min_booking, after_hours_diff, after_hours_description, cancellation_policy, late_cancel_fee, travel_expenses, additional_terms')
      .eq('id', recipient.rate_profile_id)
      .single()

    rateProfile = rp
  }

  // Fetch DHH client info
  const { data: dhhClients } = await supabase
    .from('booking_dhh_clients')
    .select('dhh_user_id')
    .eq('booking_id', bookingId)

  let dhhClientName: string | null = null
  if (dhhClients && dhhClients.length > 0) {
    const { data: dhhProfile } = await admin
      .from('deaf_profiles')
      .select('first_name, last_name')
      .or(`user_id.eq.${dhhClients[0].dhh_user_id},id.eq.${dhhClients[0].dhh_user_id}`)
      .maybeSingle()

    if (dhhProfile?.first_name) {
      dhhClientName = `${dhhProfile.first_name} ${dhhProfile.last_name || ''}`.trim()
    }
  }

  return (
    <AcceptClient
      booking={{
        id: booking.id,
        title: booking.title,
        date: booking.date,
        time_start: booking.time_start,
        time_end: booking.time_end,
        location: booking.location,
        format: booking.format,
        specialization: booking.specialization,
        event_category: booking.event_category,
        interpreter_count: booking.interpreter_count,
        interpreters_confirmed: booking.interpreters_confirmed,
        status: booking.status,
        platform_fee_amount: booking.platform_fee_amount,
      }}
      recipient={{
        id: recipient.id,
        status: recipient.status,
        response_rate: recipient.response_rate,
        response_notes: recipient.response_notes,
      }}
      interpreterName={interpreterName}
      rateProfile={rateProfile}
      dhhClientName={dhhClientName}
    />
  )
}
