'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { DEMO_TEAM } from '@/lib/data/demo'
import { BetaBanner, PageHeader, Avatar } from '@/components/dashboard/interpreter/shared'

export default function TeamPage() {
  const [team, setTeam] = useState(DEMO_TEAM)
  const [showInvite, setShowInvite] = useState(false)

  function remove(id: string) {
    setTeam(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div style={{ padding: '48px 56px', maxWidth: 760 }}>
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
          Don't see an interpreter here who you love working with? Click here to invite them to join the signpost community.
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

      {/* Invite toast */}
      {showInvite && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid rgba(0,229,255,0.4)',
          borderRadius: 'var(--radius)', padding: '20px 28px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          maxWidth: 400, textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)', marginBottom: 8 }}>Invite an interpreter</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 14px' }}>
            Point them to signpost.com to create a free interpreter profile. Once they're on the platform, you can add them to your preferred team.
          </p>
          <button
            className="btn-primary"
            onClick={() => setShowInvite(false)}
            style={{ padding: '8px 20px' }}
          >
            Got it
          </button>
        </div>
      )}
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
