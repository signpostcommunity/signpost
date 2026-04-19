'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { syncNameFields } from '@/lib/nameSync';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import PhoneInput from '@/components/ui/PhoneInput';
import { normalizePhone } from '@/lib/phone';
import LocationInput from '@/components/ui/LocationInput';
import type { LocationFields } from '@/components/ui/LocationInput';
import { getCountryName } from '@/lib/countries';

const TOTAL_STEPS = 4;

type RequesterType = 'organization' | 'personal_event' | null;

const ORG_TYPES = [
  'School', 'Healthcare', 'Government', 'Non-profit',
  'Legal', 'Corporate', 'Community', 'Event', 'Other',
];

const COMM_OPTIONS = ['Email', 'Text/SMS', 'Video Phone', 'Phone Call'];

interface FormData {
  requesterType: RequesterType;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  state: string;
  zip: string;
  orgName: string;
  orgType: string;
  commPrefs: string[];
}

const defaultForm: FormData = {
  requesterType: null, firstName: '', lastName: '', email: '', password: '',
  phone: '', address: '', country: '', city: '', state: '', zip: '', orgName: '', orgType: '',
  commPrefs: ['Email'],
};

/* ── Progress Bar ── */

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
          <div key={idx} style={{
            flex: 1, height: 3, borderRadius: '2px',
            background: idx < step ? '#00e5ff' : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Step {step} of {TOTAL_STEPS}</div>
    </div>
  );
}

/* ── Form Card ── */

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="req-signup-form-card">
      {children}
    </div>
  );
}

/* ── Education Card Icons ── */

const CARD_ICONS: Record<string, React.ReactNode> = {
  'How do requests work?': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  'How are interpreters selected?': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  'What is the $15 booking fee?': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  'What about rates and billing?': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  ),
  'What if the Deaf person is not on signpost?': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
};

/* ── Cyan Down Arrow ── */

function CyanDownArrow() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    </div>
  );
}

/* ── Education Cards Data ── */

interface EducationCardData {
  title: string;
  body: React.ReactNode;
}

function RequestFlowBody() {
  return (
    <>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: 0 }}>
        You provide the event details (date, time, location, language needs) and tag the Deaf person.
      </p>
      <CyanDownArrow />
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: 0 }}>
        {"If that Deaf person is on signpost, their list of preferred interpreters will populate and make it easy to find someone the Deaf person already knows and trusts. (If they haven't yet created their preferred interpreter list, they will receive an invite to do so.)"}
      </p>
      <CyanDownArrow />
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: 0 }}>
        Your request goes out to interpreters, and they respond with their availability and rates. You review their responses, choose who to confirm, and the booking is set.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#c8cdd8', lineHeight: 1.7, margin: '12px 0 0' }}>
        Requests take just a couple of minutes to submit.
      </p>
    </>
  );
}

function InterpreterSelectionBody() {
  return (
    <>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        signpost is built around one idea: the Deaf person knows their communication access better than anyone.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        {"When you tag someone in your request, you will get access to their preferred interpreter list. These are interpreters the Deaf person has chosen based on real experience."}
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        If the Deaf person has not set up a preferred list yet, or if you need additional interpreters, you can browse the full directory and filter by language, specialization, location, and availability. You can send a request to up to 10 interpreters at a time.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: 0 }}>
        You are never locked into a single option. You always see who you are choosing and why.
      </p>
    </>
  );
}

