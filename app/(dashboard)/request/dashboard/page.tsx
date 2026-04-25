import { createClient } from '@/lib/supabase/server'
import { seedRequesterData } from '@/lib/seedRequesterData'
import { syncNameFields } from '@/lib/nameSync'
import { getExistingProfileData } from '@/lib/populateNewProfile'
import { decryptFields, BOOKING_ENCRYPTED_FIELDS } from '@/lib/encryption'
import RequesterOverviewClient from './RequesterOverviewClient'

export const dynamic = 'force-dynamic'

export default async function RequesterDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let firstName = ''
  let orgName = ''

  // Stat counts
  let activeRequests = 0
  let confirmedBookings = 0
  let rosterCount = 0
  let pendingResponses = 0

  // Recent bookings
  let recentBookings: {
    id: string
    title: string | null
    date: string
    time_start: string
    time_end: string
    status: string
    interpreter_count: number
    event_category: string | null
    request_type: string | null
    location: string | null
    format: string | null
    specialization: string | null
    description: string | null
    notes: string | null
    prep_notes: string | null
    onsite_contact_name: string | null
    onsite_contact_phone: string | null
    onsite_contact_email: string | null
    location_name: string | null
    location_address: string | null
    location_city: string | null
    location_state: string | null
    location_zip: string | null
    location_country: string | null
    meeting_link: string | null
  }[] = []

  // Recent booking recipients (for multi-interpreter status)
  let recentRecipients: {
    id: string
    booking_id: string
    interpreter_id: string
    status: string
    sent_at: string | null
    response_rate: number | null
    wave_number: number
    response_notes: string | null
    rate_profile_id: string | null
    confirmed_at: string | null
    declined_at: string | null
    proposed_date: string | null
    proposed_start_time: string | null
    proposed_end_time: string | null
    proposal_note: string | null
  }[] = []
  let recentInterpreterMap: Record<string, { name: string; first_name: string | null; last_name: string | null; photo_url: string | null }> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentRateProfileMap: Record<string, any> = {}
  let recentDhhClients: { booking_id: string; dhh_user_id: string }[] = []
  let recentTierMap: Record<string, string> = {}

  if (user) {
    // BUG 1 FIX: Auto-create requester_profiles row for multi-role users
    const { data: existingProfile } = await supabase
      .from('requester_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existingProfile) {
      const { normalizeProfileFields } = await import('@/lib/normalize')
      const fullNameRaw = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
      const nameParts = fullNameRaw.split(' ')
      const norm = normalizeProfileFields({ first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '' })
      const firstName = (norm.first_name as string) || nameParts[0] || ''
      const lastName = (norm.last_name as string) || nameParts.slice(1).join(' ') || ''

      // Auto-populate shared fields from existing profiles (e.g., user already has interpreter/deaf profile)
      const existingData = await getExistingProfileData(user.id)

      // TODO: Tech debt - remove requester_profiles.name column, derive from first_name + last_name
      await supabase.from('requester_profiles').insert(syncNameFields({
        id: user.id,
        user_id: user.id,
        first_name: firstName || existingData.first_name,
        last_name: lastName || existingData.last_name,
        email: user.email || existingData.email,
        city: existingData.city,
        state: existingData.state,
        country_name: existingData.country_name || existingData.country,
        phone: existingData.phone,
      }))
    }

    // Auto-seed disabled. Re-enable manually from admin if needed.
    // Previous behavior re-created [Sample] bookings every visit when none existed,
    // making DB deletion ineffective. seedRequesterData remains importable.
    void seedRequesterData

    // Fetch profile, stats, and recent bookings in parallel - allSettled so one failure doesn't crash the page
    const [profileRes, activeRes, filledRes, rosterRes, bookingsRes, recentRes] = await Promise.allSettled([
      supabase.from('requester_profiles').select('first_name, last_name, org_name').or(`user_id.eq.${user.id},id.eq.${user.id}`).maybeSingle(),
      supabase.from('bookings').select('id', { count: 'exact' }).limit(1).eq('requester_id', user.id).eq('status', 'open').neq('request_type', 'personal'),
      supabase.from('bookings').select('id', { count: 'exact' }).limit(1).eq('requester_id', user.id).eq('status', 'filled').neq('request_type', 'personal').gte('date', new Date().toISOString().split('T')[0]),
      supabase.from('requester_roster').select('id', { count: 'exact' }).limit(1).eq('requester_user_id', user.id),
      supabase.from('bookings').select('id').eq('requester_id', user.id).in('status', ['open', 'filled']).neq('request_type', 'personal'),
      supabase.from('bookings').select('id, title, date, time_start, time_end, status, interpreter_count, event_category, request_type, location, format, specialization, description, notes, prep_notes, onsite_contact_name, onsite_contact_phone, onsite_contact_email, location_name, location_address, location_city, location_state, location_zip, location_country, meeting_link').eq('requester_id', user.id).neq('status', 'draft').neq('request_type', 'personal').order('date', { ascending: false }).limit(5),
    ])

    const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null
    if (profile?.first_name) firstName = profile.first_name
    if (profile?.org_name) orgName = profile.org_name

    activeRequests = (activeRes.status === 'fulfilled' ? activeRes.value.count : null) ?? 0
    confirmedBookings = (filledRes.status === 'fulfilled' ? filledRes.value.count : null) ?? 0
    rosterCount = (rosterRes.status === 'fulfilled' ? rosterRes.value.count : null) ?? 0

    // Pending responses: count recipients with status='sent' for user's active bookings
    const userBookings = bookingsRes.status === 'fulfilled' ? bookingsRes.value.data : null
    if (userBookings && userBookings.length > 0) {
      const { count: pendingCount } = await supabase
        .from('booking_recipients')
        .select('id', { count: 'exact' }).limit(1)
        .in('booking_id', userBookings.map(b => b.id))
        .in('status', ['sent', 'viewed'])
      pendingResponses = pendingCount ?? 0
    }

    const recent = recentRes.status === 'fulfilled' ? recentRes.value.data : null
    if (recent) recentBookings = recent.map(b => decryptFields(b, [...BOOKING_ENCRYPTED_FIELDS]))

    // Fetch recipients for recent bookings (for multi-interpreter status display)
    const recentIds = recentBookings.map(b => b.id)
    if (recentIds.length > 0) {
      const { data: recs } = await supabase
        .from('booking_recipients')
        .select('id, booking_id, interpreter_id, status, sent_at, response_rate, wave_number, response_notes, rate_profile_id, confirmed_at, declined_at, proposed_date, proposed_start_time, proposed_end_time, proposal_note')
        .in('booking_id', recentIds)

      if (recs) {
        recentRecipients = recs

        // Fetch interpreter names + photos
        const interpIds = [...new Set(recs.map(r => r.interpreter_id))]
        if (interpIds.length > 0) {
          const admin = (await import('@/lib/supabase/admin')).getSupabaseAdmin()
          const { data: interps } = await admin
            .from('interpreter_profiles')
            .select('id, first_name, last_name, name, photo_url')
            .in('id', interpIds)

          if (interps) {
            for (const ip of interps) {
              recentInterpreterMap[ip.id] = {
                name: ip.first_name && ip.last_name ? `${ip.first_name} ${ip.last_name}` : ip.name || 'Unknown',
                first_name: ip.first_name || null,
                last_name: ip.last_name || null,
                photo_url: ip.photo_url || null,
              }
            }
          }

          // Fetch rate profiles referenced by recipients
          const rateProfileIds = [...new Set(recs.map(r => r.rate_profile_id).filter((x): x is string => !!x))]
          if (rateProfileIds.length > 0) {
            const { data: rps } = await admin
              .from('interpreter_rate_profiles')
              .select('id, hourly_rate, currency, min_booking, after_hours_diff, after_hours_description, cancellation_policy, late_cancel_fee, travel_expenses, additional_terms')
              .in('id', rateProfileIds)
            if (rps) {
              for (const rp of rps) {
                recentRateProfileMap[rp.id] = rp
              }
            }
          }
        }
      }
    }

    // Fetch DHH clients and tier info for recent bookings
    if (recentIds.length > 0) {
      const { data: clients } = await supabase
        .from('booking_dhh_clients')
        .select('booking_id, dhh_user_id')
        .in('booking_id', recentIds)

      if (clients && clients.length > 0) {
        recentDhhClients = clients

        const dhhUserIds = [...new Set(clients.map(c => c.dhh_user_id))]
        const interpIds = [...new Set(recentRecipients.map(r => r.interpreter_id))]
        if (dhhUserIds.length > 0 && interpIds.length > 0) {
          const adminTier = (await import('@/lib/supabase/admin')).getSupabaseAdmin()
          const { data: rosterRows } = await adminTier
            .from('deaf_roster')
            .select('deaf_user_id, interpreter_id, tier')
            .in('deaf_user_id', dhhUserIds)
            .in('interpreter_id', interpIds)
            .in('tier', ['preferred', 'approved'])

          if (rosterRows) {
            for (const row of rosterRows) {
              recentTierMap[`${row.interpreter_id}:${row.deaf_user_id}`] = row.tier
            }
          }
        }
      }
    }
  }

  return (
    <RequesterOverviewClient
      firstName={firstName}
      orgName={orgName}
      activeRequests={activeRequests}
      confirmedBookings={confirmedBookings}
      rosterCount={rosterCount}
      pendingResponses={pendingResponses}
      recentBookings={recentBookings}
      recentRecipients={recentRecipients}
      recentInterpreterMap={recentInterpreterMap}
      recentRateProfileMap={recentRateProfileMap}
      recentDhhClients={recentDhhClients}
      recentTierMap={recentTierMap}
    />
  )
}
