'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { Interpreter, FilterState } from '@/lib/types';
import FilterSidebar from '@/components/directory/FilterSidebar';
import InterpreterGrid from '@/components/directory/InterpreterGrid';
import VideoPreviewModal from '@/components/directory/VideoPreviewModal';
import AddToListModal from '@/components/directory/AddToListModal';
import { createClient } from '@/lib/supabase/client';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const defaultFilters: FilterState = {
  signLangs: [],
  spokenLangs: [],
  specs: [],
  certs: [],
  regions: [],
  availability: null,
  search: '',
  country: '',
  gender: '',
  isDeafInterpreter: false,
  affinities: [],
  racialIdentity: [],
  religiousAffiliation: [],
  distanceRadius: 'any',
  userLat: null,
  userLng: null,
  userLocationLabel: '',
};

export default function DirectoryClient({ interpreters }: { interpreters: Interpreter[] }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  // Auth state — starts null (loading), then true/false
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // User role for AddToListModal
  const [userRole, setUserRole] = useState<'deaf' | 'requester' | 'interpreter' | null>(null);

  // Video preview modal state
  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    name: string;
    videoUrl: string | null;
    interpreterId: string;
  }>({ isOpen: false, name: '', videoUrl: null, interpreterId: '' });

  // Add to list modal state
  const [addToListModal, setAddToListModal] = useState<{
    isOpen: boolean;
    interpreter: {
      id: string;
      name: string;
      first_name?: string;
      last_name?: string;
      initials: string;
      avatar_color: string;
      sign_languages?: string[];
      specializations?: string[];
      location?: string;
    } | null;
  }>({ isOpen: false, interpreter: null });

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteContact, setInviteContact] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [userName, setUserName] = useState('');
  const inviteFocusRef = useFocusTrap(inviteModalOpen);

  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  // Fetch auth state and user role on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);
      supabase
        .from('user_profiles')
        .select('role, display_name')
        .eq('id', user.id)
        .single()
        .then(async ({ data }) => {
          const dbRole = data?.role as 'deaf' | 'requester' | 'interpreter' | undefined;
          if (data?.display_name) {
            setUserName(data.display_name);
          } else if (user.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name);
          }

          // For multi-role users: prefer localStorage lastRole if valid
          try {
            const lastRole = localStorage.getItem('signpost:lastRole');
            if (lastRole && lastRole !== dbRole && ['deaf', 'requester', 'interpreter'].includes(lastRole)) {
              // Verify the user actually has a profile for this role
              const table = lastRole === 'interpreter' ? 'interpreter_profiles'
                : lastRole === 'deaf' ? 'deaf_profiles'
                : 'requester_profiles';
              const { count } = await supabase
                .from(table)
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user!.id);
              if ((count ?? 0) > 0) {
                setUserRole(lastRole as 'deaf' | 'requester' | 'interpreter');
                return;
              }
            }
          } catch {}

          if (dbRole) {
            setUserRole(dbRole);
          }
        });
    });
  }, []);

  // Handlers
  const openVideoPreview = (interpreter: Interpreter) => {
    setVideoModal({
      isOpen: true,
      name: interpreter.name,
      videoUrl: interpreter.videoUrl || null,
      interpreterId: String(interpreter.id),
    });
  };

  const openAddToList = (interpreter: Interpreter) => {
    const nameParts = interpreter.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || interpreter.name.slice(0, 2).toUpperCase();

    setAddToListModal({
      isOpen: true,
      interpreter: {
        id: String(interpreter.id),
        name: interpreter.name,
        first_name: firstName,
        last_name: lastName,
        initials,
        avatar_color: interpreter.color || 'linear-gradient(135deg, #7b61ff, #00e5ff)',
        sign_languages: interpreter.signLangs,
        specializations: interpreter.specs,
        location: interpreter.location,
      },
    });
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  // Language matching helper: handles both short codes ("ASL") and full names ("American Sign Language (ASL)")
  // stored in DB. Short codes match via exact match or parenthetical, e.g. "ASL" matches "American Sign Language (ASL)".
  // Full names match via startsWith, e.g. "Spanish" matches "Spanish (Español)".
  function langMatches(stored: string, filter: string): boolean {
    if (stored === filter) return true;
    if (stored.includes(`(${filter})`)) return true;
    if (stored.startsWith(filter)) return true;
    return false;
  }

  const filtered = useMemo(() => {
    const base = interpreters.filter((i) => {
      // Search across name, location, state, sign languages, spoken languages, specs, regions
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const searchable = [
          i.name,
          i.location,
          i.state,
          i.country,
          ...i.signLangs,
          ...i.spokenLangs,
          ...i.specs,
          ...i.regions,
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      // Distance filter — Haversine calculation
      if (filters.distanceRadius !== 'any' && filters.userLat != null && filters.userLng != null) {
        const radiusMiles = parseInt(filters.distanceRadius, 10);
        if (i.latitude != null && i.longitude != null) {
          const dist = haversineDistance(filters.userLat, filters.userLng, i.latitude, i.longitude);
          if (dist > radiusMiles) return false;
        }
        // Interpreters without coordinates are always shown
      }

      // Sign languages — handles both short codes (seed data) and full names (signup data)
      if (filters.signLangs.length > 0 && !filters.signLangs.some((l) => i.signLangs.some(sl => langMatches(sl, l)))) return false;

      // Spoken languages — handles both short names (seed data) and full names (signup data)
      if (filters.spokenLangs.length > 0 && !filters.spokenLangs.some((l) => i.spokenLangs.some(sl => langMatches(sl, l)))) return false;

      // Specializations
      if (filters.specs.length > 0 && !filters.specs.some((s) => i.specs.includes(s) || (i.specializedSkills || []).includes(s))) return false;

      // Certification toggle — require at least one cert
      if (filters.certs.includes('__any_cert__') && i.certs.length === 0) return false;

      // Regions
      if (filters.regions.length > 0 && !filters.regions.some((r) => i.regions.includes(r))) return false;

      // Gender
      if (filters.gender && i.gender !== filters.gender) return false;

      // Deaf interpreter
      if (filters.isDeafInterpreter && !i.isDeafInterpreter) return false;
      if (filters.availability === 'hearing' && i.isDeafInterpreter) return false;

      // Affinities (LGBTQ+, Deaf-parented, BIPOC)
      const affinityChecks = filters.affinities.filter((a) => a !== 'Religious');
      if (affinityChecks.length > 0 && !affinityChecks.every((a) => i.affinities.includes(a))) return false;

      // Racial identity (sub-filter of BIPOC)
      if (filters.racialIdentity.length > 0 && !filters.racialIdentity.some((r) => i.racialIdentity.includes(r))) return false;

      // Religious affiliation
      if (filters.affinities.includes('Religious') && i.religiousAffiliation.length === 0) return false;
      if (filters.religiousAffiliation.length > 0 && !filters.religiousAffiliation.some((r) => i.religiousAffiliation.includes(r))) return false;

      return true;
    });

    // Calculate distances and sort when user location is set
    const withDistances = base.map(i => {
      if (filters.userLat != null && filters.userLng != null && i.latitude != null && i.longitude != null) {
        return { ...i, distance: Math.round(haversineDistance(filters.userLat, filters.userLng, i.latitude, i.longitude)) };
      }
      return { ...i, distance: null };
    });

    if (filters.userLat != null && filters.userLng != null && filters.distanceRadius !== 'any') {
      // Sort by distance (closest first), interpreters without coords go to end
      withDistances.sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
    }

    return withDistances;
  }, [filters, interpreters]);

  const activeFilterCount =
    filters.signLangs.length +
    filters.spokenLangs.length +
    filters.specs.length +
    filters.certs.length +
    filters.regions.length +
    filters.affinities.length +
    filters.racialIdentity.length +
    filters.religiousAffiliation.length +
    (filters.gender ? 1 : 0) +
    (filters.isDeafInterpreter ? 1 : 0) +
    (filters.distanceRadius !== 'any' && filters.userLat != null ? 1 : 0);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Body — full width */}
      <div
        className="directory-body"
        style={{
          padding: '100px 32px 32px',
          display: 'flex',
          gap: '32px',
          alignItems: 'flex-start',
          filter: isLoggedIn === false ? 'blur(8px)' : 'none',
          pointerEvents: isLoggedIn === false ? 'none' : 'auto',
          userSelect: isLoggedIn === false ? 'none' : 'auto',
          transition: 'filter 0.3s',
        }}
      >
        {/* Sidebar desktop */}
        <div className="filter-sidebar-desktop">
          <FilterSidebar filters={filters} onChange={setFilters} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
          {/* Page title */}
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '1.7rem',
            margin: '0 0 6px',
            color: 'var(--text)',
          }}>
            Interpreter Directory
          </h1>
          <p style={{
            color: 'var(--muted)',
            fontSize: '0.9rem',
            marginBottom: 24,
            lineHeight: 1.5,
          }}>
            Browse interpreter profiles, watch intro videos, and connect directly.
          </p>

          {/* Invite prompt */}
          <div style={{
            background: 'rgba(0,229,255,0.03)',
            border: '1px dashed rgba(0,229,255,0.3)',
            borderRadius: 8,
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            <span style={{
              color: 'var(--muted)',
              fontSize: '0.88rem',
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.5,
            }}>
              Don&apos;t see an interpreter here who you love working with?{' '}
              <button
                onClick={() => {
                  const defaultMsg = `${userName || 'Someone'} wants you to join signpost — a community-built interpreter directory connecting interpreters directly with the Deaf community. Create your free profile: https://signpost.community/interpreter`;
                  setInviteMessage(defaultMsg);
                  setInviteName('');
                  setInviteContact('');
                  setInviteModalOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  padding: 0,
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Invite them to signpost.
              </button>
            </span>
          </div>

          {/* Hidden for beta — unhide when directory is larger */}
          {false && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{filtered.length}</span>{' '}
              interpreter{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
          )}

          {/* Mobile filter toggle */}
          <div className="filter-mobile-toggle" style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setFilterOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 16px',
                color: 'var(--text)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
              Filters
              {activeFilterCount > 0 && (
                <span
                  style={{
                    background: 'var(--accent)',
                    color: '#000',
                    borderRadius: '100px',
                    padding: '2px 7px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile filter panel — full screen overlay */}
          {filterOpen && (
            <div
              className="filter-mobile-panel"
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                background: 'var(--bg)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                position: 'sticky',
                top: 0,
                background: 'var(--bg)',
                zIndex: 1,
              }}>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                }}>
                  Filters
                </span>
                <button
                  onClick={() => setFilterOpen(false)}
                  aria-label="Close filters"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={{ padding: '20px', flex: 1 }}>
                <FilterSidebar filters={filters} onChange={setFilters} />
              </div>
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
                position: 'sticky',
                bottom: 0,
                background: 'var(--bg)',
              }}>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  Show {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          <InterpreterGrid
            interpreters={filtered}
            onVideoPreview={openVideoPreview}
            onAddToList={openAddToList}
            userRole={userRole}
          />
        </div>
      </div>

      {/* ── Login overlay (shown when logged out) ── */}
      {isLoggedIn === false && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '40px 48px',
              textAlign: 'center',
              maxWidth: 480,
              width: '90%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              pointerEvents: 'auto',
            }}
          >
            <div className="wordmark" style={{ fontSize: '1.1rem', marginBottom: 24 }}>
              sign<span>post</span>
            </div>
            <h2
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: 10,
                lineHeight: 1.3,
              }}
            >
              Create an account to browse the interpreter directory
            </h2>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: '0.9rem',
                lineHeight: 1.65,
                marginBottom: 28,
              }}
            >
              signpost connects you directly with qualified sign language interpreters. Create a free account to search profiles, view credentials, and start booking.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href="/interpreter"
                className="btn-primary"
                style={{
                  display: 'block',
                  padding: '13px 24px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                }}
              >
                Create an Account &rarr;
              </Link>
              <Link
                href="/interpreter/login"
                style={{
                  display: 'block',
                  padding: '13px 24px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'none',
                  color: 'var(--muted)',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Video preview modal */}
      <VideoPreviewModal
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal(prev => ({ ...prev, isOpen: false }))}
        interpreterName={videoModal.name}
        videoUrl={videoModal.videoUrl}
        interpreterId={videoModal.interpreterId}
      />

      {/* Add to list modal */}
      <AddToListModal
        isOpen={addToListModal.isOpen}
        onClose={() => setAddToListModal({ isOpen: false, interpreter: null })}
        interpreter={addToListModal.interpreter}
        userRole={userRole}
        onSuccess={(name) => showToast(`${name} added to your list`)}
        onDuplicate={(name) => showToast(`${name} is already on your list`)}
      />

      {/* Invite modal */}
      {inviteModalOpen && (
        <div
          onClick={() => setInviteModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(7,9,16,0.88)',
            backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            ref={inviteFocusRef}
            role="dialog"
            aria-modal="true"
            aria-label="Send an invite"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                fontSize: '1rem', color: 'var(--text)',
              }}>
                Send an invite
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                aria-label="Close"
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--muted)', fontSize: '1.2rem',
                  cursor: 'pointer', padding: '4px 8px',
                  borderRadius: 6, lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
                  Their name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="e.g. Sarah Johnson"
                  style={{
                    width: '100%', background: 'var(--surface2)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    padding: '11px 14px', color: 'var(--text)',
                    fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
                  Their email or phone number
                </label>
                <input
                  type="text"
                  value={inviteContact}
                  onChange={e => setInviteContact(e.target.value)}
                  placeholder="email@example.com or (555) 123-4567"
                  style={{
                    width: '100%', background: 'var(--surface2)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    padding: '11px 14px', color: 'var(--text)',
                    fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
                  Message
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={e => setInviteMessage(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%', background: 'var(--surface2)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    padding: '11px 14px', color: 'var(--text)',
                    fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif",
                    outline: 'none', boxSizing: 'border-box',
                    resize: 'vertical', lineHeight: 1.5,
                  }}
                />
              </div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteMessage);
                    setInviteModalOpen(false);
                    showToast('Invite copied! Paste it in an email or text message.');
                  } catch {
                    showToast('Could not copy — please select and copy the message manually.');
                  }
                }}
                className="btn-primary"
                style={{
                  padding: '13px 24px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Send invite
              </button>
              <p style={{
                fontSize: '0.78rem', color: 'var(--muted)',
                lineHeight: 1.5, margin: 0, textAlign: 'center',
              }}>
                They&apos;ll receive an email with your name and an invitation to create their signpost profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#00c875',
          color: '#000',
          padding: '12px 24px',
          borderRadius: '10px',
          fontWeight: 600,
          fontSize: '0.9rem',
          zIndex: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        .filter-sidebar-desktop { display: block; }
        .filter-mobile-toggle { display: none; }
        .filter-mobile-panel { display: none; }
        @media (max-width: 768px) {
          .filter-sidebar-desktop { display: none !important; }
          .filter-mobile-toggle { display: block !important; }
          .filter-mobile-panel { display: flex !important; }
          .filter-mobile-panel .filter-sidebar { width: 100% !important; position: static !important; max-height: none !important; }
          .directory-body { padding: 80px 16px 24px !important; flex-direction: column !important; gap: 16px !important; }
        }
        @media (max-width: 480px) {
          .directory-body { padding: 72px 12px 16px !important; }
        }
      `}</style>
    </div>
  );
}
