export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { seedInterpreterData } from '@/lib/seedInterpreterData'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('confirm') !== 'yes') {
    return NextResponse.json({ error: 'Add ?confirm=yes to run backfill' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: profiles, error: fetchErr } = await supabase
    .from('interpreter_profiles')
    .select('id')

  if (fetchErr || !profiles) {
    return NextResponse.json({ error: fetchErr?.message || 'No profiles found' }, { status: 500 })
  }

  const results: { id: string; success: boolean; error?: string }[] = []

  for (const profile of profiles) {
    // Delete old seed data
    await supabase.from('bookings').delete().eq('interpreter_id', profile.id).eq('is_seed', true)
    await supabase.from('messages').delete().eq('interpreter_id', profile.id).eq('is_seed', true)

    // Insert new seed data
    const result = await seedInterpreterData(profile.id)
    results.push({ id: profile.id, ...result })
  }

  const succeeded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success)

  return NextResponse.json({
    total: profiles.length,
    succeeded,
    failed: failed.length,
    errors: failed,
  })
}
