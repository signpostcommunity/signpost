'use client'

/*
 * RequestTracker — visual status stepper for interpreter bookings.
 * Shows Deaf users where their request stands, like package tracking.
 *
 * Steps: Request sent → Interpreter responded → Booking confirmed → Completed (rate)
 * Terminal states: Declined, Cancelled
 */

interface TrackerBooking {
  id: string
  status: string
  date: string
  created_at: string
  cancelled_at?: string | null
  interpreter_id?: string | null
}

interface RequestTrackerProps {
  booking: TrackerBooking
  compact?: boolean
  hasRating?: boolean
}

type StepState = 'completed' | 'current' | 'future'
type TerminalState = 'declined' | 'cancelled' | null

interface Step {
  label: string
  state: StepState
  timestamp?: string | null
}

function getSteps(booking: TrackerBooking, hasRating: boolean): { steps: Step[]; terminal: TerminalState } {
  const status = booking.status
  const bookingDate = new Date(booking.date + 'T23:59:59')
  const isPast = bookingDate < new Date()

  // Terminal states
  if (status === 'declined') {
    return {
      steps: [
        { label: 'Request sent', state: 'completed', timestamp: booking.created_at },
        { label: 'Declined', state: 'current' },
      ],
      terminal: 'declined',
    }
  }

  if (status === 'cancelled') {
    return {
      steps: [
        { label: 'Request sent', state: 'completed', timestamp: booking.created_at },
        { label: 'Cancelled', state: 'current', timestamp: booking.cancelled_at },
      ],
      terminal: 'cancelled',
    }
  }

  const allSteps = [
    'Request sent',
    'Interpreter responded',
    'Booking confirmed',
    hasRating ? 'Feedback submitted' : 'Rate your interpreter',
  ]

  let currentIndex: number

  if (status === 'completed' || (status === 'confirmed' && isPast)) {
    currentIndex = 3
  } else if (status === 'confirmed') {
    currentIndex = 2
  } else if (status === 'pending') {
    currentIndex = 0
  } else {
    currentIndex = 0
  }

  const steps: Step[] = allSteps.map((label, i) => {
    let state: StepState
    if (i < currentIndex) state = 'completed'
    else if (i === currentIndex) state = 'current'
    else state = 'future'

    let timestamp: string | null = null
    if (i === 0) timestamp = booking.created_at

    return { label, state, timestamp }
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

export default function RequestTracker({ booking, compact = false, hasRating = false }: RequestTrackerProps) {
  const { steps, terminal } = getSteps(booking, hasRating)
  const circleSize = compact ? 20 : 28
  const iconSize = compact ? 10 : 14
  const fontSize = compact ? '0.65rem' : '0.75rem'
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

              {/* Label */}
              <span style={{
                fontSize,
                color: isError
                  ? '#ff6b85'
                  : step.state === 'future'
                  ? 'var(--muted)'
                  : isGreenCheck
                  ? '#34d399'
                  : 'var(--text)',
                fontWeight: step.state === 'current' ? 600 : 400,
                textAlign: 'center',
                lineHeight: 1.3,
                whiteSpace: compact ? 'nowrap' : 'normal',
                overflow: compact ? 'hidden' : undefined,
                textOverflow: compact ? 'ellipsis' : undefined,
                maxWidth: '100%',
              }}>
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div style={{
                flex: 1,
                height: 2,
                marginTop: circleSize / 2 - 1,
                minWidth: 12,
                background: step.state === 'completed' ? '#00e5ff' : '#1e2433',
                borderRadius: 1,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
