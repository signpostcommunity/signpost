import * as React from 'react'
import { Link } from '@react-email/components'
import { SignpostEmail } from './SignpostEmail'
import {
  EmailHeading,
  EmailParagraph,
  EmailFeature,
  EmailButton,
  EmailCallout,
  EmailSignature,
} from './components'

interface InterpreterInvitationProps {
  recipientName: string
}

const linkStyle: React.CSSProperties = {
  color: '#00e5ff',
  textDecoration: 'none',
}

export function InterpreterInvitation({ recipientName = 'there' }: InterpreterInvitationProps) {
  return (
    <SignpostEmail preview="I built something I think you'll want to see">
      <EmailHeading>I built something I think you'll want to see</EmailHeading>

      <EmailParagraph>Hi {recipientName},</EmailParagraph>

      <EmailParagraph>
        I've been building something over the past few months and I'd love for you to check it out.
      </EmailParagraph>

      <EmailParagraph>
        It's called signpost. It's a directory and booking platform for freelance interpreters. Regina McGinnis and I co-founded it because we were frustrated with the same things you and I have talked about: agencies adding their commission on top, owning the client relationship, and deciding who shows up.
      </EmailParagraph>

      <EmailParagraph>
        signpost puts interpreters in control. You set your own rates and terms. Clients pay your rate directly, with no agency markup added on top. signpost charges the requester a flat $15 booking fee, and that's it.
      </EmailParagraph>

      <EmailParagraph>
        A few things I'm really proud of:
      </EmailParagraph>

      <EmailFeature title="Preferred interpreter lists">
        Deaf clients build a preferred list and share it with anyone who books for them. The requester sees who the Deaf person actually wants.
      </EmailFeature>

      <EmailFeature title="Book Me badge">
        A custom URL and badge to put in your email signature or on LinkedIn.
      </EmailFeature>

      <EmailFeature title="Mentorship matching">
        Experienced interpreters connect with newer interpreters. Built-in scheduling and compensation tools.
      </EmailFeature>

      <EmailFeature title="Free invoicing">
        Built in if you want it, or use your own tools. No lock-in.
      </EmailFeature>

      <EmailParagraph>
        We're almost ready to start inviting requesters (schools, medical offices, agencies, event coordinators). But we need a solid directory of interpreters first. That's where you come in.
      </EmailParagraph>

      <EmailParagraph>
        Would you set up a profile? It takes about 5 minutes:
      </EmailParagraph>

      <EmailButton href="https://signpost.community/interpreter/signup">
        Join signpost
      </EmailButton>

      <EmailParagraph>
        And if you know interpreters who would be a good fit, I'd love it if you passed this along. Here's something you can copy and send:
      </EmailParagraph>

      <EmailCallout>
        <EmailParagraph>
          I love working with you and would like to add you to my Preferred Team list on signpost! It's a new directory and booking platform built by interpreters, for interpreters. You set your own rates and terms, and connect directly with clients, with no agency fees added on top. Click here to join so we can team together:{' '}
          <Link href="https://signpost.community/interpreter/signup" style={linkStyle}>
            https://signpost.community/interpreter/signup
          </Link>
        </EmailParagraph>
      </EmailCallout>

      <EmailParagraph>
        I'd really appreciate your support on this. Let me know what you think once you've had a chance to look around.
      </EmailParagraph>

      <EmailSignature name="Molly" />
    </SignpostEmail>
  )
}

export default InterpreterInvitation
