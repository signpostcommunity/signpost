'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import LocationInput from '@/components/ui/LocationInput';
import type { LocationFields } from '@/components/ui/LocationInput';
import { getCountryName } from '@/lib/countries';
import InlineVideoCapture from '@/components/ui/InlineVideoCapture';
import { generateSlug } from '@/lib/slugUtils';
import { syncNameFields } from '@/lib/nameSync';
import { resizeImage } from '@/lib/imageUtils';
import { SPECIALIZATION_CATEGORIES, SPECIALIZED_SKILLS } from '@/lib/constants/specializations';
import PhoneInput from '@/components/ui/PhoneInput';
import { normalizePhone } from '@/lib/phone';

/* ─── Community & identity constants ─── */

const BIPOC_OPTIONS = [
  'Black/African American', 'Asian/Pacific Islander',
  'Hispanic/Latino(a)', 'Indigenous/Native American',
  'Middle Eastern/North African', 'Multiracial',
];

const RELIGIOUS_OPTIONS = [
  'Buddhist', 'Christian', 'Hindu', 'Jewish', 'Muslim', 'Sikh', 'Other',
];

/* ─── Community Toggle (reused by Section 7) ─── */

function CommunityToggle({ label, helper, checked, onChange }: { label: string; helper?: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
      padding: '10px 0', marginBottom: 8, background: 'none', border: 'none',
      cursor: 'pointer', fontFamily: "'Inter', sans-serif", textAlign: 'left',
    }}>
      <div style={{
        width: 40, height: 20, borderRadius: 100, flexShrink: 0,
        background: checked ? '#00e5ff' : '#16161f',
        border: checked ? 'none' : '1px solid #1e2433',
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: checked ? '#000' : '#96a0b8',
          position: 'absolute', top: 2,
          left: checked ? 22 : 2, transition: 'left 0.2s',
        }} />
      </div>
      <div>
        <span style={{
          fontSize: 15,
          color: checked ? '#00e5ff' : '#96a0b8',
          fontWeight: checked ? 600 : 400,
          display: 'block',
        }}>{label}</span>
        {helper && <span style={{ fontSize: 13, color: '#96a0b8', opacity: 0.7, lineHeight: 1.4 }}>{helper}</span>}
      </div>
    </button>
  );
}

/* ─── CheckboxGrid (reusable multi-select) ─── */

