'use client'

import { useState } from 'react'
import { useForm } from './FormContext'
import { StepWrapper, FormSection, SectionTitle, FormNav } from './FormFields'
import { MENTORSHIP_CATEGORIES, type MentorshipCategory } from '@/lib/mentorship-categories'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#c8cdd8',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '11px 14px',
  color: 'var(--text)',
  fontSize: '0.9rem',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box' as const,
}

function handleFocus(e: React.FocusEvent<HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--accent)'
  e.target.style.boxShadow = '0 0 0 3px rgba(0,229,255,0.07)'
}
function handleBlur(e: React.FocusEvent<HTMLTextAreaElement>) {
  e.target.style.borderColor = 'var(--border)'
  e.target.style.boxShadow = 'none'
}

function CommunityToggle({ label, helper, checked, onChange }: {
  label: string; helper?: string; checked: boolean; onChange: () => void
}) {
  return (
    <button type="button" onClick={onChange} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
      padding: '10px 0', marginBottom: 8, background: 'none', border: 'none',
      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
    }}>
      <div style={{
        width: 40, height: 20, borderRadius: 100, flexShrink: 0,
        background: checked ? 'var(--accent)' : 'var(--surface2)',
        border: checked ? 'none' : '1px solid var(--border)',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: checked ? '#000' : 'var(--muted)',
          position: 'absolute', top: 2,
          left: checked ? 22 : 2, transition: 'left 0.2s',
        }} />
      </div>
      <div>
        <span style={{
          fontSize: '0.9rem',
          color: checked ? 'var(--accent)' : 'var(--muted)',
          fontWeight: checked ? 600 : 400,
          display: 'block',
        }}>{label}</span>
        {helper && <span style={{ fontSize: '0.78rem', color: 'var(--muted)', opacity: 0.7, lineHeight: 1.4 }}>{helper}</span>}
      </div>
    </button>
  )
}

