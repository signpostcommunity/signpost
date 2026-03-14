import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify the requesting user has an accepted connection with this user
    const { data: connection } = await admin
      .from('trusted_deaf_circle')
      .select('id')
      .eq('status', 'accepted')
      .or(
        `and(inviter_id.eq.${user.id},invitee_id.eq.${userId}),and(inviter_id.eq.${userId},invitee_id.eq.${user.id})`
      )
      .maybeSingle()

    if (!connection) {
      return NextResponse.json({ error: 'Not authorized to view this list' }, { status: 403 })
    }

    // Fetch the target user's deaf_roster with interpreter details
    const { data: rosterRows, error: rosterError } = await admin
      .from('deaf_roster')
      .select(`
        id, interpreter_id, tier, notes,
        interpreter_profiles (
          id, name, first_name, last_name, photo_url, color,
          certifications:interpreter_certifications(name),
          specializations:interpreter_specializations(specialization)
        )
      `)
      .eq('deaf_user_id', userId)

    if (rosterError) {
      console.error('[dhh/circle/roster] fetch failed:', rosterError.message)
      return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 })
    }

    const roster = (rosterRows || []).map((row: Record<string, unknown>) => {
      const interp = row.interpreter_profiles as Record<string, unknown> | null
      const interpName = interp
        ? ((interp.first_name as string)
          ? `${interp.first_name} ${(interp.last_name as string) || ''}`.trim()
          : (interp.name as string) || 'Interpreter')
        : 'Interpreter'
      const initials = interpName.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
      const certs = interp
        ? ((interp.certifications as Array<{ name: string }>) || []).map(c => c.name).join(', ')
        : ''
      const domains = interp
        ? ((interp.specializations as Array<{ specialization: string }>) || []).map(s => s.specialization).join(', ')
        : ''

      return {
        id: row.id,
        interpreter_id: row.interpreter_id,
        tier: row.tier,
        notes: row.notes,
        name: interpName,
        photo_url: interp?.photo_url || null,
        color: (interp?.color as string) || '',
        initials,
        certs,
        domains,
      }
    })

    return NextResponse.json({ roster })
  } catch (err) {
    console.error('[dhh/circle/roster] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
