/**
 * Location display utilities for booking cards and detail views.
 * Handles both new structured fields and legacy `location` text field.
 */

/**
 * Format location for minimized cards: "City, ST" or "Remote"
 * Falls back to parsing the legacy `location` text field if structured fields are empty.
 */
export function formatLocationShort(booking: {
  format?: string | null
  location_city?: string | null
  location_state?: string | null
  location_name?: string | null
  location?: string | null
}): string {
  // Remote bookings
  if (booking.format === 'remote') return 'Remote'

  // Structured fields: city + state
  if (booking.location_city && booking.location_state) {
    return `${booking.location_city}, ${booking.location_state}`
  }

  // Structured fields: location name + city
  if (booking.location_name && booking.location_city) {
    return `${booking.location_name}, ${booking.location_city}`
  }

  // Structured fields: city only
  if (booking.location_city) {
    return booking.location_city
  }

  // Fallback to legacy location field
  if (booking.location) {
    // Try to extract a city-like segment (last meaningful chunk before state/zip)
    const parts = booking.location.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length >= 2) {
      // Return last two meaningful parts (likely city, state)
      return parts.slice(-2).join(', ')
    }
    // Truncate to 40 chars
    return booking.location.length > 40
      ? booking.location.slice(0, 40) + '...'
      : booking.location
  }

  return 'TBD'
}

/**
 * Format full address for detail views.
 * Includes location_name, address, city, state, zip, country.
 */
export function formatLocationFull(booking: {
  format?: string | null
  location_name?: string | null
  location_address?: string | null
  location_city?: string | null
  location_state?: string | null
  location_zip?: string | null
  location_country?: string | null
  meeting_link?: string | null
  location?: string | null
}): string {
  // Remote with meeting link
  if (booking.format === 'remote' && booking.meeting_link) {
    return `Remote\n${booking.meeting_link}`
  }

  // Remote without link
  if (booking.format === 'remote') {
    return 'Remote'
  }

  // Build from structured fields
  const hasStructured = booking.location_address || booking.location_city || booking.location_state

  if (hasStructured) {
    const lines: string[] = []

    if (booking.location_name) {
      lines.push(booking.location_name)
    }

    if (booking.location_address) {
      lines.push(booking.location_address)
    }

    const cityStateZip = [
      booking.location_city,
      booking.location_state,
      booking.location_zip,
    ].filter(Boolean).join(', ')

    if (cityStateZip) {
      lines.push(cityStateZip)
    }

    if (booking.location_country && booking.location_country !== 'US') {
      lines.push(booking.location_country)
    }

    return lines.join('\n')
  }

  // Fallback to legacy location field
  return booking.location || 'TBD'
}
