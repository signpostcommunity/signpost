'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ALL_SIGN_LANGS, ALL_SPOKEN_LANGS, ALL_SPECS, ALL_REGIONS, ALL_CERTS } from '@/lib/data/seed';

const TOTAL_STEPS = 6;

interface FormData {
  name: string;
  email: string;
  password: string;
  location: string;
  country: string;
  state: string;
  interpreterType: string;
  workMode: string;
  yearsExp: string;
  signLangs: string[];
  spokenLangs: string[];
  specs: string[];
  regions: string[];
  certs: string[];
  hourlyRate: string;
  currency: string;
  minBooking: string;
  cancellationPolicy: string;
  videoUrl: string;
  videoDesc: string;
  bio: string;
  agreeTerms: boolean;
  agreeDirectory: boolean;
}

const defaultForm: FormData = {
  name: '', email: '', password: '', location: '', country: '', state: '',
  interpreterType: 'freelance', workMode: 'both', yearsExp: '',
  signLangs: [], spokenLangs: [], specs: [], regions: [], certs: [],
  hourlyRate: '', currency: 'USD', minBooking: '60', cancellationPolicy: '48 hours notice required',
  videoUrl: '', videoDesc: '', bio: '',
  agreeTerms: false, agreeDirectory: false,
};

export default function InterpreterSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: keyof FormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArrayItem(field: keyof FormData, value: string) {
    const current = form[field] as string[];
    update(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  }

  function canContinue() {
    if (step === 1) return form.name && form.email && form.password && form.country;
    if (step === 2) return form.signLangs.length > 0;
    if (step === 6) return form.agreeTerms && form.agreeDirectory;
    return true;
  }

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
        name: form.name,
        location: `${form.state ? form.state + ', ' : ''}${form.country}`,
        country: form.country,
        state: form.state,
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
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: 3,
                borderRadius: '2px',
                background: idx < step ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          Step {step} of {TOTAL_STEPS}
        </div>
      </div>

      {step === 1 && (
        <StepWrapper title="Personal Information" subtitle="Tell us about yourself.">
          <FormField label="Full Name">
            <TextInput value={form.name} onChange={(v) => update('name', v)} placeholder="Sofia Reyes" />
          </FormField>
          <FormField label="Email">
            <TextInput type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="you@example.com" />
          </FormField>
          <FormField label="Password">
            <TextInput type="password" value={form.password} onChange={(v) => update('password', v)} placeholder="Minimum 8 characters" />
          </FormField>
          <FormField label="Country">
            <TextInput value={form.country} onChange={(v) => update('country', v)} placeholder="Spain" />
          </FormField>
          <FormField label="State / Region">
            <TextInput value={form.state} onChange={(v) => update('state', v)} placeholder="Community of Madrid" />
          </FormField>
          <FormField label="Interpreter Type">
            <SelectInput
              value={form.interpreterType}
              onChange={(v) => update('interpreterType', v)}
              options={[
                { value: 'freelance', label: 'Freelance' },
                { value: 'agency', label: 'Agency Staff' },
                { value: 'staff', label: 'In-house Staff' },
              ]}
            />
          </FormField>
          <FormField label="Work Mode">
            <SelectInput
              value={form.workMode}
              onChange={(v) => update('workMode', v)}
              options={[
                { value: 'both', label: 'In-person & Remote' },
                { value: 'in_person', label: 'In-person only' },
                { value: 'remote', label: 'Remote only' },
              ]}
            />
          </FormField>
          <FormField label="Years of Experience">
            <TextInput type="number" value={form.yearsExp} onChange={(v) => update('yearsExp', v)} placeholder="e.g. 8" />
          </FormField>
        </StepWrapper>
      )}

      {step === 2 && (
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
      )}

      {step === 3 && (
        <StepWrapper title="Credentials" subtitle="Add your certifications.">
          <FormField label="Certifications">
            <ChipPicker items={ALL_CERTS} selected={form.certs} onToggle={(v) => toggleArrayItem('certs', v)} />
          </FormField>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '8px' }}>
            You can add education details from your dashboard after signup.
          </p>
        </StepWrapper>
      )}

      {step === 4 && (
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
      )}

      {step === 5 && (
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
      )}

      {step === 6 && (
        <StepWrapper title="Review & Submit" subtitle="Almost there. Please review and agree to proceed.">
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <SummaryRow label="Name" value={form.name} />
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
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '10px 20px',
            color: step === 1 ? 'var(--border)' : 'var(--muted)',
            fontSize: '0.9rem',
            cursor: step === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Back
        </button>
        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue()}
            className="btn-primary"
            style={{ opacity: canContinue() ? 1 : 0.4, padding: '10px 24px' }}
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canContinue() || loading}
            className="btn-primary"
            style={{ opacity: canContinue() && !loading ? 1 : 0.4, padding: '10px 24px' }}
          >
            {loading ? 'Creating profile…' : 'Create Profile →'}
          </button>
        )}
      </div>
    </div>
  );
}

function StepWrapper({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 style={{
        fontFamily: 'var(--font-syne)',
        fontSize: '1.6rem',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        marginBottom: '6px',
      }}>
        {title}
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '0.9rem' }}>{subtitle}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>{children}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ type = 'text', value, onChange, placeholder }: { type?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 14px',
        color: 'var(--text)',
        fontSize: '0.95rem',
        outline: 'none',
      }}
      onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
    />
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '12px 14px',
        color: 'var(--text)',
        fontSize: '0.95rem',
        outline: 'none',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function ChipPicker({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onToggle(item)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '100px',
            padding: '6px 14px',
            fontSize: '0.82rem',
            cursor: 'pointer',
            border: selected.includes(item) ? '1px solid rgba(0,229,255,0.5)' : '1px solid var(--border)',
            background: selected.includes(item) ? 'rgba(0,229,255,0.12)' : 'var(--surface)',
            color: selected.includes(item) ? 'var(--accent)' : 'var(--muted)',
            transition: 'all 0.15s',
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: 'var(--text)', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

function CheckboxItem({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: '2px', accentColor: 'var(--accent)' }}
      />
      <span style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}
