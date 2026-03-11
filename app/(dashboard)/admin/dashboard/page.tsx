import { createClient } from '@/lib/supabase/server'
import AdminOverviewClient from './AdminOverviewClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch stats
  const [usersRes, interpretersRes, deafRes, feedbackRes, flagsRes] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('interpreter_profiles').select('id', { count: 'exact', head: true }).neq('status', 'draft'),
    supabase.from('deaf_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('beta_feedback').select('id', { count: 'exact', head: true }),
    supabase.from('profile_flags').select('id', { count: 'exact', head: true }),
  ])

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
        totalUsers: usersRes.count ?? 0,
        interpreters: interpretersRes.count ?? 0,
        deafUsers: deafRes.count ?? 0,
        betaFeedback: feedbackRes.count ?? 0,
        profileFlags: flagsRes.count ?? 0,
      }}
      recentUsers={recentUsers || []}
      recentFlags={flagsWithNames}
    />
  )
}
