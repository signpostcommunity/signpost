'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSignupForm } from './FormContext';
import { StepWrapper, CheckboxItem, SummaryRow, StepNav } from './FormFields';

interface Props { onBack: () => void }

export default function Step6Review({ onBack }: Props) {
  const router = useRouter();
  const { form, update } = useSignupForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = form.agreeTerms && form.agreeDirectory;

  async function handleSubmit() {
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Failed to create account');
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({ id: userId, role: 'interpreter' });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const { data: interpData, error: interpError } = await supabase
      .from('interpreter_profiles')
      .insert({
        user_id: userId,
        name: `${form.firstName} ${form.lastName}`.trim(),
        location: `${form.city ? form.city + ', ' : ''}${form.country}`,
        country: form.country,
        state: form.city,
        interpreter_type: form.interpreterType,
        work_mode: form.workMode,
        years_experience: form.yearsExp ? parseInt(form.yearsExp) : null,
        bio: form.bio,
        video_url: form.videoUrl,
        video_desc: form.videoDesc,
        status: 'pending',
      })
      .select()
      .single();

    if (interpError || !interpData) {
      setError(interpError?.message || 'Failed to create interpreter profile');
      setLoading(false);
      return;
    }

    const interpId = interpData.id;

    await Promise.all([
      form.signLangs.length > 0 && supabase.from('interpreter_sign_languages').insert(
        form.signLangs.map((l) => ({ interpreter_id: interpId, language: l }))
      ),
      form.spokenLangs.length > 0 && supabase.from('interpreter_spoken_languages').insert(
        form.spokenLangs.map((l) => ({ interpreter_id: interpId, language: l }))
      ),
      form.specs.length > 0 && supabase.from('interpreter_specializations').insert(
        form.specs.map((s) => ({ interpreter_id: interpId, specialization: s }))
      ),
      form.regions.length > 0 && supabase.from('interpreter_regions').insert(
        form.regions.map((r) => ({ interpreter_id: interpId, region: r }))
      ),
      form.certs.length > 0 && supabase.from('interpreter_certifications').insert(
        form.certs.map((c) => ({ interpreter_id: interpId, name: c }))
      ),
      form.hourlyRate && supabase.from('interpreter_rate_profiles').insert({
        interpreter_id: interpId,
        label: 'Standard Rate',
        is_default: true,
        hourly_rate: parseFloat(form.hourlyRate),
        currency: form.currency,
        min_booking: parseInt(form.minBooking),
        cancellation_policy: form.cancellationPolicy,
      }),
    ]);

    router.push('/interpreter/dashboard');
  }

  return (
    <>
      <StepWrapper title="Review & Submit" subtitle="Almost there. Please review and agree to proceed.">
        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
            <SummaryRow label="Name" value={`${form.firstName} ${form.lastName}`.trim()} />
            <SummaryRow label="Email" value={form.email} />
            <SummaryRow label="Country" value={form.country} />
            <SummaryRow label="Type" value={form.interpreterType} />
            <SummaryRow label="Sign Languages" value={form.signLangs.join(', ') || '—'} />
            <SummaryRow label="Certifications" value={form.certs.join(', ') || '—'} />
            <SummaryRow label="Rate" value={form.hourlyRate ? `${form.currency} ${form.hourlyRate}/hr` : '—'} />
          </div>
        </div>
        <CheckboxItem
          checked={form.agreeTerms}
          onChange={(v) => update('agreeTerms', v)}
          label="I agree to the signpost Terms of Service and Privacy Policy."
        />
        <CheckboxItem
          checked={form.agreeDirectory}
          onChange={(v) => update('agreeDirectory', v)}
          label="I consent to my profile being listed in the public interpreter directory once approved."
        />
        {error && (
          <div style={{
            background: 'rgba(255,107,133,0.1)',
            border: '1px solid rgba(255,107,133,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: 'var(--accent3)',
            fontSize: '0.85rem',
            marginTop: '16px',
          }}>
            {error}
          </div>
        )}
      </StepWrapper>

      <StepNav
        onBack={onBack}
        onNext={handleSubmit}
        nextLabel="Create Profile →"
        nextDisabled={!canSubmit}
        loading={loading}
        currentStep={6}
      />
    </>
  );
}
