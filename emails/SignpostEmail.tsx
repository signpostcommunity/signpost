import {
  Html, Head, Body, Container, Section,
  Text, Link, Hr, Preview
} from '@react-email/components'
import * as React from 'react'

interface SignpostEmailProps {
  preview?: string
  children: React.ReactNode
}

// Brand colors
const COLORS = {
  bg: '#0a0a0f',
  card: '#111118',
  surface: '#16161f',
  border: '#1e2433',
  text: '#f0f2f8',
  muted: '#96a0b8',
  cyan: '#00e5ff',
  purple: '#a78bfa',
  white: '#ffffff',
}

const body: React.CSSProperties = {
  backgroundColor: COLORS.bg,
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  margin: '0',
  padding: '0',
}

const container: React.CSSProperties = {
  backgroundColor: COLORS.bg,
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 20px',
}

const header: React.CSSProperties = {
  padding: '32px 0 24px',
  textAlign: 'center' as const,
}

const wordmark: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  fontFamily: "'Syne', 'Inter', sans-serif",
  letterSpacing: '-0.02em',
  margin: '0',
}

const wordmarkSign: React.CSSProperties = {
  color: COLORS.white,
}

const wordmarkPost: React.CSSProperties = {
  color: COLORS.cyan,
}

const contentStyle: React.CSSProperties = {
  padding: '0 0 32px',
}

const footerStyle: React.CSSProperties = {
  padding: '0 0 32px',
}

const divider: React.CSSProperties = {
  borderColor: COLORS.border,
  margin: '24px 0',
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
  color: '#666',
  fontSize: '11px',
  textAlign: 'center' as const,
  lineHeight: '1.5',
  margin: '0',
}

export function SignpostEmail({ preview, children }: SignpostEmailProps) {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={body}>
        <Container style={container}>
          {/* Header: signpost wordmark */}
          <Section style={header}>
            <Text style={wordmark}>
              <span style={wordmarkSign}>sign</span>
              <span style={wordmarkPost}>post</span>
            </Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
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
        </Container>
      </Body>
    </Html>
  )
}

export { COLORS }
