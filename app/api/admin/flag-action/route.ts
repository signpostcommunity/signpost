import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { flagId, action } = await request.json()
  if (!flagId || !['reviewed', 'dismissed', 'suspended'].includes(action)) {
    return NextResponse.json({ error: 'Invalid flagId or action' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  if (action === 'suspended') {
    // Get the flag to find the interpreter profile
    const { data: flag, error: flagErr } = await admin
      .from('profile_flags')
      .select('interpreter_profile_id')
      .eq('id', flagId)
      .single()

    if (flagErr || !flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }

    // Suspend the interpreter profile
    const { error: suspendErr } = await admin
      .from('interpreter_profiles')
      .update({ status: 'suspended' })
      .eq('id', flag.interpreter_profile_id)

    if (suspendErr) {
      return NextResponse.json({ error: `Failed to suspend profile: ${suspendErr.message}` }, { status: 500 })
    }

    // Update the flag
    const { error: updateErr } = await admin
      .from('profile_flags')
      .update({
        status: 'suspended',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', flagId)

    if (updateErr) {
      return NextResponse.json({ error: `Failed to update flag: ${updateErr.message}` }, { status: 500 })
    }
  } else {
    // reviewed or dismissed
    const { error: updateErr } = await admin
      .from('profile_flags')
      .update({
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', flagId)

    if (updateErr) {
      return NextResponse.json({ error: `Failed to update flag: ${updateErr.message}` }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
