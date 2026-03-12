'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
}

function DeleteModal({ user, onConfirm, onCancel, deleting }: {
  user: User
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: 32, maxWidth: 440, width: '100%',
        }}
      >
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
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
          Delete User
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6, textAlign: 'center', marginBottom: 24 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{user.name || user.email}</strong>? This will permanently remove their account and all associated data. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'none',
              color: 'var(--muted)', fontSize: '0.88rem', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 8,
              border: 'none', background: 'var(--accent3)',
              color: '#fff', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? 'Deleting...' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsersClient({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
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

  async function changeStatus(userId: string, profileId: string | null, role: string, newStatus: string) {
    if (!profileId || role !== 'interpreter') return
    setUpdating(userId)
    const supabase = createClient()
    await supabase
      .from('interpreter_profiles')
      .update({ status: newStatus })
      .eq('id', profileId)
    router.refresh()
    setUpdating(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.id }),
      })
      if (res.ok) {
        setToast('User deleted.')
        setTimeout(() => setToast(null), 3000)
        router.refresh()
      } else {
        const data = await res.json()
        setToast(`Error: ${data.error || 'Delete failed'}`)
        setTimeout(() => setToast(null), 5000)
      }
    } catch {
      setToast('Error: Network request failed')
      setTimeout(() => setToast(null), 5000)
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)', fontSize: '0.85rem',
    fontFamily: "'DM Sans', sans-serif",
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
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
            flex: 1, minWidth: 200, padding: '8px 14px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text)', fontSize: '0.85rem',
            fontFamily: "'DM Sans', sans-serif",
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
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Signup Date', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontFamily: "'Syne', sans-serif", fontWeight: 700,
                    fontSize: '0.72rem', textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--muted)',
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
                        {u.role === 'interpreter' && u.profileId && (
                          <a
                            href={`/directory/${u.profileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: ORANGE, fontSize: '0.8rem', textDecoration: 'none' }}
                          >
                            View
                          </a>
                        )}
                        {u.role === 'interpreter' && u.profileId && u.status !== 'suspended' && (
                          <button
                            onClick={() => changeStatus(u.id, u.profileId, u.role, 'suspended')}
                            disabled={updating === u.id}
                            style={{
                              padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,107,133,0.3)',
                              background: 'none', color: 'var(--accent3)', fontSize: '0.75rem',
                              cursor: 'pointer', opacity: updating === u.id ? 0.5 : 1,
                            }}
                          >
                            Suspend
                          </button>
                        )}
                        {u.role === 'interpreter' && u.profileId && u.status === 'suspended' && (
                          <button
                            onClick={() => changeStatus(u.id, u.profileId, u.role, 'approved')}
                            disabled={updating === u.id}
                            style={{
                              padding: '3px 10px', borderRadius: 6, border: `1px solid ${ORANGE}44`,
                              background: 'none', color: ORANGE, fontSize: '0.75rem',
                              cursor: 'pointer', opacity: updating === u.id ? 0.5 : 1,
                            }}
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(u)}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot delete your own account' : `Delete ${u.name}`}
                          style={{
                            padding: '3px 10px', borderRadius: 6,
                            border: '1px solid rgba(255,107,133,0.3)',
                            background: 'none', color: 'var(--accent3)', fontSize: '0.75rem',
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                            opacity: isSelf ? 0.3 : 1,
                            fontFamily: "'DM Sans', sans-serif",
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
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1100,
          padding: '12px 20px', borderRadius: 8,
          background: toast.startsWith('Error') ? 'rgba(255,107,133,0.9)' : 'rgba(0,229,255,0.9)',
          color: toast.startsWith('Error') ? '#fff' : '#000',
          fontSize: '0.88rem', fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
