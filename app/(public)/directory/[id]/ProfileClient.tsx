'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Interpreter } from '@/lib/types';
import { getVideoEmbedUrl } from '@/lib/videoUtils';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import FlagProfileModal from '@/components/directory/FlagProfileModal';
import AddToListModal from '@/components/directory/AddToListModal';
import SendMessageModal from '@/components/messaging/SendMessageModal';
import RequestVideoModal from '@/components/directory/RequestVideoModal';
import { createClient } from '@/lib/supabase/client';
import { groupSpecsByCategory } from '@/lib/constants/specializations';
import { getMentorshipLabel } from '@/lib/mentorship-categories';

const TABS = ['Overview', 'Credentials', 'Availability'] as const;
type Tab = (typeof TABS)[number];

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AvailabilityRow {
  day_of_week: number
  status: string
  start_time: string | null
  end_time: string | null
}

interface ActiveAway {
  end_date: string
  message: string
}

function formatTime12(t: string | null): string {
  if (!t) return ''
  const [hStr, mStr] = t.split(':')
  let h = parseInt(hStr)
  const m = mStr || '00'
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

const CERT_FULL_NAMES: Record<string, string> = {
  RID: 'Registry of Interpreters for the Deaf, USA',
  EFSLI: 'European Forum of Sign Language Interpreters',
  NRSLI: 'National Registers of Communication Professionals',
  FENEIS: 'Federação Nacional de Educação e Integração dos Surdos',
  JEIAD: 'Japan Institute for Sign Language Studies',
  NAATI: 'National Accreditation Authority for Translators and Interpreters',
  AICA: 'Association of International Conference Interpreters',
};

export default function ProfileClient({ interpreter: i, activeAway, availability }: { interpreter: Interpreter; activeAway?: ActiveAway | null; availability?: AvailabilityRow[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<'deaf' | 'requester' | 'interpreter' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [videoRequestModalOpen, setVideoRequestModalOpen] = useState(false);
  const [videoAlreadyRequested, setVideoAlreadyRequested] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          // Determine active role for modal (layered fallback)
          // Priority: URL ?context > localStorage signpost:lastRole > user_profiles.role
          const urlContext = new URLSearchParams(window.location.search).get('context');
          const validRoles = ['deaf', 'requester', 'interpreter'];

          if (urlContext && validRoles.includes(urlContext)) {
            setUserRole(urlContext as 'deaf' | 'requester' | 'interpreter');
          } else {
            try {
              const lastRole = localStorage.getItem('signpost:lastRole');
              if (lastRole && validRoles.includes(lastRole)) {
                setUserRole(lastRole as 'deaf' | 'requester' | 'interpreter');
              } else if (data?.role) {
                setUserRole(data.role as 'deaf' | 'requester' | 'interpreter');
              }
            } catch {
              // localStorage unavailable (private browsing, etc.)
              if (data?.role) {
                setUserRole(data.role as 'deaf' | 'requester' | 'interpreter');
              }
            }
          }
        });
    });
  }, []);

  // Check if user already requested a video from this interpreter
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from('video_requests')
      .select('id')
      .eq('requester_user_id', userId)
      .eq('interpreter_id', String(i.id))
      .maybeSingle()
      .then(({ data }) => {
        if (data) setVideoAlreadyRequested(true);
      });
  }, [userId, i.id]);

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
                    objectPosition: 'center 20%',
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
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
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
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                    fontWeight: 700,
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
                        color: '#a78bfa',
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
              className="profile-action-buttons"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flexShrink: 0,
                minWidth: 180,
              }}
            >
              {activeAway && (
                <div style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 4,
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 4 }}>
                    Away until {new Date(activeAway.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 8 }}>
                    &ldquo;{activeAway.message}&rdquo;
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                    You can still send a request - {i.name.split(' ')[0]} may respond after they return.
                  </div>
                </div>
              )}
              <Link
                href={userRole === 'deaf' ? `/dhh/dashboard/request?interpreter=${i.id}` : '/request'}
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

          {/* Tabs - inside the header band */}
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
            {activeTab === 'Overview' && (
              <OverviewTab
                interpreter={i}
                userRole={userRole}
                videoAlreadyRequested={videoAlreadyRequested}
                onRequestVideo={() => {
                  if (!userId) {
                    const router = window.location;
                    window.location.href = `/dhh/login?redirect=/directory/${i.id}`;
                    return;
                  }
                  setVideoRequestModalOpen(true);
                }}
              />
            )}
            {activeTab === 'Credentials' && <CredentialsTab interpreter={i} />}
            {activeTab === 'Availability' && <AvailabilityTab availability={availability} />}
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
              {i.yearsExperience && <InfoRow label="Experience" value={i.yearsExperience} />}
              {i.genderIdentity && <InfoRow label="Gender" value={i.genderIdentity} />}
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
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                  Sign Languages
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {i.signLangs.map((l) => (
                    <span key={l} style={{ padding: '3px 9px', fontSize: '0.72rem', borderRadius: '100px', border: '1px solid rgba(0,229,255,0.35)', background: 'rgba(0,229,255,0.08)', color: 'var(--accent)' }}>{l}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
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
        userRole={userRole}
        onSuccess={() => {
          setAddToListOpen(false);
          showToast(`${i.name} added to your list`);
        }}
        onDuplicate={() => {
          setAddToListOpen(false);
          showToast(`${i.name} is already on your list`);
        }}
      />

      {/* Request Video modal */}
      {userId && (
        <RequestVideoModal
          isOpen={videoRequestModalOpen}
          onClose={() => setVideoRequestModalOpen(false)}
          interpreterName={i.name}
          interpreterId={String(i.id)}
          userId={userId}
          onSuccess={() => {
            setVideoRequestModalOpen(false);
            setVideoAlreadyRequested(true);
            showToast('Video request sent!');
          }}
          onDuplicate={() => {
            setVideoRequestModalOpen(false);
            setVideoAlreadyRequested(true);
            showToast("You've already requested a video from this interpreter.");
          }}
        />
      )}

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
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
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
          .profile-action-buttons { width: 100% !important; min-width: 0 !important; }
          .profile-action-buttons a, .profile-action-buttons button { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Tab Components
   ═══════════════════════════════════════════════════ */

function OverviewTab({ interpreter: i, userRole, videoAlreadyRequested, onRequestVideo }: {
  interpreter: Interpreter;
  userRole: 'deaf' | 'requester' | 'interpreter' | null;
  videoAlreadyRequested: boolean;
  onRequestVideo: () => void;
}) {
  const [videos, setVideos] = useState<{ id: string; language: string; label: string | null; video_url: string }[]>([]);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase
      .from('interpreter_videos')
      .select('id, language, label, video_url, sort_order')
      .eq('interpreter_id', String(i.id))
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setVideos(data);
        }
      });
  }, [i.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Multi-language videos */}
      {videos.length > 0 ? (
        <Section title="Introduction Videos">
          {videos.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {videos.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVideoIdx(idx)}
                  style={{
                    padding: '5px 14px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 600,
                    border: `1px solid ${activeVideoIdx === idx ? 'rgba(0,229,255,0.5)' : 'var(--border)'}`,
                    background: activeVideoIdx === idx ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                    color: activeVideoIdx === idx ? 'var(--accent)' : 'var(--muted)',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    transition: 'all 0.15s',
                  }}
                >
                  {v.language}
                </button>
              ))}
            </div>
          )}
          {(() => {
            const v = videos[activeVideoIdx];
            if (!v) return null;
            const embedUrl = getVideoEmbedUrl(v.video_url);
            if (!embedUrl) return null;
            return (
              <div>
                {v.label && <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 8 }}>{v.label}</div>}
                {embedUrl.includes('supabase.co/storage') ? (
                  <video controls width="100%" src={embedUrl} style={{ borderRadius: 12, border: '1px solid var(--border)', maxHeight: 420, background: '#000' }} />
                ) : (
                  <iframe width="100%" height="315" src={embedUrl} title={`${v.language} introduction video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                    style={{ borderRadius: 12, border: 'none' }} />
                )}
              </div>
            );
          })()}
        </Section>
      ) : (() => {
        // Fallback to legacy single video
        const embedUrl = i.videoUrl ? getVideoEmbedUrl(i.videoUrl) : null;
        if (embedUrl) {
          return (
            <Section title="Introduction Video">
              {embedUrl.includes('supabase.co/storage') ? (
                <video controls width="100%" src={embedUrl} style={{ borderRadius: 12, border: '1px solid var(--border)', maxHeight: 420, background: '#000' }} />
              ) : (
                <iframe width="100%" height="315" src={embedUrl} title="Interpreter introduction video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                  style={{ borderRadius: 12, border: 'none' }} />
              )}
            </Section>
          );
        }
        // No video at all - show placeholder with request button
        return (
          <div style={{
            background: '#111118', border: '1px dashed #1e2433',
            borderRadius: 12, padding: '40px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12, textAlign: 'center',
          }}>
            {/* Muted play icon */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.6 }}>
              <circle cx="20" cy="20" r="18" stroke="#96a0b8" strokeWidth="1.5" />
              <path d="M16 13l12 7-12 7V13z" stroke="#96a0b8" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <p style={{
              color: '#96a0b8', fontSize: '14px', margin: 0, lineHeight: 1.5,
            }}>
              This interpreter hasn&apos;t added an intro video yet.
            </p>
            {(userRole === 'deaf' || userRole === 'requester') && (
              videoAlreadyRequested ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    color: '#96a0b8', fontSize: '13.5px', fontWeight: 500,
                    opacity: 0.7,
                  }}>
                    Video requested
                  </span>
                  <span style={{ color: '#96a0b8', fontSize: '12px', opacity: 0.5 }}>
                    We&apos;ve let them know.
                  </span>
                </div>
              ) : (
                <button
                  onClick={onRequestVideo}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(0,229,255,0.5)',
                    color: '#00e5ff', fontSize: '13.5px',
                    borderRadius: 10, padding: '8px 16px',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    transition: 'all 0.15s',
                    marginTop: 4,
                  }}
                >
                  Request an intro video
                </button>
              )
            )}
          </div>
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
                color: '#a78bfa',
              }}>
                {a}
              </span>
            ))}
            {i.racialIdentity.map(r => (
              <span key={r} style={{
                padding: '6px 14px', borderRadius: 100, fontSize: '0.82rem',
                border: '1px solid rgba(123,97,255,0.35)', background: 'rgba(123,97,255,0.1)',
                color: '#a78bfa',
              }}>
                {r}
              </span>
            ))}
            {i.religiousAffiliation.map(r => (
              <span key={r} style={{
                padding: '6px 14px', borderRadius: 100, fontSize: '0.82rem',
                border: '1px solid rgba(123,97,255,0.35)', background: 'rgba(123,97,255,0.1)',
                color: '#a78bfa',
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '24px' }} className="specs-grid">
              {categories.map(([cat, subs]) => (
                <div key={cat} style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontFamily: "'DM Sans', sans-serif" }}>
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
              <style>{`.specs-grid { grid-template-columns: 1fr !important; } @media (min-width: 768px) { .specs-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
              {i.specializedSkills && i.specializedSkills.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a891ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontFamily: "'DM Sans', sans-serif" }}>
                    Specialized Skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {i.specializedSkills.map(s => (
                      <span key={s} style={{ padding: '6px 14px', background: 'rgba(123,97,255,0.08)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.82rem', color: '#f0f2f8' }}>
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

      {/* Mentorship - interpreter-only */}
      {userRole === 'interpreter' && (i.mentorshipOffering || i.mentorshipSeeking) && (
        <MentorshipSection interpreter={i} />
      )}
    </div>
  );
}

function MentorshipSection({ interpreter: i }: { interpreter: Interpreter }) {
  const paidLabel = i.mentorshipPaid === 'pro_bono' ? 'Pro bono'
    : i.mentorshipPaid === 'paid' ? 'Paid'
    : i.mentorshipPaid === 'either' ? 'Open to discussing'
    : null

  return (
    <Section title="Mentorship">
      {i.mentorshipOffering && (
        <div style={{ marginBottom: i.mentorshipSeeking ? 24 : 0 }}>
          <div style={{
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)',
            marginBottom: 10,
          }}>
            Offering mentorship
          </div>
          {((i.mentorshipTypesOffering && i.mentorshipTypesOffering.length > 0) || (i.mentorshipTypes && i.mentorshipTypes.length > 0)) && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginRight: 8 }}>Areas:</span>
              {(i.mentorshipTypesOffering && i.mentorshipTypesOffering.length > 0 ? i.mentorshipTypesOffering : i.mentorshipTypes || []).map(t => (
                <span
                  key={t}
                  style={{
                    display: 'inline-block', fontSize: '0.78rem', padding: '2px 10px',
                    borderRadius: 100, background: 'rgba(0,229,255,0.08)',
                    border: '1px solid rgba(0,229,255,0.2)', color: 'var(--accent)',
                    marginRight: 6, marginBottom: 4,
                  }}
                >
                  {getMentorshipLabel(t)}
                </span>
              ))}
            </div>
          )}
          {paidLabel && (
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 8 }}>
              Compensation: {paidLabel}
            </div>
          )}
          {i.mentorshipBioOffering && (
            <div style={{
              fontSize: '0.85rem', color: '#c8cdd8', lineHeight: 1.6,
              background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
              padding: '12px 16px', marginBottom: 10,
            }}>
              {i.mentorshipBioOffering}
            </div>
          )}
        </div>
      )}
      {i.mentorshipSeeking && (
        <div>
          <div style={{
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)',
            marginBottom: 10,
          }}>
            Seeking mentorship
          </div>
          {((i.mentorshipTypesSeeking && i.mentorshipTypesSeeking.length > 0) || (i.mentorshipTypes && i.mentorshipTypes.length > 0)) && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginRight: 8 }}>Looking for:</span>
              {(i.mentorshipTypesSeeking && i.mentorshipTypesSeeking.length > 0 ? i.mentorshipTypesSeeking : i.mentorshipTypes || []).map(t => (
                <span
                  key={t}
                  style={{
                    display: 'inline-block', fontSize: '0.78rem', padding: '2px 10px',
                    borderRadius: 100, background: 'rgba(0,229,255,0.08)',
                    border: '1px solid rgba(0,229,255,0.2)', color: 'var(--accent)',
                    marginRight: 6, marginBottom: 4,
                  }}
                >
                  {getMentorshipLabel(t)}
                </span>
              ))}
            </div>
          )}
          {i.mentorshipBioSeeking && (
            <div style={{
              fontSize: '0.85rem', color: '#c8cdd8', lineHeight: 1.6,
              background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
            }}>
              {i.mentorshipBioSeeking}
            </div>
          )}
        </div>
      )}
    </Section>
  )
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

    </div>
  );
}

