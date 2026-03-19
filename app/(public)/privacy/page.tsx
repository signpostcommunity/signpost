export const dynamic = 'force-dynamic';

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — signpost',
}

const sectionLabel: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--accent2)',
  marginBottom: 8,
}

const heading: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 700,
  fontSize: '1.35rem',
  marginBottom: 16,
  color: 'var(--text)',
}

const subheading: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 700,
  fontSize: '1.05rem',
  marginBottom: 10,
  marginTop: 24,
  color: 'var(--text)',
}

const body: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.9rem',
  lineHeight: 1.75,
  marginBottom: 12,
}

const listStyle: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.9rem',
  lineHeight: 1.75,
  marginBottom: 12,
  paddingLeft: 24,
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

export default function PrivacyPolicyPage() {
  return (
    <div style={{ padding: '60px 40px 100px', maxWidth: 760, margin: '0 auto' }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none', marginBottom: 40 }}>
        &#8592; Back to Home
      </Link>

      <div className="wordmark" style={{ fontSize: '1.5rem', marginBottom: 32 }}>
        sign<span>post</span>
      </div>

      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: '2rem',
        marginBottom: 8,
        color: 'var(--text)',
      }}>
        Privacy Policy
      </h1>
      <p style={{ ...body, marginBottom: 48 }}>
        Beta Version &mdash; Last updated: March 18, 2026
      </p>

      <Section number={1} title="Information We Collect">
        <h3 style={subheading}>Information you provide</h3>
        <ul style={listStyle}>
          <li><strong style={{ color: 'var(--text)' }}>Account information:</strong> name, email address, pronouns, and role (interpreter, Deaf/DB/HH individual, or requester/organization)</li>
          <li><strong style={{ color: 'var(--text)' }}>Profile information:</strong> credentials, certifications, specializations, languages, rates, bio, location, and other details you choose to add to your profile</li>
          <li><strong style={{ color: 'var(--text)' }}>Communication preferences:</strong> signing style, preferred communication methods, and interpreter preferences (for Deaf/DB/HH users)</li>
          <li><strong style={{ color: 'var(--text)' }}>Booking and request details:</strong> appointment information, messages exchanged through the platform, and feedback</li>
          <li><strong style={{ color: 'var(--text)' }}>Beta feedback:</strong> responses to beta questions and surveys submitted during the testing period</li>
        </ul>

        <h3 style={subheading}>Information collected automatically</h3>
        <ul style={listStyle}>
          <li><strong style={{ color: 'var(--text)' }}>Usage data:</strong> pages visited, features used, and general interaction patterns</li>
          <li><strong style={{ color: 'var(--text)' }}>Device and browser information:</strong> browser type, operating system, and screen size</li>
          <li><strong style={{ color: 'var(--text)' }}>Local storage:</strong> we use browser local storage for functional purposes such as remembering dismissed notices and session preferences. We do not use tracking cookies.</li>
        </ul>

        <h3 style={subheading}>Information we do not collect</h3>
        <p style={body}>
          signpost does not currently collect or store payment information, credit card numbers, bank account details, Social Security numbers, or biometric data. When payment processing is introduced in the future, it will be handled by a PCI-compliant third-party processor (Stripe). signpost will never directly handle your financial information.
        </p>
      </Section>

      <Section number={2} title="How We Use Your Information">
        <p style={body}>We use the information we collect to:</p>
        <ul style={listStyle}>
          <li><strong style={{ color: 'var(--text)' }}>Operate the platform:</strong> create and maintain your account, display interpreter profiles in the directory, and facilitate booking requests and communication between users</li>
          <li><strong style={{ color: 'var(--text)' }}>Send transactional communications:</strong> booking confirmations, request updates, and other messages directly related to your use of the platform</li>
          <li><strong style={{ color: 'var(--text)' }}>Improve the platform:</strong> understand how the platform is used, identify issues, and develop new features</li>
          <li><strong style={{ color: 'var(--text)' }}>Respond to your inquiries:</strong> answer questions and provide support via hello@signpost.community</li>
        </ul>
        <p style={body}>
          We do not use your information for advertising. We do not sell, rent, or share your personal information with third parties for their marketing purposes.
        </p>
      </Section>

      <Section number={3} title="What Is Visible to Other Users">
        <p style={body}>
          <strong style={{ color: 'var(--text)' }}>Interpreter profiles:</strong> Information you add to your interpreter profile (name, credentials, specializations, languages, rates, bio, location, and photo) is visible to logged-in users browsing the directory. You control what information appears on your profile.
        </p>
        <p style={body}>
          <strong style={{ color: 'var(--text)' }}>Deaf/DB/HH communication preferences:</strong> Your communication preferences are shared only with interpreters you choose to contact or who are assigned to your booking requests. Your preferred interpreter lists are private and only shared with people you explicitly authorize.
        </p>
        <p style={body}>
          <strong style={{ color: 'var(--text)' }}>Requester/Organization information:</strong> Your organization name and contact information are shared with interpreters when you submit a booking request.
        </p>
      </Section>

      <Section number={4} title="Third-Party Services">
        <p style={body}>signpost uses the following third-party services to operate the platform:</p>
        <ul style={listStyle}>
          <li><strong style={{ color: 'var(--text)' }}>Supabase:</strong> authentication and database hosting</li>
          <li><strong style={{ color: 'var(--text)' }}>Vercel:</strong> website hosting</li>
          <li><strong style={{ color: 'var(--text)' }}>Google:</strong> authentication (Google sign-in)</li>
          <li><strong style={{ color: 'var(--text)' }}>Resend:</strong> transactional email delivery</li>
          <li><strong style={{ color: 'var(--text)' }}>OpenCage:</strong> geocoding (converting locations to coordinates for distance-based search)</li>
        </ul>
        <p style={body}>
          These services process data on our behalf under their own privacy policies and applicable data protection agreements. We only share the minimum information necessary for each service to function.
        </p>
      </Section>

      <Section number={5} title="Data Retention and Deletion">
        <p style={body}>
          We retain your account and profile data for as long as your account is active.
        </p>
        <p style={body}>
          If you delete your account, your personal data will be removed from active systems within 30 days. Aggregated, non-identifiable usage data may be retained beyond this period for platform improvement.
        </p>
        <p style={body}>
          Interpreters can update or remove their profile information at any time from their dashboard. Deaf/DB/HH users and requesters can request account deletion by contacting{' '}
          <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>hello@signpost.community</a>.
        </p>
      </Section>

      <Section number={6} title="Your Rights">
        <p style={body}>You have the right to:</p>
        <ul style={listStyle}>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate information</li>
          <li>Delete your account and associated personal data</li>
          <li>Withdraw consent for data processing where consent is the basis for processing</li>
        </ul>
        <p style={body}>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>hello@signpost.community</a>.
          We will respond to verifiable requests within 30 days.
        </p>
      </Section>

      <Section number={7} title="Children&rsquo;s Privacy">
        <p style={body}>
          signpost is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us at{' '}
          <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>hello@signpost.community</a>{' '}
          and we will delete it promptly.
        </p>
      </Section>

      <Section number={8} title="Security">
        <p style={body}>
          We use industry-standard security measures to protect your data, including encrypted connections (HTTPS), secure authentication through Supabase, and role-based access controls. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
        </p>
      </Section>

      <Section number={9} title="Changes to This Policy">
        <p style={body}>
          We may update this Privacy Policy as the platform evolves. If we make material changes, we will notify you via email or a prominent notice on the platform. Your continued use of signpost after changes are posted constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section number={10} title="Contact Us">
        <p style={body}>
          If you have questions about this Privacy Policy or your data, contact us at:
        </p>
        <p style={body}>
          <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>hello@signpost.community</a>
        </p>
        <p style={body}>
          signpost is operated from Seattle, Washington, United States.
        </p>
      </Section>

      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: 24,
        marginTop: 16,
      }}>
        <p style={{ ...body, fontSize: '0.82rem', textAlign: 'center' }}>
          signpost &middot; signpost.community &middot;{' '}
          <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>hello@signpost.community</a>
        </p>
        <p style={{ ...body, fontSize: '0.78rem', fontStyle: 'italic', textAlign: 'center', marginBottom: 0 }}>
          This document is a working draft for the beta period and does not constitute legal advice.
        </p>
      </div>
    </div>
  )
}
