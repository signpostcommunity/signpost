'use client'

/*
 * RequestTracker - color-coded visual status stepper for interpreter bookings.
 * Shows users where their request stands, like package tracking.
 *
 * Steps: Sent > Still looking > Confirmed > Rate
 *
 * Visual language: all circles are outlined (stroke only) with icons inside.
 * Active circles get a thicker outline (2.5px) to draw attention.
 *
 * Color system:
 * - Completed: Cyan (#00e5ff) outline + cyan checkmark inside
 * - Active searching: Yellow (#eab308) outline + yellow dot inside
 * - Active confirmed: Green (#22c55e) outline + green dot inside
 * - Active rate: Purple (#a78bfa) outline + purple star inside
 * - Cancelled: Soft red (rgba(248, 113, 113, 0.7)) outline + soft red X inside
 * - Muted (post-cancel): Muted (#3a3f4b) outline, empty inside
 * - Unreached: Cyan outline at 30% opacity, empty inside
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
  created_at?: string
  cancellation_reason?: string | null
  cancelled_at?: string | null
}

interface RequestTrackerProps {
  booking: TrackerBooking
  recipients: Recipient[]
  compact?: boolean
  hasRating?: boolean
  /** When true, dim prior steps and highlight Rate step with pulsing glow */
  ratingPending?: boolean
}

type CircleState = 'completed' | 'active' | 'unreached' | 'cancelled' | 'muted'
type TerminalState = 'all_declined' | 'cancelled' | null

const COLORS = {
  cyan: '#00e5ff',
  cyanFaint: 'rgba(0, 229, 255, 0.3)',
  searching: '#eab308',
  confirmed: '#22c55e',
  rate: '#a78bfa',
  cancelled: 'rgba(248, 113, 113, 0.7)',
  muted: '#3a3f4b',
  mutedLabel: '#96a0b8',
}

interface Step {
  label: string
  circleState: CircleState
  activeColor?: string
  sublabel?: string | null
}

function getSteps(booking: TrackerBooking, recipients: Recipient[], hasRating: boolean): { steps: Step[]; terminal: TerminalState } {
  const status = booking.status
  const interpCount = booking.interpreter_count || 1
  const confirmedCount = recipients.filter(r => r.status === 'confirmed').length
  const activeRecipients = recipients.filter(r => r.status !== 'withdrawn')
  const respondedOrBetter = recipients.filter(r =>
    ['viewed', 'responded', 'confirmed'].includes(r.status)
  )
  const hasResponses = respondedOrBetter.length > 0

  const respondSublabel = hasResponses
    ? `${respondedOrBetter.length} of ${activeRecipients.length} responded`
    : null
  const confirmSublabel = confirmedCount > 0
    ? (confirmedCount >= interpCount
      ? 'All interpreters confirmed'
      : `${confirmedCount} of ${interpCount} confirmed`)
    : null

  // Terminal: all recipients declined
  const allDeclined = activeRecipients.length > 0 && activeRecipients.every(r => r.status === 'declined')
  if (allDeclined && status === 'open') {
    return {
      steps: [
        { label: 'Sent', circleState: 'completed' },
        { label: 'Still looking', circleState: 'cancelled', sublabel: 'All interpreters declined' },
        { label: 'Confirmed', circleState: 'muted' },
        { label: 'Rate', circleState: 'muted' },
      ],
      terminal: 'all_declined',
    }
  }

  // Cancelled flow
  if (status === 'cancelled') {
    const hadConfirmed = confirmedCount > 0
    return {
      steps: [
        { label: 'Sent', circleState: 'completed' },
        { label: 'Still looking', circleState: hadConfirmed ? 'completed' : 'cancelled', sublabel: hadConfirmed ? null : (booking.cancellation_reason || null) },
        { label: 'Confirmed', circleState: hadConfirmed ? 'cancelled' : 'muted', sublabel: hadConfirmed ? (booking.cancellation_reason || null) : null },
        { label: 'Rate', circleState: 'muted' },
      ],
      terminal: 'cancelled',
    }
  }

  // Normal flow
  const bookingDate = new Date(booking.date + 'T23:59:59')
  const isPast = bookingDate < new Date()
  const isFilled = status === 'filled'
  const isCompleted = status === 'completed' || (isFilled && isPast)

  // Rated: all steps completed
  if (hasRating) {
    return {
      steps: [
        { label: 'Sent', circleState: 'completed' },
        { label: 'Still looking', circleState: 'completed' },
        { label: 'Confirmed', circleState: 'completed' },
        { label: 'Rated', circleState: 'completed' },
      ],
      terminal: null,
    }
  }

  // Completed: Rate step active (purple)
  if (isCompleted) {
    return {
      steps: [
        { label: 'Sent', circleState: 'completed' },
        { label: 'Still looking', circleState: 'completed' },
        { label: 'Confirmed', circleState: 'completed', sublabel: confirmSublabel },
        { label: 'Rate', circleState: 'active', activeColor: COLORS.rate },
      ],
      terminal: null,
    }
  }

  // Filled: Confirmed step active (green)
  if (isFilled) {
    return {
      steps: [
        { label: 'Sent', circleState: 'completed' },
        { label: 'Still looking', circleState: 'completed' },
        { label: 'Confirmed', circleState: 'active', activeColor: COLORS.confirmed, sublabel: confirmSublabel },
        { label: 'Rate', circleState: 'unreached' },
      ],
      terminal: null,
    }
  }

  // Open with responses: Still Looking active (yellow)
  if (hasResponses) {
    return {
      steps: [
        { label: 'Sent', circleState: 'completed' },
        { label: 'Still looking', circleState: 'active', activeColor: COLORS.searching, sublabel: respondSublabel },
        { label: 'Confirmed', circleState: 'unreached' },
        { label: 'Rate', circleState: 'unreached' },
      ],
      terminal: null,
    }
  }

  // Open, no responses yet
  return {
    steps: [
      { label: 'Sent', circleState: 'completed' },
      { label: 'Still looking', circleState: 'unreached' },
      { label: 'Confirmed', circleState: 'unreached' },
      { label: 'Rate', circleState: 'unreached' },
    ],
    terminal: null,
  }
}

