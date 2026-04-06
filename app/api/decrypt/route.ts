import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

/**
 * POST /api/decrypt
 * Decrypts encrypted field values server-side. Requires authentication.
 * Body: { fields: Record<string, string | null> }
 * Returns: { fields: Record<string, string | null> }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { fields } = body

  if (!fields || typeof fields !== 'object') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const decrypted: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(fields)) {
    decrypted[key] = decrypt(value as string | null)
  }

  return NextResponse.json({ fields: decrypted })
}
