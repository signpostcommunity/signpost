import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const admin = getSupabaseAdmin()

  // Fetch all profile data in parallel
  const [userProfileRes, interpreterRes, deafRes, requesterRes] = await Promise.all([
    admin.from('user_profiles').select('*').eq('id', userId).single(),
    admin.from('interpreter_profiles').select('*').eq('user_id', userId).maybeSingle(),
    admin.from('deaf_profiles').select('*').or(`id.eq.${userId},user_id.eq.${userId}`).maybeSingle(),
    admin.from('requester_profiles').select('*').eq('id', userId).maybeSingle(),
  ])

  if (userProfileRes.error || !userProfileRes.data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get auth email as fallback
  let authEmail = ''
  try {
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(userId)
    authEmail = authUser?.email || ''
  } catch { /* ignore */ }

  return NextResponse.json({
    userProfile: userProfileRes.data,
    interpreterProfile: interpreterRes.data,
    deafProfile: deafRes.data,
    requesterProfile: requesterRes.data,
    authEmail,
  })
}
