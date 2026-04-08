export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Add your bookings to your calendar - signpost',
  description: 'Step-by-step instructions for adding your signpost booking calendar to Google Calendar, Apple Calendar, or Outlook.',
}

/* ── Shared styles ── */

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  marginBottom: 16,
}

const stepList: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.9rem',
  lineHeight: 1.8,
  color: 'var(--text)',
  listStyleType: 'decimal',
  paddingLeft: 20,
  margin: 0,
}

const stepItem: React.CSSProperties = {
  paddingLeft: 4,
}

const sectionDivider: React.CSSProperties = {
  borderBottom: '1px solid var(--border)',
  paddingBottom: 36,
  marginBottom: 36,
}

const note: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.85rem',
  fontStyle: 'italic',
  color: 'var(--muted)',
  marginBottom: 16,
  lineHeight: 1.6,
}

/* ── Page ── */

export default function CalendarSyncHelpPage() {
  return (
    <div style={{ padding: '60px 40px 100px', maxWidth: 700, margin: '0 auto' }}>

      {/* Wordmark */}
      <div className="wordmark" style={{ fontSize: '1.5rem', marginBottom: 48 }}>
        sign<span>post</span>
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
        color: 'var(--text)',
        marginBottom: 12,
        lineHeight: 1.25,
      }}>
        Add your signpost bookings to your calendar
      </h1>

      {/* Subtitle */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.95rem',
        color: 'var(--muted)',
        lineHeight: 1.6,
        marginBottom: 48,
      }}>
        Follow the steps for your calendar app. You only need to do this once.
        After that, confirmed bookings will appear automatically.
      </p>

      {/* ── Google Calendar (Computer) ── */}
      <section style={sectionDivider}>
        <h2 style={sectionHeading}>Google Calendar (on a computer)</h2>
        <ol style={stepList}>
          <li style={stepItem}>Go to your signpost interpreter dashboard</li>
          <li style={stepItem}>Find the Calendar Sync section and click &ldquo;Copy link&rdquo;</li>
          <li style={stepItem}>Open Google Calendar in your browser (calendar.google.com)</li>
          <li style={stepItem}>On the left side, look for &ldquo;Other calendars&rdquo; and click the + button next to it</li>
          <li style={stepItem}>Click &ldquo;From URL&rdquo;</li>
          <li style={stepItem}>Paste the link you copied and click &ldquo;Add calendar&rdquo;</li>
          <li style={stepItem}>Done. Your signpost bookings will start appearing in your calendar.</li>
        </ol>
      </section>

      {/* ── Google Calendar (Phone) ── */}
      <section style={sectionDivider}>
        <h2 style={sectionHeading}>Google Calendar (on your phone)</h2>
        <p style={note}>
          The Google Calendar app doesn&apos;t support adding calendar links directly.
          You&apos;ll need to use a browser for this one-time setup.
        </p>
        <ol style={stepList}>
          <li style={stepItem}>Go to your signpost interpreter dashboard and copy your calendar link</li>
          <li style={stepItem}>Open Chrome or Safari on your phone (not the Calendar app)</li>
          <li style={stepItem}>Go to calendar.google.com and sign in with your Google account</li>
          <li style={stepItem}>Tap the three-line menu icon in the top left</li>
          <li style={stepItem}>Scroll down and find &ldquo;Other calendars,&rdquo; then tap the + button</li>
          <li style={stepItem}>Tap &ldquo;From URL&rdquo;</li>
          <li style={stepItem}>Paste your link and tap &ldquo;Add calendar&rdquo;</li>
          <li style={stepItem}>Open the Google Calendar app. Your bookings will show up within a few minutes.</li>
        </ol>
      </section>

      {/* ── Apple Calendar (iPhone/iPad) ── */}
      <section style={sectionDivider}>
        <h2 style={sectionHeading}>Apple Calendar (iPhone or iPad)</h2>
        <ol style={stepList}>
          <li style={stepItem}>Go to your signpost interpreter dashboard and copy your calendar link</li>
          <li style={stepItem}>Open Safari (it needs to be Safari, not Chrome)</li>
          <li style={stepItem}>Tap the address bar at the top and paste your link</li>
          <li style={stepItem}>Safari will ask if you want to subscribe to this calendar. Tap &ldquo;Subscribe&rdquo;</li>
          <li style={stepItem}>Tap &ldquo;Done&rdquo;</li>
          <li style={stepItem}>Open the Calendar app. Your signpost bookings are there.</li>
        </ol>
      </section>

      {/* ── Apple Calendar (Mac) ── */}
      <section style={sectionDivider}>
        <h2 style={sectionHeading}>Apple Calendar (Mac)</h2>
        <ol style={stepList}>
          <li style={stepItem}>Go to your signpost interpreter dashboard and copy your calendar link</li>
          <li style={stepItem}>Open the Calendar app on your Mac</li>
          <li style={stepItem}>In the menu bar, click File, then New Calendar Subscription</li>
          <li style={stepItem}>Paste your link and click Subscribe</li>
          <li style={stepItem}>Change &ldquo;Auto-refresh&rdquo; to &ldquo;Every hour&rdquo; so bookings stay current</li>
          <li style={stepItem}>Click OK. Your bookings will appear.</li>
        </ol>
      </section>

      {/* ── Outlook (Computer) ── */}
      <section style={sectionDivider}>
        <h2 style={sectionHeading}>Outlook (on a computer)</h2>
        <ol style={stepList}>
          <li style={stepItem}>Go to your signpost interpreter dashboard and copy your calendar link</li>
          <li style={stepItem}>Open Outlook and switch to your Calendar view</li>
          <li style={stepItem}>Click &ldquo;Add calendar&rdquo; (usually in the left sidebar or toolbar)</li>
          <li style={stepItem}>Click &ldquo;Subscribe from web&rdquo;</li>
          <li style={stepItem}>Paste your link</li>
          <li style={stepItem}>Give it a name like &ldquo;signpost bookings&rdquo; and click Import</li>
          <li style={stepItem}>Your bookings will appear and update automatically.</li>
        </ol>
      </section>

      {/* ── Outlook (Phone) ── */}
      <section style={{ paddingBottom: 36, marginBottom: 36 }}>
        <h2 style={sectionHeading}>Outlook (on your phone)</h2>
        <ol style={stepList}>
          <li style={stepItem}>Go to your signpost interpreter dashboard and copy your calendar link</li>
          <li style={stepItem}>Open the Outlook app and go to Calendar</li>
          <li style={stepItem}>Tap your profile picture in the top left</li>
          <li style={stepItem}>Tap the gear icon or &ldquo;Add Account&rdquo;</li>
          <li style={stepItem}>Look for &ldquo;Add Shared Calendar&rdquo; or &ldquo;Subscribe&rdquo;</li>
          <li style={stepItem}>Paste your link</li>
          <li style={stepItem}>Your bookings will sync automatically.</li>
        </ol>
      </section>

      {/* Bottom note */}
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.82rem',
        color: 'var(--muted)',
        lineHeight: 1.65,
        marginBottom: 32,
      }}>
        After setup, your calendar checks for updates automatically. New bookings
        usually appear within 15 to 60 minutes depending on your calendar app.
        If a booking doesn&apos;t show up right away, give it a little time.
      </p>

      {/* Back link */}
      <Link
        href="/interpreter/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--muted)',
          fontSize: '0.85rem',
          fontFamily: "'DM Sans', sans-serif",
          textDecoration: 'none',
        }}
      >
        &#8592; Back to Dashboard
      </Link>
    </div>
  )
}
