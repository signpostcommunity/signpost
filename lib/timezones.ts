// Common IANA timezones with friendly labels.
// Used for the interpreter timezone display + selector.

export const TIMEZONE_LABELS: Record<string, string> = {
  'America/New_York': 'Eastern Time (America/New_York)',
  'America/Detroit': 'Eastern Time (America/Detroit)',
  'America/Chicago': 'Central Time (America/Chicago)',
  'America/Denver': 'Mountain Time (America/Denver)',
  'America/Phoenix': 'Mountain Time - no DST (America/Phoenix)',
  'America/Los_Angeles': 'Pacific Time (America/Los_Angeles)',
  'America/Anchorage': 'Alaska Time (America/Anchorage)',
  'Pacific/Honolulu': 'Hawaii Time (Pacific/Honolulu)',
  'America/Toronto': 'Eastern Time (America/Toronto)',
  'America/Vancouver': 'Pacific Time (America/Vancouver)',
  'America/Mexico_City': 'Central Time (America/Mexico_City)',
  'America/Sao_Paulo': 'Brasilia Time (America/Sao_Paulo)',
  'Europe/London': 'United Kingdom (Europe/London)',
  'Europe/Dublin': 'Ireland (Europe/Dublin)',
  'Europe/Paris': 'Central European Time (Europe/Paris)',
  'Europe/Berlin': 'Central European Time (Europe/Berlin)',
  'Europe/Madrid': 'Central European Time (Europe/Madrid)',
  'Europe/Rome': 'Central European Time (Europe/Rome)',
  'Europe/Amsterdam': 'Central European Time (Europe/Amsterdam)',
  'Europe/Stockholm': 'Central European Time (Europe/Stockholm)',
  'Europe/Athens': 'Eastern European Time (Europe/Athens)',
  'Africa/Johannesburg': 'South Africa (Africa/Johannesburg)',
  'Africa/Cairo': 'Egypt (Africa/Cairo)',
  'Asia/Dubai': 'Gulf Time (Asia/Dubai)',
  'Asia/Kolkata': 'India (Asia/Kolkata)',
  'Asia/Shanghai': 'China (Asia/Shanghai)',
  'Asia/Hong_Kong': 'Hong Kong (Asia/Hong_Kong)',
  'Asia/Singapore': 'Singapore (Asia/Singapore)',
  'Asia/Tokyo': 'Japan (Asia/Tokyo)',
  'Asia/Seoul': 'Korea (Asia/Seoul)',
  'Australia/Sydney': 'Sydney (Australia/Sydney)',
  'Australia/Melbourne': 'Melbourne (Australia/Melbourne)',
  'Pacific/Auckland': 'New Zealand (Pacific/Auckland)',
}

export function getTimezoneLabel(tz: string | null | undefined): string {
  if (!tz) return ''
  return TIMEZONE_LABELS[tz] || tz
}
