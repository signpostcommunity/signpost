import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendAdminAlert } from '@/lib/adminAlerts'

// ── Threshold constants ──

export const QUALITY_THRESHOLDS = {
  // "Would not book again" responses
  would_not_book_yellow: 1,   // 1 "no" = yellow (logged, no notification)
  would_not_book_orange: 2,   // 2 "no" = orange (email notification)
  would_not_book_red: 3,      // 3+ "no" = red (email + SMS)

  // Star ratings
  low_rating_orange: 1,       // Any single 1-star on either dimension = orange
  low_rating_red_avg: 3.0,    // Average below 3.0 with 3+ ratings = red
  low_rating_min_count: 3,    // Minimum ratings needed for average threshold

  // Do Not Book list appearances
  dnb_orange: 2,              // 2+ separate Deaf users' DNB lists = orange
  dnb_red: 4,                 // 4+ DNB lists = red

  // Interpreter-initiated cancellations within 60 days
  cancel_window_days: 60,
  cancel_orange: 2,           // 2+ cancellations = orange
  cancel_red: 3,              // 3+ cancellations = red
}

// ── Types ──

interface QualitySignal {
  signal_type: 'would_not_book' | 'low_rating' | 'dnb_frequency' | 'cancellation_pattern' | 'flags'
  alert_level: 'yellow' | 'orange' | 'red'
  signal_details: Record<string, unknown>
}

// ── Check all quality signals for an interpreter ──

export async function checkInterpreterQuality(interpreterId: string): Promise<QualitySignal[]> {
  const admin = getSupabaseAdmin()
  const signals: QualitySignal[] = []

  // 1. Check "would not book again" responses
  const { data: ratings } = await admin
    .from('interpreter_ratings')
    .select('would_book_again, rating_met_needs, rating_professional')
    .eq('interpreter_id', interpreterId)

  if (ratings) {
    const wouldNotBook = ratings.filter(r => r.would_book_again === 'no').length

    if (wouldNotBook >= QUALITY_THRESHOLDS.would_not_book_red) {
      signals.push({
        signal_type: 'would_not_book',
        alert_level: 'red',
        signal_details: { count: wouldNotBook, total_ratings: ratings.length },
      })
    } else if (wouldNotBook >= QUALITY_THRESHOLDS.would_not_book_orange) {
      signals.push({
        signal_type: 'would_not_book',
        alert_level: 'orange',
        signal_details: { count: wouldNotBook, total_ratings: ratings.length },
      })
    } else if (wouldNotBook >= QUALITY_THRESHOLDS.would_not_book_yellow) {
      signals.push({
        signal_type: 'would_not_book',
        alert_level: 'yellow',
        signal_details: { count: wouldNotBook, total_ratings: ratings.length },
      })
    }

    // 2. Check star ratings
    if (ratings.length > 0) {
      const hasOneStar = ratings.some(
        r => r.rating_met_needs === 1 || r.rating_professional === 1
      )
      if (hasOneStar) {
        signals.push({
          signal_type: 'low_rating',
          alert_level: 'orange',
          signal_details: { reason: 'single_1_star', total_ratings: ratings.length },
        })
      }

      if (ratings.length >= QUALITY_THRESHOLDS.low_rating_min_count) {
        const avgMet = ratings.reduce((s, r) => s + (r.rating_met_needs || 0), 0) / ratings.length
        const avgPro = ratings.reduce((s, r) => s + (r.rating_professional || 0), 0) / ratings.length

        if (avgMet < QUALITY_THRESHOLDS.low_rating_red_avg || avgPro < QUALITY_THRESHOLDS.low_rating_red_avg) {
          signals.push({
            signal_type: 'low_rating',
            alert_level: 'red',
            signal_details: {
              avg_met_needs: Math.round(avgMet * 10) / 10,
              avg_professional: Math.round(avgPro * 10) / 10,
              total_ratings: ratings.length,
            },
          })
        }
      }
    }
  }

  // 3. Check DNB frequency
  const { count: dnbCount } = await admin
    .from('deaf_roster')
    .select('id', { count: 'exact', head: true })
    .eq('interpreter_id', interpreterId)
    .eq('tier', 'dnb')

  if (dnbCount !== null) {
    if (dnbCount >= QUALITY_THRESHOLDS.dnb_red) {
      signals.push({
        signal_type: 'dnb_frequency',
        alert_level: 'red',
        signal_details: { dnb_count: dnbCount },
      })
    } else if (dnbCount >= QUALITY_THRESHOLDS.dnb_orange) {
      signals.push({
        signal_type: 'dnb_frequency',
        alert_level: 'orange',
        signal_details: { dnb_count: dnbCount },
      })
    }
  }

  // 4. Check interpreter-initiated cancellations (60 days)
  const { data: interpProfile } = await admin
    .from('interpreter_profiles')
    .select('user_id')
    .eq('id', interpreterId)
    .maybeSingle()

  if (interpProfile) {
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - QUALITY_THRESHOLDS.cancel_window_days)

    const { count: cancelCount } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('cancelled_by', interpProfile.user_id)
      .gte('cancelled_at', sixtyDaysAgo.toISOString())

    if (cancelCount !== null) {
      if (cancelCount >= QUALITY_THRESHOLDS.cancel_red) {
        signals.push({
          signal_type: 'cancellation_pattern',
          alert_level: 'red',
          signal_details: { count: cancelCount, window_days: QUALITY_THRESHOLDS.cancel_window_days },
        })
      } else if (cancelCount >= QUALITY_THRESHOLDS.cancel_orange) {
        signals.push({
          signal_type: 'cancellation_pattern',
          alert_level: 'orange',
          signal_details: { count: cancelCount, window_days: QUALITY_THRESHOLDS.cancel_window_days },
        })
      }
    }
  }

  return signals
}

