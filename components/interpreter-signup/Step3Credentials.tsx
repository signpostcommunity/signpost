'use client'

import { useState } from 'react'
import { useForm, Certification, Education } from './FormContext'
import {
  StepWrapper, FormSection, SectionTitle, FormRow, FormField, FieldLabel,
  TextInput, UrlInput, AddButton, RemoveButton, FormNav,
} from './FormFields'

function newCert(): Certification {
  return { id: `cert-${Date.now()}`, name: '', issuingBody: '', verificationLink: '' }
}

function newEdu(): Education {
  return { id: `edu-${Date.now()}`, degree: '', institution: '' }
}

const BUSINESS_DOC_TYPES = [
  { id: 'liability', label: 'Liability Insurance', hint: 'Professional liability / errors & omissions insurance' },
  { id: 'immunization', label: 'Immunization Records', hint: 'Up-to-date vaccination documentation' },
  { id: 'tb', label: 'TB Test', hint: 'Tuberculosis test results, required for many medical settings' },
  { id: 'background', label: 'Background Check', hint: 'Criminal background check from an accredited provider' },
  { id: 'nda', label: 'NDA / Confidentiality Agreement', hint: 'Signed non-disclosure or confidentiality agreement on file' },
  { id: 'other', label: 'Other', hint: "Any other professional document you'd like to have on file" },
]

type BusinessDoc = {
  enabled: boolean
  linkOrFile: string
  expiry: string
  reminder: boolean
  otherLabel: string
}

type BusinessDocs = Record<string, BusinessDoc>

function defaultDocs(): BusinessDocs {
  const docs: BusinessDocs = {}
  BUSINESS_DOC_TYPES.forEach(t => {
    docs[t.id] = { enabled: false, linkOrFile: '', expiry: '', reminder: false, otherLabel: '' }
  })
  return docs
}

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

