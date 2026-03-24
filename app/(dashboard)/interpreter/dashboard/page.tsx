import { createClient } from '@/lib/supabase/server'
import OverviewClient from './OverviewClient'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { id: string; first_name: string; last_name: string; status: string; vanity_slug: string | null; calendar_token: string | null } | null = null

  if (user) {
    const { data } = await supabase
      .from('interpreter_profiles')
      .select('id, first_name, last_name, status, vanity_slug, calendar_token')
      .eq('user_id', user.id)
      .single()
    profile = data
  }

  return (
    <OverviewClient
      interpreterProfileId={profile?.id || null}
      firstName={profile?.first_name || null}
      lastName={profile?.last_name || null}
      profileStatus={profile?.status || null}
      vanitySlug={profile?.vanity_slug || null}
      calendarToken={profile?.calendar_token || null}
    />
  )
}
