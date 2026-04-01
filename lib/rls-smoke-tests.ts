/**
 * RLS Smoke Test definitions and runner.
 * Tests RLS policies by running direct Supabase queries as the authenticated admin user.
 * Each test verifies that the admin can (or cannot) access data through normal RLS.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface RlsTestResult {
  name: string
  table: string
  role: string
  type: 'positive' | 'negative'
  expected: string
  actual: string
  passed: boolean
  error?: string
}

export interface RlsTestSuite {
  timestamp: string
  results: RlsTestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    errors: number
    skipped: number
  }
}

// ── Assertion helpers ──────────────────────────────────────────────────────

type Check = 'eq0' | 'eq1' | 'gt0' | 'gte0'

function checkResult(actual: number, check: Check): boolean {
  switch (check) {
    case 'eq0': return actual === 0
    case 'eq1': return actual === 1
    case 'gt0': return actual > 0
    case 'gte0': return actual >= 0
  }
}

function checkLabel(check: Check): string {
  switch (check) {
    case 'eq0': return '0'
    case 'eq1': return '1'
    case 'gt0': return '> 0'
    case 'gte0': return '>= 0'
  }
}

// ── Test definitions ───────────────────────────────────────────────────────

interface TestDef {
  name: string
  table: string
  role: string
  type: 'positive' | 'negative'
  check: Check
  filter?: { column: string; op: 'eq' | 'neq'; value: string }
}

const tests: TestDef[] = [
  // ── Category A: Core profile tables ──
  {
    name: 'A1: Admin sees own user_profile',
    table: 'user_profiles', role: 'admin', type: 'positive',
    check: 'eq1',
    filter: { column: 'id', op: 'eq', value: '__SELF__' },
  },
  {
    name: 'A2: Admin sees all user_profiles',
    table: 'user_profiles', role: 'admin', type: 'positive',
    check: 'gt0',
  },
  {
    name: 'A3: Admin sees interpreter_profiles',
    table: 'interpreter_profiles', role: 'admin', type: 'positive',
    check: 'gt0',
  },
  {
    name: 'A4: Admin sees deaf_profiles',
    table: 'deaf_profiles', role: 'admin', type: 'positive',
    check: 'gt0',
  },

  // ── Category B: Booking tables ──
  {
    name: 'B1: Admin can query bookings',
    table: 'bookings', role: 'admin', type: 'positive',
    check: 'gte0',
  },
  {
    name: 'B2: Admin can query booking_recipients',
    table: 'booking_recipients', role: 'admin', type: 'positive',
    check: 'gte0',
  },
  {
    name: 'B3: Admin can query booking_dhh_clients',
    table: 'booking_dhh_clients', role: 'admin', type: 'positive',
    check: 'gte0',
  },

  // ── Category C: Messaging tables ──
  {
    name: 'C1: Admin can query direct_messages',
    table: 'direct_messages', role: 'admin', type: 'positive',
    check: 'gte0',
  },
  {
    name: 'C2: Admin can query messages',
    table: 'messages', role: 'admin', type: 'positive',
    check: 'gte0',
  },

  // ── Category D: Sensitive tables ──
  {
    name: 'D1: Admin can read beta_feedback',
    table: 'beta_feedback', role: 'admin', type: 'positive',
    check: 'gte0',
  },
  {
    name: 'D2: Admin can query deaf_roster',
    table: 'deaf_roster', role: 'admin', type: 'positive',
    check: 'gte0',
  },
  {
    name: 'D3: Admin can query notifications',
    table: 'notifications', role: 'admin', type: 'positive',
    check: 'gte0',
  },
  {
    name: 'D4: Admin can query profile_flags',
    table: 'profile_flags', role: 'admin', type: 'positive',
    check: 'gte0',
  },
  {
    name: 'D5: Admin can query booking_credits',
    table: 'booking_credits', role: 'admin', type: 'positive',
    check: 'gte0',
  },

  // ── Category E: Ratings ──
  {
    name: 'E1: Admin can query interpreter_ratings',
    table: 'interpreter_ratings', role: 'admin', type: 'positive',
    check: 'gte0',
  },
]

// ── Runner ─────────────────────────────────────────────────────────────────

import { SupabaseClient } from '@supabase/supabase-js'

export async function runRlsTests(
  supabase: SupabaseClient,
  userId: string,
): Promise<RlsTestSuite> {
  const results: RlsTestResult[] = []

  for (const t of tests) {
    try {
      let query = supabase
        .from(t.table)
        .select('id', { count: 'exact', head: true })

      if (t.filter) {
        const value = t.filter.value === '__SELF__' ? userId : t.filter.value
        if (t.filter.op === 'eq') {
          query = query.eq(t.filter.column, value)
        } else {
          query = query.neq(t.filter.column, value)
        }
      }

      const { count, error } = await query

      if (error) {
        results.push({
          name: t.name, table: t.table, role: t.role, type: t.type,
          expected: checkLabel(t.check), actual: 'ERROR', passed: false,
          error: error.message,
        })
        continue
      }

      const actual = count ?? 0
      const passed = checkResult(actual, t.check)

      results.push({
        name: t.name, table: t.table, role: t.role, type: t.type,
        expected: checkLabel(t.check), actual: String(actual), passed,
      })
    } catch (err) {
      results.push({
        name: t.name, table: t.table, role: t.role, type: t.type,
        expected: checkLabel(t.check), actual: 'ERROR', passed: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const errors = results.filter(r => r.error).length
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed && !r.error).length

  return {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      errors,
      skipped: 0,
    },
  }
}

// ── Storage bucket info (static, from pre-flight) ──────────────────────────

export const storageBuckets = [
  { name: 'asl-guide', public: true, fileSizeLimit: '500 MB', mimeTypes: ['video/mp4'] },
  { name: 'avatars', public: true, fileSizeLimit: '2 MB', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
  { name: 'interpreter videos', public: true, fileSizeLimit: '100 MB', mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'] },
  { name: 'message-attachments', public: false, fileSizeLimit: '10 MB', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] },
  { name: 'profile-photos', public: true, fileSizeLimit: '2 MB', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
  { name: 'videos', public: true, fileSizeLimit: '100 MB', mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'] },
]
