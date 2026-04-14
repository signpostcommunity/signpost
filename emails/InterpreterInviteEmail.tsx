import * as React from 'react'
import { Hr, Text } from '@react-email/components'
import { SignpostEmail, COLORS } from './SignpostEmail'
import {
  EmailParagraph,
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

const cardWrap = (borderColor: string): React.CSSProperties => ({
  borderLeft: `3px solid ${borderColor}`,
  paddingLeft: '16px',
  borderRadius: 0,
  marginBottom: '16px',
})

const cardTitle = (color: string): React.CSSProperties => ({
  color,
  fontSize: '15px',
  fontWeight: 700,
  margin: '0 0 6px',
})

const cardDesc: React.CSSProperties = {
  color: COLORS.muted,
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
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
      <Text style={sectionLabel}>HOW SIGNPOST IS DIFFERENT</Text>

      {/* Feature cards */}
      <div style={cardWrap(COLORS.cyan)}>
        <Text style={cardTitle(COLORS.cyan)}>
          Set your own rates and connect directly with clients
        </Text>
        <Text style={cardDesc}>
          You decide what you charge and clients pay your rate directly. No agency in the middle, no fees added on top.
        </Text>
      </div>

      <div style={cardWrap('#a78bfa')}>
        <Text style={cardTitle('#f0f2f8')}>
          A Deaf-centered approach to interpreter booking
        </Text>
        <Text style={cardDesc}>
          signpost's tools prioritize finding the right fit for each Deaf person, whether through their preferred interpreter list or by browsing profiles and intro videos in the directory. The Deaf portal provides live status tracking for all interpreter requests, and lets Deaf clients share job details in English or ASL/video with interpreters before they arrive.
        </Text>
      </div>

      <div style={cardWrap(COLORS.cyan)}>
        <Text style={cardTitle(COLORS.cyan)}>
          Your freelance interpreting work, all in one place
        </Text>
        <Text style={cardDesc}>
          Build your professional profile with intro videos, credentials, specializations, and rate profiles. Share your custom signpost URL or Book Me badge anywhere, and requesters are taken directly to a booking form for you. Manage your schedule, respond to requests, and handle invoicing from your dashboard.
        </Text>
      </div>

      <div style={cardWrap('#a78bfa')}>
        <Text style={cardTitle('#f0f2f8')}>
          Help grow our field with mentorship matching
        </Text>
        <Text style={cardDesc}>
          Whether you are deepening your skills in a new specialty or sharing expertise in one you know well, signpost helps connect interpreters for mentorship by area of practice.
        </Text>
      </div>

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
