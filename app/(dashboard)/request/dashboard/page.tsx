import { createClient } from '@/lib/supabase/server'
import { seedRequesterData } from '@/lib/seedRequesterData'
import { syncNameFields } from '@/lib/nameSync'
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
      const fullName = `${firstName} ${lastName}`.trim() || fullNameRaw

      // TODO: Tech debt — remove requester_profiles.name column, derive from first_name + last_name
      await supabase.from('requester_profiles').insert(syncNameFields({
        id: user.id,
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email || '',
      }))
    }

    // Seed beta data if needed
    const { count: seedCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' }).limit(1)
      .eq('requester_id', user.id)
      .eq('is_seed', true)

    if ((seedCount ?? 0) === 0) {
      await seedRequesterData(user.id)
    }

    // Get requester profile
    const { data: profile } = await supabase
      .from('requester_profiles')
      .select('first_name, last_name, org_name')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()

    if (profile?.first_name) {
      firstName = profile.first_name
    }
    if (profile?.org_name) {
      orgName = profile.org_name
    }

    // Active requests (status = 'open')
    const { count: activeCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' }).limit(1)
      .eq('requester_id', user.id)
      .eq('status', 'open')

    activeRequests = activeCount ?? 0

    // Confirmed bookings (status = 'filled')
    const { count: filledCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' }).limit(1)
      .eq('requester_id', user.id)
      .eq('status', 'filled')

    confirmedBookings = filledCount ?? 0

    // Interpreters on roster
    const { count: rCount } = await supabase
      .from('requester_roster')
      .select('id', { count: 'exact' }).limit(1)
      .eq('requester_user_id', user.id)

    rosterCount = rCount ?? 0

    // Pending responses: booking_recipients with status='sent' for user's bookings
    // Two-step: get user's booking IDs, then count pending recipients
    const { data: userBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('requester_id', user.id)
      .in('status', ['open', 'filled'])

    if (userBookings && userBookings.length > 0) {
      const bookingIds = userBookings.map(b => b.id)
      const { count: pendingCount } = await supabase
        .from('booking_recipients')
        .select('id', { count: 'exact' }).limit(1)
        .in('booking_id', bookingIds)
        .in('status', ['sent', 'viewed'])

      pendingResponses = pendingCount ?? 0
    }

    // Recent 5 bookings
    const { data: recent } = await supabase
      .from('bookings')
      .select('id, title, date, time_start, time_end, status, interpreter_count, event_category')
      .eq('requester_id', user.id)
      .neq('status', 'draft')
      .order('date', { ascending: false })
      .limit(5)

    if (recent) {
      recentBookings = recent
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
    />
  )
}
