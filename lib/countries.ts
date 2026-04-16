/**
 * Country code/name mapping utilities.
 * Matches the 25 countries supported in LocationInput and PhoneInput.
 */

export const COUNTRY_MAP: Record<string, string> = {
  'AU': 'Australia',
  'BR': 'Brazil',
  'CA': 'Canada',
  'DK': 'Denmark',
  'FI': 'Finland',
  'FR': 'France',
  'DE': 'Germany',
  'GH': 'Ghana',
  'IN': 'India',
  'IE': 'Ireland',
  'IT': 'Italy',
  'JP': 'Japan',
  'KE': 'Kenya',
  'KR': 'South Korea',
  'MX': 'Mexico',
  'NL': 'Netherlands',
  'NZ': 'New Zealand',
  'NG': 'Nigeria',
  'NO': 'Norway',
  'PH': 'Philippines',
  'ZA': 'South Africa',
  'ES': 'Spain',
  'SE': 'Sweden',
  'GB': 'United Kingdom',
  'US': 'United States',
}

export function getCountryName(code: string): string {
  return COUNTRY_MAP[code] || code
}

export function getCountryCode(name: string): string | null {
  const entry = Object.entries(COUNTRY_MAP).find(([, n]) => n === name)
  return entry ? entry[0] : null
}
