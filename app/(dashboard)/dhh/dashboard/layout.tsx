import DhhDashboardSidebar from '@/components/layout/DhhDashboardSidebar'
import AslGuidePopup from '@/components/dashboard/dhh/AslGuidePopup'
import PrelaunchNotice from '@/components/prelaunch/PrelaunchNotice'
import { createClient } from '@/lib/supabase/server'

export default async function DhhDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = 'User'
  let userInitials = 'U'
  let dismissedPrelaunchAt: string | null = null

  if (user) {
    const { data } = await supabase
      .from('deaf_profiles')
      .select('first_name, last_name, name, dismissed_prelaunch_notice_at')
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
    if (data) {
      dismissedPrelaunchAt = data.dismissed_prelaunch_notice_at ?? null
    }
  }

  return (
    <>
      <div className="dash-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <DhhDashboardSidebar userName={userName} userInitials={userInitials} />
        <main className="dash-main" style={{ flex: 1, overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 32px 0' }}>
              <PrelaunchNotice role="dhh" dismissedAt={dismissedPrelaunchAt} />
            </div>
            {children}
          </div>
        </main>
        <AslGuidePopup />
        <style>{`
          @media (max-width: 768px) {
            .dash-layout { flex-direction: column !important; }
          }
        `}</style>
      </div>
    </>
  )
}
