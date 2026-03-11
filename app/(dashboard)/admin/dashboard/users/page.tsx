import { createClient } from '@/lib/supabase/server'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Fetch all user profiles
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, role, email, created_at, is_admin')
    .order('created_at', { ascending: false })

  // Fetch interpreter profiles for status/name
  const { data: interpreters } = await supabase
    .from('interpreter_profiles')
    .select('id, user_id, first_name, last_name, status')

  // Fetch deaf profiles for name
  const { data: deafProfiles } = await supabase
    .from('deaf_profiles')
    .select('id, user_id, first_name, last_name')

  // Build enriched user list
  const interpMap = new Map((interpreters || []).map(i => [i.user_id, i]))
  const deafMap = new Map((deafProfiles || []).map(d => [d.user_id || d.id, d]))

  const enrichedUsers = (users || []).map(u => {
    let name = u.email?.split('@')[0] || 'Unknown'
    let status = 'active'
    let profileId: string | null = null

    if (u.role === 'interpreter') {
      const ip = interpMap.get(u.id)
      if (ip) {
        name = `${ip.first_name || ''} ${ip.last_name || ''}`.trim() || name
        status = ip.status || 'active'
        profileId = ip.id
      }
    } else if (u.role === 'deaf') {
      const dp = deafMap.get(u.id)
      if (dp) {
        name = `${dp.first_name || ''} ${dp.last_name || ''}`.trim() || name
      }
    }

    return {
      id: u.id,
      name,
      email: u.email || '',
      role: u.role,
      status,
      created_at: u.created_at,
      profileId,
      isAdmin: u.is_admin || false,
    }
  })

  return <UsersClient users={enrichedUsers} />
}
