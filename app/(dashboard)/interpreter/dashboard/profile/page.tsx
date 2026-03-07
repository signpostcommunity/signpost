import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Record<string, unknown> | null = null

  if (user) {
    const { data } = await supabase
      .from('interpreter_profiles')
      .select('first_name, last_name, city, country, bio, mode_of_work, sign_languages, spoken_languages, specializations, regions, video_url, video_description, status')
      .eq('user_id', user.id)
      .single()
    profile = data
  }

  return (
    <ProfileClient
      profile={profile}
      userEmail={user?.email || ''}
    />
  )
}
