// backfill-notification-ciphertext.ts
//
// One-shot script to fix 54 notification rows created between 2026-04-21 and
// 2026-04-27 where AES-256-GCM ciphertext leaked into subject/body text fields.
// The sender-level fix shipped in commit 4aefdfd. This script backfills the
// pre-fix rows by decrypting ciphertext substrings in place.
//
// Usage:
//   npx tsx scripts/backfill-notification-ciphertext.ts          # dry-run
//   npx tsx scripts/backfill-notification-ciphertext.ts --apply  # write changes
//
// Requires .env.local (or shell env) with:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY
//
// Safe to delete after the backfill is verified complete.
//
// Created: 2026-04-27

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { decrypt } from '../lib/encryption'

const EXPECTED_ROW_COUNT = 54
const CIPHERTEXT_RE = /enc:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+/g

const applyMode = process.argv.includes('--apply')

function replaceCiphertext(text: string): { replaced: string; errors: string[] } {
  const errors: string[] = []
  const replaced = text.replace(CIPHERTEXT_RE, (match) => {
    const plaintext = decrypt(match)
    if (!plaintext || plaintext === '[encrypted]' || plaintext === '[decryption error]' || plaintext === '[invalid encrypted data]') {
      errors.push(`Failed to decrypt: ${match.slice(0, 40)}...`)
      return match // leave original in place on failure
    }
    return plaintext
  })
  return { replaced, errors }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  if (!process.env.ENCRYPTION_KEY) {
    console.error('Missing ENCRYPTION_KEY -- cannot decrypt ciphertext')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log(`Mode: ${applyMode ? 'APPLY (will write changes)' : 'DRY-RUN (read only)'}`)
  console.log()

  // Fetch affected rows
  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, subject, body')
    .or('subject.like.%enc:%,body.like.%enc:%')

  if (error) {
    console.error('Query failed:', error.message)
    process.exit(1)
  }

  if (!rows || rows.length === 0) {
    console.log('No affected rows found. Nothing to do.')
    process.exit(0)
  }

  console.log(`Found ${rows.length} affected rows (expected ${EXPECTED_ROW_COUNT})`)
  if (rows.length !== EXPECTED_ROW_COUNT) {
    console.warn(`WARNING: Row count ${rows.length} differs from expected ${EXPECTED_ROW_COUNT}. Proceeding anyway.`)
  }
  console.log()

  let changed = 0
  let errored = 0

  for (const row of rows) {
    const subjectResult = row.subject ? replaceCiphertext(row.subject) : { replaced: row.subject, errors: [] }
    const bodyResult = row.body ? replaceCiphertext(row.body) : { replaced: row.body, errors: [] }
    const allErrors = [...subjectResult.errors, ...bodyResult.errors]

    const subjectChanged = subjectResult.replaced !== row.subject
    const bodyChanged = bodyResult.replaced !== row.body

    if (!subjectChanged && !bodyChanged) {
      // Regex matched the LIKE but no valid ciphertext found (shouldn't happen)
      console.log(`[${row.id}] No ciphertext matches found (unexpected)`)
      continue
    }

    // Safety: refuse to write empty subject or body
    if (subjectChanged && (!subjectResult.replaced || subjectResult.replaced.trim() === '')) {
      console.error(`[${row.id}] SKIPPED: replacement would produce empty subject`)
      errored++
      continue
    }
    if (bodyChanged && (!bodyResult.replaced || bodyResult.replaced.trim() === '')) {
      console.error(`[${row.id}] SKIPPED: replacement would produce empty body`)
      errored++
      continue
    }

    // Refuse to write if any decrypt failed
    if (allErrors.length > 0) {
      console.error(`[${row.id}] SKIPPED: decrypt errors:`)
      allErrors.forEach((e) => console.error(`  - ${e}`))
      errored++
      continue
    }

    // Log before/after
    console.log(`--- Row ${row.id} ---`)
    if (subjectChanged) {
      console.log(`  subject BEFORE: ${row.subject}`)
      console.log(`  subject AFTER:  ${subjectResult.replaced}`)
    }
    if (bodyChanged) {
      console.log(`  body BEFORE: ${row.body}`)
      console.log(`  body AFTER:  ${bodyResult.replaced}`)
    }

    if (applyMode) {
      try {
        const updatePayload: Record<string, string> = {}
        if (subjectChanged) updatePayload.subject = subjectResult.replaced
        if (bodyChanged) updatePayload.body = bodyResult.replaced

        const { error: updateError } = await supabase
          .from('notifications')
          .update(updatePayload)
          .eq('id', row.id)

        if (updateError) {
          console.error(`[${row.id}] UPDATE FAILED: ${updateError.message}`)
          errored++
          continue
        }
        console.log(`  -> Updated`)
      } catch (err) {
        console.error(`[${row.id}] UPDATE EXCEPTION: ${err}`)
        errored++
        continue
      }
    }

    changed++
    console.log()
  }

  // Summary
  console.log('=== Summary ===')
  console.log(`Mode:    ${applyMode ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Total:   ${rows.length} rows examined`)
  console.log(`Changed: ${changed}`)
  console.log(`Errored: ${errored}`)

  if (errored > 0) {
    console.error(`${errored} row(s) had errors. Review output above.`)
    process.exit(1)
  }
}

main()