function BookingFeeBody() {
  return (
    <>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        signpost&apos;s fee model is very different from the typical agency model. Agencies charge an <em>hourly</em> fee on top of the interpreter&apos;s rate. This can add anywhere from $20 to hundreds of dollars per hour, per interpreter, to your total cost.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        signpost charges a flat $15 booking fee for each interpreter confirmed on a booking. Whether your appointment is one hour or eight hours, the fee is the same.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        This fee covers the cost of building and maintaining the platform: the booking system, encrypted messaging, real-time notifications, and the interpreter directory.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 16px' }}>
        {"The interpreter sets their own rate and you will see it before you confirm. signpost does not add anything on top of the interpreter's rate. What the interpreter quotes is what you pay them directly."}
      </p>
      <div style={{ background: '#16161f', borderRadius: 10, padding: 16, margin: '0 0 16px' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#c8cdd8', lineHeight: 1.7, margin: 0 }}>
          Example: An interpreter quotes $85/hr for a 2-hour appointment. You pay the interpreter $170 directly, plus the $15 signpost booking fee. Total: $185.
        </p>
      </div>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        The $15 fee is only charged after you confirm your interpreter. Submitting a request is always free.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: 0 }}>
        If you are booking an interpreter for a personal event like a wedding or family reunion, signpost does not charge a booking fee.
      </p>
    </>
  );
}

function RatesBillingBody() {
  return (
    <>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        Every interpreter on signpost sets their own rates. When an interpreter responds to your request, you will see their rate, minimum hours, cancellation policy, and any additional terms before you confirm.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        {"There are no hidden fees. signpost does not add any markup on top of the interpreter's rate."}
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        After the appointment, the interpreter invoices you directly for their rate. You and the interpreter handle payment between yourselves, the same way you would with any independent contractor.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: 0 }}>
        {"signpost's only charge is the $15 booking fee, which is billed separately when you confirm."}
      </p>
    </>
  );
}

function DeafNotOnSignpostBody() {
  return (
    <>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        You can still use signpost to find and book interpreters, even if the Deaf person you are booking for does not have a signpost account. Tagging them on your request will send them an invitation to create their preferred list.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: '0 0 12px' }}>
        But you will also instantly be able to browse the interpreter directory, filter by the skills and language you need, and send your request directly.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#96a0b8', lineHeight: 1.7, margin: 0 }}>
        If the Deaf person does join signpost later, their preferences will automatically connect with yours, making future bookings even easier.
      </p>
    </>
  );
}

const EDUCATION_CARDS: EducationCardData[] = [
  { title: 'How do requests work?', body: <RequestFlowBody /> },
  { title: 'How are interpreters selected?', body: <InterpreterSelectionBody /> },
  { title: 'What is the $15 booking fee?', body: <BookingFeeBody /> },
  { title: 'What about rates and billing?', body: <RatesBillingBody /> },
  { title: 'What if the Deaf person is not on signpost?', body: <DeafNotOnSignpostBody /> },
];

/* ── Expandable Education Card ── */

function ExpandableEducationCard({ card, isOpen, onToggle }: {
  card: EducationCardData; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <div
        onClick={onToggle}
        style={{ padding: '16px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
          {CARD_ICONS[card.title]}
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15, color: '#f0f2f8' }}>
            {card.title}
          </div>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 2, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {isOpen && (
        <div style={{ paddingBottom: 18 }}>
          {card.body}
        </div>
      )}
    </div>
  );
}

/* ── Auth Input ── */

function AuthInput({ label, type = 'text', value, onChange, placeholder, required = false }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-required={required ? 'true' : undefined}
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
        onBlur={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.15)')}
      />
    </div>
  );
}

/* ── Done Step ── */

