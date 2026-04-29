import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Check admin status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const email = user.email || ''
  const namePart = email.split('@')[0] || 'Admin'
  const userName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
  const userInitials = userName.slice(0, 2).toUpperCase()

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <AdminSidebar userName={userName} userInitials={userInitials} />
      <main className="admin-main" style={{ flex: 1, overflowY: 'auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>
      <style>{`
        @media (max-width: 768px) {
          .admin-layout { flex-direction: column !important; }
        }
      `}</style>
    </div>
  )
}
