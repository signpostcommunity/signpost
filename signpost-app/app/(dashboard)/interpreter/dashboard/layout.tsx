import DashboardSidebar from '@/components/layout/DashboardSidebar';

const NAV_ITEMS = [
  { href: '/interpreter/dashboard', label: 'Overview' },
  { href: '/interpreter/dashboard/inquiries', label: 'Inquiries', badge: 3 },
  { href: '/interpreter/dashboard/confirmed', label: 'Confirmed' },
  { href: '/interpreter/dashboard/inbox', label: 'Inbox', badge: 1 },
  { href: '/interpreter/dashboard/profile', label: 'My Profile' },
  { href: '/interpreter/dashboard/rates', label: 'Rate Profiles' },
  { href: '/interpreter/dashboard/availability', label: 'Availability' },
  { href: '/interpreter/dashboard/team', label: 'Team' },
  { href: '/interpreter/dashboard/client-lists', label: 'Client Lists' },
];

export default function InterpreterDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex' }}>
      <DashboardSidebar items={NAV_ITEMS} role="interpreter" userName="Sofia Reyes" />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 32px 64px' }}>
        {children}
      </main>
    </div>
  );
}
