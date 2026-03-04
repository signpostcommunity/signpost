'use client';

import { useSignupForm } from './FormContext';
import { StepWrapper, FormField, TextInput, StepNav } from './FormFields';

interface Props { onNext: () => void; onBack: () => void }

export default function Step5Video({ onNext, onBack }: Props) {
  const { form, update } = useSignupForm();

  return (
    <>
      <StepWrapper title="Video & Bio" subtitle="Help clients get to know you.">
        <FormField label="Bio">
          <textarea
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            placeholder="Tell clients about your experience, specializations, and what makes you the right interpreter for the job."
            rows={5}
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px 14px',
              color: 'var(--text)',
              fontSize: '0.95rem',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'var(--font-dm)',
            }}
          />
        </FormField>
        <FormField label="Intro Video URL (optional)">
          <TextInput value={form.videoUrl} onChange={(v) => update('videoUrl', v)} placeholder="https://vimeo.com/..." />
        </FormField>
        <FormField label="Video Description (optional)">
          <TextInput value={form.videoDesc} onChange={(v) => update('videoDesc', v)} placeholder="A short description of your intro video" />
        </FormField>
      </StepWrapper>

      <StepNav onBack={onBack} onNext={onNext} currentStep={5} />
    </>
  );
}
