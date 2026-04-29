import * as React from 'react'
import { Text, Section, Link, Img } from '@react-email/components'
import { SignpostEmail, COLORS } from './SignpostEmail'

interface SoftLaunchAnnouncementInterpreterProps {
  recipientName: string
}

const LOGO_URL = 'https://udyddevceuulwkqpxkxp.supabase.co/storage/v1/object/public/avatars/signpostlogo.png'

const timelineBlock = (accentColor: string): React.CSSProperties => ({
  borderLeft: `3px solid ${accentColor}`,
  paddingLeft: '20px',
  margin: '24px 0',
})

const timelineDate: React.CSSProperties = {
  color: COLORS.text,
  fontSize: '15px',
  fontWeight: 700,
  margin: '0 0 8px',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
}

const timelineBody: React.CSSProperties = {
  color: COLORS.body,
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 12px',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
}

const boldText: React.CSSProperties = {
  color: COLORS.text,
  fontWeight: 700,
}

const italicMuted: React.CSSProperties = {
  color: COLORS.muted,
  fontStyle: 'italic',
  fontSize: '14px',
}

const buttonCyan: React.CSSProperties = {
  backgroundColor: '#00e5ff',
  color: '#0a0a0f',
  fontWeight: 700,
  fontSize: '15px',
  padding: '14px 32px',
  borderRadius: '10px',
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center' as const,
}

const buttonPurple: React.CSSProperties = {
  backgroundColor: '#a78bfa',
  color: '#0a0a0f',
  fontWeight: 700,
  fontSize: '15px',
  padding: '14px 32px',
  borderRadius: '10px',
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center' as const,
}

const paragraph: React.CSSProperties = {
  color: COLORS.body,
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
}

const signatureRow: React.CSSProperties = {
  margin: '32px 0 16px',
  textAlign: 'center' as const,
}

const signatureName = (color: string): React.CSSProperties => ({
  color,
  fontSize: '16px',
  fontWeight: 700,
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  display: 'inline',
})

export function SoftLaunchAnnouncementInterpreter({ recipientName = 'there' }: SoftLaunchAnnouncementInterpreterProps) {
  return (
    <SignpostEmail preview="signpost opens Friday. Complete your profile in time.">
      <Text style={paragraph}>
        Hey {recipientName},
      </Text>

      <Text style={paragraph}>
        Sharpen your pencils and polish your profile, Friday is the day! After months of work and hundreds of hours of development, signpost is opening our doors.
      </Text>

      <Text style={paragraph}>
        Freelance interpreters will finally have our own platform for managing our direct work in one place.
      </Text>

      <Text style={{ ...paragraph, fontWeight: 600, color: COLORS.text }}>
        Here's what that looks like:
      </Text>

      {/* Timeline block 1: May 1 */}
      <Section style={timelineBlock('#00e5ff')}>
        <Text style={timelineDate}>May 1: Soft launch.</Text>
        <Text style={timelineBody}>
          We open to a small group of requesters we've worked with directly, who've asked for early access. Real bookings, but no marketing, no social, no public announcement.
        </Text>
        <Text style={{ ...timelineBody, margin: '0 0 16px' }}>
          <span style={boldText}>Make sure your profile is ready. Real requesters will be accessing the directory soon.</span>
        </Text>
        <Link href="https://signpost.community/interpreter/dashboard" style={buttonCyan}>
          Complete my profile
        </Link>
      </Section>

      {/* Timeline block 2: Through May */}
      <Section style={timelineBlock('#a78bfa')}>
        <Text style={timelineDate}>Through May: Building the directory.</Text>
        <Text style={timelineBody}>
          Help spread the word. Our Deaf beta testers told us again and again: the Deaf community wants a way to book their favorite interpreters directly and easily. Invite the interpreters you trust, so they're there when a Deaf/DB/HH person wants to request them.
        </Text>
        <Text style={{ ...timelineBody, margin: '0 0 6px' }}>
          <span style={boldText}>Send invites to interpreters you trust.</span>
        </Text>
        <Text style={{ ...timelineBody, margin: '0 0 16px' }}>
          <span style={italicMuted}>Invite 5 or more and we'll thank you with a $15 Starbucks gift card.</span>
        </Text>
        <Link href="https://signpost.community/invite" style={buttonPurple}>
          Invite an interpreter
        </Link>
      </Section>

      {/* Timeline block 3: June 1 */}
      <Section style={{
        ...timelineBlock('#00e5ff'),
        background: 'linear-gradient(135deg, rgba(0,229,255,0.03) 0%, transparent 60%)',
        borderRadius: '0 8px 8px 0',
        paddingTop: '12px',
        paddingBottom: '12px',
      }}>
        <Text style={timelineDate}>June 1: Public launch.</Text>
        <Text style={{ ...timelineBody, margin: '0' }}>
          Social media, the public announcement.
        </Text>
      </Section>

      <Text style={{ ...paragraph, marginTop: '28px' }}>
        Thank you for being here from the start.
      </Text>

      {/* Signature */}
      <Section style={signatureRow}>
        <Text style={{ margin: '0 0 16px', textAlign: 'center' as const }}>
          <span style={signatureName('#00e5ff')}>Molly</span>
          <span style={{ color: COLORS.muted, fontSize: '16px' }}> & </span>
          <span style={signatureName('#a78bfa')}>Regina</span>
        </Text>
        <Link href="https://signpost.community" style={{ display: 'inline-block', textDecoration: 'none' }}>
          <Img
            src={LOGO_URL}
            alt="signpost"
            width="140"
            style={{ margin: '0 auto', display: 'block' }}
          />
        </Link>
      </Section>
    </SignpostEmail>
  )
}

export default SoftLaunchAnnouncementInterpreter