function DoneStep() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [addedInterpreter, setAddedInterpreter] = useState(false);
  const [addedDeaf, setAddedDeaf] = useState(false);
  const [interpreterMsg, setInterpreterMsg] = useState('');
  const [deafMsg, setDeafMsg] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  async function handleAddRole(role: 'interpreter' | 'deaf') {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: upProfile } = await supabase
        .from('user_profiles')
        .select('pending_roles')
        .eq('id', user.id)
        .single();

      const current = (upProfile?.pending_roles as string[]) || [];
      if (!current.includes(role)) {
        await supabase
          .from('user_profiles')
          .update({ pending_roles: [...current, role] })
          .eq('id', user.id);
      }

      if (role === 'interpreter') {
        setAddedInterpreter(true);
        setInterpreterMsg('Interpreter profile will be ready to complete from your portal.');
      } else {
        setAddedDeaf(true);
        setDeafMsg('Deaf/DB/HH profile will be ready to complete from your portal.');
      }
    } catch (err) {
      console.error('Failed to add role:', err);
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      {/* Animated checkmark */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,229,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: show ? 'scale(1)' : 'scale(0.5)',
          opacity: show ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{
            transform: show ? 'scale(1)' : 'scale(0)',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
          }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      <h1 style={{
        fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 775,
        color: '#f0f2f8', marginBottom: 8,
        opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.4s ease 0.3s',
      }}>
        {"You're all set!"}
      </h1>
      <p style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '15px', color: '#96a0b8',
        marginBottom: 28, lineHeight: 1.6,
        opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 0.4s',
      }}>
        {"Your signpost account is ready. Here's what to do next:"}
      </p>

      {/* Action cards */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, textAlign: 'left',
        opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 0.5s',
      }}>
        {/* Card 1: Create first request */}
        <div style={{
          background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{
            width: 36, height: 36, minWidth: 36, borderRadius: 8,
            background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: '#f0f2f8', marginBottom: 3 }}>
              Create your first request
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: '#96a0b8', lineHeight: 1.5 }}>
              Browse the interpreter directory and send your first booking request.
            </div>
          </div>
        </div>

        {/* Card 2: Browse directory */}
        <div style={{
          background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{
            width: 36, height: 36, minWidth: 36, borderRadius: 8,
            background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: '#f0f2f8', marginBottom: 3 }}>
              Browse the interpreter directory
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: '#96a0b8', lineHeight: 1.5 }}>
              See interpreter profiles, credentials, specializations, and intro videos.
            </div>
          </div>
        </div>

        {/* Card 3: Connect with Deaf client */}
        <div style={{
          background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <div style={{
            width: 36, height: 36, minWidth: 36, borderRadius: 8,
            background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: '#f0f2f8', marginBottom: 3 }}>
              {"Connect with a Deaf client"}
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: '#96a0b8', lineHeight: 1.5 }}>
              {"Request access to a Deaf person's preferred interpreter list from your dashboard."}
            </div>
          </div>
        </div>
      </div>

      {/* Additional roles */}
      <div style={{
        textAlign: 'left', marginBottom: 28,
        opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 0.6s',
      }}>
        <FormCard>
          {/* Interpreter role */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20,
              color: '#f0f2f8', letterSpacing: '-0.01em', margin: '0 0 8px',
            }}>
              Are you also an interpreter?
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
              color: '#c8cdd8', lineHeight: 1.65, margin: '0 0 12px',
            }}>
              If you are also an interpreter, you can create an interpreter profile to receive requests and be listed in the directory. You can finish setting up your interpreter profile from your portal.
            </p>
            <button
              type="button"
              onClick={addedInterpreter ? undefined : () => handleAddRole('interpreter')}
              style={{
                padding: '10px 20px', background: addedInterpreter ? 'rgba(0,229,255,0.08)' : 'transparent',
                border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff',
                borderRadius: 10, fontFamily: "'Inter', sans-serif",
                fontWeight: 600, fontSize: 13.5, cursor: addedInterpreter ? 'default' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              {addedInterpreter && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {addedInterpreter ? 'Interpreter profile added' : 'Yes, add interpreter profile'}
            </button>
            {interpreterMsg && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#96a0b8', marginTop: 8, marginBottom: 0 }}>
                {interpreterMsg}
              </p>
            )}
          </div>

          {/* Deaf role */}
          <div>
            <h2 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20,
              color: '#f0f2f8', letterSpacing: '-0.01em', margin: '0 0 8px',
            }}>
              Are you Deaf, DeafBlind, or Hard of Hearing?
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
              color: '#c8cdd8', lineHeight: 1.65, margin: '0 0 12px',
            }}>
              If you are Deaf, DeafBlind, or Hard of Hearing, you can also create your Deaf/DB/HH profile to build your preferred interpreter list, share your request link, and book interpreters for personal events. signpost does not charge a booking fee for personal events.
            </p>
            <button
              type="button"
              onClick={addedDeaf ? undefined : () => handleAddRole('deaf')}
              style={{
                padding: '10px 20px', background: addedDeaf ? 'rgba(0,229,255,0.08)' : 'transparent',
                border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff',
                borderRadius: 10, fontFamily: "'Inter', sans-serif",
                fontWeight: 600, fontSize: 13.5, cursor: addedDeaf ? 'default' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              {addedDeaf && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {addedDeaf ? 'Deaf/DB/HH profile added' : 'Yes, add Deaf/DB/HH profile'}
            </button>
            {deafMsg && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#96a0b8', marginTop: 8, marginBottom: 0 }}>
                {deafMsg}
              </p>
            )}
          </div>
        </FormCard>
      </div>

      {/* Bottom buttons */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        opacity: show ? 1 : 0, transition: 'opacity 0.4s ease 0.7s',
      }}>
        <button
          onClick={() => { router.refresh(); router.push('/request/dashboard'); }}
          style={{
            width: '100%', padding: '14px 24px', background: '#00e5ff', color: '#0a0a0f',
            border: 'none', borderRadius: 10, fontFamily: "'Inter', sans-serif",
            fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
          }}
        >
          Go to my dashboard
        </button>
        <Link
          href="/directory?context=requester"
          style={{
            display: 'block', width: '100%', padding: '10px 20px',
            background: 'transparent', border: '1px solid rgba(0,229,255,0.3)',
            color: '#00e5ff', borderRadius: 10,
            fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13.5,
            textAlign: 'center', textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          Browse the interpreter directory
        </Link>
      </div>
    </div>
  );
}

/* ── Shared styles ── */

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 600,
  color: '#00e5ff', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  fontFamily: "'Inter', sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#16161f', border: '1px solid rgba(0,229,255,0.15)',
  borderRadius: 10, padding: '11px 14px', color: '#f0f2f8',
  fontSize: '14px', outline: 'none', fontFamily: "'Inter', sans-serif",
};

