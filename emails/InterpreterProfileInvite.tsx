import * as React from 'react'
import { Text, Link, Section, Hr } from '@react-email/components'
import { SignpostEmail, COLORS } from './SignpostEmail'

interface InterpreterProfileInviteProps {
  recipientName: string
}

const bodyText: React.CSSProperties = {
  color: '#c8ccd4',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
}

const greetingStyle: React.CSSProperties = {
  color: '#f0f2f8',
  fontSize: '20px',
  fontWeight: 700,
  fontFamily: "'Syne', 'Inter', sans-serif",
  margin: '0 0 20px',
}

const ctaHeader: React.CSSProperties = {
  color: '#00e5ff',
  fontSize: '16px',
  fontWeight: 700,
  lineHeight: '1.7',
  margin: '0 0 8px',
}

const featureHeader: React.CSSProperties = {
  color: '#f0f2f8',
  fontWeight: 700,
}

const profileLink: React.CSSProperties = {
  color: '#00e5ff',
  textDecoration: 'none',
  fontWeight: 700,
}

const hrStyle: React.CSSProperties = {
  borderColor: '#2a2a3a',
  borderTop: '1px solid #2a2a3a',
  margin: '28px 0',
}

export function InterpreterProfileInvite({ recipientName = 'there' }: InterpreterProfileInviteProps) {
  return (
    <SignpostEmail preview="signpost is opening soon. Help us one more time and coffee's on us!">
      <Text style={greetingStyle}>Hey {recipientName}!</Text>

      <Text style={bodyText}>
        Thank you SO MUCH for being part of the signpost beta. Your feedback shaped every part of this platform, and we want you to see what it turned into.
      </Text>

      <Text style={bodyText}>
        We are very close to going live. Several requesters are already knocking on our door asking how soon we'll be ready for real requests. Before we can do that, we need a directory full of amazing interpreters like you.
      </Text>

      <Text style={bodyText}>
        You have already set up your beta profile. We're hoping now you will complete it and be ready to get contacted for direct work. Two things would make the biggest difference right now:
      </Text>

      <Text style={ctaHeader}>
        1.{' '}
        <Link href="https://signpost.community/interpreter/dashboard/profile" style={profileLink}>
          Complete your profile.
        </Link>
      </Text>
      <Text style={bodyText}>
        Upload a photo, fill in your bio, set your rate profiles, etc. During the Deaf beta there was a lot of excitement about interpreter intro videos. We built the recording feature directly into the browser to make it painless.{'\n'}
        If you still have "(Beta)" in your display name, please remove it.
      </Text>

      <Text style={ctaHeader}>
        2. Invite interpreters you love working with and get free coffee!
      </Text>
      <Text style={bodyText}>
        The best part of our job is working with Deaf folks and interpreters we love. Interpreters can be from anywhere, not just your region. Send this invite to the interpreters you want on your team, and{' '}
        <strong>Molly or Regina will take you out for coffee (or send you a gift card if you're not in the Seattle area)!</strong>
      </Text>

      {/* Single CTA to /invite page (mailto/sms/copy buttons live there to avoid email client blockers) */}
      <Section style={{ margin: '20px 0 12px' }}>
        <a
          href="https://signpost.community/invite"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#00e5ff',
            color: '#0a0a0f',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          Send an invite
        </a>
      </Section>
      <Text style={{ color: '#96a0b8', fontSize: '12px', margin: '0 0 28px', lineHeight: '1.5' }}>
        Choose email, text, or copy to clipboard on the next page.
      </Text>

      <Text style={bodyText}>
        If you're not ready to be visible to requesters yet, just let me know and I can hide your profile until you are. No pressure.
      </Text>

      <Hr style={hrStyle} />

      <Text style={bodyText}>
        Here are just a couple of the things we built based on your feedback:
      </Text>

      <Text style={bodyText}>
        <span style={featureHeader}>Mentorship Matching:</span> We all have something to offer, and we all are forever learning. Now you can offer and/or seek mentorship from other interpreters in the signpost directory!{'\n'}
        Choose your knowledge areas, set your compensation preference, and get matched with interpreters who complement your needs or experience.
      </Text>

      <Text style={bodyText}>
        <span style={featureHeader}>Confidential Interpreter Ratings:</span> We have been noodling about interpreter ratings for a long time, and are really excited about what we were able to build.{'\n'}
        Research shows that public-facing ratings in small, interdependent communities don't work. Most Deaf people would either feel pressured to give low-performing interpreters 5-star ratings out of fear of harming relationships or risking their future communication access...or would refrain from rating low-performing interpreters altogether. This creates artificially high ratings, and makes them useless for honest assessment.{'\n'}
        Instead, Deaf users can now rate interpreters confidentially. Rating details are saved in the Deaf consumer's portal for their personal reference. Then rating information from all bookings is aggregated and anonymized before it is shared with signpost. signpost may use this information to highlight interpreters who receive consistently strong feedback, offer resources and support to interpreters who consistently receive constructive feedback in the same skill area, or remove interpreters who exhibit consistently concerning patterns.{'\n'}
        Our goal is to create a platform where Deaf folks feel comfortable sharing honestly in a way that hasn't been possible before. And where growing interpreters can get targeted support to help them thrive.
      </Text>

      <Text style={bodyText}>
        <span style={featureHeader}>&quot;Book Me&quot; Badge:</span> You now have your own custom URL and badge that link directly to your personal booking page. Add it to your email signature, LinkedIn, or share with anyone who wants to book you. Now you have a simple way to track your direct-book work in one centralized place.
      </Text>

      <Text style={bodyText}>
        Thank you for helping us build something special. We couldn't have gotten here without you.
      </Text>

      <Text style={{ color: '#f0f2f8', fontSize: '15px', fontWeight: 600, margin: '32px 0 0' }}>
        Molly and Regina
      </Text>
    </SignpostEmail>
  )
}

export default InterpreterProfileInvite
