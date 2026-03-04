'use client';

import { useSignupForm } from './FormContext';
import { StepWrapper, FormField, TextInput, SelectInput, StepNav } from './FormFields';

interface Props { onNext: () => void; onBack: () => void }

export default function Step4Rates({ onNext, onBack }: Props) {
  const { form, update } = useSignupForm();

  return (
    <>
      <StepWrapper title="Rates" subtitle="Set your standard rate. You can add more rate profiles later.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Hourly Rate">
            <TextInput type="number" value={form.hourlyRate} onChange={(v) => update('hourlyRate', v)} placeholder="120" />
          </FormField>
          <FormField label="Currency">
            <SelectInput
              value={form.currency}
              onChange={(v) => update('currency', v)}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'GBP', label: 'GBP' },
                { value: 'AUD', label: 'AUD' },
                { value: 'BRL', label: 'BRL' },
              ]}
            />
          </FormField>
        </div>
        <FormField label="Minimum Booking (minutes)">
          <TextInput type="number" value={form.minBooking} onChange={(v) => update('minBooking', v)} placeholder="60" />
        </FormField>
        <FormField label="Cancellation Policy">
          <TextInput value={form.cancellationPolicy} onChange={(v) => update('cancellationPolicy', v)} placeholder="48 hours notice required" />
        </FormField>
      </StepWrapper>

      <StepNav onBack={onBack} onNext={onNext} currentStep={4} />
    </>
  );
}
