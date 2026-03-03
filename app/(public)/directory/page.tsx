'use client';

import { useState, useMemo } from 'react';
import { interpreters } from '@/lib/data/seed';
import type { FilterState } from '@/lib/types';
import FilterSidebar from '@/components/directory/FilterSidebar';
import InterpreterGrid from '@/components/directory/InterpreterGrid';

const defaultFilters: FilterState = {
  signLangs: [],
  spokenLangs: [],
  specs: [],
  certs: [],
  regions: [],
  availability: null,
  search: '',
  country: '',
};

export default function DirectoryPage() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    return interpreters.filter((i) => {
      if (filters.search && !i.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.availability === 'available' && !i.available) return false;
      if (filters.signLangs.length > 0 && !filters.signLangs.some((l) => i.signLangs.includes(l))) return false;
      if (filters.spokenLangs.length > 0 && !filters.spokenLangs.some((l) => i.spokenLangs.includes(l))) return false;
      if (filters.specs.length > 0 && !filters.specs.some((s) => i.specs.includes(s))) return false;
      if (filters.certs.length > 0 && !filters.certs.some((c) => i.certs.includes(c))) return false;
      if (filters.regions.length > 0 && !filters.regions.some((r) => i.regions.includes(r))) return false;
      return true;
    });
  }, [filters]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '32px 40px 24px',
          background: 'var(--surface)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: '100px',
              padding: '6px 16px',
              fontSize: '0.78rem',
              color: 'var(--accent)',
              marginBottom: '12px',
              fontWeight: 500,
            }}
          >
            Global Directory
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              marginBottom: '6px',
            }}
          >
            Browse Sign Language Interpreters
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            {filtered.length} interpreter{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '32px 40px',
          display: 'flex',
          gap: '32px',
          alignItems: 'flex-start',
        }}
      >
        {/* Sidebar desktop */}
        <div className="filter-sidebar-desktop">
          <FilterSidebar filters={filters} onChange={setFilters} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
              {(filters.signLangs.length + filters.spokenLangs.length + filters.specs.length + filters.certs.length + filters.regions.length) > 0 && (
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
                  {filters.signLangs.length + filters.spokenLangs.length + filters.specs.length + filters.certs.length + filters.regions.length}
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

          <InterpreterGrid interpreters={filtered} />
        </div>
      </div>

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
