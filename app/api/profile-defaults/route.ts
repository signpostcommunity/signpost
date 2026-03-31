export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExistingProfileData } from '@/lib/populateNewProfile'

/**
 * GET /api/profile-defaults
 * Returns shared profile fields from existing profiles for the authenticated user.
 * Used by add-role signup forms to pre-fill fields.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const defaults = await getExistingProfileData(user.id)
  return NextResponse.json(defaults)
}
