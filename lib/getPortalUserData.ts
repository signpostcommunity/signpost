import { createClient } from '@/lib/supabase/server'

export interface PortalUserData {
  id: string
  primaryRole: string
  name: string
  initials: string
  photoUrl: string | null
}

/**
 * Server-side helper: check auth and fetch user profile data for the
 * DirectoryPortalSidebar. Returns null for unauthenticated users.
 */
export async function getPortalUserData(): Promise<PortalUserData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role || 'interpreter'

  let name = 'User'
  let initials = 'U'
  let photoUrl: string | null = null

  if (role === 'interpreter') {
    const { data: ip } = await supabase
      .from('interpreter_profiles')
      .select('first_name, last_name, photo_url')
      .eq('user_id', user.id)
      .maybeSingle()
    if (ip?.first_name) {
      name = `${ip.first_name} ${ip.last_name || ''}`.trim()
      initials = `${ip.first_name[0]}${ip.last_name?.[0] || ''}`.toUpperCase()
      photoUrl = ip.photo_url || null
    }
  } else if (role === 'deaf') {
    const { data: dp } = await supabase
      .from('deaf_profiles')
      .select('first_name, last_name')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle()
    if (dp?.first_name) {
      name = `${dp.first_name} ${dp.last_name || ''}`.trim()
      initials = `${dp.first_name[0]}${dp.last_name?.[0] || ''}`.toUpperCase()
    }
  } else if (role === 'requester' || role === 'org') {
    const { data: rp } = await supabase
      .from('requester_profiles')
      .select('first_name, last_name, name')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle()
    if (rp?.first_name) {
      name = `${rp.first_name} ${rp.last_name || ''}`.trim()
      initials = `${rp.first_name[0]}${rp.last_name?.[0] || ''}`.toUpperCase()
    } else if (rp?.name) {
      name = rp.name
      const parts = rp.name.split(' ')
      initials = `${parts[0]?.[0] || ''}${parts[parts.length - 1]?.[0] || ''}`.toUpperCase()
    }
  }

  return { id: user.id, primaryRole: role, name, initials, photoUrl }
}
