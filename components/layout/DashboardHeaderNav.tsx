'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DashboardHeaderNav({ portalPath }: { portalPath: string }) {
  const pathname = usePathname();

  // Persist last active portal role when user is on a dashboard route
  useEffect(() => {
    if (pathname.startsWith('/dhh')) {
      try { localStorage.setItem('signpost:lastRole', 'deaf') } catch {}
    } else if (pathname.startsWith('/request')) {
      try { localStorage.setItem('signpost:lastRole', 'requester') } catch {}
    } else if (pathname.startsWith('/interpreter')) {
      try { localStorage.setItem('signpost:lastRole', 'interpreter') } catch {}
    } else if (pathname.startsWith('/admin')) {
      try { localStorage.setItem('signpost:lastRole', 'admin') } catch {}
    }
  }, [pathname]);

  return (
    <div className="dash-header-links" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
      <Link href="/directory" className="nav-btn" style={{ textDecoration: 'none' }}>
        Browse Interpreter Directory
      </Link>
      <Link href={portalPath} className="btn-primary" style={{ textDecoration: 'none' }}>
        My Portal
      </Link>

      <style>{`
        .nav-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .nav-btn:hover { color: var(--text); background: var(--surface2); }
      `}</style>
    </div>
  );
}
