import { createClient } from '@/lib/supabase/server'
import FlagsClient from './FlagsClient'

export const dynamic = 'force-dynamic'

export default async function AdminFlagsPage() {
  const supabase = await createClient()

  // Fetch all flags
  const { data: flags } = await supabase
    .from('profile_flags')
    .select('id, interpreter_profile_id, flagged_by, reason, details, status, created_at')
    .order('created_at', { ascending: false })

  if (!flags || flags.length === 0) {
    return <FlagsClient flags={[]} />
  }

  // Get interpreter names
  const interpIds = [...new Set(flags.map(f => f.interpreter_profile_id).filter(Boolean))]
  const { data: interpreters } = await supabase
    .from('interpreter_profiles')
    .select('id, first_name, last_name')
    .in('id', interpIds)

  const nameMap = new Map((interpreters || []).map(i => [i.id, `${i.first_name || ''} ${i.last_name || ''}`.trim()]))

  // Get flagger emails from user_profiles
  const flaggerIds = [...new Set(flags.map(f => f.flagged_by).filter(Boolean))]
  const { data: flaggers } = await supabase
    .from('user_profiles')
    .select('id, email')
    .in('id', flaggerIds)

  const emailMap = new Map((flaggers || []).map(f => [f.id, f.email || '']))

  const enrichedFlags = flags.map(f => ({
    id: f.id,
    interpreterProfileId: f.interpreter_profile_id,
    interpreterName: nameMap.get(f.interpreter_profile_id) || 'Unknown',
    flaggedByEmail: emailMap.get(f.flagged_by) || 'Unknown',
    reason: f.reason,
    details: f.details || '',
    status: f.status || 'pending',
    created_at: f.created_at,
  }))

  return <FlagsClient flags={enrichedFlags} />
}
