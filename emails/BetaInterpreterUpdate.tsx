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

interface BetaInterpreterUpdateProps {
  recipientName: string
}

const linkStyle: React.CSSProperties = {
  color: '#00e5ff',
  textDecoration: 'none',
}

export function BetaInterpreterUpdate({ recipientName = 'there' }: BetaInterpreterUpdateProps) {
  return (
    <SignpostEmail preview="signpost is almost ready. We need your help.">
      <EmailHeading>signpost is almost ready. We need your help.</EmailHeading>

      <EmailParagraph>Hi {recipientName},</EmailParagraph>

      <EmailParagraph>
        Thank you SO MUCH for being part of the signpost beta. Your feedback has shaped every part of this platform, and we want you to see what it turned into.
      </EmailParagraph>

      <EmailParagraph>
        Here are some of the biggest improvements we built based on what you told us:
      </EmailParagraph>

      <EmailFeature title="Mentorship matching">
        Offer or seek mentorship from other interpreters. Choose knowledge areas, set compensation, get matched.
      </EmailFeature>

      <EmailFeature title="Rating confidentiality">
        Deaf users rate privately. Ratings are never shared with interpreters or visible on public profiles.
      </EmailFeature>

      <EmailFeature title="Book Me badge">
        Your custom URL and badge link directly to your booking page. Add it to your email signature or LinkedIn.
      </EmailFeature>

      <EmailFeature title="Built-in invoicing">
        Use your own tools or signpost's free invoicing. Change your preference any time.
      </EmailFeature>

      <EmailFeature title="Directory improvements">
        Batch add to preferred lists, new filters, cleaner browsing.
      </EmailFeature>

      <EmailParagraph>
        Now, we are very close to opening the door to requesters. Organizations, schools, medical offices, and event coordinators are ready to start booking. But they need a directory full of interpreters to book from.
      </EmailParagraph>

      <EmailParagraph>
        That's where you come in.
      </EmailParagraph>

      <EmailButton href="https://signpost.community/interpreter/dashboard/profile">
        Complete Your Profile
      </EmailButton>

      <EmailParagraph>
        Upload a photo, add your specializations, set your rates. The more complete your profile, the more bookings you'll get.
      </EmailParagraph>

      <EmailParagraph>
        Know an interpreter who should be here? Forward them this:
      </EmailParagraph>

      <EmailCallout>
        <EmailParagraph>
          I love working with you and would like to add you to my Preferred Team list on signpost! It's a new directory and booking platform built by interpreters, for interpreters. You set your own rates, keep 100% of your pay, and connect directly with clients. Click here to join so we can team together:{' '}
          <Link href="https://signpost.community/interpreter/signup" style={linkStyle}>
            https://signpost.community/interpreter/signup
          </Link>
        </EmailParagraph>
      </EmailCallout>

      <EmailParagraph>
        Thank you for helping us build something the community actually needs. We couldn't have gotten here without you.
      </EmailParagraph>

      <EmailSignature
        name="Molly Sano-Mahgoub"
        title="Co-founder, signpost"
        email="mollysano.nicm@gmail.com"
      />
    </SignpostEmail>
  )
}

export default BetaInterpreterUpdate
