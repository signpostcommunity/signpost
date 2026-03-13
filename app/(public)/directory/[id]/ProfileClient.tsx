'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Interpreter } from '@/lib/types';
import { getVideoEmbedUrl } from '@/lib/videoUtils';
import FlagProfileModal from '@/components/directory/FlagProfileModal';
import AddToListModal from '@/components/directory/AddToListModal';
import SendMessageModal from '@/components/messaging/SendMessageModal';
import { createClient } from '@/lib/supabase/client';
import { groupSpecsByCategory } from '@/lib/constants/specializations';

const TABS = ['Overview', 'Credentials', 'Availability'] as const;
type Tab = (typeof TABS)[number];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MOCK_AVAILABILITY = [
  { day: 1, start: '09:00', end: '18:00' },
  { day: 2, start: '09:00', end: '18:00' },
  { day: 3, start: '09:00', end: '17:00' },
  { day: 4, start: '09:00', end: '18:00' },
  { day: 5, start: '10:00', end: '15:00' },
];

const CERT_FULL_NAMES: Record<string, string> = {
  RID: 'Registry of Interpreters for the Deaf, USA',
  EFSLI: 'European Forum of Sign Language Interpreters',
  NRSLI: 'National Registers of Communication Professionals',
  FENEIS: 'Federação Nacional de Educação e Integração dos Surdos',
  JEIAD: 'Japan Institute for Sign Language Studies',
  NAATI: 'National Accreditation Authority for Translators and Interpreters',
  AICA: 'Association of International Conference Interpreters',
};