/* SVG icons - use currentColor so parent sets the color */

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DotIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="3" fill="currentColor" />
    </svg>
  )
}

function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.5L8.7 5L12.5 5.6L9.75 8.3L10.4 12.1L7 10.3L3.6 12.1L4.25 8.3L1.5 5.6L5.3 5L7 1.5Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function getLineStyle(current: Step, next: Step): React.CSSProperties {
  const base: React.CSSProperties = {
    flex: 1,
    minWidth: 8,
    marginTop: 0,
    borderRadius: 0,
  }

  // Dashed line helper
  const dashed = (color: string): React.CSSProperties => ({
    ...base,
    height: 0,
    borderTop: 'none',
    background: `repeating-linear-gradient(to right, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)`,
    backgroundSize: '100% 1.5px',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    minHeight: 1.5,
  })

  const solid = (bg: string): React.CSSProperties => ({
    ...base,
    height: 1.5,
    background: bg,
  })

  // Completed to completed: solid cyan
  if (current.circleState === 'completed' && next.circleState === 'completed') {
    return solid(COLORS.cyan)
  }

  // Completed to active: gradient
  if (current.circleState === 'completed' && next.circleState === 'active') {
    return solid(`linear-gradient(to right, ${COLORS.cyan}, ${next.activeColor || COLORS.cyan})`)
  }

  // Completed to cancelled: gradient
  if (current.circleState === 'completed' && next.circleState === 'cancelled') {
    return solid(`linear-gradient(to right, ${COLORS.cyan}, ${COLORS.cancelled})`)
  }

  // Any to unreached: dashed muted
  if (next.circleState === 'unreached') {
    return dashed(COLORS.muted)
  }

  // After cancellation or muted: solid muted
  if (current.circleState === 'cancelled' || current.circleState === 'muted' || next.circleState === 'muted') {
    return solid(COLORS.muted)
  }

  // Fallback
  return dashed(COLORS.muted)
}

