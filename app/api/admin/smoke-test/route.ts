import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { runRlsTests } from '@/lib/rls-smoke-tests'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Verify caller is admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: userProfile } = await admin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userProfile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Run all RLS tests using the authenticated user's client (not service role)
    const results = await runRlsTests(supabase, user.id)

    return NextResponse.json(results)
  } catch (err) {
    console.error('[admin/smoke-test] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
