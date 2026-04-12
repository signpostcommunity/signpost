'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import LocationPicker from '@/components/shared/LocationPicker';
import InlineVideoCapture from '@/components/ui/InlineVideoCapture';
import { generateSlug } from '@/lib/slugUtils';
import { syncNameFields } from '@/lib/nameSync';
import { resizeImage } from '@/lib/imageUtils';

/* ─── Section labels ─── */

const SECTION_LABELS = [
  'Account',
  'How It Works',
  'Professional',
  'Languages',
  'Credentials',
  'About You',
  'How People Find You',
  'Finish',
];

/* ─── Sidebar Nav ─── */

interface SidebarNavProps {
  currentSection: number;
  completedSections: number[];
}

function SidebarNav({ currentSection, completedSections }: SidebarNavProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="interpreter-sidebar-desktop">
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SECTION_LABELS.map((label, i) => {
            const num = i + 1;
            const isCurrent = num === currentSection;
            const isCompleted = completedSections.includes(num);
            const isFuture = !isCurrent && !isCompleted;

            return (
              <div
                key={num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderLeft: isCurrent ? '3px solid #00e5ff' : '3px solid transparent',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: isCurrent ? 600 : 500,
                  fontSize: 13.5,
                  color: isCurrent ? '#00e5ff' : '#96a0b8',
                  opacity: isFuture ? 0.5 : 1,
                }}
              >
                {isCompleted && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#96a0b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {label}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile dots */}
      <div className="interpreter-sidebar-mobile">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 24 }}>
          {SECTION_LABELS.map((_, i) => {
            const num = i + 1;
            const isCurrent = num === currentSection;
            const isCompleted = completedSections.includes(num);
            const isActive = isCurrent || isCompleted;

            return (
              <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isActive ? '#00e5ff' : 'transparent',
                    border: isActive ? 'none' : '1px solid rgba(255,255,255,0.15)',
                    transition: 'background 0.2s',
                  }}
                />
                {i < SECTION_LABELS.length - 1 && (
                  <div style={{ width: 20, height: 1, background: isCompleted ? '#00e5ff' : 'rgba(255,255,255,0.15)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .interpreter-sidebar-desktop { display: none; }
        .interpreter-sidebar-mobile { display: block; }
        @media (min-width: 768px) {
          .interpreter-sidebar-desktop {
            display: block;
            width: 220px;
            flex-shrink: 0;
          }
          .interpreter-sidebar-mobile { display: none; }
        }
      `}</style>
    </>
  );
}

/* ─── Education Cards (Section 2) ─── */

interface EducationCard {
  title: string;
  teaser: string;
  body: string[];
}

const EDUCATION_CARDS: EducationCard[] = [
  {
    title: 'How do clients find me?',
    teaser: "When a request is made, the Deaf person's preferred interpreters are contacted first...",
    body: [
      "When a request is made, the Deaf person's preferred interpreters are contacted first. If you are on someone's Preferred Interpreter List, you will see their requests before anyone else.",
      "Your profile appears in the signpost interpreter directory, where Deaf/DB/HH individuals and requesters can browse by location, specialization, language, and credentials. They can watch your intro video and read your bio before deciding to add you to their Preferred Interpreter List. Requesters can also find you through the directory and contact you directly.",
    ],
  },
  {
    title: 'How do rates and billing work?',
    teaser: 'You set your own rates and terms. You can create multiple rate profiles...',
    body: [
      'You set your own rates and terms. You can create multiple rate profiles for different types of work (standard, community/nonprofit, multi-day, or custom rates for specific clients).',
      'When you receive a request, you respond with your rate and availability. The requester sees your rate and decides whether to confirm. You invoice the client directly. signpost never touches your pay.',
      'Agencies charge an hourly fee on top of your rate. That fee can range from about $20 to $80+ per hour, but you may never know what the client actually paid. signpost charges a flat $15 booking fee to the requester. This covers the cost of building and running the platform: the booking system, encrypted messaging, notifications, and the interpreter directory. That is the only fee signpost collects.',
    ],
  },
  {
    title: 'Why are intro videos important?',
    teaser: 'Watching an intro video in ASL lets Deaf people get to know you naturally...',
    body: [
      'Watching an intro video in ASL lets Deaf people get to know you naturally. No written description can replace that. When we started developing signpost, intro videos were one of the most requested features.',
      'Your video does not need to be polished or scripted. Just introduce yourself: share a little about your background, what kind of work you do, whatever feels right.',
    ],
  },
  {
    title: 'How do ratings work?',
    teaser: 'Interpreters are not one size fits all. You might be an excellent interpreter...',
    body: [
      'Interpreters are not one size fits all. You might be an excellent interpreter and still not be the right match for a particular person\'s communication needs. The fear of a single bad job impacting your career is real.',
      'This is a big part of why public rating systems for interpreters have not worked well before. Research on rating systems in small, close-knit communities confirms what interpreters already know: a single bad rating in a small community can have a career-long impact. In small communities, ratings are typically all or nothing: people feel pressured to give 5-star reviews even when their experience was not great, or to not leave a review at all to avoid risking the relationship. This skews ratings and makes them essentially worthless.',
      'But there is still a real need for accountability in our field and for Deaf people to be able to share their experiences honestly. Confidential ratings allow Deaf people to give real feedback, without interpreters needing to live in fear.',
      'Ratings on signpost are private. They are not shared directly with interpreters and are never shown on public profiles. Instead, they are shared with signpost administrators anonymously and asynchronously, and reviewed over time. We look at patterns, not individual scores. One rating from a situation where the fit was not right will never determine your presence on signpost.',
      'If there is a consistent pattern of concern over time, you will receive outreach and resources from signpost. If your reviews are consistently positive over time, signpost may highlight your profile.',
    ],
  },
  {
    title: 'What is the mentorship directory?',
    teaser: 'In our field, we are never done learning...',
    body: [
      'In our field, we are never done learning. The signpost interpreter directory includes a mentorship filter, visible only to interpreters. Interpreters at any stage of their career can indicate they are seeking mentorship, offering mentorship, or both.',
      'If you mark yourself as seeking mentorship, signpost will suggest mentors on your dashboard based on your areas of interest, experience level, and location. Mentorship connections through signpost are between you and your mentor or mentee. signpost provides the connection, not the curriculum.',
      'You can set up mentorship preferences from your profile after signup.',
    ],
  },
  {
    title: 'How is this different from an agency?',
    teaser: 'Some interpreting jobs involve complex logistics...',
    body: [
      'Some interpreting jobs involve complex logistics: multi-day conferences, large teams, specialized coordination. A good agency can add real value in those situations, and that service is worth paying for when you receive it.',
      'But not every booking needs that level of coordination. For straightforward community work and direct-book work, the agency fee may not reflect the level of service actually required. signpost gives you an alternative for that work.',
      'On signpost, you own the relationship. You set your own rates. You communicate with clients directly. You invoice clients directly. Your full rate goes to you.',
      'signpost does not require exclusivity: you can use signpost alongside agency work, private clients, or any other arrangement. signpost is a tool to help you receive and manage your freelance work in whatever way works best for you.',
    ],
  },
];

function ExpandableCard({ card }: { card: EducationCard }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: '#111118',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: '#f0f2f8', marginBottom: open ? 0 : 4 }}>
            {card.title}
          </div>
          {!open && (
            <div style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 12.5, color: '#6b7082',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {card.teaser}
            </div>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 2, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <div style={{ padding: '0 18px 18px' }}>
          {card.body.map((paragraph, i) => (
            <p
              key={i}
              style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, color: '#96a0b8',
                lineHeight: 1.7, margin: 0, marginBottom: i < card.body.length - 1 ? 12 : 0,
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Shared UI ─── */

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20,
      color: '#f0f2f8', letterSpacing: '-0.01em', margin: '0 0 8px',
    }}>
      {children}
    </h1>
  );
}

function StepSubtext({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13,
      color: '#96a0b8', lineHeight: 1.65, margin: '0 0 24px',
    }}>
      {children}
    </p>
  );
}

function PrimaryButton({ children, onClick, disabled, type, style: extraStyle }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit';
  style?: React.CSSProperties;
}) {
  return (
    <button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '14px 24px', background: '#00e5ff', color: '#0a0a0f',
        border: 'none', borderRadius: 10, fontFamily: "'Inter', sans-serif",
        fontWeight: 600, fontSize: 14.5, cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.7 : 1, transition: 'opacity 0.15s',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, onClick, style: extraStyle }: {
  children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', padding: '10px 20px', background: 'transparent',
        border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff',
        borderRadius: 10, fontFamily: "'Inter', sans-serif",
        fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

function AuthInput({ label, type = 'text', value, onChange, placeholder, required = false }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#c8cdd8', marginBottom: '6px' }}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-required={required ? 'true' : undefined}
        style={{
          width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: '15px',
          fontFamily: "'Inter', sans-serif", outline: 'none',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  );
}

/* ─── Layout Wrapper ─── */

function SectionWrapper({ section, completedSections, children }: {
  section: number; completedSections: number[]; children: React.ReactNode;
}) {
  return (
    <div style={{ padding: '100px 28px 36px', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="interpreter-signup-layout" style={{ maxWidth: 900, margin: '0 auto' }}>
        <SidebarNav currentSection={section} completedSections={completedSections} />
        <div style={{ flex: 1, maxWidth: 600 }}>
          {children}
        </div>
      </div>
      <style>{`
        .interpreter-signup-layout {
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .interpreter-signup-layout {
            flex-direction: row;
            gap: 40px;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Main Signup Form ─── */

function InterpreterSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddRole = searchParams.get('addRole') === 'true';

  const [section, setSection] = useState(isAddRole ? 2 : 1);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [resuming, setResuming] = useState(!isAddRole);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);

  // Section 3: Professional
  const [interpreterType, setInterpreterType] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [genderIdentity, setGenderIdentity] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [phone, setPhone] = useState('');
  const [eventCoordination, setEventCoordination] = useState(false);

  // Section 4: Languages
  const [signLanguages, setSignLanguages] = useState<string[]>([]);
  const [otherSignLanguage, setOtherSignLanguage] = useState('');
  const [spokenLanguages, setSpokenLanguages] = useState<string[]>([]);
  const [otherSpokenLanguage, setOtherSpokenLanguage] = useState('');

  // Section 5: Credentials
  const [certifications, setCertifications] = useState<Array<{name: string; issuing_body: string; year: string}>>([]);
  const [education, setEducation] = useState<Array<{institution: string; degree: string; year: string}>>([]);

  // Section 6: About You
  const [bio, setBio] = useState('');
  const [bioSpecializations, setBioSpecializations] = useState('');
  const [bioExtra, setBioExtra] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Add-role initialization
  useEffect(() => {
    if (!isAddRole) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/interpreter/login';
          return;
        }
        setExistingUserId(user.id);
        setUserId(user.id);
        const fullName = user.user_metadata?.full_name;
        if (fullName) {
          const parts = fullName.trim().split(' ');
          setFirstName(parts.slice(0, -1).join(' ') || parts[0] || '');
          setLastName(parts.length > 1 ? parts[parts.length - 1] : '');
        }
        if (user.email) setEmail(user.email);

        try {
          const res = await fetch('/api/profile-defaults');
          if (res.ok) {
            const defaults = await res.json();
            if (defaults.first_name) setFirstName(defaults.first_name);
            if (defaults.last_name) setLastName(defaults.last_name);
            if (defaults.country) setCountry(defaults.country);
            if (defaults.state) setState(defaults.state);
            if (defaults.city) setCity(defaults.city);
          }
        } catch (prefillErr) {
          console.warn('Failed to fetch profile defaults:', prefillErr);
        }
      } catch (e) {
        console.error('Add role init failed:', e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddRole]);

  // Check if user is already authenticated — resume draft if possible
  useEffect(() => {
    if (isAddRole || userId) { setResuming(false); return; }
    const timeout = setTimeout(() => setResuming(false), 500);
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setResuming(false); clearTimeout(timeout); return; }

        setUserId(user.id);
        setExistingUserId(user.id);
        const fullName = user.user_metadata?.full_name;
        if (fullName && !firstName) {
          const parts = fullName.trim().split(' ');
          setFirstName(parts.slice(0, -1).join(' ') || parts[0] || '');
          setLastName(parts.length > 1 ? parts[parts.length - 1] : '');
        }
        if (user.email && !email) setEmail(user.email);

        // Check for existing profile to resume
        const { data: profile } = await supabase
          .from('interpreter_profiles')
          .select('id, draft_step, draft_data, first_name, last_name, email, country, state, city')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          setProfileId(profile.id);
          // Restore basic fields from profile
          if (profile.first_name && !firstName) setFirstName(profile.first_name);
          if (profile.last_name && !lastName) setLastName(profile.last_name);
          if (profile.email && !email) setEmail(profile.email);
          if (profile.country) setCountry(profile.country);
          if (profile.state) setState(profile.state);
          if (profile.city) setCity(profile.city);

          // Restore draft_data fields
          const d = profile.draft_data as Record<string, unknown> | null;
          if (d) {
            if (d.interpreterType) setInterpreterType(d.interpreterType as string);
            if (d.yearsExperience) setYearsExperience(d.yearsExperience as string);
            if (d.workMode) setWorkMode(d.workMode as string);
            if (d.genderIdentity) setGenderIdentity(d.genderIdentity as string);
            if (d.pronouns) setPronouns(d.pronouns as string);
            if (d.phone) setPhone(d.phone as string);
            if (typeof d.eventCoordination === 'boolean') setEventCoordination(d.eventCoordination);
            if (Array.isArray(d.signLanguages)) setSignLanguages(d.signLanguages as string[]);
            if (d.otherSignLanguage) setOtherSignLanguage(d.otherSignLanguage as string);
            if (Array.isArray(d.spokenLanguages)) setSpokenLanguages(d.spokenLanguages as string[]);
            if (d.otherSpokenLanguage) setOtherSpokenLanguage(d.otherSpokenLanguage as string);
            if (Array.isArray(d.certifications)) setCertifications(d.certifications as Array<{name: string; issuing_body: string; year: string}>);
            if (Array.isArray(d.education)) setEducation(d.education as Array<{institution: string; degree: string; year: string}>);
            if (d.bio) setBio(d.bio as string);
            if (d.bioSpecializations) setBioSpecializations(d.bioSpecializations as string);
            if (d.bioExtra) setBioExtra(d.bioExtra as string);
            if (d.videoUrl) setVideoUrl(d.videoUrl as string);
            if (d.photoUrl) setPhotoUrl(d.photoUrl as string);
          }

          // Jump to saved section
          const targetSection = profile.draft_step ?? 2;
          const completed = Array.from({ length: targetSection - 1 }, (_, i) => i + 1);
          setCompletedSections(completed);
          setSection(targetSection);
        }
      } catch (e) {
        console.error('Auth/resume check failed:', e);
      } finally {
        setResuming(false);
        clearTimeout(timeout);
      }
    })();
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToSection(s: number) {
    setError('');
    setCompletedSections(prev => {
      const current = section;
      return prev.includes(current) ? prev : [...prev, current];
    });
    setSection(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Persist draft progress to Supabase
    const uid = userId || existingUserId;
    if (uid) {
      const supabase = createClient();
      const draftData = {
        firstName, lastName, email, country, state, city,
        interpreterType, yearsExperience, workMode, genderIdentity, pronouns, phone, eventCoordination,
        signLanguages, otherSignLanguage, spokenLanguages, otherSpokenLanguage,
        certifications, education,
        bio, bioSpecializations, bioExtra, videoUrl, photoUrl,
      };
      supabase
        .from('interpreter_profiles')
        .update({ draft_step: s, draft_data: draftData })
        .eq('user_id', uid)
        .then(({ error: draftErr }) => {
          if (draftErr) console.warn('Failed to save draft:', draftErr.message);
        });
    }
  }

  /* ─── Section 1: Create Account ─── */

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !email || (!isAddRole && !password)) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!isAddRole && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      let uid: string = '';

      if (isAddRole && existingUserId) {
        uid = existingUserId;
      } else if (existingUserId) {
        // Already authenticated via Google OAuth
        uid = existingUserId;
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

        if (authError) {
          // If user already exists, try signing in instead
          if (authError.message.includes('already') || authError.message.includes('registered')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
              setError(signInError.message);
              setLoading(false);
              return;
            }
            if (signInData.user) {
              uid = signInData.user.id;
              setExistingUserId(uid);
            }
          } else {
            setError(authError.message);
            setLoading(false);
            return;
          }
        } else if (authData.user) {
          // Check if we actually got a session (not a fake obfuscation response)
          if (!authData.session) {
            // No session means user likely already exists. Try sign in.
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
              setError(signInError.message);
              setLoading(false);
              return;
            }
            if (signInData.user) {
              uid = signInData.user.id;
              setExistingUserId(uid);
            }
          } else {
            uid = authData.user.id;
            // Only insert user_profiles for genuinely new users
            const { error: upError } = await supabase.from('user_profiles').insert({
              id: uid, role: 'interpreter', pending_roles: [],
            });
            if (upError && !upError.message.includes('duplicate')) {
              console.warn('user_profiles insert warning:', upError.message);
            }
          }
        } else {
          setError('Failed to create account');
          setLoading(false);
          return;
        }
      }

      if (!uid) {
        setError('Failed to create account');
        setLoading(false);
        return;
      }

      // Check if profile already exists (resume flow)
      const { data: existingProfile } = await supabase
        .from('interpreter_profiles')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      if (existingProfile) {
        setProfileId(existingProfile.id);
        setUserId(uid);
        setLoading(false);
        goToSection(2);
        return;
      }

      const firstNameVal = firstName.trim();
      const lastNameVal = lastName.trim();
      const fullName = `${firstNameVal} ${lastNameVal}`.trim();
      const { normalizeProfileFields } = await import('@/lib/normalize');
      const norm = normalizeProfileFields({ first_name: firstNameVal, last_name: lastNameVal, city, state, country });
      const firstNorm = (norm.first_name as string) || firstNameVal;
      const lastNorm = (norm.last_name as string) || lastNameVal;

      // Insert interpreter_profiles — DO NOT set id, let DB auto-generate
      const profileData = syncNameFields({
        user_id: uid,
        first_name: firstNorm,
        last_name: lastNorm,
        name: fullName,
        email,
        country: (norm.country as string) || country,
        state: (norm.state as string) || state,
        city: (norm.city as string) || city,
      });

      const { data: insertedProfile, error: profileError } = await supabase
        .from('interpreter_profiles')
        .insert(profileData)
        .select('id')
        .single();

      if (profileError) {
        setError(profileError.message || 'Failed to create profile');
        setLoading(false);
        return;
      }

      setProfileId(insertedProfile.id);

      // Auto-generate vanity slug
      const baseSlug = generateSlug(firstNorm, lastNorm).slice(0, 50);
      if (baseSlug && baseSlug.length >= 3) {
        let slug = baseSlug;
        let attempt = 1;
        while (attempt <= 20) {
          const { data: existing } = await supabase
            .from('interpreter_profiles')
            .select('vanity_slug')
            .ilike('vanity_slug', slug)
            .maybeSingle();
          if (!existing) break;
          attempt++;
          slug = `${baseSlug}-${attempt}`;
        }
        await supabase
          .from('interpreter_profiles')
          .update({ vanity_slug: slug })
          .eq('user_id', uid);
      }

      // Clean up pending_roles if adding a role
      if (isAddRole) {
        try {
          const { data: upProfile } = await supabase
            .from('user_profiles')
            .select('pending_roles')
            .eq('id', uid)
            .single();
          if (upProfile?.pending_roles?.includes('interpreter')) {
            const updated = (upProfile.pending_roles as string[]).filter((r: string) => r !== 'interpreter');
            await supabase
              .from('user_profiles')
              .update({ pending_roles: updated })
              .eq('id', uid);
          }
        } catch (cleanupErr) {
          console.error('Failed to clean pending_roles:', cleanupErr);
        }
      }

      setUserId(uid);
      setLoading(false);
      goToSection(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
      setLoading(false);
    }
  }

  /* ─── Resuming check ─── */

  if (resuming) {
    return (
      <SectionWrapper section={1} completedSections={[]}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#96a0b8' }}>
          Checking for saved progress...
        </p>
      </SectionWrapper>
    );
  }

  const isAuthenticated = !!(userId || existingUserId);

  /* ─── Section 1: Account ─── */

  if (section === 1) {
    return (
      <SectionWrapper section={section} completedSections={completedSections}>
        <StepHeading>Create your account</StepHeading>
        <div style={{ marginBottom: 20 }}>
          <GoogleSignInButton role="interpreter" label="Continue with Google" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#96a0b8' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <AuthInput label="First Name" value={firstName} onChange={setFirstName} placeholder="First name" required />
            <AuthInput label="Last Name" value={lastName} onChange={setLastName} placeholder="Last name" required />
          </div>
          <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
          {!isAddRole && (
            <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" required />
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#c8cdd8', marginBottom: '6px' }}>Location</label>
            <LocationPicker
              country={country}
              state={state}
              city={city}
              onChange={(loc) => { setCountry(loc.country); setState(loc.state); setCity(loc.city); }}
              accentColor="#00e5ff"
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.2)',
              borderRadius: 10, padding: '12px 16px', color: '#ff6b85',
              fontFamily: "'Inter', sans-serif", fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <PrimaryButton type="submit" disabled={loading}>
            {loading ? (isAuthenticated ? 'Continuing...' : 'Creating account...') : (isAuthenticated ? 'Continue' : 'Create Account')}
          </PrimaryButton>
        </form>

        {!isAuthenticated && (
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#96a0b8',
            textAlign: 'center', marginTop: 20,
          }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={async () => {
                if (!email || !password) { setError('Enter your email and password to sign in.'); return; }
                setError(''); setLoading(true);
                try {
                  const supabase = createClient();
                  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                  if (signInError) { setError(signInError.message); setLoading(false); return; }
                  if (!signInData.user) { setError('Sign in failed.'); setLoading(false); return; }
                  const uid = signInData.user.id;
                  setUserId(uid); setExistingUserId(uid);
                  const { data: profile } = await supabase
                    .from('interpreter_profiles')
                    .select('id, draft_step, draft_data')
                    .eq('user_id', uid)
                    .maybeSingle();
                  if (profile) {
                    setProfileId(profile.id);
                    const d = profile.draft_data as Record<string, unknown> | null;
                    if (d) {
                      if (d.interpreterType) setInterpreterType(d.interpreterType as string);
                      if (d.yearsExperience) setYearsExperience(d.yearsExperience as string);
                      if (d.workMode) setWorkMode(d.workMode as string);
                      if (d.genderIdentity) setGenderIdentity(d.genderIdentity as string);
                      if (d.pronouns) setPronouns(d.pronouns as string);
                      if (d.phone) setPhone(d.phone as string);
                      if (typeof d.eventCoordination === 'boolean') setEventCoordination(d.eventCoordination);
                      if (Array.isArray(d.signLanguages)) setSignLanguages(d.signLanguages as string[]);
                      if (d.otherSignLanguage) setOtherSignLanguage(d.otherSignLanguage as string);
                      if (Array.isArray(d.spokenLanguages)) setSpokenLanguages(d.spokenLanguages as string[]);
                      if (d.otherSpokenLanguage) setOtherSpokenLanguage(d.otherSpokenLanguage as string);
                      if (Array.isArray(d.certifications)) setCertifications(d.certifications as Array<{name: string; issuing_body: string; year: string}>);
                      if (Array.isArray(d.education)) setEducation(d.education as Array<{institution: string; degree: string; year: string}>);
                      if (d.bio) setBio(d.bio as string);
                      if (d.bioSpecializations) setBioSpecializations(d.bioSpecializations as string);
                      if (d.bioExtra) setBioExtra(d.bioExtra as string);
                      if (d.videoUrl) setVideoUrl(d.videoUrl as string);
                      if (d.photoUrl) setPhotoUrl(d.photoUrl as string);
                    }
                    const targetSection = profile.draft_step ?? 2;
                    const completed = Array.from({ length: targetSection - 1 }, (_, i) => i + 1);
                    setCompletedSections(completed);
                    setSection(targetSection);
                  } else {
                    goToSection(2);
                  }
                  setLoading(false);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Sign in failed');
                  setLoading(false);
                }
              }}
              style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 13 }}
            >
              Sign in
            </button>
          </p>
        )}
      </SectionWrapper>
    );
  }

  /* ─── Section 2: Education Cards ─── */

  if (section === 2) {
    return (
      <SectionWrapper section={section} completedSections={completedSections}>
        <StepHeading>How signpost works for interpreters</StepHeading>
        <StepSubtext>These explain how signpost is different. Read what interests you.</StepSubtext>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {EDUCATION_CARDS.map((card, i) => (
            <ExpandableCard key={i} card={card} />
          ))}
        </div>

        <PrimaryButton onClick={() => goToSection(3)}>
          {"Got it, let's set up my profile"}
        </PrimaryButton>
        <div style={{ marginTop: 10 }}>
          <OutlineButton onClick={() => goToSection(1)}>
            Back
          </OutlineButton>
        </div>
      </SectionWrapper>
    );
  }

  /* ─── Section 3: Professional ─── */

  async function handleSaveProfessional() {
    if (!interpreterType) {
      setError('Please select your interpreter type.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('interpreter_profiles')
        .update({
          interpreter_type: interpreterType,
          years_experience: yearsExperience || null,
          work_mode: workMode || null,
          gender_identity: genderIdentity || null,
          pronouns: pronouns || null,
          phone: phone || null,
          event_coordination: eventCoordination,
        })
        .eq('user_id', userId);
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      goToSection(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setLoading(false);
    }
  }

  if (section === 3) {
    const interpreterTypes = [
      'Hearing Interpreter',
      'Deaf Interpreter',
      'Deaf-Parented Interpreter / CODA',
    ];
    const yearsOptions = [
      'Less than 1 year', '1-3 years', '3-5 years', '5-10 years',
      '10-15 years', '15-20 years', '20+ years',
    ];
    const workModes = [
      'In-person only', 'Remote only', 'Both in-person and remote',
    ];
    const genderOptions = [
      'Woman', 'Man', 'Non-binary', 'Prefer to self-describe', 'Prefer not to say',
    ];

    return (
      <SectionWrapper section={section} completedSections={completedSections}>
        <StepHeading>Professional background</StepHeading>
        <StepSubtext>Tell us about your interpreting practice.</StepSubtext>

        {/* Interpreter type */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c8cdd8', marginBottom: 8 }}>
            Interpreter type <span style={{ color: '#ff6b85' }}>*</span>
          </label>
          {interpreterTypes.map((t) => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="interpreterType"
                value={t}
                checked={interpreterType === t}
                onChange={() => setInterpreterType(t)}
                style={{ accentColor: '#00e5ff', width: 16, height: 16 }}
              />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#c8cdd8' }}>{t}</span>
            </label>
          ))}
        </div>

        {/* Years of experience */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c8cdd8', marginBottom: 6 }}>
            Years of experience
          </label>
          <select
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            style={{
              width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
              fontFamily: "'Inter', sans-serif", outline: 'none', appearance: 'none',
            }}
          >
            <option value="">Select...</option>
            {yearsOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Mode of work */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c8cdd8', marginBottom: 8 }}>
            Mode of work
          </label>
          {workModes.map((m) => (
            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="workMode"
                value={m}
                checked={workMode === m}
                onChange={() => setWorkMode(m)}
                style={{ accentColor: '#00e5ff', width: 16, height: 16 }}
              />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#c8cdd8' }}>{m}</span>
            </label>
          ))}
        </div>

        {/* Gender identity */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c8cdd8', marginBottom: 6 }}>
            Gender identity
          </label>
          <select
            value={genderIdentity}
            onChange={(e) => setGenderIdentity(e.target.value)}
            style={{
              width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
              fontFamily: "'Inter', sans-serif", outline: 'none', appearance: 'none',
            }}
          >
            <option value="">Select...</option>
            {genderOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#96a0b8', marginTop: 6, lineHeight: 1.5 }}>
            Used by requesters to find interpreters for settings where gender match matters, such as medical appointments.
          </p>
        </div>

        {/* Pronouns */}
        <AuthInput label="Pronouns" value={pronouns} onChange={setPronouns} placeholder="e.g. she/her, he/him, they/them" />

        {/* Phone */}
        <div style={{ marginTop: 16 }}>
          <AuthInput label="Phone" value={phone} onChange={setPhone} placeholder="Phone number" />
        </div>

        {/* Event coordination */}
        <div style={{ marginTop: 20 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={eventCoordination}
              onChange={(e) => setEventCoordination(e.target.checked)}
              style={{ accentColor: '#00e5ff', width: 16, height: 16, marginTop: 2 }}
            />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#c8cdd8' }}>
              I also coordinate interpreters for events or organizations
            </span>
          </label>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#96a0b8', marginTop: 6, marginLeft: 26, lineHeight: 1.5 }}>
            You can set this up later from your profile if you prefer.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.2)',
            borderRadius: 10, padding: '12px 16px', color: '#ff6b85',
            fontFamily: "'Inter', sans-serif", fontSize: 13, marginTop: 20,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <PrimaryButton onClick={handleSaveProfessional} disabled={loading}>
            {loading ? 'Saving...' : 'Continue'}
          </PrimaryButton>
          <div style={{ marginTop: 10 }}>
            <OutlineButton onClick={() => goToSection(2)}>Back</OutlineButton>
          </div>
        </div>
      </SectionWrapper>
    );
  }

  /* ─── Section 4: Languages ─── */

  const SIGN_LANGUAGE_OPTIONS = [
    'American Sign Language (ASL)',
    'Signed English / SEE',
    'International Sign (IS)',
    'Tactile ASL',
    'ProTactile ASL (PTASL / DeafBlind)',
    'Langue des Signes Fran\u00e7aise (LSF)',
    'Langue des Signes Qu\u00e9b\u00e9coise (LSQ)',
    'British Sign Language (BSL)',
    'Mexican Sign Language (LSM)',
    'Other',
  ];

  const SPOKEN_LANGUAGE_OPTIONS = [
    'English',
    'Spanish (Espa\u00f1ol)',
    'French (Fran\u00e7ais)',
    'Portuguese (Portugu\u00eas)',
    'Mandarin',
    'Cantonese',
    'Korean',
    'Japanese',
    'Vietnamese',
    'Arabic',
    'Russian',
    'Other',
  ];

  function toggleInList(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  async function handleSaveLanguages() {
    setError('');
    setLoading(true);
    try {
      const finalSign = [...signLanguages.filter((l) => l !== 'Other')];
      if (signLanguages.includes('Other') && otherSignLanguage.trim()) {
        finalSign.push(otherSignLanguage.trim());
      }
      const finalSpoken = [...spokenLanguages.filter((l) => l !== 'Other')];
      if (spokenLanguages.includes('Other') && otherSpokenLanguage.trim()) {
        finalSpoken.push(otherSpokenLanguage.trim());
      }

      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('interpreter_profiles')
        .update({
          sign_languages: finalSign,
          spoken_languages: finalSpoken,
        })
        .eq('user_id', userId);
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      goToSection(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setLoading(false);
    }
  }

  if (section === 4) {
    const pillStyle = (selected: boolean): React.CSSProperties => ({
      display: 'inline-block',
      padding: '8px 16px',
      borderRadius: 10,
      border: selected ? '1px solid #00e5ff' : '1px solid var(--border)',
      background: selected ? 'rgba(0,229,255,0.08)' : 'transparent',
      color: selected ? '#00e5ff' : '#c8cdd8',
      fontFamily: "'Inter', sans-serif",
      fontSize: 13.5,
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s',
      marginRight: 8,
      marginBottom: 8,
    });

    return (
      <SectionWrapper section={section} completedSections={completedSections}>
        <StepHeading>Languages</StepHeading>
        <StepSubtext>Select all languages you work with.</StepSubtext>

        {/* Sign languages */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c8cdd8', marginBottom: 10 }}>
            Sign languages
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {SIGN_LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleInList(signLanguages, lang, setSignLanguages)}
                style={pillStyle(signLanguages.includes(lang))}
              >
                {lang}
              </button>
            ))}
          </div>
          {signLanguages.includes('Other') && (
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                value={otherSignLanguage}
                onChange={(e) => setOtherSignLanguage(e.target.value)}
                placeholder="Specify other sign language(s)"
                style={{
                  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
                  fontFamily: "'Inter', sans-serif", outline: 'none',
                }}
              />
            </div>
          )}
        </div>

        {/* Spoken languages */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c8cdd8', marginBottom: 10 }}>
            Spoken languages
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {SPOKEN_LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleInList(spokenLanguages, lang, setSpokenLanguages)}
                style={pillStyle(spokenLanguages.includes(lang))}
              >
                {lang}
              </button>
            ))}
          </div>
          {spokenLanguages.includes('Other') && (
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                value={otherSpokenLanguage}
                onChange={(e) => setOtherSpokenLanguage(e.target.value)}
                placeholder="Specify other spoken language(s)"
                style={{
                  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
                  fontFamily: "'Inter', sans-serif", outline: 'none',
                }}
              />
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.2)',
            borderRadius: 10, padding: '12px 16px', color: '#ff6b85',
            fontFamily: "'Inter', sans-serif", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <PrimaryButton onClick={handleSaveLanguages} disabled={loading}>
            {loading ? 'Saving...' : 'Continue'}
          </PrimaryButton>
          <div style={{ marginTop: 10 }}>
            <OutlineButton onClick={() => goToSection(3)}>Back</OutlineButton>
          </div>
        </div>
      </SectionWrapper>
    );
  }

  /* ─── Section 5: Credentials ─── */

  async function handleSaveCredentials() {
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();

      // Delete existing rows and re-insert
      await supabase.from('interpreter_certifications').delete().eq('interpreter_id', profileId);
      await supabase.from('interpreter_education').delete().eq('interpreter_id', profileId);

      const validCerts = certifications.filter((c) => c.name.trim());
      if (validCerts.length > 0) {
        const { error: certError } = await supabase
          .from('interpreter_certifications')
          .insert(validCerts.map((c) => ({
            interpreter_id: profileId,
            name: c.name.trim(),
            issuing_body: c.issuing_body.trim() || null,
            year: c.year.trim() || null,
          })));
        if (certError) {
          setError(certError.message);
          setLoading(false);
          return;
        }
      }

      const validEdu = education.filter((e) => e.institution.trim());
      if (validEdu.length > 0) {
        const { error: eduError } = await supabase
          .from('interpreter_education')
          .insert(validEdu.map((e) => ({
            interpreter_id: profileId,
            institution: e.institution.trim(),
            degree: e.degree.trim() || null,
            year: e.year.trim() || null,
          })));
        if (eduError) {
          setError(eduError.message);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      goToSection(6);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setLoading(false);
    }
  }

  if (section === 5) {
    const l4Style: React.CSSProperties = {
      fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
      textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00e5ff',
      marginBottom: 12,
    };

    const rowInputStyle: React.CSSProperties = {
      flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
      fontFamily: "'Inter', sans-serif", outline: 'none', minWidth: 0,
    };

    return (
      <SectionWrapper section={section} completedSections={completedSections}>
        <StepHeading>Credentials</StepHeading>
        <StepSubtext>Add your certifications and education. All fields are optional.</StepSubtext>

        {/* Certifications */}
        <div style={l4Style}>Certifications</div>
        {certifications.map((cert, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
            <input
              type="text"
              value={cert.name}
              onChange={(e) => {
                const updated = [...certifications];
                updated[i] = { ...cert, name: e.target.value };
                setCertifications(updated);
              }}
              placeholder="e.g. NIC Advanced"
              style={rowInputStyle}
            />
            <input
              type="text"
              value={cert.issuing_body}
              onChange={(e) => {
                const updated = [...certifications];
                updated[i] = { ...cert, issuing_body: e.target.value };
                setCertifications(updated);
              }}
              placeholder="e.g. RID"
              style={{ ...rowInputStyle, maxWidth: 140 }}
            />
            <input
              type="text"
              value={cert.year}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                const updated = [...certifications];
                updated[i] = { ...cert, year: v };
                setCertifications(updated);
              }}
              placeholder="Year"
              style={{ ...rowInputStyle, maxWidth: 80 }}
            />
            <button
              type="button"
              onClick={() => setCertifications(certifications.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', color: '#96a0b8', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
              aria-label="Remove certification"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setCertifications([...certifications, { name: '', issuing_body: '', year: '' }])}
          style={{
            background: 'transparent', border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff',
            borderRadius: 10, padding: '6px 14px', fontFamily: "'Inter', sans-serif",
            fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 28,
          }}
        >
          Add certification
        </button>

        {/* Education */}
        <div style={{ ...l4Style, marginTop: 28 }}>Education</div>
        {education.map((edu, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
            <input
              type="text"
              value={edu.institution}
              onChange={(e) => {
                const updated = [...education];
                updated[i] = { ...edu, institution: e.target.value };
                setEducation(updated);
              }}
              placeholder="e.g. Western Oregon University"
              style={rowInputStyle}
            />
            <input
              type="text"
              value={edu.degree}
              onChange={(e) => {
                const updated = [...education];
                updated[i] = { ...edu, degree: e.target.value };
                setEducation(updated);
              }}
              placeholder="e.g. B.A. Interpreting Studies"
              style={rowInputStyle}
            />
            <input
              type="text"
              value={edu.year}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                const updated = [...education];
                updated[i] = { ...edu, year: v };
                setEducation(updated);
              }}
              placeholder="Year"
              style={{ ...rowInputStyle, maxWidth: 80 }}
            />
            <button
              type="button"
              onClick={() => setEducation(education.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', color: '#96a0b8', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
              aria-label="Remove education"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setEducation([...education, { institution: '', degree: '', year: '' }])}
          style={{
            background: 'transparent', border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff',
            borderRadius: 10, padding: '6px 14px', fontFamily: "'Inter', sans-serif",
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Add education
        </button>

        {error && (
          <div style={{
            background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.2)',
            borderRadius: 10, padding: '12px 16px', color: '#ff6b85',
            fontFamily: "'Inter', sans-serif", fontSize: 13, marginTop: 20,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <PrimaryButton onClick={handleSaveCredentials} disabled={loading}>
            {loading ? 'Saving...' : 'Continue'}
          </PrimaryButton>
          <div style={{ marginTop: 10 }}>
            <OutlineButton onClick={() => goToSection(4)}>Back</OutlineButton>
          </div>
        </div>
      </SectionWrapper>
    );
  }

  /* ─── Section 6: About You ─── */

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setPhotoUploading(true);
    setError('');

    try {
      let uploadFile: File = file;

      // Resize to max 400x400
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });

      const maxDim = 400;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
      });
      uploadFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

      // If still too large, use the resizeImage helper
      if (uploadFile.size > 2 * 1024 * 1024) {
        uploadFile = await resizeImage(uploadFile, 2);
      }

      const supabase = createClient();
      const path = `${userId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, uploadFile, { upsert: true });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        setPhotoUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from('interpreter_profiles')
        .update({ photo_url: publicUrl })
        .eq('user_id', userId);

      if (dbError) {
        setError(dbError.message);
        setPhotoUploading(false);
        return;
      }

      setPhotoUrl(publicUrl);
      setPhotoUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPhotoUploading(false);
    }
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  async function handleSaveAboutYou() {
    if (bio && bio.length < 20) {
      setError('Bio must be at least 20 characters.');
      return;
    }
    if (bioSpecializations && bioSpecializations.length < 20) {
      setError('Specialization description must be at least 20 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const updateData: Record<string, string | null> = {
        bio: bio || null,
        bio_specializations: bioSpecializations || null,
        bio_extra: bioExtra || null,
      };
      if (videoUrl) {
        updateData.video_url = videoUrl;
      }
      const { error: updateError } = await supabase
        .from('interpreter_profiles')
        .update(updateData)
        .eq('user_id', userId);
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      goToSection(7);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setLoading(false);
    }
  }

  if (section === 6) {
    const l4Style: React.CSSProperties = {
      fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
      textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00e5ff',
      marginBottom: 12,
    };

    return (
      <SectionWrapper section={section} completedSections={completedSections}>
        <StepHeading>About you</StepHeading>
        <StepSubtext>Help people get to know you.</StepSubtext>

        {/* Profile photo */}
        <div style={l4Style}>Profile Photo</div>
        <div style={{ marginBottom: 28 }}>
          {photoUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                border: '2px solid var(--border)',
              }}>
                <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  style={{
                    background: 'transparent', border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff',
                    borderRadius: 10, padding: '6px 14px', fontFamily: "'Inter', sans-serif",
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Change photo
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)', color: '#96a0b8',
                    borderRadius: 10, padding: '6px 14px', fontFamily: "'Inter', sans-serif",
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => photoInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border)', borderRadius: 10, padding: '28px 20px',
                textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#96a0b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#96a0b8', margin: 0 }}>
                {photoUploading ? 'Uploading...' : 'Click to upload a photo'}
              </p>
            </div>
          )}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Bio */}
        <div style={{ ...l4Style, marginTop: 28 }}>Bio</div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c8cdd8', marginBottom: 6 }}>
            Describe your interpreting and community background
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            placeholder="Share a few sentences about your interpreting background, how you got started, and the communities you serve."
            style={{
              width: '100%', minHeight: 100, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
              fontFamily: "'Inter', sans-serif", outline: 'none', resize: 'vertical', lineHeight: 1.6,
            }}
          />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#96a0b8', marginTop: 4, textAlign: 'right' }}>
            {bio.length} / 500
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c8cdd8', marginBottom: 6 }}>
            What settings or populations do you specialize in serving, and what draws you to that work?
          </label>
          <textarea
            value={bioSpecializations}
            onChange={(e) => setBioSpecializations(e.target.value.slice(0, 500))}
            placeholder="Describe the settings you specialize in and what draws you to that work."
            style={{
              width: '100%', minHeight: 80, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
              fontFamily: "'Inter', sans-serif", outline: 'none', resize: 'vertical', lineHeight: 1.6,
            }}
          />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#96a0b8', marginTop: 4, textAlign: 'right' }}>
            {bioSpecializations.length} / 500
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c8cdd8', marginBottom: 6 }}>
            Something about my background or approach that doesn't fit neatly into a checkbox:
          </label>
          <textarea
            value={bioExtra}
            onChange={(e) => setBioExtra(e.target.value.slice(0, 300))}
            placeholder="Optional"
            style={{
              width: '100%', minHeight: 70, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
              fontFamily: "'Inter', sans-serif", outline: 'none', resize: 'vertical', lineHeight: 1.6,
            }}
          />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#96a0b8', marginTop: 4, textAlign: 'right' }}>
            {bioExtra.length} / 300
          </p>
        </div>

        {/* Intro video */}
        <div style={{ ...l4Style, marginTop: 28 }}>Intro Video</div>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13.5,
          color: '#c8cdd8', lineHeight: 1.65, marginBottom: 16,
        }}>
          Watching an intro video in ASL lets Deaf people get to know you naturally. No written description can replace that. When we started developing signpost, intro videos were one of the most requested features.
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13.5,
          color: '#c8cdd8', lineHeight: 1.65, marginBottom: 16,
        }}>
          Your video does not need to be polished or scripted. Just introduce yourself: share a little about your background, what kind of work you do, whatever feels right.
        </p>

        <InlineVideoCapture
          onVideoSaved={(url) => setVideoUrl(url)}
          accentColor="#00e5ff"
          storageBucket="videos"
          storagePath={userId ? `interpreters/${userId}/intro` : ''}
          userId={userId || undefined}
        />

        {error && (
          <div style={{
            background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.2)',
            borderRadius: 10, padding: '12px 16px', color: '#ff6b85',
            fontFamily: "'Inter', sans-serif", fontSize: 13, marginTop: 20,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <PrimaryButton onClick={handleSaveAboutYou} disabled={loading}>
            {loading ? 'Saving...' : 'Continue'}
          </PrimaryButton>
          <div style={{ marginTop: 10 }}>
            <OutlineButton onClick={() => goToSection(5)}>Back</OutlineButton>
          </div>
        </div>
      </SectionWrapper>
    );
  }

  /* ─── Stub Sections 7-8 ─── */

  const stubLabel = SECTION_LABELS[section - 1] || 'Section';

  return (
    <SectionWrapper section={section} completedSections={completedSections}>
      <StepHeading>{stubLabel}</StepHeading>
      <p style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14,
        color: '#96a0b8', lineHeight: 1.6, marginBottom: 28,
      }}>
        This section is coming soon.
      </p>

      {section < 8 && (
        <PrimaryButton onClick={() => goToSection(section + 1)}>
          Continue
        </PrimaryButton>
      )}
      {section === 8 && (
        <PrimaryButton onClick={() => router.push('/interpreter/dashboard')}>
          Go to Dashboard
        </PrimaryButton>
      )}
      <div style={{ marginTop: 10 }}>
        <OutlineButton onClick={() => goToSection(section - 1)}>
          Back
        </OutlineButton>
      </div>
    </SectionWrapper>
  );
}

/* ─── Export ─── */

export default function SignupClient() {
  return (
    <Suspense fallback={null}>
      <InterpreterSignupForm />
    </Suspense>
  );
}
