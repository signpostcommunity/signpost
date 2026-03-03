'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Interpreter } from '@/lib/types';
import RatingStars from '@/components/ui/RatingStars';
import Chip from '@/components/ui/Chip';

const TABS = ['Overview', 'Credentials', 'Rates', 'Availability'] as const;
type Tab = typeof TABS[number];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MOCK_AVAILABILITY = [
  { day: 1, start: '09:00', end: '18:00' },
  { day: 2, start: '09:00', end: '18:00' },
  { day: 3, start: '09:00', end: '17:00' },
  { day: 4, start: '09:00', end: '18:00' },
  { day: 5, start: '10:00', end: '15:00' },
];

const MOCK_RATE_PROFILES = [
  {
    id: '1',
    label: 'Standard Rate',
    isDefault: true,
    color: 'var(--accent)',
    hourlyRate: 120,
    currency: 'USD',
    minBooking: 60,
    cancellationPolicy: '48 hours notice required',
    lateCancelFee: 75,
    eligibilityCriteria: 'Open to all clients',
  },
  {
    id: '2',
    label: 'Conference Rate',
    isDefault: false,
    color: 'var(--accent2)',
    hourlyRate: 180,
    currency: 'USD',
    minBooking: 120,
    cancellationPolicy: '72 hours notice required',
    afterHoursDiff: 1.5,
    eligibilityCriteria: 'Multi-day conferences only (2+ interpreters)',
  },
];

