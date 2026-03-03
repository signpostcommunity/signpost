'use client';

import { ALL_SIGN_LANGS, ALL_SPOKEN_LANGS, ALL_SPECS, ALL_CERTS, ALL_REGIONS } from '@/lib/data/seed';
import type { FilterState } from '@/lib/types';

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export default function FilterSidebar({ filters, onChange }: Props) {
  function toggle(key: keyof FilterState, value: string) {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  }

  function clearAll() {
    onChange({
      signLangs: [],
      spokenLangs: [],
      specs: [],
      certs: [],
      regions: [],
      availability: null,
      search: '',
      country: '',
    });
  }

  const hasFilters =
    filters.signLangs.length > 0 ||
    filters.spokenLangs.length > 0 ||
    filters.specs.length > 0 ||
    filters.certs.length > 0 ||
    filters.regions.length > 0 ||
    filters.availability !== null ||
    filters.search !== '';

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        position: 'sticky',
        top: 93,
        maxHeight: 'calc(100vh - 110px)',
        overflowY: 'auto',
        paddingRight: '4px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          Filters
        </span>
        {hasFilters && (
          <button
            onClick={clearAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '9px 12px',
            color: 'var(--text)',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Availability */}
      <FilterGroup label="Availability">
        {['Available now', 'Any'].map((opt) => (
          <FilterChip
            key={opt}
            label={opt}
            selected={
              opt === 'Available now'
                ? filters.availability === 'available'
                : filters.availability === null
            }
            onClick={() =>
              onChange({
                ...filters,
                availability: opt === 'Available now' ? 'available' : null,
              })
            }
          />
        ))}
      </FilterGroup>

      {/* Sign Languages */}
      <FilterGroup label="Sign Language">
        {ALL_SIGN_LANGS.map((lang) => (
          <FilterChip
            key={lang}
            label={lang}
            selected={filters.signLangs.includes(lang)}
            onClick={() => toggle('signLangs', lang)}
          />
        ))}
      </FilterGroup>

      {/* Spoken Languages */}
      <FilterGroup label="Spoken Language">
        {ALL_SPOKEN_LANGS.map((lang) => (
          <FilterChip
            key={lang}
            label={lang}
            selected={filters.spokenLangs.includes(lang)}
            onClick={() => toggle('spokenLangs', lang)}
          />
        ))}
      </FilterGroup>

      {/* Specializations */}
      <FilterGroup label="Specialization">
        {ALL_SPECS.map((spec) => (
          <FilterChip
            key={spec}
            label={spec}
            selected={filters.specs.includes(spec)}
            onClick={() => toggle('specs', spec)}
          />
        ))}
      </FilterGroup>

      {/* Certifications */}
      <FilterGroup label="Certification">
        {ALL_CERTS.map((cert) => (
          <FilterChip
            key={cert}
            label={cert}
            selected={filters.certs.includes(cert)}
            onClick={() => toggle('certs', cert)}
          />
        ))}
      </FilterGroup>

      {/* Regions */}
      <FilterGroup label="Region">
        {ALL_REGIONS.map((region) => (
          <FilterChip
            key={region}
            label={region}
            selected={filters.regions.includes(region)}
            onClick={() => toggle('regions', region)}
          />
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          fontFamily: 'var(--font-syne)',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: '8px',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {children}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '100px',
        padding: '4px 11px',
        fontSize: '0.75rem',
        cursor: 'pointer',
        border: selected
          ? '1px solid rgba(0,229,255,0.5)'
          : '1px solid var(--border)',
        background: selected ? 'rgba(0,229,255,0.12)' : 'var(--surface)',
        color: selected ? 'var(--accent)' : 'var(--muted)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}
