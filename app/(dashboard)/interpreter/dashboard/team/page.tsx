'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PageHeader, Avatar, GhostButton } from '@/components/dashboard/interpreter/shared'
import AddToListModal from '@/components/directory/AddToListModal'
import SendMessageModal from '@/components/messaging/SendMessageModal'
import PendingInvitesList from '@/components/invite/PendingInvitesList'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import Toast from '@/components/ui/Toast'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

// ── Types ─────────────────────────────────────────────────────────────────────

type TeamMember = {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  member_interpreter_id: string | null
  tier: string | null
  notes: string | null
  photo_url: string | null
  avatar_color: string | null
  user_id: string | null
}

// ── Section Header ────────────────────────────────────────────────────────────

function TierSection({ title, accentColor, members, onMoveTier, onRemove, onEdit, onMessage, targetTierLabel, storageKey }: {
  title: string
  accentColor: string
  members: TeamMember[]
  onMoveTier: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (member: TeamMember) => void
  onMessage: (member: TeamMember) => void
  targetTierLabel: string
  storageKey: string
}) {
  return (
    <CollapsibleSection
      storageKey={storageKey}
      accentColor={accentColor}
      header={
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 600,
          fontSize: '13px', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: accentColor,
        }}>
          {title}
        </span>
      }
    >
      {members.length === 0 ? (
        <div style={{
          padding: '24px 20px', textAlign: 'center', color: 'var(--muted)',
          fontSize: '0.85rem', background: 'var(--card-bg)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          fontStyle: 'italic',
        }}>
          No interpreters in this tier yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map(member => (
            <TeamCard
              key={member.id}
              member={member}
              onMoveTier={() => onMoveTier(member.id)}
              onRemove={() => onRemove(member.id)}
              onEdit={() => onEdit(member)}
              onMessage={() => onMessage(member)}
              moveLabel={targetTierLabel}
            />
          ))}
        </div>
      )}
    </CollapsibleSection>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [interpreterId, setInterpreterId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [messagingMember, setMessagingMember] = useState<TeamMember | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    id: string; name: string; currentTier: string; newTier: string;
  } | null>(null)
  const confirmModalRef = useFocusTrap(!!confirmModal)

  const fetchTeam = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from('interpreter_profiles')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) { setLoading(false); return }
    setInterpreterId(profile.id)

    const { data: members, error } = await supabase
      .from('interpreter_preferred_team')
      .select('id, first_name, last_name, email, status, member_interpreter_id, tier, notes, interpreter_profiles:member_interpreter_id(photo_url, avatar_color, user_id)')
      .eq('interpreter_id', profile.id)
      .order('id', { ascending: false })

    if (error) {
      console.error('Team fetch error:', error)
      setTeam([])
    } else {
      const mapped = (members || []).map((m: Record<string, unknown>) => {
        const joined = m.interpreter_profiles as { photo_url?: string; avatar_color?: string; user_id?: string } | null
        return {
          id: m.id as string,
          first_name: m.first_name as string,
          last_name: m.last_name as string,
          email: m.email as string,
          status: m.status as string,
          member_interpreter_id: m.member_interpreter_id as string | null,
          tier: (m.tier as string) || 'preferred',
          notes: (m.notes as string) || null,
          photo_url: joined?.photo_url || null,
          avatar_color: joined?.avatar_color || null,
          user_id: joined?.user_id || null,
        }
      })
      setTeam(mapped)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  async function removeMember(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('interpreter_preferred_team').delete().eq('id', id)
    if (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' })
      return
    }
    setToast({ message: 'Removed from your team.', type: 'success' })
    fetchTeam()
  }

  function requestMoveTier(id: string) {
    const member = team.find(m => m.id === id)
    if (!member) return
    const newTier = member.tier === 'preferred' ? 'secondary' : 'preferred'
    const name = `${member.first_name} ${member.last_name}`
    setConfirmModal({ id, name, currentTier: member.tier!, newTier })
  }

  async function confirmMoveTier() {
    if (!confirmModal) return
    const { id, newTier } = confirmModal
    setConfirmModal(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('interpreter_preferred_team')
      .update({ tier: newTier })
      .eq('id', id)
    if (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' })
      return
    }
    const label = newTier === 'preferred' ? 'Top Tier' : 'Secondary Tier'
    setToast({ message: `Moved to ${label}.`, type: 'success' })
    fetchTeam()
  }

  function openEdit(member: TeamMember) {
    setEditingMember(member)
  }

  const topTier = team.filter(m => m.tier === 'preferred')
  const secondaryTier = team.filter(m => m.tier === 'secondary')

  // Build interpreter shape for AddToListModal edit mode
  const editInterpreter = editingMember ? {
    id: editingMember.member_interpreter_id || editingMember.id,
    name: `${editingMember.first_name} ${editingMember.last_name}`,
    first_name: editingMember.first_name,
    last_name: editingMember.last_name,
    initials: `${(editingMember.first_name[0] || '').toUpperCase()}${(editingMember.last_name[0] || '').toUpperCase()}`,
    avatar_color: editingMember.avatar_color || 'linear-gradient(135deg, #7b61ff, #00e5ff)',
  } : null

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <PageHeader
        title="Preferred Team Interpreters"
        subtitle="Interpreters you love working with. Add them here so they're easy to team up with when a job calls for a partner."
      />

      <p style={{ color: 'var(--muted)', fontSize: '0.84rem', lineHeight: 1.6, marginBottom: 28 }}>
        <Link
          href="/invite"
          style={{
            color: 'var(--accent)', fontSize: '0.84rem', textDecoration: 'underline',
            textDecorationColor: 'rgba(0,229,255,0.3)', fontFamily: "'Inter', sans-serif",
          }}
        >
          Don&apos;t see an interpreter here who you love working with? Click here to invite them to join the signpost community.
        </Link>
      </p>

      <PendingInvitesList targetListRole="interpreter_team" accentColor="#00e5ff" onRefresh={fetchTeam} />

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
          Loading...
        </div>
      ) : team.length === 0 ? (
        <div style={{
          padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem',
          background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          marginBottom: 24,
        }}>
          Your Preferred Team is empty. Browse the directory or invite interpreters you trust to build your team.
        </div>
      ) : (
        <>
          <TierSection
            title="Top Tier Team Interpreters"
            accentColor="var(--accent, #00e5ff)"
            members={topTier}
            onMoveTier={requestMoveTier}
            onRemove={removeMember}
            onEdit={openEdit}
            onMessage={setMessagingMember}
            targetTierLabel="Move to Secondary Tier"
            storageKey="signpost_collapse_interpreter_team_top_tier"
          />
          <TierSection
            title="Secondary Tier Team Interpreters"
            accentColor="var(--accent2, #9d87ff)"
            members={secondaryTier}
            onMoveTier={requestMoveTier}
            onRemove={removeMember}
            onEdit={openEdit}
            onMessage={setMessagingMember}
            targetTierLabel="Move to Top Tier"
            storageKey="signpost_collapse_interpreter_team_secondary"
          />
        </>
      )}

      <Link href="/directory" style={{ textDecoration: 'none' }}>
        <button
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 9,
            background: 'transparent', border: '1.5px dashed var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--muted)',
            fontFamily: "'Inter', sans-serif", fontSize: '0.88rem',
            padding: '13px 22px', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Browse directory to add interpreters
        </button>
      </Link>

      {/* Edit modal - reuses AddToListModal in edit mode */}
      <AddToListModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        interpreter={editInterpreter}
        userRole="interpreter"
        editRowId={editingMember?.id || null}
        editTier={editingMember?.tier || null}
        editNotes={editingMember?.notes || null}
        onSuccess={() => {
          setToast({ message: 'Changes saved.', type: 'success' })
          setEditingMember(null)
          fetchTeam()
        }}
        onRemove={() => {
          setToast({ message: 'Removed from your team.', type: 'success' })
          setEditingMember(null)
          fetchTeam()
        }}
      />

      {messagingMember && messagingMember.user_id && (
        <SendMessageModal
          recipientId={messagingMember.user_id}
          recipientName={`${messagingMember.first_name} ${messagingMember.last_name}`}
          recipientPhoto={messagingMember.photo_url}
          onClose={() => setMessagingMember(null)}
          onSent={() => {
            setMessagingMember(null)
            setToast({ message: 'Message sent.', type: 'success' })
          }}
        />
      )}

      {/* Tier move confirmation modal */}
      {confirmModal && (() => {
        const tierLabel = (t: string) => t === 'preferred' ? 'Top Tier' : 'Secondary Tier';
        return (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10000, padding: 20,
            }}
            onClick={() => setConfirmModal(null)}
            onKeyDown={e => { if (e.key === 'Escape') setConfirmModal(null) }}
          >
            <div
              ref={confirmModalRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Move ${confirmModal.name}`}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#111118', border: '1px solid #1e2433',
                borderRadius: 16, padding: 32, maxWidth: 400, width: '100%',
              }}
            >
              <h3 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 600,
                fontSize: '1.1rem', margin: '0 0 12px 0',
              }}>
                Move {confirmModal.name}?
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Move {confirmModal.name} from {tierLabel(confirmModal.currentTier)} to {tierLabel(confirmModal.newTier)}?
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmModal(null)}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 20px', color: 'var(--muted)',
                    fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMoveTier}
                  style={{
                    background: 'var(--accent)',
                    border: 'none', borderRadius: 8, padding: '8px 20px',
                    color: '#000', fontSize: '0.85rem',
                    fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Move
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── Team Card ─────────────────────────────────────────────────────────────────

function TeamCard({ member, onMoveTier, onRemove, onEdit, onMessage, moveLabel }: {
  member: TeamMember
  onMoveTier: () => void
  onRemove: () => void
  onEdit: () => void
  onMessage: () => void
  moveLabel: string
}) {
  const [hover, setHover] = useState(false)
  const initials = `${(member.first_name[0] || '').toUpperCase()}${(member.last_name[0] || '').toUpperCase()}`
  const fullName = `${member.first_name} ${member.last_name}`
  const profileHref = member.member_interpreter_id ? `/directory/${member.member_interpreter_id}` : null

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onEdit}
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${hover ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '18px 22px',
        display: 'flex', alignItems: 'flex-start', gap: 16, transition: 'border-color 0.2s',
        cursor: 'pointer',
      }}
    >
      {profileHref ? (
        <Link href={profileHref} onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
          {member.photo_url ? (
            <img src={member.photo_url} alt={fullName} style={{
              width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
              border: '2px solid var(--accent)',
            }} />
          ) : (
            <Avatar initials={initials} gradient={member.avatar_color || 'linear-gradient(135deg,#7b61ff,#00e5ff)'} size={44} />
          )}
        </Link>
      ) : member.photo_url ? (
        <img src={member.photo_url} alt={fullName} style={{
          width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
          border: '2px solid var(--accent)',
        }} />
      ) : (
        <Avatar initials={initials} gradient={member.avatar_color || 'linear-gradient(135deg,#7b61ff,#00e5ff)'} size={44} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {profileHref ? (
          <Link href={profileHref} onClick={e => e.stopPropagation()} style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
          >{fullName}</Link>
        ) : (
          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{fullName}</div>
        )}
        {member.notes && (
          <div style={{
            fontSize: '0.78rem', color: 'var(--muted)', marginTop: 6,
            fontStyle: 'italic', lineHeight: 1.5,
          }}>
            &ldquo;{member.notes}&rdquo;
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignSelf: 'center' }}>
        {member.user_id && (
          <button
            onClick={e => { e.stopPropagation(); onMessage() }}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
              fontSize: '0.73rem', padding: '5px 12px', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            Message
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onMoveTier() }}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
            fontSize: '0.73rem', padding: '5px 12px', cursor: 'pointer',
            whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
        >
          {moveLabel}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
            fontSize: '0.73rem', padding: '5px 12px', cursor: 'pointer',
            whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.4)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
        >
          Remove
        </button>
      </div>
    </div>
  )
}
