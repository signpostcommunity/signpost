'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { DEMO_TEAM } from '@/lib/data/demo'
import { BetaBanner, PageHeader, Avatar, GhostButton } from '@/components/dashboard/interpreter/shared'

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

// ── FIX 4: Invite modal ─────────────────────────────────────────────────────

function InviteModal({ onClose, interpreterFullName }: { onClose: () => void; interpreterFullName: string }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const defaultMessage = `Hey ${firstName || '[First Name]'}!\n\nI would love to add you to my preferred interpreter team on signpost, but I don't believe you have created a profile yet. Once you create a profile I can add you as a preferred team member for upcoming jobs.\n\nIf you would like to create a profile, click here: https://signpost.community/signup\n\n${interpreterFullName}`

  const [message, setMessage] = useState('')

  // Update message when firstName changes
  const currentMessage = message || defaultMessage

  function handleFirstNameChange(val: string) {
    setFirstName(val)
    // Auto-update the message with new first name
    setMessage(`Hey ${val || '[First Name]'}!\n\nI would love to add you to my preferred interpreter team on signpost, but I don't believe you have created a profile yet. Once you create a profile I can add you as a preferred team member for upcoming jobs.\n\nIf you would like to create a profile, click here: https://signpost.community/signup\n\n${interpreterFullName}`)
  }

  if (toast) return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>✓</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)', marginBottom: 8 }}>
            {toast}
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
            <input
              type="text" value={firstName} onChange={e => handleFirstNameChange(e.target.value)}
              placeholder="First name"
              style={fieldInputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              required
            />
          </div>
          <div>
            <label style={fieldLabelStyle}>Last Name</label>
            <input
              type="text" value={lastName} onChange={e => setLastName(e.target.value)}
              placeholder="Last name"
              style={fieldInputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Email Address</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            style={fieldInputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            required
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabelStyle}>Message</label>
          <textarea
            value={currentMessage} onChange={e => setMessage(e.target.value)}
            style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 160 }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div className="dash-card-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button className="btn-primary" onClick={() => {
            if (firstName && lastName && email) {
              setToast(`Invitation sent to ${firstName}!`)
            }
          }} style={{ padding: '9px 22px' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [team, setTeam] = useState(DEMO_TEAM)
  const [showInvite, setShowInvite] = useState(false)
  const [interpreterName, setInterpreterName] = useState('')

  useEffect(() => {
    async function loadName() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('interpreter_profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setInterpreterName(`${data.first_name || ''} ${data.last_name || ''}`.trim())
    }
    loadName()
  }, [])

  function remove(id: string) {
    setTeam(prev => prev.filter(t => t.id !== id))
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
        {team.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            Your preferred team is empty. Browse the directory to add interpreters.
          </div>
        )}
        {team.map(interp => (
          <TeamCard key={interp.id} interp={interp} onRemove={() => remove(interp.id)} />
        ))}
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

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} interpreterFullName={interpreterName || 'Your Name'} />}
    </div>
  )
}

function TeamCard({ interp, onRemove }: { interp: typeof DEMO_TEAM[0]; onRemove: () => void }) {
  const [hover, setHover] = useState(false)
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
      <Avatar initials={interp.avatar} gradient={interp.avatarGradient} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{interp.name}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
          {interp.languages} · {interp.specializations} · {interp.location}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
          {interp.certifications.map(c => (
            <span key={c} style={{ fontSize: '0.7rem', background: 'rgba(123,97,255,0.12)', border: '1px solid rgba(123,97,255,0.25)', color: '#a78bfa', padding: '2px 9px', borderRadius: 20 }}>{c}</span>
          ))}
          {interp.verified && (
            <span style={{ fontSize: '0.7rem', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: 'var(--accent)', padding: '2px 9px', borderRadius: 20 }}>✓ Verified</span>
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
          fontSize: '0.75rem', padding: '5px 12px', cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.4)'; e.currentTarget.style.color = '#f87171' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
      >
        Remove
      </button>
    </div>
  )
}
