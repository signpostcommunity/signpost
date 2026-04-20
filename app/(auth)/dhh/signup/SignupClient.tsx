'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import InlineVideoCapture from '@/components/ui/InlineVideoCapture';
import { generateSlug } from '@/lib/slugUtils';
import { syncNameFields } from '@/lib/nameSync';

/* ─── Progress Bar ─── */

function ProgressBar({ step }: { step: number }) {
  const dots = [1, 2, 3, 4];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
      {dots.map((d, i) => (
        <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: step >= d ? '#a78bfa' : 'rgba(255,255,255,0.08)',
              border: step >= d ? 'none' : '1px solid rgba(255,255,255,0.3)',
              transition: 'background 0.2s',
            }}
          />
          {i < dots.length - 1 && (
            <div style={{ width: 24, height: 1, background: step > d ? '#a78bfa' : 'rgba(255,255,255,0.15)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Form Card ─── */

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="dhh-signup-form-card">
      {children}
    </div>
  );
}

/* ─── Education Cards (Step 2) ─── */

interface EducationCard {
  title: string;
  teaser: string;
  body: React.ReactNode[];
}

const EDUCATION_CARDS: EducationCard[] = [
  {
    title: "Why doesn't signpost show interpreter rates publicly?",
    teaser: 'When rates are shown upfront, hearing requesters often just pick the cheapest...',
    body: [
      "When rates are shown upfront, hearing requesters often just pick the cheapest interpreter, without knowing if they have the skills you need. signpost is built to put your communication needs first, not price first.",
      "When someone requests an interpreter for you, your preferred interpreters are contacted first, and respond with their rates. The requester can then see and compare rates before choosing who to book. So signpost begins with interpreters you already trust, before showing rates.",
      "If you are booking an interpreter for yourself for a personal event, you can also see and compare your preferred interpreters' rates before you choose. signpost does not charge any booking fees for personal events. Every penny goes directly to your interpreter.",
    ],
  },
  {
    title: "Why doesn't signpost screen interpreters' skills?",
    teaser: 'Most agencies rely on one person to screen interpreters, and usually that person is hearing...',
    body: [
      "Most agencies rely on one person to screen interpreters, and usually that person is hearing. Many agencies don't screen at all.",
      "signpost does it differently. We put the screening in the hands of the Deaf community. Interpreter intro videos let you see interpreters with your own eyes and decide for yourself who is the best fit for you. You can also check their credentials, specializations, and verified certifications before adding anyone to your Preferred Interpreter List.",
      "Interpreters are not one-size-fits-all. Your top interpreter may not be a good fit for someone else. An open directory allows signpost to offer interpreters for the full spectrum of communication needs.",
      "After every request, you can rate your interpreter to help signpost track who should, and shouldn't, be in the Directory.",
    ],
  },
  {
    title: "Why aren't interpreter ratings public?",
    teaser: 'In the Deaf and interpreting world, everyone knows each other...',
    body: [
      "In the Deaf and interpreting world, everyone knows each other.",
      "Research on rating systems in small, close-knit communities shows a consistent pattern: when you know the person you are rating and you will see them again, most people give 5 stars even when the experience was not great.",
      "People who had a bad experience often stay silent rather than risk hurting the relationship. Public ratings can actually oppress the reviewers from sharing their honest opinions and makes the ratings unreliable.",
      "Honest feedback helps interpreters grow their skills and helps signpost serve you better. That's why your ratings are always confidential. Your ratings are never shared with interpreters and never shown on their profiles.",
      "signpost administrators receive your feedback anonymously and can use it to highlight great interpreters and remove interpreters who consistently get complaints or low ratings.",
      "If you want to share your ratings and pref lists with other Deaf community members you trust, you can do that privately through your Trusted Deaf Circle.",
    ],
  },
  {
    title: 'How is signpost cheaper than agencies?',
    teaser: "Agencies charge an hourly fee on top of the interpreter's rate. That fee can range from...",
    body: [
      <>Agencies charge an <em>hourly</em> fee on top of the interpreter&apos;s rate. That fee can range from about $20 to $80+ per hour. This can become very expensive for requesters.</>,
      'Instead, signpost charges a flat $15 booking fee for each interpreter confirmed on a booking. This covers the cost of building and running the platform: the booking system, encrypted messaging, notifications, and the interpreter directory. That is the only fee signpost collects, ever.',
      'Interpreters set their own rates and are paid directly by the requester. signpost does not add any fees on top of interpreter rates.',
      'signpost never charges any booking fees for Deaf, DeafBlind, and Hard of Hearing individuals (or their family/friends) when booking interpreters for personal events.',
    ],
  },
  {
    title: 'What is the Trusted Deaf Circle?',
    teaser: 'Share your Preferred Interpreter List and ratings with Deaf friends and colleagues...',
    body: [
      'Your Trusted Deaf Circle lets you share your Preferred Interpreter List and ratings with Deaf friends and colleagues, and see their lists. Get recommendations from people who know you and whose experiences you trust. Honest, private sharing between people you choose.',
    ],
  },
];

/* ─── Education Card Icons (Step 2) ─── */

const CARD_ICONS: Record<string, React.ReactNode> = {
  "Why doesn't signpost show interpreter rates publicly?": (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  "Why doesn't signpost screen interpreters' skills?": (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  "Why aren't interpreter ratings public?": (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  'How is signpost cheaper than agencies?': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  'What is the Trusted Deaf Circle?': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

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
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)')}
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
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {CARD_ICONS[card.title]}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: '#f0f2f8', marginBottom: open ? 0 : 4 }}>
              {card.title}
            </div>
            {!open && (
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: '#96a0b8',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {card.teaser}
              </div>
            )}
          </div>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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
                fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15, color: '#96a0b8',
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

/* ─── Shared Components ─── */

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{
      fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: 27,
      color: '#f0f2f8', letterSpacing: '-0.02em', margin: '0 0 8px',
    }}>
      {children}
    </h1>
  );
}

function StepSubtext({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
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
        width: '100%', padding: '14px 24px', background: '#7b61ff', color: '#fff',
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
        border: '1px solid rgba(123,97,255,0.3)', color: '#a78bfa',
        borderRadius: 10, fontFamily: "'Inter', sans-serif",
        fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}

function CyanOutlineButton({ children, onClick, confirmed, style: extraStyle }: {
  children: React.ReactNode; onClick?: () => void; confirmed?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={confirmed ? undefined : onClick}
      style={{
        padding: '10px 20px', background: confirmed ? 'rgba(0,229,255,0.08)' : 'transparent',
        border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff',
        borderRadius: 10, fontFamily: "'Inter', sans-serif",
        fontWeight: 600, fontSize: 13.5, cursor: confirmed ? 'default' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        ...extraStyle,
      }}
    >
      {confirmed && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
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
      <label htmlFor={id} style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#a78bfa', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>{label}</label>
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
        onFocus={(e) => (e.target.style.borderColor = 'rgba(167,139,250,0.5)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  );
}

/* ─── Signing Styles (7 items -> two-column checkboxes per design system) ─── */

const SIGNING_STYLES = [
  'ASL',
  'PSE/English word-order',
  'SEE (Signing Exact English)',
  'Tactile ASL',
  'ProTactile',
  'Black ASL',
  'Other',
];

function SigningStyleCheckboxes({ selected, onToggle }: { selected: string[]; onToggle: (s: string) => void }) {
  return (
    <div className="checkbox-grid-responsive" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '6px 16px',
    }}>
      {SIGNING_STYLES.map(item => (
        <label key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
          <div
            onClick={(e) => { e.preventDefault(); onToggle(item); }}
            style={{
              width: 16, height: 16, minWidth: 16,
              border: `1.5px solid ${selected.includes(item) ? '#a78bfa' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 3, marginTop: 1,
              background: selected.includes(item) ? 'rgba(167,139,250,0.15)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {selected.includes(item) && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l2.5 2.5L9 1" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#c8cdd8', lineHeight: 1.4 }}>
            {item}
          </span>
        </label>
      ))}
    </div>
  );
}

/* ─── Toggle Switch ─── */

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, position: 'relative',
          background: checked ? 'rgba(123,97,255,0.4)' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${checked ? 'rgba(123,97,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
          transition: 'all 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: checked ? '#a78bfa' : '#96a0b8',
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          transition: 'all 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#c8cdd8', lineHeight: 1.5 }}>
        {label}
      </span>
    </label>
  );
}

/* ─── Voice interpreting options ─── */

const VOICE_OPTIONS = [
  { value: 'interpreter', label: 'I always use the interpreter for voicing' },
  { value: 'self', label: 'I always voice for myself' },
  { value: 'depends', label: 'It depends on the situation' },
];

/* ─── Main Signup Form ─── */

function DeafSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddRole = searchParams.get('addRole') === 'true';

  // Step state: addRole skips step 1
  const [step, setStep] = useState(isAddRole ? 2 : 1);
  const [resuming, setResuming] = useState(!isAddRole);

  // Step 1: Account creation
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initFailed, setInitFailed] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 3: Communication preferences
  const [signingStyles, setSigningStyles] = useState<string[]>([]);
  const [otherSignLanguage, setOtherSignLanguage] = useState('');
  const [voicePref, setVoicePref] = useState('');
  const [diPreferred, setDiPreferred] = useState(false);
  const [commNotes, setCommNotes] = useState('');

  // Step 4: Introduce yourself
  const [writtenIntro, setWrittenIntro] = useState('');
  const [shareTextBefore, setShareTextBefore] = useState(true);
  const [profileVideoUrl, setProfileVideoUrl] = useState('');
  const [shareVideoBefore, setShareVideoBefore] = useState(true);
  const [autoSharePrefList, setAutoSharePrefList] = useState(true);

  // Step 5: Additional roles
  const [addedInterpreter, setAddedInterpreter] = useState(false);
  const [addedRequester, setAddedRequester] = useState(false);
  const [interpreterConfirmMsg, setInterpreterConfirmMsg] = useState('');
  const [requesterConfirmMsg, setRequesterConfirmMsg] = useState('');

  // Add-role initialization: fetch existing user and pre-fill
  useEffect(() => {
    if (!isAddRole) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/dhh/login';
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

        // Fetch shared profile data from existing roles
        let defaults: Record<string, string> = {};
        try {
          const res = await fetch('/api/profile-defaults');
          if (res.ok) {
            defaults = await res.json();
            if (defaults.first_name) setFirstName(defaults.first_name);
            if (defaults.last_name) setLastName(defaults.last_name);
          }
        } catch (prefillErr) {
          console.warn('Failed to fetch profile defaults:', prefillErr);
        }

        // Ensure deaf_profiles row exists so subsequent UPDATE steps work
        const { data: existingProfile } = await supabase
          .from('deaf_profiles')
          .select('id')
          .or(`id.eq.${user.id},user_id.eq.${user.id}`)
          .maybeSingle();

        if (!existingProfile) {
          const fn = defaults.first_name || '';
          const ln = defaults.last_name || '';
          const fullN = [fn, ln].filter(Boolean).join(' ');
          const { error: insertErr } = await supabase
            .from('deaf_profiles')
            .insert(syncNameFields({
              id: user.id,
              user_id: user.id,
              first_name: fn,
              last_name: ln,
              name: fullN,
              email: user.email || defaults.email || '',
              city: defaults.city || '',
              state: defaults.state || '',
              country: defaults.country || '',
              country_name: defaults.country_name || '',
              photo_url: defaults.photo_url || null,
            }));
          if (insertErr) {
            console.error('[addRole] Failed to create deaf profile:', insertErr);
            setError('We could not set up your new profile. Please try again or contact hello@signpost.community.');
            setInitFailed(true);
            return;
          } else {
            // Generate vanity slug
            const baseSlug = generateSlug(fn, ln).slice(0, 50);
            if (baseSlug && baseSlug.length >= 3) {
              let slug = baseSlug;
              let attempt = 1;
              while (attempt <= 20) {
                const { data: slugCheck } = await supabase
                  .from('deaf_profiles')
                  .select('vanity_slug')
                  .ilike('vanity_slug', slug)
                  .maybeSingle();
                if (!slugCheck) break;
                attempt++;
                slug = `${baseSlug}-${attempt}`;
              }
              await supabase
                .from('deaf_profiles')
                .update({ vanity_slug: slug })
                .eq('id', user.id);
            }
          }
        }
      } catch (e) {
        console.error('Add role init failed:', e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAddRole]);

  // Check if user is already authenticated - resume draft if possible
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
          .from('deaf_profiles')
          .select('id, user_id, draft_step, draft_data, first_name, last_name, email')
          .or(`id.eq.${user.id},user_id.eq.${user.id}`)
          .maybeSingle();

        if (profile) {
          // Restore basic fields from profile
          if (profile.first_name && !firstName) setFirstName(profile.first_name);
          if (profile.last_name && !lastName) setLastName(profile.last_name);
          if (profile.email && !email) setEmail(profile.email);

          // Restore draft_data fields
          const d = profile.draft_data as Record<string, unknown> | null;
          if (d) {
            if (d.firstName) setFirstName(d.firstName as string);
            if (d.lastName) setLastName(d.lastName as string);
            if (d.email) setEmail(d.email as string);
            if (Array.isArray(d.signingStyles)) setSigningStyles(d.signingStyles as string[]);
            if (d.otherSignLanguage) setOtherSignLanguage(d.otherSignLanguage as string);
            if (d.voicePref) setVoicePref(d.voicePref as string);
            if (typeof d.diPreferred === 'boolean') setDiPreferred(d.diPreferred);
            if (d.commNotes) setCommNotes(d.commNotes as string);
            if (d.writtenIntro) setWrittenIntro(d.writtenIntro as string);
            if (typeof d.shareTextBefore === 'boolean') setShareTextBefore(d.shareTextBefore);
            if (d.profileVideoUrl) setProfileVideoUrl(d.profileVideoUrl as string);
            if (typeof d.shareVideoBefore === 'boolean') setShareVideoBefore(d.shareVideoBefore);
            if (typeof d.autoSharePrefList === 'boolean') setAutoSharePrefList(d.autoSharePrefList);
          }

          // Jump to saved section
          const targetStep = profile.draft_step ?? 2;
          setStep(targetStep);
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

  // Auto-save draft data periodically
  useEffect(() => {
    const uid = userId || existingUserId;
    if (!uid) return;

    const interval = setInterval(() => {
      const supabase = createClient();
      const draftData = {
        firstName, lastName, email,
        signingStyles, otherSignLanguage, voicePref, diPreferred, commNotes,
        writtenIntro, shareTextBefore, profileVideoUrl, shareVideoBefore, autoSharePrefList,
      };
      supabase
        .from('deaf_profiles')
        .update({ draft_step: step, draft_data: draftData })
        .or(`id.eq.${uid},user_id.eq.${uid}`)
        .then(({ error }) => {
          if (error) console.warn('Auto-save draft failed:', error.message);
        });
    }, 5000);

    return () => clearInterval(interval);
  });

  function goToStep(s: number) {
    setError('');
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Persist draft progress to Supabase
    const uid = userId || existingUserId;
    if (uid) {
      const supabase = createClient();
      const draftData = {
        firstName, lastName, email,
        signingStyles, otherSignLanguage, voicePref, diPreferred, commNotes,
        writtenIntro, shareTextBefore, profileVideoUrl, shareVideoBefore, autoSharePrefList,
      };
      supabase
        .from('deaf_profiles')
        .update({ draft_step: s, draft_data: draftData })
        .or(`id.eq.${uid},user_id.eq.${uid}`)
        .then(({ error: draftErr }) => {
          if (draftErr) console.warn('Failed to save draft:', draftErr.message);
        });
    }
  }

  function toggleSigningStyle(style: string) {
    setSigningStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  }

  /* ─── Step 1: Create Account ─── */

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !email || (!isAddRole && !password)) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      let uid: string;

      if (isAddRole && existingUserId) {
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
          id: uid, role: 'deaf', pending_roles: [],
        });
      }

      const firstNameVal = firstName.trim();
      const lastNameVal = lastName.trim();
      const fullName = `${firstNameVal} ${lastNameVal}`.trim();
      const { normalizeProfileFields } = await import('@/lib/normalize');
      const norm = normalizeProfileFields({ first_name: firstNameVal, last_name: lastNameVal });
      const firstNorm = (norm.first_name as string) || firstNameVal;
      const lastNorm = (norm.last_name as string) || lastNameVal;

      await supabase.from('deaf_profiles').insert(syncNameFields({
        id: uid,
        user_id: uid,
        first_name: firstNorm,
        last_name: lastNorm,
        name: fullName,
        email,
      }));

      // Auto-generate vanity slug
      const baseSlug = generateSlug(firstNorm, lastNorm).slice(0, 50);
      if (baseSlug && baseSlug.length >= 3) {
        let slug = baseSlug;
        let attempt = 1;
        while (attempt <= 20) {
          const { data: existing } = await supabase
            .from('deaf_profiles')
            .select('vanity_slug')
            .ilike('vanity_slug', slug)
            .maybeSingle();
          if (!existing) break;
          attempt++;
          slug = `${baseSlug}-${attempt}`;
        }
        await supabase
          .from('deaf_profiles')
          .update({ vanity_slug: slug })
          .eq('id', uid);
      }

      // Clean up pending_roles if adding a role
      if (isAddRole) {
        try {
          const { data: upProfile } = await supabase
            .from('user_profiles')
            .select('pending_roles')
            .eq('id', uid)
            .single();
          if (upProfile?.pending_roles?.includes('deaf')) {
            const updated = (upProfile.pending_roles as string[]).filter((r: string) => r !== 'deaf');
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
      goToStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
      setLoading(false);
    }
  }

  /* ─── Step 3: Save Communication Preferences ─── */

  async function handleSaveCommPrefs() {
    const uid = userId || existingUserId;
    if (!uid) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const commPrefs = {
        signing_styles: signingStyles,
        signing_style: signingStyles.join(', '),
        other_sign_language: otherSignLanguage.trim() || undefined,
        voice_preference: voicePref,
        di_preferred: diPreferred,
        cdi_preferred: diPreferred,
        notes: commNotes.trim(),
      };

      const { error: commErr, data: commData } = await supabase
        .from('deaf_profiles')
        .update({ comm_prefs: commPrefs })
        .eq('user_id', uid)
        .select();

      if (commErr) {
        console.error('[addRole/dhh/step-2] update failed:', commErr.message, commErr.details);
        setError('Something went wrong saving your progress. Please try again.');
        setLoading(false);
        return;
      }
      if (!commData || commData.length === 0) {
        console.error('[addRole/dhh/step-2] update matched zero rows (profile row missing?)');
        setError('We lost track of your profile. Please refresh and try again.');
        setLoading(false);
        return;
      }

      setLoading(false);
      goToStep(3);
    } catch {
      setLoading(false);
      setError('Failed to save preferences. Please try again.');
    }
  }

  /* ─── Step 3: Save Intro ─── */

  async function handleSaveIntro() {
    const uid = userId || existingUserId;
    if (!uid) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const updates: Record<string, unknown> = {
        bio: writtenIntro.trim() || null,
        share_intro_text_before_confirm: shareTextBefore,
        profile_video_url: profileVideoUrl || null,
        share_intro_video_before_confirm: shareVideoBefore,
        auto_share_pref_list: autoSharePrefList,
        updated_at: new Date().toISOString(),
      };

      const { error: introErr, data: introData } = await supabase
        .from('deaf_profiles')
        .update(updates)
        .eq('user_id', uid)
        .select();

      if (introErr) {
        console.error('[addRole/dhh/step-3] update failed:', introErr.message, introErr.details);
        setError('Something went wrong saving your progress. Please try again.');
        setLoading(false);
        return;
      }
      if (!introData || introData.length === 0) {
        console.error('[addRole/dhh/step-3] update matched zero rows (profile row missing?)');
        setError('We lost track of your profile. Please refresh and try again.');
        setLoading(false);
        return;
      }

      setLoading(false);
      goToStep(4);
    } catch {
      setLoading(false);
      setError('Failed to save. Please try again.');
    }
  }

  /* ─── Step 5: Add Role ─── */

  async function handleAddRole(role: 'interpreter' | 'requester') {
    const uid = userId || existingUserId;
    if (!uid) return;

    try {
      const supabase = createClient();
      const { data: upProfile } = await supabase
        .from('user_profiles')
        .select('pending_roles')
        .eq('id', uid)
        .single();

      const current = (upProfile?.pending_roles as string[]) || [];
      if (!current.includes(role)) {
        await supabase
          .from('user_profiles')
          .update({ pending_roles: [...current, role] })
          .eq('id', uid);
      }

      if (role === 'interpreter') {
        setAddedInterpreter(true);
        setInterpreterConfirmMsg('Interpreter profile will be ready to complete from your portal.');
      } else {
        setAddedRequester(true);
        setRequesterConfirmMsg('Requester access will be ready to complete from your portal.');
      }
    } catch (err) {
      console.error('Failed to add role:', err);
    }
  }

  /* ─── Add-role finalize: validate, clean pending_roles, go to done ─── */

  async function handleAddRoleFinalize() {
    const uid = userId || existingUserId;
    if (!uid) return;

    // Validate required fields (DHH: first, last, email)
    const missing: string[] = [];
    if (!firstName?.trim()) missing.push('First name');
    if (!lastName?.trim()) missing.push('Last name');
    if (!email?.trim()) missing.push('Email');
    if (missing.length > 0) {
      setError(`Please complete the following: ${missing.join(', ')}.`);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Mark profile as up-to-date
    const { error: finalErr, data: finalData } = await supabase.from('deaf_profiles').update({
      updated_at: new Date().toISOString(),
    }).or(`id.eq.${uid},user_id.eq.${uid}`).select();

    if (finalErr) {
      console.error('[addRole/dhh/finalize] update failed:', finalErr.message, finalErr.details);
      setError('Something went wrong saving your progress. Please try again.');
      setLoading(false);
      return;
    }
    if (!finalData || finalData.length === 0) {
      console.error('[addRole/dhh/finalize] update matched zero rows (profile row missing?)');
      setError('We lost track of your profile. Please refresh and try again.');
      setLoading(false);
      return;
    }

    // Clean pending_roles on confirmed success
    try {
      const { data: upProfile } = await supabase
        .from('user_profiles')
        .select('pending_roles')
        .eq('id', uid)
        .single();
      if (upProfile?.pending_roles?.includes('deaf')) {
        const updated = (upProfile.pending_roles as string[]).filter((r: string) => r !== 'deaf');
        await supabase.from('user_profiles').update({ pending_roles: updated }).eq('id', uid);
      }
    } catch (e) {
      console.error('Failed to clean pending_roles:', e);
    }

    setLoading(false);
    goToStep(6);
  }

  /* ─── Resuming check ─── */

  if (resuming) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 'calc(100vh - 73px)',
        padding: '100px 24px 80px',
        position: 'relative' as const, zIndex: 1,
      }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8' }}>
          Checking for saved progress...
        </p>
      </div>
    );
  }

  const isAuthenticated = !!(userId || existingUserId);

  if (initFailed) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 'calc(100vh - 73px)',
        padding: '100px 24px 80px', position: 'relative' as const, zIndex: 1,
      }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: 27, color: '#f0f2f8', marginBottom: 12 }}>
            Something went wrong
          </h1>
          <div style={{
            background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)',
            borderRadius: 10, padding: '16px 20px', color: 'var(--accent3)', fontSize: 15, marginBottom: 20,
          }}>
            {error || 'We could not set up your new profile. Please try again or contact hello@signpost.community.'}
          </div>
          <PrimaryButton onClick={() => window.location.reload()}>Try again</PrimaryButton>
        </div>
      </div>
    );
  }

  /* ─── Render ─── */

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 'calc(100vh - 73px)',
        padding: '100px 24px 80px',
        position: 'relative' as const, zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 560, width: '100%' }}>

        {/* ════════ STEP 1: Create Account ════════ */}
        {step === 1 && (
          <>
            <ProgressBar step={1} />

            <StepHeading>{isAuthenticated ? 'Continue your signup' : 'Create your account'}</StepHeading>
            <FormCard>
            <div style={{ marginBottom: 20 }}>
              <GoogleSignInButton role="deaf" label="Continue with Google" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#96a0b8' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            </div>
            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{
                  background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)',
                  borderRadius: 10, padding: '12px 16px', color: 'var(--accent3)', fontSize: 14,
                }}>
                  {error}
                </div>
              )}
              <div className="dhh-signup-name-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AuthInput label="First Name" value={firstName} onChange={setFirstName} placeholder="First name" required />
                <AuthInput label="Last Name" value={lastName} onChange={setLastName} placeholder="Last name" required />
              </div>
              <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
              {!isAddRole && !isAuthenticated && (
                <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 8 characters" required />
              )}
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? 'Creating account...' : isAuthenticated ? 'Continue' : 'Create Account'}
              </PrimaryButton>
            </form>
            </FormCard>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15, color: '#96a0b8', marginTop: 16, textAlign: 'center' }}>
              Already have an account?{' '}
              <Link href="/dhh/login" style={{ color: '#a78bfa', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </>
        )}

        {/* ════════ STEP 2: Communication Preferences ════════ */}
        {step === 2 && (
          <>
            <ProgressBar step={2} />

            <StepHeading>Communication preferences</StepHeading>
            <StepSubtext>
              This information is shared with interpreters any time you are tagged in a request. It helps them ensure they are a good match, and show up ready to work.
            </StepSubtext>

            <FormCard>
            {/* Signing style */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', marginBottom: 10 }}>
                Signing style
              </label>
              <SigningStyleCheckboxes selected={signingStyles} onToggle={toggleSigningStyle} />
              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#c8cdd8', marginBottom: 6 }}>
                  I use a different signed language
                </label>
                <input
                  type="text"
                  value={otherSignLanguage}
                  onChange={(e) => setOtherSignLanguage(e.target.value)}
                  placeholder="e.g., BSL, LSF, Auslan"
                  style={{
                    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
                    fontFamily: "'Inter', sans-serif", outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(167,139,250,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            {/* Voice interpreting */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', marginBottom: 10 }}>
                Voice interpreting
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {VOICE_OPTIONS.map((opt) => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="voice-pref"
                      value={opt.value}
                      checked={voicePref === opt.value}
                      onChange={() => setVoicePref(opt.value)}
                      style={{ accentColor: '#a78bfa', flexShrink: 0 }}
                    />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#f0f2f8' }}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* DI preference toggle */}
            <div style={{ marginBottom: 24 }}>
              <Toggle
                checked={diPreferred}
                onChange={setDiPreferred}
                label="I prefer working with a Deaf Interpreter (DI)"
              />
            </div>

            {/* Communication notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', marginBottom: 6 }}>
                Communication notes
              </label>
              <textarea
                value={commNotes}
                onChange={(e) => setCommNotes(e.target.value)}
                placeholder="Any additional information you want interpreters to know about your communication preferences..."
                rows={4}
                style={{
                  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
                  fontFamily: "'Inter', sans-serif", outline: 'none', resize: 'vertical',
                  lineHeight: 1.6,
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(167,139,250,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            </FormCard>

            <div style={{ marginTop: 28 }}>
            <PrimaryButton onClick={handleSaveCommPrefs} disabled={loading}>
              {loading ? 'Saving...' : 'Continue'}
            </PrimaryButton>
            <div style={{ marginTop: 10 }}>
              <OutlineButton onClick={() => goToStep(1)}>Back</OutlineButton>
            </div>
            {error && (
              <div style={{
                background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)',
                borderRadius: 10, padding: '12px 16px', color: 'var(--accent3)', fontSize: 14, marginTop: 10,
              }}>
                {error}
              </div>
            )}
            </div>
          </>
        )}

        {/* ════════ STEP 3: Introduce Yourself ════════ */}
        {step === 3 && (
          <>
            <ProgressBar step={3} />

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <h1 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: 27,
                color: '#f0f2f8', letterSpacing: '-0.02em', margin: 0,
              }}>
                Introduce yourself
              </h1>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15, color: '#96a0b8' }}>
                (optional)
              </span>
            </div>
            <StepSubtext>
              Give a brief introduction, with whatever information you want. For example: where you grew up, if you went to a Deaf school or mainstream, etc. You can write, record a video, or both.
            </StepSubtext>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
              color: '#96a0b8', lineHeight: 1.65, margin: '-12px 0 24px',
            }}>
              If now is not the right time to record a video, you can add one later from your dashboard.
            </p>

            <FormCard>
            {/* WRITTEN section */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
                textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', marginBottom: 12,
              }}>
                WRITTEN
              </div>
              <textarea
                value={writtenIntro}
                onChange={(e) => setWrittenIntro(e.target.value)}
                placeholder="Tell interpreters a little about yourself..."
                rows={4}
                style={{
                  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
                  fontFamily: "'Inter', sans-serif", outline: 'none', resize: 'vertical',
                  lineHeight: 1.6, marginBottom: 12,
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(167,139,250,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              <Toggle
                checked={!shareTextBefore}
                onChange={(v) => setShareTextBefore(!v)}
                label="Wait until interpreters are confirmed to share"
              />
            </div>

            {/* VIDEO section */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
                textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', marginBottom: 12,
              }}>
                VIDEO
              </div>
              <InlineVideoCapture
                onVideoSaved={(url) => setProfileVideoUrl(url)}
                accentColor="#a78bfa"
                storageBucket="videos"
                storagePath={userId ? `deaf/${userId}/intro` : ''}
                userId={userId || undefined}
              />
              <div style={{ marginTop: 12 }}>
                <Toggle
                  checked={!shareVideoBefore}
                  onChange={(v) => setShareVideoBefore(!v)}
                  label="Wait until interpreters are confirmed to share"
                />
              </div>
            </div>

            {/* INTERPRETER LIST SHARING section */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
                textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', marginBottom: 8,
              }}>
                Interpreter list sharing
              </div>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
                color: '#96a0b8', lineHeight: 1.65, margin: '0 0 14px',
              }}>
                When someone requests an interpreter for you (through a booking form, your QR code, or your request link), should they automatically see your preferred interpreter list?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="auto-share"
                    checked={autoSharePrefList}
                    onChange={() => setAutoSharePrefList(true)}
                    style={{ accentColor: '#a78bfa', flexShrink: 0, marginTop: 3 }}
                  />
                  <div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#f0f2f8', fontWeight: 500 }}>
                      Yes, share automatically <span style={{ color: '#96a0b8', fontWeight: 400 }}>(recommended)</span>
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#96a0b8', lineHeight: 1.5, marginTop: 2 }}>
                      Requesters will immediately see interpreters you trust, leading to better matches.
                    </div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="auto-share"
                    checked={!autoSharePrefList}
                    onChange={() => setAutoSharePrefList(false)}
                    style={{ accentColor: '#a78bfa', flexShrink: 0, marginTop: 3 }}
                  />
                  <div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#f0f2f8', fontWeight: 500 }}>
                      Ask me first
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#96a0b8', lineHeight: 1.5, marginTop: 2 }}>
                      You will be notified each time and can approve or decline.
                    </div>
                  </div>
                </label>
              </div>
            </div>
            </FormCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
              <PrimaryButton onClick={handleSaveIntro} disabled={loading}>
                {loading ? 'Saving...' : 'Save and finish'}
              </PrimaryButton>
              <OutlineButton onClick={() => goToStep(4)}>
                Skip for now
              </OutlineButton>
              <OutlineButton onClick={() => goToStep(2)} style={{ marginTop: 0 }}>Back</OutlineButton>
            </div>
            {error && (
              <div style={{
                background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)',
                borderRadius: 10, padding: '12px 16px', color: 'var(--accent3)', fontSize: 14, marginTop: 10,
              }}>
                {error}
              </div>
            )}
          </>
        )}

        {/* ════════ STEP 4: How signpost works for you ════════ */}
        {step === 4 && (
          <>
            <ProgressBar step={4} />

            <StepHeading>How signpost works for you</StepHeading>
            <StepSubtext>These explain how signpost is different. Read what interests you.</StepSubtext>
            <FormCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {EDUCATION_CARDS.map((card, i) => (
                <ExpandableCard key={i} card={card} />
              ))}
            </div>
            </FormCard>
            <div style={{ marginTop: 28 }}>
              <PrimaryButton onClick={() => goToStep(5)}>
                Next
              </PrimaryButton>
              <div style={{ marginTop: 10 }}>
                <OutlineButton onClick={() => goToStep(3)}>Back</OutlineButton>
              </div>
            </div>
          </>
        )}

        {/* ════════ STEP 5: Additional Roles ════════ */}
        {step === 5 && (
          <>
            <StepHeading>Additional roles</StepHeading>
            <StepSubtext>You can hold multiple roles on signpost.</StepSubtext>

            <FormCard>
            {/* Section 1: Deaf Interpreter */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20,
                color: '#f0f2f8', letterSpacing: '-0.01em', margin: '0 0 10px',
              }}>
                Are you also a Deaf Interpreter?
              </h2>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
                color: '#c8cdd8', lineHeight: 1.65, margin: '0 0 14px',
              }}>
                If you are a Deaf Interpreter, you can create an interpreter profile to receive requests and be listed in the directory. Your name, location, and email will automatically be filled in. You can finish setting up your interpreter profile from your portal.
              </p>
              <CyanOutlineButton
                onClick={() => handleAddRole('interpreter')}
                confirmed={addedInterpreter}
              >
                {addedInterpreter ? 'Interpreter profile added' : 'Yes, add interpreter profile'}
              </CyanOutlineButton>
              {interpreterConfirmMsg && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#96a0b8', marginTop: 8 }}>
                  {interpreterConfirmMsg}
                </p>
              )}
            </div>

            {/* Section 2: Requester/Coordinator */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20,
                color: '#f0f2f8', letterSpacing: '-0.01em', margin: '0 0 10px',
              }}>
                Do you also coordinate interpreters for an organization?
              </h2>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
                color: '#c8cdd8', lineHeight: 1.65, margin: '0 0 14px',
              }}>
                If you coordinate interpreters for a workplace, school, medical office, or other organization, you can access the full requester portal. Your basic information will automatically be filled in. You can finish setting up your requester profile from your portal.
              </p>
              <CyanOutlineButton
                onClick={() => handleAddRole('requester')}
                confirmed={addedRequester}
              >
                {addedRequester ? 'Requester access added' : 'Yes, add requester access'}
              </CyanOutlineButton>
              {requesterConfirmMsg && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#96a0b8', marginTop: 8 }}>
                  {requesterConfirmMsg}
                </p>
              )}
            </div>

            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
              color: '#96a0b8', lineHeight: 1.6, marginBottom: 0,
            }}>
              You can always switch between your roles or add new ones from the role switcher in your portal.
            </p>
            </FormCard>

            <div style={{ marginTop: 28 }}>
            <PrimaryButton onClick={isAddRole ? handleAddRoleFinalize : () => goToStep(6)} disabled={loading}>
              {loading ? 'Finishing...' : 'Continue to finish'}
            </PrimaryButton>
            <div style={{ marginTop: 10 }}>
              <OutlineButton onClick={() => goToStep(4)}>Back</OutlineButton>
            </div>
            {error && (
              <div style={{
                background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)',
                borderRadius: 10, padding: '12px 16px', color: 'var(--accent3)', fontSize: 14, marginTop: 10,
              }}>
                {error}
              </div>
            )}
            </div>
          </>
        )}

        {/* ════════ STEP 6: Done ════════ */}
        {step === 6 && (
          <>

            {/* Checkmark */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'rgba(167,139,250,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: 27,
              color: '#f0f2f8', letterSpacing: '-0.02em', textAlign: 'center', margin: '0 0 8px',
            }}>
              {"You're all set!"}
            </h1>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
              color: '#96a0b8', textAlign: 'center', margin: '0 0 28px',
            }}>
              {"Your profile is ready. Here's what to do next:"}
            </p>

            {/* Action cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {/* Card 1: Browse directory */}
              <div style={{
                background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14,
              }}>
                <div style={{
                  width: 36, height: 36, minWidth: 36, borderRadius: 8,
                  background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: '#f0f2f8', marginBottom: 3 }}>
                    Browse the interpreter directory
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: '#96a0b8', lineHeight: 1.5 }}>
                    Watch intro videos, check credentials, and start building your Preferred Interpreter List.
                  </div>
                </div>
              </div>

              {/* Card 2: Dashboard */}
              <div style={{
                background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14,
              }}>
                <div style={{
                  width: 36, height: 36, minWidth: 36, borderRadius: 8,
                  background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: '#f0f2f8', marginBottom: 3 }}>
                    Go to your dashboard
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: '#96a0b8', lineHeight: 1.5 }}>
                    See your QR code, request link, and manage everything from one place.
                  </div>
                </div>
              </div>

              {/* Card 3: Share request link */}
              <div style={{
                background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14,
              }}>
                <div style={{
                  width: 36, height: 36, minWidth: 36, borderRadius: 8,
                  background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: '#f0f2f8', marginBottom: 3 }}>
                    Share your request link
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: '#96a0b8', lineHeight: 1.5 }}>
                    Give your QR code or link to anyone who books interpreters for you.
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href="/directory"
                style={{
                  display: 'block', width: '100%', padding: '14px 24px',
                  background: '#a78bfa', color: '#0a0a0f', borderRadius: 10,
                  fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14.5,
                  textAlign: 'center', textDecoration: 'none',
                }}
              >
                Browse interpreter directory
              </Link>
              <Link
                href="/dhh/dashboard"
                style={{
                  display: 'block', width: '100%', padding: '10px 20px',
                  background: 'transparent', border: '1px solid rgba(167,139,250,0.3)',
                  color: '#a78bfa', borderRadius: 10,
                  fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13.5,
                  textAlign: 'center', textDecoration: 'none',
                }}
              >
                Go to my dashboard
              </Link>
            </div>
          </>
        )}
      </div>

      {/* FormCard + Mobile responsive */}
      <style>{`
        .dhh-signup-form-card {
          background: #111118;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 32px;
        }
        @media (max-width: 640px) {
          .dhh-signup-form-card {
            padding: 20px;
          }
          .dhh-signup-name-grid {
            grid-template-columns: 1fr !important;
          }
          .checkbox-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .dhh-signup-container { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  );
}

export default function DeafSignupPage() {
  return (
    <Suspense fallback={null}>
      <DeafSignupForm />
    </Suspense>
  );
}