/* ── Main Component ── */

export default function RequestSignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddRole = searchParams.get('addRole') === 'true';
  const [step, setStep] = useState(isAddRole ? 2 : 1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [openCard, setOpenCard] = useState<number | null>(null);

  // Redirect authenticated users who already have a requester profile
  useEffect(() => {
    if (isAddRole) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('requester_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profile) {
          window.location.href = '/request/dashboard';
        }
      } catch (e) {
        console.error('Auth redirect check failed:', e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill from existing profile when adding a role
  useEffect(() => {
    if (!isAddRole) return;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/request/login';
        return;
      }
      setExistingUserId(user.id);
      const { data: up } = await supabase.from('user_profiles').select('email').eq('id', user.id).single();
      if (up?.email) setForm(prev => ({ ...prev, email: up.email }));
      if (user.user_metadata?.full_name) {
        const parts = (user.user_metadata.full_name as string).split(' ');
        setForm(prev => ({
          ...prev,
          firstName: prev.firstName || parts[0] || '',
          lastName: prev.lastName || parts.slice(1).join(' ') || '',
          email: prev.email || user.email || '',
        }));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleComm(pref: string) {
    setForm(prev => ({
      ...prev,
      commPrefs: prev.commPrefs.includes(pref)
        ? prev.commPrefs.filter(p => p !== pref)
        : [...prev.commPrefs, pref],
    }));
  }

  function canContinue() {
    if (step === 1) return true;
    if (step === 2) return form.requesterType !== null;
    if (step === 3) {
      const passwordValid = isAddRole || (form.password && form.password.length >= 6);
      const baseValid = form.firstName && form.email && passwordValid && form.country && form.city;
      if (form.requesterType === 'organization') return baseValid && form.orgName;
      return baseValid;
    }
    return true;
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);

    const supabase = createClient();

    let userId: string;

    if (isAddRole && existingUserId) {
      userId = existingUserId;
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (authError || !authData.user) {
        setError(authError?.message || 'Failed to create account');
        setLoading(false);
        return;
      }

      userId = authData.user.id;

      const { error: upError } = await supabase.from('user_profiles').insert({
        id: userId,
        role: 'requester',
        email: form.email.trim().toLowerCase(),
      });
      if (upError) {
        setError('Failed to create user profile: ' + upError.message);
        setLoading(false);
        return;
      }
    }

    const { normalizeProfileFields } = await import('@/lib/normalize');
    const norm = normalizeProfileFields({ first_name: form.firstName, last_name: form.lastName, city: form.city, state: form.state });
    const normFirst = (norm.first_name as string) || form.firstName;
    const normLast = (norm.last_name as string) || form.lastName;
    const normDisplayName = `${normFirst} ${normLast}`.trim() || form.email;
    const { error: rpError } = await supabase.from('requester_profiles').insert(syncNameFields({
      id: userId,
      user_id: userId,
      first_name: normFirst,
      last_name: normLast,
      email: form.email.trim().toLowerCase(),
      phone: form.phone ? (normalizePhone(form.phone) || form.phone) : null,
      address: form.address || null,
      country: form.country || null,
      country_name: getCountryName(form.country) || form.country || null,
      city: (norm.city as string) || form.city,
      state: (norm.state as string) || form.state || null,
      zip: form.zip || null,
      location: [(norm.city as string) || form.city, (norm.state as string) || form.state].filter(Boolean).join(', ') || null,
      org_name: form.requesterType === 'organization' ? form.orgName : null,
      org_type: form.requesterType === 'organization' ? form.orgType : null,
      requester_type: form.requesterType,
      comm_prefs: JSON.stringify(form.commPrefs),
    }));
    if (rpError) {
      setError('Failed to create requester profile: ' + rpError.message);
      setLoading(false);
      return;
    }

    // Clean up pending_roles if adding a role
    if (isAddRole) {
      try {
        const { data: upProfile } = await supabase
          .from('user_profiles')
          .select('pending_roles')
          .eq('id', userId)
          .single();
        if (upProfile?.pending_roles?.includes('requester')) {
          const updated = (upProfile.pending_roles as string[]).filter((r: string) => r !== 'requester');
          await supabase
            .from('user_profiles')
            .update({ pending_roles: updated })
            .eq('id', userId);
        }
      } catch (e) {
        console.error('Failed to clean pending_roles:', e);
      }
    }

    // Create Stripe customer (fire-and-forget)
    fetch('/api/stripe/customer', { method: 'POST' }).catch(() => {});

    // Suppress unused variable warning
    void normDisplayName;

    setStep(4);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px 80px', position: 'relative' as const, zIndex: 1 }}>
      {/* Back link */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/request" style={{ fontSize: '0.85rem', color: 'var(--muted)', textDecoration: 'none' }}>
          &#8592; Back to request portal
        </Link>
      </div>

      {/* Progress bar (hidden on done step) */}
      {step < 4 && <ProgressBar step={step} />}

      {/* ════════ STEP 1: Education Cards ════════ */}
      {step === 1 && (
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 775, color: '#f0f2f8', marginBottom: '6px' }}>
            How signpost works
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '15px', color: '#96a0b8', marginBottom: '24px' }}>
            These explain how signpost is different. Read what interests you.
          </p>

          <FormCard>
            {EDUCATION_CARDS.map((card, idx) => (
              <ExpandableEducationCard
                key={card.title}
                card={card}
                isOpen={openCard === idx}
                onToggle={() => setOpenCard(openCard === idx ? null : idx)}
              />
            ))}

            <button
              onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{
                width: '100%', padding: '14px 24px', marginTop: 24,
                background: '#00e5ff', color: '#0a0a0f',
                border: 'none', borderRadius: 10, fontFamily: "'Inter', sans-serif",
                fontWeight: 600, fontSize: 14.5, cursor: 'pointer',
              }}
            >
              {"Got it, let's set up my account"}
            </button>
          </FormCard>
        </div>
      )}

      {/* ════════ STEP 2: Role Selection ════════ */}
      {step === 2 && (
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 775, color: '#f0f2f8', marginBottom: '6px' }}>
            Your Role
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '15px', color: '#96a0b8', marginBottom: '28px' }}>
            Select the option that best describes you.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {/* Organization / Institution */}
            <button
              type="button"
              onClick={() => update('requesterType', 'organization')}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                width: '100%', textAlign: 'left', padding: '20px',
                background: 'var(--surface)',
                border: `1px solid ${form.requesterType === 'organization' ? '#00e5ff' : 'rgba(0,229,255,0.15)'}`,
                borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'rgba(0,229,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <path d="M9 22v-4h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: 4 }}>
                  Organization / Institution
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '14px', color: '#96a0b8', lineHeight: 1.5 }}>
                  Schools, hospitals, courts, companies, non-profits, and other organizations that book interpreters.
                </div>
              </div>
            </button>

            {/* Deaf / Hard of Hearing - redirects */}
            <button
              type="button"
              onClick={() => router.push('/dhh/signup')}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                width: '100%', textAlign: 'left', padding: '20px',
                background: 'var(--surface)',
                border: '1px solid rgba(0,229,255,0.15)',
                borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'rgba(157,135,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <path d="M9 9h.01M15 9h.01" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: 4 }}>
                  Deaf / Hard of Hearing
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '14px', color: '#96a0b8', lineHeight: 1.5 }}>
                  If you are Deaf, DeafBlind, or Hard of Hearing, create your account through our Deaf/DB/HH portal. signpost does not charge a booking fee for personal events.
                </div>
              </div>
            </button>

            {/* Personal Event */}
            <button
              type="button"
              onClick={() => update('requesterType', 'personal_event')}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                width: '100%', textAlign: 'left', padding: '20px',
                background: 'var(--surface)',
                border: `1px solid ${form.requesterType === 'personal_event' ? '#00e5ff' : 'rgba(0,229,255,0.15)'}`,
                borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'rgba(0,229,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '15px', color: '#f0f2f8', marginBottom: 4 }}>
                  Personal Event
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '14px', color: '#96a0b8', lineHeight: 1.5 }}>
                  Weddings, parties, conferences, or other events where you need an interpreter.
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ════════ STEP 3: Account Details ════════ */}
      {step === 3 && (
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '27px', fontWeight: 775, color: '#f0f2f8', marginBottom: '6px' }}>
            Create your account
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '15px', color: '#96a0b8', marginBottom: '24px' }}>
            {"We'll use this to create your signpost account."}
          </p>

          <FormCard>
            {/* Google OAuth */}
            {!isAddRole && (
              <>
                <GoogleSignInButton role="requester" />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#96a0b8' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Org fields (conditional) */}
              {form.requesterType === 'organization' && (
                <>
                  <AuthInput label="Organization Name *" value={form.orgName} onChange={v => update('orgName', v)} placeholder="Acme Healthcare" required />
                  <div>
                    <label style={labelStyle}>Organization Type</label>
                    <select
                      value={form.orgType}
                      onChange={e => update('orgType', e.target.value)}
                      className="signup-select"
                      style={{
                        ...inputStyle,
                        appearance: 'none' as const,
                        WebkitAppearance: 'none' as const,
                      }}
                    >
                      <option value="">Select type...</option>
                      {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Name row */}
              <div className="signup-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AuthInput label="First Name *" value={form.firstName} onChange={v => update('firstName', v)} placeholder="Alex" required />
                <AuthInput label="Last Name" value={form.lastName} onChange={v => update('lastName', v)} placeholder="Rivera" />
              </div>

              <PhoneInput
                label="Phone"
                value={form.phone}
                onChange={v => update('phone', v)}
                defaultCountry={form.country || 'US'}
                accent="cyan"
              />
              <AuthInput label="Email *" type="email" value={form.email} onChange={v => update('email', v)} placeholder="you@example.com" required />

              {/* Location */}
              <LocationInput
                address={form.address}
                city={form.city}
                state={form.state}
                zip={form.zip}
                country={form.country}
                onChange={(loc: LocationFields) => {
                  update('address', loc.address)
                  update('city', loc.city)
                  update('state', loc.state)
                  update('zip', loc.zip)
                  update('country', loc.country)
                }}
                showLocationName={false}
                showMeetingLink={false}
                defaultCountry="US"
                accent="cyan"
              />

              {/* Communication Preferences */}
              <div>
                <label style={labelStyle}>Preferred Communication Method</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {COMM_OPTIONS.map(pref => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => toggleComm(pref)}
                      style={{
                        padding: '8px 16px', borderRadius: 10,
                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s', fontFamily: "'Inter', sans-serif",
                        background: form.commPrefs.includes(pref) ? 'rgba(0,229,255,0.12)' : 'transparent',
                        border: form.commPrefs.includes(pref) ? '1px solid rgba(0,229,255,0.4)' : '1px solid rgba(0,229,255,0.15)',
                        color: form.commPrefs.includes(pref) ? '#00e5ff' : '#96a0b8',
                      }}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              {!isAddRole && (
                <AuthInput label="Password *" type="password" value={form.password} onChange={v => update('password', v)} placeholder="Minimum 6 characters" required />
              )}
            </div>
          </FormCard>

          {/* Already have an account */}
          {!isAddRole && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#96a0b8', textAlign: 'center', marginTop: 20 }}>
              Already have an account?{' '}
              <Link href="/request/login" style={{ color: '#00e5ff', textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          )}
        </div>
      )}

      {/* ════════ STEP 4: Done ════════ */}
      {step === 4 && <DoneStep />}

      {/* Navigation (steps 2-3; step 1 has its own CTA, step 4 is done) */}
      {step > 1 && step < 4 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              background: 'none', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 10,
              padding: '10px 20px', color: 'var(--muted)',
              fontSize: '0.9rem', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            &#8592; Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => {
                setError('');
                setStep(s => s + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={!canContinue()}
              style={{
                padding: '10px 24px', background: '#00e5ff', color: '#0a0a0f',
                border: 'none', borderRadius: 10, fontFamily: "'Inter', sans-serif",
                fontWeight: 600, fontSize: 14.5, cursor: canContinue() ? 'pointer' : 'default',
                opacity: canContinue() ? 1 : 0.4,
              }}
            >
              Continue &#8594;
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canContinue()}
              style={{
                padding: '10px 24px', background: '#00e5ff', color: '#0a0a0f',
                border: 'none', borderRadius: 10, fontFamily: "'Inter', sans-serif",
                fontWeight: 600, fontSize: 14.5, cursor: (loading || !canContinue()) ? 'default' : 'pointer',
                opacity: (loading || !canContinue()) ? 0.4 : 1,
              }}
            >
              {loading ? 'Creating account...' : 'Create Account \u2192'}
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 16, background: 'rgba(255,107,133,0.1)',
          border: '1px solid rgba(255,107,133,0.3)', borderRadius: 10,
          padding: '12px 16px', color: 'var(--accent3)', fontSize: '0.85rem',
        }}>
          {error}
        </div>
      )}

      {/* Styles */}
      <style>{`
        .req-signup-form-card {
          background: #111118;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 32px;
        }
        @media (max-width: 640px) {
          .req-signup-form-card { padding: 20px; }
          .signup-name-row { grid-template-columns: 1fr !important; }
          .signup-location-row { grid-template-columns: 1fr !important; }
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
