// AUTH GUARD DISABLED FOR DEVELOPMENT
// To re-enable: restore the redirect logic below
// Original file backed up as proxy.ts.bak in project root

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Pass all requests through during development
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/interpreter/dashboard/:path*',
    '/dhh/dashboard/:path*',
    '/request/dashboard/:path*',
  ],
}
