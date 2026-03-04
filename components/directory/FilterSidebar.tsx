'use client';

import { ALL_SIGN_LANGS, ALL_SPOKEN_LANGS, ALL_SPECS, ALL_REGIONS } from '@/lib/data/seed';
import type { FilterState } from '@/lib/types';

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const RADIUS_OPTIONS = [
  { label: 'Any distance', value: 'any' },
  { label: 'Within 25 mi', value: '25' },
  { label: 'Within 50 mi', value: '50' },
  { label: 'Within 100 mi', value: '100' },
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

  const certifiedOnly = filters.certs.length > 0;

  const hasFilters =
    filters.signLangs.length > 0 ||
    filters.spokenLangs.length > 0 ||
    filters.specs.length > 0 ||
    certifiedOnly ||
    filters.regions.length > 0 ||
    filters.search !== '' ||
    (filters.country !== '' && filters.country !== 'any');

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

      {/* 1. Search */}
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

      {/* 2. Distance */}
      <FilterGroup label="Distance">
        <select
          value={filters.country || 'any'}
          onChange={(e) => {
            // Using 'country' field temporarily for radius
            // TODO: wire to geolocation when Supabase has zip/lat-lng
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

      {/* 3. Specialization — purple pills */}
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

      {/* 4. Certification — toggle */}
      <FilterGroup label="Certification">
        <button
          onClick={() => {
            if (certifiedOnly) {
              onChange({ ...filters, certs: [] });
            } else {
              onChange({ ...filters, certs: ['__any_cert__'] });
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '8px 12px',
            background: certifiedOnly ? 'rgba(0,229,255,0.08)' : 'var(--surface)',
            border: certifiedOnly ? '1px solid rgba(0,229,255,0.35)' : '1px solid var(--border)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Toggle track */}
          <div
            style={{
              width: 34,
              height: 18,
              borderRadius: '100px',
              background: certifiedOnly ? 'var(--accent)' : 'var(--surface2)',
              border: certifiedOnly ? 'none' : '1px solid var(--border)',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: certifiedOnly ? '#000' : 'var(--muted)',
                position: 'absolute',
                top: 2,
                left: certifiedOnly ? 18 : 2,
                transition: 'left 0.2s',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '0.8rem',
              color: certifiedOnly ? 'var(--accent)' : 'var(--muted)',
              fontWeight: certifiedOnly ? 600 : 400,
              transition: 'color 0.15s',
            }}
          >
            Certified interpreters only
          </span>
        </button>
        <p
          style={{
            fontSize: '0.7rem',
            color: 'var(--muted)',
            opacity: 0.7,
            marginTop: '6px',
            lineHeight: 1.4,
          }}
        >
          Many countries don&apos;t have formal certification. Turning this on may limit results.
        </p>
      </FilterGroup>

      <Divider />

      {/* 5. Sign Languages — cyan pills */}
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

      {/* 6. Spoken Languages — default pills */}
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

      {/* 7. Region Available — green pills */}
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
