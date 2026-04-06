import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Verify admin
    const { data: profile } = await admin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { alertId, action, notes } = body

    if (!alertId || !action) {
      return NextResponse.json({ error: 'Missing alertId or action' }, { status: 400 })
    }

    if (action === 'dismiss') {
      if (!notes?.trim()) {
        return NextResponse.json({ error: 'Notes required for dismissal' }, { status: 400 })
      }

      const { error } = await admin
        .from('admin_quality_alerts')
        .update({
          status: 'dismissed',
          admin_notes: notes.trim(),
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId)

      if (error) {
        console.error('[quality-alert-action] dismiss failed:', error.message)
        return NextResponse.json({ error: 'Failed to dismiss alert' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'action_taken') {
      const { error } = await admin
        .from('admin_quality_alerts')
        .update({
          status: 'action_taken',
          admin_notes: notes?.trim() || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId)

      if (error) {
        console.error('[quality-alert-action] action_taken failed:', error.message)
        return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[quality-alert-action] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
