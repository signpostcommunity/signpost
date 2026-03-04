'use client';

import { useSignupForm } from './FormContext';
import { StepNav } from './FormFields';

/* ── Tile data ── */

const COMMON_SIGN_LANGS = [
  { id: 'ASL', label: 'American Sign Language (ASL)' },
  { id: 'BSL', label: 'British Sign Language (BSL)' },
  { id: 'IS', label: 'International Sign (IS)' },
  { id: 'LSF', label: 'Langue des Signes Française (LSF)' },
  { id: 'LSM', label: 'Lengua de Señas Mexicana (LSM)' },
  { id: 'PTASL', label: 'ProTactile ASL (PTASL / DeafBlind)' },
];

const REGIONAL_SIGN_LANGS: Record<string, { id: string; label: string }[]> = {
  'Europe': [
    { id: 'LSE', label: 'Lengua de Signos Española (LSE)' },
    { id: 'DGS', label: 'Deutsche Gebärdensprache (DGS)' },
    { id: 'LIS', label: 'Lingua dei Segni Italiana (LIS)' },
    { id: 'NGT', label: 'Nederlandse Gebarentaal (NGT)' },
    { id: 'ISL', label: 'Irish Sign Language (ISL)' },
    { id: 'SSL', label: 'Swedish Sign Language (SSL)' },
  ],
  'Asia & Pacific': [
    { id: 'JSL', label: 'Japanese Sign Language (JSL)' },
    { id: 'KSL', label: 'Korean Sign Language (KSL)' },
    { id: 'CSL', label: 'Chinese Sign Language (CSL)' },
    { id: 'Auslan', label: 'Australian Sign Language (Auslan)' },
    { id: 'NZSL', label: 'New Zealand Sign Language (NZSL)' },
    { id: 'FSL', label: 'Filipino Sign Language (FSL)' },
  ],
  'Americas': [
    { id: 'LIBRAS', label: 'Língua Brasileira de Sinais (LIBRAS)' },
    { id: 'LSA', label: 'Lengua de Señas Argentina (LSA)' },
    { id: 'LSC', label: 'Lengua de Señas Colombiana (LSC)' },
    { id: 'LSQ', label: 'Langue des Signes Québécoise (LSQ)' },
  ],
  'Africa & Middle East': [
    { id: 'SASL', label: 'South African Sign Language (SASL)' },
    { id: 'KeSL', label: 'Kenyan Sign Language (KeSL)' },
    { id: 'ArSL', label: 'Arabic Sign Language (ArSL)' },
  ],
};

const COMMON_SPOKEN_LANGS = [
  { id: 'English', label: 'English' },
  { id: 'Spanish', label: 'Spanish (Español)' },
  { id: 'French', label: 'French (Français)' },
  { id: 'Arabic', label: 'Arabic (العربية)' },
  { id: 'Mandarin', label: 'Mandarin Chinese (普通话)' },
  { id: 'Portuguese', label: 'Portuguese (Português)' },
];

const REGIONAL_SPOKEN_LANGS: Record<string, { id: string; label: string }[]> = {
  'Europe': [
    { id: 'German', label: 'German (Deutsch)' },
    { id: 'Italian', label: 'Italian (Italiano)' },
    { id: 'Dutch', label: 'Dutch (Nederlands)' },
    { id: 'Swedish', label: 'Swedish (Svenska)' },
    { id: 'Russian', label: 'Russian (Русский)' },
    { id: 'Polish', label: 'Polish (Polski)' },
  ],
  'Asia & Pacific': [
    { id: 'Japanese', label: 'Japanese (日本語)' },
    { id: 'Korean', label: 'Korean (한국어)' },
    { id: 'Hindi', label: 'Hindi (हिन्दी)' },
    { id: 'Tagalog', label: 'Tagalog' },
    { id: 'Vietnamese', label: 'Vietnamese (Tiếng Việt)' },
  ],
  'Africa & Middle East': [
    { id: 'Swahili', label: 'Swahili (Kiswahili)' },
    { id: 'Hebrew', label: 'Hebrew (עברית)' },
    { id: 'Twi', label: 'Twi' },
    { id: 'Amharic', label: 'Amharic (አማርኛ)' },
  ],
};

