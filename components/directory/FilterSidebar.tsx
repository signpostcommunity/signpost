'use client';

import { ALL_SIGN_LANGS, ALL_SPOKEN_LANGS, ALL_SPECS, ALL_CERTS, ALL_REGIONS } from '@/lib/data/seed';
import type { FilterState } from '@/lib/types';

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const RADIUS_OPTIONS = [
  { label: 'Within 25 mi', value: '25' },
  { label: 'Within 50 mi', value: '50' },
  { label: 'Within 100 mi', value: '100' },
  { label: 'Any distance', value: 'any' },
];

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
        top: 80,
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
        paddingRight: '8px',
        paddingBottom: '40px',
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
          Search
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

      {/* Search — searches across name, location, state, languages */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Name, location, state, language..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '9px 12px',
            color: 'var(--text)',
            fontSize: '0.82rem',
            outline: 'none',
          }}
        />
      </div>

      <Divider />

      {/* Sign Languages — cyan pills */}
      <FilterGroup label="Sign Languages">
        {ALL_SIGN_LANGS.map((lang) => (
          <FilterChip
            key={lang}
            label={lang}
            selected={filters.signLangs.includes(lang)}
            onClick={() => toggle('signLangs', lang)}
            colorScheme="cyan"
          />
        ))}
      </FilterGroup>

      <Divider />

      {/* Spoken Languages — default pills */}
      <FilterGroup label="Spoken Languages">
        {ALL_SPOKEN_LANGS.map((lang) => (
          <FilterChip
            key={lang}
            label={lang}
            selected={filters.spokenLangs.includes(lang)}
            onClick={() => toggle('spokenLangs', lang)}
            colorScheme="default"
          />
        ))}
      </FilterGroup>

      <Divider />

      {/* Region Available */}
      <FilterGroup label="Region Available">
        {ALL_REGIONS.map((region) => (
          <FilterChip
            key={region}
            label={region}
            selected={filters.regions.includes(region)}
            onClick={() => toggle('regions', region)}
            colorScheme="green"
          />
        ))}
      </FilterGroup>

      <Divider />

      {/* Distance / Radius */}
      <FilterGroup label="Distance">
        <select
          value={filters.country || 'any'}
          onChange={(e) => {
            // Using the 'country' field as a temporary holder for radius selection
            // TODO: wire up to actual geolocation filtering when Supabase has zip/lat-lng
            onChange({ ...filters, country: e.target.value === 'any' ? '' : e.target.value });
          }}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'var(--text)',
            fontSize: '0.82rem',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23b0b8d0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '32px',
          }}
        >
          {RADIUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterGroup>

      <Divider />

      {/* Specializations — purple pills */}
      <FilterGroup label="Specialization">
        {ALL_SPECS.map((spec) => (
          <FilterChip
            key={spec}
            label={spec}
            selected={filters.specs.includes(spec)}
            onClick={() => toggle('specs', spec)}
            colorScheme="purple"
          />
        ))}
      </FilterGroup>

      <Divider />

      {/* Certifications — orange/warm pills */}
      <FilterGroup label="Certification">
        {ALL_CERTS.map((cert) => (
          <FilterChip
            key={cert}
            label={cert}
            selected={filters.certs.includes(cert)}
            onClick={() => toggle('certs', cert)}
            colorScheme="warm"
          />
        ))}
      </FilterGroup>
    </aside>
  );
}

/* ── Divider ── */
function Divider() {
  return (
    <div
      style={{
        height: '1px',
        background: 'var(--border)',
        margin: '4px 0 16px',
      }}
    />
  );
}

/* ── Filter group ── */
function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
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

/* ── Color-coded filter chip ── */
type ColorScheme = 'cyan' | 'purple' | 'green' | 'warm' | 'default';

const chipColors: Record<ColorScheme, { border: string; bg: string; color: string; selectedBorder: string; selectedBg: string; selectedColor: string }> = {
  cyan: {
    border: 'var(--border)',
    bg: 'var(--surface)',
    color: 'var(--muted)',
    selectedBorder: 'rgba(0,229,255,0.5)',
    selectedBg: 'rgba(0,229,255,0.12)',
    selectedColor: '#00e5ff',
  },
  purple: {
    border: 'var(--border)',
    bg: 'var(--surface)',
    color: 'var(--muted)',
    selectedBorder: 'rgba(123,97,255,0.5)',
    selectedBg: 'rgba(123,97,255,0.12)',
    selectedColor: '#9d87ff',
  },
  green: {
    border: 'var(--border)',
    bg: 'var(--surface)',
    color: 'var(--muted)',
    selectedBorder: 'rgba(52,211,153,0.5)',
    selectedBg: 'rgba(52,211,153,0.12)',
    selectedColor: '#34d399',
  },
  warm: {
    border: 'var(--border)',
    bg: 'var(--surface)',
    color: 'var(--muted)',
    selectedBorder: 'rgba(255,149,0,0.5)',
    selectedBg: 'rgba(255,149,0,0.12)',
    selectedColor: '#ff9500',
  },
  default: {
    border: 'var(--border)',
    bg: 'var(--surface)',
    color: 'var(--muted)',
    selectedBorder: 'rgba(240,242,248,0.3)',
    selectedBg: 'rgba(240,242,248,0.08)',
    selectedColor: 'var(--text)',
  },
};

function FilterChip({
  label,
  selected,
  onClick,
  colorScheme = 'default',
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  colorScheme?: ColorScheme;
}) {
  const scheme = chipColors[colorScheme];

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
        border: `1px solid ${selected ? scheme.selectedBorder : scheme.border}`,
        background: selected ? scheme.selectedBg : scheme.bg,
        color: selected ? scheme.selectedColor : scheme.color,
        transition: 'all 0.15s',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {label}
    </button>
  );
}