export default function ProfileClient({ interpreter: i }: { interpreter: Interpreter }) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [expandedRate, setExpandedRate] = useState<string | null>('1');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Back */}
      <Link
        href="/directory"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--muted)',
          fontSize: '0.85rem',
          textDecoration: 'none',
          marginBottom: '24px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        ← Back to directory
      </Link>

      {/* Profile Hero */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        {/* Header band */}
        <div
          style={{
            height: 100,
            background: i.color,
            position: 'relative',
          }}
        />

        {/* Avatar + info */}
        <div style={{ padding: '0 32px 28px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '20px',
              marginTop: '-44px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: i.color,
                border: '3px solid var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontFamily: 'var(--font-syne)',
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {i.initials}
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingTop: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {i.name}
                </h1>
                {i.available && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.72rem',
                      color: '#34d399',
                      background: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.3)',
                      borderRadius: '100px',
                      padding: '3px 10px',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                    Available
                  </span>
                )}
              </div>
              <div
                style={{
                  color: 'var(--muted)',
                  fontSize: '0.9rem',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                📍 {i.location}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '6px',
                }}
              >
                <RatingStars rating={i.rating} size={14} />
                <span style={{ fontWeight: 600 }}>{i.rating.toFixed(1)}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>({i.reviews} reviews)</span>
              </div>
            </div>

            {/* CTA */}
            <button
              className="btn-primary btn-large"
              style={{ alignSelf: 'flex-end' }}
            >
              Send Request
            </button>
          </div>

          {/* Lang chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {i.signLangs.map((l) => <Chip key={l} label={l} variant="accent" />)}
            {i.spokenLangs.map((l) => <Chip key={l} label={l} />)}
            {i.regions.map((r) => <Chip key={r} label={r} variant="purple" size="sm" />)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '4px',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: activeTab === tab ? 'var(--surface2)' : 'none',
              border: activeTab === tab ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: '8px',
              color: activeTab === tab ? 'var(--text)' : 'var(--muted)',
              fontFamily: 'var(--font-dm)',
              fontSize: '0.88rem',
              fontWeight: activeTab === tab ? 500 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Bio */}
          <Section title="About">
            <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>
              {i.bio || `${i.name} is a certified sign language interpreter based in ${i.location}, specializing in ${i.specs.join(', ')}.`}
            </p>
          </Section>

          {/* Specializations */}
          <Section title="Specializations">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {i.specs.map((s) => (
                <div
                  key={s}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </Section>

          {/* Languages */}
          <Section title="Languages">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Sign Languages
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {i.signLangs.map((l) => <Chip key={l} label={l} variant="accent" />)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Spoken Languages
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {i.spokenLangs.map((l) => <Chip key={l} label={l} />)}
                </div>
              </div>
            </div>
          </Section>
        </div>
      )}

      {activeTab === 'Credentials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Section title="Certifications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {i.certs.map((cert) => (
                <div
                  key={cert}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{cert}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {cert === 'RID' ? 'Registry of Interpreters for the Deaf' :
                       cert === 'EFSLI' ? 'European Forum of Sign Language Interpreters' :
                       cert === 'NRSLI' ? 'National Registers of Communication Professionals' :
                       cert === 'FENEIS' ? 'Federação Nacional de Educação e Integração dos Surdos' :
                       cert === 'JEIAD' ? 'Japan Institute for Sign Language Studies' : cert}
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.3)',
                      borderRadius: '100px',
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      color: '#34d399',
                    }}
                  >
                    ✓ Verified
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Education">
            <div
              style={{
                padding: '14px 18px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                BA Interpreting &amp; Translation Studies
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                2012 — Example University
              </div>
            </div>
          </Section>
        </div>
      )}

      {activeTab === 'Rates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {MOCK_RATE_PROFILES.map((rate) => (
            <div
              key={rate.id}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${expandedRate === rate.id ? rate.color : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              {/* Rate header */}
              <button
                onClick={() => setExpandedRate(expandedRate === rate.id ? null : rate.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 24px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: rate.color,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>
                      {rate.label}
                    </span>
                    {rate.isDefault && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '0.7rem',
                          background: 'rgba(0,229,255,0.1)',
                          border: '1px solid rgba(0,229,255,0.3)',
                          borderRadius: '100px',
                          padding: '2px 8px',
                          color: 'var(--accent)',
                        }}
                      >
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-syne)',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      color: rate.color,
                    }}
                  >
                    {rate.currency} {rate.hourlyRate}/hr
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                    {expandedRate === rate.id ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {/* Rate details */}
              {expandedRate === rate.id && (
                <div
                  style={{
                    padding: '0 24px 20px',
                    borderTop: '1px solid var(--border)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                  }}
                >
                  {rate.minBooking && (
                    <RateDetail label="Minimum booking" value={`${rate.minBooking} minutes`} />
                  )}
                  {rate.cancellationPolicy && (
                    <RateDetail label="Cancellation policy" value={rate.cancellationPolicy} />
                  )}
                  {rate.lateCancelFee && (
                    <RateDetail label="Late cancel fee" value={`${rate.currency} ${rate.lateCancelFee}`} />
                  )}
                  {rate.afterHoursDiff && (
                    <RateDetail label="After-hours" value={`×${rate.afterHoursDiff} rate`} />
                  )}
                  {rate.eligibilityCriteria && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <RateDetail label="Eligibility" value={rate.eligibilityCriteria} />
                    </div>
                  )}
                  <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                    <button className="btn-primary">Request this rate →</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Availability' && (
        <Section title="Weekly Availability">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DAYS.map((day, idx) => {
              const slot = MOCK_AVAILABILITY.find((a) => a.day === idx);
              return (
                <div
                  key={day}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 16px',
                    background: slot ? 'rgba(0,229,255,0.04)' : 'var(--surface2)',
                    border: `1px solid ${slot ? 'rgba(0,229,255,0.2)' : 'var(--border)'}`,
                    borderRadius: '10px',
                  }}
                >
                  <span
                    style={{
                      width: 48,
                      fontFamily: 'var(--font-syne)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: slot ? 'var(--text)' : 'var(--muted)',
                    }}
                  >
                    {day}
                  </span>
                  {slot ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#34d399',
                        }}
                      />
                      <span style={{ fontSize: '0.88rem', color: '#34d399' }}>
                        {slot.start} – {slot.end}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
          <p
            style={{
              marginTop: '16px',
              fontSize: '0.82rem',
              color: 'var(--muted)',
              fontStyle: 'italic',
            }}
          >
            * Availability shown in interpreter's local time zone. After-hours bookings available on request.
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-syne)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: '16px',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function RateDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{value}</div>
    </div>
  );
}
