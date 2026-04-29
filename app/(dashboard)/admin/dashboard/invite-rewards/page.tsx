import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import InviteRewardsClient from './InviteRewardsClient'

export const dynamic = 'force-dynamic'

export default async function InviteRewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = getSupabaseAdmin()

  const { data: rewards, error } = await admin
    .from('invite_rewards')
    .select('*')
    .order('threshold_met_at', { ascending: false })

  if (error) {
    console.error('[invite-rewards] Failed to fetch rewards:', error.message)
  }

  // Enrich with sender names from invite_tracking
  const enriched = await Promise.all(
    (rewards || []).map(async (r) => {
      const { data: tracking } = await admin
        .from('invite_tracking')
        .select('sender_name, sender_email')
        .eq('sender_user_id', r.sender_user_id)
        .limit(1)

      const sender = tracking?.[0]

      // Get who marked it sent
      let sentByName: string | null = null
      if (r.gift_card_sent_by) {
        const { data: sentByProfile } = await admin
          .from('user_profiles')
          .select('email')
          .eq('id', r.gift_card_sent_by)
          .single()
        sentByName = sentByProfile?.email?.split('@')[0] || null
      }

      return {
        id: r.id,
        senderUserId: r.sender_user_id,
        senderName: sender?.sender_name || 'Unknown',
        senderEmail: sender?.sender_email || null,
        thresholdMetAt: r.threshold_met_at,
        distinctInviteCount: r.distinct_invite_count,
        giftCardProvider: r.gift_card_provider,
        giftCardAmount: r.gift_card_amount,
        giftCardCurrency: r.gift_card_currency,
        giftCardSentAt: r.gift_card_sent_at,
        sentByName,
        notes: r.notes,
      }
    })
  )

  return <InviteRewardsClient rewards={enriched} />
}
