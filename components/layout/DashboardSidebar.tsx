'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  badge?: number;
}

interface Props {
  items: NavItem[];
  role: 'interpreter' | 'deaf' | 'requester';
  userName?: string;
}

export default function DashboardSidebar({ items, role, userName }: Props) {
  const pathname = usePathname();

  const accentColor = role === 'deaf' ? 'var(--accent2)' : 'var(--accent)';

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        minHeight: 'calc(100vh - 57px)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        position: 'sticky',
        top: 57,
        height: 'calc(100vh - 57px)',
        overflowY: 'auto',
      }}
    >
      {/* User info */}
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: role === 'deaf' ? 'rgba(157,135,255,0.1)' : 'rgba(0,229,255,0.1)',
            border: `1px solid ${role === 'deaf' ? 'rgba(157,135,255,0.3)' : 'rgba(0,229,255,0.3)'}`,
            borderRadius: '100px',
            padding: '4px 12px',
            fontSize: '0.72rem',
            color: accentColor,
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          {role === 'interpreter' ? 'Interpreter' : role === 'deaf' ? 'D/HH User' : 'Requester'}
        </div>
        {userName && (
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
            {userName}
          </div>
        )}
      </div>

      {/* Nav items */}
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              background: isActive ? (role === 'deaf' ? 'rgba(157,135,255,0.1)' : 'rgba(0,229,255,0.08)') : 'none',
              border: isActive ? `1px solid ${role === 'deaf' ? 'rgba(157,135,255,0.25)' : 'rgba(0,229,255,0.2)'}` : '1px solid transparent',
              color: isActive ? accentColor : 'var(--muted)',
              fontSize: '0.88rem',
              fontWeight: isActive ? 500 : 400,
              transition: 'all 0.15s',
            }}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                style={{
                  background: accentColor,
                  color: '#000',
                  borderRadius: '100px',
                  padding: '1px 7px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  minWidth: 20,
                  textAlign: 'center',
                }}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      {/* Sign out */}
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <SignOutButton />
      </div>
    </aside>
  );
}

function SignOutButton() {
  async function handleSignOut() {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        width: '100%',
        padding: '9px 12px',
        borderRadius: '8px',
        background: 'none',
        border: '1px solid var(--border)',
        color: 'var(--muted)',
        fontSize: '0.85rem',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, color 0.15s',
      }}
    >
      Sign out
    </button>
  );
}