const SPECIALIZATIONS = [
  'Medical', 'Legal', 'Conference / Events', 'Academic / Education',
  'Mental Health', 'Religious', 'Technical / IT', 'Music / Concerts',
  'Theatre', 'Business', 'Police / Emergency', 'Diplomatic',
];

/* ── Shared styles ── */

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--accent)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.82rem',
  marginBottom: '16px',
  lineHeight: 1.6,
};

const mostCommonStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '10px',
};

function tileStyle(selected: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: selected ? '1px solid rgba(0,229,255,0.5)' : '1px solid var(--border)',
    background: selected ? 'rgba(0,229,255,0.08)' : 'var(--surface2)',
    color: selected ? 'var(--text)' : 'var(--muted)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textAlign: 'left',
    transition: 'all 0.15s',
    width: '100%',
  };
}

const textInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '12px 14px',
  color: 'var(--text)',
  fontSize: '0.95rem',
  outline: 'none',
};

/* ── Component ── */

interface Props { onNext: () => void; onBack: () => void }

export default function Step2Languages({ onNext, onBack }: Props) {
  const { form, update, toggleArrayItem } = useSignupForm();

  const canContinue = form.signLangs.length > 0;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

        {/* ── SIGN LANGUAGES ── */}
        <div>
          <div style={sectionTitleStyle}>Sign Languages</div>
          <p style={subtitleStyle}>
            Select all sign languages in which you have professional-level fluency.
          </p>
          <div style={mostCommonStyle}>Most common</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {COMMON_SIGN_LANGS.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => toggleArrayItem('signLangs', lang.id)}
                style={tileStyle(form.signLangs.includes(lang.id))}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Regional dropdown */}
          <RegionSelect
            regions={REGIONAL_SIGN_LANGS}
            selected={form.signLangs}
            onSelect={(v) => toggleArrayItem('signLangs', v)}
          />

          {/* Other free text */}
          <div style={{ marginTop: '12px' }}>
            <input
              type="text"
              value={form.otherSignLang}
              onChange={(e) => update('otherSignLang', e.target.value)}
              placeholder="Other — type language name..."
              style={textInputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>

        {/* ── SPOKEN LANGUAGES ── */}
        <div>
          <div style={sectionTitleStyle}>Spoken Languages</div>
          <p style={subtitleStyle}>
            Select all spoken languages in which you have professional-level fluency.
          </p>
          <div style={mostCommonStyle}>Most common</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {COMMON_SPOKEN_LANGS.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => toggleArrayItem('spokenLangs', lang.id)}
                style={tileStyle(form.spokenLangs.includes(lang.id))}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <RegionSelect
            regions={REGIONAL_SPOKEN_LANGS}
            selected={form.spokenLangs}
            onSelect={(v) => toggleArrayItem('spokenLangs', v)}
          />

          <div style={{ marginTop: '12px' }}>
            <input
              type="text"
              value={form.otherSpokenLang}
              onChange={(e) => update('otherSpokenLang', e.target.value)}
              placeholder="Other — type language name..."
              style={textInputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>

        {/* ── SPECIALIZATIONS ── */}
        <div>
          <div style={sectionTitleStyle}>Specializations</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            {SPECIALIZATIONS.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => toggleArrayItem('specs', spec)}
                style={tileStyle(form.specs.includes(spec))}
              >
                {spec}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={form.otherSpec}
            onChange={(e) => update('otherSpec', e.target.value)}
            placeholder="Other specializations (comma-separated)"
            style={textInputStyle}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

      </div>

      <StepNav onBack={onBack} onNext={onNext} nextDisabled={!canContinue} currentStep={2} />
    </>
  );
}

/* ── Region select sub-component ── */

function RegionSelect({ regions, selected, onSelect }: {
  regions: Record<string, { id: string; label: string }[]>;
  selected: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <select
      value=""
      onChange={(e) => {
        if (e.target.value) onSelect(e.target.value);
      }}
      style={{
        width: '100%',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '11px 14px',
        color: 'var(--muted)',
        fontSize: '0.85rem',
        outline: 'none',
      }}
    >
      <option value="">More languages by region</option>
      {Object.entries(regions).map(([region, langs]) => (
        <optgroup key={region} label={region}>
          {langs.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {selected.includes(lang.id) ? `\u2713 ${lang.label}` : lang.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
