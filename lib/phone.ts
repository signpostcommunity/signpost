// lib/phone.ts
// Phone number formatting and validation utilities
// Normalizes US phone numbers to E.164 format (+1XXXXXXXXXX)

/**
 * Normalize a phone number to E.164 format.
 * Accepts: (206) 555-1234, 206-555-1234, 2065551234, +12065551234
 * Returns: +12065551234 or null if invalid
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (input.startsWith('+') && digits.length >= 10) return `+${digits}`
  return null
}

/**
 * Validate that a phone number is in E.164 format.
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone)
}
