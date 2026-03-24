'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CalendarSyncCard({ calendarToken, onTokenChange, onToast }: {
  calendarToken: string; onTokenChange: (t: string) => void; onToast: (m: string) => void
}) {
  const feedUrl = `https://signpost.community/api/calendar/${calendarToken}.ics`

  async function regenerateToken() {
    if (!confirm('This will break any existing calendar subscriptions. You\'ll need to re-add the new link. Continue?')) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newToken = crypto.randomUUID()
    const { error } = await supabase
      .from('interpreter_profiles')
      .update({ calendar_token: newToken })
      .eq('user_id', user.id)
    if (error) {
      onToast('Failed to regenerate link')
    } else {
      onTokenChange(newToken)
      onToast('Calendar link regenerated')
    }
  }

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 24,
    }}>
      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--accent)', marginBottom: 8,
      }}>
        Calendar Sync
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.55 }}>
        Subscribe to your booking calendar so confirmed appointments automatically
        appear in Google Calendar, Outlook, or any calendar app. One-time setup.
      </p>

      {/* Feed URL + Copy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{
          fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)',
          fontFamily: "'DM Sans', sans-serif", wordBreak: 'break-all',
        }}>
          {feedUrl}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(feedUrl)
            onToast('Calendar link copied!')
          }}
          style={{
            background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
            color: 'var(--accent)', borderRadius: 8, padding: '6px 14px',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Copy link
        </button>
      </div>

      {/* Help page link */}
      <Link
        href="/help/calendar-sync"
        style={{
          display: 'inline-block', color: 'var(--accent)', fontSize: '0.82rem',
          fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          textDecoration: 'none', marginBottom: 12,
        }}
      >
        How to add this to my calendar &rarr;
      </Link>

      {/* Regenerate */}
      <button
        onClick={regenerateToken}
        style={{
          display: 'block', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif", padding: '2px 0',
          textDecoration: 'underline', textUnderlineOffset: '3px',
        }}
      >
        Regenerate link
      </button>
    </div>
  )
}
