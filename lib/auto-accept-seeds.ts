import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications-server'

/* ── Personality system ── */

type SeedPersonality = 'standard_accept' | 'enthusiastic_accept' | 'specialty_accept' | 'frequent_decline' | 'silent'

type SeedBehavior = 'accept' | 'accept_with_note' | 'decline' | 'silent'

/** Behavior bands per personality: [accept, accept_with_note, decline, silent] as cumulative thresholds */
const PERSONALITY_BANDS: Record<SeedPersonality, [number, number, number, number]> = {
  standard_accept:     [0.90, 1.00, 1.00, 1.00],
  enthusiastic_accept: [0.30, 1.00, 1.00, 1.00],
  specialty_accept:    [0.50, 1.00, 1.00, 1.00],
  frequent_decline:    [0.30, 0.30, 1.00, 1.00],
  silent:              [0.00, 0.00, 0.00, 1.00],
}

/** Stable personality assignment per seed (keyed by first_name) */
const SEED_PERSONALITIES: Record<string, SeedPersonality> = {
  'Idris':   'enthusiastic_accept',
  'Betty':   'standard_accept',
  'Brandi':  'standard_accept',
  'Oprah':   'specialty_accept',
  'Dwayne':  'frequent_decline',
  'Dolly':   'standard_accept',
  'Sandra':  'specialty_accept',
  'Keanu':   'silent',
}

/** Roll a behavior from personality bands */
function rollBehavior(personality: SeedPersonality): SeedBehavior {
  const roll = Math.random()
  const [accept, acceptNote, decline] = PERSONALITY_BANDS[personality]
  if (roll < accept) return 'accept'
  if (roll < acceptNote) return 'accept_with_note'
  if (roll < decline) return 'decline'
  return 'silent'
}

/* ── Note pools ── */

const ACCEPT_NOTES = [
  'Happy to work with this client.',
  'This is in my specialty area, looking forward to it.',
  'I have availability and prep time blocked.',
  'Familiar with this type of event, ready to support.',
  'Glad to be considered for this.',
  'Looking forward to working together.',
  'I have experience with similar bookings.',
  'Available and ready, thanks for reaching out.',
  'This fits my schedule well.',
  'I am familiar with this venue type.',
  'Ready to support this booking.',
  'My availability matches and I am interested.',
  'Glad to help with this one.',
  'Confirming I am available, looking forward to it.',
  'Thanks for the request, happy to take this.',
]

const DECLINE_REASONS = [
  'Schedule conflict at that time.',
  'Outside my specialization, recommend someone else.',
  'Need more lead time for this type of booking.',
  'Already booked for that timeframe.',
  'Travel logistics not feasible for this one.',
  'Prior commitment that day.',
  'Not available during the requested window.',
  'Cannot accommodate this request, sorry.',
]

function pickRandom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]
}

/* ── Rate resolution (shared with AcceptModal) ── */

interface RateProfileRow {
  id: string
  interpreter_id: string
  hourly_rate: number | string | null
  is_default: boolean | null
}

/**
 * Resolve which rate profile to use for a given interpreter.
 *
 * Priority: is_default = true profile, else lowest hourly_rate, else fallback.
 * Returns the selected rate and profile ID (null if no profiles exist).
 */
export function resolveRateProfile(
  interpreterId: string,
  ratesByInterpreter: Record<string, RateProfileRow[]>
): { selectedRate: number; selectedProfileId: string | null } {
  const rates = ratesByInterpreter[interpreterId] || []
  let selectedRate: number = 95.00
  let selectedProfileId: string | null = null

  const defaultProfile = rates.find(r => r.is_default === true)
  if (defaultProfile) {
    selectedRate = Number(defaultProfile.hourly_rate) || 95.00
    selectedProfileId = defaultProfile.id
  } else if (rates.length > 0) {
    const sorted = [...rates].sort((a, b) => (Number(a.hourly_rate) || 0) - (Number(b.hourly_rate) || 0))
    selectedRate = Number(sorted[0].hourly_rate) || 95.00
    selectedProfileId = sorted[0].id
  }

  return { selectedRate, selectedProfileId }
}

/* ── Main logic ── */

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
 * Auto-respond for seed interpreters with personality-driven behavior.
 *
 * Each seed has a stable personality that determines the probability
 * of: accept, accept with note, decline, or silent (no response).
 * This creates realistic UX variation for beta testers.
 *
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
  const ratesByInterpreter: Record<string, RateProfileRow[]> = {}
  for (const rp of rateProfiles || []) {
    if (!ratesByInterpreter[rp.interpreter_id]) {
      ratesByInterpreter[rp.interpreter_id] = []
    }
    ratesByInterpreter[rp.interpreter_id]!.push(rp)
  }

  for (const seed of seedProfiles) {
    try {
      const seedName = seed.first_name
        ? `${seed.first_name} ${seed.last_name || ''}`.trim()
        : seed.name || 'Interpreter'

      // Determine personality and roll behavior
      const personality = SEED_PERSONALITIES[seed.first_name || ''] || 'standard_accept'
      const behavior = rollBehavior(personality)

      console.log(`[auto-accept-seeds] seed ${seed.first_name} | personality=${personality} | behavior=${behavior}`)

      // Silent: do nothing, leave status='sent'
      if (behavior === 'silent') {
        continue
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

      const now = new Date().toISOString()

      // Decline path
      if (behavior === 'decline') {
        const declineReason = pickRandom(DECLINE_REASONS)

        const { error: updateErr } = await admin
          .from('booking_recipients')
          .update({
            status: 'declined',
            declined_at: now,
            decline_reason: declineReason,
          })
          .eq('id', recipient.id)

        if (updateErr) {
          console.error(`[auto-accept-seeds] decline update failed for seed ${seed.id}:`, updateErr.message)
          continue
        }

        console.log(`[auto-accept-seeds] seed ${seed.first_name} declined: "${declineReason}"`)

        // Notify requester of decline
        await createNotification({
          recipientUserId: params.requesterUserId,
          type: 'rate_response',
          subject: `${seedName} declined your request on signpost`,
          body: `${seedName} is not available for ${params.bookingTitle || 'your booking request'}. You may want to send to more interpreters.`,
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
          },
          ctaText: 'View Request',
          ctaUrl: `/request/dashboard/requests`,
          channel: 'both',
        })

        continue
      }

      // Accept path (with or without note)
      const { selectedRate, selectedProfileId } = resolveRateProfile(seed.id, ratesByInterpreter)
      if (!ratesByInterpreter[seed.id]?.length) {
        console.warn(`[auto-accept-seeds] no rate profiles for seed interpreter ${seed.id}, using fallback $95.00`)
      }

      const responseNote = behavior === 'accept_with_note' ? pickRandom(ACCEPT_NOTES) : null

      const { error: updateErr } = await admin
        .from('booking_recipients')
        .update({
          status: 'responded',
          responded_at: now,
          response_rate: selectedRate,
          rate_profile_id: selectedProfileId,
          response_notes: responseNote,
        })
        .eq('id', recipient.id)

      if (updateErr) {
        console.error(`[auto-accept-seeds] booking_recipients update failed for seed ${seed.id}:`, updateErr.message)
        continue
      }

      console.log(`[auto-accept-seeds] seed ${seed.first_name} accepted (rate: $${selectedRate}${responseNote ? ', note: "' + responseNote + '"' : ''})`)

      // Send rate_response notification to the requester
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
