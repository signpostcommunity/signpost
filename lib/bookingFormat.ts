/**
 * Centralized booking format display utility.
 * Canonical DB values: 'in_person', 'remote', 'hybrid'.
 */

export function displayBookingFormat(format: string | null | undefined): string {
  switch (format) {
    case 'in_person': return 'In-person'
    case 'remote': return 'Remote'
    case 'hybrid': return 'Hybrid'
    default: return format || ''
  }
}
