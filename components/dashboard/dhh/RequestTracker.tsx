'use client'

/*
 * RequestTracker — visual status stepper for interpreter bookings.
 * Shows Deaf users where their request stands, like package tracking.
 *
 * Steps: Sent → Still looking → Confirmed → Rate
 * Terminal states: All declined, Cancelled
 *
 * Design: outlined circles with checkmarks/radio dots, connecting lines.
 * Green accent for confirmed step when all interpreters confirmed.
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
  /** When true, grey out prior steps and highlight Rate step with pulsing glow */
  ratingPending?: boolean
}

type StepState = 'completed' | 'current' | 'future'
type TerminalState = 'all_declined' | 'cancelled' | null

interface Step {
  label: string
  state: StepState
  sublabel?: string | null
  isConfirmedAllGreen?: boolean
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

  // Check if all needed interpreters are confirmed (for green accent)
  const allConfirmed = confirmedCount >= interpCount && interpCount > 0

  const allSteps = [
    { label: 'Sent', sublabel: null },
    { label: 'Still looking', sublabel: respondSublabel },
    { label: 'Confirmed', sublabel: confirmSublabel, isConfirmedAllGreen: allConfirmed },
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
function CheckIcon({ size, color = '#fff' }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

function StarIcon({ size, filled = false }: { size: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'rgba(0,229,255,0.15)' : 'none'} stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function RequestTracker({ booking, recipients, compact = false, hasRating = false, ratingPending = false }: RequestTrackerProps) {
  const { steps, terminal } = getSteps(booking, recipients, hasRating)
  const circleSize = 20
  const iconSize = 10
  const gap = compact ? 2 : 4

  const isTerminal = terminal !== null

  // When ratingPending, prior steps get dimmed colors
  const dimBorder = '#2e3650'
  const dimBg = '#0e0e17'
  const dimLine = '#1e2433'
  const dimLabel = '#2e3650'

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          width: '100%',
          padding: compact ? '6px 0' : '12px 0',
          minHeight: compact ? 36 : undefined,
        }}
        role="group"
        aria-label="Request status tracker"
      >
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          const isError = isTerminal && isLast
          const isRateStep = !isTerminal && isLast && step.state === 'current'
          const isGreenCheck = isRateStep && hasRating
          // Confirmed step with all interpreters confirmed uses green
          const useGreen = step.isConfirmedAllGreen && (step.state === 'completed' || step.state === 'current')

          // ratingPending mode: dim all non-rate steps
          const isDimmed = ratingPending && !hasRating && !isLast

          // Determine circle style
          let circleStyle: React.CSSProperties = {
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }

          if (isDimmed) {
            circleStyle = { ...circleStyle, background: dimBg, border: `1.5px solid ${dimBorder}` }
          } else if (isError) {
            circleStyle = { ...circleStyle, background: '#ff6b85' }
          } else if (isGreenCheck) {
            circleStyle = { ...circleStyle, background: 'none', border: '1.5px solid #34d399' }
          } else if (useGreen && step.state === 'completed') {
            circleStyle = { ...circleStyle, background: 'none', border: '1.5px solid #34d399' }
          } else if (useGreen && step.state === 'current') {
            circleStyle = { ...circleStyle, background: 'none', border: '2px solid #34d399' }
          } else if (ratingPending && isLast && !hasRating) {
            // Rate step pulsing glow
            circleStyle = { ...circleStyle, background: 'none', border: '2px solid #00e5ff', animation: 'rate-pulse 2s ease-in-out infinite' }
          } else if (step.state === 'completed') {
            circleStyle = { ...circleStyle, background: 'none', border: '1.5px solid #00e5ff' }
          } else if (step.state === 'current') {
            circleStyle = { ...circleStyle, background: 'none', border: '2px solid #00e5ff' }
          } else {
            circleStyle = { ...circleStyle, background: 'none', border: '1.5px solid #444' }
          }

          // Label color
          let labelColor = '#666'
          if (isDimmed) labelColor = dimLabel
          else if (isError) labelColor = '#ff6b85'
          else if (isGreenCheck) labelColor = '#34d399'
          else if (useGreen) labelColor = '#34d399'
          else if (ratingPending && isLast && !hasRating) labelColor = '#00e5ff'
          else if (step.state === 'current') labelColor = '#fff'
          else if (step.state === 'completed') labelColor = 'var(--muted)'
          else labelColor = '#666'

          // Line color
          const lineColor = isDimmed ? dimLine : (step.state === 'completed' ? '#00e5ff' : '#333')

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
                minWidth: compact ? 44 : 56,
                maxWidth: compact ? 60 : 80,
              }}>
                <div style={circleStyle} aria-label={`${step.label}: ${step.state}`}>
                  {isDimmed ? (
                    <CheckIcon size={iconSize} color={dimBorder} />
                  ) : isError ? (
                    <XIcon size={iconSize} />
                  ) : isGreenCheck ? (
                    <CheckIcon size={iconSize} color="#34d399" />
                  ) : useGreen && step.state === 'completed' ? (
                    <CheckIcon size={iconSize} color="#34d399" />
                  ) : useGreen && step.state === 'current' ? (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  ) : ratingPending && isLast && !hasRating ? (
                    <StarIcon size={iconSize} filled />
                  ) : step.state === 'completed' ? (
                    <CheckIcon size={iconSize} color="#fff" />
                  ) : step.state === 'current' && !isRateStep ? (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff' }} />
                  ) : isRateStep && !hasRating ? (
                    <StarIcon size={iconSize} />
                  ) : null}
                </div>

                {/* Label */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: compact ? '0.62rem' : '0.69rem',
                    fontWeight: (ratingPending && isLast && !hasRating) || step.state === 'current' ? 700 : 500,
                    color: labelColor,
                    lineHeight: 1.3,
                    maxWidth: compact ? 60 : 80,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    display: 'block',
                  }}>
                    {step.label}
                  </span>
                  {step.sublabel && (
                    <span style={{
                      fontSize: compact ? '0.56rem' : '0.58rem',
                      color: isDimmed ? dimLabel : (isError ? '#ff6b85' : '#666'),
                      lineHeight: 1.3,
                      display: 'block',
                      marginTop: 1,
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
                  height: 1,
                  marginTop: circleSize / 2,
                  minWidth: 8,
                  background: lineColor,
                  borderRadius: 0,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {ratingPending && !hasRating && (
        <style>{`
          @keyframes rate-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(0,229,255,0.4); }
            50% { box-shadow: 0 0 0 5px rgba(0,229,255,0); }
          }
        `}</style>
      )}
    </>
  )
}
