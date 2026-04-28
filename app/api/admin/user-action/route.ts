import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { userId, action, role } = body

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  switch (action) {
    case 'suspend': {
      // Suspend interpreter profile if exists
      const { data: ip } = await admin.from('interpreter_profiles').select('id').eq('user_id', userId).maybeSingle()
      if (ip) {
        await admin.from('interpreter_profiles').update({ status: 'suspended' }).eq('id', ip.id)
      }
      // Suspend deaf profile if exists (use a status field approach via user_profiles)
      // Suspend requester profile similarly
      // Mark at user_profiles level for universal suspension check
      await admin.from('user_profiles').update({ suspended: true }).eq('id', userId)
      logAudit({
        user_id: user.id,
        action: 'admin_action',
        resource_type: 'user',
        resource_id: userId,
        metadata: { action_type: 'suspend' },
      })
      return NextResponse.json({ success: true })
    }

    case 'unsuspend': {
      const { data: ip } = await admin.from('interpreter_profiles').select('id, email').eq('user_id', userId).maybeSingle()
      if (ip) {
        await admin.from('interpreter_profiles').update({ status: 'approved' }).eq('id', ip.id)
      }
      await admin.from('user_profiles').update({ suspended: false }).eq('id', userId)

      // Auto-add: fulfill pending invites for this newly-approved interpreter
      if (ip?.email) {
        try {
          const { data: pendingInvites } = await admin
            .from('invite_tracking')
            .select('id, sender_user_id, target_list_role')
            .eq('recipient_email', ip.email.toLowerCase())
            .eq('status', 'sent')

          for (const invite of pendingInvites || []) {
            try {
              const role = invite.target_list_role || 'interpreter_team'

              if (role === 'interpreter_team') {
                // Look up sender's interpreter_profiles row
                const { data: senderIp } = await admin
                  .from('interpreter_profiles')
                  .select('id')
                  .eq('user_id', invite.sender_user_id)
                  .maybeSingle()
                if (senderIp) {
                  // Check for existing placeholder row (invited by email)
                  const { data: placeholder } = await admin
                    .from('interpreter_preferred_team')
                    .select('id')
                    .eq('interpreter_id', senderIp.id)
                    .is('member_interpreter_id', null)
                    .ilike('email', ip.email || '')
                    .maybeSingle()

                  if (placeholder) {
                    // Upgrade placeholder to real member
                    await admin.from('interpreter_preferred_team').update({
                      member_interpreter_id: ip.id,
                      first_name: '',
                      last_name: '',
                      status: 'accepted',
                    }).eq('id', placeholder.id)
                  } else {
                    // Check for existing real-member row (idempotency)
                    const { data: existingMember } = await admin
                      .from('interpreter_preferred_team')
                      .select('id')
                      .eq('interpreter_id', senderIp.id)
                      .eq('member_interpreter_id', ip.id)
                      .maybeSingle()

                    if (!existingMember) {
                      await admin.from('interpreter_preferred_team').insert({
                        interpreter_id: senderIp.id,
                        member_interpreter_id: ip.id,
                        first_name: '',
                        last_name: '',
                        email: ip.email,
                        tier: 'preferred',
                        status: 'accepted',
                      })
                    }
                  }
                }
              } else if (role === 'dhh_pref_list') {
                await admin.from('deaf_roster').insert({
                  deaf_user_id: invite.sender_user_id,
                  interpreter_id: ip.id,
                  tier: 'preferred',
                  do_not_book: false,
                })
              } else if (role === 'requester_pref_list') {
                await admin.from('requester_roster').insert({
                  requester_user_id: invite.sender_user_id,
                  interpreter_id: ip.id,
                  tier: 'preferred',
                })
              }

              // Mark invite as fulfilled
              await admin.from('invite_tracking').update({
                status: 'accepted',
                signed_up_user_id: userId,
                signed_up_at: new Date().toISOString(),
              }).eq('id', invite.id)
            } catch (inviteErr) {
              console.error(`[unsuspend] Auto-add failed for invite ${invite.id}:`, inviteErr)
              logAudit({
                user_id: user.id,
                action: 'admin_action',
                resource_type: 'invite_tracking',
                resource_id: invite.id,
                metadata: { action_type: 'auto_add_failed', error: inviteErr instanceof Error ? inviteErr.message : 'Unknown' },
              })
            }
          }
        } catch (err) {
          console.error('[unsuspend] Invite fulfillment block failed:', err)
          // Do not block the unsuspend
        }
      }

      logAudit({
        user_id: user.id,
        action: 'admin_action',
        resource_type: 'user',
        resource_id: userId,
        metadata: { action_type: 'unsuspend' },
      })
      return NextResponse.json({ success: true })
    }

    case 'toggle_admin': {
      if (userId === user.id) {
        return NextResponse.json({ error: 'Cannot change your own admin status' }, { status: 400 })
      }
      const { data: target } = await admin.from('user_profiles').select('is_admin').eq('id', userId).single()
      if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const { error: updateErr } = await admin
        .from('user_profiles')
        .update({ is_admin: !target.is_admin })
        .eq('id', userId)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }
      logAudit({
        user_id: user.id,
        action: 'admin_action',
        resource_type: 'user',
        resource_id: userId,
        metadata: { action_type: 'toggle_admin', new_value: !target.is_admin },
      })
      return NextResponse.json({ success: true, isAdmin: !target.is_admin })
    }

    case 'add_role': {
      if (!role || !['interpreter', 'deaf', 'requester'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      // Get existing user data to populate the new profile
      const { data: userProfile } = await admin.from('user_profiles').select('*').eq('id', userId).single()
      if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      // Get name from any existing profile
      let firstName = '', lastName = '', email = userProfile.email || '', city = '', state = '', country = ''
      const { data: ip } = await admin.from('interpreter_profiles').select('first_name, last_name, email, city, state, country').eq('user_id', userId).maybeSingle()
      const { data: dp } = await admin.from('deaf_profiles').select('first_name, last_name, email, city, state, country').or(`id.eq.${userId},user_id.eq.${userId}`).maybeSingle()
      const { data: rp } = await admin.from('requester_profiles').select('name, city, country').eq('id', userId).maybeSingle()

      // Use whichever profile has data
      if (ip) {
        firstName = firstName || ip.first_name || ''
        lastName = lastName || ip.last_name || ''
        email = email || ip.email || ''
        city = city || ip.city || ''
        state = state || ip.state || ''
        country = country || ip.country || ''
      }
      if (dp) {
        firstName = firstName || dp.first_name || ''
        lastName = lastName || dp.last_name || ''
        email = email || dp.email || ''
        city = city || dp.city || ''
        state = state || dp.state || ''
        country = country || dp.country || ''
      }
      if (rp) {
        if (!firstName && rp.name) {
          const parts = rp.name.split(' ')
          firstName = parts[0] || ''
          lastName = parts.slice(1).join(' ') || ''
        }
        city = city || rp.city || ''
        country = country || rp.country || ''
      }

      const name = `${firstName} ${lastName}`.trim() || userProfile.email?.split('@')[0] || 'User'

      if (role === 'interpreter') {
        const { error } = await admin.from('interpreter_profiles').insert({
          id: crypto.randomUUID(),
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          name,
          email,
          city,
          state,
          country,
          status: 'pending',
        })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      } else if (role === 'deaf') {
        const { error } = await admin.from('deaf_profiles').insert({
          id: userId,
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          name,
          email,
          city,
          state,
          country,
        })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      } else if (role === 'requester') {
        const { error } = await admin.from('requester_profiles').insert({
          id: userId,
          name,
          city,
          country,
        })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Add to pending_roles so role switcher discovers it
      const currentPending = userProfile.pending_roles || []
      if (!currentPending.includes(role)) {
        await admin.from('user_profiles').update({
          pending_roles: [...currentPending, role],
        }).eq('id', userId)
      }

      logAudit({
        user_id: user.id,
        action: 'admin_action',
        resource_type: 'user',
        resource_id: userId,
        metadata: { action_type: 'add_role', role },
      })

      return NextResponse.json({ success: true })
    }

    case 'remove_role': {
      if (!role || !['interpreter', 'deaf', 'requester'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      if (role === 'interpreter') {
        const { data: ip } = await admin.from('interpreter_profiles').select('id').eq('user_id', userId).maybeSingle()
        if (ip) {
          // Clean up interpreter-related data
          await admin.from('booking_recipients').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_rate_profiles').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_availability').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_sign_languages').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_spoken_languages').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_specializations').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_regions').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_certifications').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_education').delete().eq('interpreter_id', ip.id)
          await admin.from('profile_flags').delete().eq('interpreter_profile_id', ip.id)
          await admin.from('reviews').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_profiles').delete().eq('id', ip.id)
        }
      } else if (role === 'deaf') {
        await admin.from('deaf_roster').delete().or(`deaf_user_id.eq.${userId}`)
        await admin.from('booking_dhh_clients').delete().eq('dhh_user_id', userId)
        await admin.from('deaf_profiles').delete().or(`id.eq.${userId},user_id.eq.${userId}`)
      } else if (role === 'requester') {
        // Delete requester bookings (only drafts/open)
        const { data: reqBookings } = await admin.from('bookings').select('id, status').eq('requester_id', userId)
        const draftIds = (reqBookings || []).filter(b => ['draft', 'open'].includes(b.status)).map(b => b.id)
        if (draftIds.length > 0) {
          await admin.from('booking_recipients').delete().in('booking_id', draftIds)
          await admin.from('booking_dhh_clients').delete().in('booking_id', draftIds)
          await admin.from('bookings').delete().in('id', draftIds)
        }
        await admin.from('requester_profiles').delete().eq('id', userId)
      }

      // Remove from pending_roles
      const { data: userProfile } = await admin.from('user_profiles').select('pending_roles, role').eq('id', userId).single()
      if (userProfile) {
        const updatedPending = (userProfile.pending_roles || []).filter((r: string) => r !== role)
        const updates: Record<string, unknown> = { pending_roles: updatedPending }
        // If removing the primary role, switch to another available role
        if (userProfile.role === role) {
          const { data: ip } = await admin.from('interpreter_profiles').select('id').eq('user_id', userId).maybeSingle()
          const { data: dp } = await admin.from('deaf_profiles').select('id').or(`id.eq.${userId},user_id.eq.${userId}`).maybeSingle()
          const { data: rp } = await admin.from('requester_profiles').select('id').eq('id', userId).maybeSingle()
          if (ip) updates.role = 'interpreter'
          else if (dp) updates.role = 'deaf'
          else if (rp) updates.role = 'requester'
        }
        await admin.from('user_profiles').update(updates).eq('id', userId)
      }

      logAudit({
        user_id: user.id,
        action: 'admin_action',
        resource_type: 'user',
        resource_id: userId,
        metadata: { action_type: 'remove_role', role },
      })

      return NextResponse.json({ success: true })
    }

    case 'delete': {
      if (userId === user.id) {
        return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
      }

      try {
        // Step 1: interpreter_preferred_team
        const { data: ip } = await admin.from('interpreter_profiles').select('id').eq('user_id', userId).maybeSingle()
        if (ip) {
          await admin.from('interpreter_preferred_team').delete().or(`owner_user_id.eq.${userId},member_interpreter_id.eq.${ip.id}`)
        }

        // Step 2: deaf_roster
        await admin.from('deaf_roster').delete().or(`deaf_user_id.eq.${userId}`)

        // Step 3: requester_roster
        await admin.from('requester_roster').delete().eq('requester_user_id', userId)

        // Step 4-5: bookings (only draft/open)
        const { data: reqBookings } = await admin.from('bookings').select('id, status').eq('requester_id', userId)
        const allBookingIds = (reqBookings || []).map(b => b.id)
        const deletableBookingIds = (reqBookings || []).filter(b => !['confirmed', 'completed'].includes(b.status)).map(b => b.id)

        if (allBookingIds.length > 0) {
          // Delete booking_recipients for all bookings owned by user
          await admin.from('booking_recipients').delete().in('booking_id', allBookingIds)
          await admin.from('booking_dhh_clients').delete().in('booking_id', allBookingIds)
        }
        if (deletableBookingIds.length > 0) {
          await admin.from('bookings').delete().in('id', deletableBookingIds)
        }

        // Step 6: interpreter data
        if (ip) {
          await admin.from('booking_recipients').delete().eq('interpreter_id', ip.id)
          await admin.from('reviews').delete().eq('interpreter_id', ip.id)
          await admin.from('messages').delete().eq('sender_id', userId)
          await admin.from('interpreter_rate_profiles').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_availability').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_sign_languages').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_spoken_languages').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_specializations').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_regions').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_certifications').delete().eq('interpreter_id', ip.id)
          await admin.from('interpreter_education').delete().eq('interpreter_id', ip.id)
          await admin.from('profile_flags').delete().eq('interpreter_profile_id', ip.id)
          await admin.from('interpreter_profiles').delete().eq('id', ip.id)
        }

        // Step 7: deaf data
        await admin.from('booking_dhh_clients').delete().eq('dhh_user_id', userId)
        await admin.from('deaf_profiles').delete().or(`id.eq.${userId},user_id.eq.${userId}`)

        // Step 8: requester data
        await admin.from('requester_profiles').delete().eq('id', userId)

        // Step 9: user_profiles + cross-cutting data
        await admin.from('beta_feedback').delete().eq('user_id', userId)
        await admin.from('profile_flags').delete().eq('flagged_by', userId)
        await admin.from('reviews').delete().eq('reviewer_id', userId)
        await admin.from('messages').delete().eq('sender_id', userId)
        await admin.from('dhh_requester_connections').delete().or(`dhh_user_id.eq.${userId},requester_id.eq.${userId}`)
        await admin.from('notifications').delete().eq('user_id', userId)
        await admin.from('user_profiles').delete().eq('id', userId)

        // Step 10: auth.users
        const { error: authError } = await admin.auth.admin.deleteUser(userId)
        if (authError) {
          console.error(`Auth deletion failed for ${userId}: ${authError.message}`)
          return NextResponse.json({ error: `Auth deletion failed: ${authError.message}` }, { status: 500 })
        }

        console.error(`[ADMIN] User ${userId} deleted by admin ${user.id}`)
        logAudit({
          user_id: user.id,
          action: 'admin_action',
          resource_type: 'user',
          resource_id: userId,
          metadata: { action_type: 'delete' },
        })
        return NextResponse.json({ success: true })
      } catch (err) {
        console.error(`[ADMIN] Delete cascade failed for ${userId}:`, err)
        return NextResponse.json({ error: `Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}` }, { status: 500 })
      }
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}
