'use client';

import { useState } from 'react';
import {
  ALL_SIGN_LANGS,
  ALL_SPOKEN_LANGS,
  ALL_REGIONS,
  ALL_RACIAL_IDENTITIES,
  ALL_RELIGIOUS_AFFILIATIONS,
} from '@/lib/data/seed';
import { SPECIALIZATION_CATEGORIES, SPECIALIZED_SKILLS } from '@/lib/constants/specializations';
import type { FilterState } from '@/lib/types';

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const RADIUS_OPTIONS = [
  { label: 'Any distance', value: 'any' },
  { label: 'Within 100 mi (same state)', value: '100' },
  { label: 'Within 250 mi (same state)', value: '250' },
  { label: 'Anywhere in country', value: 'country' },
  { label: 'International', value: 'international' },
];

const GENDER_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'nonbinary' },
];

export default function FilterSidebar({ filters, onChange }: Props) {
  function toggleArray(key: keyof FilterState, value: string) {
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
      gender: '',
      isDeafInterpreter: false,
      affinities: [],
      racialIdentity: [],
      religiousAffiliation: [],
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
    (filters.country !== '' && filters.country !== 'any') ||
    filters.gender !== '' ||
    filters.isDeafInterpreter ||
    filters.availability === 'hearing' ||
    filters.affinities.length > 0 ||
    filters.racialIdentity.length > 0 ||
    filters.religiousAffiliation.length > 0;

  return (
    <aside
      className="filter-sidebar"
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

      {/* 1. Search — always visible */}
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
      <CollapsibleSection label="Distance">
        {filters.search ? (
          <select
            value={filters.country || 'any'}
            onChange={(e) => {
              onChange({ ...filters, country: e.target.value === 'any' ? '' : e.target.value });
            }}
            style={selectStyle}
          >
            {RADIUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <>
            <select disabled style={{ ...selectStyle, opacity: 0.5, cursor: 'not-allowed' }}>
              <option>Any distance</option>
            </select>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', opacity: 0.7, marginTop: 6, lineHeight: 1.4 }}>
              Enter a location in Search to filter by distance.
            </p>
          </>
        )}
      </CollapsibleSection>

      <Divider />

      {/* 3. Interpreter Type */}
      <CollapsibleSection label="Interpreter Type">
        {/* Hearing / Deaf dropdown */}
        <select
          value={filters.isDeafInterpreter ? 'deaf' : filters.availability === 'hearing' ? 'hearing' : 'all'}
          onChange={(e) => {
            const val = e.target.value;
            onChange({
              ...filters,
              isDeafInterpreter: val === 'deaf',
              availability: val === 'hearing' ? 'hearing' : null,
            });
          }}
          style={{ ...selectStyle, marginBottom: '8px' }}
        >
          <option value="all">View All</option>
          <option value="hearing">Hearing Interpreter</option>
          <option value="deaf">Deaf Interpreter</option>
        </select>

        {/* Certified Only toggle */}
        <ToggleRow
          label="Certified only"
          checked={certifiedOnly}
          onChange={() => {
            onChange({ ...filters, certs: certifiedOnly ? [] : ['__any_cert__'] });
          }}
        />
        <p
          style={{
            fontSize: '0.68rem',
            color: 'var(--muted)',
            opacity: 0.7,
            marginTop: '6px',
            lineHeight: 1.4,
          }}
        >
          Many countries don&apos;t have formal certification. Turning this on may limit results.
        </p>
      </CollapsibleSection>

      <Divider />

      {/* 4. Gender Identity */}
      <CollapsibleSection label="Gender Identity">
        <select
          value={filters.gender}
          onChange={(e) => onChange({ ...filters, gender: e.target.value })}
          style={selectStyle}
        >
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </CollapsibleSection>

      <Divider />

      {/* 5. Specialization — category groups */}
      <CollapsibleSection label="Specialization">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(SPECIALIZATION_CATEGORIES).map(([category, subs]) => {
            const selectedCount = subs.filter(s => filters.specs.includes(s)).length;
            const allSelected = selectedCount === subs.length;
            return (
              <div key={category}>
                <button
                  onClick={() => {
                    if (allSelected) {
                      onChange({ ...filters, specs: filters.specs.filter(s => !subs.includes(s)) });
                    } else {
                      const newSpecs = [...new Set([...filters.specs, ...subs])];
                      onChange({ ...filters, specs: newSpecs });
                    }
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                    fontFamily: 'var(--font-syne)', fontSize: '0.65rem', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: selectedCount > 0 ? 'var(--accent)' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                  }}
                >
                  {category}
                  {selectedCount > 0 && (
                    <span style={{ fontSize: '0.6rem', background: 'rgba(0,229,255,0.15)', color: 'var(--accent)', borderRadius: 100, padding: '0 5px', fontFamily: "'DM Sans', sans-serif" }}>{selectedCount}</span>
                  )}
                </button>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingLeft: '4px' }}>
                  {subs.map(sub => (
                    <FilterChip key={sub} label={sub} selected={filters.specs.includes(sub)} onClick={() => toggleArray('specs', sub)} colorScheme="purple" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Specialized Skills */}
        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: 'var(--font-syne)', fontSize: '0.65rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a891ff',
            marginBottom: '6px',
          }}>
            Specialized Skills
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {SPECIALIZED_SKILLS.map(skill => (
              <FilterChip key={skill} label={skill} selected={filters.specs.includes(skill)} onClick={() => toggleArray('specs', skill)} colorScheme="purple" />
            ))}
          </div>
        </div>
      </CollapsibleSection>

      <Divider />

      {/* 6. Community & Identity */}
      <CollapsibleSection label="Community & Identity">
        {/* LGBTQ+ */}
        <ToggleRow
          label="LGBTQ+"
          checked={filters.affinities.includes('LGBTQ+')}
          onChange={() => toggleArray('affinities', 'LGBTQ+')}
        />
        <div style={{ height: 8 }} />

        {/* Deaf-parented */}
        <ToggleRow
          label="Deaf-Parented Interpreter / CODA"
          checked={filters.affinities.includes('Deaf-parented')}
          onChange={() => toggleArray('affinities', 'Deaf-parented')}
        />
        <div style={{ height: 8 }} />

        {/* BIPOC */}
        <ToggleRow
          label="BIPOC"
          checked={filters.affinities.includes('BIPOC')}
          onChange={() => toggleArray('affinities', 'BIPOC')}
        />
        {/* Racial identity sub-options */}
        {filters.affinities.includes('BIPOC') && (
          <div
            style={{
              marginTop: '8px',
              marginLeft: '12px',
              paddingLeft: '12px',
              borderLeft: '2px solid var(--border)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px',
            }}
          >
            {ALL_RACIAL_IDENTITIES.map((ri) => (
              <FilterChip
                key={ri}
                label={ri}
                selected={filters.racialIdentity.includes(ri)}
                onClick={() => toggleArray('racialIdentity', ri)}
                colorScheme="warm"
              />
            ))}
          </div>
        )}
        <div style={{ height: 8 }} />

        {/* Religious affiliation */}
        <ToggleRow
          label="Religious affiliation"
          checked={filters.affinities.includes('Religious')}
          onChange={() => toggleArray('affinities', 'Religious')}
        />
        {/* Religion sub-options */}
        {filters.affinities.includes('Religious') && (
          <div
            style={{
              marginTop: '8px',
              marginLeft: '12px',
              paddingLeft: '12px',
              borderLeft: '2px solid var(--border)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '5px',
            }}
          >
            {ALL_RELIGIOUS_AFFILIATIONS.map((ra) => (
              <FilterChip
                key={ra}
                label={ra}
                selected={filters.religiousAffiliation.includes(ra)}
                onClick={() => toggleArray('religiousAffiliation', ra)}
                colorScheme="warm"
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <Divider />

      {/* 7. Sign Languages — cyan pills */}
      <CollapsibleSection label="Sign Languages">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {ALL_SIGN_LANGS.map((lang) => (
            <FilterChip
              key={lang}
              label={lang}
              selected={filters.signLangs.includes(lang)}
              onClick={() => toggleArray('signLangs', lang)}
              colorScheme="cyan"
            />
          ))}
        </div>
      </CollapsibleSection>

      <Divider />

      {/* 8. Spoken Languages — default pills */}
      <CollapsibleSection label="Spoken Languages">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {ALL_SPOKEN_LANGS.map((lang) => (
            <FilterChip
              key={lang}
              label={lang}
              selected={filters.spokenLangs.includes(lang)}
              onClick={() => toggleArray('spokenLangs', lang)}
              colorScheme="default"
            />
          ))}
        </div>
      </CollapsibleSection>

      <Divider />

      {/* 9. Region Available — green pills */}
      <CollapsibleSection label="Region Available">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {ALL_REGIONS.map((region) => (
            <FilterChip
              key={region}
              label={region}
              selected={filters.regions.includes(region)}
              onClick={() => toggleArray('regions', region)}
              colorScheme="green"
            />
          ))}
        </div>
      </CollapsibleSection>
    </aside>
  );
}

/* ── Shared select style ── */
const selectStyle: React.CSSProperties = {
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
};

/* ── Divider ── */
function Divider() {
  return (
    <div
      style={{
        height: '1px',
        background: 'var(--border)',
        margin: '4px 0 4px',
      }}
    />
  );
}

/* ── Collapsible section ── */
function CollapsibleSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: '4px' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-syne)',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          transition: 'color 0.15s',
        }}
      >
        <span>{label}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.5,
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div style={{ paddingBottom: '8px' }}>{children}</div>}
    </div>
  );
}

/* ── Toggle row ── */
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '6px 0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: 32,
          height: 16,
          borderRadius: '100px',
          background: checked ? 'var(--accent)' : 'var(--surface2)',
          border: checked ? 'none' : '1px solid var(--border)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: checked ? '#000' : 'var(--muted)',
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            transition: 'left 0.2s',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.8rem',
          color: checked ? 'var(--accent)' : 'var(--muted)',
          fontWeight: checked ? 600 : 400,
          transition: 'color 0.15s',
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ── Color-coded filter chip ── */
type ColorScheme = 'cyan' | 'purple' | 'green' | 'warm' | 'default';

const chipColors: Record<
  ColorScheme,
  { border: string; bg: string; color: string; selectedBorder: string; selectedBg: string; selectedColor: string }
> = {
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
