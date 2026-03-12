'use client'

import { useState } from 'react'
import { useForm } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormNav,
} from './FormFields'
import { SPECIALIZATION_CATEGORIES, SPECIALIZED_SKILLS } from '@/lib/constants/specializations'

export default function Step5Skills({ onBack, onContinue }: {
  onBack: () => void
  onContinue: () => void
}) {
  const { formData, updateField, saveDraft } = useForm()

  // Default all categories collapsed except the first
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    const categories = Object.keys(SPECIALIZATION_CATEGORIES)
    categories.forEach((cat, idx) => {
      initial[cat] = idx !== 0
    })
    return initial
  })

  function toggleSpec(spec: string) {
    const current = formData.specializations
    updateField('specializations', current.includes(spec)
      ? current.filter(s => s !== spec)
      : [...current, spec]
    )
  }

  function toggleSkill(skill: string) {
    const current = formData.specializedSkills
    updateField('specializedSkills', current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill]
    )
  }

  function toggleCategory(category: string) {
    setCollapsed(prev => ({ ...prev, [category]: !prev[category] }))
  }

  return (
    <StepWrapper>
      {/* Settings & Specializations */}
      <FormSection>
        <SectionTitle>Settings &amp; Specializations</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12, lineHeight: 1.6 }}>
          Select the settings and specialization areas where you work. These help clients find you.
        </p>

        <div style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 16 }}>
          {formData.specializations.length} specialization{formData.specializations.length !== 1 ? 's' : ''} selected
        </div>

        {/* Selected tags */}
        {formData.specializations.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
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
            const isCollapsed = collapsed[category]
            const selectedCount = subs.filter(s => formData.specializations.includes(s)).length
            return (
              <div key={category} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', overflow: 'hidden',
              }}>
                <button
                  onClick={() => toggleCategory(category)}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontFamily: "'Syne', sans-serif", fontSize: '0.72rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: selectedCount > 0 ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  <span>{category}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selectedCount > 0 && (
                      <span style={{
                        background: 'rgba(0,229,255,0.15)', color: 'var(--accent)',
                        borderRadius: 100, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{selectedCount}</span>
                    )}
                    <span style={{ fontSize: '0.7rem', transition: 'transform 0.15s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
                  </span>
                </button>
                {!isCollapsed && (
                  <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {subs.map(sub => (
                      <div key={sub}>
                        <label style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                          background: formData.specializations.includes(sub) ? 'rgba(0,229,255,0.06)' : 'transparent',
                          transition: 'background 0.15s',
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
                        {sub === 'Other (describe in notes)' && formData.specializations.includes(sub) && (
                          <textarea
                            placeholder="Describe your specialization"
                            value={formData.otherSpecializations}
                            onChange={e => updateField('otherSpecializations', e.target.value)}
                            style={{
                              width: '100%', marginTop: 6, marginLeft: 12, boxSizing: 'border-box',
                              background: 'var(--surface2)', border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                              color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
                              fontSize: '0.85rem', outline: 'none', resize: 'vertical', minHeight: 60,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </FormSection>

      {/* Specialized Skills */}
      <FormSection>
        <SectionTitle>Specialized Skills</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16, marginTop: -12, lineHeight: 1.6 }}>
          Select any highly specialized skills you hold. These are highlighted separately on your profile.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SPECIALIZED_SKILLS.map(skill => (
            <label key={skill} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: formData.specializedSkills.includes(skill) ? 'rgba(123,97,255,0.08)' : 'var(--surface2)',
              border: formData.specializedSkills.includes(skill) ? '1px solid rgba(123,97,255,0.3)' : '1px solid var(--border)',
              transition: 'all 0.15s',
              fontSize: '0.85rem', color: formData.specializedSkills.includes(skill) ? 'var(--text)' : 'var(--muted)',
            }}>
              <input
                type="checkbox"
                checked={formData.specializedSkills.includes(skill)}
                onChange={() => toggleSkill(skill)}
                style={{ accentColor: '#7b61ff', width: 'auto', flexShrink: 0 }}
              />
              {skill}
            </label>
          ))}
        </div>
      </FormSection>

      <FormNav step={5} totalSteps={6} onBack={onBack} onContinue={onContinue} onSaveDraft={saveDraft} />
    </StepWrapper>
  )
}
