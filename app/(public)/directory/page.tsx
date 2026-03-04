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
      if (filters.signLangs.length > 0 && !filters.signLangs.some((l) => i.signLangs.includes(l))) return false;
      if (filters.spokenLangs.length > 0 && !filters.spokenLangs.some((l) => i.spokenLangs.includes(l))) return false;
      if (filters.specs.length > 0 && !filters.specs.some((s) => i.specs.includes(s))) return false;
      // Certification toggle: if __any_cert__ is set, require at least one cert
      if (filters.certs.includes('__any_cert__') && i.certs.length === 0) return false;
      if (filters.regions.length > 0 && !filters.regions.some((r) => i.regions.includes(r))) return false;
      return true;
    });
  }, [filters]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Body — full width */}
      <div
        style={{
          padding: '100px 32px 32px',
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
