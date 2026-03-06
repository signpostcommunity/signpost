import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Platform Policies & Terms of Use — signpost',
}

const sectionLabel: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  marginBottom: 8,
}

const heading: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 800,
  fontSize: '1.35rem',
  marginBottom: 16,
  color: 'var(--text)',
}

const body: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.9rem',
  lineHeight: 1.75,
  marginBottom: 12,
}

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={sectionLabel}>Section {number}</div>
      <h2 style={heading}>{title}</h2>
      <div>{children}</div>
    </section>
  )
}

export default function PoliciesPage() {
  return (
    <div style={{ padding: '60px 40px 100px', maxWidth: 760, margin: '0 auto' }}>
      <div style={sectionLabel}>Legal</div>
      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: '2rem',
        marginBottom: 8,
        color: 'var(--text)',
      }}>
        Platform Policies &amp; Terms of Use
      </h1>
      <p style={{ ...body, marginBottom: 48 }}>
        Last updated: March 2026. By creating an account or using Signpost, you agree to the following terms.
      </p>

      <Section number={1} title="What Signpost Is — and Is Not">
        <p style={body}>
          Signpost is a marketplace platform that connects sign language interpreters with Deaf and Hard-of-Hearing individuals, organizations, and requesters. Signpost provides the technology infrastructure for discovery, communication, scheduling, and payment processing between parties.
        </p>
        <p style={body}>
          Signpost is <strong style={{ color: 'var(--text)' }}>not</strong> an interpreting agency. Interpreters on the platform are independent contractors, not employees of Signpost. Signpost does not assign, supervise, or direct interpreting work. All professional decisions — including accepting or declining bookings, setting rates, and managing schedules — are made by the interpreter.
        </p>
        <p style={body}>
          Signpost does not guarantee the availability, quality, or outcome of any interpreting service booked through the platform. Requesters and consumers are responsible for evaluating interpreter qualifications, credentials, and suitability for their specific needs.
        </p>
      </Section>

      <Section number={2} title="Rates, Terms, and Payment">
        <p style={body}>
          Interpreters set their own rates, cancellation policies, and booking terms through their profile. These terms are visible to requesters before a booking is confirmed. By confirming a booking, both parties agree to the interpreter&apos;s posted terms for that engagement.
        </p>
        <p style={body}>
          Signpost charges a platform fee on bookings processed through the platform. The current fee structure is displayed during the booking process. Signpost reserves the right to adjust platform fees with 30 days&apos; notice to active users.
        </p>
        <p style={body}>
          Connections made through Signpost are platform connections. Work relationships that originate on Signpost — whether with a new client or a returning one — will continue to be booked through the platform. Routing bookings outside Signpost to avoid the platform fee is a violation of these terms and may result in account suspension or removal.
        </p>
        <p style={body}>
          Signpost does not handle payroll, tax withholding, or benefits. Interpreters are responsible for their own tax obligations, insurance, and business expenses.
        </p>
      </Section>

      <Section number={3} title="Disputes">
        <p style={body}>
          Signpost encourages all parties to resolve disputes directly through the platform&apos;s messaging system. If a resolution cannot be reached, either party may submit a dispute to Signpost for mediation.
        </p>
        <p style={body}>
          Signpost will review disputes in good faith but is not obligated to resolve them. Signpost&apos;s role in dispute resolution is limited to facilitating communication, reviewing platform records, and, where appropriate, issuing refunds or credits in accordance with the booking terms.
        </p>
        <p style={body}>
          Signpost reserves the right to suspend or remove accounts involved in repeated disputes, fraudulent behavior, or violations of these terms.
        </p>
      </Section>

      <Section number={4} title="Credentials and Verification">
        <p style={body}>
          Interpreters may list certifications, education, and professional credentials on their profiles. Credentials accompanied by a verification link or uploaded documentation will display a &ldquo;Verified&rdquo; badge on the interpreter&apos;s profile.
        </p>
        <p style={body}>
          Signpost verifies that documentation has been provided but does not independently validate the authenticity of credentials. The &ldquo;Verified&rdquo; badge indicates that the interpreter has submitted supporting documentation — not that Signpost has confirmed the credential with the issuing body.
        </p>
        <p style={body}>
          Interpreters confirm that all credential and experience information provided is accurate to the best of their knowledge. Misrepresentation of qualifications, certifications, or experience may result in immediate removal from the platform.
        </p>
        <p style={body}>
          Business documents (liability insurance, background checks, immunization records, etc.) are never displayed publicly. Interpreters control which requesters receive access to these documents.
        </p>
      </Section>

      <Section number={5} title="Privacy and Profile Information">
        <p style={body}>
          Profile information that interpreters provide — including name, bio, languages, specializations, rates, and credentials — is displayed publicly in the Signpost directory to facilitate discovery by potential clients.
        </p>
        <p style={body}>
          Contact information (email, phone number) is shared only with confirmed booking parties and is not displayed in the public directory. Signpost will never sell or share personal information with third parties for marketing purposes.
        </p>
        <p style={body}>
          Interpreters may update, modify, or remove their profile information at any time through their dashboard. Account deletion requests can be submitted through the platform and will be processed within 30 days.
        </p>
        <p style={body}>
          Signpost retains booking records, messages, and transaction data for a minimum of 3 years for legal and operational purposes, even after account deletion. Anonymized and aggregated data may be used for platform improvement and analytics.
        </p>
      </Section>

      <Section number={6} title="Platform Access and Subscriptions">
        <p style={body}>
          Signpost offers both free and premium tiers for interpreter accounts. Free accounts include core profile listing, booking management, and messaging features. Premium subscriptions may include enhanced visibility, analytics, priority support, and additional features as announced.
        </p>
        <p style={body}>
          Signpost reserves the right to modify features available at each tier with reasonable notice. Paid subscription fees are non-refundable except where required by applicable law.
        </p>
        <p style={body}>
          Signpost may suspend or terminate accounts that violate these terms, engage in fraudulent activity, or are inactive for an extended period. Users will be notified before any account action is taken, except in cases of fraud or imminent harm.
        </p>
      </Section>

      <Section number={7} title="Limitation of Liability">
        <p style={body}>
          Signpost provides the platform &ldquo;as is&rdquo; and makes no warranties, express or implied, regarding the availability, reliability, or suitability of the platform or any services booked through it.
        </p>
        <p style={body}>
          To the maximum extent permitted by applicable law, Signpost shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of the platform, including but not limited to: loss of revenue, loss of data, personal injury, property damage, or damages arising from the conduct of interpreters, requesters, or other users.
        </p>
        <p style={body}>
          Signpost&apos;s total liability for any claim arising from or related to these terms or your use of the platform shall not exceed the amount of platform fees paid by you in the 12 months preceding the claim.
        </p>
        <p style={body}>
          Nothing in these terms excludes or limits liability that cannot be excluded or limited under applicable law, including liability for fraud or personal injury caused by negligence.
        </p>
      </Section>

      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: 24,
        marginTop: 16,
      }}>
        <p style={{ ...body, fontSize: '0.82rem' }}>
          Questions about these policies? Contact us at{' '}
          <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            hello@signpost.community
          </a>
        </p>
      </div>
    </div>
  )
}
