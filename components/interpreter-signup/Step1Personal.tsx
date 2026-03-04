'use client';

import { useSignupForm } from './FormContext';
import { FormField, TextInput, SelectInput, CheckboxItem, StepNav } from './FormFields';

const REGION_TILES = [
  { id: 'Worldwide', label: '\u{1F310} Worldwide', color: '#00e5ff' },
  { id: 'NA', label: 'NA — North America', color: '#f97316' },
  { id: 'LATAM', label: 'LATAM — Latin America & Caribbean', color: '#a78bfa' },
  { id: 'EU', label: 'EU — Europe', color: '#00e5ff' },
  { id: 'AF', label: 'AF — Africa', color: '#22c55e' },
  { id: 'ME', label: 'ME — Middle East', color: '#eab308' },
  { id: 'SA', label: 'SA — South & Central Asia', color: '#f472b6' },
  { id: 'EA', label: 'EA — East & Southeast Asia', color: '#eab308' },
  { id: 'OC', label: 'OC — Oceania & Pacific', color: '#2dd4bf' },
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Spain', 'Australia', 'Germany',
  'France', 'Japan', 'Brazil', 'Canada', 'Other',
];

interface Props { onNext: () => void }

export default function Step1Personal({ onNext }: Props) {
  const { form, update, toggleArrayItem } = useSignupForm();

  const canContinue = form.firstName && form.lastName && form.email && form.country;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Row 1: First Name | Last Name | Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <FormField label="First Name *">
            <TextInput value={form.firstName} onChange={(v) => update('firstName', v)} placeholder="Sofia" />
          </FormField>
          <FormField label="Last Name *">
            <TextInput value={form.lastName} onChange={(v) => update('lastName', v)} placeholder="Reyes" />
          </FormField>
          <FormField label="Phone / WhatsApp">
            <TextInput type="tel" value={form.phone} onChange={(v) => update('phone', v)} placeholder="+1 555 000 0000" />
          </FormField>
        </div>

        {/* Row 2: Email | Country | City */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <FormField label="Email Address *">
            <TextInput type="email" value={form.email} onChange={(v) => update('email', v)} placeholder="sofia@example.com" />
          </FormField>
          <FormField label="Country *">
            <SelectInput
              value={form.country}
              onChange={(v) => update('country', v)}
              options={[
                { value: '', label: 'Select country…' },
                ...COUNTRIES.map((c) => ({ value: c, label: c })),
              ]}
            />
          </FormField>
          <FormField label="City / Region *">
            <TextInput value={form.city} onChange={(v) => update('city', v)} placeholder="Madrid" />
          </FormField>
        </div>

        {/* Bio */}
        <FormField label="Professional Bio *">
          <textarea
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            placeholder="Tell the Deaf community about yourself, your background, your approach to interpreting, and what you're passionate about..."
            rows={4}
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

        {/* Row 3: Interpreter Type | Mode of Work | Years of Experience */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <FormField label="Interpreter Type *">
            <SelectInput
              value={form.interpreterType}
              onChange={(v) => update('interpreterType', v)}
              options={[
                { value: '', label: 'Select…' },
                { value: 'hearing', label: 'Hearing Interpreter' },
                { value: 'deaf', label: 'Deaf Interpreter' },
              ]}
            />
          </FormField>
          <FormField label="Mode of Work *">
            <SelectInput
              value={form.workMode}
              onChange={(v) => update('workMode', v)}
              options={[
                { value: '', label: 'Select…' },
                { value: 'remote', label: 'Remote only' },
                { value: 'onsite', label: 'On-site only' },
                { value: 'both', label: 'Both remote & on-site' },
              ]}
            />
          </FormField>
          <FormField label="Years of Experience *">
            <SelectInput
              value={form.yearsExp}
              onChange={(v) => update('yearsExp', v)}
              options={[
                { value: '', label: 'Select…' },
                { value: '0', label: 'Less than 1 year' },
                { value: '1', label: '1–2 years' },
                { value: '3', label: '3–5 years' },
                { value: '6', label: '6–10 years' },
                { value: '11', label: '11–20 years' },
                { value: '20', label: '20+ years' },
              ]}
            />
          </FormField>
        </div>

        {/* Row 4: Website | LinkedIn */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Website">
            <TextInput value={form.website} onChange={(v) => update('website', v)} placeholder="https://yoursite.com" />
          </FormField>
          <FormField label="LinkedIn Profile">
            <TextInput value={form.linkedin} onChange={(v) => update('linkedin', v)} placeholder="https://linkedin.com/in/…" />
          </FormField>
        </div>

        {/* Regions */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Regions Available For Work Travel
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '12px', lineHeight: 1.6 }}>
            Select all regions where you are willing and able to work on-site. Remote work is available globally regardless of selection.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {REGION_TILES.map((r) => {
              const selected = form.regions.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleArrayItem('regions', r.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: selected ? `1px solid ${r.color}` : '1px solid var(--border)',
                    background: selected ? `${r.color}12` : 'var(--surface)',
                    color: selected ? 'var(--text)' : 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Event Coordination */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Event Coordination
          </div>
          <CheckboxItem
            checked={form.eventCoordination}
            onChange={(v) => update('eventCoordination', v)}
            label="I am available to coordinate interpreter teams for complex and/or large-scale events (conferences, summits, multi-day institutional events, and more)"
          />
          {form.eventCoordination && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'rgba(0,229,255,0.06)',
                border: '1px solid rgba(0,229,255,0.15)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '0.82rem',
                color: 'var(--muted)',
                lineHeight: 1.6,
              }}>
                Coordination rates are negotiated directly with the requester. You&apos;ll discuss the scope, team size, and your fee once an inquiry comes in.
              </div>
              <FormField label="Brief description of your coordination experience">
                <textarea
                  value={form.coordinationBio}
                  onChange={(e) => update('coordinationBio', e.target.value)}
                  placeholder="Describe your experience coordinating interpreter teams..."
                  rows={3}
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
            </div>
          )}
        </div>
      </div>

      <StepNav onNext={onNext} nextDisabled={!canContinue} currentStep={1} />
    </>
  );
}
