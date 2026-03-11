import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // Verify the caller is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await request.json()
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  // Prevent self-deletion
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Cascade delete related data (order matters for FK constraints)
  // Get interpreter profile id for FK-dependent tables
  const { data: interpProfile } = await admin
    .from('interpreter_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (interpProfile) {
    // Delete bookings referencing this interpreter
    await admin.from('bookings').delete().eq('interpreter_id', interpProfile.id)
    // Delete reviews for this interpreter
    await admin.from('reviews').delete().eq('interpreter_id', interpProfile.id)
    // Delete messages where this interpreter is involved
    await admin.from('messages').delete().eq('sender_id', userId)
    // Delete rate profiles
    await admin.from('interpreter_rate_profiles').delete().eq('interpreter_id', interpProfile.id)
    // Delete availability
    await admin.from('interpreter_availability').delete().eq('interpreter_id', interpProfile.id)
    // Delete junction tables
    await admin.from('interpreter_sign_languages').delete().eq('interpreter_id', interpProfile.id)
    await admin.from('interpreter_spoken_languages').delete().eq('interpreter_id', interpProfile.id)
    await admin.from('interpreter_specializations').delete().eq('interpreter_id', interpProfile.id)
    await admin.from('interpreter_regions').delete().eq('interpreter_id', interpProfile.id)
    await admin.from('interpreter_certifications').delete().eq('interpreter_id', interpProfile.id)
    await admin.from('interpreter_education').delete().eq('interpreter_id', interpProfile.id)
    // Delete profile flags targeting this interpreter
    await admin.from('profile_flags').delete().eq('interpreter_profile_id', interpProfile.id)
    // Delete the interpreter profile
    await admin.from('interpreter_profiles').delete().eq('id', interpProfile.id)
  }

  // Delete deaf-related data
  await admin.from('deaf_roster').delete().eq('deaf_user_id', userId)
  await admin.from('deaf_profiles').delete().eq('user_id', userId)
  // Also delete by id (some deaf_profiles use auth uid as primary key)
  await admin.from('deaf_profiles').delete().eq('id', userId)

  // Delete requester data
  await admin.from('bookings').delete().eq('requester_id', userId)
  await admin.from('requester_profiles').delete().eq('id', userId)

  // Delete beta feedback
  await admin.from('beta_feedback').delete().eq('user_id', userId)

  // Delete profile flags filed by this user
  await admin.from('profile_flags').delete().eq('flagged_by', userId)

  // Delete reviews by this user
  await admin.from('reviews').delete().eq('reviewer_id', userId)

  // Delete messages by this user
  await admin.from('messages').delete().eq('sender_id', userId)

  // Delete user_profiles row
  await admin.from('user_profiles').delete().eq('id', userId)

  // Delete auth.users row
  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  if (authError) {
    return NextResponse.json({ error: `Auth deletion failed: ${authError.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
