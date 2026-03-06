'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TOTAL_STEPS = 5;

type RoleType = 'individual' | 'organization' | 'institution' | null;

interface FormData {
  role: RoleType;
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  orgName: string;
  orgType: string;
  requestDesc: string;
  commPrefs: string[];
}

const defaultForm: FormData = {
  role: null, name: '', email: '', password: '', phone: '', country: '',
  orgName: '', orgType: '', requestDesc: '', commPrefs: [],
};

const roleOptions = [
  { value: 'individual', label: 'Individual', desc: 'A person who needs an interpreter for personal or professional use.' },
  { value: 'organization', label: 'Organization', desc: 'A company, non-profit, or association that regularly requests interpreting services.' },
  { value: 'institution', label: 'Institution', desc: 'A school, hospital, court, or government body with ongoing interpreting needs.' },
] as const;

export default function RequestSignupClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: keyof FormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function canContinue() {
    if (step === 1) return form.role !== null;
    if (step === 2) return form.name && form.email && form.password;
    return true;
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (authError || !authData.user) { setError(authError?.message || 'Failed to create account'); setLoading(false); return; }
    const userId = authData.user.id;
    const userRole = form.role === 'individual' ? 'requester' : 'org';
    await supabase.from('user_profiles').insert({ id: userId, role: userRole });
    await supabase.from('requester_profiles').insert({
      id: userId, name: form.name, phone: form.phone, country: form.country,
      org_name: form.orgName, org_type: form.orgType,
    });
    router.push('/request/dashboard');
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Step indicator */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
            <div key={idx} style={{ flex: 1, height: 3, borderRadius: '2px', background: idx < step ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Step {step} of {TOTAL_STEPS}</div>
      </div>

      {step === 1 && (
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>Who are you?</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '0.9rem' }}>Select the option that best describes you.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {roleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('role', opt.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '20px 20px',
                  background: 'var(--surface)',
                  border: `1px solid ${form.role === opt.value ? 'rgba(0,229,255,0.5)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px', fontFamily: 'var(--font-syne)' }}>{opt.label}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>Create your account</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '0.9rem' }}>You'll use these to sign in.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InputField label="Full Name" value={form.name} onChange={(v) => update('name', v)} placeholder="Your name" />
            <InputField label="Email" type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="you@example.com" />
            <InputField label="Password" type="password" value={form.password} onChange={(v) => update('password', v)} placeholder="Minimum 8 characters" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>About your request</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '0.9rem' }}>Tell us a bit about your interpreting needs.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <InputField label="Phone (optional)" value={form.phone} onChange={(v) => update('phone', v)} placeholder="+1 555 000 0000" />
            <InputField label="Country" value={form.country} onChange={(v) => update('country', v)} placeholder="United States" />
            {form.role !== 'individual' && (
              <>
                <InputField label="Organization Name" value={form.orgName} onChange={(v) => update('orgName', v)} placeholder="Acme Corp" />
                <InputField label="Organization Type" value={form.orgType} onChange={(v) => update('orgType', v)} placeholder="Hospital / School / Business / etc." />
              </>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '6px' }}>Describe your interpreting needs (optional)</label>
              <textarea value={form.requestDesc} onChange={(e) => update('requestDesc', e.target.value)}
                placeholder="e.g. Regular medical appointments in ASL, monthly board meetings, etc."
                rows={4}
                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text)', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-dm)' }} />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>Find Interpreters</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '0.9rem' }}>After signing up, you'll be able to browse and request interpreters from the directory.</p>
          <div style={{ padding: '24px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: '12px' }}>What you can do after signing up:</div>
            {['Browse the global interpreter directory', 'Filter by language, specialization, and region', 'View interpreter profiles and rates', 'Send booking requests directly', 'Manage requests from your dashboard'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', fontSize: '0.88rem', color: 'var(--muted)' }}>
                <span style={{ color: 'var(--accent)', marginTop: '1px' }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>You're all set!</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '28px', fontSize: '0.9rem' }}>Review your information and create your account.</p>
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              {[['Account type', form.role || '—'], ['Name', form.name], ['Email', form.email], ['Country', form.country || '—'], ...(form.orgName ? [['Organization', form.orgName]] : [])].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</div>
                  <div style={{ color: 'var(--text)', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          {error && <div style={{ background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)', borderRadius: '8px', padding: '12px 16px', color: 'var(--accent3)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</div>}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 20px', color: step === 1 ? 'var(--border)' : 'var(--muted)', fontSize: '0.9rem', cursor: step === 1 ? 'not-allowed' : 'pointer' }}
        >
          ← Back
        </button>
        {step < TOTAL_STEPS ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canContinue()} className="btn-primary" style={{ opacity: canContinue() ? 1 : 0.4, padding: '10px 24px' }}>
            Continue →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.4 : 1, padding: '10px 24px' }}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        )}
      </div>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)', marginBottom: '6px' }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text)', fontSize: '0.95rem', outline: 'none' }}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')} onBlur={(e) => (e.target.style.borderColor = 'var(--border)')} />
    </div>
  );
}
