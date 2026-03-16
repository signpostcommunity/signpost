'use client'

/*
 * RequestTracker — visual status stepper for interpreter bookings.
 * Shows Deaf users where their request stands, like package tracking.
 *
 * Steps: Sent → Responding → Confirmed → Rate
 * Terminal states: All declined, Cancelled
 *
 * Updated to work with booking_recipients (multiple interpreters per booking).
 */

interface Recipient {
  id: string
  interpreter_id: string
  status: string
  wave_number?: number
  sent_at?: string | null
  viewed_at?: string | null
  responded_at?: string | null
  confirmed_at?: string | null
  declined_at?: string | null
  withdrawn_at?: string | null
  response_rate?: number | null
  response_notes?: string | null
  decline_reason?: string | null
  interpreter?: {
    name: string
    first_name?: string | null
    last_name?: string | null
    photo_url?: string | null
  } | null
}

interface TrackerBooking {
  id: string
  status: string
  date: string
  interpreter_count?: number | null
  interpreters_confirmed?: number | null
  created_at: string
  cancellation_reason?: string | null
  cancelled_at?: string | null
}

interface RequestTrackerProps {
  booking: TrackerBooking
  recipients: Recipient[]
  compact?: boolean
  hasRating?: boolean
}

type StepState = 'completed' | 'current' | 'future'
type TerminalState = 'all_declined' | 'cancelled' | null

interface Step {
  label: string
  state: StepState
  sublabel?: string | null
}

function getSteps(booking: TrackerBooking, recipients: Recipient[], hasRating: boolean): { steps: Step[]; terminal: TerminalState } {
  const status = booking.status
  const bookingDate = new Date(booking.date + 'T23:59:59')
  const isPast = bookingDate < new Date()
  const interpCount = booking.interpreter_count || 1
  const confirmedCount = recipients.filter(r => r.status === 'confirmed').length

  // Terminal: cancelled
  if (status === 'cancelled') {
    return {
      steps: [
        { label: 'Sent', state: 'completed' },
        { label: 'Cancelled', state: 'current', sublabel: booking.cancellation_reason || null },
      ],
      terminal: 'cancelled',
    }
  }

  // Terminal: all recipients declined, booking still open
  const activeRecipients = recipients.filter(r => r.status !== 'withdrawn')
  const allDeclined = activeRecipients.length > 0 && activeRecipients.every(r => r.status === 'declined')
  if (allDeclined && status === 'open') {
    return {
      steps: [
        { label: 'Sent', state: 'completed' },
        { label: 'All unavailable', state: 'current', sublabel: 'All interpreters declined' },
      ],
      terminal: 'all_declined',
    }
  }

  // Normal flow
  const respondedOrBetter = recipients.filter(r =>
    ['viewed', 'responded', 'confirmed'].includes(r.status)
  )
  const hasResponses = respondedOrBetter.length > 0
  const isFilled = status === 'filled'
  const isCompleted = status === 'completed' || (isFilled && isPast)

  const respondSublabel = hasResponses
    ? `${respondedOrBetter.length} of ${activeRecipients.length} responded`
    : null

  const confirmSublabel = confirmedCount > 0
    ? (confirmedCount >= interpCount
      ? 'All interpreters confirmed'
      : `${confirmedCount} of ${interpCount} confirmed`)
    : null

  let currentIndex: number
  if (isCompleted) {
    currentIndex = 3
  } else if (isFilled) {
    currentIndex = 2
  } else if (hasResponses) {
    currentIndex = 1
  } else {
    currentIndex = 0
  }

  const allSteps = [
    { label: 'Sent', sublabel: null },
    { label: 'Responding', sublabel: respondSublabel },
    { label: 'Confirmed', sublabel: confirmSublabel },
    { label: hasRating ? 'Rated' : 'Rate', sublabel: null },
  ]

  const steps: Step[] = allSteps.map((s, i) => {
    let state: StepState
    if (i < currentIndex) state = 'completed'
    else if (i === currentIndex) state = 'current'
    else state = 'future'
    return { ...s, state }
  })

  return { steps, terminal: null }
}

/* SVG icons */
function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function XIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function GreenCheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function StarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function RequestTracker({ booking, recipients, compact = false, hasRating = false }: RequestTrackerProps) {
  const { steps, terminal } = getSteps(booking, recipients, hasRating)
  const circleSize = compact ? 20 : 28
  const iconSize = compact ? 10 : 14
  const gap = compact ? 0 : 4

  const isTerminal = terminal !== null
  const isCompleted = !isTerminal && steps[steps.length - 1]?.state === 'current'
  const shouldPulse = isCompleted && !hasRating

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        width: '100%',
        padding: compact ? '8px 0' : '16px 0',
        minHeight: compact ? 40 : undefined,
      }}
      role="group"
      aria-label="Request status tracker"
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const isError = isTerminal && isLast
        const isRateStep = !isTerminal && isLast && step.state === 'current'
        const isGreenCheck = isRateStep && hasRating
        const isConfirmedStep = !isTerminal && i === 2 && step.state === 'completed'

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              flex: isLast ? '0 0 auto' : 1,
              minWidth: 0,
            }}
          >
            {/* Step circle + label */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap,
              minWidth: compact ? 48 : 64,
              maxWidth: compact ? 64 : 90,
            }}>
              <div
                style={{
                  width: circleSize,
                  height: circleSize,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  ...(isError
                    ? { background: '#ff6b85' }
                    : isGreenCheck
                    ? { background: 'rgba(52,211,153,0.15)', border: '2px solid #34d399' }
                    : isConfirmedStep
                    ? { background: '#34d399' }
                    : step.state === 'completed'
                    ? { background: '#00e5ff' }
                    : step.state === 'current'
                    ? {
                        background: shouldPulse ? undefined : '#00e5ff',
                        border: shouldPulse ? '2px solid #00e5ff' : undefined,
                        animation: shouldPulse ? 'trackerPulse 2s ease-in-out infinite' : undefined,
                      }
                    : {
                        background: '#16161f',
                        border: '2px solid #1e2433',
                      }),
                }}
                aria-label={`${step.label}: ${step.state}`}
              >
                {isError ? (
                  <XIcon size={iconSize} />
                ) : isGreenCheck ? (
                  <GreenCheckIcon size={iconSize} />
                ) : step.state === 'completed' ? (
                  <CheckIcon size={iconSize} />
                ) : isRateStep && !hasRating ? (
                  <StarIcon size={iconSize} />
                ) : null}
              </div>

              {/* Label — always visible, smaller in compact mode */}
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  fontSize: compact ? '0.62rem' : '0.69rem',
                  color: isError
                    ? '#ff6b85'
                    : step.state === 'future'
                    ? 'var(--muted)'
                    : isGreenCheck
                    ? '#34d399'
                    : 'var(--text)',
                  fontWeight: step.state === 'current' ? 600 : 400,
                  lineHeight: 1.3,
                  maxWidth: compact ? 64 : 88,
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  display: 'block',
                }}>
                  {step.label}
                </span>
                {step.sublabel && !compact && (
                  <span style={{
                    fontSize: '0.62rem',
                    color: isError ? '#ff6b85' : 'var(--muted)',
                    lineHeight: 1.3,
                    display: 'block',
                    marginTop: 2,
                  }}>
                    {step.sublabel}
                  </span>
                )}
              </div>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div style={{
                flex: 1,
                height: 2,
                marginTop: circleSize / 2 - 1,
                minWidth: 12,
                background: '#1e2433',
                borderRadius: 1,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
