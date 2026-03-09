import DhhDashboardSidebar from '@/components/layout/DhhDashboardSidebar'
import { createClient } from '@/lib/supabase/server'

export default async function DhhDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = 'User'
  let userInitials = 'U'

  if (user) {
    // deaf_profiles has `name` (single field), keyed by id = auth.uid()
    const { data } = await supabase
      .from('deaf_profiles')
      .select('name')
      .eq('id', user.id)
      .single()
    if (data?.name) {
      userName = data.name
      const parts = data.name.split(' ')
      userInitials = parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : (parts[0]?.[0] || 'U').toUpperCase()
    }
  }

  return (
    <div className="dash-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <DhhDashboardSidebar userName={userName} userInitials={userInitials} />
      <main className="dash-main" style={{ flex: 1, overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      <style>{`
        @media (max-width: 768px) {
          .dash-layout { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}
