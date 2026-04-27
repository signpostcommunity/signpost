import {
  Html, Head, Body, Container, Section,
  Text, Link, Img, Hr, Preview
} from '@react-email/components'
import * as React from 'react'

interface SignpostEmailProps {
  preview?: string
  children: React.ReactNode
  wide?: boolean
}

// Brand colors
const COLORS = {
  bg: '#0a0a0f',
  innerBg: '#0d0d14',
  card: '#111118',
  surface: '#16161f',
  border: '#1e2433',
  text: '#f0f2f8',
  body: '#c8cdd8',
  muted: '#96a0b8',
  cyan: '#00e5ff',
  purple: '#a78bfa',
  white: '#ffffff',
}

const LOGO_URL = 'https://udyddevceuulwkqpxkxp.supabase.co/storage/v1/object/public/avatars/signpostlogo.png'

const bodyStyle: React.CSSProperties = {
  backgroundColor: COLORS.bg,
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  margin: '0',
  padding: '0',
}

const outerContainer: React.CSSProperties = {
  backgroundColor: COLORS.bg,
  maxWidth: '640px',
  margin: '0 auto',
  padding: '20px 20px',
}

const innerContainer: React.CSSProperties = {
  backgroundColor: COLORS.innerBg,
  borderRadius: '16px',
  border: `1px solid ${COLORS.border}`,
  padding: '40px 32px',
  margin: '0 auto',
  maxWidth: '600px',
}

const header: React.CSSProperties = {
  padding: '0 0 28px',
  textAlign: 'center' as const,
}

const logoStyle: React.CSSProperties = {
  margin: '0 auto',
  display: 'block',
}

const contentStyle: React.CSSProperties = {
  padding: '0',
}

const footerOuter: React.CSSProperties = {
  padding: '24px 0 0',
}

const divider: React.CSSProperties = {
  borderColor: COLORS.border,
  margin: '0 0 20px',
}

const footerText: React.CSSProperties = {
  color: COLORS.muted,
  fontSize: '13px',
  textAlign: 'center' as const,
  margin: '0 0 8px',
}

const footerLinks: React.CSSProperties = {
  color: COLORS.muted,
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0 0 12px',
}

const footerLink: React.CSSProperties = {
  color: COLORS.cyan,
  textDecoration: 'none',
}

const footerMuted: React.CSSProperties = {
  color: '#555',
  fontSize: '11px',
  textAlign: 'center' as const,
  lineHeight: '1.5',
  margin: '0',
}

export function SignpostEmail({ preview, children, wide = false }: SignpostEmailProps) {
  const outer = wide
    ? { ...outerContainer, maxWidth: '640px' }
    : outerContainer
  const inner = wide
    ? { ...innerContainer, maxWidth: '600px', padding: '40px 20px' }
    : innerContainer
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={bodyStyle}>
        <Container style={outer}>
          <Section style={inner}>
            {/* Header: signpost logo */}
            <Section style={header}>
              <Link href="https://signpost.community" style={{ display: 'inline-block', textDecoration: 'none' }}>
                <Img
                  src={LOGO_URL}
                  alt="signpost"
                  width="200"
                  style={logoStyle}
                />
              </Link>
            </Section>

            {/* Content */}
            <Section style={contentStyle}>
              {children}
            </Section>

            {/* Footer */}
            <Section style={footerOuter}>
              <Hr style={divider} />
              <Text style={footerText}>
                signpost.community
              </Text>
              <Text style={footerLinks}>
                <Link href="https://signpost.community" style={footerLink}>Visit signpost</Link>
                {' · '}
                <Link href="https://signpost.community/about" style={footerLink}>About</Link>
                {' · '}
                <Link href="mailto:hello@signpost.community" style={footerLink}>Contact</Link>
              </Text>
              <Text style={footerMuted}>
                signpost is a platform connecting Deaf, DeafBlind, and Hard of Hearing individuals with sign language interpreters.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export { COLORS }