function AvailabilityTab({ availability }: { availability?: AvailabilityRow[] }) {
  // Reorder: Mon(1) through Sun(0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]
  const statusColors: Record<string, string> = {
    available: '#00e5ff',
    by_request: '#f59e0b',
    not_available: 'var(--border)',
  }

  return (
    <Section title="Weekly Availability">
      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 16, fontStyle: 'italic' }}>
        Times shown in interpreter&apos;s local time zone.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {orderedDays.map((dow) => {
          const row = availability?.find(a => a.day_of_week === dow)
          const status = row?.status || 'not_available'
          const isAvail = status === 'available'
          const isByReq = status === 'by_request'
          const hasTime = row?.start_time && row?.end_time
          const dotColor = statusColors[status] || 'var(--border)'

          return (
            <div
              key={dow}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 16px',
                background: isAvail ? 'rgba(0,229,255,0.04)' : isByReq ? 'rgba(245,158,11,0.04)' : 'var(--surface2)',
                border: `1px solid ${isAvail ? 'rgba(0,229,255,0.2)' : isByReq ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
                borderRadius: '10px',
              }}
            >
              <span style={{
                width: 90, fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                fontSize: '0.85rem', color: status === 'not_available' ? 'var(--muted)' : 'var(--text)',
              }}>
                {DAYS_FULL[dow]}
              </span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
              {isAvail && hasTime ? (
                <span style={{ fontSize: '0.88rem', color: '#00e5ff' }}>
                  {formatTime12(row!.start_time)} - {formatTime12(row!.end_time)}
                </span>
              ) : isByReq ? (
                <span style={{ fontSize: '0.85rem', color: '#f59e0b' }}>
                  By request{hasTime ? ` · ${formatTime12(row!.start_time)} - ${formatTime12(row!.end_time)}` : ''}
                </span>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Not available</span>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
      <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
      <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>
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