export default function RequestTracker({ booking, recipients, compact = false, hasRating = false, ratingPending = false }: RequestTrackerProps) {
  const { steps } = getSteps(booking, recipients, hasRating)
  const circleSize = compact ? 22 : 28
  const gap = compact ? 3 : 5

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          width: '100%',
          padding: compact ? '6px 0' : '12px 0',
          minHeight: compact ? 40 : undefined,
        }}
        role="group"
        aria-label="Request status tracker"
      >
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1
          const isRateStep = step.label === 'Rate' || step.label === 'Rated'

          // ratingPending dims prior steps, pulses Rate
          const isDimmed = ratingPending && !hasRating && !isRateStep
          const isPulsing = ratingPending && !hasRating && isRateStep && step.circleState === 'active'

          // Resolve outline color, outline width, and inner icon per state
          let outlineColor: string = COLORS.cyanFaint
          let outlineWidth = 1.5
          let iconElement: React.ReactNode = null
          let iconColor: string = COLORS.cyan

          switch (step.circleState) {
            case 'completed':
              outlineColor = COLORS.cyan
              outlineWidth = 1.5
              iconColor = COLORS.cyan
              iconElement = <CheckIcon size={compact ? 10 : 12} />
              break
            case 'active': {
              const activeCol = step.activeColor || COLORS.cyan
              outlineColor = activeCol
              outlineWidth = 2.5
              iconColor = activeCol
              iconElement = isRateStep
                ? <StarIcon size={compact ? 12 : 14} />
                : <DotIcon size={compact ? 10 : 12} />
              break
            }
            case 'unreached':
              outlineColor = COLORS.cyanFaint
              outlineWidth = 1.5
              iconElement = null
              break
            case 'cancelled':
              outlineColor = COLORS.cancelled
              outlineWidth = 2.5
              iconColor = COLORS.cancelled
              iconElement = <XIcon size={compact ? 10 : 12} />
              break
            case 'muted':
              outlineColor = COLORS.muted
              outlineWidth = 1.5
              iconElement = null
              break
          }

          // Circle style - outlined only, icon rendered inside
          const circleStyle: React.CSSProperties = {
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            background: 'transparent',
            border: `${outlineWidth}px solid ${outlineColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: iconColor,
            transition: 'opacity 0.2s, border-color 0.2s',
            boxSizing: 'border-box',
            ...(isDimmed ? { opacity: 0.35 } : {}),
            ...(isPulsing ? { animation: 'rate-pulse 2s ease-in-out infinite' } : {}),
          }

          // Label color per state
          let labelColor: string
          if (isDimmed) {
            labelColor = '#2e3650'
          } else {
            switch (step.circleState) {
              case 'completed': labelColor = COLORS.cyan; break
              case 'active': labelColor = step.activeColor || COLORS.cyan; break
              case 'unreached': labelColor = COLORS.mutedLabel; break
              case 'cancelled': labelColor = COLORS.cancelled; break
              case 'muted': labelColor = COLORS.mutedLabel; break
              default: labelColor = COLORS.mutedLabel
            }
          }

          // Sublabel: cancelled reasons show soft red; everything else stays muted gray
          const sublabelColor = isDimmed
            ? '#2e3650'
            : step.circleState === 'cancelled' ? COLORS.cancelled : COLORS.mutedLabel

          // Connecting line
          const nextStep = i < steps.length - 1 ? steps[i + 1] : null
          const lineStyleObj = nextStep ? getLineStyle(step, nextStep) : null
          const dimmedLineStyle = isDimmed && lineStyleObj
            ? { ...lineStyleObj, opacity: 0.35 }
            : lineStyleObj

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
                <div style={circleStyle} aria-label={`${step.label}: ${step.circleState}`}>
                  {iconElement}
                </div>

                {/* Label */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: compact ? '0.62rem' : '0.69rem',
                    fontWeight: step.circleState === 'active' ? 700 : 500,
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
                      color: sublabelColor,
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
              {!isLast && dimmedLineStyle && (
                <div style={{
                  ...dimmedLineStyle,
                  marginTop: circleSize / 2,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {ratingPending && !hasRating && (
        <style>{`
          @keyframes rate-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0.4); }
            50% { box-shadow: 0 0 0 5px rgba(167,139,250,0); }
          }
        `}</style>
      )}
    </>
  )
}
