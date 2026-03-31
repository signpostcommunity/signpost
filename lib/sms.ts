// lib/sms.ts
// Shared SMS utility for signpost via Telnyx
// All phone numbers must be E.164 format (+1XXXXXXXXXX)

import { Telnyx } from 'telnyx'

interface SendSmsParams {
  to: string        // E.164 phone number
  message: string   // SMS body (keep under 160 chars for single segment)
}

interface SendSmsResult {
  success: boolean
  messageId?: string
  error?: string
}

let _telnyx: Telnyx | null = null

function getTelnyx(): Telnyx | null {
  if (!process.env.TELNYX_API_KEY) return null
  if (!_telnyx) {
    _telnyx = new Telnyx({ apiKey: process.env.TELNYX_API_KEY })
  }
  return _telnyx
}

export async function sendSms({ to, message }: SendSmsParams): Promise<SendSmsResult> {
  const telnyx = getTelnyx()
  if (!telnyx) {
    console.warn('[sms] TELNYX_API_KEY not set, skipping SMS')
    return { success: false, error: 'SMS not configured' }
  }

  if (!to.startsWith('+')) {
    console.error(`[sms] Invalid phone number format: ${to} (must start with +)`)
    return { success: false, error: 'Invalid phone number format — must be E.164' }
  }

  const from = process.env.TELNYX_PHONE_NUMBER
  if (!from) {
    console.warn('[sms] TELNYX_PHONE_NUMBER not set, skipping SMS')
    return { success: false, error: 'SMS sender number not configured' }
  }

  try {
    const response = await telnyx.messages.send({
      from,
      to,
      text: message,
    })

    const messageId = response?.data?.id ?? undefined
    console.log(`[sms] sent to ${to}, messageId=${messageId}`)
    return { success: true, messageId }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[sms] failed to send to ${to}: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}
