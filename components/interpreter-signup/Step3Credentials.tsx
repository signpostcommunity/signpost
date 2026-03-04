'use client';

import { ALL_CERTS } from '@/lib/data/seed';
import { useSignupForm } from './FormContext';
import { StepWrapper, FormField, ChipPicker, StepNav } from './FormFields';

interface Props { onNext: () => void; onBack: () => void }

export default function Step3Credentials({ onNext, onBack }: Props) {
  const { form, toggleArrayItem } = useSignupForm();

  return (
    <>
      <StepWrapper title="Credentials" subtitle="Add your certifications.">
        <FormField label="Certifications">
          <ChipPicker items={ALL_CERTS} selected={form.certs} onToggle={(v) => toggleArrayItem('certs', v)} />
        </FormField>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '8px' }}>
          You can add education details from your dashboard after signup.
        </p>
      </StepWrapper>

      <StepNav onBack={onBack} onNext={onNext} currentStep={3} />
    </>
  );
}
