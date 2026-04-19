'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Fetches the requester's org_name from requester_profiles.
 * Returns null if no org or user is not a requester.
 */
export function useOrgName(): string | null {
  const [orgName, setOrgName] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('requester_profiles')
        .select('org_name')
        .or(`user_id.eq.${user.id},id.eq.${user.id}`)
        .maybeSingle()
      if (data?.org_name?.trim()) setOrgName(data.org_name)
    })()
  }, [])

  return orgName
}
