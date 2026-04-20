import { cache } from 'react'
import { createClient } from './server'

/**
 * Memoized getUser() for a single server request.
 * React cache() dedupes across nested server components within the same request,
 * so multiple layouts/pages calling this will only hit Supabase auth once.
 */
export const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
