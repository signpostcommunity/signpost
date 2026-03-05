'use client'

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

export default function Step3Credentials({ onBack, onContinue }: {
  onBack: () => void
  onContinue: () => void
}) {
  const { formData, updateField } = useForm()

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
            <div
              key={cert.id}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: 10,
                width: '100%', boxSizing: 'border-box',
              }}
            >
              {/* Row 1: name + issuing body */}
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

              {/* Row 2: verification link + remove */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                <FormField>
                  <FieldLabel>Verification link or upload</FieldLabel>
                  <UrlInput
                    placeholder="https://rid.org/verify/… or upload doc"
                    value={cert.verificationLink}
                    onChange={e => updateCert(cert.id, 'verificationLink', e.target.value)}
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
            <div
              key={edu.id}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: 10,
                width: '100%', boxSizing: 'border-box',
              }}
            >
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

      <FormNav step={3} totalSteps={6} onBack={onBack} onContinue={onContinue} />
    </StepWrapper>
  )
}
