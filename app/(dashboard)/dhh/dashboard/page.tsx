'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { interpreters } from '@/lib/data/seed';
import RatingStars from '@/components/ui/RatingStars';

const INITIAL_ROSTER = [
  { ...interpreters[0], tier: 'top' as const, approveWork: true, approvePersonal: true, notes: '' },
  { ...interpreters[1], tier: 'preferred' as const, approveWork: true, approvePersonal: false, notes: 'Available Tues/Thurs only' },
  { ...interpreters[4], tier: 'preferred' as const, approveWork: true, approvePersonal: false, notes: '' },
  { ...interpreters[7], tier: 'backup' as const, approveWork: true, approvePersonal: false, notes: '' },
];

type Tier = 'top' | 'preferred' | 'backup';
const TIER_LIST: Tier[] = ['top', 'preferred', 'backup'];

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 20,
};
const modalStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '28px 32px',
  width: '100%', maxWidth: 520,
};

/* ── Share Modal ── */
function ShareModal({ onClose, onToast }: { onClose: () => void; onToast: (m: string) => void }) {
  const [email, setEmail] = useState('');
  const [scope, setScope] = useState<'work' | 'personal' | 'full'>('full');

  const scopes = [
    { value: 'work' as const, label: 'Work settings only' },
    { value: 'personal' as const, label: 'Personal only' },
    { value: 'full' as const, label: 'Full roster' },
  ];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem' }}>Share Your Interpreter Roster</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>Share scope</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scopes.map(s => (
              <button key={s.value} onClick={() => setScope(s.value)} style={{
                background: scope === s.value ? 'rgba(157,135,255,0.1)' : 'var(--surface2)',
                border: `1px solid ${scope === s.value ? 'rgba(157,135,255,0.4)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                color: scope === s.value ? 'var(--accent2)' : 'var(--text)',
                fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>Invite by email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="requester@example.com"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
              color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button onClick={() => { onToast('Link copied to clipboard'); onClose(); }} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '9px 18px',
            color: 'var(--text)', fontSize: '0.82rem', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>Copy Link</button>
          <button className="btn-primary" onClick={() => { onToast('Share invitation sent'); onClose(); }} style={{ padding: '9px 22px' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Menu Dropdown ── */
function MenuDropdown({ item, onMoveTier, onRemove, onEditNote, onClose }: {
  item: { tier: string };
  onMoveTier: (tier: Tier) => void;
  onRemove: () => void;
  onEditNote: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const otherTiers = TIER_LIST.filter(t => t !== item.tier);

  const optStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left',
    background: 'none', border: 'none', padding: '8px 14px',
    color: 'var(--text)', fontSize: '0.8rem', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", borderRadius: 6,
    transition: 'background 0.12s',
  };

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 100,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: 4, minWidth: 170,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    }}>
      <button onClick={onEditNote} style={optStyle}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
      >Edit Note</button>
      {otherTiers.map(t => (
        <button key={t} onClick={() => onMoveTier(t)} style={optStyle}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >Move to {t}</button>
      ))}
      <button onClick={onRemove} style={{ ...optStyle, color: 'var(--accent3)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,133,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
      >Remove</button>
    </div>
  );
}

/* ── Main Page ── */
export default function DeafDashboardPage() {
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [filterTier, setFilterTier] = useState<'all' | Tier>('all');
  const [shareOpen, setShareOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | number | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function toggleApproval(id: string | number, field: 'approveWork' | 'approvePersonal') {
    setRoster(prev => prev.map(r => r.id === id ? { ...r, [field]: !r[field] } : r));
  }

  function moveTier(id: string | number, tier: Tier) {
    setRoster(prev => prev.map(r => r.id === id ? { ...r, tier } : r));
    setOpenMenuId(null);
    showToast(`Moved to ${tier} tier`);
  }

  function removeInterp(id: string | number) {
    const name = roster.find(r => r.id === id)?.name;
    setRoster(prev => prev.filter(r => r.id !== id));
    setOpenMenuId(null);
    showToast(`Removed ${name} from roster`);
  }

  function startEditNote(id: string | number) {
    const item = roster.find(r => r.id === id);
    setEditNoteText(item?.notes || '');
    setEditingNoteId(String(id));
    setOpenMenuId(null);
  }

  function saveNote(id: string | number) {
    setRoster(prev => prev.map(r => r.id === id ? { ...r, notes: editNoteText } : r));
    setEditingNoteId(null);
    showToast('Note saved');
  }

  const filtered = filterTier === 'all' ? roster : roster.filter(r => r.tier === filterTier);

  const tierColors: Record<Tier, { bg: string; border: string; color: string }> = {
    top:       { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
    preferred: { bg: 'rgba(0,229,255,0.1)', border: 'rgba(0,229,255,0.3)', color: 'var(--accent)' },
    backup:    { bg: 'rgba(157,135,255,0.1)', border: 'rgba(157,135,255,0.3)', color: 'var(--accent2)' },
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px 64px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>My Interpreter Roster</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{roster.length} interpreter{roster.length !== 1 ? 's' : ''} on your list</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 16px', color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            Browse Directory
          </Link>
          <button onClick={() => setShareOpen(true)} style={{ background: 'var(--accent2)', color: '#000', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            Share Roster
          </button>
        </div>
      </div>

      {/* Tier filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['all', 'top', 'preferred', 'backup'] as const).map(t => (
          <button key={t} onClick={() => setFilterTier(t)} style={{
            padding: '7px 16px', borderRadius: 100,
            background: filterTier === t ? 'rgba(157,135,255,0.12)' : 'none',
            border: filterTier === t ? '1px solid rgba(157,135,255,0.4)' : '1px solid var(--border)',
            color: filterTier === t ? 'var(--accent2)' : 'var(--muted)',
            fontSize: '0.82rem', cursor: 'pointer', fontWeight: filterTier === t ? 600 : 400,
            textTransform: 'capitalize',
          }}>
            {t === 'all' ? 'All' : t}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>({t === 'all' ? roster.length : roster.filter(r => r.tier === t).length})</span>
          </button>
        ))}
      </div>

      {/* Roster list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(item => {
          const tc = tierColors[item.tier];
          return (
            <div key={item.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: item.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontFamily: 'var(--font-syne)', fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>{item.initials}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700 }}>{item.name}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 100, padding: '2px 8px', fontSize: '0.68rem', color: tc.color, fontWeight: 700, textTransform: 'capitalize' as const }}>{item.tier}</span>
                    {item.available && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#34d399' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                        Available
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{item.location} · {item.signLangs.join(', ')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <RatingStars rating={item.rating} size={11} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{item.rating}</span>
                  </div>
                  {item.notes && editingNoteId !== item.id && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: 4 }}>Note: {item.notes}</div>
                  )}
                </div>

                {/* Approval toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem' }}>
                  <button onClick={() => toggleApproval(item.id, 'approveWork')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.approveWork ? '#34d399' : 'var(--border)', display: 'inline-block', transition: 'background 0.15s' }} />
                    <span style={{ color: item.approveWork ? 'var(--text)' : 'var(--muted)', fontSize: '0.75rem' }}>Work</span>
                  </button>
                  <button onClick={() => toggleApproval(item.id, 'approvePersonal')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.approvePersonal ? '#34d399' : 'var(--border)', display: 'inline-block', transition: 'background 0.15s' }} />
                    <span style={{ color: item.approvePersonal ? 'var(--text)' : 'var(--muted)', fontSize: '0.75rem' }}>Personal</span>
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
                  <button onClick={() => showToast(`Request sent to ${item.name}`)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--muted)', fontSize: '0.75rem', cursor: 'pointer' }}>Request</button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--muted)', fontSize: '0.75rem', cursor: 'pointer' }}>⋮</button>
                    {openMenuId === item.id && (
                      <MenuDropdown
                        item={item}
                        onMoveTier={tier => moveTier(item.id, tier)}
                        onRemove={() => removeInterp(item.id)}
                        onEditNote={() => startEditNote(item.id)}
                        onClose={() => setOpenMenuId(null)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Inline note editor */}
              {editingNoteId === item.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <textarea
                    value={editNoteText} onChange={e => setEditNoteText(e.target.value)}
                    placeholder="Add a note about this interpreter..."
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                      color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
                      outline: 'none', resize: 'vertical', minHeight: 60, marginBottom: 8,
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingNoteId(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => saveNote(item.id)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>Save</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>📋</div>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: 8 }}>No interpreters in this tier</div>
          <Link href="/directory" style={{ color: 'var(--accent2)', textDecoration: 'none', fontSize: '0.9rem' }}>Browse the directory →</Link>
        </div>
      )}

      {/* Share Modal */}
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} onToast={showToast} />}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 'var(--radius)', padding: '14px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.85rem', color: '#34d399',
        }}>{toast}</div>
      )}
    </div>
  );
}
