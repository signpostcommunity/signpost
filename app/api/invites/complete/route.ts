import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { token, newUserId, newInterpreterProfileId } = await req.json()

  if (!token || !newUserId || !newInterpreterProfileId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Look up the invite
  const { data: invite, error: lookupErr } = await admin
    .from('invite_tracking')
    .select('id, sender_user_id, sender_role, status')
    .eq('invite_token', token)
    .maybeSingle()

  if (lookupErr || !invite) {
    console.error('[invite-complete] Lookup error:', lookupErr)
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  // Update invite status to signed_up
  await admin
    .from('invite_tracking')
    .update({
      status: 'signed_up',
      signed_up_user_id: newUserId,
      signed_up_at: new Date().toISOString(),
    })
    .eq('id', invite.id)

  // Auto-add to sender's list based on sender role
  if (invite.sender_user_id) {
    try {
      if (invite.sender_role === 'interpreter') {
        // Get sender's interpreter_profiles.id
        const { data: senderProfile } = await admin
          .from('interpreter_profiles')
          .select('id, first_name, last_name')
          .eq('user_id', invite.sender_user_id)
          .maybeSingle()

        if (senderProfile) {
          // Get new interpreter's name and email
          const { data: newProfile } = await admin
            .from('interpreter_profiles')
            .select('first_name, last_name, email')
            .eq('id', newInterpreterProfileId)
            .maybeSingle()

          // Check for existing placeholder row (invited by email, member_interpreter_id is NULL)
          const { data: placeholder } = await admin
            .from('interpreter_preferred_team')
            .select('id')
            .eq('interpreter_id', senderProfile.id)
            .is('member_interpreter_id', null)
            .ilike('email', newProfile?.email || '')
            .maybeSingle()

          if (placeholder) {
            // Upgrade placeholder to real member
            const { error: updateErr } = await admin
              .from('interpreter_preferred_team')
              .update({
                member_interpreter_id: newInterpreterProfileId,
                first_name: newProfile?.first_name || '',
                last_name: newProfile?.last_name || '',
                status: 'accepted',
              })
              .eq('id', placeholder.id)

            if (updateErr) {
              console.error('[invite-complete] Placeholder upgrade error:', updateErr)
            } else {
              console.log(`[invite-complete] Upgraded placeholder to ${newInterpreterProfileId} on interpreter ${senderProfile.id}'s preferred team`)
            }
          } else {
            // No placeholder exists -- check for existing real-member row (idempotency)
            const { data: existingMember } = await admin
              .from('interpreter_preferred_team')
              .select('id')
              .eq('interpreter_id', senderProfile.id)
              .eq('member_interpreter_id', newInterpreterProfileId)
              .maybeSingle()

            if (!existingMember) {
              // Insert fresh row
              const { error: teamErr } = await admin
                .from('interpreter_preferred_team')
                .insert({
                  interpreter_id: senderProfile.id,
                  member_interpreter_id: newInterpreterProfileId,
                  first_name: newProfile?.first_name || '',
                  last_name: newProfile?.last_name || '',
                  email: newProfile?.email || '',
                  status: 'accepted',
                })

              if (teamErr) {
                console.error('[invite-complete] Team insert error:', teamErr)
              } else {
                console.log(`[invite-complete] Added ${newInterpreterProfileId} to interpreter ${senderProfile.id}'s preferred team`)
              }
            } else {
              console.log(`[invite-complete] ${newInterpreterProfileId} already on interpreter ${senderProfile.id}'s team, skipping`)
            }
          }
        }
      } else if (invite.sender_role === 'deaf') {
        // Get sender's deaf_profiles record
        const { data: deafProfile } = await admin
          .from('deaf_profiles')
          .select('id, user_id')
          .or(`id.eq.${invite.sender_user_id},user_id.eq.${invite.sender_user_id}`)
          .maybeSingle()

        if (deafProfile) {
          // Add to deaf user's roster as preferred
          const { error: rosterErr } = await admin
            .from('deaf_roster')
            .insert({
              deaf_user_id: deafProfile.user_id || deafProfile.id,
              interpreter_id: newInterpreterProfileId,
              tier: 'preferred',
              approve_work: true,
              approve_personal: true,
              do_not_book: false,
            })

          if (rosterErr) {
            console.error('[invite-complete] Roster insert error:', rosterErr)
          } else {
            console.log(`[invite-complete] Added ${newInterpreterProfileId} to deaf user ${deafProfile.id}'s roster as preferred`)
          }
        }
      }
    } catch (autoAddErr) {
      console.error('[invite-complete] Auto-add error:', autoAddErr)
      // Non-fatal: invite status already updated
    }
  }

  return NextResponse.json({ success: true })
}
