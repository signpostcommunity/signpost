import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { processQualityAlerts } from '@/lib/qualityAlerts'

export const dynamic = 'force-dynamic'

// POST: trigger quality check for a single interpreter (used by client-side fire-and-forget)
// GET: run quality check across all interpreters (cron or manual admin trigger)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { interpreterId } = body
    let { interpreterName } = body

    if (!interpreterId) {
      return NextResponse.json({ error: 'Missing interpreterId' }, { status: 400 })
    }

    // Look up name if not provided
    if (!interpreterName) {
      const admin = getSupabaseAdmin()
      const { data: ip } = await admin
        .from('interpreter_profiles')
        .select('name, first_name, last_name')
        .eq('id', interpreterId)
        .maybeSingle()
      interpreterName = ip?.first_name ? `${ip.first_name} ${ip.last_name || ''}`.trim() : ip?.name || 'Interpreter'
    }

    // Fire-and-forget: don't block the response
    processQualityAlerts(interpreterId, interpreterName).catch(e =>
      console.error('[quality-check] process failed:', e)
    )

    return NextResponse.json({ queued: true })
  } catch (err) {
    console.error('[quality-check] POST error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin auth or cron key
    const cronKey = request.nextUrl.searchParams.get('key')
    const expectedKey = process.env.CRON_SECRET

    let isAdmin = false
    if (cronKey && expectedKey && cronKey === expectedKey) {
      isAdmin = true
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const admin = getSupabaseAdmin()
      const { data: profile } = await admin
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()
      isAdmin = !!profile?.is_admin
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const admin = getSupabaseAdmin()

    // Fetch all interpreters with at least 1 rating, 1 DNB entry, or 1 cancellation
    const { data: withRatings } = await admin
      .from('interpreter_ratings')
      .select('interpreter_id')

    const { data: withDnb } = await admin
      .from('deaf_roster')
      .select('interpreter_id')
      .eq('tier', 'dnb')

    const { data: withCancels } = await admin
      .from('bookings')
      .select('cancelled_by')
      .not('cancelled_by', 'is', null)

    // Collect unique interpreter IDs
    const interpreterIds = new Set<string>()
    for (const r of withRatings || []) interpreterIds.add(r.interpreter_id)
    for (const d of withDnb || []) interpreterIds.add(d.interpreter_id)

    // For cancellations, we need to map user_id back to interpreter_id
    const cancellerUserIds = new Set((withCancels || []).map(b => b.cancelled_by).filter(Boolean))
    if (cancellerUserIds.size > 0) {
      const { data: interpProfiles } = await admin
        .from('interpreter_profiles')
        .select('id, user_id')
        .in('user_id', Array.from(cancellerUserIds))
      for (const ip of interpProfiles || []) interpreterIds.add(ip.id)
    }

    // Fetch interpreter names
    const idArray = Array.from(interpreterIds)
    if (idArray.length === 0) {
      return NextResponse.json({ checked: 0, message: 'No interpreters with quality signals found' })
    }

    const { data: profiles } = await admin
      .from('interpreter_profiles')
      .select('id, name, first_name, last_name')
      .in('id', idArray)

    const nameMap = new Map(
      (profiles || []).map(p => [
        p.id,
        p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : p.name || 'Interpreter',
      ])
    )

    // Run quality checks
    let processed = 0
    for (const id of idArray) {
      await processQualityAlerts(id, nameMap.get(id) || 'Interpreter')
      processed++
    }

    return NextResponse.json({ checked: processed, message: `Quality check complete for ${processed} interpreter${processed !== 1 ? 's' : ''}` })
  } catch (err) {
    console.error('[quality-check] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
