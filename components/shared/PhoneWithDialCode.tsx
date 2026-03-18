'use client'

import { useMemo } from 'react'
import { Country } from 'country-state-city'

/**
 * Resolve a country name (or ISO code) to its dialing code prefix (e.g. "+1", "+44").
 * Returns "+1" as fallback when no country is selected.
 */
export function useDialCode(country: string): string {
  return useMemo(() => {
    if (!country) return '+1'
    const all = Country.getAllCountries()
    const match = all.find(c => c.name === country || c.isoCode === country)
    return match ? `+${match.phonecode}` : '+1'
  }, [country])
}
