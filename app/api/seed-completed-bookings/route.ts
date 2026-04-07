export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

// Auto-seed disabled. The seed data arrays and original handler logic are preserved
// in git history. Re-enable manually when needed.
export async function POST(_request: NextRequest) {
  void _request
  return NextResponse.json({ message: 'Seeding disabled' }, { status: 200 })
}
