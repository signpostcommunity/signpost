import * as React from 'react'
import { Hr, Text } from '@react-email/components'
import { SignpostEmail, COLORS } from './SignpostEmail'
import {
  EmailParagraph,
  EmailFeature,
  EmailButton,
} from './components'

interface InterpreterInviteEmailProps {
  recipientName: string
  senderName: string
  inviteToken: string
}

const sectionLabel: React.CSSProperties = {
  color: COLORS.cyan,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  margin: '0 0 16px',
}

const divider: React.CSSProperties = {
  borderColor: COLORS.border,
  margin: '28px 0',
}

const footerText: React.CSSProperties = {
  color: COLORS.muted,
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}

export function InterpreterInviteEmail({
  recipientName = 'there',
  senderName = 'Someone',
  inviteToken = '',
}: InterpreterInviteEmailProps) {
  const signupUrl = `https://signpost.community/interpreter/signup?invite=${inviteToken}`
  const senderFirstName = senderName.split(' ')[0]

  return (
    <SignpostEmail preview={`${senderName} wants to add you to their preferred interpreter team on signpost`}>
      {/* Personal hook */}
      <EmailParagraph>
        Hey {recipientName},
      </EmailParagraph>

      <EmailParagraph>
        {senderName} wants to add you to their preferred interpreter team on signpost.
      </EmailParagraph>

      {/* Platform description */}
      <EmailParagraph>
        signpost is a new direct-booking platform for sign language interpreters, built by interpreters and Deaf professionals who know the field firsthand. No agency in the middle. No markup on top of your rate.
      </EmailParagraph>

      {/* First CTA */}
      <EmailButton href={signupUrl}>
        Join signpost
      </EmailButton>

      {/* Divider */}
      <Hr style={divider} />

      {/* Section label */}
      <Text style={sectionLabel}>WHAT YOU GET ON SIGNPOST</Text>

      {/* Feature cards */}
      <EmailFeature title="Set your own rates and terms">
        You decide what you charge. Clients pay your rate directly.
      </EmailFeature>

      <EmailFeature title="Connect directly with clients, with no agency fees added on top">
        No middleman between you and the people you work with.
      </EmailFeature>

      <EmailFeature title="Build your professional profile with intro videos and credentials">
        Show your skills, specializations, and certifications in one place.
      </EmailFeature>

      <EmailFeature title="Help grow our field with mentorship matching">
        Whether you are deepening your skills in a new specialty or sharing expertise in one you know well, signpost helps connect interpreters for mentorship by area of practice.
      </EmailFeature>

      {/* Closing + second CTA */}
      <EmailParagraph>
        {senderFirstName} thought you'd be a great fit. Join the community and set up your profile in just a few minutes.
      </EmailParagraph>

      <EmailButton href={signupUrl}>
        Join signpost
      </EmailButton>

      {/* Footer */}
      <Text style={footerText}>signpost.community</Text>
    </SignpostEmail>
  )
}

export default InterpreterInviteEmail
