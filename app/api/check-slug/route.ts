import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { validateSlug } from '@/lib/slugUtils'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.toLowerCase().trim()

  if (!slug) {
    return NextResponse.json({ available: false, reason: 'invalid' })
  }

  const validation = validateSlug(slug)
  if (!validation.valid) {
    if (validation.error === 'This URL is reserved') {
      return NextResponse.json({ available: false, reason: 'reserved' })
    }
    return NextResponse.json({ available: false, reason: 'invalid' })
  }

  const table = request.nextUrl.searchParams.get('table') || 'interpreter_profiles'
  const validTables = ['interpreter_profiles', 'deaf_profiles']
  const targetTable = validTables.includes(table) ? table : 'interpreter_profiles'

  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from(targetTable)
      .select('id')
      .ilike('vanity_slug', slug)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[check-slug] DB error:', error.message)
      return NextResponse.json({ available: false, reason: 'invalid' }, { status: 500 })
    }

    if (data) {
      return NextResponse.json({ available: false, reason: 'taken' })
    }

    return NextResponse.json({ available: true })
  } catch (err) {
    console.error('[check-slug] Error:', err)
    return NextResponse.json({ available: false, reason: 'invalid' }, { status: 500 })
  }
}
