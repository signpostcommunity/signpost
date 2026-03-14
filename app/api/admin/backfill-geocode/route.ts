import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()

  // Auth check — must be logged in admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!userProfile?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const apiKey = process.env.OPENCAGE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENCAGE_API_KEY not configured' }, { status: 500 })
  }

  // Use admin client to bypass RLS for reads and writes
  const admin = getSupabaseAdmin()

  // Fetch profiles without coordinates that have location data
  const { data: profiles, error: fetchError } = await admin
    .from('interpreter_profiles')
    .select('id, city, state, country')
    .or('latitude.is.null,longitude.is.null')
    .or('city.not.is.null,state.not.is.null')

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ message: 'No profiles to backfill', updated: 0 })
  }

  let updated = 0
  let failed = 0
  const errors: string[] = []

  for (const profile of profiles) {
    const parts = [profile.city, profile.state, profile.country].filter(Boolean)
    if (parts.length === 0) continue

    const query = parts.join(', ')

    try {
      const res = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=1&no_annotations=1`
      )
      const data = await res.json()

      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry
        const { error: updateError } = await admin
          .from('interpreter_profiles')
          .update({ latitude: lat, longitude: lng })
          .eq('id', profile.id)

        if (updateError) {
          failed++
          errors.push(`Profile ${profile.id}: ${updateError.message}`)
        } else {
          updated++
        }
      } else {
        failed++
        errors.push(`Profile ${profile.id}: location not found for "${query}"`)
      }
    } catch (err) {
      failed++
      errors.push(`Profile ${profile.id}: ${(err as Error).message}`)
    }

    // Rate limit: 200ms between calls (OpenCage free tier)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return NextResponse.json({
    message: `Backfill complete`,
    total: profiles.length,
    updated,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
