import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/supabase/cached-user'
import OverviewClient from './OverviewClient'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const supabase = await createClient()
  const user = await getCachedUser()

  let profile: { id: string; first_name: string; last_name: string; status: string; vanity_slug: string | null; calendar_token: string | null; directory_visible: boolean; photo_url: string | null; bio: string | null; bio_specializations: string | null; video_url: string | null; sign_languages: string[] | null; spoken_languages: string[] | null; specializations: string[] | null } | null = null
  let activeAwayPeriod: { end_date: string; message: string } | null = null
  let rateProfileCount = 0

  if (user) {
    const { data, error } = await supabase
      .from('interpreter_profiles')
      .select('id, first_name, last_name, status, vanity_slug, calendar_token, directory_visible, photo_url, bio, bio_specializations, video_url, sign_languages, spoken_languages, specializations')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) console.error('Failed to load interpreter profile:', error.message)
    profile = data

    if (profile?.id) {
      const today = new Date().toISOString().split('T')[0]
      const [{ data: awayData }, { count }] = await Promise.all([
        supabase
          .from('interpreter_away_periods')
          .select('end_date, message')
          .eq('interpreter_id', profile.id)
          .lte('start_date', today)
          .gte('end_date', today)
          .order('end_date', { ascending: true })
          .limit(1),
        supabase
          .from('interpreter_rate_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('interpreter_id', profile.id),
      ])
      if (awayData && awayData.length > 0) {
        activeAwayPeriod = awayData[0]
      }
      rateProfileCount = count ?? 0
    }
  }

  return (
    <OverviewClient
      interpreterProfileId={profile?.id || null}
      firstName={profile?.first_name || null}
      lastName={profile?.last_name || null}
      profileStatus={profile?.status || null}
      vanitySlug={profile?.vanity_slug || null}
      calendarToken={profile?.calendar_token || null}
      activeAwayPeriod={activeAwayPeriod}
      directoryVisible={profile?.directory_visible !== false}
      completionProfile={profile ? {
        photo_url: profile.photo_url,
        bio: profile.bio,
        bio_specializations: profile.bio_specializations,
        video_url: profile.video_url,
        sign_languages: profile.sign_languages,
        spoken_languages: profile.spoken_languages,
        specializations: profile.specializations,
      } : null}
      rateProfileCount={rateProfileCount}
    />
  )
}
