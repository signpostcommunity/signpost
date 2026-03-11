import { createClient } from '@/lib/supabase/server'
import InterpretersClient from './InterpretersClient'

export const dynamic = 'force-dynamic'

export default async function AdminInterpretersPage() {
  const supabase = await createClient()

  const { data: interpreters } = await supabase
    .from('interpreter_profiles')
    .select('id, user_id, first_name, last_name, email, location, state, country, status, draft_step, created_at')
    .order('created_at', { ascending: false })

  return <InterpretersClient interpreters={interpreters || []} />
}
