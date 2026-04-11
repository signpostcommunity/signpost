'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import LocationPicker from '@/components/shared/LocationPicker';
import { generateSlug } from '@/lib/slugUtils';
import { syncNameFields } from '@/lib/nameSync';

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

function Wordmark() {
  return (
    <div className="wordmark" style={{ fontSize: 22, marginBottom: 24 }}>
      sign<span>post</span>
    </div>
  );
}

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

/* ─── Main Signup Form ─── */

function InterpreterSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddRole = searchParams.get('addRole') === 'true';

  const [section, setSection] = useState(isAddRole ? 2 : 1);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);

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
        if (fullName) setName(fullName);
        if (user.email) setEmail(user.email);

        try {
          const res = await fetch('/api/profile-defaults');
          if (res.ok) {
            const defaults = await res.json();
            if (defaults.first_name) {
              const prefillName = [defaults.first_name, defaults.last_name].filter(Boolean).join(' ');
              if (prefillName && !fullName) setName(prefillName);
            }
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

  // Check if user is already authenticated (e.g. via Google OAuth redirect)
  useEffect(() => {
    if (isAddRole || userId) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          setExistingUserId(user.id);
          const fullName = user.user_metadata?.full_name;
          if (fullName && !name) setName(fullName);
          if (user.email && !email) setEmail(user.email);
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      }
    })();
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
  }

  /* ─── Section 1: Create Account ─── */

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || (!isAddRole && !password)) {
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
      let uid: string;

      if (isAddRole && existingUserId) {
        uid = existingUserId;
      } else if (existingUserId) {
        // Already authenticated via Google OAuth
        uid = existingUserId;
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError || !authData.user) {
          setError(authError?.message || 'Failed to create account');
          setLoading(false);
          return;
        }
        uid = authData.user.id;

        await supabase.from('user_profiles').insert({
          id: uid, role: 'interpreter', pending_roles: [],
        });
      }

      const firstNameRaw = name.split(' ')[0] || '';
      const lastNameRaw = name.split(' ').slice(1).join(' ') || '';
      const { normalizeProfileFields } = await import('@/lib/normalize');
      const norm = normalizeProfileFields({ first_name: firstNameRaw, last_name: lastNameRaw, city, state, country });
      const firstName = (norm.first_name as string) || firstNameRaw;
      const lastNameVal = (norm.last_name as string) || lastNameRaw;

      // Insert interpreter_profiles — DO NOT set id, let DB auto-generate
      const profileData = syncNameFields({
        user_id: uid,
        first_name: firstName,
        last_name: lastNameVal,
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
      const baseSlug = generateSlug(firstName, lastNameVal).slice(0, 50);
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

  /* ─── Layout Wrapper ─── */

  function SectionWrapper({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ padding: '36px 28px', minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="interpreter-signup-layout" style={{ maxWidth: 900, margin: '0 auto' }}>
          <SidebarNav currentSection={section} completedSections={completedSections} />
          <div style={{ flex: 1, maxWidth: 600 }}>
            <Wordmark />
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

  /* ─── Section 1: Account ─── */

  if (section === 1) {
    return (
      <SectionWrapper>
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
          <AuthInput label="Full Name" value={name} onChange={setName} placeholder="Your full name" required />
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
            {loading ? 'Creating account...' : 'Create Account'}
          </PrimaryButton>
        </form>

        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#96a0b8',
          textAlign: 'center', marginTop: 20,
        }}>
          Already have an account?{' '}
          <Link href="/interpreter/login" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </SectionWrapper>
    );
  }

  /* ─── Section 2: Education Cards ─── */

  if (section === 2) {
    return (
      <SectionWrapper>
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
          <OutlineButton onClick={() => { setSection(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Back
          </OutlineButton>
        </div>
      </SectionWrapper>
    );
  }

  /* ─── Stub Sections 3-8 ─── */

  const stubLabel = SECTION_LABELS[section - 1] || 'Section';

  return (
    <SectionWrapper>
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
        <OutlineButton onClick={() => { setSection(section - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
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
