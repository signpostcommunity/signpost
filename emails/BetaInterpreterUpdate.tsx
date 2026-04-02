import * as React from 'react'
import { Link } from '@react-email/components'
import { SignpostEmail } from './SignpostEmail'
import {
  EmailHeading,
  EmailParagraph,
  EmailBullet,
  EmailButton,
  EmailCallout,
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

      <EmailBullet>
        <strong style={{ color: '#f0f2f8' }}>Mentorship matching:</strong> You can now offer or seek mentorship from other interpreters. Choose your knowledge areas, set your compensation preference, and get matched with interpreters who complement your experience.
      </EmailBullet>

      <EmailBullet>
        <strong style={{ color: '#f0f2f8' }}>Rating confidentiality:</strong> Deaf users can now rate interpreters privately. Ratings are never shared with interpreters and never visible on public profiles. This was a direct response to concerns about honest feedback.
      </EmailBullet>

      <EmailBullet>
        <strong style={{ color: '#f0f2f8' }}>Book Me badge:</strong> You now have a custom URL and badge that link directly to your personal booking page. You can add it to your email signature, LinkedIn, or anywhere you like. This creates an easy way to track your direct-book work in one centralized platform.
      </EmailBullet>

      <EmailBullet>
        <strong style={{ color: '#f0f2f8' }}>Built-in Invoicing:</strong> Use your own invoicing tools or use signpost's free all-in-one invoicing feature. Change your preference any time, no requirement to use signpost's tools.
      </EmailBullet>

      <EmailBullet>
        <strong style={{ color: '#f0f2f8' }}>Directory improvements:</strong> Batch add interpreters to preferred lists, new filters, and a cleaner browsing experience for the people booking you.
      </EmailBullet>

      <EmailParagraph>
        Now, we are very close to opening the door to requesters. Organizations, schools, medical offices, and event coordinators are ready to start booking. But they need a directory full of interpreters to book from.
      </EmailParagraph>

      <EmailParagraph>
        That's where you come in.
      </EmailParagraph>

      <EmailParagraph>
        The single most important thing you can do right now is complete your profile. Upload a photo, fill in your specializations, set your rate profiles, and make sure your credentials are current. The more complete your profile, the more likely you are to be found and booked.
      </EmailParagraph>

      <EmailButton href="https://signpost.community/interpreter/dashboard/profile">
        Complete Your Profile
      </EmailButton>

      <EmailParagraph>
        And if there's an interpreter you love working with who isn't on signpost yet, send them an invitation. It takes 10 seconds. Just forward them this link:
      </EmailParagraph>

      <EmailParagraph>
        <Link href="https://signpost.community/interpreter/signup" style={linkStyle}>
          https://signpost.community/interpreter/signup
        </Link>
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

      <EmailParagraph>
        Molly Sano-Mahgoub{'\n'}
        Co-founder, signpost{'\n'}
        mollysano.nicm@gmail.com
      </EmailParagraph>
    </SignpostEmail>
  )
}

export default BetaInterpreterUpdate
