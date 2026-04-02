import { Text, Link, Section } from '@react-email/components'
import * as React from 'react'

const heading: React.CSSProperties = {
  color: '#f0f2f8',
  fontSize: '22px',
  fontWeight: 700,
  fontFamily: "'Syne', 'Inter', sans-serif",
  lineHeight: '1.3',
  margin: '0 0 16px',
}

const paragraph: React.CSSProperties = {
  color: '#96a0b8',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
}

const leadStyle: React.CSSProperties = {
  color: '#f0f2f8',
  fontWeight: 600,
}

const bullet: React.CSSProperties = {
  color: '#96a0b8',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 8px',
  paddingLeft: '8px',
}

const buttonContainer: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const buttonPrimary: React.CSSProperties = {
  backgroundColor: '#00e5ff',
  color: '#0a0a0f',
  fontWeight: 700,
  fontSize: '15px',
  padding: '14px 32px',
  borderRadius: '10px',
  textDecoration: 'none',
  display: 'inline-block',
}

const buttonSecondary: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#00e5ff',
  fontWeight: 600,
  fontSize: '14px',
  padding: '12px 28px',
  borderRadius: '10px',
  border: '1.5px solid rgba(0, 229, 255, 0.4)',
  textDecoration: 'none',
  display: 'inline-block',
}

const card: React.CSSProperties = {
  backgroundColor: '#111118',
  borderRadius: '12px',
  border: '1px solid #1e2433',
  padding: '20px 24px',
  margin: '16px 0',
}

const callout: React.CSSProperties = {
  backgroundColor: '#16161f',
  borderLeft: '3px solid #00e5ff',
  borderRadius: '0 8px 8px 0',
  padding: '16px 20px',
  margin: '16px 0',
}

const small: React.CSSProperties = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 8px',
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return <Text style={heading}>{children}</Text>
}

export function EmailParagraph({ children }: { children: React.ReactNode }) {
  return <Text style={paragraph}>{children}</Text>
}

export function EmailBlock({ lead, children }: { lead: string; children: React.ReactNode }) {
  return (
    <Text style={paragraph}>
      <strong style={leadStyle}>{lead}</strong>{' '}
      {children}
    </Text>
  )
}

export function EmailBullet({ children }: { children: React.ReactNode }) {
  return <Text style={bullet}>{'•  '}{children}</Text>
}

export function EmailButton({ href, children, variant = 'primary' }: {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  const style = variant === 'primary' ? buttonPrimary : buttonSecondary
  return (
    <Section style={buttonContainer}>
      <Link href={href} style={style}>{children}</Link>
    </Section>
  )
}

export function EmailCard({ children }: { children: React.ReactNode }) {
  return <Section style={card}>{children}</Section>
}

export function EmailCallout({ children }: { children: React.ReactNode }) {
  return <Section style={callout}>{children}</Section>
}

export function EmailSmall({ children }: { children: React.ReactNode }) {
  return <Text style={small}>{children}</Text>
}
