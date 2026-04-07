import { createClient } from '@/lib/supabase/server'
import { seedRequesterData } from '@/lib/seedRequesterData'
import { syncNameFields } from '@/lib/nameSync'
import { getExistingProfileData } from '@/lib/populateNewProfile'
import { decryptFields } from '@/lib/encryption'
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
  }[] = []

  // Recent booking recipients (for multi-interpreter status)
  let recentRecipients: {
    id: string
    booking_id: string
    interpreter_id: string
    status: string
  }[] = []
  let recentInterpreterMap: Record<string, string> = {}

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

      // TODO: Tech debt — remove requester_profiles.name column, derive from first_name + last_name
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

    // Fetch profile, stats, and recent bookings in parallel — allSettled so one failure doesn't crash the page
    const [profileRes, activeRes, filledRes, rosterRes, bookingsRes, recentRes] = await Promise.allSettled([
      supabase.from('requester_profiles').select('first_name, last_name, org_name').or(`user_id.eq.${user.id},id.eq.${user.id}`).maybeSingle(),
      supabase.from('bookings').select('id', { count: 'exact' }).limit(1).eq('requester_id', user.id).eq('status', 'open'),
      supabase.from('bookings').select('id', { count: 'exact' }).limit(1).eq('requester_id', user.id).eq('status', 'filled'),
      supabase.from('requester_roster').select('id', { count: 'exact' }).limit(1).eq('requester_user_id', user.id),
      supabase.from('bookings').select('id').eq('requester_id', user.id).in('status', ['open', 'filled']),
      supabase.from('bookings').select('id, title, date, time_start, time_end, status, interpreter_count, event_category').eq('requester_id', user.id).neq('status', 'draft').order('date', { ascending: false }).limit(5),
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
    if (recent) recentBookings = recent.map(b => decryptFields(b, ['title']))

    // Fetch recipients for recent bookings (for multi-interpreter status display)
    const recentIds = recentBookings.map(b => b.id)
    if (recentIds.length > 0) {
      const { data: recs } = await supabase
        .from('booking_recipients')
        .select('id, booking_id, interpreter_id, status')
        .in('booking_id', recentIds)

      if (recs) {
        recentRecipients = recs

        // Fetch interpreter names
        const interpIds = [...new Set(recs.map(r => r.interpreter_id))]
        if (interpIds.length > 0) {
          const admin = (await import('@/lib/supabase/admin')).getSupabaseAdmin()
          const { data: interps } = await admin
            .from('interpreter_profiles')
            .select('id, first_name, last_name, name')
            .in('id', interpIds)

          if (interps) {
            for (const ip of interps) {
              recentInterpreterMap[ip.id] = ip.first_name || ip.name?.split(' ')[0] || 'Unknown'
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
    />
  )
}
