'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { DEMO_CLIENT_LISTS } from '@/lib/data/demo'
import { BetaBanner, PageHeader, Avatar, DemoBadge } from '@/components/dashboard/interpreter/shared'

function PillBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      fontSize: '0.72rem', padding: '2px 10px', borderRadius: 20,
      background: ok ? 'rgba(52,211,153,0.1)' : 'rgba(255,77,109,0.08)',
      border: `1px solid ${ok ? 'rgba(52,211,153,0.3)' : 'rgba(255,77,109,0.2)'}`,
      color: ok ? '#34d399' : 'var(--accent3)',
    }}>
      {ok ? '✓' : '✕'} {label}
    </span>
  )
}

export default function ClientListsPage() {
  const [open, setOpen] = useState<string[]>(['demo-cl-1'])

  function toggleCard(id: string) {
    setOpen(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', width: '100%' }}>
      <BetaBanner />
      <PageHeader
        title="Client Interpreter Lists"
        subtitle="When a Deaf or Hard of Hearing client proactively shares their preferred interpreter list with you, it appears here. These lists belong to your clients and update automatically when the client makes changes. Work/personal designations reflect the client's preferences, helping you understand which contexts they trust you in."
      />

      {DEMO_CLIENT_LISTS.map(list => {
        const isOpen = open.includes(list.id)
        return (
          <div key={list.id} style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 14,
          }}>
            {/* Header */}
            <div
              onClick={() => toggleCard(list.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 22px', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar initials={list.clientAvatar} gradient={list.clientAvatarGradient} size={40} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {list.clientName}
                    <DemoBadge />
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 2 }}>
                    {list.interpreterCount} interpreters · Updated {list.updatedAt}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: 'var(--accent)', borderRadius: 6, padding: '2px 9px' }}>
                  Live · Read-only
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Body */}
            {isOpen && (
              <div style={{ padding: '20px 22px', borderTop: '1px solid var(--border)' }}>
                {/* Preferred */}
                <div style={{ fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 12 }}>
                  ★ Preferred Interpreters
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {list.preferred.map(interp => (
                    <InterpRow key={interp.name} interp={interp} />
                  ))}
                </div>

                {/* Secondary */}
                <div style={{ fontWeight: 600, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#00e5ff', marginBottom: 12 }}>
                  ✓ Secondary Tier
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {list.secondary.map(interp => (
                    <InterpRow key={interp.name} interp={interp} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function InterpRow({ interp }: { interp: { name: string; avatar: string; avatarGradient: string; credentials: string; note: string; workOk: boolean; personalOk: boolean } }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '14px 16px',
    }}>
      <Avatar initials={interp.avatar} gradient={interp.avatarGradient} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>{interp.name}</div>
        <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: 6 }}>{interp.credentials}</div>
        {interp.note && (
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 8 }}>{interp.note}</div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <PillBadge ok={interp.workOk} label="Work settings" />
          <PillBadge ok={interp.personalOk} label="Personal / medical" />
        </div>
      </div>
    </div>
  )
}
