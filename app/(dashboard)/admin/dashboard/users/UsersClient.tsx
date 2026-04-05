'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/components/ui/Toast'

const ORANGE = '#ff7e45'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  created_at: string
  profileId: string | null
  isAdmin: boolean
  suspended?: boolean
}

/* ------------------------------------------------------------------ */
/*  Delete Modal (two-step with "DELETE" confirmation)                 */
/* ------------------------------------------------------------------ */
function DeleteModal({ user, onConfirm, onCancel, deleting }: {
  user: User; onConfirm: () => void; onCancel: () => void; deleting: boolean
}) {
  const [typed, setTyped] = useState('')
  const confirmed = typed === 'DELETE'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: 32, maxWidth: 440, width: '100%',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
          background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="var(--accent3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 11v6M14 11v6" stroke="var(--accent3)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.1rem', fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
          Permanently Delete User
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, textAlign: 'center', marginBottom: 16 }}>
          Permanently delete <strong style={{ color: 'var(--text)' }}>{user.name || user.email}</strong> and all their data? This cannot be undone.
        </p>
        <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 6 }}>
          Type <strong style={{ color: 'var(--text)' }}>DELETE</strong> to confirm
        </label>
        <input
          type="text"
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder="DELETE"
          autoFocus
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text)', fontSize: '0.9rem', marginBottom: 20,
            fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} disabled={deleting} style={{
            flex: 1, padding: '10px 16px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'none',
            color: 'var(--muted)', fontSize: '0.88rem', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={!confirmed || deleting} style={{
            flex: 1, padding: '10px 16px', borderRadius: 10,
            border: 'none', background: confirmed ? 'var(--accent3)' : 'rgba(255,107,133,0.3)',
            color: '#fff', fontSize: '0.88rem', fontWeight: 600,
            cursor: confirmed ? 'pointer' : 'not-allowed', fontFamily: "'Inter', sans-serif",
            opacity: deleting ? 0.6 : 1,
          }}>
            {deleting ? 'Deleting...' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Confirm Modal (generic)                                           */
/* ------------------------------------------------------------------ */
function ConfirmModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading }: {
  title: string; message: string; confirmLabel: string; confirmColor?: string
  onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', padding: 32, maxWidth: 420, width: '100%',
      }}>
        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>
          {title}
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 24 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} disabled={loading} style={{
            flex: 1, padding: '10px 16px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'none',
            color: 'var(--muted)', fontSize: '0.88rem', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
            background: confirmColor || ORANGE, color: '#fff',
            fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  User Detail Panel (slide-out)                                     */
/* ------------------------------------------------------------------ */
interface UserDetailData {
  userProfile: Record<string, unknown>
  interpreterProfile: Record<string, unknown> | null
  deafProfile: Record<string, unknown> | null
  requesterProfile: Record<string, unknown> | null
  authEmail: string
}

function ProfileCard({ title, accentColor, data }: { title: string; accentColor: string; data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '')
  return (
    <div style={{
      background: '#111118', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      padding: '16px 20px', marginBottom: 12,
    }}>
      <h4 style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.78rem',
        textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor, marginBottom: 12,
      }}>
        {title}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
        {entries.map(([key, val]) => (
          <div key={key}>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              {key.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text)', wordBreak: 'break-word' }}>
              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UserDetailPanel({ userId, onClose, onAction }: {
  userId: string; onClose: () => void; onAction: () => void
}) {
  const [data, setData] = useState<UserDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirm, setConfirm] = useState<{ title: string; message: string; label: string; color?: string; action: () => Promise<void> } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/user-detail?userId=${userId}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [userId])

  // Fetch on mount
  useEffect(() => { fetchDetail() }, [fetchDetail])

  const callAction = async (action: string, role?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, role }),
      })
      if (res.ok) {
        setToast({ message: 'Action completed.', type: 'success' })
        await fetchDetail()
        onAction()
      } else {
        const d = await res.json()
        setToast({ message: d.error || 'Action failed', type: 'error' })
      }
    } catch {
      setToast({ message: 'Network error', type: 'error' })
    }
    setActionLoading(false)
    setConfirm(null)
  }

  if (!data && loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'flex-end',
      }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{
          width: 520, maxWidth: '100vw', background: 'var(--surface)',
          borderLeft: '1px solid var(--border)', height: '100%', overflowY: 'auto', padding: '32px 24px',
        }}>
          <p style={{ color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const up = data.userProfile
  const ip = data.interpreterProfile
  const dp = data.deafProfile
  const rp = data.requesterProfile
  const isSuspended = !!(up.suspended)
  const isAdmin = !!(up.is_admin)
  const hasInterpreter = !!ip
  const hasDeaf = !!dp
  const hasRequester = !!rp
  const userName = (ip && `${ip.first_name || ''} ${ip.last_name || ''}`.trim()) ||
    (dp && `${dp.first_name || ''} ${dp.last_name || ''}`.trim()) ||
    (rp && String(rp.name || '')) ||
    String(up.email || '').split('@')[0] || 'User'

  const allRoles = ['interpreter', 'deaf', 'requester'] as const
  const existingRoles = [
    ...(hasInterpreter ? ['interpreter'] : []),
    ...(hasDeaf ? ['deaf'] : []),
    ...(hasRequester ? ['requester'] : []),
  ]
  const missingRoles = allRoles.filter(r => !existingRoles.includes(r))

  const btnStyle = (color: string, outline = true): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    border: outline ? `1px solid ${color}44` : 'none',
    background: outline ? 'none' : color,
    color: outline ? color : '#fff',
    opacity: actionLoading ? 0.5 : 1,
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 520, maxWidth: '100vw', background: 'var(--surface)',
        borderLeft: '1px solid var(--border)', height: '100%', overflowY: 'auto', padding: '32px 24px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.3rem', fontWeight: 650, marginBottom: 4 }}>
              {userName}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>
              {String(up.email || data.authEmail)}
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {existingRoles.map(r => (
                <span key={r} style={{
                  padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                  background: r === 'interpreter' ? 'rgba(0,229,255,0.1)' : r === 'deaf' ? 'rgba(157,135,255,0.1)' : 'rgba(255,107,43,0.1)',
                  color: r === 'interpreter' ? 'var(--accent)' : r === 'deaf' ? 'var(--accent2)' : ORANGE,
                }}>
                  {r}
                </span>
              ))}
              {isAdmin && (
                <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: `${ORANGE}22`, color: ORANGE }}>
                  ADMIN
                </span>
              )}
              {isSuspended && (
                <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(255,107,133,0.15)', color: 'var(--accent3)' }}>
                  SUSPENDED
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.3rem', cursor: 'pointer',
            minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span aria-hidden="true">&#x2715;</span>
          </button>
        </div>

        {/* Action buttons row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {/* Suspend / Unsuspend */}
          {isSuspended ? (
            <button
              disabled={actionLoading}
              onClick={() => setConfirm({
                title: 'Unsuspend User',
                message: `Unsuspend ${userName}? They will be able to use the platform again.`,
                label: 'Unsuspend',
                color: ORANGE,
                action: () => callAction('unsuspend'),
              })}
              style={btnStyle(ORANGE)}
            >
              Unsuspend
            </button>
          ) : (
            <button
              disabled={actionLoading}
              onClick={() => setConfirm({
                title: 'Suspend User',
                message: `Suspend ${userName}? They will not be able to use the platform while suspended.`,
                label: 'Suspend',
                color: 'var(--accent3)',
                action: () => callAction('suspend'),
              })}
              style={btnStyle('var(--accent3)')}
            >
              Suspend
            </button>
          )}

          {/* Toggle Admin */}
          {isAdmin ? (
            <button
              disabled={actionLoading}
              onClick={() => setConfirm({
                title: 'Remove Admin Access',
                message: `Remove admin access from ${userName}? They will no longer be able to access the admin dashboard.`,
                label: 'Remove Admin',
                color: 'var(--accent3)',
                action: () => callAction('toggle_admin'),
              })}
              style={btnStyle('var(--accent3)')}
            >
              Remove Admin
            </button>
          ) : (
            <button
              disabled={actionLoading}
              onClick={() => setConfirm({
                title: 'Grant Admin Access',
                message: `Grant admin access to ${userName}? They will be able to access the admin dashboard and manage all users.`,
                label: 'Grant Admin',
                color: ORANGE,
                action: () => callAction('toggle_admin'),
              })}
              style={btnStyle(ORANGE)}
            >
              Grant Admin
            </button>
          )}
        </div>

        {/* Profile cards */}
        <ProfileCard title="User Profile" accentColor={ORANGE} data={{
          id: String(up.id || ''),
          role: String(up.role || ''),
          email: String(up.email || data.authEmail || ''),
          is_admin: isAdmin ? 'Yes' : 'No',
          suspended: isSuspended ? 'Yes' : 'No',
          created_at: up.created_at ? new Date(String(up.created_at)).toLocaleString() : '',
        }} />

        {ip && (
          <ProfileCard title="Interpreter Profile" accentColor="var(--accent)" data={{
            name: `${ip.first_name || ''} ${ip.last_name || ''}`.trim(),
            status: String(ip.status || ''),
            email: String(ip.email || ''),
            city: String(ip.city || ''),
            state: String(ip.state || ''),
            country: String(ip.country || ''),
            vanity_slug: String(ip.vanity_slug || ''),
          }} />
        )}

        {dp && (
          <ProfileCard title="Deaf/DB/HH Profile" accentColor="var(--accent2)" data={{
            name: `${dp.first_name || ''} ${dp.last_name || ''}`.trim(),
            email: String(dp.email || ''),
            city: String(dp.city || ''),
            state: String(dp.state || ''),
            country: String(dp.country || ''),
            vanity_slug: String(dp.vanity_slug || ''),
            comm_prefs: dp.comm_prefs || '',
          }} />
        )}

        {rp && (
          <ProfileCard title="Requester Profile" accentColor={ORANGE} data={{
            name: String(rp.name || ''),
            org_name: String(rp.org_name || ''),
            org_type: String(rp.org_type || ''),
            city: String(rp.city || ''),
            country: String(rp.country || ''),
            stripe_customer_id: String(rp.stripe_customer_id || ''),
          }} />
        )}

        {/* Role management */}
        <div style={{
          background: '#111118', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          padding: '16px 20px', marginBottom: 12,
        }}>
          <h4 style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.78rem',
            textTransform: 'uppercase', letterSpacing: '0.08em', color: ORANGE, marginBottom: 12,
          }}>
            Role Management
          </h4>

          {/* Existing roles with remove option */}
          {existingRoles.map(r => (
            <div key={r} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text)', textTransform: 'capitalize' }}>
                {r === 'deaf' ? 'Deaf/DB/HH' : r}
              </span>
              <button
                disabled={actionLoading}
                onClick={() => {
                  const roleLabel = r === 'deaf' ? 'Deaf/DB/HH' : r
                  const dataWarning = r === 'interpreter'
                    ? 'interpreter profile, certifications, rates, and availability'
                    : r === 'deaf'
                    ? 'Deaf profile, roster, and preferences'
                    : 'requester profile and draft bookings'
                  setConfirm({
                    title: `Remove ${roleLabel} Role`,
                    message: `This will delete all ${roleLabel} data for ${userName} including their ${dataWarning}.`,
                    label: `Remove ${roleLabel}`,
                    color: 'var(--accent3)',
                    action: () => callAction('remove_role', r),
                  })
                }}
                style={btnStyle('var(--accent3)')}
              >
                Remove
              </button>
            </div>
          ))}

          {/* Missing roles with add option */}
          {missingRoles.map(r => (
            <div key={r} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
                {r === 'deaf' ? 'Deaf/DB/HH' : r}
              </span>
              <button
                disabled={actionLoading}
                onClick={() => {
                  const roleLabel = r === 'deaf' ? 'Deaf/DB/HH' : r
                  setConfirm({
                    title: `Add ${roleLabel} Role`,
                    message: `Add the ${roleLabel} role to ${userName}? A new profile will be created with data from their existing profiles.`,
                    label: `Add ${roleLabel}`,
                    color: ORANGE,
                    action: () => callAction('add_role', r),
                  })
                }}
                style={btnStyle(ORANGE)}
              >
                Add
              </button>
            </div>
          ))}
        </div>

        {/* Confirmation modal */}
        {confirm && (
          <ConfirmModal
            title={confirm.title}
            message={confirm.message}
            confirmLabel={confirm.label}
            confirmColor={confirm.color}
            onConfirm={confirm.action}
            onCancel={() => setConfirm(null)}
            loading={actionLoading}
          />
        )}

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Users Table                                                  */
/* ------------------------------------------------------------------ */
export default function UsersClient({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewUserId, setViewUserId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (statusFilter !== 'all' && u.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  })

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.id, action: 'delete' }),
      })
      if (res.ok) {
        setToast({ message: 'User deleted.', type: 'success' })
        router.refresh()
      } else {
        const data = await res.json()
        setToast({ message: data.error || 'Delete failed', type: 'error' })
      }
    } catch {
      setToast({ message: 'Network request failed', type: 'error' })
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  async function handleSuspendToggle(u: User) {
    const action = u.status === 'suspended' ? 'unsuspend' : 'suspend'
    try {
      const res = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.id, action }),
      })
      if (res.ok) {
        setToast({ message: action === 'suspend' ? 'User suspended.' : 'User unsuspended.', type: 'success' })
        router.refresh()
      } else {
        const data = await res.json()
        setToast({ message: data.error || 'Action failed', type: 'error' })
      }
    } catch {
      setToast({ message: 'Network error', type: 'error' })
    }
  }

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
  }

  return (
    <div className="admin-users-content" style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 650, marginBottom: 8 }}>
        Users
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24 }}>
        {filtered.length} user{filtered.length !== 1 ? 's' : ''} total
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text)', fontSize: '0.85rem',
            fontFamily: "'Inter', sans-serif",
          }}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Roles</option>
          <option value="interpreter">Interpreter</option>
          <option value="deaf">Deaf/DB/HH</option>
          <option value="requester">Requester</option>
          <option value="org">Organization</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-scroll-hint" style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 4 }}>Scroll right for more &rarr;</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <div className="table-scroll-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Signup Date', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontFamily: "'Inter', sans-serif", fontWeight: 700,
                    fontSize: '0.7rem', textTransform: 'uppercase',
                    letterSpacing: '0.1em', color: 'var(--muted)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const isSelf = u.id === currentUserId
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text)' }}>
                      {u.name}
                      {u.isAdmin && (
                        <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, background: `${ORANGE}22`, color: ORANGE }}>
                          ADMIN
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)' }}>{u.email}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                        background: u.role === 'interpreter' ? 'rgba(0,229,255,0.1)' : u.role === 'deaf' ? 'rgba(157,135,255,0.1)' : 'rgba(255,107,43,0.1)',
                        color: u.role === 'interpreter' ? 'var(--accent)' : u.role === 'deaf' ? 'var(--accent2)' : ORANGE,
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                        background: u.status === 'suspended' ? 'rgba(255,107,133,0.15)' : u.status === 'approved' ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.05)',
                        color: u.status === 'suspended' ? 'var(--accent3)' : u.status === 'approved' ? 'var(--accent)' : 'var(--muted)',
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', fontSize: '0.8rem' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          onClick={() => setViewUserId(u.id)}
                          style={{
                            padding: '3px 10px', borderRadius: 6, border: `1px solid ${ORANGE}44`,
                            background: 'none', color: ORANGE, fontSize: '0.75rem',
                            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          View
                        </button>
                        {u.status === 'suspended' ? (
                          <button
                            onClick={() => handleSuspendToggle(u)}
                            style={{
                              padding: '3px 10px', borderRadius: 6, border: `1px solid ${ORANGE}44`,
                              background: 'none', color: ORANGE, fontSize: '0.75rem',
                              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspendToggle(u)}
                            style={{
                              padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,107,133,0.3)',
                              background: 'none', color: 'var(--accent3)', fontSize: '0.75rem',
                              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(u)}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot delete your own account' : `Delete ${u.name}`}
                          style={{
                            padding: '3px 10px', borderRadius: 6,
                            border: 'none', background: 'none',
                            color: 'var(--accent3)', fontSize: '0.75rem',
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                            opacity: isSelf ? 0.3 : 1,
                            fontFamily: "'Inter', sans-serif",
                            textDecoration: 'underline',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User detail slide-out */}
      {viewUserId && (
        <UserDetailPanel
          userId={viewUserId}
          onClose={() => setViewUserId(null)}
          onAction={() => router.refresh()}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-users-content { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  )
}
