'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SessionRefreshProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    async function refresh() {
      try {
        const supabase = createClient()
        await supabase.auth.getSession()
      } catch (err) {
        console.warn('[SessionRefreshProvider] session refresh failed:', err)
      } finally {
        if (mounted) setReady(true)
      }
    }
    refresh()
    return () => { mounted = false }
  }, [])

  return <>{children}</>
}
