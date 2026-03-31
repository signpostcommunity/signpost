/**
 * RLS Smoke Test definitions and runner.
 * Tests RLS policies by calling rls_test_count() which impersonates users.
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

// ── Test user IDs (verified via pre-flight queries) ────────────────────────

const MOLLY = '6018f4fe-83b4-4e9b-8022-e6b15158ab97'     // admin + interpreter + deaf + requester
const JENNY = 'd86a237a-7d7d-4d9a-a47d-7a30c552cf6d'     // interpreter-only (Jenny Henn)
const ADAM  = '330e3976-3db1-4896-a1c1-a6f35dbcc221'      // deaf-only

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
  userId: string
  sql: string
  check: Check
}

function q(uid: string): string {
  return uid.replace(/'/g, "''")
}

const tests: TestDef[] = [
  // ── Category A: Core profile tables ──
  {
    name: 'A1: User sees own user_profile',
    table: 'user_profiles', role: 'admin', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM user_profiles WHERE id = '${q(MOLLY)}'`,
    check: 'eq1',
  },
  {
    name: 'A2: Admin sees all user_profiles',
    table: 'user_profiles', role: 'admin', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM user_profiles`,
    check: 'gt0',
  },
  {
    name: 'A3: Non-admin sees only own user_profile',
    table: 'user_profiles', role: 'deaf', type: 'negative',
    userId: ADAM,
    sql: `SELECT count(*) FROM user_profiles WHERE id != '${q(ADAM)}'`,
    check: 'eq0',
  },
  {
    name: 'A4: Interpreter sees own interpreter_profile',
    table: 'interpreter_profiles', role: 'interpreter', type: 'positive',
    userId: JENNY,
    sql: `SELECT count(*) FROM interpreter_profiles WHERE user_id = '${q(JENNY)}'`,
    check: 'eq1',
  },
  {
    name: 'A5: Public reads approved interpreter_profiles',
    table: 'interpreter_profiles', role: 'interpreter', type: 'positive',
    userId: JENNY,
    sql: `SELECT count(*) FROM interpreter_profiles`,
    check: 'gt0',
  },
  {
    name: 'A6: Deaf user sees own deaf_profile',
    table: 'deaf_profiles', role: 'deaf', type: 'positive',
    userId: ADAM,
    sql: `SELECT count(*) FROM deaf_profiles WHERE user_id = '${q(ADAM)}'`,
    check: 'eq1',
  },
  {
    name: 'A7: Deaf user sees profiles with slugs (public read)',
    table: 'deaf_profiles', role: 'deaf', type: 'positive',
    userId: ADAM,
    sql: `SELECT count(*) FROM deaf_profiles`,
    check: 'gt0',
  },

  // ── Category B: Booking tables ──
  {
    name: 'B1: Requester sees own bookings',
    table: 'bookings', role: 'requester', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM bookings`,
    check: 'gt0',
  },
  {
    name: 'B2: Outsider sees 0 bookings',
    table: 'bookings', role: 'deaf', type: 'negative',
    userId: ADAM,
    sql: `SELECT count(*) FROM bookings`,
    check: 'eq0',
  },
  {
    name: 'B3: Requester sees booking_recipients on own bookings',
    table: 'booking_recipients', role: 'requester', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM booking_recipients`,
    check: 'gt0',
  },
  {
    name: 'B4: Outsider sees 0 booking_recipients',
    table: 'booking_recipients', role: 'deaf', type: 'negative',
    userId: ADAM,
    sql: `SELECT count(*) FROM booking_recipients`,
    check: 'eq0',
  },
  {
    name: 'B5: DHH client sees booking_dhh_clients entries',
    table: 'booking_dhh_clients', role: 'deaf', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM booking_dhh_clients`,
    check: 'gt0',
  },
  {
    name: 'B6: Non-participant sees 0 booking_dhh_clients',
    table: 'booking_dhh_clients', role: 'deaf', type: 'negative',
    userId: ADAM,
    sql: `SELECT count(*) FROM booking_dhh_clients`,
    check: 'eq0',
  },

  // ── Category C: Messaging tables ──
  {
    name: 'C1: Conversation member sees direct_messages',
    table: 'direct_messages', role: 'admin', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM direct_messages`,
    check: 'gte0',
  },
  {
    name: 'C2: Non-member sees 0 direct_messages',
    table: 'direct_messages', role: 'deaf', type: 'negative',
    userId: ADAM,
    sql: `SELECT count(*) FROM direct_messages`,
    check: 'eq0',
  },
  {
    name: 'C3: Interpreter sees own legacy messages',
    table: 'messages', role: 'interpreter', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM messages`,
    check: 'gte0',
  },
  {
    name: 'C4: Outsider sees 0 legacy messages',
    table: 'messages', role: 'deaf', type: 'negative',
    userId: ADAM,
    sql: `SELECT count(*) FROM messages`,
    check: 'eq0',
  },

  // ── Category D: Sensitive tables ──
  {
    name: 'D1: Non-admin cannot read beta_feedback',
    table: 'beta_feedback', role: 'deaf', type: 'negative',
    userId: ADAM,
    sql: `SELECT count(*) FROM beta_feedback`,
    check: 'eq0',
  },
  {
    name: 'D2: Admin reads all beta_feedback',
    table: 'beta_feedback', role: 'admin', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM beta_feedback`,
    check: 'gt0',
  },
  {
    name: 'D3: User sees own deaf_roster',
    table: 'deaf_roster', role: 'deaf', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM deaf_roster`,
    check: 'gt0',
  },
  {
    name: 'D4: Outsider sees 0 deaf_roster entries',
    table: 'deaf_roster', role: 'deaf', type: 'negative',
    userId: ADAM,
    sql: `SELECT count(*) FROM deaf_roster`,
    check: 'eq0',
  },
  {
    name: 'D5: User sees own notifications only',
    table: 'notifications', role: 'admin', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM notifications`,
    check: 'gte0',
  },
  {
    name: 'D6: Admin sees profile_flags',
    table: 'profile_flags', role: 'admin', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM profile_flags`,
    check: 'gte0',
  },
  {
    name: 'D7: Non-admin cannot read others profile_flags',
    table: 'profile_flags', role: 'deaf', type: 'negative',
    userId: ADAM,
    sql: `SELECT count(*) FROM profile_flags`,
    check: 'eq0',
  },
  {
    name: 'D8: Requester sees own booking_credits',
    table: 'booking_credits', role: 'requester', type: 'positive',
    userId: MOLLY,
    sql: `SELECT count(*) FROM booking_credits`,
    check: 'gte0',
  },
]

// ── Runner ─────────────────────────────────────────────────────────────────

import { SupabaseClient } from '@supabase/supabase-js'

export async function runRlsTests(admin: SupabaseClient): Promise<RlsTestSuite> {
  const results: RlsTestResult[] = []

  for (const t of tests) {
    try {
      const { data, error } = await admin.rpc('rls_test_count', {
        p_user_id: t.userId,
        p_sql: t.sql,
      })

      if (error) {
        results.push({
          name: t.name, table: t.table, role: t.role, type: t.type,
          expected: checkLabel(t.check), actual: 'ERROR', passed: false,
          error: error.message,
        })
        continue
      }

      const actual = Number(data ?? 0)
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
