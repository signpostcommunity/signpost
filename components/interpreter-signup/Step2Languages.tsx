'use client';

import { ALL_SIGN_LANGS, ALL_SPOKEN_LANGS, ALL_SPECS, ALL_REGIONS } from '@/lib/data/seed';
import { useSignupForm } from './FormContext';
import { StepWrapper, FormField, ChipPicker, StepNav } from './FormFields';

interface Props { onNext: () => void; onBack: () => void }

export default function Step2Languages({ onNext, onBack }: Props) {
  const { form, toggleArrayItem } = useSignupForm();

  const canContinue = form.signLangs.length > 0;

  return (
    <>
      <StepWrapper title="Languages & Specializations" subtitle="Select all that apply.">
        <FormField label="Sign Languages">
          <ChipPicker items={ALL_SIGN_LANGS} selected={form.signLangs} onToggle={(v) => toggleArrayItem('signLangs', v)} />
        </FormField>
        <FormField label="Spoken Languages">
          <ChipPicker items={ALL_SPOKEN_LANGS} selected={form.spokenLangs} onToggle={(v) => toggleArrayItem('spokenLangs', v)} />
        </FormField>
        <FormField label="Specializations">
          <ChipPicker items={ALL_SPECS} selected={form.specs} onToggle={(v) => toggleArrayItem('specs', v)} />
        </FormField>
        <FormField label="Regions Served">
          <ChipPicker items={ALL_REGIONS} selected={form.regions} onToggle={(v) => toggleArrayItem('regions', v)} />
        </FormField>
      </StepWrapper>

      <StepNav onBack={onBack} onNext={onNext} nextDisabled={!canContinue} currentStep={2} />
    </>
  );
}
