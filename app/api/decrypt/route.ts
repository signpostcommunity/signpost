import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

// Tables that have encrypted fields and are allowed in context
const ALLOWED_TABLES = new Set(['bookings', 'messages'])

/**
 * POST /api/decrypt
 * Decrypts encrypted field values server-side with ownership verification.
 * Requires authentication + proof the caller owns the referenced record.
 *
 * Request shape (single):
 *   { ciphertext: string, context: { table: "bookings"|"messages", id: string } }
 *   → { plaintext: string | null }
 *
 * Request shape (batch):
 *   { fields: Record<string, string | null>, context: { table: "bookings"|"messages", ids: string[] } }
 *   → { fields: Record<string, string | null> }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Validate context is present
  const { context } = body
  if (!context || typeof context !== 'object' || !context.table) {
    return NextResponse.json({ error: 'Missing context (table + id/ids required)' }, { status: 400 })
  }

  // Validate table is allowed
  if (!ALLOWED_TABLES.has(context.table)) {
    return NextResponse.json({ error: `Table "${context.table}" is not allowed` }, { status: 400 })
  }

  // Normalize IDs: accept either single id or ids array
  const ids: string[] = context.ids
    ? (Array.isArray(context.ids) ? context.ids : [context.ids])
    : context.id
      ? [context.id]
      : []

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Missing context id(s)' }, { status: 400 })
  }

  // Ownership check: use the USER's authenticated Supabase client (inherits RLS)
  // If the user doesn't have RLS access, the query returns 0 rows → 403
  const { data: ownedRecords, error: ownershipError } = await supabase
    .from(context.table)
    .select('id')
    .in('id', ids)

  if (ownershipError) {
    console.error('[decrypt] ownership check error:', ownershipError.message)
    return NextResponse.json({ error: 'Ownership verification failed' }, { status: 403 })
  }

  const ownedIds = new Set((ownedRecords || []).map((r: { id: string }) => r.id))
  const missingIds = ids.filter(id => !ownedIds.has(id))
  if (missingIds.length > 0) {
    return NextResponse.json({ error: 'Access denied — you do not own the referenced record(s)' }, { status: 403 })
  }

  // Handle single ciphertext mode
  if (body.ciphertext !== undefined) {
    const plaintext = decrypt(body.ciphertext)
    return NextResponse.json({ plaintext })
  }

  // Handle batch fields mode
  const { fields } = body
  if (!fields || typeof fields !== 'object') {
    return NextResponse.json({ error: 'Missing ciphertext or fields' }, { status: 400 })
  }

  const decrypted: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(fields)) {
    decrypted[key] = decrypt(value as string | null)
  }

  return NextResponse.json({ fields: decrypted })
}
