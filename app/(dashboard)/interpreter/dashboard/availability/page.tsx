import { createClient } from '@/lib/supabase/server'
import AvailabilityClient from './AvailabilityClient'

export const dynamic = 'force-dynamic'

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let interpreterProfileId: string | null = null
  let calendarToken: string | null = null

  if (user) {
    const { data } = await supabase
      .from('interpreter_profiles')
      .select('id, calendar_token')
      .eq('user_id', user.id)
      .single()
    interpreterProfileId = data?.id || null
    calendarToken = data?.calendar_token || null
  }

  return (
    <AvailabilityClient
      interpreterProfileId={interpreterProfileId}
      calendarToken={calendarToken}
    />
  )
}
