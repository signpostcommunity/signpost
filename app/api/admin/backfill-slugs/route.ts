import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { generateSlug } from '@/lib/slugUtils'

export async function POST() {
  // Auth check - must be admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileErr } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = getSupabaseAdmin()

  // Fetch all profiles without a slug
  const { data: profiles, error: fetchErr } = await admin
    .from('interpreter_profiles')
    .select('id, first_name, last_name')
    .is('vanity_slug', null)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const p of profiles || []) {
    const baseSlug = generateSlug(p.first_name || '', p.last_name || '')
    if (!baseSlug || baseSlug.length < 3) {
      skipped++
      continue
    }

    let slug = baseSlug
    let attempt = 1

    // Find an available slug
    while (true) {
      const { data: existing } = await admin
        .from('interpreter_profiles')
        .select('id')
        .ilike('vanity_slug', slug)
        .limit(1)
        .maybeSingle()

      if (!existing) break

      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    const { error: updateErr } = await admin
      .from('interpreter_profiles')
      .update({ vanity_slug: slug })
      .eq('id', p.id)

    if (updateErr) {
      errors.push(`${p.id}: ${updateErr.message}`)
    } else {
      updated++
    }
  }

  return NextResponse.json({ updated, skipped, errors })
}
