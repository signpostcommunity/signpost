import RequesterDashboardSidebar from '@/components/layout/RequesterDashboardSidebar'
import { createClient } from '@/lib/supabase/server'

export default async function RequesterDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = 'User'
  let userInitials = 'U'
  let userSubtitle = 'Requester'

  if (user) {
    const { data } = await supabase
      .from('requester_profiles')
      .select('first_name, last_name, name, org_name, requester_type')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()
    if (data?.first_name) {
      userName = `${data.first_name} ${data.last_name || ''}`.trim()
      userInitials = `${data.first_name[0] || ''}${data.last_name?.[0] || ''}`.toUpperCase()
    } else if (data?.name) {
      userName = data.name
      const parts = data.name.split(' ')
      userInitials = parts.map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
    }
    if (data?.org_name) {
      userSubtitle = data.org_name
    } else if (data?.requester_type === 'personal_event') {
      userSubtitle = 'Personal Event'
    } else {
      userSubtitle = 'Requester'
    }
  }

  return (
    <div className="dash-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <RequesterDashboardSidebar userName={userName} userInitials={userInitials} userSubtitle={userSubtitle} />
      <main className="dash-main" style={{ flex: 1, overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>
      <style>{`
        @media (max-width: 768px) {
          .dash-layout { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}
