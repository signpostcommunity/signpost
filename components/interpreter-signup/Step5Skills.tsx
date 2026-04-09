'use client'

import { useState } from 'react'
import { useForm } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormNav, InfoNote,
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

  const [aspCollapsed, setAspCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    Object.keys(SPECIALIZATION_CATEGORIES).forEach((cat) => { initial[cat] = true })
    return initial
  })
  function toggleAspirational(spec: string) {
    if (formData.specializations.includes(spec)) return
    const current = formData.aspirationalSpecializations
    updateField('aspirationalSpecializations', current.includes(spec)
      ? current.filter(s => s !== spec)
      : [...current, spec]
    )
  }
  function toggleAspCategory(category: string) {
    setAspCollapsed(prev => ({ ...prev, [category]: !prev[category] }))
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
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12, marginTop: -12, lineHeight: 1.6 }}>
          Select the settings and specialization areas where you work. These help clients find you.
        </p>
        <InfoNote>
          Selecting specializations helps Deaf community members and requesters find you in directory searches. Profiles without specializations won&apos;t appear in filtered results.
        </InfoNote>

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
                    fontSize: '12px', fontWeight: 500,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: selectedCount > 0 ? '#00e5ff' : '#96a0b8',
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

      {/* Working Towards (aspirational) */}
      <FormSection>
        <div style={{
          fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: '#00e5ff', marginBottom: 8,
        }}>
          Working Towards
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 8, lineHeight: 1.6 }}>
          Select areas you&apos;re actively developing skills in. These show on your profile as aspirational, not current expertise.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginBottom: 12, lineHeight: 1.6, opacity: 0.85 }}>
          Items already in your active specializations won&apos;t appear here.
        </p>
        <div style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>
          {formData.aspirationalSpecializations.length} working towards selected
        </div>
        {formData.aspirationalSpecializations.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
            {formData.aspirationalSpecializations.map(spec => (
              <span key={spec} style={{
                padding: '4px 12px', fontSize: '0.78rem',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                borderRadius: 20, border: '1px dashed rgba(0,229,255,0.4)',
                background: 'rgba(0,229,255,0.06)', color: 'var(--accent)',
                opacity: 0.85, fontFamily: "'DM Sans', sans-serif",
              }}>
                {spec}
                <button onClick={() => toggleAspirational(spec)} aria-label={`Remove ${spec}`} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.85rem', color: 'inherit', padding: 0 }}><span aria-hidden="true">✕</span></button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {Object.entries(SPECIALIZATION_CATEGORIES).map(([category, subs]) => {
            const isCollapsed = aspCollapsed[category]
            const selectedCount = subs.filter(s => formData.aspirationalSpecializations.includes(s)).length
            return (
              <div key={category} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', overflow: 'hidden',
              }}>
                <button
                  type="button"
                  onClick={() => toggleAspCategory(category)}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '12px', fontWeight: 500,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: selectedCount > 0 ? '#00e5ff' : '#96a0b8',
                  }}
                >
                  <span>{category}</span>
                  <span style={{ fontSize: '0.7rem', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
                </button>
                {!isCollapsed && (
                  <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {subs.map(sub => {
                      const disabled = formData.specializations.includes(sub)
                      const checked = formData.aspirationalSpecializations.includes(sub)
                      return (
                        <label key={sub} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', borderRadius: 8,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          background: checked ? 'rgba(0,229,255,0.06)' : 'transparent',
                          opacity: disabled ? 0.4 : 1,
                          fontSize: '0.85rem', color: checked ? 'var(--text)' : 'var(--muted)',
                        }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleAspirational(sub)}
                            style={{ accentColor: 'var(--accent)', width: 'auto', flexShrink: 0 }}
                          />
                          {sub}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.78rem', lineHeight: 1.6, opacity: 0.85 }}>
          These will be visible on your public profile so Deaf community members and requesters can see your growth areas.
        </p>
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
                style={{ accentColor: '#a78bfa', width: 'auto', flexShrink: 0 }}
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