function MentorshipAccordion({ category, selectedCount, selectedIds, onToggle, showBorder }: {
  category: MentorshipCategory
  selectedCount: number
  selectedIds: string[]
  onToggle: (itemId: string) => void
  showBorder: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: showBorder ? '1px solid var(--border)' : 'none' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 14px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            stroke="#96a0b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
          >
            <path d="M3 1l4 4-4 4" />
          </svg>
          <span style={{
            fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: '#96a0b8',
          }}>
            {category.label}
          </span>
        </div>
        {selectedCount > 0 && (
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)',
            background: 'rgba(0,229,255,0.1)', borderRadius: 100,
            padding: '1px 8px',
          }}>
            {selectedCount} selected
          </span>
        )}
      </button>
      <div style={{
        maxHeight: open ? `${category.items.length * 56 + 8}px` : '0px',
        overflow: 'hidden', transition: 'max-height 0.2s ease',
      }}>
        <div style={{ padding: '0 14px 8px' }}>
          {category.items.map(item => {
            const checked = selectedIds.includes(item.id)
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onToggle(item.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  width: '100%', padding: '8px 0',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", textAlign: 'left',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  border: checked ? 'none' : '2px solid var(--border)',
                  background: checked ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {checked && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#f0f2f8', lineHeight: 1.4 }}>
                    {item.label}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: '12px', color: '#96a0b8', lineHeight: 1.4, marginTop: 2 }}>
                      {item.description}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Step6Mentorship({ onBack, onContinue }: {
  onBack: () => void
  onContinue: () => void
}) {
  const { formData, updateField, saveDraft } = useForm()

  function toggleOffering(itemId: string) {
    const current = formData.mentorshipTypesOffering
    updateField('mentorshipTypesOffering',
      current.includes(itemId) ? current.filter(v => v !== itemId) : [...current, itemId]
    )
  }

  function toggleSeeking(itemId: string) {
    const current = formData.mentorshipTypesSeeking
    updateField('mentorshipTypesSeeking',
      current.includes(itemId) ? current.filter(v => v !== itemId) : [...current, itemId]
    )
  }

  return (
    <StepWrapper>
      <FormSection>
        <SectionTitle>Mentorship</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 24, marginTop: -12, lineHeight: 1.6 }}>
          Connect with other interpreters for professional growth. This step is optional -- you can skip it and come back later from your profile editor.
        </p>

        {/* Offering toggle */}
        <CommunityToggle
          label="I'm offering mentorship"
          helper="Let other interpreters know you're available to mentor"
          checked={formData.mentorshipOffering}
          onChange={() => updateField('mentorshipOffering', !formData.mentorshipOffering)}
        />

        {formData.mentorshipOffering && (
          <div style={{ marginLeft: 16, paddingLeft: 16, borderLeft: '2px solid var(--border)', marginBottom: 24 }}>
            <label style={labelStyle}>What areas are you offering mentorship in?</label>
            <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {MENTORSHIP_CATEGORIES.map((cat, catIdx) => {
                const selectedCount = cat.items.filter(item => formData.mentorshipTypesOffering.includes(item.id)).length
                return (
                  <MentorshipAccordion
                    key={cat.id}
                    category={cat}
                    selectedCount={selectedCount}
                    selectedIds={formData.mentorshipTypesOffering}
                    onToggle={toggleOffering}
                    showBorder={catIdx < MENTORSHIP_CATEGORIES.length - 1}
                  />
                )
              })}
            </div>

            {/* Compensation */}
            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <label style={labelStyle}>Compensation</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {([
                  { value: 'pro_bono', label: 'Pro bono' },
                  { value: 'paid', label: 'Paid mentorship' },
                  { value: 'either', label: 'Either -- open to discussing' },
                ] as const).map(opt => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => updateField('mentorshipPaid', formData.mentorshipPaid === opt.value ? '' : opt.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${formData.mentorshipPaid === opt.value ? 'rgba(0,229,255,0.4)' : 'var(--border)'}`,
                      background: formData.mentorshipPaid === opt.value ? 'rgba(0,229,255,0.08)' : 'var(--surface2)',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.85rem', color: formData.mentorshipPaid === opt.value ? 'var(--text)' : 'var(--muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: formData.mentorshipPaid === opt.value ? '5px solid var(--accent)' : '2px solid var(--border)',
                      background: formData.mentorshipPaid === opt.value ? '#000' : 'transparent',
                      flexShrink: 0,
                    }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio: offering */}
            <div>
              <label style={labelStyle}>What do you bring as a mentor? (optional)</label>
              <textarea
                value={formData.mentorshipBioOffering}
                onChange={e => updateField('mentorshipBioOffering', e.target.value)}
                placeholder="Your experience, approach, what you enjoy helping with..."
                rows={3}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              />
            </div>
          </div>
        )}

        {/* Seeking toggle */}
        <CommunityToggle
          label="I'm seeking mentorship"
          helper="Find experienced interpreters who can help you grow"
          checked={formData.mentorshipSeeking}
          onChange={() => updateField('mentorshipSeeking', !formData.mentorshipSeeking)}
        />

        {formData.mentorshipSeeking && (
          <div style={{ marginLeft: 16, paddingLeft: 16, borderLeft: '2px solid var(--border)', marginBottom: 24 }}>
            <label style={labelStyle}>What areas are you looking for mentorship in?</label>
            <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {MENTORSHIP_CATEGORIES.map((cat, catIdx) => {
                const selectedCount = cat.items.filter(item => formData.mentorshipTypesSeeking.includes(item.id)).length
                return (
                  <MentorshipAccordion
                    key={cat.id}
                    category={cat}
                    selectedCount={selectedCount}
                    selectedIds={formData.mentorshipTypesSeeking}
                    onToggle={toggleSeeking}
                    showBorder={catIdx < MENTORSHIP_CATEGORIES.length - 1}
                  />
                )
              })}
            </div>

            {/* Bio: seeking */}
            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>What are you looking for? (optional)</label>
              <textarea
                value={formData.mentorshipBioSeeking}
                onChange={e => updateField('mentorshipBioSeeking', e.target.value)}
                placeholder="Specific skills, guidance areas, what kind of support would help you grow..."
                rows={3}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              />
            </div>
          </div>
        )}
      </FormSection>

      <FormNav
        step={6}
        totalSteps={7}
        onBack={onBack}
        onContinue={onContinue}
        onSaveDraft={saveDraft}
      />
    </StepWrapper>
  )
}
