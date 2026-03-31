import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    const { data: profile, error } = await admin
      .from('user_profiles')
      .select('is_admin, admin_alert_preferences, admin_phone')
      .eq('id', user.id)
      .single()

    if (error || !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      preferences: profile.admin_alert_preferences || {},
      phone: profile.admin_phone || null,
    })
  } catch (err) {
    console.error('[admin/alert-preferences] GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = getSupabaseAdmin()

    // Verify is_admin
    const { data: profile, error: profileErr } = await adminClient
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { preferences, phone } = body

    const updates: Record<string, unknown> = {}
    if (preferences !== undefined) {
      updates.admin_alert_preferences = preferences
    }
    if (phone !== undefined) {
      updates.admin_phone = phone || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { error: updateErr } = await adminClient
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)

    if (updateErr) {
      console.error('[admin/alert-preferences] update failed:', updateErr.message)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/alert-preferences] POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
