import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Record<string, unknown> | null = null

  if (user) {
    const { data, error, status } = await supabase
      .from('interpreter_profiles')
      .select('id, name, first_name, last_name, email, pronouns, city, state, country, phone, years_experience, interpreter_type, work_mode, bio, bio_specializations, bio_extra, sign_languages, spoken_languages, specializations, aspirational_specializations, specialized_skills, regions, video_url, video_desc, event_coordination, event_coordination_desc, draft_data, status, photo_url, invoicing_preference, payment_methods, default_payment_terms, notification_preferences, notification_phone, lgbtq, deaf_parented, bipoc, bipoc_details, religious_affiliation, religious_details, gender_identity, vanity_slug, mentorship_offering, mentorship_seeking, mentorship_types, mentorship_types_offering, mentorship_types_seeking, mentorship_paid, mentorship_bio_offering, mentorship_bio_seeking, directory_visible, timezone')
      .eq('user_id', user.id)
      .maybeSingle()
    console.log('SERVER PROFILE QUERY:', JSON.stringify({ userId: user.id, data, error, status }, null, 2))
    profile = data
  } else {
    console.log('SERVER PROFILE QUERY: no user from auth.getUser()')
  }

  return (
    <ProfileClient
      profile={profile}
      userEmail={user?.email || ''}
    />
  )
}