function CheckboxGrid({ items, selected, onToggle, columns = 2 }: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  columns?: number;
}) {
  return (
    <div className="checkbox-grid-responsive" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '6px 16px',
    }}>
      {items.map(item => (
        <label key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
          <div
            onClick={(e) => { e.preventDefault(); onToggle(item); }}
            style={{
              width: 16, height: 16, minWidth: 16,
              border: `1.5px solid ${selected.includes(item) ? '#00e5ff' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 3, marginTop: 1,
              background: selected.includes(item) ? 'rgba(0,229,255,0.15)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {selected.includes(item) && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l2.5 2.5L9 1" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
  highestVisited: number;
  onNavigate: (section: number) => void;
}

function SidebarNav({ currentSection, completedSections, highestVisited, onNavigate }: SidebarNavProps) {
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
            const isClickable = num <= highestVisited;

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
                  cursor: isClickable ? 'pointer' : 'default',
                }}
                onClick={isClickable ? () => onNavigate(num) : undefined}
                onMouseEnter={isClickable ? (e) => { if (!isCurrent) e.currentTarget.style.color = '#c8cdd8'; } : undefined}
                onMouseLeave={isClickable ? (e) => { if (!isCurrent) e.currentTarget.style.color = '#96a0b8'; } : undefined}
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
            const isClickable = num <= highestVisited;

            return (
              <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  onClick={isClickable ? () => onNavigate(num) : undefined}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isActive ? '#00e5ff' : 'transparent',
                    border: isActive ? 'none' : '1px solid rgba(255,255,255,0.15)',
                    transition: 'background 0.2s',
                    cursor: isClickable ? 'pointer' : 'default',
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

/* ─── Card icon map for Section 2 ─── */

const CARD_ICONS: Record<string, React.ReactNode> = {
  'How do clients find me?': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  'How do rates and billing work?': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  'Why are intro videos important?': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  'How do ratings work?': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  'What is the mentorship directory?': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  'How is this different from an agency?': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 21v-2a4 4 0 0 0-2-3.46" />
      <path d="M4 21v-2a4 4 0 0 1 2-3.46" />
      <circle cx="12" cy="7" r="4" />
      <line x1="8" y1="11" x2="16" y2="11" />
    </svg>
  ),
};

/* ─── Education Cards (Section 2) ─── */

interface EducationCard {
  title: string;
  teaser: string;
  body: React.ReactNode[];
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
      <>Agencies charge an <em>hourly</em> fee on top of your rate. That fee can range from about $20 to $80+ per hour, but you may never know what the client actually paid. signpost charges a flat $15 booking fee for each interpreter confirmed on a booking. This covers the cost of building and running the platform: the booking system, encrypted messaging, notifications, and the interpreter directory. That is the only fee signpost collects.</>,
    ],
  },
  {
    title: 'Why are intro videos important?',
    teaser: 'Watching an intro video in ASL lets Deaf people get to know you naturally...',
    body: [
      'Watching an intro video in ASL lets Deaf people get to know you naturally. No written description can replace that. When we started developing signpost, intro videos were one of the most requested features.',
      'Your video does not need to be polished or scripted. Just introduce yourself: share a little about your background, what kind of work you do, whatever feels right.',
      'If you would prefer to share a sample of your interpreting work instead, that is welcome too. Make sure work samples are accessible in both the source and target languages (for example, yourself signing with the original English captioned, or a video interpreted from ASL with yourself voicing and captions). Please use clips from a public source such as a YouTube video or TED talk.',
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

/* ─── Shared UI ─── */

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
      <label htmlFor={id} style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#00e5ff', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>{label}</label>
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

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="signup-form-card">
      {children}
    </div>
  );
}

function SectionWrapper({ section, completedSections, highestVisited, onNavigate, children }: {
  section: number; completedSections: number[]; highestVisited: number; onNavigate: (s: number) => void; children: React.ReactNode;
}) {
  return (
    <div style={{ padding: '100px 28px 80px', minHeight: '100vh', background: 'var(--bg)', position: 'relative', zIndex: 1 }}>
      <div className="interpreter-signup-layout" style={{ maxWidth: 900, margin: '0 auto' }}>
        <SidebarNav currentSection={section} completedSections={completedSections} highestVisited={highestVisited} onNavigate={onNavigate} />
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
        .signup-form-card {
          background: #111118;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 32px;
        }
        @media (max-width: 640px) {
          .signup-form-card {
            padding: 20px;
          }
        }
        .checkbox-grid-responsive {
          /* default is fine */
        }
        @media (max-width: 640px) {
          .checkbox-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
        .signup-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2300e5ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 14px center !important;
          padding-right: 36px !important;
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
  const [highestVisited, setHighestVisited] = useState(isAddRole ? 2 : 1);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [resuming, setResuming] = useState(!isAddRole);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);

  // Section 3: Professional
  const [interpreterType, setInterpreterType] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [genderIdentity, setGenderIdentity] = useState('');
  const [selectedPronouns, setSelectedPronouns] = useState<string[]>([]);
  const [otherPronouns, setOtherPronouns] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneType, setPhoneType] = useState('');
  const [eventCoordination, setEventCoordination] = useState(false);

  // Section 4: Languages
  const [signLanguages, setSignLanguages] = useState<string[]>([]);
  const [otherSignLanguage, setOtherSignLanguage] = useState('');
  const [spokenLanguages, setSpokenLanguages] = useState<string[]>([]);
  const [otherSpokenLanguage, setOtherSpokenLanguage] = useState('');

  // Section 5: Credentials
  const [certifications, setCertifications] = useState<Array<{name: string; issuing_body: string; year: string}>>([{ name: '', issuing_body: '', year: '' }]);
  const [education, setEducation] = useState<Array<{institution: string; degree: string; year: string}>>([{ institution: '', degree: '', year: '' }]);

  // Section 6: About You
  const [bio, setBio] = useState('');
  const [bioSpecializations, setBioSpecializations] = useState('');
  const [bioExtra, setBioExtra] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Section 7: How People Find You
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specializedSkills, setSpecializedSkills] = useState<string[]>([]);
  const [lgbtq, setLgbtq] = useState(false);
  const [deafParented, setDeafParented] = useState(false);
  const [bipoc, setBipoc] = useState(false);
  const [bipocDetails, setBipocDetails] = useState<string[]>([]);
  const [religiousAffiliation, setReligiousAffiliation] = useState(false);
  const [religiousDetails, setReligiousDetails] = useState<string[]>([]);
  const [mentorshipOffering, setMentorshipOffering] = useState(false);
  const [mentorshipSeeking, setMentorshipSeeking] = useState(false);

  // Section 8: Finish
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [addedDeafRole, setAddedDeafRole] = useState(false);
  const [addedRequesterRole, setAddedRequesterRole] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [missingFieldsError, setMissingFieldsError] = useState('');

  function getMissingRequiredFields(): string[] {
    const missing: string[] = [];
    if (!firstName?.trim()) missing.push('First name');
    if (!lastName?.trim()) missing.push('Last name');
    if (!city?.trim()) missing.push('City');
    if (!state?.trim()) missing.push('State');
    if (!country?.trim()) missing.push('Country');
    if (!photoUrl?.trim()) missing.push('Profile photo');
    if (!signLanguages?.length) missing.push('At least one sign language');
    if (!spokenLanguages?.length) missing.push('At least one spoken language');
    if (!yearsExperience) missing.push('Years of professional interpreting experience');
    if (!specializations?.length) missing.push('At least one specialization');
    return missing;
  }

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
          .select('id, draft_step, draft_data, first_name, last_name, email, address, country, state, city, zip')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          setProfileId(profile.id);
          // Restore basic fields from profile
          if (profile.first_name && !firstName) setFirstName(profile.first_name);
          if (profile.last_name && !lastName) setLastName(profile.last_name);
          if (profile.email && !email) setEmail(profile.email);
          if (profile.address) setAddress(profile.address);
          if (profile.country) setCountry(profile.country);
          if (profile.state) setState(profile.state);
          if (profile.city) setCity(profile.city);
          if (profile.zip) setZip(profile.zip);

          // Restore draft_data fields
          const d = profile.draft_data as Record<string, unknown> | null;
          if (d) {
            if (d.interpreterType) setInterpreterType(d.interpreterType as string);
            if (d.yearsExperience) setYearsExperience(d.yearsExperience as string);
            if (d.workMode) setWorkMode(d.workMode as string);
            if (d.genderIdentity) setGenderIdentity(d.genderIdentity as string);
            if (Array.isArray(d.selectedPronouns)) setSelectedPronouns(d.selectedPronouns as string[]);
            if (d.otherPronouns) setOtherPronouns(d.otherPronouns as string);
            if (d.phone) setPhone(d.phone as string);
            if (d.phoneType) setPhoneType(d.phoneType as string);
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
            if (Array.isArray(d.specializations)) setSpecializations(d.specializations as string[]);
            if (Array.isArray(d.specializedSkills)) setSpecializedSkills(d.specializedSkills as string[]);
            if (typeof d.lgbtq === 'boolean') setLgbtq(d.lgbtq);
            if (typeof d.deafParented === 'boolean') setDeafParented(d.deafParented);
            if (typeof d.bipoc === 'boolean') setBipoc(d.bipoc);
            if (Array.isArray(d.bipocDetails)) setBipocDetails(d.bipocDetails as string[]);
            if (typeof d.religiousAffiliation === 'boolean') setReligiousAffiliation(d.religiousAffiliation);
            if (Array.isArray(d.religiousDetails)) setReligiousDetails(d.religiousDetails as string[]);
            if (typeof d.mentorshipOffering === 'boolean') setMentorshipOffering(d.mentorshipOffering);
            if (typeof d.mentorshipSeeking === 'boolean') setMentorshipSeeking(d.mentorshipSeeking);
          }

          // Jump to saved section
          const targetSection = profile.draft_step ?? 2;
          const completed = Array.from({ length: targetSection - 1 }, (_, i) => i + 1);
          setCompletedSections(completed);
          setSection(targetSection);
          setHighestVisited(targetSection);
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
        firstName, lastName, email, address, country, state, city, zip,
        interpreterType, yearsExperience, workMode, genderIdentity, selectedPronouns, otherPronouns, phone, phoneType, eventCoordination,
        signLanguages, otherSignLanguage, spokenLanguages, otherSpokenLanguage,
        certifications, education,
        bio, bioSpecializations, bioExtra, videoUrl, photoUrl,
        specializations, specializedSkills,
        lgbtq, deafParented, bipoc, bipocDetails, religiousAffiliation, religiousDetails,
        mentorshipOffering, mentorshipSeeking,
      };
      supabase
        .from('interpreter_profiles')
        .update({ draft_step: section, draft_data: draftData })
        .eq('user_id', uid)
        .then(({ error }) => {
          if (error) console.warn('Auto-save draft failed:', error.message);
        });
    }, 5000);

    return () => clearInterval(interval);
  });

  const handleSidebarNav = (s: number) => {
    setError('');
    setSection(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function goToSection(s: number) {
    setError('');
    setCompletedSections(prev => {
      const current = section;
      return prev.includes(current) ? prev : [...prev, current];
    });
    setSection(s);
    setHighestVisited(prev => Math.max(prev, s));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Persist draft progress to Supabase
    const uid = userId || existingUserId;
    if (uid) {
      const supabase = createClient();
      const draftData = {
        firstName, lastName, email, address, country, state, city, zip,
        interpreterType, yearsExperience, workMode, genderIdentity, selectedPronouns, otherPronouns, phone, phoneType, eventCoordination,
        signLanguages, otherSignLanguage, spokenLanguages, otherSpokenLanguage,
        certifications, education,
        bio, bioSpecializations, bioExtra, videoUrl, photoUrl,
        specializations, specializedSkills,
        lgbtq, deafParented, bipoc, bipocDetails, religiousAffiliation, religiousDetails,
        mentorshipOffering, mentorshipSeeking,
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
    const COUNTRIES_REQUIRING_STATE = ['US', 'CA'];
    if (COUNTRIES_REQUIRING_STATE.includes(country) && !state) {
      setError('Please select your state.');
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
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
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
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
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
        address: address || null,
        country: (norm.country as string) || country,
        country_name: getCountryName((norm.country as string) || country) || country || null,
        state: (norm.state as string) || state,
        city: (norm.city as string) || city,
        zip: zip || null,
        location: [(norm.city as string) || city, (norm.state as string) || state].filter(Boolean).join(', ') || null,
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
      <SectionWrapper section={1} completedSections={[]} highestVisited={highestVisited} onNavigate={handleSidebarNav}>
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
      <SectionWrapper section={section} completedSections={completedSections} highestVisited={highestVisited} onNavigate={handleSidebarNav}>
        <StepHeading>Create your account</StepHeading>
        <FormCard>
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#00e5ff', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>Location</label>
            <LocationInput
              address={address}
              city={city}
              state={state}
              zip={zip}
              country={country}
              onChange={(loc: LocationFields) => { setAddress(loc.address); setCity(loc.city); setState(loc.state); setZip(loc.zip); setCountry(loc.country); }}
              showLocationName={false}
              showMeetingLink={false}
              defaultCountry="US"
              accent="cyan"
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
        </FormCard>

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
                  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
                  if (signInError) { setError('Could not sign in. Please check your email and password, or create a new account.'); setLoading(false); return; }
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
                      if (Array.isArray(d.selectedPronouns)) setSelectedPronouns(d.selectedPronouns as string[]);
                      if (d.otherPronouns) setOtherPronouns(d.otherPronouns as string);
                      if (d.phone) setPhone(d.phone as string);
                      if (d.phoneType) setPhoneType(d.phoneType as string);
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
                      if (Array.isArray(d.specializations)) setSpecializations(d.specializations as string[]);
                      if (Array.isArray(d.specializedSkills)) setSpecializedSkills(d.specializedSkills as string[]);
                      if (typeof d.lgbtq === 'boolean') setLgbtq(d.lgbtq);
                      if (typeof d.deafParented === 'boolean') setDeafParented(d.deafParented);
                      if (typeof d.bipoc === 'boolean') setBipoc(d.bipoc);
                      if (Array.isArray(d.bipocDetails)) setBipocDetails(d.bipocDetails as string[]);
                      if (typeof d.religiousAffiliation === 'boolean') setReligiousAffiliation(d.religiousAffiliation);
                      if (Array.isArray(d.religiousDetails)) setReligiousDetails(d.religiousDetails as string[]);
                      if (typeof d.mentorshipOffering === 'boolean') setMentorshipOffering(d.mentorshipOffering);
                      if (typeof d.mentorshipSeeking === 'boolean') setMentorshipSeeking(d.mentorshipSeeking);
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
      <SectionWrapper section={section} completedSections={completedSections} highestVisited={highestVisited} onNavigate={handleSidebarNav}>
        <StepHeading>How signpost works for interpreters</StepHeading>
        <StepSubtext>These explain how signpost is different. Read what interests you.</StepSubtext>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {EDUCATION_CARDS.map((card, i) => (
            <ExpandableCard key={i} card={card} />
          ))}
        </div>

        <FormCard>
        <PrimaryButton onClick={() => goToSection(3)}>
          {"Got it, let's set up my profile"}
        </PrimaryButton>
        <div style={{ marginTop: 10 }}>
          <OutlineButton onClick={() => goToSection(1)}>
            Back
          </OutlineButton>
        </div>
        </FormCard>
      </SectionWrapper>
    );
  }

  /* ─── Section 3: Professional ─── */

  async function handleSaveProfessional() {
    const errors: string[] = [];
    if (!interpreterType) errors.push('Please select your interpreter type.');
    if (!workMode) errors.push('Please select your mode of work.');
    if (!yearsExperience) errors.push('Please select your years of professional interpreting experience.');
    if (errors.length > 0) {
      setError(errors.join('\n'));
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
          pronouns: [...selectedPronouns, ...(otherPronouns.trim() ? [otherPronouns.trim()] : [])].join(', ') || null,
          phone: phone ? (normalizePhone(phone) || phone) : null,
          phone_type: phoneType || null,
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
      <SectionWrapper section={section} completedSections={completedSections} highestVisited={highestVisited} onNavigate={handleSidebarNav}>
        <StepHeading>Professional background</StepHeading>
        <StepSubtext>Tell us about your interpreting practice.</StepSubtext>

        <FormCard>
        {/* Interpreter type */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#00e5ff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
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
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#f0f2f8' }}>{t}</span>
            </label>
          ))}
        </div>

        {/* Years of professional interpreting experience */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#00e5ff', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
            Years of professional interpreting experience <span style={{ color: '#ff6b85' }}>*</span>
          </label>
          <select
            className="signup-select"
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
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#96a0b8', margin: '6px 0 0' }}>
            Not including casual or pre-professional interpreting.
          </p>
        </div>

        {/* Mode of work */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#00e5ff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
            Mode of work <span style={{ color: '#ff6b85' }}>*</span>
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
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#f0f2f8' }}>{m}</span>
            </label>
          ))}
        </div>

        {/* Gender identity */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#00e5ff', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
            Gender identity
          </label>
          <select
            className="signup-select"
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
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', marginTop: 6, lineHeight: 1.5 }}>
            Requesters can use the directory filters to locate interpreters who meet the Deaf person&apos;s preference for their appointment.
          </p>
        </div>

        {/* Pronouns */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#00e5ff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
            Pronouns
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['she/her', 'he/him', 'they/them'].map(p => {
              const active = selectedPronouns.includes(p);
              return (
                <button key={p} type="button" onClick={() => setSelectedPronouns(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 14,
                  fontFamily: "'Inter', sans-serif", fontWeight: 500, cursor: 'pointer',
                  background: active ? 'rgba(0,229,255,0.12)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                  color: active ? '#00e5ff' : '#96a0b8',
                  transition: 'all 0.15s',
                }}>{p}</button>
              );
            })}
          </div>
          <div style={{ marginTop: 10 }}>
          <input
            type="text"
            value={otherPronouns}
            onChange={(e) => setOtherPronouns(e.target.value)}
            placeholder="Other pronouns..."
            style={{
              width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 14px', color: 'var(--text)', fontSize: 15,
              fontFamily: "'Inter', sans-serif", outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          </div>
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 24 }}>
          <PhoneInput
            label="Phone"
            value={phone}
            onChange={setPhone}
            defaultCountry={country || 'US'}
            accent="cyan"
          />
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            {[
              { value: 'voice', label: 'Voice' },
              { value: 'text', label: 'Text' },
              { value: 'vp', label: 'VP', subtitle: '(Video Phone)' },
            ].map((opt) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="phoneType"
                  value={opt.value}
                  checked={phoneType === opt.value}
                  onChange={() => setPhoneType(opt.value)}
                  style={{ accentColor: '#00e5ff', width: 16, height: 16 }}
                />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#f0f2f8' }}>
                  {opt.label}
                  {opt.subtitle && <span style={{ color: '#96a0b8', fontSize: 13, marginLeft: 4 }}>{opt.subtitle}</span>}
                </span>
              </label>
            ))}
          </div>
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
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#f0f2f8' }}>
              I also coordinate interpreters for events or organizations
            </span>
          </label>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', marginTop: 6, marginLeft: 26, lineHeight: 1.5 }}>
            You can set this up later from your profile if you prefer.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.2)',
            borderRadius: 10, padding: '12px 16px', color: '#f06b85',
            fontFamily: "'Inter', sans-serif", fontSize: 14, marginTop: 20,
          }}>
            {error.split('\n').map((line, i) => <div key={i}>{line}</div>)}
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
        </FormCard>
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
    const errors: string[] = [];
    if (signLanguages.length === 0) errors.push('Please select at least one sign language.');
    if (spokenLanguages.length === 0) errors.push('Please select at least one spoken language.');
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }
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
    const SIGN_LANGUAGES_BY_REGION = {
      'Africa & Middle East': [
        'Arabic Sign Language (ArSL)', 'Ethiopian Sign Language', 'Ghana Sign Language', 'Kenyan Sign Language',
        'Nigerian Sign Language', 'Saudi Arabian Sign Language', 'South African Sign Language (SASL)',
        'Tanzanian Sign Language', 'Ugandan Sign Language', 'Zimbabwean Sign Language',
      ],
      'Americas': [
        'Argentinian Sign Language (LSA)', 'Brazilian Sign Language (Libras)', 'Chilean Sign Language (LSCh)',
        'Colombian Sign Language (LSC)', 'Cuban Sign Language', 'Haitian Sign Language',
        'Peruvian Sign Language (LSP)', 'Venezuelan Sign Language (LSV)',
      ],
      'Asia & Pacific': [
        'Auslan (Australian Sign Language)', 'Chinese Sign Language (CSL)', 'Filipino Sign Language (FSL)',
        'Hong Kong Sign Language', 'Indian Sign Language (ISL)', 'Indonesian Sign Language (BISINDO)',
        'Japanese Sign Language (JSL/Nihon Shuwa)', 'Korean Sign Language (KSL)',
        'Malaysian Sign Language (BIM)', 'New Zealand Sign Language (NZSL)',
        'Sri Lankan Sign Language', 'Thai Sign Language', 'Vietnamese Sign Language',
      ],
      'Europe': [
        'Austrian Sign Language (\u00d6GS)', 'Belgian Sign Language (BVGT/LSFB)', 'Bulgarian Sign Language',
        'Croatian Sign Language (HZJ)', 'Czech Sign Language (\u010cZJ)', 'Danish Sign Language (DST)',
        'Finnish Sign Language (ViSL)', 'Flemish Sign Language (VGT)', 'Greek Sign Language (GSL)',
        'Hungarian Sign Language (MJNY)', 'Irish Sign Language (ISL)', 'Italian Sign Language (LIS)',
        'Nederlandse Gebarentaal (NGT)', 'Norwegian Sign Language (NTS)', 'Polish Sign Language (PJM)',
        'Portuguese Sign Language (LGP)', 'Russian Sign Language (RSL)', 'Romanian Sign Language (LSR)',
        'Slovak Sign Language', 'Swedish Sign Language (SSL)', 'Swiss German Sign Language (DSGS)',
        'Turkish Sign Language (T\u0130D)', 'Ukrainian Sign Language',
      ],
    };

    const SPOKEN_LANGUAGES_BY_REGION = {
      'Africa & Middle East': [
        'Afrikaans', 'Amharic', 'Dari', 'Hebrew', 'Igbo', 'Kurdish', 'Sesotho', 'Shona',
        'Somali', 'Swahili', 'Tigrinya', 'Twi/Akan', 'Wolof', 'Xhosa', 'Yoruba', 'Zulu',
      ],
      'Americas': ['Creole (Haitian)', 'Guaran\u00ed', 'Nahuatl', 'Quechua'],
      'Asia & Pacific': [
        'Bengali', 'Burmese', 'Filipino/Tagalog', 'Hindi', 'Gujarati', 'Indonesian', 'Khmer',
        'Malay', 'Marathi', 'Nepali', 'Pashto', 'Persian/Farsi', 'Punjabi', 'Sinhala',
        'Tamil', 'Telugu', 'Thai', 'Urdu',
      ],
      'Europe': [
        'Albanian', 'Basque', 'Catalan', 'Croatian', 'Czech', 'Danish', 'Dutch', 'Estonian',
        'Finnish', 'Flemish', 'Georgian', 'German', 'Greek', 'Hungarian', 'Icelandic', 'Italian',
        'Latvian', 'Lithuanian', 'Maltese', 'Norwegian', 'Polish', 'Romanian', 'Serbian',
        'Slovak', 'Slovenian', 'Swedish', 'Turkish', 'Ukrainian', 'Welsh',
      ],
    };

    const dropdownStyle: React.CSSProperties = {
      width: '100%', background: '#16161f', border: '1px solid rgba(0,229,255,0.15)',
      borderRadius: 10, padding: '11px 14px', paddingRight: 36, color: '#f0f2f8',
      fontFamily: "'Inter', sans-serif", fontSize: 14, marginTop: 12, outline: 'none',
      appearance: 'none', WebkitAppearance: 'none',
    };

    const tagStyle: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
      borderRadius: 999, padding: '4px 12px', fontSize: 13, color: '#00e5ff', margin: 4,
    };

    function addLanguage(lang: string, list: string[], setter: (v: string[]) => void) {
      if (lang && !list.includes(lang)) {
        setter([...list, lang]);
      }
    }

    function removeLanguage(lang: string, list: string[], setter: (v: string[]) => void) {
      setter(list.filter(x => x !== lang));
    }

    // Languages selected from dropdowns (not in pill options)
    const signDropdownSelections = signLanguages.filter(l => !SIGN_LANGUAGE_OPTIONS.includes(l) && l !== otherSignLanguage);
    const spokenDropdownSelections = spokenLanguages.filter(l => !SPOKEN_LANGUAGE_OPTIONS.includes(l) && l !== otherSpokenLanguage);

    return (
      <SectionWrapper section={section} completedSections={completedSections} highestVisited={highestVisited} onNavigate={handleSidebarNav}>
        <StepHeading>Working Languages</StepHeading>
        <StepSubtext>Select all languages in which you hold professional-level fluency.</StepSubtext>

        <FormCard>
        {/* Sign languages */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#00e5ff', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
            Sign languages <span style={{ color: '#ff6b85' }}>*</span>
          </label>
          <CheckboxGrid
            items={SIGN_LANGUAGE_OPTIONS}
            selected={signLanguages}
            onToggle={(lang) => toggleInList(signLanguages, lang, setSignLanguages)}
          />
          <select
            className="signup-select"
            value=""
            onChange={(e) => { addLanguage(e.target.value, signLanguages, setSignLanguages); e.target.value = ''; }}
            style={dropdownStyle}
            onFocus={(e) => (e.target.style.borderColor = '#00e5ff')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.15)')}
          >
            <option value="">More sign languages by region...</option>
            {Object.entries(SIGN_LANGUAGES_BY_REGION).map(([region, langs]) => (
              <optgroup key={region} label={region}>
                {langs.map((lang) => (
                  <option key={lang} value={lang} disabled={signLanguages.includes(lang)}>{lang}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {signDropdownSelections.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap' }}>
              {signDropdownSelections.map((lang) => (
                <span key={lang} style={tagStyle}>
                  {lang}
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang, signLanguages, setSignLanguages)}
                    style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
                    aria-label={`Remove ${lang}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
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
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#00e5ff', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
            Spoken languages <span style={{ color: '#ff6b85' }}>*</span>
          </label>
          <CheckboxGrid
            items={SPOKEN_LANGUAGE_OPTIONS}
            selected={spokenLanguages}
            onToggle={(lang) => toggleInList(spokenLanguages, lang, setSpokenLanguages)}
          />
          <select
            className="signup-select"
            value=""
            onChange={(e) => { addLanguage(e.target.value, spokenLanguages, setSpokenLanguages); e.target.value = ''; }}
            style={dropdownStyle}
            onFocus={(e) => (e.target.style.borderColor = '#00e5ff')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.15)')}
          >
            <option value="">More spoken languages...</option>
            {Object.entries(SPOKEN_LANGUAGES_BY_REGION).map(([region, langs]) => (
              <optgroup key={region} label={region}>
                {langs.map((lang) => (
                  <option key={lang} value={lang} disabled={spokenLanguages.includes(lang)}>{lang}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {spokenDropdownSelections.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap' }}>
              {spokenDropdownSelections.map((lang) => (
                <span key={lang} style={tagStyle}>
                  {lang}
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang, spokenLanguages, setSpokenLanguages)}
                    style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
                    aria-label={`Remove ${lang}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
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
            borderRadius: 10, padding: '12px 16px', color: '#f06b85',
            fontFamily: "'Inter', sans-serif", fontSize: 14,
          }}>
            {error.split('\n').map((line, i) => <div key={i}>{line}</div>)}
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
        </FormCard>
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
      <SectionWrapper section={section} completedSections={completedSections} highestVisited={highestVisited} onNavigate={handleSidebarNav}>
        <StepHeading>Credentials</StepHeading>
        <StepSubtext>Add your certifications and education. All fields are optional.</StepSubtext>

        <FormCard>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, color: '#96a0b8', margin: '0 0 20px' }}>
          If you hold any certifications or credentials, add them here. You can always add more later.
        </p>
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
        </FormCard>
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
    if (!photoUrl) {
      setError('A profile photo is required. It helps Deaf community members recognize you and feel comfortable before an appointment.');
      return;
    }
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
      <SectionWrapper section={section} completedSections={completedSections} highestVisited={highestVisited} onNavigate={handleSidebarNav}>
        <StepHeading>About you</StepHeading>
        <StepSubtext>Help people get to know you.</StepSubtext>

        <FormCard>
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
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', margin: 0 }}>
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
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, color: '#96a0b8', margin: '0 0 12px' }}>
          Even a few sentences make a difference.
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 15, fontWeight: 400, color: '#96a0b8', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
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
          <label style={{ display: 'block', fontSize: 15, fontWeight: 400, color: '#96a0b8', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
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
          <label style={{ display: 'block', fontSize: 15, fontWeight: 400, color: '#96a0b8', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
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
          fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
          color: '#96a0b8', lineHeight: 1.65, marginBottom: 16,
        }}>
          Watching an intro video in ASL lets Deaf people get to know you naturally. No written description can replace that. When we started developing signpost, intro videos were one of the most requested features.
        </p>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
          color: '#96a0b8', lineHeight: 1.65, marginBottom: 16,
        }}>
          Your video does not need to be polished or scripted. Just introduce yourself: share a little about your background, what kind of work you do, whatever feels right.
        </p>

        <div style={{
          background: 'rgba(240,166,35,0.08)', borderLeft: '3px solid #f0a623',
          padding: '12px 16px', marginBottom: 16,
        }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: '#f0a623', margin: 0, lineHeight: 1.5 }}>
            Deaf users consistently rate interpreter intro videos as one of their most valued features of signpost.
          </p>
        </div>

        <p style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13,
          color: '#96a0b8', lineHeight: 1.6, marginBottom: 16,
        }}>
          You can record an introduction, upload a video, or paste a URL. Work samples are welcome too. If sharing a work sample, make sure it is accessible in both the source and target languages (for example, yourself signing with the original English captioned, or a video interpreted from ASL with yourself voicing and captions). Please use clips from a public source.
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
            borderRadius: 10, padding: '12px 16px', color: '#f06b85',
            fontFamily: "'Inter', sans-serif", fontSize: 14, marginTop: 20,
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
        </FormCard>
      </SectionWrapper>
    );
  }

  /* ─── Section 7: How People Find You ─── */

  if (section === 7) {
    const l4Style: React.CSSProperties = {
      fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
      textTransform: 'uppercase', letterSpacing: '0.08em', color: '#00e5ff',
      marginBottom: 12,
    };

    const pillStyle = (selected: boolean): React.CSSProperties => ({
      background: selected ? 'rgba(0,229,255,0.08)' : 'transparent',
      border: `1px solid ${selected ? '#00e5ff' : 'rgba(0,229,255,0.15)'}`,
      color: selected ? '#00e5ff' : '#c8cdd8',
      borderRadius: 999, padding: '8px 16px', margin: '0 8px 8px 0',
      fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
      cursor: 'pointer', transition: 'all 0.15s',
    });

    const handleSection7Save = async () => {
      const uid = userId || existingUserId;
      if (!uid) return;
      setLoading(true);
      const supabase = createClient();
      const { error: saveErr } = await supabase
        .from('interpreter_profiles')
        .update({
          specializations,
          specialized_skills: specializedSkills,
          lgbtq,
          deaf_parented: deafParented,
          bipoc,
          bipoc_details: bipocDetails,
          religious_affiliation: religiousAffiliation,
          religious_details: religiousDetails,
          mentorship_offering: mentorshipOffering,
          mentorship_seeking: mentorshipSeeking,
        })
        .eq('user_id', uid);
      if (saveErr) console.error('Section 7 save error:', saveErr);
      setLoading(false);
      goToSection(8);
    };

    return (
      <SectionWrapper section={section} completedSections={completedSections} highestVisited={highestVisited} onNavigate={handleSidebarNav}>
        <StepHeading>How people find you</StepHeading>
        <StepSubtext>These help requesters find interpreters who are the right fit for their needs.</StepSubtext>

        <FormCard>
          {/* Specializations */}
          <div style={l4Style}>Specializations</div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.6, margin: '0 0 14px' }}>
            Select the settings where you have experience or are available to work.
          </p>
          <div style={{
            background: 'rgba(240,166,35,0.08)', borderLeft: '3px solid #f0a623',
            padding: '12px 16px', marginBottom: 16,
          }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: '#f0a623', margin: 0, lineHeight: 1.5 }}>
              {"Without specializations, your profile won't appear when requesters filter the directory by appointment type."}
            </p>
          </div>
          {Object.entries(SPECIALIZATION_CATEGORIES).map(([category, items], catIdx) => (
            <div key={category}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                color: '#00e5ff', textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                borderBottom: '1px solid rgba(0,229,255,0.1)',
                marginTop: catIdx === 0 ? 0 : 20,
                paddingBottom: 6, marginBottom: 10,
              }}>
                {category}
              </div>
              <CheckboxGrid
                items={items}
                selected={specializations}
                onToggle={(spec) => setSpecializations(prev => prev.includes(spec) ? prev.filter(x => x !== spec) : [...prev, spec])}
              />
            </div>
          ))}
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#96a0b8', marginTop: 12, marginBottom: 4 }}>
            {specializations.length} specialization{specializations.length !== 1 ? 's' : ''} selected
          </div>

          {/* Specialized Skills */}
          <div style={{ ...l4Style, marginTop: 28 }}>Specialized Skills</div>
          <div style={{ marginBottom: 28 }}>
            <CheckboxGrid
              items={SPECIALIZED_SKILLS}
              selected={specializedSkills}
              onToggle={(s) => setSpecializedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
            />
          </div>

          {/* Community & Identity */}
          <div style={l4Style}>Community & Identity</div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.6, margin: '0 0 16px' }}>
            Requesters can use the directory to find interpreters who are the right fit for culturally specific settings.
          </p>

          <CommunityToggle label="LGBTQ+" helper="Select if you are available for and affirming of LGBTQ+ clients and settings" checked={lgbtq} onChange={() => setLgbtq(!lgbtq)} />
          <CommunityToggle label="Deaf-Parented Interpreter / CODA" helper="Select if you grew up with Deaf parents or are a Child of Deaf Adults" checked={deafParented} onChange={() => setDeafParented(!deafParented)} />
          <CommunityToggle label="BIPOC" checked={bipoc} onChange={() => { if (bipoc) { setBipoc(false); setBipocDetails([]); } else { setBipoc(true); } }} />
          {bipoc && (
            <div style={{ marginBottom: 8, paddingLeft: 52 }}>
              <CheckboxGrid
                items={BIPOC_OPTIONS}
                selected={bipocDetails}
                onToggle={(opt) => setBipocDetails(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
              />
            </div>
          )}
          <CommunityToggle label="Religious affiliation" checked={religiousAffiliation} onChange={() => { if (religiousAffiliation) { setReligiousAffiliation(false); setReligiousDetails([]); } else { setReligiousAffiliation(true); } }} />
          {religiousAffiliation && (
            <div style={{ marginBottom: 8, paddingLeft: 52 }}>
              <CheckboxGrid
                items={RELIGIOUS_OPTIONS}
                selected={religiousDetails}
                onToggle={(opt) => setReligiousDetails(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
              />
            </div>
          )}

          {/* Mentorship */}
          <div style={{ ...l4Style, marginTop: 28 }}>Mentorship</div>
          <CommunityToggle label="I am seeking mentorship" checked={mentorshipSeeking} onChange={() => setMentorshipSeeking(!mentorshipSeeking)} />
          <CommunityToggle label="I am offering mentorship" checked={mentorshipOffering} onChange={() => setMentorshipOffering(!mentorshipOffering)} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', marginTop: 8, lineHeight: 1.5 }}>
            You can set up mentorship preferences from your profile after signup.
          </p>

          <div style={{ marginTop: 28 }}>
            <PrimaryButton onClick={handleSection7Save} disabled={loading}>
              {loading ? 'Saving...' : 'Continue'}
            </PrimaryButton>
            <div style={{ marginTop: 8 }}>
              <OutlineButton onClick={() => goToSection(6)}>Back</OutlineButton>
            </div>
          </div>
        </FormCard>
      </SectionWrapper>
    );
  }

  /* ─── Section 8: Finish ─── */

  if (section === 8) {
    const handleAddDeafRole = async () => {
      const uid = userId || existingUserId;
      if (!uid || addedDeafRole) return;
      const supabase = createClient();
      const { data: current } = await supabase.from('user_profiles').select('pending_roles').eq('id', uid).maybeSingle();
      const roles = (current?.pending_roles as string[]) || [];
      if (!roles.includes('deaf')) {
        await supabase.from('user_profiles').update({ pending_roles: [...roles, 'deaf'] }).eq('id', uid);
      }
      setAddedDeafRole(true);
    };

    const handleAddRequesterRole = async () => {
      const uid = userId || existingUserId;
      if (!uid || addedRequesterRole) return;
      const supabase = createClient();
      const { data: current } = await supabase.from('user_profiles').select('pending_roles').eq('id', uid).maybeSingle();
      const roles = (current?.pending_roles as string[]) || [];
      if (!roles.includes('requester')) {
        await supabase.from('user_profiles').update({ pending_roles: [...roles, 'requester'] }).eq('id', uid);
      }
      setAddedRequesterRole(true);
    };

    const handleSubmit = async () => {
      if (!agreeTerms) {
        setTermsError(true);
        return;
      }
      setTermsError(false);
      setMissingFieldsError('');

      const missing = getMissingRequiredFields();
      if (missing.length > 0) {
        console.info('Signup blocked - missing required fields:', missing);
        setMissingFieldsError(`To submit your profile, please complete the following: ${missing.join(', ')}.`);
        return;
      }

      const uid = userId || existingUserId;
      if (!uid) return;
      setLoading(true);
      const supabase = createClient();
      const { error: submitErr } = await supabase
        .from('interpreter_profiles')
        .update({
          submitted_at: new Date().toISOString(),
          status: 'approved',
        })
        .eq('user_id', uid);
      if (submitErr) {
        console.error('Submit error:', submitErr);
        setError('Failed to submit profile. Please try again.');
        setLoading(false);
        return;
      }
      setLoading(false);
      goToSection(9);
    };

    return (
      <SectionWrapper section={section} completedSections={completedSections} highestVisited={highestVisited} onNavigate={handleSidebarNav}>
        <StepHeading>Almost done</StepHeading>

        <FormCard>
          {/* Additional role: Deaf/DB/HH */}
          <div style={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#f0f2f8', margin: '0 0 8px' }}>
              Are you also Deaf, DeafBlind, or Hard of Hearing?
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.6, margin: '0 0 12px' }}>
              Create a personal profile to build your preferred interpreter list, rate interpreters, and request interpreters for personal events. Your name, location, and email will be filled in automatically.
            </p>
            {addedDeafRole ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00e5ff', fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                Deaf/DB/HH profile added
              </div>
            ) : (
              <button type="button" onClick={handleAddDeafRole} style={{
                background: 'transparent', border: '1px solid rgba(0,229,255,0.3)',
                borderRadius: 10, padding: '10px 18px', color: '#00e5ff',
                fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}>
                Yes, add Deaf/DB/HH profile
              </button>
            )}
          </div>

          {/* Additional role: Requester */}
          <div style={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#f0f2f8', margin: '0 0 8px' }}>
              Do you also coordinate interpreters for an organization?
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.6, margin: '0 0 12px' }}>
              If you book interpreters for a workplace, school, medical office, or other organization, add a requester profile to manage bookings from your dashboard.
            </p>
            {addedRequesterRole ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00e5ff', fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                Requester profile added
              </div>
            ) : (
              <button type="button" onClick={handleAddRequesterRole} style={{
                background: 'transparent', border: '1px solid rgba(0,229,255,0.3)',
                borderRadius: 10, padding: '10px 18px', color: '#00e5ff',
                fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}>
                Yes, add requester profile
              </button>
            )}
          </div>

          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#96a0b8', marginBottom: 28, lineHeight: 1.5 }}>
            You can always switch between your roles or add new ones from the role switcher in your portal.
          </p>

          {/* Terms */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
            <input type="checkbox" checked={agreeTerms} onChange={(e) => { setAgreeTerms(e.target.checked); setTermsError(false); }}
              style={{ accentColor: '#00e5ff', width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#f0f2f8', lineHeight: 1.5 }}>
              I have read and agree to signpost&apos;s{' '}
              <a href="/policies" target="_blank" rel="noopener noreferrer" style={{ color: '#00e5ff', textDecoration: 'none' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="/policies" target="_blank" rel="noopener noreferrer" style={{ color: '#00e5ff', textDecoration: 'none' }}>Platform Booking Policy</a>
            </span>
          </label>

          {termsError && (
            <div style={{
              background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.2)',
              borderRadius: 10, padding: '10px 14px', color: '#ff6b85',
              fontFamily: "'Inter', sans-serif", fontSize: 13, marginBottom: 20,
            }}>
              Please agree to the terms before continuing.
            </div>
          )}

          {missingFieldsError && (
            <div style={{
              background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.2)',
              borderRadius: 10, padding: '12px 16px', color: '#ff6b85',
              fontFamily: "'Inter', sans-serif", fontSize: 13, marginBottom: 16, lineHeight: 1.5,
            }}>
              {missingFieldsError}
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(255,107,133,0.08)', border: '1px solid rgba(255,107,133,0.2)',
              borderRadius: 10, padding: '12px 16px', color: '#ff6b85',
              fontFamily: "'Inter', sans-serif", fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <PrimaryButton onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Create my profile'}
          </PrimaryButton>
          <div style={{ marginTop: 8 }}>
            <OutlineButton onClick={() => goToSection(7)}>Back</OutlineButton>
          </div>
        </FormCard>
      </SectionWrapper>
    );
  }

  /* ─── Section 9: Done ─── */

  if (section === 9) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>
          {/* Cyan checkmark circle */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 775, fontSize: 27, color: '#f0f2f8', margin: '0 0 8px' }}>
            You&apos;re all set!
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', margin: '0 0 32px' }}>
            Your profile is live. Here is what to do next:
          </p>

          {/* Action cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', marginBottom: 32 }}>
            <div style={{
              background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,229,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: '#f0f2f8' }}>
                  Build your preferred interpreter team
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, color: '#96a0b8', marginTop: 4 }}>
                  Add interpreters you trust for teaming and referrals.
                </div>
              </div>
            </div>

            <div style={{
              background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,229,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: '#f0f2f8' }}>
                  Share your Book Me link
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, color: '#96a0b8', marginTop: 4 }}>
                  Give clients a direct way to request you.
                </div>
              </div>
            </div>

            <div style={{
              background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,229,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: '#f0f2f8' }}>
                  Browse the directory
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, color: '#96a0b8', marginTop: 4 }}>
                  See how your profile appears and explore other interpreters.
                </div>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <a href="/interpreter/dashboard" style={{
            display: 'block', width: '100%', padding: '14px 0', borderRadius: 10,
            background: '#00e5ff', color: '#0a0a0f', textAlign: 'center',
            fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14.5,
            textDecoration: 'none', marginBottom: 8,
          }}>
            Go to my dashboard
          </a>
          <a href="/directory" style={{
            display: 'block', width: '100%', padding: '14px 0', borderRadius: 10,
            background: 'transparent', border: '1px solid rgba(0,229,255,0.3)',
            color: '#00e5ff', textAlign: 'center',
            fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13.5,
            textDecoration: 'none',
          }}>
            Browse the directory
          </a>
        </div>
      </div>
    );
  }

  /* ─── Fallback ─── */

  return null;
}

/* ─── Export ─── */

export default function SignupClient() {
  return (
    <Suspense fallback={null}>
      <InterpreterSignupForm />
    </Suspense>
  );
}
