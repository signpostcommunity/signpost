'use client'

import { useState } from 'react'
import { useForm } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormNav, Chip,
} from './FormFields'
import {
  SIGN_LANGUAGES_TOP6, SIGN_LANGUAGES_BY_REGION,
  SPOKEN_LANGUAGES_TOP6, SPOKEN_LANGUAGES_BY_REGION,
} from '@/lib/data/languages'

const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '11px 14px',
  color: 'var(--text)',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
}

function LangPicker({
  label,
  top6,
  byRegion,
  selected,
  onToggle,
  onAddRegional,
  onRemoveRegional,
  regionalSelected,
}: {
  label: string
  top6: string[]
  byRegion: Record<string, string[]>
  selected: string[]
  onToggle: (lang: string) => void
  onAddRegional: (lang: string) => void
  onRemoveRegional: (lang: string) => void
  regionalSelected: string[]
}) {
  const [selectVal, setSelectVal] = useState('')

  function handleSelectChange(val: string) {
    if (!val) return
    if (!regionalSelected.includes(val)) {
      onAddRegional(val)
    }
    setSelectVal('')
  }

  return (
    <div>
      {/* Most common label */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: '0.68rem', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase' as const,
        color: 'var(--muted)', marginBottom: 10,
      }}>
        Most common
      </div>

      {/* Top 6 chips */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 6, marginBottom: 4,
      }}>
        {top6.map(lang => (
          <Chip
            key={lang}
            label={lang}
            selected={selected.includes(lang)}
            onToggle={() => onToggle(lang)}
          />
        ))}
      </div>

      {/* More languages by region */}
      <div style={{ marginTop: 12 }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '0.68rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase' as const,
          color: 'var(--muted)', marginBottom: 6,
        }}>
          More languages by region
        </div>
        <select
          value={selectVal}
          onChange={e => handleSelectChange(e.target.value)}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        >
          <option value="">Select a language…</option>
          {Object.entries(byRegion).sort().map(([region, langs]) => (
            <optgroup key={region} label={region}>
              {langs.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Selected regional tags */}
        {regionalSelected.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {regionalSelected.map(lang => (
              <span
                key={lang}
                style={{
                  padding: '0 10px 0 12px', height: 30, fontSize: '0.8rem',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  borderRadius: 20, border: '1px solid rgba(0,229,255,0.4)',
                  background: 'rgba(0,229,255,0.1)', color: 'var(--accent)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {lang}
                <button
                  onClick={() => onRemoveRegional(lang)}
                  aria-label={`Remove ${lang}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem', color: 'inherit', padding: 0 }}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Step2Languages({ onBack, onContinue }: {
  onBack: () => void
  onContinue: () => void
}) {
  const { formData, updateField, saveDraft } = useForm()
  const [signRegional, setSignRegional] = useState<string[]>([])
  const [spokenRegional, setSpokenRegional] = useState<string[]>([])

  function toggleLang(field: 'signLanguages' | 'spokenLanguages', lang: string) {
    const current = formData[field]
    updateField(field, current.includes(lang)
      ? current.filter(l => l !== lang)
      : [...current, lang]
    )
  }

  function addSignRegional(lang: string) {
    setSignRegional(prev => [...prev, lang])
    // Also add to the main signLanguages list (matches profile editor behavior)
    if (!formData.signLanguages.includes(lang)) {
      updateField('signLanguages', [...formData.signLanguages, lang])
    }
  }

  function removeSignRegional(lang: string) {
    setSignRegional(prev => prev.filter(l => l !== lang))
    updateField('signLanguages', formData.signLanguages.filter(l => l !== lang))
  }

  function addSpokenRegional(lang: string) {
    setSpokenRegional(prev => [...prev, lang])
    if (!formData.spokenLanguages.includes(lang)) {
      updateField('spokenLanguages', [...formData.spokenLanguages, lang])
    }
  }

  function removeSpokenRegional(lang: string) {
    setSpokenRegional(prev => prev.filter(l => l !== lang))
    updateField('spokenLanguages', formData.spokenLanguages.filter(l => l !== lang))
  }

  return (
    <StepWrapper>
      {/* Sign Languages */}
      <FormSection>
        <SectionTitle>Sign Languages</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Select all sign languages in which you have professional-level fluency.
        </p>
        <LangPicker
          label="Sign Languages"
          top6={SIGN_LANGUAGES_TOP6}
          byRegion={SIGN_LANGUAGES_BY_REGION}
          selected={formData.signLanguages}
          onToggle={lang => toggleLang('signLanguages', lang)}
          onAddRegional={addSignRegional}
          onRemoveRegional={removeSignRegional}
          regionalSelected={signRegional}
        />
      </FormSection>

      {/* Spoken Languages */}
      <FormSection>
        <SectionTitle>Spoken Languages</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Select all spoken languages in which you have professional-level fluency.
        </p>
        <LangPicker
          label="Spoken Languages"
          top6={SPOKEN_LANGUAGES_TOP6}
          byRegion={SPOKEN_LANGUAGES_BY_REGION}
          selected={formData.spokenLanguages}
          onToggle={lang => toggleLang('spokenLanguages', lang)}
          onAddRegional={addSpokenRegional}
          onRemoveRegional={removeSpokenRegional}
          regionalSelected={spokenRegional}
        />
      </FormSection>

      <FormNav step={2} totalSteps={6} onBack={onBack} onContinue={onContinue} onSaveDraft={saveDraft} />
    </StepWrapper>
  )
}
