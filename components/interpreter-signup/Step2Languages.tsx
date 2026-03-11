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
import { SPECIALIZATION_CATEGORIES, SPECIALIZED_SKILLS } from '@/lib/constants/specializations'

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
  otherValue,
  onOtherChange,
}: {
  label: string
  top6: string[]
  byRegion: Record<string, string[]>
  selected: string[]
  onToggle: (lang: string) => void
  onAddRegional: (lang: string) => void
  onRemoveRegional: (lang: string) => void
  regionalSelected: string[]
  otherValue: string
  onOtherChange: (v: string) => void
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

      {/* Other input */}
      <div style={{ marginTop: 8 }}>
        <input
          type="text"
          placeholder="Other — type language name…"
          value={otherValue}
          onChange={e => onOtherChange(e.target.value)}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
      </div>
    </div>
  )
}

export default function Step2Languages({ onBack, onContinue }: {
  onBack: () => void
  onContinue: () => void
}) {
  const { formData, updateField } = useForm()
  const [signRegional, setSignRegional] = useState<string[]>([])
  const [spokenRegional, setSpokenRegional] = useState<string[]>([])
  const [signOther, setSignOther] = useState('')
  const [spokenOther, setSpokenOther] = useState('')

  function toggleLang(field: 'signLanguages' | 'spokenLanguages', lang: string) {
    const current = formData[field]
    updateField(field, current.includes(lang)
      ? current.filter(l => l !== lang)
      : [...current, lang]
    )
  }

  function toggleSpec(spec: string) {
    const current = formData.specializations
    updateField('specializations', current.includes(spec)
      ? current.filter(s => s !== spec)
      : [...current, spec]
    )
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
          onAddRegional={lang => setSignRegional(prev => [...prev, lang])}
          onRemoveRegional={lang => setSignRegional(prev => prev.filter(l => l !== lang))}
          regionalSelected={signRegional}
          otherValue={signOther}
          onOtherChange={setSignOther}
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
          onAddRegional={lang => setSpokenRegional(prev => [...prev, lang])}
          onRemoveRegional={lang => setSpokenRegional(prev => prev.filter(l => l !== lang))}
          regionalSelected={spokenRegional}
          otherValue={spokenOther}
          onOtherChange={setSpokenOther}
        />
      </FormSection>

      {/* Specializations — category/sub-category */}
      <FormSection>
        <SectionTitle>Settings & Specializations</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>
          Select the settings and specialization areas where you work.
        </p>
        <div style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>
          {formData.specializations.length} selected
        </div>

        {/* Selected tags */}
        {formData.specializations.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
            {formData.specializations.map(spec => (
              <span key={spec} style={{
                padding: '4px 12px', fontSize: '0.78rem',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                borderRadius: 20, border: '1px solid rgba(0,229,255,0.4)',
                background: 'rgba(0,229,255,0.1)', color: 'var(--accent)',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {spec}
                <button onClick={() => toggleSpec(spec)} aria-label={`Remove ${spec}`} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem', color: 'inherit', padding: 0 }}><span aria-hidden="true">✕</span></button>
              </span>
            ))}
          </div>
        )}

        {/* Category groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(SPECIALIZATION_CATEGORIES).map(([category, subs]) => {
            const selectedCount = subs.filter(s => formData.specializations.includes(s)).length
            return (
              <div key={category} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 16px',
                  fontFamily: "'Syne', sans-serif", fontSize: '0.72rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  color: selectedCount > 0 ? 'var(--accent)' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span>{category}</span>
                  {selectedCount > 0 && (
                    <span style={{
                      background: 'rgba(0,229,255,0.15)', color: 'var(--accent)',
                      borderRadius: 100, padding: '1px 7px', fontSize: '0.7rem',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>{selectedCount}</span>
                  )}
                </div>
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {subs.map(sub => (
                    <label key={sub} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                      background: formData.specializations.includes(sub) ? 'rgba(0,229,255,0.06)' : 'transparent',
                      fontSize: '0.85rem', color: formData.specializations.includes(sub) ? 'var(--text)' : 'var(--muted)',
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(sub)}
                        onChange={() => toggleSpec(sub)}
                        style={{ accentColor: 'var(--accent)', width: 'auto', flexShrink: 0 }}
                      />
                      {sub}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </FormSection>

      {/* Specialized Skills */}
      <FormSection>
        <SectionTitle>Specialized Skills</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>
          Select any highly specialized skills you hold. These are highlighted separately on your profile.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SPECIALIZED_SKILLS.map(skill => (
            <label key={skill} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: formData.otherSpecializations.split(',').map(s => s.trim()).includes(skill) ? 'rgba(123,97,255,0.08)' : 'var(--surface2)',
              border: formData.otherSpecializations.split(',').map(s => s.trim()).includes(skill) ? '1px solid rgba(123,97,255,0.3)' : '1px solid var(--border)',
              fontSize: '0.85rem', color: 'var(--muted)',
            }}>
              <input
                type="checkbox"
                checked={formData.otherSpecializations.split(',').map(s => s.trim()).includes(skill)}
                onChange={() => {
                  const current = formData.otherSpecializations.split(',').map(s => s.trim()).filter(Boolean)
                  const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill]
                  updateField('otherSpecializations', next.join(', '))
                }}
                style={{ accentColor: '#7b61ff', width: 'auto', flexShrink: 0 }}
              />
              {skill}
            </label>
          ))}
        </div>
      </FormSection>

      <FormNav step={2} totalSteps={6} onBack={onBack} onContinue={onContinue} />
    </StepWrapper>
  )
}
