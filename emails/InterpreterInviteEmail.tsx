import * as React from 'react'
import { SignpostEmail } from './SignpostEmail'
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

export function InterpreterInviteEmail({
  recipientName = 'there',
  senderName = 'Someone',
  inviteToken = '',
}: InterpreterInviteEmailProps) {
  const signupUrl = `https://signpost.community/interpreter/signup?invite=${inviteToken}`

  return (
    <SignpostEmail preview={`${senderName} wants to add you to their preferred interpreter team on signpost`}>
      <EmailParagraph>
        Hey {recipientName},
      </EmailParagraph>

      <EmailParagraph>
        {senderName} wants to add you to their preferred interpreter team on signpost.
      </EmailParagraph>

      <EmailButton href={signupUrl}>
        Join signpost
      </EmailButton>

      <EmailFeature title="Set your own rates and terms">
        You decide what you charge. Clients pay your rate directly.
      </EmailFeature>

      <EmailFeature title="Connect directly with clients, with no agency fees added on top">
        No middleman between you and the people you work with.
      </EmailFeature>

      <EmailFeature title="Build your professional profile with intro videos and credentials">
        Show your skills, specializations, and certifications in one place.
      </EmailFeature>

      <EmailFeature title="Get matched with mentors in your specialty areas">
        Offer or seek mentorship from other interpreters in the signpost directory.
      </EmailFeature>

      <EmailParagraph>
        signpost is a new interpreter directory and booking platform built by interpreters and Deaf professionals who know the field firsthand. No middleman, no markup.
      </EmailParagraph>
    </SignpostEmail>
  )
}

export default InterpreterInviteEmail
