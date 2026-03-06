import { createClient } from '@/lib/supabase/server'
import OverviewClient from './OverviewClient'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { first_name: string; last_name: string; status: string } | null = null

  if (user) {
    const { data } = await supabase
      .from('interpreter_profiles')
      .select('first_name, last_name, status')
      .eq('user_id', user.id)
      .single()
    profile = data
  }

  const isBeta = process.env.NEXT_PUBLIC_BETA_MODE === 'true'

  return (
    <OverviewClient
      firstName={profile?.first_name || null}
      lastName={profile?.last_name || null}
      profileStatus={profile?.status || null}
      showSampleData={isBeta && !profile}
    />
  )
}
