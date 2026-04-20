import DashboardSidebar from '@/components/layout/DashboardSidebar'
import PrelaunchNotice from '@/components/prelaunch/PrelaunchNotice'
import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/supabase/cached-user'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const user = await getCachedUser()

  let userName = 'Interpreter'
  let userInitials = 'IN'
  let userPhotoUrl = ''
  let dismissedPrelaunchAt: string | null = null

  if (user) {
    const { data } = await supabase
      .from('interpreter_profiles')
      .select('first_name, last_name, photo_url, dismissed_prelaunch_notice_at')
      .eq('user_id', user.id)
      .single()
    if (data?.first_name) {
      userName = `${data.first_name} ${data.last_name || ''}`.trim()
      userInitials = `${data.first_name[0] || ''}${data.last_name?.[0] || ''}`.toUpperCase()
    } else {
      // Fallback to auth user_metadata (e.g. Google OAuth full_name)
      const meta = user.user_metadata
      const metaName = meta?.full_name || meta?.name || ''
      if (metaName) {
        userName = metaName
        const parts = metaName.split(' ')
        userInitials = `${parts[0]?.[0] || ''}${parts[parts.length - 1]?.[0] || ''}`.toUpperCase()
      }
    }
    if (data?.photo_url) {
      userPhotoUrl = data.photo_url
    }
    if (data) {
      dismissedPrelaunchAt = data.dismissed_prelaunch_notice_at ?? null
    }
  }

  return (
    <div className="dash-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <DashboardSidebar userName={userName} userInitials={userInitials} photoUrl={userPhotoUrl} />
      <main className="dash-main" style={{ flex: 1, overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="dash-content-container" style={{ maxWidth: 1120, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 32px 0' }}>
            <PrelaunchNotice role="interpreter" dismissedAt={dismissedPrelaunchAt} />
          </div>
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
