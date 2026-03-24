import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export default async function RequesterProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Record<string, unknown> | null = null

  if (user) {
    const { data } = await supabase
      .from('requester_profiles')
      .select('id, user_id, name, email, first_name, last_name, phone, country, country_name, city, state, org_name, org_type, requester_type, comm_prefs, location')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()

    profile = data
  }

  return (
    <ProfileClient
      profile={profile}
      userEmail={user?.email || ''}
    />
  )
}
