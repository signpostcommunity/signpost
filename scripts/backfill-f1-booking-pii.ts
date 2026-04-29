// backfill-f1-booking-pii.ts
//
// One-shot script to encrypt 8 PII booking fields that were previously stored
// as plaintext. The code-level fix (commit 1 of F1) ensures all new writes
// encrypt these fields. This script backfills existing rows.
//
// Usage:
//   npx tsx scripts/backfill-f1-booking-pii.ts          # dry-run
//   npx tsx scripts/backfill-f1-booking-pii.ts --apply  # write changes
//
// Requires .env.local (or shell env) with:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ENCRYPTION_KEY
//
// Safe to delete after the backfill is verified complete.
//
// Created: 2026-04-29

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { encrypt } from '../lib/encryption'

const FIELDS_TO_ENCRYPT = [
  'location_address',
  'prep_notes',
  'onsite_contact_name',
  'onsite_contact_phone',
  'onsite_contact_email',
  'meeting_link',
  'requester_name',
  'context_video_url',
] as const

const BATCH_SIZE = 50
const applyMode = process.argv.includes('--apply')

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  if (!process.env.ENCRYPTION_KEY) {
    console.error('Missing ENCRYPTION_KEY -- cannot encrypt fields')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log(`Mode: ${applyMode ? 'APPLY (will write changes)' : 'DRY-RUN (read only)'}`)
  console.log()

  // Fetch all bookings where ANY of the 8 fields is non-null AND does not start with 'enc:'
  const orConditions = FIELDS_TO_ENCRYPT.map(
    f => `and(${f}.not.is.null,${f}.not.like.enc:%25)`
  ).join(',')

  const { data: rows, error } = await supabase
    .from('bookings')
    .select(`id, ${FIELDS_TO_ENCRYPT.join(', ')}`)
    .or(orConditions)

  if (error) {
    console.error('Query failed:', error.message)
    process.exit(1)
  }

  if (!rows || rows.length === 0) {
    console.log('No affected rows found. Nothing to do.')
    process.exit(0)
  }

  console.log(`Found ${rows.length} rows with at least one plaintext PII field`)
  console.log()

  let scanned = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  // Process in batches
  for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
    const batch = rows.slice(batchStart, batchStart + BATCH_SIZE)
    const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1
    console.log(`--- Batch ${batchNum} (rows ${batchStart + 1}–${batchStart + batch.length}) ---`)

    for (const row of batch) {
      scanned++
      const updatePayload: Record<string, string | null> = {}
      let fieldsEncrypted = 0

      for (const field of FIELDS_TO_ENCRYPT) {
        const value = row[field]
        if (typeof value === 'string' && !value.startsWith('enc:')) {
          try {
            const encrypted = encrypt(value)
            if (encrypted && encrypted.startsWith('enc:')) {
              updatePayload[field] = encrypted
              fieldsEncrypted++
            } else {
              console.error(`  [${row.id}] encrypt() returned non-enc: value for ${field}, skipping field`)
            }
          } catch (err) {
            console.error(`  [${row.id}] ENCRYPT ERROR on ${field}: ${err}`)
            failed++
            continue
          }
        }
      }

      if (fieldsEncrypted === 0) {
        skipped++
        continue
      }

      console.log(`  [${row.id}] encrypting ${fieldsEncrypted} field(s): ${Object.keys(updatePayload).join(', ')}`)

      if (applyMode) {
        try {
          const { error: updateError } = await supabase
            .from('bookings')
            .update(updatePayload)
            .eq('id', row.id)

          if (updateError) {
            console.error(`  [${row.id}] UPDATE FAILED: ${updateError.message}`)
            failed++
            continue
          }
          console.log(`  [${row.id}] -> Updated`)
        } catch (err) {
          console.error(`  [${row.id}] UPDATE EXCEPTION: ${err}`)
          failed++
          continue
        }
      }

      updated++
    }

    console.log(`  Batch ${batchNum} complete: ${batch.length} rows processed`)
    console.log()
  }

  // Summary
  console.log('=== Summary ===')
  console.log(`Mode:    ${applyMode ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Scanned: ${scanned}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped} (already encrypted)`)
  console.log(`Failed:  ${failed}`)

  if (failed > 0) {
    console.error(`\n${failed} row(s) had errors. Review output above.`)
    process.exit(1)
  }
}

main()
