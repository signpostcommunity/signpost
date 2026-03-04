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
  'Africa & Middle East': [
    { id: 'ArSL', label: 'Arabic Sign Language (ArSL)' },
    { id: 'EthSL', label: 'Ethiopian Sign Language' },
    { id: 'GhSL', label: 'Ghana Sign Language' },
    { id: 'KeSL', label: 'Kenyan Sign Language' },
    { id: 'NigSL', label: 'Nigerian Sign Language' },
    { id: 'SauSL', label: 'Saudi Arabian Sign Language' },
    { id: 'SASL', label: 'South African Sign Language (SASL)' },
    { id: 'TzSL', label: 'Tanzanian Sign Language' },
    { id: 'UgSL', label: 'Ugandan Sign Language' },
    { id: 'ZimSL', label: 'Zimbabwean Sign Language' },
  ],
  'Americas': [
    { id: 'LSA', label: 'Argentinian Sign Language (LSA)' },
    { id: 'LIBRAS', label: 'Brazilian Sign Language (LIBRAS)' },
    { id: 'LSCh', label: 'Chilean Sign Language (LSCh)' },
    { id: 'LSC', label: 'Colombian Sign Language (LSC)' },
    { id: 'LSCu', label: 'Cuban Sign Language (LSCu)' },
    { id: 'LSQ', label: 'French Québec Sign Language (LSQ)' },
    { id: 'HaiSL', label: 'Haitian Sign Language' },
    { id: 'LSM', label: 'Mexican Sign Language (LSM)' },
  ],
  'Asia & Pacific': [
    { id: 'Auslan', label: 'Australian Sign Language (Auslan)' },
    { id: 'CSL', label: 'Chinese Sign Language (CSL)' },
    { id: 'FSL', label: 'Filipino Sign Language (FSL)' },
    { id: 'HkSL', label: 'Hong Kong Sign Language' },
    { id: 'IndSL', label: 'Indian Sign Language (ISL)' },
    { id: 'IndoSL', label: 'Indonesian Sign Language (Bisindo)' },
    { id: 'JSL', label: 'Japanese Sign Language (JSL)' },
    { id: 'KSL', label: 'Korean Sign Language (KSL)' },
    { id: 'MySL', label: 'Malaysian Sign Language (BIM)' },
    { id: 'NZSL', label: 'New Zealand Sign Language (NZSL)' },
    { id: 'ThSL', label: 'Thai Sign Language' },
    { id: 'VnSL', label: 'Vietnamese Sign Language' },
  ],
  'Europe': [
    { id: 'OGS', label: 'Austrian Sign Language (ÖGS)' },
    { id: 'VGT', label: 'Belgian Sign Language — Flemish (VGT)' },
    { id: 'LSFB', label: 'Belgian Sign Language — French (LSFB)' },
    { id: 'CSE', label: 'Czech Sign Language (ČZJ)' },
    { id: 'DSL', label: 'Danish Sign Language (DSL)' },
    { id: 'NGT', label: 'Dutch Sign Language (NGT)' },
    { id: 'ESL', label: 'Estonian Sign Language' },
    { id: 'FinSL', label: 'Finnish Sign Language' },
    { id: 'DGS', label: 'German Sign Language (DGS)' },
    { id: 'GSL', label: 'Greek Sign Language' },
    { id: 'ISL', label: 'Irish Sign Language (ISL)' },
    { id: 'LIS', label: 'Italian Sign Language (LIS)' },
    { id: 'NTS', label: 'Norwegian Sign Language (NTS)' },
    { id: 'PJM', label: 'Polish Sign Language (PJM)' },
    { id: 'LGP', label: 'Portuguese Sign Language (LGP)' },
    { id: 'RSL', label: 'Russian Sign Language (RSL)' },
    { id: 'LSE', label: 'Spanish Sign Language (LSE)' },
    { id: 'SSL', label: 'Swedish Sign Language (SSL)' },
    { id: 'DSGS', label: 'Swiss-German Sign Language (DSGS)' },
    { id: 'TID', label: 'Turkish Sign Language (TİD)' },
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
  'Africa & Middle East': [
    { id: 'Amharic', label: 'Amharic (አማርኛ)' },
    { id: 'Hausa', label: 'Hausa' },
    { id: 'Hebrew', label: 'Hebrew (עברית)' },
    { id: 'Igbo', label: 'Igbo' },
    { id: 'Somali', label: 'Somali (Soomaali)' },
    { id: 'Swahili', label: 'Swahili (Kiswahili)' },
    { id: 'Twi', label: 'Twi' },
    { id: 'Yoruba', label: 'Yoruba (Èdè Yorùbá)' },
    { id: 'Zulu', label: 'Zulu (isiZulu)' },
  ],
  'Americas': [
    { id: 'Haitian Creole', label: 'Haitian Creole (Kreyòl Ayisyen)' },
    { id: 'Guarani', label: 'Guarani' },
    { id: 'Quechua', label: 'Quechua' },
  ],
  'Asia & Pacific': [
    { id: 'Bengali', label: 'Bengali (বাংলা)' },
    { id: 'Cantonese', label: 'Cantonese (廣東話)' },
    { id: 'Hindi', label: 'Hindi (हिन्दी)' },
    { id: 'Indonesian', label: 'Indonesian (Bahasa Indonesia)' },
    { id: 'Japanese', label: 'Japanese (日本語)' },
    { id: 'Korean', label: 'Korean (한국어)' },
    { id: 'Malay', label: 'Malay (Bahasa Melayu)' },
    { id: 'Tagalog', label: 'Tagalog' },
    { id: 'Tamil', label: 'Tamil (தமிழ்)' },
    { id: 'Thai', label: 'Thai (ภาษาไทย)' },
    { id: 'Urdu', label: 'Urdu (اردو)' },
    { id: 'Vietnamese', label: 'Vietnamese (Tiếng Việt)' },
  ],
  'Europe': [
    { id: 'Czech', label: 'Czech (Čeština)' },
    { id: 'Danish', label: 'Danish (Dansk)' },
    { id: 'Dutch', label: 'Dutch (Nederlands)' },
    { id: 'Finnish', label: 'Finnish (Suomi)' },
    { id: 'German', label: 'German (Deutsch)' },
    { id: 'Greek', label: 'Greek (Ελληνικά)' },
    { id: 'Hungarian', label: 'Hungarian (Magyar)' },
    { id: 'Italian', label: 'Italian (Italiano)' },
    { id: 'Norwegian', label: 'Norwegian (Norsk)' },
    { id: 'Polish', label: 'Polish (Polski)' },
    { id: 'Romanian', label: 'Romanian (Română)' },
    { id: 'Russian', label: 'Russian (Русский)' },
    { id: 'Swedish', label: 'Swedish (Svenska)' },
    { id: 'Turkish', label: 'Turkish (Türkçe)' },
    { id: 'Ukrainian', label: 'Ukrainian (Українська)' },
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
    <div>
      <div style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '8px' }}>
        More languages by region
      </div>
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
          color: 'var(--text)',
          fontSize: '0.85rem',
          outline: 'none',
        }}
      >
        <option value="" style={{ color: 'var(--text)' }}>Select a language…</option>
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
    </div>
  );
}
