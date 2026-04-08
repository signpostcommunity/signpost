import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Use admin client to bypass RLS (admin page needs all rows)
  const admin = getSupabaseAdmin()

  // Fetch all user profiles via admin (user_profiles RLS can block non-own rows)
  const { data: users } = await admin
    .from('user_profiles')
    .select('id, role, email, created_at, is_admin, suspended')
    .order('created_at', { ascending: false })

  // Fetch auth.users emails via admin client (user_profiles.email may be null)
  let authEmailMap = new Map<string, string>()
  try {
    // Fetch all auth users in pages of 1000
    let page = 1
    let allAuthUsers: { id: string; email?: string }[] = []
    let hasMore = true
    while (hasMore) {
      const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      if (authUsers && authUsers.length > 0) {
        allAuthUsers = allAuthUsers.concat(authUsers.map(u => ({ id: u.id, email: u.email })))
        page++
        hasMore = authUsers.length === 1000
      } else {
        hasMore = false
      }
    }
    authEmailMap = new Map(allAuthUsers.map(u => [u.id, u.email || '']))
  } catch {
    // Service role key not available - fall back to user_profiles.email
  }

  // Fetch interpreter profiles for status/name
  const { data: interpreters } = await admin
    .from('interpreter_profiles')
    .select('id, user_id, first_name, last_name, status')

  // Fetch deaf profiles for name
  const { data: deafProfiles } = await admin
    .from('deaf_profiles')
    .select('id, user_id, first_name, last_name')

  // Fetch requester profiles for name
  const { data: requesterProfiles } = await admin
    .from('requester_profiles')
    .select('id, user_id, name')

  // Build enriched user list
  const interpMap = new Map((interpreters || []).map(i => [i.user_id, i]))
  const deafMap = new Map((deafProfiles || []).map(d => [d.user_id || d.id, d]))
  const requesterMap = new Map((requesterProfiles || []).map(r => [r.user_id || r.id, r]))

  const enrichedUsers = (users || []).map(u => {
    const fallbackEmail = u.email || authEmailMap.get(u.id) || ''
    let name = fallbackEmail.split('@')[0] || 'Unknown'
    let status = 'active'
    let profileId: string | null = null

    // Check all profile tables for name (users can have multiple roles)
    const ip = interpMap.get(u.id)
    const dp = deafMap.get(u.id)
    const rp = requesterMap.get(u.id)

    if (ip) {
      const ipName = `${ip.first_name || ''} ${ip.last_name || ''}`.trim()
      if (ipName) name = ipName
      status = ip.status || 'active'
      profileId = ip.id
    } else if (dp) {
      const dpName = `${dp.first_name || ''} ${dp.last_name || ''}`.trim()
      if (dpName) name = dpName
    } else if (rp) {
      if (rp.name) name = rp.name
    }

    // Use auth email as fallback if user_profiles.email is empty
    const email = u.email || authEmailMap.get(u.id) || ''

    // If user is suspended at profile level, override status
    if (u.suspended) status = 'suspended'

    return {
      id: u.id,
      name,
      email,
      role: u.role,
      status,
      created_at: u.created_at,
      profileId,
      isAdmin: u.is_admin || false,
      suspended: u.suspended || false,
    }
  })

  return <UsersClient users={enrichedUsers} currentUserId={currentUser?.id || ''} />
}
