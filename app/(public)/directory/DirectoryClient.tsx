'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { Interpreter, FilterState } from '@/lib/types';
import FilterSidebar from '@/components/directory/FilterSidebar';
import InterpreterGrid from '@/components/directory/InterpreterGrid';
import VideoPreviewModal from '@/components/directory/VideoPreviewModal';
import AddToListModal from '@/components/directory/AddToListModal';
import BatchAddToListModal from '@/components/directory/BatchAddToListModal';
import { createClient } from '@/lib/supabase/client';

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
  mentorshipOffering: false,
  mentorshipSeeking: false,
};

export default function DirectoryClient({ interpreters, awayPeriods }: { interpreters: Interpreter[]; awayPeriods?: Record<string, { end_date: string; message: string; dim_profile: boolean }> }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [autoFilterLabels, setAutoFilterLabels] = useState<string[]>([]);

  // Auth state - starts null (loading), then true/false
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // User role for AddToListModal
  const [userRole, setUserRole] = useState<'deaf' | 'requester' | 'interpreter' | null>(null);
  // URL context param for multi-role users (e.g. ?context=interpreter)
  const [contextParam, setContextParam] = useState<string | null>(null);

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

  // Selection mode state
  const MAX_BATCH_SELECT = 15
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchModalOpen, setBatchModalOpen] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= MAX_BATCH_SELECT) {
          showToast(`Maximum ${MAX_BATCH_SELECT} interpreters can be added at once.`)
          return prev
        }
        next.add(id)
      }
      return next
    })
  }

  const selectAllOnPage = () => {
    const visibleIds = filtered.map(i => String(i.id))
    const toAdd = visibleIds.slice(0, MAX_BATCH_SELECT)
    setSelectedIds(new Set(toAdd))
    if (visibleIds.length > MAX_BATCH_SELECT) {
      showToast(`Selected first ${MAX_BATCH_SELECT} of ${visibleIds.length} visible interpreters.`)
    }
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }


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
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          // Determine active role for modal (layered fallback)
          // Priority: URL ?context > localStorage signpost:lastRole > user_profiles.role
          const urlContext = new URLSearchParams(window.location.search).get('context');
          const validRoles = ['deaf', 'requester', 'interpreter'];

          if (urlContext && validRoles.includes(urlContext)) {
            setUserRole(urlContext as 'deaf' | 'requester' | 'interpreter');
            setContextParam(urlContext);
          } else {
            try {
              const lastRole = localStorage.getItem('signpost:lastRole');
              if (lastRole && validRoles.includes(lastRole)) {
                setUserRole(lastRole as 'deaf' | 'requester' | 'interpreter');
              } else if (data?.role) {
                setUserRole(data.role as 'deaf' | 'requester' | 'interpreter');
              }
            } catch {
              // localStorage unavailable (private browsing, etc.)
              if (data?.role) {
                setUserRole(data.role as 'deaf' | 'requester' | 'interpreter');
              }
            }
          }
        });
    });
  }, []);

  // Auto-populate filters from URL params (smart directory link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const labels: string[] = [];
    const patch: Partial<FilterState> = {};

    const signLang = params.get('signLang');
    if (signLang) { patch.signLangs = [signLang]; labels.push(signLang); }

    const spokenLang = params.get('spokenLang');
    if (spokenLang) { patch.spokenLangs = [spokenLang]; labels.push(spokenLang); }

    const spec = params.get('spec');
    if (spec) { patch.specs = [spec]; labels.push(spec); }

    const location = params.get('location');
    if (location) { patch.userLocationLabel = location; labels.push(location); }

    const gender = params.get('gender');
    if (gender) { patch.gender = gender; labels.push(gender); }

    const affinity = params.get('affinity');
    if (affinity) { patch.affinities = [affinity]; labels.push(affinity); }

    if (labels.length > 0) {
      setFilters(prev => ({ ...prev, ...patch }));
      setAutoFilterLabels(labels);
    }
  }, []);

  function clearAutoFilters() {
    setFilters(defaultFilters);
    setAutoFilterLabels([]);
    // Clean URL params without full reload
    const url = new URL(window.location.href);
    ['signLang', 'spokenLang', 'spec', 'location', 'gender', 'affinity', 'workMode', 'eventCategory'].forEach(p => url.searchParams.delete(p));
    window.history.replaceState({}, '', url.toString());
  }

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

      // Distance filter - Haversine calculation
      if (filters.distanceRadius !== 'any' && filters.userLat != null && filters.userLng != null) {
        const radiusMiles = parseInt(filters.distanceRadius, 10);
        if (i.latitude != null && i.longitude != null) {
          const dist = haversineDistance(filters.userLat, filters.userLng, i.latitude, i.longitude);
          if (dist > radiusMiles) return false;
        }
        // Interpreters without coordinates are always shown
      }

      // Sign languages - handles both short codes (seed data) and full names (signup data)
      if (filters.signLangs.length > 0 && !filters.signLangs.some((l) => i.signLangs.some(sl => langMatches(sl, l)))) return false;

      // Spoken languages - handles both short names (seed data) and full names (signup data)
      if (filters.spokenLangs.length > 0 && !filters.spokenLangs.some((l) => i.spokenLangs.some(sl => langMatches(sl, l)))) return false;

      // Specializations
      if (filters.specs.length > 0 && !filters.specs.some((s) => i.specs.includes(s) || (i.specializedSkills || []).includes(s))) return false;

      // Certification toggle - require at least one cert
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

      // Mentorship filters
      if (filters.mentorshipOffering && !i.mentorshipOffering) return false;
      if (filters.mentorshipSeeking && !i.mentorshipSeeking) return false;

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
    (filters.distanceRadius !== 'any' && filters.userLat != null ? 1 : 0) +
    (filters.mentorshipOffering ? 1 : 0) +
    (filters.mentorshipSeeking ? 1 : 0);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Body - full width */}
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
          <FilterSidebar filters={filters} onChange={setFilters} userRole={userRole} />
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

          {/* Auto-filter banner */}
          {autoFilterLabels.length > 0 && (
            <div style={{
              background: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: 10, padding: '14px 20px',
              marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600, marginBottom: 3 }}>
                  Showing interpreters matching your request: {autoFilterLabels.join(' \u00b7 ')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  These filters were applied automatically based on your booking details. You can adjust or remove any filter.
                </div>
              </div>
              <button
                onClick={clearAutoFilters}
                style={{
                  background: 'none', border: '1px solid rgba(0,229,255,0.3)',
                  borderRadius: 8, padding: '6px 14px',
                  color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Clear all auto-filters
              </button>
            </div>
          )}

          {/* Select Multiple toggle */}
          {isLoggedIn && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  if (selectionMode) {
                    exitSelectionMode()
                  } else {
                    setSelectionMode(true)
                  }
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '8px 16px', borderRadius: 10,
                  background: selectionMode ? 'rgba(0,229,255,0.1)' : 'transparent',
                  border: `1px solid ${selectionMode ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
                  color: selectionMode ? 'var(--accent)' : 'var(--muted)',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                {selectionMode ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M4 8l3 3 5-6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Selecting
                    <span style={{
                      marginLeft: 4, fontSize: '0.72rem', color: 'var(--muted)',
                    }}>
                      Cancel
                    </span>
                  </>
                ) : (
                  'Select Multiple'
                )}
              </button>
            </div>
          )}

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
              <Link
                href="/invite"
                style={{
                  color: 'var(--accent)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Invite them to signpost.
              </Link>
            </span>
          </div>

          {/* Hidden - unhide when directory is larger */}
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

          {/* Mobile filter panel - full screen overlay */}
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
                <FilterSidebar filters={filters} onChange={setFilters} userRole={userRole} />
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
            contextParam={contextParam}
            awayPeriods={awayPeriods}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
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

      {/* Floating action bar for selection mode */}
      {selectionMode && selectedIds.size > 0 && (
        <div
          role="toolbar"
          aria-label="Batch selection actions"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            zIndex: 100,
            background: '#111118',
            borderTop: '1px solid var(--border)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
            padding: '14px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 16, flexWrap: 'wrap',
          }}
        >
          <span
            aria-live="polite"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)',
            }}
          >
            <span style={{
              background: 'var(--accent)', color: '#000',
              borderRadius: 6, padding: '2px 8px',
              fontSize: '0.78rem', fontWeight: 700,
            }}>
              {selectedIds.size}
            </span>
            selected
          </span>
          <button
            type="button"
            onClick={selectAllOnPage}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 10, padding: '8px 16px',
              fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Select All on Page
          </button>
          <button
            type="button"
            onClick={() => setBatchModalOpen(true)}
            className="btn-primary"
            style={{
              padding: '10px 24px', fontSize: '0.88rem', fontWeight: 700,
              border: 'none', cursor: 'pointer',
            }}
          >
            Add to List
          </button>
        </div>
      )}

      {/* Batch add modal */}
      <BatchAddToListModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        interpreters={
          filtered
            .filter(i => selectedIds.has(String(i.id)))
            .map(i => ({ id: String(i.id), name: i.name }))
        }
        userRole={userRole}
        onSuccess={(count, dupeCount) => {
          exitSelectionMode()
          let msg = `Added ${count} interpreter${count !== 1 ? 's' : ''} to your list.`
          if (dupeCount > 0) {
            msg += ` ${dupeCount} ${dupeCount === 1 ? 'was' : 'were'} already on your list.`
          }
          showToast(msg)
        }}
      />

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
