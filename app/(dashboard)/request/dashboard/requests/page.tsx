import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { decryptFields, BOOKING_ENCRYPTED_FIELDS } from '@/lib/encryption'
import RequestsClient from './RequestsClient'

export const dynamic = 'force-dynamic'

export default async function AllRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%', maxWidth: 960 }}>
        <p style={{ color: 'var(--muted)' }}>Please log in to view your requests.</p>
      </div>
    )
  }

  // Fetch all bookings for this requester
  const { data: bookings, error: bookingsErr } = await supabase
    .from('bookings')
    .select('id, title, description, notes, date, time_start, time_end, location, format, specialization, event_type, event_category, recurrence, interpreter_count, interpreters_confirmed, status, platform_fee_amount, platform_fee_status, wave_alerts_sent, current_wave, created_at, prep_notes, onsite_contact_name, onsite_contact_phone, onsite_contact_email')
    .eq('requester_id', user.id)
    .order('date', { ascending: false })

  if (bookingsErr) {
    console.error('[requests] bookings fetch error:', bookingsErr.message)
  }

  const allBookings = (bookings || []).map(b => decryptFields(b, [...BOOKING_ENCRYPTED_FIELDS]))
  const bookingIds = allBookings.map(b => b.id)

  // Fetch booking_recipients for all bookings (separate query)
  let allRecipients: {
    id: string
    booking_id: string
    interpreter_id: string
    status: string
    wave_number: number
    response_rate: number | null
    response_notes: string | null
    rate_profile_id: string | null
    confirmed_at: string | null
    declined_at: string | null
    proposed_date: string | null
    proposed_start_time: string | null
    proposed_end_time: string | null
    proposal_note: string | null
  }[] = []

  if (bookingIds.length > 0) {
    const { data: recipients, error: recipErr } = await supabase
      .from('booking_recipients')
      .select('id, booking_id, interpreter_id, status, wave_number, response_rate, response_notes, rate_profile_id, confirmed_at, declined_at, proposed_date, proposed_start_time, proposed_end_time, proposal_note')
      .in('booking_id', bookingIds)

    if (recipErr) {
      console.error('[requests] recipients fetch error:', recipErr.message)
    }
    allRecipients = recipients || []
  }

  // Fetch rate profiles referenced by recipients (full terms for requester view)
  const admin0 = getSupabaseAdmin()
  const rateProfileIds = [...new Set(allRecipients.map(r => r.rate_profile_id).filter((x): x is string => !!x))]
  const rateProfileMap: Record<string, {
    hourly_rate: number | null
    currency: string | null
    min_booking: number | null
    after_hours_diff: number | null
    after_hours_description: string | null
    cancellation_policy: string | null
    late_cancel_fee: number | null
    travel_expenses: Record<string, unknown> | null
    additional_terms: string | null
  }> = {}
  if (rateProfileIds.length > 0) {
    const { data: rps } = await admin0
      .from('interpreter_rate_profiles')
      .select('id, hourly_rate, currency, min_booking, after_hours_diff, after_hours_description, cancellation_policy, late_cancel_fee, travel_expenses, additional_terms')
      .in('id', rateProfileIds)
    if (rps) {
      for (const rp of rps) {
        const { id, ...rest } = rp as { id: string; [k: string]: unknown }
        rateProfileMap[id] = rest as (typeof rateProfileMap)[string]
      }
    }
  }

  // Fetch interpreter names for all recipients (use admin to bypass RLS)
  const interpreterIds = [...new Set(allRecipients.map(r => r.interpreter_id))]
  let interpreterMap: Record<string, { name: string; first_name: string | null; last_name: string | null }> = {}

  if (interpreterIds.length > 0) {
    const admin = getSupabaseAdmin()
    const { data: interps, error: interpErr } = await admin
      .from('interpreter_profiles')
      .select('id, name, first_name, last_name')
      .in('id', interpreterIds)

    if (interpErr) {
      console.error('[requests] interpreter fetch error:', interpErr.message)
    }
    if (interps) {
      for (const ip of interps) {
        interpreterMap[ip.id] = {
          name: ip.first_name && ip.last_name ? `${ip.first_name} ${ip.last_name}` : ip.name || 'Unknown',
          first_name: ip.first_name,
          last_name: ip.last_name,
        }
      }
    }
  }

  // Fetch DHH client info for bookings
  let dhhClients: { booking_id: string; dhh_user_id: string }[] = []
  if (bookingIds.length > 0) {
    const { data: clients } = await supabase
      .from('booking_dhh_clients')
      .select('booking_id, dhh_user_id')
      .in('booking_id', bookingIds)

    dhhClients = clients || []
  }

  return (
    <RequestsClient
      bookings={allBookings}
      recipients={allRecipients}
      interpreterMap={interpreterMap}
      rateProfileMap={rateProfileMap}
      dhhClients={dhhClients}
    />
  )
}
