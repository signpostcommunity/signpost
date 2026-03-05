'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/interpreter/dashboard', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2L14 6.5V14H10V10H6V14H2V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
    ],
  },
  {
    section: 'Bookings',
    items: [
      { label: 'Inquiries', href: '/interpreter/dashboard/inquiries', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, badge: 2 },
      { label: 'Confirmed', href: '/interpreter/dashboard/confirmed', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, badge: 3, badgeCyan: true },
      { label: 'Inbox', href: '/interpreter/dashboard/inbox', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 5l6 4.5L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, badge: 2 },
    ],
  },
  {
    section: 'My Profile',
    items: [
      { label: 'Edit Profile', href: '/interpreter/dashboard/profile', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
      { label: 'Rates & Terms', href: '/interpreter/dashboard/rates', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v1.5M8 9.5V11M6.5 7a1.5 1.5 0 1 1 3 0c0 1-1.5 1.5-1.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
      { label: 'Availability', href: '/interpreter/dashboard/availability', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
      { label: 'Preferred Team', href: '/interpreter/dashboard/team', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="4" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="3" cy="11" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="13" cy="11" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 5.5L4 9M10 5.5L12 9M5.5 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
      { label: 'Client Lists', href: '/interpreter/dashboard/client-lists', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 13.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10.5 7.5h4M12.5 5.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, badge: 1, badgeCyan: true },
    ],
  },
  {
    section: 'Account',
    items: [
      { label: 'Back to signpost', href: '/', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    ],
  },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div style={{
      width: 240, flexShrink: 0, background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#7b61ff,#00e5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#fff',
          }}>
            SR
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.92rem' }}>Sofia Reyes</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 2 }}>Interpreter</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map(group => (
          <div key={group.section}>
            <div style={{
              padding: '14px 20px 6px',
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: '0.62rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--muted)',
            }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = item.href === '/interpreter/dashboard'
                ? pathname === item.href
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 20px', textDecoration: 'none',
                    fontSize: '0.88rem', transition: 'all 0.15s',
                    color: active ? 'var(--accent)' : 'var(--muted)',
                    background: active ? 'rgba(0,229,255,0.06)' : 'transparent',
                    borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >
                  <span style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, minWidth: 18, height: 18,
                      borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 5px',
                      background: item.badgeCyan ? 'rgba(0,229,255,0.15)' : 'rgba(255,107,133,0.2)',
                      color: item.badgeCyan ? 'var(--accent)' : 'var(--accent3)',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}
