'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import InviteModal from '@/components/invite/InviteModal';
import PendingInvitesList from '@/components/invite/PendingInvitesList';
import CollapsibleSection from '@/components/ui/CollapsibleSection';

type Tier = 'preferred' | 'approved' | 'dnb';

interface RosterInterpreter {
  roster_id: string;
  interpreter_id: string;
  tier: Tier;
  approve_work: boolean;
  approve_personal: boolean;
  notes: string | null;
  name: string;
  initials: string;
  color: string;
  photo_url: string | null;
  certs: string;
  domains: string;
}

const TIER_BADGE: Record<Tier, { label: string; bg: string; border: string; color: string }> = {
  preferred: { label: '\u2605 Preferred', bg: 'rgba(0,229,255,0.12)', border: 'rgba(0,229,255,0.3)', color: 'var(--accent)' },
  approved: { label: '\u2713 Secondary Tier', bg: 'rgba(123,97,255,0.12)', border: 'rgba(123,97,255,0.3)', color: '#a78bfa' },
  dnb: { label: '\u2715 Do Not Book', bg: 'rgba(255,77,109,0.1)', border: 'rgba(255,77,109,0.3)', color: '#ff8099' },
};

export default function DeafDashboardPage() {
  const [roster, setRoster] = useState<RosterInterpreter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    rosterId: string; name: string; currentTier: Tier; newTier: Tier;
  } | null>(null);
  const confirmModalRef = useRef<HTMLDivElement>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const fetchRoster = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('[PREF DEBUG] auth user:', user?.id, 'error:', authError?.message);
      if (!user) { setLoading(false); return; }

      // Resolve deaf_profiles.id - try by id first, then by user_id
      // Avoids .or() + .maybeSingle() which can fail silently if edge cases arise
      let deafUserId = user.id;
      const { data: byId } = await supabase
        .from('deaf_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (byId) {
        deafUserId = byId.id;
      } else {
        const { data: byUserId } = await supabase
          .from('deaf_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (byUserId) {
          deafUserId = byUserId.id;
        }
      }
      console.log('[PREF DEBUG] deafUserId:', deafUserId, '(user.id:', user.id + ')');

      // Step 1: Fetch roster rows (no nested embeds - avoids PostgREST issues)
      const { data: rosterRows, error: rosterError } = await supabase
        .from('deaf_roster')
        .select('id, interpreter_id, tier, approve_work, approve_personal, notes')
        .eq('deaf_user_id', deafUserId);

      console.log('[PREF DEBUG] roster rows:', rosterRows?.length, 'error:', rosterError?.message);

      if (rosterError) {
        console.error('[deaf-dashboard] roster fetch error:', rosterError.message);
        setLoading(false);
        return;
      }

      if (!rosterRows || rosterRows.length === 0) {
        setRoster([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch interpreter profiles for the IDs on the roster
      const interpreterIds = rosterRows.map(r => r.interpreter_id);

      const { data: interpreters, error: interpError } = await supabase
        .from('interpreter_profiles')
        .select('id, name, first_name, last_name, avatar_color, photo_url')
        .in('id', interpreterIds);

      console.log('[PREF DEBUG] profiles:', interpreters?.length, 'error:', interpError?.message);

      // Step 3: Fetch certs and specializations for these interpreters
      const { data: certs } = await supabase
        .from('interpreter_certifications')
        .select('interpreter_id, name')
        .in('interpreter_id', interpreterIds);

      const { data: specs } = await supabase
        .from('interpreter_specializations')
        .select('interpreter_id, specialization')
        .in('interpreter_id', interpreterIds);

      // Build lookup maps
      const interpMap: Record<string, { name: string; first_name: string | null; last_name: string | null; avatar_color: string | null; photo_url: string | null }> = {};
      for (const ip of interpreters || []) {
        interpMap[ip.id] = ip;
      }

      const certsMap: Record<string, string[]> = {};
      for (const c of certs || []) {
        if (!certsMap[c.interpreter_id]) certsMap[c.interpreter_id] = [];
        certsMap[c.interpreter_id].push(c.name);
      }

      const specsMap: Record<string, string[]> = {};
      for (const s of specs || []) {
        if (!specsMap[s.interpreter_id]) specsMap[s.interpreter_id] = [];
        specsMap[s.interpreter_id].push(s.specialization);
      }

      // Step 4: Map roster rows to display objects
      const mapped: RosterInterpreter[] = rosterRows.map(row => {
        const ip = interpMap[row.interpreter_id];
        const fullName = ip?.first_name
          ? `${ip.first_name} ${ip.last_name || ''}`.trim()
          : ip?.name || 'Unknown';
        const parts = fullName.split(' ');
        const initials = parts.map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
        const certStr = (certsMap[row.interpreter_id] || []).join(', ') || 'Certified Interpreter';
        const domainStr = (specsMap[row.interpreter_id] || []).join(', ') || 'General';

        return {
          roster_id: row.id,
          interpreter_id: row.interpreter_id,
          tier: row.tier as Tier,
          approve_work: row.approve_work,
          approve_personal: row.approve_personal,
          notes: row.notes,
          name: fullName,
          initials,
          color: ip?.avatar_color || 'linear-gradient(135deg, #7b61ff, #00e5ff)',
          photo_url: ip?.photo_url || null,
          certs: certStr,
          domains: domainStr,
        };
      });

      console.log('[PREF DEBUG] mapped roster:', mapped.length);
      setRoster(mapped);
      setLoading(false);
    } catch (err) {
      console.error('[PREF DEBUG] Unhandled error in fetchRoster:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  async function updateRosterField(rosterId: string, field: string, value: unknown) {
    const supabase = createClient();
    await supabase.from('deaf_roster').update({ [field]: value }).eq('id', rosterId);
  }

  async function toggleApproval(rosterId: string, field: 'approve_work' | 'approve_personal') {
    const item = roster.find(r => r.roster_id === rosterId);
    if (!item) return;
    const newVal = !item[field];
    setRoster(prev => prev.map(r => r.roster_id === rosterId ? { ...r, [field]: newVal } : r));
    await updateRosterField(rosterId, field, newVal);
  }

  function requestTierChange(rosterId: string, newTier: Tier) {
    const item = roster.find(r => r.roster_id === rosterId);
    if (!item) return;
    setConfirmModal({ rosterId, name: item.name, currentTier: item.tier, newTier });
  }

  async function confirmTierChange() {
    if (!confirmModal) return;
    const { rosterId, newTier } = confirmModal;
    setConfirmModal(null);

    const supabase = createClient();

    // If moving to DNB, also disable approvals and set do_not_book flag
    if (newTier === 'dnb') {
      setRoster(prev => prev.map(r => r.roster_id === rosterId ? { ...r, tier: newTier, approve_work: false, approve_personal: false } : r));
      const { error } = await supabase.from('deaf_roster').update({ tier: newTier, approve_work: false, approve_personal: false, do_not_book: true }).eq('id', rosterId);
      if (error) console.error('DNB update error:', error);

      // Fire-and-forget quality check for DNB addition
      const item = roster.find(r => r.roster_id === rosterId);
      if (item) {
        fetch('/api/admin/quality-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interpreterId: item.interpreter_id }),
        }).catch(() => {});
      }
    } else {
      // Moving FROM DNB: reset approvals, clear do_not_book flag
      const item = roster.find(r => r.roster_id === rosterId);
      if (item?.tier === 'dnb') {
        setRoster(prev => prev.map(r => r.roster_id === rosterId ? { ...r, tier: newTier, approve_work: false, approve_personal: false } : r));
        const { error } = await supabase.from('deaf_roster').update({ tier: newTier, approve_work: false, approve_personal: false, do_not_book: false }).eq('id', rosterId);
        if (error) console.error('Tier change error:', error);
      } else {
        setRoster(prev => prev.map(r => r.roster_id === rosterId ? { ...r, tier: newTier } : r));
        await updateRosterField(rosterId, 'tier', newTier);
      }
    }
    showToast(`Moved to ${newTier === 'preferred' ? 'Preferred' : newTier === 'approved' ? 'Secondary Tier' : 'Do Not Book'}`);
  }

  async function removeInterp(rosterId: string) {
    const item = roster.find(r => r.roster_id === rosterId);
    if (!item) return;
    const supabase = createClient();

    if (item.tier === 'dnb') {
      // Moving off DNB: restore to secondary tier, clear do_not_book flag
      setRoster(prev => prev.map(r => r.roster_id === rosterId ? { ...r, tier: 'approved' as Tier, approve_work: false, approve_personal: false } : r));
      const { error } = await supabase.from('deaf_roster').update({ tier: 'approved', do_not_book: false, approve_work: false, approve_personal: false }).eq('id', rosterId);
      if (error) console.error('Remove from DNB error:', error);
      showToast(`Moved ${item.name} to Secondary Tier`);
    } else {
      // Non-DNB: delete the roster row entirely
      setRoster(prev => prev.filter(r => r.roster_id !== rosterId));
      const { error } = await supabase.from('deaf_roster').delete().eq('id', rosterId);
      if (error) console.error('Remove roster error:', error);
      showToast(`Removed ${item.name} from roster`);
    }
  }

  function startEditNote(rosterId: string) {
    const item = roster.find(r => r.roster_id === rosterId);
    setEditNoteText(item?.notes || '');
    setEditingNoteId(rosterId);
  }

  async function saveNote(rosterId: string) {
    setRoster(prev => prev.map(r => r.roster_id === rosterId ? { ...r, notes: editNoteText } : r));
    setEditingNoteId(null);
    await updateRosterField(rosterId, 'notes', editNoteText);
    showToast('Note saved');
  }

  const preferred = roster.filter(r => r.tier === 'preferred');
  const approved = roster.filter(r => r.tier === 'approved');
  const dnb = roster.filter(r => r.tier === 'dnb');

  if (loading) {
    return (
      <div style={{ padding: '60px 32px', color: 'var(--muted)', textAlign: 'center' }}>
        Loading your interpreter roster...
      </div>
    );
  }

  // Empty state - no interpreters at all
  if (roster.length === 0) {
    return (
      <div className="dhh-interp-list-page" style={{ maxWidth: 960, margin: '0 auto', padding: '60px 32px 64px' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 725, letterSpacing: '-0.03em', marginBottom: 4, color: '#f0f2f8' }}>
          My Interpreter List
        </h1>
        <p style={{ fontWeight: 400, fontSize: '15px', color: '#96a0b8', marginBottom: 40 }}>
          Your preferred, secondary tier, and do-not-book interpreters.
        </p>
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'var(--surface)', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: 10 }}>
            You haven&apos;t added any interpreters yet.
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
            Browse the directory to find interpreters and add them to your list.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/directory" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '11px 24px' }}>
              Browse Directory &#8594;
            </Link>
            <button
              onClick={() => setShowInvite(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'transparent', border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: 10, color: '#a78bfa',
                fontFamily: "'Inter', sans-serif", fontSize: '14.5px',
                fontWeight: 600, padding: '11px 24px', cursor: 'pointer',
              }}
            >
              Invite an interpreter
            </button>
          </div>
        </div>

        <InviteModal
          isOpen={showInvite}
          onClose={() => setShowInvite(false)}
          title="Invite an interpreter to signpost"
          subtitle="I want to add you to my preferred interpreter list on signpost."
          targetListRole="dhh_pref_list"
          senderRole="deaf"
          accentColor="#a78bfa"
          onSuccess={() => { fetchRoster(); setShowInvite(false) }}
        />
      </div>
    );
  }

  function renderCard(item: RosterInterpreter) {
    const badge = TIER_BADGE[item.tier];

    return (
      <div
        key={item.roster_id}
        style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '18px 20px',
          display: 'flex', gap: 16, alignItems: 'flex-start',
          cursor: 'pointer', transition: 'border-color 0.15s',
        }}
        onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)')}
        onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        {/* Avatar - clickable to profile */}
        <Link href={`/directory/${item.interpreter_id}`} onClick={e => e.stopPropagation()} style={{ flexShrink: 0, textDecoration: 'none' }}>
          {item.photo_url ? (
            <img src={item.photo_url} alt={item.name} style={{
              width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
              border: '2px solid var(--accent)',
            }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: item.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.9rem', color: '#fff',
            }}>
              {item.initials}
            </div>
          )}
        </Link>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + tier badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <Link
              href={`/directory/${item.interpreter_id}`}
              style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', textDecoration: 'none' }}
              onClick={e => e.stopPropagation()}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none' }}
            >
              {item.name}
            </Link>
            <span style={{
              background: badge.bg, border: `1px solid ${badge.border}`,
              color: badge.color, borderRadius: 20, padding: '2px 10px',
              fontSize: '0.72rem', fontWeight: 600,
            }}>
              {badge.label}
            </span>
          </div>

          {/* Certs + domains */}
          <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 6 }}>
            {item.certs} &middot; {item.domains}
          </div>

          {/* Personal note */}
          {item.notes && editingNoteId !== item.roster_id && (
            <div style={{
              fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic',
              background: 'rgba(255,255,255,0.03)', borderRadius: 8,
              padding: '8px 12px', marginBottom: 8,
            }}>
              &ldquo;{item.notes}&rdquo;
            </div>
          )}

          {/* Inline note editor */}
          {editingNoteId === item.roster_id && (
            <div style={{ marginBottom: 8 }} onClick={e => e.stopPropagation()}>
              <textarea
                value={editNoteText}
                onChange={e => setEditNoteText(e.target.value)}
                placeholder="Add a note about this interpreter..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  color: 'var(--text)', fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
                  outline: 'none', resize: 'vertical', minHeight: 60, marginBottom: 8,
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditingNoteId(null)} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '4px 12px', color: 'var(--muted)',
                  fontSize: '0.75rem', cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={() => saveNote(item.roster_id)} className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Approval toggles */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => item.tier !== 'dnb' && toggleApproval(item.roster_id, 'approve_work')}
              disabled={item.tier === 'dnb'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20,
                cursor: item.tier === 'dnb' ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem', fontWeight: 600, border: 'none',
                background: item.tier === 'dnb' ? 'rgba(255,255,255,0.02)' : item.approve_work ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)',
                color: item.tier === 'dnb' ? 'rgba(184,191,207,0.4)' : item.approve_work ? 'var(--accent)' : 'var(--muted)',
                opacity: item.tier === 'dnb' ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              <em style={{ fontStyle: 'normal' }}>{item.approve_work ? '\u2713' : '\u2715'}</em> Work settings
            </button>
            <button
              onClick={() => item.tier !== 'dnb' && toggleApproval(item.roster_id, 'approve_personal')}
              disabled={item.tier === 'dnb'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20,
                cursor: item.tier === 'dnb' ? 'not-allowed' : 'pointer',
                fontSize: '0.75rem', fontWeight: 600, border: 'none',
                background: item.tier === 'dnb' ? 'rgba(255,255,255,0.02)' : item.approve_personal ? 'rgba(157,135,255,0.1)' : 'rgba(255,255,255,0.04)',
                color: item.tier === 'dnb' ? 'rgba(184,191,207,0.4)' : item.approve_personal ? '#a78bfa' : 'var(--muted)',
                opacity: item.tier === 'dnb' ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
            >
              <em style={{ fontStyle: 'normal' }}>{item.approve_personal ? '\u2713' : '\u2715'}</em> Personal / medical
            </button>
          </div>

          {/* Tier move controls */}
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            {item.tier !== 'preferred' && (
              <button onClick={() => requestTierChange(item.roster_id, 'preferred')} style={{
                background: 'rgba(0,229,255,0.07)', border: '1px dashed rgba(0,229,255,0.35)',
                color: 'var(--accent)', borderRadius: 8, padding: '4px 12px',
                fontSize: '0.75rem', cursor: 'pointer',
              }}>
                &#9733; Move to Preferred Tier
              </button>
            )}
            {item.tier !== 'approved' && (
              <button onClick={() => requestTierChange(item.roster_id, 'approved')} style={{
                background: 'rgba(123,97,255,0.07)', border: '1px dashed rgba(123,97,255,0.35)',
                color: '#a78bfa', borderRadius: 8, padding: '4px 12px',
                fontSize: '0.75rem', cursor: 'pointer',
              }}>
                &#8595; Move to Secondary Tier
              </button>
            )}
            {item.tier !== 'dnb' && (
              <button onClick={() => requestTierChange(item.roster_id, 'dnb')} style={{
                background: 'transparent', border: '1px dashed rgba(255,77,109,0.35)',
                color: '#ff8099', borderRadius: 8, padding: '4px 12px',
                fontSize: '0.75rem', cursor: 'pointer',
              }}>
                Move to Do Not Book
              </button>
            )}
            <button onClick={() => startEditNote(item.roster_id)} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--muted)', borderRadius: 8, padding: '4px 12px',
              fontSize: '0.75rem', cursor: 'pointer',
            }}>
              Edit note
            </button>
            <button onClick={() => removeInterp(item.roster_id)} style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              fontSize: '0.75rem', cursor: 'pointer', opacity: 0.6, padding: '4px 8px',
            }}>
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dhh-interp-list-page" style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px 64px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 725, letterSpacing: '-0.03em', marginBottom: 0, color: '#f0f2f8' }}>
            My Interpreter List
          </h1>
          <p style={{ fontWeight: 400, fontSize: '15px', color: '#96a0b8' }}>
            Your preferred, secondary tier, and do-not-book interpreters. Share your list with requesters so they always know who to contact.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, marginTop: 6 }}>
          <button
            onClick={() => setShowInvite(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'transparent', border: '1.5px solid rgba(167,139,250,0.3)',
              borderRadius: 8, color: '#a78bfa',
              fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
              fontWeight: 700, padding: '7px 14px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Invite
          </button>
          <button
            onClick={() => showToast('Share link copied!')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'transparent', border: '1.5px solid rgba(0,229,255,0.3)',
              borderRadius: 8, color: 'var(--accent)',
              fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
              fontWeight: 700, padding: '7px 14px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.7"/>
              <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
              <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.7"/>
              <path d="M8.7 10.7l6.6-3.4M8.7 13.3l6.6 3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            Share my list
          </button>
        </div>
      </div>

      {/* Add from directory CTA */}
      <div style={{
        background: 'rgba(0,229,255,0.04)', border: '1px dashed rgba(0,229,255,0.2)',
        borderRadius: 12, padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap', marginBottom: 32,
      }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: 4 }}>Add an interpreter to your preferred list</div>
          <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8' }}>Browse the directory and add interpreters directly from their profile.</div>
        </div>
        <Link href="/directory" className="btn-primary" style={{ textDecoration: 'none', padding: '9px 20px', fontSize: '0.85rem' }}>
          Browse Directory &#8594;
        </Link>
      </div>

      <PendingInvitesList targetListRole="dhh_pref_list" accentColor="#a78bfa" onRefresh={fetchRoster} />

      <InviteModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite an interpreter to signpost"
        subtitle="I want to add you to my preferred interpreter list on signpost."
        targetListRole="dhh_pref_list"
        senderRole="deaf"
        accentColor="#a78bfa"
        onSuccess={() => { fetchRoster(); setShowInvite(false) }}
      />

      {/* Preferred section */}
      <CollapsibleSection
        storageKey="signpost_collapse_dhh_preferred_preferred"
        accentColor="#a78bfa"
        header={
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: 2 }}>
              &#9733; Preferred Interpreters
            </div>
            <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8' }}>
              Contact these first. Strong fit based on my communication style and history.
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {preferred.length > 0
            ? preferred.map(renderCard)
            : <div style={{ color: 'var(--muted)', fontSize: '0.88rem', padding: 16, background: 'var(--surface)', borderRadius: 10, border: '1px dashed var(--border)' }}>
                No preferred interpreters yet. Add from directory or move up from Secondary Tier.
              </div>
          }
        </div>
      </CollapsibleSection>

      {/* Secondary Tier section */}
      <CollapsibleSection
        storageKey="signpost_collapse_dhh_preferred_secondary"
        accentColor="#a78bfa"
        header={
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: 2 }}>
              &#10003; Secondary Tier Interpreters
            </div>
            <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8' }}>
              Good alternatives. Use when preferred interpreters are unavailable.
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {approved.length > 0
            ? approved.map(renderCard)
            : <div style={{ color: 'var(--muted)', fontSize: '0.88rem', padding: 16, background: 'var(--surface)', borderRadius: 10, border: '1px dashed var(--border)' }}>
                No secondary tier interpreters yet.
              </div>
          }
        </div>
      </CollapsibleSection>

      {/* DNB section */}
      <CollapsibleSection
        storageKey="signpost_collapse_dhh_preferred_dnb"
        accentColor="#ff8099"
        header={
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '15px', color: '#ff8099', marginBottom: 2 }}>
              &#10005; Do Not Book
            </div>
            <div style={{ fontWeight: 400, fontSize: '14px', color: '#96a0b8' }}>
              Visible to your requesters only. Interpreters are never notified that they are added to this list.
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dnb.length > 0
            ? dnb.map(renderCard)
            : <div style={{ color: 'var(--muted)', fontSize: '0.88rem', padding: 16, background: 'var(--surface)', borderRadius: 10, border: '1px dashed var(--border)' }}>
                No do-not-book entries.
              </div>
          }
        </div>
      </CollapsibleSection>

      {/* Toast - top center */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--card-bg)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: 'var(--radius)', padding: '14px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.85rem', color: '#34d399',
        }}>
          {toast}
        </div>
      )}

      {/* Tier move confirmation modal */}
      {confirmModal && (() => {
        const tierLabel = (t: Tier) => t === 'preferred' ? 'Preferred' : t === 'approved' ? 'Secondary Tier' : 'Do Not Book';
        const isDnb = confirmModal.newTier === 'dnb';
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
                fontSize: '15px', color: '#f0f2f8', margin: '0 0 12px 0',
              }}>
                Move {confirmModal.name}?
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                {isDnb
                  ? `Move ${confirmModal.name} to Do Not Book? This will remove their work and personal approvals.`
                  : `Move ${confirmModal.name} from ${tierLabel(confirmModal.currentTier)} to ${tierLabel(confirmModal.newTier)}?`
                }
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
                  onClick={confirmTierChange}
                  style={{
                    background: isDnb ? '#ff6b85' : 'var(--accent)',
                    border: 'none', borderRadius: 8, padding: '8px 20px',
                    color: isDnb ? '#fff' : '#000', fontSize: '0.85rem',
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

      <style>{`
        @media (max-width: 768px) {
          .dhh-interp-list-page { padding: 24px 20px 48px !important; }
        }
        @media (max-width: 390px) {
          .dhh-interp-list-page { padding: 20px 16px 40px !important; }
        }
      `}</style>
    </div>
  );
}
