import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = 'Interpreter'
  let userInitials = 'IN'
  let userPhotoUrl = ''

  if (user) {
    const { data } = await supabase
      .from('interpreter_profiles')
      .select('first_name, last_name, photo_url')
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
  }

  return (
    <div className="dash-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <DashboardSidebar userName={userName} userInitials={userInitials} photoUrl={userPhotoUrl} />
      <main className="dash-main" style={{ flex: 1, overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="dash-content-container" style={{ maxWidth: 1120, margin: '0 auto', width: '100%' }}>
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
