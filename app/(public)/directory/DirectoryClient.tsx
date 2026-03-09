'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { Interpreter, FilterState } from '@/lib/types';
import FilterSidebar from '@/components/directory/FilterSidebar';
import InterpreterGrid from '@/components/directory/InterpreterGrid';
import VideoPreviewModal from '@/components/directory/VideoPreviewModal';
import AddToListModal from '@/components/directory/AddToListModal';
import { createClient } from '@/lib/supabase/client';

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
};

export default function DirectoryClient({ interpreters }: { interpreters: Interpreter[] }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  // TODO: Replace with real Supabase auth check when login is hooked up.
  // Set to true to preview the logged-in directory.
  const isLoggedIn = true;

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

  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  // Fetch user role on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.role) {
            setUserRole(data.role as 'deaf' | 'requester' | 'interpreter');
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

  const filtered = useMemo(() => {
    return interpreters.filter((i) => {
      // Search across name, location, state, sign languages, spoken languages, specs, regions
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const searchable = [
          i.name,
          i.location,
          i.state,
          ...i.signLangs,
          ...i.spokenLangs,
          ...i.specs,
          ...i.regions,
        ]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      // Sign languages
      if (filters.signLangs.length > 0 && !filters.signLangs.some((l) => i.signLangs.includes(l))) return false;

      // Spoken languages
      if (filters.spokenLangs.length > 0 && !filters.spokenLangs.some((l) => i.spokenLangs.includes(l))) return false;

      // Specializations
      if (filters.specs.length > 0 && !filters.specs.some((s) => i.specs.includes(s))) return false;

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
  }, [filters]);

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
    (filters.isDeafInterpreter ? 1 : 0);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Body — full width */}
      <div
        style={{
          padding: '100px 32px 32px',
          display: 'flex',
          gap: '32px',
          alignItems: 'flex-start',
          filter: isLoggedIn ? 'none' : 'blur(6px)',
          pointerEvents: isLoggedIn ? 'auto' : 'none',
          userSelect: isLoggedIn ? 'auto' : 'none',
          transition: 'filter 0.3s',
        }}
      >
        {/* Sidebar desktop */}
        <div className="filter-sidebar-desktop">
          <FilterSidebar filters={filters} onChange={setFilters} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Results count */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{filtered.length}</span>{' '}
              interpreter{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Mobile filter toggle */}
          <div className="filter-mobile-toggle" style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
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
              ⚙ Filters
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

          {/* Mobile filter drawer */}
          {filterOpen && (
            <div
              className="filter-mobile-drawer"
              style={{
                marginBottom: '20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px',
              }}
            >
              <FilterSidebar filters={filters} onChange={setFilters} />
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
      {!isLoggedIn && (
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
              maxWidth: 440,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(0,229,255,0.1)',
                border: '1px solid rgba(0,229,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '1.4rem',
              }}
            >
              🔒
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '1.3rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: '8px',
              }}
            >
              Sign in to browse interpreters
            </h2>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              Create a free account to search the full directory, view interpreter profiles, and start booking.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/dhh"
                className="btn-primary"
                style={{
                  display: 'block',
                  padding: '12px 24px',
                  borderRadius: '100px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                Sign up — I&apos;m Deaf / Hard of Hearing
              </Link>
              <Link
                href="/request"
                style={{
                  display: 'block',
                  padding: '12px 24px',
                  borderRadius: '100px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                }}
              >
                Sign up — I&apos;m booking for an organization
              </Link>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '8px' }}>
                Already have an account?{' '}
                <Link
                  href="/dhh/login"
                  style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Log in
                </Link>
              </p>
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
        .filter-mobile-drawer { display: none; }
        @media (max-width: 768px) {
          .filter-sidebar-desktop { display: none; }
          .filter-mobile-toggle { display: block; }
          .filter-mobile-drawer { display: block; }
        }
      `}</style>
    </div>
  );
}
