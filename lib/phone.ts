// lib/phone.ts
// Phone number formatting and validation utilities
// Normalizes phone numbers to E.164 format using libphonenumber-js

import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'

/**
 * Normalize a phone number to E.164 format.
 * Uses defaultCountry as fallback when no country code is provided.
 * Returns null if the number can't be parsed or is invalid.
 *
 * Examples:
 *   normalizePhone('4252833971')            → '+14252833971'
 *   normalizePhone('+44 7911 123456')       → '+447911123456'
 *   normalizePhone('06 12 34 56 78', 'FR')  → '+33612345678'
 *   normalizePhone('+81 90-1234-5678')      → '+819012345678'
 */
export function normalizePhone(phone: string, defaultCountry: string = 'US'): string | null {
  try {
    const countryCode = defaultCountry.toUpperCase() as CountryCode
    const parsed = parsePhoneNumber(phone, countryCode)
    if (parsed && parsed.isValid()) {
      return parsed.format('E.164')
    }
    return null
  } catch {
    return null
  }
}

/**
 * Validate a phone number for a given country.
 */
export function isValidPhone(phone: string, defaultCountry: string = 'US'): boolean {
  try {
    return isValidPhoneNumber(phone, defaultCountry.toUpperCase() as CountryCode)
  } catch {
    return false
  }
}

/**
 * Validate that a phone number is in E.164 format.
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone)
}
