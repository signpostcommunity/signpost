'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BetaBanner, PageHeader, Avatar, GhostButton } from '@/components/dashboard/interpreter/shared'
import Toast from '@/components/ui/Toast'

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 20,
}

const modalStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '28px 32px',
  width: '100%', maxWidth: 520,
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
  color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
  outline: 'none',
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', color: 'var(--muted)',
  fontFamily: "'Syne', sans-serif", fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
}

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
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({ onClose, onSaved, interpreterId, interpreterFullName }: {
  onClose: () => void
  onSaved: () => void
  interpreterId: string
  interpreterFullName: string
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const defaultMessage = `Hey ${firstName || '[First Name]'}!\n\nI would love to add you to my preferred interpreter team on signpost, but I don't believe you have created a profile yet. Once you create a profile I can add you as a preferred team member for upcoming jobs.\n\nIf you would like to create a profile, click here: https://signpost.community/signup\n\n${interpreterFullName}`

  const [message, setMessage] = useState('')
  const currentMessage = message || defaultMessage

  function handleFirstNameChange(val: string) {
    setFirstName(val)
    setMessage(`Hey ${val || '[First Name]'}!\n\nI would love to add you to my preferred interpreter team on signpost, but I don't believe you have created a profile yet. Once you create a profile I can add you as a preferred team member for upcoming jobs.\n\nIf you would like to create a profile, click here: https://signpost.community/signup\n\n${interpreterFullName}`)
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: insertErr } = await supabase.from('interpreter_preferred_team').insert({
      interpreter_id: interpreterId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
    })
    setSaving(false)
    if (insertErr) {
      console.error('Invite insert error:', insertErr)
      setError(`Failed to save: ${insertErr.message}`)
      return
    }
    setSuccess(true)
    onSaved()
  }

  if (success) return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>✓</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)', marginBottom: 8 }}>
            {firstName} has been added to your Preferred Team!
          </div>
          <button className="btn-primary" onClick={onClose} style={{ padding: '10px 28px' }}>Done</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem' }}>Invite to your preferred team</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={fieldLabelStyle}>First Name</label>
            <input type="text" value={firstName} onChange={e => handleFirstNameChange(e.target.value)}
              placeholder="First name" style={fieldInputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>
          <div>
            <label style={fieldLabelStyle}>Last Name</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
              placeholder="Last name" style={fieldInputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="colleague@example.com" style={fieldInputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Message</label>
          <textarea value={currentMessage} onChange={e => setMessage(e.target.value)}
            style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 160 }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
        </div>

        {error && (
          <p style={{ fontSize: '0.82rem', color: '#f87171', marginBottom: 12 }}>{error}</p>
        )}

        <div className="dash-card-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button className="btn-primary" onClick={handleSave} disabled={saving}
            style={{ padding: '9px 22px', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [interpreterId, setInterpreterId] = useState<string | null>(null)
  const [interpreterName, setInterpreterName] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchTeam = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Get interpreter profile id
    const { data: profile } = await supabase
      .from('interpreter_profiles')
      .select('id, first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) { setLoading(false); return }
    setInterpreterId(profile.id)
    setInterpreterName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim())

    const { data: members, error } = await supabase
      .from('interpreter_preferred_team')
      .select('id, first_name, last_name, email, status, member_interpreter_id, tier, notes, interpreter_profiles:member_interpreter_id(photo_url, avatar_color)')
      .eq('interpreter_id', profile.id)
      .order('id', { ascending: false })

    if (error) {
      console.error('Team fetch error:', error)
      setTeam([])
    } else {
      // Flatten the joined interpreter_profiles data
      const mapped = (members || []).map((m: Record<string, unknown>) => {
        const joined = m.interpreter_profiles as { photo_url?: string; avatar_color?: string } | null
        return {
          id: m.id as string,
          first_name: m.first_name as string,
          last_name: m.last_name as string,
          email: m.email as string,
          status: m.status as string,
          member_interpreter_id: m.member_interpreter_id as string | null,
          tier: (m.tier as string) || null,
          notes: (m.notes as string) || null,
          photo_url: joined?.photo_url || null,
          avatar_color: joined?.avatar_color || null,
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
    setToast({ message: 'Removed from your Preferred Team.', type: 'success' })
    fetchTeam()
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 760 }}>
      <BetaBanner />
      <PageHeader
        title="Preferred Team Interpreters"
        subtitle="Interpreters you love working with. Add them here so they're easy to team up with when a job calls for a partner."
      />

      <p style={{ color: 'var(--muted)', fontSize: '0.84rem', lineHeight: 1.6, marginBottom: 28 }}>
        <button
          onClick={() => setShowInvite(true)}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--accent)', fontSize: '0.84rem', textDecoration: 'underline',
            textDecorationColor: 'rgba(0,229,255,0.3)', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Don&apos;t see an interpreter here who you love working with? Click here to invite them to join the signpost community.
        </button>
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
            Loading...
          </div>
        ) : team.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            Your Preferred Team is empty. Invite interpreters you trust to build your go-to team.
          </div>
        ) : (
          team.map(member => (
            <TeamCard key={member.id} member={member} onRemove={() => removeMember(member.id)} />
          ))
        )}
      </div>

      <Link href="/directory" style={{ textDecoration: 'none' }}>
        <button
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 9,
            background: 'transparent', border: '1.5px dashed var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--muted)',
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
            padding: '13px 22px', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Browse directory to add interpreters
        </button>
      </Link>

      {showInvite && interpreterId && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSaved={() => fetchTeam()}
          interpreterId={interpreterId}
          interpreterFullName={interpreterName || 'Your Name'}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── Team Card ─────────────────────────────────────────────────────────────────

function TeamCard({ member, onRemove }: { member: TeamMember; onRemove: () => void }) {
  const [hover, setHover] = useState(false)
  const initials = `${(member.first_name[0] || '').toUpperCase()}${(member.last_name[0] || '').toUpperCase()}`
  const fullName = `${member.first_name} ${member.last_name}`

  const isGoTo = member.tier === 'preferred'
  const tierLabel = isGoTo ? '★ Go-to' : '✓ Available'
  const tierBg = isGoTo ? 'rgba(0,229,255,0.08)' : 'rgba(157,135,255,0.08)'
  const tierBorder = isGoTo ? 'rgba(0,229,255,0.25)' : 'rgba(157,135,255,0.25)'
  const tierColor = isGoTo ? 'var(--accent)' : '#9d87ff'

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${hover ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.2s',
      }}
    >
      {member.photo_url ? (
        <img src={member.photo_url} alt={fullName} style={{
          width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
          border: '2px solid var(--accent)',
        }} />
      ) : (
        <Avatar initials={initials} gradient={member.avatar_color || 'linear-gradient(135deg,#7b61ff,#00e5ff)'} size={44} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{fullName}</div>
        {member.email && (
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
            {member.email}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
          {member.tier && (
            <span style={{
              fontSize: '0.7rem', padding: '2px 9px', borderRadius: 20,
              background: tierBg, border: `1px solid ${tierBorder}`, color: tierColor,
            }}>
              {tierLabel}
            </span>
          )}
          <span style={{
            fontSize: '0.7rem', padding: '2px 9px', borderRadius: 20,
            background: member.status === 'accepted' ? 'rgba(52,211,153,0.12)' : 'rgba(0,229,255,0.08)',
            border: `1px solid ${member.status === 'accepted' ? 'rgba(52,211,153,0.3)' : 'rgba(0,229,255,0.2)'}`,
            color: member.status === 'accepted' ? '#34d399' : 'var(--accent)',
          }}>
            {member.status === 'accepted' ? 'Accepted' : member.status === 'declined' ? 'Declined' : 'Invited'}
          </span>
        </div>
        {member.notes && (
          <div style={{
            fontSize: '0.78rem', color: 'var(--muted)', marginTop: 8,
            fontStyle: 'italic', lineHeight: 1.5,
          }}>
            &ldquo;{member.notes}&rdquo;
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
          fontSize: '0.75rem', padding: '5px 12px', cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
          alignSelf: 'flex-start',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.4)'; e.currentTarget.style.color = '#f87171' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
      >
        Remove
      </button>
    </div>
  )
}
