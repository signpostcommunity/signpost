export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { seedInterpreterData } from '@/lib/seedInterpreterData'

export async function POST(request: NextRequest) {
  try {
    const { interpreterProfileId } = await request.json()
    if (!interpreterProfileId || typeof interpreterProfileId !== 'string') {
      return NextResponse.json({ error: 'Missing interpreterProfileId' }, { status: 400 })
    }

    // Verify the caller is authenticated and owns this profile
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('id', interpreterProfileId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found or not yours' }, { status: 403 })
    }

    // Auto-seed disabled. Re-enable manually when needed.
    void seedInterpreterData
    void profile
    void interpreterProfileId
    return NextResponse.json({ message: 'Seeding disabled' }, { status: 200 })
  } catch (err) {
    console.error('[api/seed-interpreter] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
