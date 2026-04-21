import { emailTemplate } from '@/lib/email-template'

export function taggedWithSparsePrefListEmail({
  orgName,
  eventTitle,
  date,
  timeStart,
  timeEnd,
  timezone,
  format,
  locationCity,
  locationState,
  prefListUrl,
}: {
  orgName: string
  eventTitle: string
  date: string
  timeStart: string
  timeEnd: string
  timezone?: string
  format: 'in_person' | 'remote' | 'hybrid'
  locationCity?: string | null
  locationState?: string | null
  prefListUrl: string
}) {
  const formatLabel = format === 'in_person' ? 'In-person'
    : format === 'remote' ? 'Remote' : 'Hybrid'

  const locationLine = format === 'in_person' && locationCity
    ? `${locationCity}${locationState ? `, ${locationState}` : ''}`
    : 'Remote'

  const tzLabel = timezone || ''
  const timeLine = `${date}, ${timeStart}\u2013${timeEnd}${tzLabel ? ` (${tzLabel})` : ''}`

  const body = `
    <p>${orgName} tagged you in an interpreter request:</p>
    <ul style="padding-left: 20px; margin: 16px 0; line-height: 1.8;">
      <li><strong style="color:#f0f2f8;">Event:</strong> ${eventTitle}</li>
      <li><strong style="color:#f0f2f8;">Date:</strong> ${timeLine}</li>
      <li><strong style="color:#f0f2f8;">Format:</strong> ${formatLabel}</li>
      <li><strong style="color:#f0f2f8;">Location:</strong> ${locationLine}</li>
    </ul>
    <p>Right now, your list of preferred interpreters is small. So they're also choosing from our wider pool of interpreters so there's no delay to your request.</p>
  `

  return {
    subject: `${orgName} is requesting an interpreter for you`,
    html: emailTemplate({
      heading: `${orgName} is requesting an interpreter for you`,
      body,
      ctaText: 'Add interpreters to your preferred list',
      ctaUrl: prefListUrl,
      preferencesUrl: 'https://signpost.community/dhh/dashboard/preferences',
    }),
  }
}
