import * as React from 'react'
import { Text, Section, Link, Img } from '@react-email/components'
import { SignpostEmail, COLORS } from './SignpostEmail'

interface PersonalInviteInterpreterProps {
  recipientName: string
}

const LOGO_URL = 'https://udyddevceuulwkqpxkxp.supabase.co/storage/v1/object/public/avatars/signpostlogo.png'

const paragraph: React.CSSProperties = {
  color: COLORS.body,
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
}

const audienceCardLabel = (color: string): React.CSSProperties => ({
  color,
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  margin: '0 0 10px',
  fontFamily: "'Syne', 'Inter', sans-serif",
})

const audienceCard = (borderColor: string): React.CSSProperties => ({
  borderLeft: `3px solid ${borderColor}`,
  backgroundColor: '#111118',
  borderRadius: '0 12px 12px 0',
  padding: '20px 24px',
  margin: '12px 0',
})

const audienceBody: React.CSSProperties = {
  color: COLORS.body,
  fontSize: '14px',
  lineHeight: '1.65',
  margin: '0',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
}

const ctaBox: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(0,229,255,0.06) 0%, rgba(167,139,250,0.06) 100%)',
  border: '1px solid rgba(0,229,255,0.2)',
  borderRadius: '12px',
  padding: '28px 24px',
  margin: '28px 0',
  textAlign: 'center' as const,
}

const buttonCyan: React.CSSProperties = {
  backgroundColor: '#00e5ff',
  color: '#0a0a0f',
  fontWeight: 700,
  fontSize: '15px',
  padding: '14px 28px',
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
  padding: '14px 28px',
  borderRadius: '10px',
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center' as const,
}

const timelineBlock = (accentColor: string): React.CSSProperties => ({
  borderRight: `3px solid ${accentColor}`,
  paddingRight: '20px',
  paddingLeft: '0',
  margin: '24px 0',
  textAlign: 'left' as const,
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
  margin: '0',
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
}

const signatureRow: React.CSSProperties = {
  margin: '32px 0 16px',
  textAlign: 'center' as const,
}

const signatureName = (color: string): React.CSSProperties => ({
  color,
  fontSize: '19px',
  fontWeight: 700,
  fontFamily: "'Syne', 'Inter', sans-serif",
  display: 'inline',
})

export function PersonalInviteInterpreter({ recipientName = 'there' }: PersonalInviteInterpreterProps) {
  return (
    <SignpostEmail preview="A personal invite to our most trusted interpreters">
      <Text style={paragraph}>
        Hey {recipientName},
      </Text>

      <Text style={paragraph}>
        My best friend and I (Regina McGinnis, Deaf mental-health professional) have been working long nights and weekends for months, building something special. Now it&apos;s finally time to put it out in the world!
      </Text>

      <Text style={paragraph}>
        Our new baby is called signpost. It&apos;s a platform that hopes to address some real challenges within our communities.
      </Text>

      {/* Audience card: Interpreters */}
      <Section style={audienceCard('#00e5ff')}>
        <Text style={audienceCardLabel('#00e5ff')}>For freelance interpreters</Text>
        <Text style={audienceBody}>
          A direct-booking and business management tool. Requesters pay your rate with no hourly agency commissions stacked on top. Receive pref requests, track all of your work in a clear dashboard, and send invoices all from one place. More exciting business-management features coming soon.
        </Text>
      </Section>

      {/* Audience card: Deaf/DB/HH */}
      <Section style={audienceCard('#a78bfa')}>
        <Text style={audienceCardLabel('#a78bfa')}>For Deaf, DeafBlind, and Hard of Hearing folks</Text>
        <Text style={audienceBody}>
          Full visibility over all requests tagged with their name, control over who gets booked, the ability to add context to jobs directly in either ASL or English, and a way to discover new interpreters through interpreter intro videos.
        </Text>
      </Section>

      {/* Audience card: Requesters */}
      <Section style={audienceCard('#00e5ff')}>
        <Text style={audienceCardLabel('#00e5ff')}>For requesters</Text>
        <Text style={audienceBody}>
          A simple booking interface that respects the Deaf person&apos;s preferences. Access to Deaf-curated preferred lists. Cost-savings that adds up quickly: signpost charges just $15 per booking, instead of agency markups charged per hour.
        </Text>
      </Section>

      <Text style={{ ...paragraph, marginTop: '24px' }}>
        I&apos;m reaching out personally because signpost will thrive or shrivel based on the quality of freelance interpreters in the directory. Having a directory full of interpreters we would trust with our own families is the goal. That&apos;s why your name is at the top of my list.
      </Text>

      {/* CTA Box */}
      <Section style={ctaBox}>
        {/* Two buttons side by side */}
        <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: '0 auto' }}>
          <tbody>
            <tr>
              <td style={{ paddingRight: '6px' }}>
                <Link href="https://signpost.community/interpreter/signup" style={buttonCyan}>
                  Sign up for signpost
                </Link>
              </td>
              <td style={{ paddingLeft: '6px' }}>
                <Link href="https://signpost.community/invite" style={buttonPurple}>
                  Invite interpreters
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
        <Text style={{
          color: COLORS.body,
          fontSize: '14px',
          lineHeight: '1.6',
          margin: '20px 0 0',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          textAlign: 'center' as const,
        }}>
          Once you&apos;ve created a profile, help spread the word. Invite 5 or more interpreters after signing up and we&apos;ll thank you with a{' '}
          <strong style={{ color: '#00e5ff', fontWeight: 700 }}>$15 Starbucks gift card</strong>.
        </Text>
      </Section>

      <Text style={{ ...paragraph, fontWeight: 600, color: COLORS.text }}>
        Here is what happens now:
      </Text>

      {/* Timeline block 1: May 1 — cyan right border */}
      <Section style={timelineBlock('#00e5ff')}>
        <Text style={timelineDate}>
          <span style={{ color: '#00e5ff' }}>May 1:</span> Soft launch.
        </Text>
        <Text style={timelineBody}>
          We open quietly to a small group of requesters who&apos;ve asked for early access. Real bookings start.
        </Text>
      </Section>

      {/* Timeline block 2: Through May — purple right border */}
      <Section style={timelineBlock('#a78bfa')}>
        <Text style={timelineDate}>
          <span style={{ color: '#a78bfa' }}>Through May:</span> Building the directory.
        </Text>
        <Text style={timelineBody}>
          Interpreters joining, profiles getting completed.
        </Text>
      </Section>

      {/* Timeline block 3: June 1 — cyan right border with gradient wash */}
      <Section style={{
        ...timelineBlock('#00e5ff'),
        background: 'linear-gradient(135deg, rgba(0,229,255,0.03) 0%, transparent 60%)',
        borderRadius: '8px 0 0 8px',
        paddingTop: '12px',
        paddingBottom: '12px',
      }}>
        <Text style={timelineDate}>
          <span style={{ color: '#00e5ff' }}>June 1:</span> Public launch.
        </Text>
        <Text style={timelineBody}>
          Social media, the public announcement.
        </Text>
      </Section>

      <Text style={{ ...paragraph, marginTop: '28px' }}>
        Please reply to this email with any questions or feedback. We hope to see you in the directory soon!
      </Text>

      {/* Signature */}
      <Section style={signatureRow}>
        <Text style={{ margin: '0 0 16px', textAlign: 'center' as const }}>
          <span style={signatureName('#00e5ff')}>Molly</span>
          <span style={{ color: COLORS.body, fontSize: '19px', fontFamily: "'Syne', 'Inter', sans-serif" }}> & </span>
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

export default PersonalInviteInterpreter