// ── Severity ranking ──

function severityRank(level: string): number {
  return { yellow: 1, orange: 2, red: 3 }[level] || 0
}

// ── Human-readable signal descriptions ──

function describeSignal(signal: QualitySignal): string {
  const d = signal.signal_details
  switch (signal.signal_type) {
    case 'would_not_book':
      return `${d.count} "would not book again" response${(d.count as number) !== 1 ? 's' : ''} out of ${d.total_ratings} rating${(d.total_ratings as number) !== 1 ? 's' : ''}`
    case 'low_rating':
      if (d.reason === 'single_1_star') return '1-star rating received on a booking'
      return `Average rating below 3.0 (met needs: ${d.avg_met_needs}, professional: ${d.avg_professional}) across ${d.total_ratings} ratings`
    case 'dnb_frequency':
      return `Appears on ${d.dnb_count} Do Not Book list${(d.dnb_count as number) !== 1 ? 's' : ''}`
    case 'cancellation_pattern':
      return `${d.count} interpreter-initiated cancellation${(d.count as number) !== 1 ? 's' : ''} in the last ${d.window_days} days`
    case 'flags':
      return `${d.count} profile flag${(d.count as number) !== 1 ? 's' : ''}`
    default:
      return 'Quality concern detected'
  }
}

// ── Process and store alerts ──

export async function processQualityAlerts(interpreterId: string, interpreterName: string): Promise<void> {
  try {
    const admin = getSupabaseAdmin()
    const signals = await checkInterpreterQuality(interpreterId)

    for (const signal of signals) {
      // Check if there's already an active alert for this interpreter + signal type
      const { data: existing } = await admin
        .from('admin_quality_alerts')
        .select('id, alert_level')
        .eq('interpreter_id', interpreterId)
        .eq('signal_type', signal.signal_type)
        .eq('status', 'active')
        .maybeSingle()

      if (existing) {
        // Update if severity increased
        if (severityRank(signal.alert_level) > severityRank(existing.alert_level)) {
          await admin
            .from('admin_quality_alerts')
            .update({
              alert_level: signal.alert_level,
              signal_details: signal.signal_details,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

          // Notify on escalation to orange or red
          if (signal.alert_level === 'orange' || signal.alert_level === 'red') {
            const description = describeSignal(signal)
            sendAdminAlert({
              type: 'negative_review',
              emailSubject: `[signpost] Quality concern: ${interpreterName}`,
              emailBody: `${description}\n\nAlert level escalated to ${signal.alert_level.toUpperCase()}.\n\nReview at signpost.community/admin/dashboard`,
              smsMessage: `[signpost] Quality alert (${signal.alert_level}): ${interpreterName}. ${description}`,
            }).catch(e => console.error('[qualityAlerts] notification failed:', e))
          }
        }
      } else {
        // Create new alert
        await admin.from('admin_quality_alerts').insert({
          interpreter_id: interpreterId,
          interpreter_name: interpreterName,
          alert_level: signal.alert_level,
          signal_type: signal.signal_type,
          signal_details: signal.signal_details,
        })

        // Send notifications for orange and red alerts
        if (signal.alert_level === 'orange' || signal.alert_level === 'red') {
          const description = describeSignal(signal)
          sendAdminAlert({
            type: 'negative_review',
            emailSubject: `[signpost] Quality concern: ${interpreterName}`,
            emailBody: `${description}\n\nAlert level: ${signal.alert_level.toUpperCase()}.\n\nReview at signpost.community/admin/dashboard`,
            smsMessage: `[signpost] Quality alert (${signal.alert_level}): ${interpreterName}. ${description}`,
          }).catch(e => console.error('[qualityAlerts] notification failed:', e))
        }
      }
    }
  } catch (e) {
    console.error('[qualityAlerts] processQualityAlerts failed:', e)
  }
}
