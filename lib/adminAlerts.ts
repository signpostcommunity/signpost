import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { emailTemplate } from '@/lib/email-template'
import { sendSms } from '@/lib/sms'
import { normalizePhone } from '@/lib/phone'

export type AdminAlertType =
  | 'new_flag'
  | 'payment_failed'
  | 'dispute_opened'
  | 'new_signup_daily'
  | 'negative_review'
  | 'invite_reward_threshold'

interface AlertPref {
  email?: boolean
  sms?: boolean
}

interface AlertOptions {
  type: AdminAlertType
  emailSubject: string
  emailBody: string
  smsMessage: string
}

/**
 * Send an admin alert to all admins who have opted into this alert type.
 * Non-blocking: errors are logged but never thrown.
 */
export async function sendAdminAlert(options: AlertOptions): Promise<void> {
  try {
    const admin = getSupabaseAdmin()

    const { data: admins, error } = await admin
      .from('user_profiles')
      .select('id, email, admin_alert_preferences, admin_phone')
      .eq('is_admin', true)

    if (error) {
      console.error('[adminAlerts] Failed to query admins:', error.message)
      return
    }

    if (!admins || admins.length === 0) return

    for (const adminUser of admins) {
      const prefs = (adminUser.admin_alert_preferences || {}) as Record<string, AlertPref>
      const alertPref = prefs[options.type] || { email: false, sms: false }

      // Send email if opted in
      if (alertPref.email && adminUser.email) {
        try {
          await sendEmail({
            to: adminUser.email,
            subject: options.emailSubject,
            html: emailTemplate({
              heading: options.emailSubject.replace('[signpost] ', ''),
              body: options.emailBody.split('\n').map(line => `<p>${line}</p>`).join(''),
              preferencesUrl: 'https://signpost.community/admin/dashboard/settings',
            }),
          })
        } catch (e) {
          console.error(`[adminAlerts] Email failed for ${adminUser.email}:`, e)
        }
      }

      // Send SMS if opted in
      if (alertPref.sms && adminUser.admin_phone) {
        const e164 = normalizePhone(adminUser.admin_phone)
        if (e164) {
          sendSms({
            to: e164,
            message: options.smsMessage,
          }).catch(e => console.error('[admin-alert] SMS failed:', e))
        }
      }
    }
  } catch (e) {
    console.error('[adminAlerts] Unexpected error:', e)
  }
}