export default function ProfileClient({ interpreter: i }: { interpreter: Interpreter }) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Header band (lighter surface) ── */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          paddingTop: '80px',
        }}
      >
        <div className="profile-header-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px 0' }}>
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
              transition: 'color 0.15s',
            }}
          >
            ← Back to Directory
          </Link>

          {/* Profile header */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'flex-start',
              marginBottom: '28px',
              flexWrap: 'wrap',
            }}
          >
            {/* Left: avatar + info */}
            <div style={{ display: 'flex', gap: '20px', flex: 1, minWidth: 0, alignItems: 'flex-start' }}>
              {/* Avatar */}
              {i.photoUrl ? (
                <img
                  src={i.photoUrl}
                  alt={i.name}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    border: '3px solid var(--accent)',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    background: i.color,
                    border: '3px solid var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {i.initials}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name */}
                <h1
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    marginBottom: '4px',
                  }}
                >
                  {i.name}
                </h1>

                {/* Location · Mode · Member since */}
                <div
                  style={{
                    color: 'var(--muted)',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M5 1C3.34 1 2 2.34 2 4C2 6.5 5 9 5 9C5 9 8 6.5 8 4C8 2.34 6.66 1 5 1ZM5 5.5C4.17 5.5 3.5 4.83 3.5 4C3.5 3.17 4.17 2.5 5 2.5C5.83 2.5 6.5 3.17 6.5 4C6.5 4.83 5.83 5.5 5 5.5Z"
                        fill="var(--muted)"
                      />
                    </svg>
                    {i.location}
                  </span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>Available for remote &amp; on-site</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>Member since 2019</span>
                </div>

                {/* Badges row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: '100px',
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: '1px solid rgba(0,229,255,0.4)',
                      background: 'rgba(0,229,255,0.1)',
                      color: 'var(--accent)',
                    }}
                  >
                    {i.isDeafInterpreter ? 'Deaf Interpreter' : 'Hearing Interpreter'}
                  </span>
                  {i.signLangs.map((lang) => (
                    <span
                      key={lang}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '100px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        border: '1px solid rgba(0,229,255,0.35)',
                        background: 'rgba(0,229,255,0.08)',
                        color: 'var(--accent)',
                      }}
                    >
                      {lang}
                    </span>
                  ))}
                  {i.spokenLangs.map((lang) => (
                    <span
                      key={lang}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '100px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        border: '1px solid rgba(123,97,255,0.35)',
                        background: 'rgba(123,97,255,0.1)',
                        color: '#7b61ff',
                      }}
                    >
                      {lang}
                    </span>
                  ))}
                  {i.certs.slice(0, 3).map((cert) => (
                    <span
                      key={cert}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '100px',
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text)',
                      }}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flexShrink: 0,
                minWidth: 180,
              }}
            >
              <Link
                href="/request"
                className="btn-primary"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: '100px',
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Request Booking
              </Link>
              <button
                onClick={() => setAddToListOpen(true)}
                style={{
                  width: '100%',
                  padding: '10px 24px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '100px',
                  border: '1px solid rgba(0,229,255,0.4)',
                  background: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                + Add to my list
              </button>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    router.push(`/interpreter/login?redirect=/directory/${i.id}`);
                    return;
                  }
                  if (!i.userId) {
                    showToast('Unable to message this interpreter at this time');
                    return;
                  }
                  setMessageModalOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: '10px 24px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  borderRadius: '100px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Send Message
              </button>
            </div>
          </div>

          {/* Tabs — inside the header band */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.9rem',
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content area (darker background) ── */}
      <div className="profile-content-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px 80px' }}>
        <div
          style={{
            display: 'flex',
            gap: '28px',
            alignItems: 'flex-start',
          }}
        >
          {/* Left: tab content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {activeTab === 'Overview' && <OverviewTab interpreter={i} />}
            {activeTab === 'Credentials' && <CredentialsTab interpreter={i} />}
            {activeTab === 'Availability' && <AvailabilityTab />}
          </div>

          {/* Right: sticky sidebar */}
          <div
            className="profile-sidebar-desktop"
            style={{
              width: 300,
              flexShrink: 0,
              position: 'sticky',
              top: 90,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <SidebarCard title="Quick Info">
              <InfoRow label="Interpreter Type" value={i.isDeafInterpreter ? 'Deaf Interpreter' : 'Hearing Interpreter'} />
              <InfoRow label="Response Time" value="~2 hours" />
              <InfoRow label="Mode" value="Remote + On-site" />
              <InfoRow label="Experience" value="12 Years" />
              <InfoRow
                label="Gender"
                value={
                  i.gender === 'male' ? 'Male' :
                  i.gender === 'female' ? 'Female' :
                  i.gender === 'nonbinary' ? 'Non-binary' : '—'
                }
              />
            </SidebarCard>

            {i.certs.length > 0 && (
              <SidebarCard title="Top Certifications">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {i.certs.map((cert) => (
                    <div key={cert} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'rgba(0,229,255,0.08)',
                          border: '1px solid rgba(0,229,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          color: 'var(--accent)',
                          flexShrink: 0,
                        }}
                      >
                        🎓
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cert}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.3 }}>
                          {CERT_FULL_NAMES[cert] || cert}{(() => {
                            const detail = i.certDetails?.find(d => d.name === cert);
                            return detail?.verificationLink ? <> · <span style={{ color: '#34d399' }}>✓ Verified</span></> : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted)', opacity: 0.7, marginTop: '12px', lineHeight: 1.4 }}>
                  Credentials are self-reported. Verified badges indicate uploaded documentation or a link to the certifying body.
                </p>
              </SidebarCard>
            )}

            <SidebarCard title="Languages">
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                  Sign Languages
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {i.signLangs.map((l) => (
                    <span key={l} style={{ padding: '3px 9px', fontSize: '0.72rem', borderRadius: '100px', border: '1px solid rgba(0,229,255,0.35)', background: 'rgba(0,229,255,0.08)', color: 'var(--accent)' }}>{l}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                  Spoken Languages
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {i.spokenLangs.map((l) => (
                    <span key={l} style={{ padding: '3px 9px', fontSize: '0.72rem', borderRadius: '100px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)' }}>{l}</span>
                  ))}
                </div>
              </div>
            </SidebarCard>

            <SidebarCard title="Regions Available">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {i.regions.map((r) => (
                  <span key={r} style={{ padding: '3px 9px', fontSize: '0.72rem', borderRadius: '100px', border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.08)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🌐 {r}
                  </span>
                ))}
              </div>
            </SidebarCard>
          </div>
        </div>
      </div>

      {/* Flag this profile link */}
      <div className="profile-flag-row" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 40px', textAlign: 'center' }}>
        <button
          onClick={() => setFlagModalOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: '0.78rem',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            opacity: 0.6, transition: 'opacity 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6' }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3 2v12M3 2l8 3.5L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Flag this profile
        </button>
      </div>

      {/* Flag modal */}
      <FlagProfileModal
        isOpen={flagModalOpen}
        onClose={() => setFlagModalOpen(false)}
        interpreterProfileId={String(i.id)}
        onSuccess={() => showToast('Thank you. Your report has been submitted and will be reviewed.')}
      />

      {/* Add to List modal */}
      <AddToListModal
        isOpen={addToListOpen}
        onClose={() => setAddToListOpen(false)}
        interpreter={{
          id: String(i.id),
          name: i.name,
          initials: i.initials,
          avatar_color: i.color,
          sign_languages: i.signLangs,
          specializations: i.specs,
          location: i.location,
        }}
        userRole="deaf"
        onSuccess={() => {
          setAddToListOpen(false);
          showToast(`${i.name} added to your list`);
        }}
      />

      {/* Send Message modal */}
      {messageModalOpen && i.userId && (
        <SendMessageModal
          recipientId={i.userId}
          recipientName={i.name}
          recipientPhoto={i.photoUrl || null}
          onClose={() => setMessageModalOpen(false)}
          onSent={() => showToast(`Message sent to ${i.name}`)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: '16px', padding: '14px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.85rem', color: '#34d399',
        }}>{toast}</div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .profile-sidebar-desktop { display: none !important; }
        }
        @media (max-width: 768px) {
          .profile-header-inner { padding: 16px 16px 0 !important; }
          .profile-content-inner { padding: 20px 16px 60px !important; }
          .profile-flag-row { padding: 0 16px 32px !important; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Tab Components
   ═══════════════════════════════════════════════════ */

function OverviewTab({ interpreter: i }: { interpreter: Interpreter }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {(() => {
        const embedUrl = i.videoUrl ? getVideoEmbedUrl(i.videoUrl) : null;
        if (!embedUrl) return null;
        return (
          <Section title="Introduction Video">
            {embedUrl.includes('supabase.co/storage') ? (
              <video
                controls
                width="100%"
                src={embedUrl}
                style={{ borderRadius: '12px', border: '1px solid var(--border)', maxHeight: 420, background: '#000' }}
              />
            ) : (
              <iframe
                width="100%"
                height="315"
                src={embedUrl}
                title="Interpreter introduction video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: '12px', border: 'none' }}
              />
            )}
          </Section>
        );
      })()}

      {(() => {
        const bioParts = [i.bio, i.bioSpecializations, i.bioExtra].filter(p => p && p.trim())
        if (bioParts.length === 0) return null
        return (
          <Section title="About">
            <div style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {bioParts.map((part, idx) => (
                <p key={idx} style={{ margin: 0 }}>{part}</p>
              ))}
            </div>
          </Section>
        )
      })()}

      {(i.affinities.length > 0 || i.racialIdentity.length > 0 || i.religiousAffiliation.length > 0) && (
        <Section title="Community & Identity">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {i.affinities.map(a => (
              <span key={a} style={{
                padding: '6px 14px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 600,
                border: '1px solid rgba(123,97,255,0.35)', background: 'rgba(123,97,255,0.1)',
                color: '#7b61ff',
              }}>
                {a}
              </span>
            ))}
            {i.racialIdentity.map(r => (
              <span key={r} style={{
                padding: '6px 14px', borderRadius: 100, fontSize: '0.82rem',
                border: '1px solid rgba(123,97,255,0.35)', background: 'rgba(123,97,255,0.1)',
                color: '#7b61ff',
              }}>
                {r}
              </span>
            ))}
            {i.religiousAffiliation.map(r => (
              <span key={r} style={{
                padding: '6px 14px', borderRadius: 100, fontSize: '0.82rem',
                border: '1px solid rgba(123,97,255,0.35)', background: 'rgba(123,97,255,0.1)',
                color: '#7b61ff',
              }}>
                {r}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Settings & Specializations">
        {(() => {
          const grouped = groupSpecsByCategory(i.specs);
          const categories = Object.entries(grouped);
          if (categories.length === 0 && (!i.specializedSkills || i.specializedSkills.length === 0)) {
            return <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No specializations listed.</p>;
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {categories.map(([cat, subs]) => (
                <div key={cat}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c8c4bc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontFamily: 'var(--font-syne)' }}>
                    {cat}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {subs.map(s => (
                      <span key={s} style={{ padding: '6px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {i.specializedSkills && i.specializedSkills.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a891ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontFamily: 'var(--font-syne)' }}>
                    Specialized Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {i.specializedSkills.map(s => (
                      <span key={s} style={{ padding: '6px 14px', background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.3)', borderRadius: '8px', fontSize: '0.82rem', color: '#a891ff', fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Section>
    </div>
  );
}

function CredentialsTab({ interpreter: i }: { interpreter: Interpreter }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Section title="Certifications">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {i.certs.map((cert) => {
            const detail = i.certDetails?.find(d => d.name === cert);
            const isVerified = !!detail?.verificationLink;
            return (
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
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{CERT_FULL_NAMES[cert] || cert}</div>
              </div>
              {isVerified && (
              <a
                href={detail!.verificationLink}
                target="_blank"
                rel="noopener noreferrer"
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
                  textDecoration: 'none',
                }}
              >
                ✓ Verified
              </a>
              )}
            </div>
            );
          })}
        </div>
      </Section>

      <Section title="Education">
        <div style={{ padding: '14px 18px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <div style={{ fontWeight: 600, marginBottom: '2px' }}>BA Interpreting &amp; Translation Studies</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>2012 — Example University</div>
        </div>
      </Section>
    </div>
  );
}

function AvailabilityTab() {
  return (
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
              <span style={{ width: 48, fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.8rem', color: slot ? 'var(--text)' : 'var(--muted)' }}>
                {day}
              </span>
              {slot ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                  <span style={{ fontSize: '0.88rem', color: '#34d399' }}>{slot.start} – {slot.end}</span>
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Unavailable</span>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ marginTop: '16px', fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic' }}>
        * Availability shown in interpreter&apos;s local time zone. After-hours bookings available on request.
      </p>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
      <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
      <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
    </div>
  );
}
