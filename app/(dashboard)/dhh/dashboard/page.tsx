'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DashMobileStyles } from '@/components/dashboard/interpreter/shared'

/* ── Types ── */

interface RecentBooking {
  id: string
  title: string | null
  date: string
  time_start: string
  time_end: string
  format: string | null
  location: string | null
  status: string
}

interface PrefInterpreter {
  id: string
  first_name: string | null
  last_name: string | null
  name: string | null
  photo_url: string | null
  certs: string[]
}

/* ── Helpers ── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(start: string, end: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

function getInitials(firstName: string | null, lastName: string | null, name: string | null): string {
  if (firstName) {
    return `${firstName[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }
  if (name) {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }
  return '?'
}

function getDisplayName(firstName: string | null, lastName: string | null, name: string | null): string {
  if (firstName) return `${firstName} ${lastName || ''}`.trim()
  return name || 'Unknown'
}

/* ── Stat Card (matching interpreter dashboard) ── */

function StatCard({ num, label, href }: { num: number; label: string; href: string }) {
  const [hover, setHover] = useState(false)
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: 'var(--card-bg)',
          border: `1px solid ${hover ? 'rgba(157,135,255,0.3)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '20px',
          transition: 'border-color 0.18s, transform 0.18s', cursor: 'pointer',
          transform: hover ? 'translateY(-2px)' : 'none',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
          flex: 1,
        }}
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.04em', color: '#9d87ff' }}>{num}</div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 4 }}>{label}</div>
      </div>
    </Link>
  )
}

/* ── Main Component ── */

export default function DeafDashboardOverview() {
  const [firstName, setFirstName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Stat counts
  const [activeRequests, setActiveRequests] = useState(0)
  const [prefCount, setPrefCount] = useState(0)
  const [secCount, setSecCount] = useState(0)
  const [circleCount, setCircleCount] = useState(0)

  // Recent data
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [prefInterpreters, setPrefInterpreters] = useState<PrefInterpreter[]>([])

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) { setLoading(false); return }

      // Get Deaf profile
      let deafProfileId: string | null = null
      const { data: byId } = await supabase
        .from('deaf_profiles')
        .select('id, first_name')
        .eq('id', user.id)
        .maybeSingle()

      if (byId) {
        deafProfileId = byId.id
        setFirstName(byId.first_name)
      } else {
        const { data: byUserId } = await supabase
          .from('deaf_profiles')
          .select('id, first_name')
          .eq('user_id', user.id)
          .maybeSingle()
        if (byUserId) {
          deafProfileId = byUserId.id
          setFirstName(byUserId.first_name)
        }
      }

      if (!deafProfileId) { setLoading(false); return }

      // Fetch all stats in parallel
      const [
        activeRes,
        prefRes,
        secRes,
        circleRes,
        dhhBookingsRes,
        prefInterpRes,
      ] = await Promise.all([
        // Active requests count
        supabase
          .from('booking_dhh_clients')
          .select('booking_id', { count: 'exact', head: true })
          .eq('dhh_user_id', user.id),

        // Preferred interpreters count
        supabase
          .from('deaf_roster')
          .select('id', { count: 'exact', head: true })
          .eq('deaf_user_id', deafProfileId)
          .eq('tier', 'preferred'),

        // Secondary tier count
        supabase
          .from('deaf_roster')
          .select('id', { count: 'exact', head: true })
          .eq('deaf_user_id', deafProfileId)
          .eq('tier', 'approved'),

        // Trusted circle count
        supabase
          .from('trusted_deaf_circle')
          .select('id', { count: 'exact', head: true })
          .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
          .eq('status', 'accepted'),

        // DHH bookings (for recent requests)
        supabase
          .from('booking_dhh_clients')
          .select('booking_id')
          .eq('dhh_user_id', user.id),

        // Preferred interpreters (for preview)
        supabase
          .from('deaf_roster')
          .select('interpreter_id, tier, notes')
          .eq('deaf_user_id', deafProfileId)
          .eq('tier', 'preferred')
          .limit(3),
      ])

      // Set stat counts
      if (!activeRes.error) setActiveRequests(activeRes.count ?? 0)
      if (!prefRes.error) setPrefCount(prefRes.count ?? 0)
      if (!secRes.error) setSecCount(secRes.count ?? 0)
      if (!circleRes.error) setCircleCount(circleRes.count ?? 0)

      // Fetch recent bookings (two-step)
      if (!dhhBookingsRes.error && dhhBookingsRes.data && dhhBookingsRes.data.length > 0) {
        const bookingIds = dhhBookingsRes.data.map(b => b.booking_id)
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from('bookings')
          .select('id, title, date, time_start, time_end, format, location, status')
          .in('id', bookingIds)
          .order('date', { ascending: false })
          .limit(3)

        if (!bookingsErr && bookingsData) {
          setRecentBookings(bookingsData as RecentBooking[])
        } else if (bookingsErr) {
          console.error('[dhh-overview] bookings fetch error:', bookingsErr.message)
        }
      }

      // Fetch preferred interpreter profiles (two-step)
      if (!prefInterpRes.error && prefInterpRes.data && prefInterpRes.data.length > 0) {
        const interpIds = prefInterpRes.data.map(p => p.interpreter_id)

        const [profilesRes, certsRes] = await Promise.all([
          supabase
            .from('interpreter_profiles')
            .select('id, first_name, last_name, name, photo_url')
            .in('id', interpIds),
          supabase
            .from('interpreter_certifications')
            .select('interpreter_id, name')
            .in('interpreter_id', interpIds),
        ])

        if (!profilesRes.error && profilesRes.data) {
          const certsMap: Record<string, string[]> = {}
          for (const c of certsRes.data || []) {
            if (!certsMap[c.interpreter_id]) certsMap[c.interpreter_id] = []
            certsMap[c.interpreter_id].push(c.name)
          }

          const mapped: PrefInterpreter[] = profilesRes.data.map(p => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            name: p.name,
            photo_url: p.photo_url,
            certs: certsMap[p.id] || [],
          }))
          setPrefInterpreters(mapped)
        }
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const displayName = firstName || 'there'

  if (loading) {
    return (
      <div style={{ padding: '60px 32px', color: 'var(--muted)', textAlign: 'center' }}>
        Loading your dashboard...
      </div>
    )
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.6rem', margin: '0 0 6px' }}>
          Welcome back, {displayName}.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>Here&apos;s a snapshot of your activity on signpost.</p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32, alignItems: 'stretch' }}>
        <StatCard num={activeRequests} label="Active Requests" href="/dhh/dashboard/requests" />
        <StatCard num={prefCount} label="Preferred Interpreters" href="/dhh/dashboard/interpreters" />
        <StatCard num={secCount} label="Secondary Tier" href="/dhh/dashboard/interpreters" />
        <StatCard num={circleCount} label="Trusted Circle" href="/dhh/dashboard/circle" />
      </div>

      {/* Two-column layout */}
      <div className="dhh-overview-columns" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* LEFT: Recent Requests */}
        <div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#9d87ff', marginBottom: 12,
          }}>
            Recent Requests
          </div>

          {recentBookings.length === 0 ? (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '32px 24px',
              color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
            }}>
              No requests yet. When someone books an interpreter for you, it will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentBookings.map(booking => {
                const formatLabel = booking.format === 'remote' ? 'Remote' : booking.format === 'in_person' ? 'In-person' : booking.format || 'TBD'
                const formatColor = booking.format === 'remote' ? 'rgba(0,229,255,0.12)' : 'rgba(157,135,255,0.12)'
                const formatBorder = booking.format === 'remote' ? 'rgba(0,229,255,0.3)' : 'rgba(157,135,255,0.3)'
                const formatTextColor = booking.format === 'remote' ? 'var(--accent)' : '#9d87ff'

                const statusColor =
                  booking.status === 'open' ? { bg: 'rgba(255,165,0,0.12)', border: 'rgba(255,165,0,0.3)', text: '#ffa500' }
                  : booking.status === 'filled' ? { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', text: '#34d399' }
                  : booking.status === 'completed' ? { bg: 'rgba(0,229,255,0.1)', border: 'rgba(0,229,255,0.3)', text: 'var(--accent)' }
                  : booking.status === 'cancelled' ? { bg: 'rgba(255,77,109,0.1)', border: 'rgba(255,77,109,0.3)', text: '#ff8099' }
                  : { bg: 'rgba(255,255,255,0.06)', border: 'var(--border)', text: 'var(--muted)' }

                return (
                  <div key={booking.id} style={{
                    background: 'var(--card-bg)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '18px 20px',
                    transition: 'border-color 0.15s',
                  }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(157,135,255,0.3)')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    {/* Date + time header */}
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                      {formatDate(booking.date)} &middot; {formatTime(booking.time_start, booking.time_end)}
                    </div>

                    {/* Title */}
                    <div style={{ color: 'var(--muted)', fontSize: '0.84rem', marginBottom: 10 }}>
                      {booking.title || 'Booking Request'}
                    </div>

                    {/* Badges row */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        background: formatColor, border: `1px solid ${formatBorder}`,
                        color: formatTextColor, borderRadius: 20, padding: '2px 10px',
                        fontSize: '0.72rem', fontWeight: 600,
                      }}>
                        {formatLabel}
                      </span>
                      <span style={{
                        background: statusColor.bg, border: `1px solid ${statusColor.border}`,
                        color: statusColor.text, borderRadius: 20, padding: '2px 10px',
                        fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
                      }}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                )
              })}

              <Link
                href="/dhh/dashboard/requests"
                style={{
                  color: '#9d87ff', fontSize: '0.85rem', fontWeight: 600,
                  textDecoration: 'none', display: 'inline-block', marginTop: 4,
                }}
              >
                View all requests &#8594;
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT: Preferred Interpreters */}
        <div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#9d87ff', marginBottom: 12,
          }}>
            Preferred Interpreters
          </div>

          {prefInterpreters.length === 0 ? (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '32px 24px',
              color: 'var(--muted)', fontSize: '0.88rem', textAlign: 'center',
            }}>
              <div style={{ marginBottom: 12 }}>You haven&apos;t added any preferred interpreters yet.</div>
              <Link
                href="/directory"
                className="btn-primary"
                style={{ textDecoration: 'none', display: 'inline-block', padding: '9px 20px', fontSize: '0.85rem' }}
              >
                + Browse the directory
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prefInterpreters.map(interp => {
                const name = getDisplayName(interp.first_name, interp.last_name, interp.name)
                const initials = getInitials(interp.first_name, interp.last_name, interp.name)
                const certStr = interp.certs.length > 0 ? interp.certs.join(', ') : 'Certified Interpreter'

                return (
                  <div key={interp.id} style={{
                    background: 'var(--card-bg)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '16px 18px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'border-color 0.15s',
                  }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(157,135,255,0.3)')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #9d87ff, #00e5ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.82rem', color: '#fff',
                    }}>
                      {initials}
                    </div>

                    {/* Name + certs */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 2 }}>{certStr}</div>
                    </div>

                    {/* Request button */}
                    <Link
                      href="/dhh/dashboard/request"
                      style={{
                        background: 'rgba(157,135,255,0.1)', border: '1px solid rgba(157,135,255,0.3)',
                        color: '#9d87ff', borderRadius: 8, padding: '6px 14px',
                        fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none',
                        flexShrink: 0, transition: 'background 0.15s',
                      }}
                    >
                      Request &#8594;
                    </Link>
                  </div>
                )
              })}

              <Link
                href="/directory"
                style={{
                  color: '#9d87ff', fontSize: '0.85rem', fontWeight: 600,
                  textDecoration: 'none', display: 'inline-block', marginTop: 4,
                }}
              >
                + Browse Interpreters to Add
              </Link>
            </div>
          )}
        </div>
      </div>

      <DashMobileStyles />

      {/* Responsive styles for two-column layout */}
      <style>{`
        @media (max-width: 768px) {
          .dhh-overview-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