function BusinessDocRow({ id, label, hint, doc, onChange }: {
  id: string
  label: string
  hint: string
  doc: BusinessDoc
  onChange: (updates: Partial<BusinessDoc>) => void
}) {
  return (
    <div style={{
      background: 'var(--surface2)',
      border: `1px solid ${doc.enabled ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)', overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      {/* Checkbox row */}
      <label style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 18px', cursor: 'pointer',
        background: doc.enabled ? 'rgba(0,229,255,0.04)' : 'transparent',
      }}>
        <input
          type="checkbox"
          checked={doc.enabled}
          onChange={e => onChange({ enabled: e.target.checked })}
          style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0, width: 'auto' }}
        />
        <div>
          <div style={{ color: 'var(--text)', fontSize: '0.88rem', fontWeight: 500, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            {label}
            {doc.enabled && doc.linkOrFile && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, fontFamily: "'Syne', sans-serif",
                letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
                color: 'var(--accent)', borderRadius: 100, padding: '2px 8px',
              }}>
                ✓ Verified
              </span>
            )}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{hint}</div>
        </div>
      </label>

      {/* Expanded fields */}
      {doc.enabled && (
        <div style={{ padding: '14px 18px 16px', borderTop: '1px solid var(--border)' }}>
          {id === 'other' && (
            <FormField style={{ marginBottom: 12 }}>
              <FieldLabel>Document name</FieldLabel>
              <TextInput
                placeholder="e.g. Drug Test, CPR Certification…"
                value={doc.otherLabel}
                onChange={e => onChange({ otherLabel: e.target.value })}
              />
            </FormField>
          )}

          <FormField style={{ marginBottom: 12 }}>
            <FieldLabel>Verification link or upload</FieldLabel>
            <input
              type="url"
              placeholder="https://… or paste a link to your documentation"
              value={doc.linkOrFile}
              onChange={e => onChange({ linkOrFile: e.target.value })}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'end' }}>
            <FormField>
              <FieldLabel>
                Expiry date <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
              </FieldLabel>
              <input
                type="date"
                value={doc.expiry}
                onChange={e => onChange({ expiry: e.target.value })}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              />
            </FormField>

            {doc.expiry && (
              <FormField>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', fontSize: '0.85rem', color: 'var(--muted)', paddingBottom: 2,
                }}>
                  <input
                    type="checkbox"
                    checked={doc.reminder}
                    onChange={e => onChange({ reminder: e.target.checked })}
                    style={{ accentColor: 'var(--accent)', width: 'auto', flexShrink: 0 }}
                  />
                  Send me a reminder before this expires
                </label>
              </FormField>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Step3Credentials({ onBack, onContinue }: {
  onBack: () => void
  onContinue: () => void
}) {
  const { formData, updateField } = useForm()
  const [businessDocs, setBusinessDocs] = useState<BusinessDocs>(defaultDocs)

  function updateDoc(id: string, updates: Partial<BusinessDoc>) {
    setBusinessDocs(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }))
  }

  function updateCert(id: string, field: keyof Certification, value: string) {
    updateField('certifications', formData.certifications.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  function removeCert(id: string) {
    if (formData.certifications.length === 1) return
    updateField('certifications', formData.certifications.filter(c => c.id !== id))
  }

  function updateEdu(id: string, field: keyof Education, value: string) {
    updateField('education', formData.education.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ))
  }

  function removeEdu(id: string) {
    if (formData.education.length === 1) return
    updateField('education', formData.education.filter(e => e.id !== id))
  }

  return (
    <StepWrapper>
      {/* Certifications & Credentials */}
      <FormSection>
        <SectionTitle>Certifications &amp; Credentials</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          List your certifications and qualifications. To earn a{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>✓ Verified</span>{' '}
          badge on your profile, upload a document or paste a link to your certifying body for each credential.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {formData.certifications.map(cert => (
            <div key={cert.id} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: 10,
              width: '100%', boxSizing: 'border-box',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField>
                  <FieldLabel>Certification Name</FieldLabel>
                  <TextInput
                    placeholder="e.g. RID NIC Advanced"
                    value={cert.name}
                    onChange={e => updateCert(cert.id, 'name', e.target.value)}
                  />
                </FormField>
                <FormField>
                  <FieldLabel>Issuing Body &amp; Year</FieldLabel>
                  <TextInput
                    placeholder="e.g. RID, USA · 2018"
                    value={cert.issuingBody}
                    onChange={e => updateCert(cert.id, 'issuingBody', e.target.value)}
                  />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                <FormField>
                  <FieldLabel>Verification link or upload</FieldLabel>
                  <input
                    type="url"
                    placeholder="https://rid.org/verify/… or upload doc"
                    value={cert.verificationLink}
                    onChange={e => updateCert(cert.id, 'verificationLink', e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                  />
                </FormField>
                <RemoveButton onClick={() => removeCert(cert.id)} />
              </div>
            </div>
          ))}
        </div>
        <AddButton onClick={() => updateField('certifications', [...formData.certifications, newCert()])}>
          + Add Another Credential
        </AddButton>
      </FormSection>

      {/* Education */}
      <FormSection>
        <SectionTitle>Education</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {formData.education.map(edu => (
            <div key={edu.id} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: 10,
              width: '100%', boxSizing: 'border-box',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField>
                  <FieldLabel>Degree / Qualification</FieldLabel>
                  <TextInput
                    placeholder="MA Interpreter Studies"
                    value={edu.degree}
                    onChange={e => updateEdu(edu.id, 'degree', e.target.value)}
                  />
                </FormField>
                <FormField>
                  <FieldLabel>Institution &amp; Year</FieldLabel>
                  <TextInput
                    placeholder="Universidad de Salamanca · 2013"
                    value={edu.institution}
                    onChange={e => updateEdu(edu.id, 'institution', e.target.value)}
                  />
                </FormField>
              </div>
              {formData.education.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <RemoveButton onClick={() => removeEdu(edu.id)} />
                </div>
              )}
            </div>
          ))}
        </div>
        <AddButton onClick={() => updateField('education', [...formData.education, newEdu()])}>
          + Add More Education
        </AddButton>
      </FormSection>

      {/* Business Documents */}
      <FormSection>
        <SectionTitle>Business Documents</SectionTitle>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 16 }}>
          Check the documents you have on file. These are never shown publicly — you control who receives them.
          Documents with a verification link will display a{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>✓ Verified</span>{' '}
          badge visible only to requesters you choose to share them with.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BUSINESS_DOC_TYPES.map(doc => (
            <BusinessDocRow
              key={doc.id}
              id={doc.id}
              label={doc.label}
              hint={doc.hint}
              doc={businessDocs[doc.id]}
              onChange={updates => updateDoc(doc.id, updates)}
            />
          ))}
        </div>
      </FormSection>

      <FormNav step={3} totalSteps={6} onBack={onBack} onContinue={onContinue} />
    </StepWrapper>
  )
}
