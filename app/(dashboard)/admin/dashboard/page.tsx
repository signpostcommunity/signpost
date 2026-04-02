import { createClient } from '@/lib/supabase/server'
import AdminOverviewClient from './AdminOverviewClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch stats — use allSettled so one failure doesn't crash the page
  const [usersRes, interpretersRes, deafRes, flagsRes, chargedRes, failedRes, creditsRes] = await Promise.allSettled([
    supabase.from('user_profiles').select('id', { count: 'exact' }).limit(1),
    supabase.from('interpreter_profiles').select('id', { count: 'exact' }).limit(1).neq('status', 'draft'),
    supabase.from('deaf_profiles').select('id', { count: 'exact' }).limit(1),
    supabase.from('profile_flags').select('id', { count: 'exact' }).limit(1),
    supabase.from('bookings').select('platform_fee_amount').eq('platform_fee_status', 'charged'),
    supabase.from('bookings').select('platform_fee_amount').eq('platform_fee_status', 'failed'),
    supabase.from('booking_credits').select('amount').eq('status', 'available'),
  ])

  const val = <T,>(r: PromiseSettledResult<T>) => r.status === 'fulfilled' ? r.value : null
  const charged = val(chargedRes)?.data || []
  const failed = val(failedRes)?.data || []
  const credits = val(creditsRes)?.data || []
  const totalCollected = charged.reduce((sum: number, b: { platform_fee_amount: number | null }) => sum + (b.platform_fee_amount || 0), 0)
  const totalFailed = failed.reduce((sum: number, b: { platform_fee_amount: number | null }) => sum + (b.platform_fee_amount || 0), 0)
  const totalCredits = credits.reduce((sum: number, c: { amount: number | null }) => sum + (c.amount || 0), 0)

  // Recent signups
  const { data: recentUsers } = await supabase
    .from('user_profiles')
    .select('id, role, email, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  // Recent flags
  const { data: recentFlags } = await supabase
    .from('profile_flags')
    .select('id, reason, status, created_at, interpreter_profile_id')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get interpreter names for flags
  let flagsWithNames: { id: string; reason: string; status: string; created_at: string; interpreter_name: string }[] = []
  if (recentFlags && recentFlags.length > 0) {
    const interpIds = recentFlags.map(f => f.interpreter_profile_id).filter(Boolean)
    const { data: interpreters } = await supabase
      .from('interpreter_profiles')
      .select('id, first_name, last_name')
      .in('id', interpIds)

    const nameMap = new Map((interpreters || []).map(i => [i.id, `${i.first_name || ''} ${i.last_name || ''}`.trim()]))
    flagsWithNames = recentFlags.map(f => ({
      id: f.id,
      reason: f.reason,
      status: f.status,
      created_at: f.created_at,
      interpreter_name: nameMap.get(f.interpreter_profile_id) || 'Unknown',
    }))
  }

  return (
    <AdminOverviewClient
      stats={{
        totalUsers: val(usersRes)?.count ?? 0,
        interpreters: val(interpretersRes)?.count ?? 0,
        deafUsers: val(deafRes)?.count ?? 0,
        profileFlags: val(flagsRes)?.count ?? 0,
      }}
      paymentStats={{
        feesCollected: { count: charged.length, total: totalCollected },
        feesFailed: { count: failed.length, total: totalFailed },
        creditsOutstanding: { count: credits.length, total: totalCredits },
      }}
      recentUsers={recentUsers || []}
      recentFlags={flagsWithNames}
    />
  )
}
