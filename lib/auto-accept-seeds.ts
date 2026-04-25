import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications-server'

interface AutoAcceptParams {
  bookingId: string
  interpreterIds: string[]
  /** Requester user ID (receives rate_response notification) */
  requesterUserId: string
  /** Booking metadata for notifications */
  bookingTitle: string
  bookingDate?: string
  bookingTime?: string
  bookingLocation?: string
  bookingFormat?: string
  requesterName?: string
}

/**
 * Auto-accept booking recipients who are seed interpreters.
 *
 * For each seed interpreter among the provided IDs:
 * 1. Looks up their default rate profile (or lowest rate fallback)
 * 2. Updates booking_recipients to status='responded' with rate info
 * 3. Sends a rate_response notification to the requester
 *
 * Mirrors the human accept path (AcceptModal in inquiries/page.tsx).
 * Failures are isolated per recipient and logged; they never block
 * the booking creation request.
 */
export async function autoAcceptSeeds(params: AutoAcceptParams): Promise<void> {
  const admin = getSupabaseAdmin()

  // Batch-fetch interpreter profiles to find seeds
  const { data: profiles, error: profilesErr } = await admin
    .from('interpreter_profiles')
    .select('id, user_id, is_seed, first_name, last_name, name')
    .in('id', params.interpreterIds)

  if (profilesErr || !profiles) {
    console.error('[auto-accept-seeds] interpreter_profiles lookup failed:', profilesErr?.message)
    return
  }

  const seedProfiles = profiles.filter(p => p.is_seed === true)
  if (seedProfiles.length === 0) return

  // Batch-fetch rate profiles for all seed interpreters
  const seedIds = seedProfiles.map(p => p.id)
  const { data: rateProfiles, error: rateErr } = await admin
    .from('interpreter_rate_profiles')
    .select('id, interpreter_id, hourly_rate, is_default')
    .in('interpreter_id', seedIds)

  if (rateErr) {
    console.error('[auto-accept-seeds] interpreter_rate_profiles lookup failed:', rateErr.message)
  }

  // Group rate profiles by interpreter_id
  const ratesByInterpreter: Record<string, typeof rateProfiles> = {}
  for (const rp of rateProfiles || []) {
    if (!ratesByInterpreter[rp.interpreter_id]) {
      ratesByInterpreter[rp.interpreter_id] = []
    }
    ratesByInterpreter[rp.interpreter_id]!.push(rp)
  }

  for (const seed of seedProfiles) {
    try {
      // Pick rate profile: default first, then lowest hourly, then fallback
      const rates = ratesByInterpreter[seed.id] || []
      let selectedRate: number = 95.00
      let selectedProfileId: string | null = null

      const defaultProfile = rates.find(r => r.is_default === true)
      if (defaultProfile) {
        selectedRate = Number(defaultProfile.hourly_rate) || 95.00
        selectedProfileId = defaultProfile.id
      } else if (rates.length > 0) {
        // Pick lowest hourly rate
        const sorted = [...rates].sort((a, b) => (Number(a.hourly_rate) || 0) - (Number(b.hourly_rate) || 0))
        selectedRate = Number(sorted[0].hourly_rate) || 95.00
        selectedProfileId = sorted[0].id
      } else {
        // No profiles at all (defensive)
        console.warn(`[auto-accept-seeds] no rate profiles for seed interpreter ${seed.id}, using fallback $95.00`)
      }

      // Find the booking_recipients row for this seed
      const { data: recipient, error: recipientErr } = await admin
        .from('booking_recipients')
        .select('id')
        .eq('booking_id', params.bookingId)
        .eq('interpreter_id', seed.id)
        .maybeSingle()

      if (recipientErr || !recipient) {
        console.error(`[auto-accept-seeds] booking_recipients lookup failed for seed ${seed.id}:`, recipientErr?.message || 'not found')
        continue
      }

      // Update booking_recipients to responded (mirrors AcceptModal handleSend)
      const now = new Date().toISOString()
      const { error: updateErr } = await admin
        .from('booking_recipients')
        .update({
          status: 'responded',
          responded_at: now,
          response_rate: selectedRate,
          rate_profile_id: selectedProfileId,
          response_notes: null,
        })
        .eq('id', recipient.id)

      if (updateErr) {
        console.error(`[auto-accept-seeds] booking_recipients update failed for seed ${seed.id}:`, updateErr.message)
        continue
      }

      console.log(`[auto-accept-seeds] auto-accepted seed ${seed.first_name || seed.name} (rate: $${selectedRate})`)

      // Send rate_response notification to the requester (mirrors AcceptModal notification)
      const seedName = seed.first_name
        ? `${seed.first_name} ${seed.last_name || ''}`.trim()
        : seed.name || 'Interpreter'

      await createNotification({
        recipientUserId: params.requesterUserId,
        type: 'rate_response',
        subject: `${seedName} responded to your request on signpost`,
        body: `${seedName} sent their rate for ${params.bookingTitle || 'your booking request'}. Review their rate and terms, then accept or decline.`,
        metadata: {
          booking_id: params.bookingId,
          booking_title: params.bookingTitle || '',
          booking_date: params.bookingDate || '',
          booking_time: params.bookingTime || '',
          booking_location: params.bookingLocation || '',
          booking_format: params.bookingFormat || '',
          requester_name: params.requesterName || '',
          interpreter_name: seedName,
          recipient_role: 'requester',
          recipient_id: recipient.id,
          rate: String(selectedRate),
        },
        ctaText: 'Review and Accept',
        ctaUrl: `/request/dashboard/accept/${params.bookingId}/${recipient.id}`,
        channel: 'both',
      })
    } catch (err) {
      console.error(`[auto-accept-seeds] failed for seed ${seed.id}:`, err instanceof Error ? err.message : err)
      // Continue with next seed; never block the request
    }
  }
}

/**
 * Check which interpreter IDs in the list are seeds.
 * Returns a Set of seed interpreter profile IDs.
 */
export async function getSeedInterpreterIds(interpreterIds: string[]): Promise<Set<string>> {
  if (!interpreterIds.length) return new Set()
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('interpreter_profiles')
    .select('id')
    .in('id', interpreterIds)
    .eq('is_seed', true)

  if (error) {
    console.error('[auto-accept-seeds] seed check failed:', error.message)
    return new Set()
  }
  return new Set((data || []).map(p => p.id))
}
