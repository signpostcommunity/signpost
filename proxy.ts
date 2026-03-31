import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/* ── Rate limiting (in-memory, per-instance) ── */
// Sufficient for beta volume. For production scale, replace with
// @upstash/ratelimit + Redis for cross-instance consistency.

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Prevent unbounded memory growth — evict expired entries periodically
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 120_000 // 2 minutes

function cleanupStaleEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(key)
  }
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  cleanupStaleEntries()
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

function getRateLimitConfig(path: string): { limit: number; window: number } {
  if (path.startsWith('/api/webhooks/')) {
    // Webhooks (Stripe, etc.) — high limit, trusted services
    return { limit: 100, window: 60_000 }
  }
  if (path.startsWith('/api/admin/')) {
    return { limit: 60, window: 60_000 }
  }
  if (path.startsWith('/api/seed')) {
    // Seed routes — moderate limit
    return { limit: 20, window: 60_000 }
  }
  if (path.includes('/auth/')) {
    // Auth routes — tighter to prevent brute force
    return { limit: 10, window: 60_000 }
  }
  // All other API routes
  return { limit: 30, window: 60_000 }
}

/* ── Proxy handler ── */

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ── Rate limit API routes ──
  if (path.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const { limit, window } = getRateLimitConfig(path)
    // Group by IP + route prefix (first 4 segments) so /api/messages/send
    // and /api/messages/conversations have separate buckets
    const key = `${ip}:${path.split('/').slice(0, 4).join('/')}`

    if (!checkRateLimit(key, limit, window)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a moment.' },
        { status: 429 }
      )
    }

    return NextResponse.next()
  }

  // ── Auth session refresh for dashboard routes ──
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the auth session so server components get a valid auth.uid()
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/api/:path*',
    '/interpreter/dashboard/:path*',
    '/dhh/dashboard/:path*',
    '/request/dashboard/:path*',
    '/admin/:path*',
  ],
}
