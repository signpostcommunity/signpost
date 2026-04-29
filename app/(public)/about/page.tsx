'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import VideoPreviewModal from '@/components/directory/VideoPreviewModal';

const FOUNDER_VIDEOS: { regina: string | null; molly: string | null } = {
  regina: null,
  molly: null,
};

function FounderVideoSlot({ name, videoUrl, onOpen }: { name: string; videoUrl: string | null; onOpen: () => void }) {
  if (videoUrl) {
    return (
      <button
        type="button"
        onClick={onOpen}
        style={{
          marginTop: 14, background: 'none', border: 'none', padding: 0,
          color: '#00e5ff', fontFamily: 'var(--font-dm-sans), Inter, sans-serif',
          fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
        }}
      >
        {'\u25B6'} Watch {name}&apos;s intro
      </button>
    );
  }
  return (
    <div style={{
      marginTop: 14, fontFamily: 'Inter, var(--font-dm-sans), sans-serif',
      fontWeight: 400, fontSize: 13, color: '#96a0b8',
    }}>
      Video coming soon
    </div>
  );
}

const TABS = [
  { id: 'about', label: 'About Us' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'social', label: 'Social Commitment' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact Us' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface FaqItem {
  q: string
  a: string | 'RICH'
  rich?: React.ReactNode
}

interface FaqSection {
  title: string
  items: FaqItem[]
}

const faqSections: FaqSection[] = [
  {
    title: 'GENERAL',
    items: [
      {
        q: 'How does signpost work?',
        a: 'RICH',
        rich: (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 12px' }}>
              signpost connects Deaf, DeafBlind, and Hard of Hearing individuals and organizations directly with sign language interpreters. No agency in the middle.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 12px' }}>
              Browse the interpreter directory to find interpreters by language, specialization, location, and credentials. Deaf clients build preferred interpreter lists that travel with them. When someone needs an interpreter, they send a request directly to the interpreters they choose. Interpreters respond with their availability and rates. The requester confirms, and the interpreter and client work together directly from that point forward.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
              signpost charges a flat $15 booking fee for each interpreter confirmed on a booking. That&apos;s it. No markup on interpreter rates. No commissions. No hidden fees.
            </p>
          </>
        ),
      },
      {
        q: 'Who is signpost for?',
        a: 'RICH',
        rich: (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 12px' }}>
              <strong style={{ color: 'var(--text)' }}>Interpreters</strong> who want to set their own rates, manage their own clients, and connect directly with the people they work with, with no agency fees added on top.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 12px' }}>
              <strong style={{ color: 'var(--text)' }}>Deaf, DeafBlind, and Hard of Hearing individuals</strong> who want to choose their own interpreters, build a preferred team, and have their preferences respected when someone books on their behalf.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
              <strong style={{ color: 'var(--text)' }}>Organizations, schools, medical offices, and event coordinators</strong> who need to book interpreters and want a transparent, affordable alternative to traditional agencies.
            </p>
          </>
        ),
      },
      {
        q: 'How is signpost different from an agency?',
        a: 'RICH',
        rich: (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 12px' }}>
              Traditional agencies add their own fees on top of the interpreter&apos;s rate. Interpreters are typically not told what the agency charges the client, but the markup is often significant. Many agencies also cap what interpreters can charge, limiting their ability to set rates that reflect their experience and specialization.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
              signpost works differently. Interpreters set their own rates and terms with no cap. The requester sees exactly what the interpreter charges and pays the interpreter directly. signpost&apos;s only fee is a flat $15 for each interpreter confirmed on a booking, charged to the requester. There is no markup, no commission, and no percentage taken from either side.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: 'PRICING AND FEES',
    items: [
      {
        q: 'How much does signpost cost?',
        a: 'RICH',
        rich: (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 8px' }}>
              For requesters and organizations: Agencies charge an <em>hourly</em> fee on top of the interpreter&apos;s rate. That fee can range from about $20 to $80+ per hour. signpost charges a flat $15 booking fee for each interpreter confirmed on a booking. This covers the cost of building and running the platform: the booking system, encrypted messaging, notifications, and the interpreter directory. That is the only fee signpost collects, ever. The interpreter&apos;s rate is separate. Each interpreter communicates their rate directly to you during the request process and invoices you independently. signpost does not add any fees on top of interpreter rates.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 8px' }}>
              For interpreters: signpost is completely free. No listing fees, no subscription, no commission. You set your own rates and are paid directly by the requester.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
              For Deaf, DeafBlind, and Hard of Hearing individuals: browse the directory, build your preferred interpreter list, rate interpreters, and request interpreters for personal events. signpost never charges a booking fee for personal events.
            </p>
          </>
        ),
      },
      {
        q: 'What does the $15 fee cover?',
        a: 'The $15 platform fee covers the cost of running signpost. It is charged to the requester (the organization or individual booking the interpreter). signpost does not add any percentage or markup on top of the interpreter\'s rate. 100% of the interpreter\'s rate goes directly to the interpreter.',
      },
      {
        q: 'How does multi-day or multi-interpreter pricing work?',
        a: 'Each booking covers a single event or session (maximum 24 hours). For multi-day events, submit a separate request for each day. For events needing multiple interpreters, each interpreter is a separate booking. Examples: 1 interpreter for a 2-hour meeting = $15. 2 interpreters for a full-day conference = $30. 2 interpreters for a 3-day event = $90.',
      },
      {
        q: 'When is the $15 fee charged?',
        a: 'Only after you confirm your interpreter. Submitting a request is free. If no interpreter responds or you cancel before confirming, you are not charged.',
      },
      {
        q: 'What happens if I cancel a booking?',
        a: 'If the requester cancels: the $15 fee is non-refundable. If the interpreter cancels: the requester receives a $15 credit valid for 12 months.',
      },
    ],
  },
  {
    title: 'FOR INTERPRETERS',
    items: [
      {
        q: 'Do I need to be certified to sign up?',
        a: 'RICH',
        rich: (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 12px' }}>
              No. signpost is open to all interpreters regardless of certification status. Credentials are self-reported. You can earn a Verified badge by uploading documentation or linking to a certifying body like RID.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 12px' }}>
              That said, interpreters on signpost are responsible for only accepting work for which they are duly qualified, regardless of certification status. All interpreters are expected to follow professional ethics and conduct standards, such as those outlined by the{' '}
              <a href="https://rid.org/programs/ethics/code-of-professional-conduct/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Registry of Interpreters for the Deaf Code of Professional Conduct</a>{' '}
              or similar standards set for their working languages.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 12px' }}>
              signpost reserves the right to remove interpreters who receive reports of unprofessional behavior, or who show a pattern of accepting work for which they are unqualified.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
              New to the field or working toward certification? Check out the mentorship directory on signpost to connect with experienced interpreters who can help you develop your skills and prepare.
            </p>
          </>
        ),
      },
      {
        q: 'Can requesters see my rates before booking?',
        a: 'Requesters see your rate profiles when you respond to their inquiry. You choose which rate profile to send. Your rates are not publicly displayed in the directory.',
      },
      {
        q: 'Do I have to use signpost\'s invoicing?',
        a: 'No. You can use your own invoicing tools or use signpost\'s free built-in invoicing. This is your client relationship. You can change your preference at any time.',
      },
      {
        q: 'How do I get paid?',
        a: 'RICH',
        rich: (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 12px' }}>
              The requester pays you directly using whatever payment method you prefer. signpost is not involved in payment processing between you and the requester.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
              The requester pays a $15 booking fee directly to signpost in a separate transaction. signpost does not earn any additional fees or commissions from any party.
            </p>
          </>
        ),
      },
      {
        q: 'What if I need to cancel a booking?',
        a: 'If you cancel, the requester receives a $15 signpost credit. We understand things come up, but repeated cancellations are tracked and may affect your visibility on the platform.',
      },
      {
        q: 'How do preferred interpreter lists work?',
        a: 'Deaf clients can add you to their preferred list. When someone books an interpreter for that Deaf person, your name appears first. Being on preferred lists is one of the best ways to get consistent bookings.',
      },
      {
        q: 'What is the mentorship directory on signpost?',
        a: 'The mentorship directory connects both novice and seasoned interpreters who are looking to hone their skills in any area, from voicing skills to establishing a freelance business. You can offer mentorship, seek it, or both. Choose your knowledge areas, indicate whether you offer paid or pro bono mentorship, and get matched with interpreters who complement your experience. Mentorship is only visible to other interpreters.',
      },
      {
        q: 'What is the Book Me badge?',
        a: 'When someone clicks on your badge or custom URL, they are directed to your personal booking page. Add it to your email signature, LinkedIn, or share directly with anyone who would like to book you. signpost makes it easy to manage your direct-book work in one place.',
      },
    ],
  },
  {
    title: 'FOR DEAF/DB/HH USERS',
    items: [
      {
        q: 'Is signpost really free for me?',
        a: 'Yes. No fees, no credit card required. You can browse the directory, build your preferred interpreter list, request interpreters for personal events, and rate your experiences. All free, always.',
      },
      {
        q: 'How do I build my preferred interpreter list?',
        a: 'Browse the interpreter directory, watch intro videos, and add interpreters you trust. If your favorite interpreter isn\'t on signpost yet, you can send them an invitation directly from the platform.',
      },
      {
        q: 'Can my employer or doctor see my preferred list?',
        a: 'When you share your signpost profile with someone who books interpreters for you, they can see your preferred interpreter list and your communication preferences. They cannot see your ratings. You control who gets access by sharing your QR code or custom URL.',
      },
      {
        q: 'Are my ratings really private?',
        a: 'Yes. Your ratings are confidential. They are never shared with interpreters and never visible on public profiles. Only you and signpost administrators can see interpreter ratings. signpost only receives anonymous rating information in order to protect your confidentiality. Administrators use aggregate rating data to maintain platform quality. Interpreters who receive consistently high ratings may be highlighted, and interpreters who receive consistently concerning ratings may be flagged for skill-development or removal from the platform.',
      },
      {
        q: 'Can I request an interpreter for a personal event?',
        a: 'Yes. Submit a request to your preferred interpreters directly from your portal for weddings, family reunions, private appointments, or any personal event. You will discuss rates with the interpreter directly. signpost never charges a booking fee for personal requests.',
      },
      {
        q: 'What if my favorite interpreters aren\'t on signpost yet?',
        a: 'Send them an invitation directly from the platform to let them know you want to add them to your preferred interpreter list. They\'ll receive an email invitation with a link to create their profile. Once they join, you will receive a notification and they will automatically be added to your preferred list.',
      },
    ],
  },
  {
    title: 'FOR REQUESTERS AND ORGANIZATIONS',
    items: [
      {
        q: 'How do I access a Deaf client\'s preferred interpreter list?',
        a: 'When you create a booking request, tag the Deaf person for whom you are requesting, using their phone number or email address. If they have a signpost profile, they will approve your access to their preferred interpreter list and communication preferences.',
      },
      {
        q: 'What if the Deaf client doesn\'t have a preferred list?',
        a: 'Browse the directory to find interpreters with the skill set you need. You can filter by language, specialization, location, credentials, and more. Send your request to up to 10 interpreters at a time.',
      },
      {
        q: 'How many interpreters do I need?',
        a: 'Jobs over 2 hours typically require 2 interpreters. This can vary based on job complexity, number and demographic of participants. Reach out to the interpreters you are requesting for recommendations specific to your request.',
      },
      {
        q: 'How do I book multiple interpreters for one event?',
        a: 'On the request form, select the number of interpreters required. This will create the corresponding number of booking instances, allowing you to confirm each interpreter individually. The $15 booking fee applies for each interpreter confirmed on a booking.',
      },
      {
        q: 'How quickly will interpreters respond?',
        a: 'Interpreters respond with their availability and rates in just a couple clicks. Most responses come within a few hours, though timing depends on the interpreter.',
      },
      {
        q: 'Does signpost add fees on top of the interpreter\'s rate?',
        a: 'No. The $15 flat fee is signpost\'s only charge. The interpreter sets their own rate and invoices you directly. signpost does not take a percentage or add any markup.',
      },
    ],
  },
  {
    title: 'PRIVACY AND SECURITY',
    items: [
      {
        q: 'How does signpost protect my data?',
        a: 'signpost uses AES-256-GCM encryption for sensitive booking information, including appointment titles, descriptions, and notes. All database tables are protected by row-level security policies that restrict data access to authorized users only. Message attachments are only accessible to conversation participants. Profile data is only visible to users with an active relationship to that profile (booking participants, preferred list connections, or administrators). All data is encrypted in transit via TLS. Storage buckets for private content (like message attachments) require authentication and verify participant status before granting access.',
      },
      {
        q: 'Is signpost HIPAA compliant?',
        a: 'RICH',
        rich: (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 12px' }}>
              signpost takes data security seriously and implements multiple layers of protection: application-level encryption (AES-256-GCM) for sensitive booking fields, row-level database security on every table, storage access controls restricted to authorized participants, and an audit log that tracks access to sensitive data. All data is encrypted in transit.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
              signpost is not currently a HIPAA-covered entity and has not executed a Business Associate Agreement (BAA) with its infrastructure provider. We are prepared to pursue formal HIPAA compliance when our platform requirements and customer needs call for it. If your organization requires HIPAA compliance, please contact us at{' '}
              <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>hello@signpost.community</a>{' '}
              to discuss your needs.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: 'ACCOUNT AND PLATFORM',
    items: [
      {
        q: 'Can I have multiple roles?',
        a: 'Yes. You can be an interpreter, a Deaf/DB/HH user, and a requester simultaneously. Use the role switcher (located in the sidebar of your dashboard) to move between portals. Each role has its own profile and dashboard.',
      },
      {
        q: 'What does "Deaf-Parented Interpreter / CODA" mean?',
        a: 'This designation indicates an interpreter who grew up with Deaf parents. CODAs (Children of Deaf Adults) often have native or near-native sign language fluency and deep cultural understanding of the Deaf community. On signpost, this is always displayed as "Deaf-Parented Interpreter / CODA."',
      },
      {
        q: 'How do I contact signpost?',
        a: 'RICH',
        rich: (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
            Email us at{' '}
            <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>hello@signpost.community</a>.
            We read every message.
          </p>
        ),
      },
    ],
  },
];

export default function AboutPage() {
  const searchParams = useSearchParams();
  const initialTab = TABS.some(t => t.id === searchParams.get('tab')) ? searchParams.get('tab') as TabId : 'about';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [founderVideoOpen, setFounderVideoOpen] = useState<null | 'regina' | 'molly'>(null);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  return (
    <div>
      {/* Tab bar header */}
      <div style={{ background: '#1a1a24', paddingTop: 48 }}>
        <div className="about-tab-header" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>
          <h1 style={{
            fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
            fontWeight: 775, letterSpacing: '-0.03em', lineHeight: 1.3,
            color: 'var(--text)', marginBottom: 32,
          }}>
            About signpost
          </h1>
          <div role="tablist" aria-label="About page sections" style={{
            display: 'flex', gap: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontFamily: 'var(--font-syne)', fontSize: '0.82rem', fontWeight: 600,
                  letterSpacing: '0.02em', padding: '12px 20px',
                  background: activeTab === tab.id ? '#000' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text)' : 'var(--muted)',
                  border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content area */}
      <div style={{ background: 'var(--bg)', minHeight: '60vh' }}>
        <div className="about-tab-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 40px 80px' }}>

          {/* Tab 1: About Us */}
          <div
            role="tabpanel"
            id="panel-about"
            aria-labelledby="tab-about"
            hidden={activeTab !== 'about'}
          >
            {/* Hero: photo left, all text right */}
            <div className="about-hero-grid" style={{
              display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 48,
              alignItems: 'center', marginBottom: 56,
            }}>
              <div className="about-hero-photo" style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <Image
                  src="/founders-together.png"
                  alt="Regina McGinnis and Molly Sano-Mahgoub, co-founders of signpost"
                  width={600}
                  height={800}
                  className="rounded-xl object-cover"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="about-hero-text" style={{ paddingRight: 96 }}>
                <h2 style={{
                  fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
                  fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 20,
                  color: 'var(--text)',
                }}>
                  We&apos;re building{' '}
                  <em style={{
                    fontStyle: 'normal',
                    background: 'linear-gradient(135deg, #a78bfa, var(--accent))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>the platform we&apos;ve always dreamt of</em>, but never thought possible.
                </h2>
                <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.75 }}>
                  signpost grew out of conversations between two best friends: a certified interpreter and a Deaf mental health professional, about something they&apos;d both been frustrated by for years.
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, marginTop: 14 }}>
                  Finding the right interpreter is harder than it should be. Deaf people often have to rely on whoever an agency sends, with little visibility into that person&apos;s signing style, cultural background, or specialization. Too often, the person who matters most has the least say in the decision.
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, marginTop: 14 }}>
                  We built signpost to change that. A place where interpreters present themselves fully and transparently, and where the Deaf community can make informed choices about who they work with.
                </p>
              </div>
            </div>

            {/* Founder cards */}
            <div style={{ marginBottom: 56 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
              }}>
                <div style={{
                  fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)',
                  whiteSpace: 'nowrap',
                }}>
                  The people behind it
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <div className="about-founders-grid" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
              }}>
                {/* Regina */}
                <div style={{
                  padding: 28, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ width: 136, height: 136, marginBottom: 16 }}>
                    <Image src="/regina-headshot.png" alt="Regina McGinnis" width={400} height={400} className="rounded-full object-cover" style={{ width: 136, height: 136 }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 2, color: 'var(--text)' }}>
                    Regina McGinnis
                  </div>
                  <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 14 }}>
                    Co-founder
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
                    A Deaf mental health professional with 20 years of experience, and mama to two CODAs. Regina brings the perspective
                    of someone who has spent decades navigating the interpreter booking process, and who has felt
                    the impact of poor fit, limited transparency, and lack of choice. Her experience is at the center
                    of how signpost is designed.
                  </p>
                  <FounderVideoSlot
                    name="Regina"
                    videoUrl={FOUNDER_VIDEOS.regina}
                    onOpen={() => setFounderVideoOpen('regina')}
                  />
                </div>

                {/* Molly */}
                <div style={{
                  padding: 28, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ width: 136, height: 136, marginBottom: 16 }}>
                    <Image src="/molly-headshot.jpg" alt="Molly Sano-Mahgoub" width={400} height={400} className="rounded-full object-cover" style={{ width: 136, height: 136 }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 2, color: 'var(--text)' }}>
                    Molly Sano-Mahgoub
                  </div>
                  <div style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 14 }}>
                    Co-founder
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
                    A certified ASL interpreter (RID NIC-Master) with 18 years of experience. Molly has seen the
                    interpreting process from every angle: as an interpreter, as a coordinator, as the spouse of a
                    Deaf person and the mother of a DeafBlind kiddo. She has seen that the current system
                    doesn&apos;t serve anyone well enough. With signpost she hopes to help change that.
                  </p>
                  <FounderVideoSlot
                    name="Molly"
                    videoUrl={FOUNDER_VIDEOS.molly}
                    onOpen={() => setFounderVideoOpen('molly')}
                  />
                </div>
              </div>
              <VideoPreviewModal
                isOpen={founderVideoOpen !== null}
                onClose={() => setFounderVideoOpen(null)}
                interpreterName={founderVideoOpen === 'regina' ? 'Regina McGinnis' : 'Molly Sano-Mahgoub'}
                videoUrl={founderVideoOpen ? FOUNDER_VIDEOS[founderVideoOpen] : null}
                interpreterId=""
              />
            </div>

            {/* Value cards */}
            <div style={{ marginBottom: 56 }}>
              <div style={{
                fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20,
              }}>
                Who signpost serves
              </div>
              <div className="about-values-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {[
                  { label: 'For the Deaf community', body: 'Build your personal roster of trusted interpreters. Track availability, set approvals, and always know who to call first.' },
                  { label: 'For interpreters', body: 'Take control of your career. Set your own rates, showcase your certifications, and connect directly with clients who need your expertise.' },
                  { label: 'For organizations', body: 'Find certified interpreters for any context: medical, legal, conference, academic. No agency markups, no slow processes.' },
                  { label: 'For everyone', body: 'Transparent credentials. Real profiles. Intro videos. Choose the right person, not just whoever responds the fastest to the agency.' },
                ].map((item) => (
                  <div key={item.label} style={{ padding: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--muted)' }}>{item.body}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 12, color: 'var(--text)' }}>
                Ready to get started?
              </h2>
              <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '0.9rem' }}>
                Browse the directory, create a profile, or submit your first request.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/directory" className="btn-primary btn-large" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  Browse Interpreter Directory
                </Link>
                <Link href="/request" style={{ display: 'inline-block', padding: '14px 24px', background: 'none', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', textDecoration: 'none', fontSize: '0.95rem' }}>
                  Request an Interpreter
                </Link>
              </div>
            </div>
          </div>

          {/* Tab: Pricing */}
          <div
            role="tabpanel"
            id="panel-pricing"
            aria-labelledby="tab-pricing"
            hidden={activeTab !== 'pricing'}
            style={{ maxWidth: 800, margin: '0 auto' }}
          >
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 32,
              color: 'var(--text)',
            }}>
              Pricing
            </h2>

            {/* Two-column: fee card + steps */}
            <div className="pricing-top-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48 }}>
              {/* Fee card */}
              <div style={{
                padding: 32, background: '#111118', border: '1px solid var(--border)',
                borderRadius: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>$15</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  for each interpreter confirmed on a booking
                </div>
                <div style={{ color: '#96a0b8', fontSize: '0.82rem', lineHeight: 1.6, marginTop: 12 }}>
                  Charged to the requester only. signpost never charges a booking fee for personal requests by Deaf/DB/HH individuals.
                </div>
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 600,
                  fontSize: 13, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16,
                }}>
                  How billing works
                </div>
                {[
                  'Submit a request (free)',
                  'Interpreters respond with rates',
                  'Confirm your interpreter',
                  '$15 fee charged',
                  'Interpreter invoices you directly',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, width: 20 }}>{i + 1}.</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.65 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Examples */}
            <div style={{ marginBottom: 48 }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600,
                fontSize: 13, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16,
              }}>
                Examples
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { desc: '1 interpreter for a 2-hour meeting', amount: '$15' },
                  { desc: '2 interpreters for a full-day conference', amount: '$30' },
                  { desc: '2 interpreters for a 3-day event (2 x 3 days)', amount: '$90' },
                  { desc: 'Weekly recurring appointment, 1 interpreter', amount: '$15/week' },
                ].map((ex, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.65 }}>{ex.desc}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem', flexShrink: 0 }}>{ex.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Free callouts */}
            <div className="pricing-free-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 48 }}>
              <div style={{
                padding: 24, background: '#111118', border: '1px solid var(--border)', borderRadius: 12,
              }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 600,
                  fontSize: 13, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8,
                }}>
                  Free for interpreters
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
                  No listing fee. No subscription. No commission.
                </p>
              </div>
              <div style={{
                padding: 24, background: '#111118', border: '1px solid var(--border)', borderRadius: 12,
              }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 600,
                  fontSize: 13, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8,
                }}>
                  Free for Deaf/DB/HH
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
                  No fees for personal use. No credit card required. Always free.
                </p>
              </div>
            </div>

            {/* Bottom paragraph */}
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, marginBottom: 48 }}>
              The platform fee is signpost&apos;s only charge. Interpreters set their own rates and invoice clients directly. signpost does not take a percentage or add any markup on top of interpreter rates.
            </p>

            {/* Cancellation */}
            <div style={{ marginBottom: 0 }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600,
                fontSize: 13, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16,
              }}>
                Cancellation policy
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, margin: '0 0 8px' }}>
                <strong style={{ color: 'var(--text)' }}>Requester cancels:</strong> The $15 fee is non-refundable.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, margin: 0 }}>
                <strong style={{ color: 'var(--text)' }}>Interpreter cancels:</strong> The requester receives a $15 credit valid for 12 months.
              </p>
            </div>
          </div>

          {/* Tab: Accessibility */}
          <div
            role="tabpanel"
            id="panel-accessibility"
            aria-labelledby="tab-accessibility"
            hidden={activeTab !== 'accessibility'}
            style={{ maxWidth: 800, margin: '0 auto' }}
          >
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 24,
              color: 'var(--text)',
            }}>
              Our Accessibility Commitment
            </h2>

            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, marginBottom: 48 }}>
              signpost is built for the Deaf, DeafBlind, and Hard of Hearing community. Accessibility isn&apos;t an afterthought. It&apos;s foundational to everything we build.
            </p>

            {/* Standards */}
            <div style={{ marginBottom: 40 }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600,
                fontSize: 13, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14,
              }}>
                Standards
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, margin: 0 }}>
                We meet or exceed Web Content Accessibility Guidelines 2.2 at the AAA conformance level across the entire platform.
              </p>
            </div>

            {/* Screen Reader Support */}
            <div style={{ marginBottom: 40 }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600,
                fontSize: 13, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14,
              }}>
                Screen reader support
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, margin: 0 }}>
                Semantic HTML, ARIA labels, and full keyboard navigation throughout.
              </p>
            </div>

            {/* DeafBlind */}
            <div style={{ marginBottom: 40 }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600,
                fontSize: 13, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14,
              }}>
                DeafBlind/High-Contrast Accessibility
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, margin: 0 }}>
                signpost aims to conform with WCAG AAA guidelines for website accessibility. These are the strictest standards for high-contrast web content. If you have any difficulty accessing our site, please reach out at{' '}
                <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>hello@signpost.community</a>.
              </p>
            </div>

            {/* Ongoing */}
            <div style={{ marginBottom: 48 }}>
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 600,
                fontSize: 13, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14,
              }}>
                Ongoing improvement
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, margin: 0 }}>
                Accessibility is never &quot;done.&quot; We continuously test and improve.
              </p>
            </div>

            {/* Callout */}
            <div style={{
              backgroundColor: 'rgba(0,229,255,0.04)', borderLeft: '3px solid #00e5ff',
              borderRadius: '0 8px 8px 0', padding: '16px 20px',
            }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, margin: 0 }}>
                If you experience any accessibility barriers on signpost, please reach out to us at{' '}
                <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  hello@signpost.community
                </a>
                . We take every concern seriously and will address it promptly.
              </p>
            </div>
          </div>

          {/* Tab: Social Commitment */}
          <div
            role="tabpanel"
            id="panel-social"
            aria-labelledby="tab-social"
            hidden={activeTab !== 'social'}
            style={{ maxWidth: 800, margin: '0 auto' }}
          >
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 24,
              color: 'var(--text)',
            }}>
              Our Social Commitment
            </h2>

            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, marginBottom: 20 }}>
              signpost exists because of the Deaf community, and we are committed to giving back to it. We believe that the platform we build should actively support the organizations, advocates, and educators who have been doing this work long before us.
            </p>

            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, marginBottom: 48 }}>
              Beyond the Deaf community, signpost stands in solidarity with all marginalized communities. We believe access to communication is a fundamental right, and we are committed to building a platform that reflects values of equity, inclusion, and justice for everyone.
            </p>

            {/* Community Partners */}
            <div style={{ marginBottom: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
              }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 600,
                  fontSize: 13, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--accent)',
                  whiteSpace: 'nowrap',
                }}>
                  Community Partners
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <div style={{
                padding: 32, background: '#111118', border: '1px solid var(--border)',
                borderRadius: 12, textAlign: 'center',
              }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, margin: '0 0 12px' }}>
                  We are building our community partnerships. If you represent an organization serving the Deaf community and would like to partner with signpost, we would love to hear from you.
                </p>
                <p style={{ margin: 0 }}>
                  <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600 }}>
                    hello@signpost.community
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Tab: FAQ */}
          <div
            role="tabpanel"
            id="panel-faq"
            aria-labelledby="tab-faq"
            hidden={activeTab !== 'faq'}
            style={{ maxWidth: 800, margin: '0 auto' }}
          >
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 32,
              color: 'var(--text)',
            }}>
              Frequently Asked Questions
            </h2>

            {faqSections.map((section) => (
              <div key={section.title} style={{ marginBottom: 40 }}>
                {/* Section header (L4) */}
                <div style={{
                  fontFamily: "'Inter', sans-serif", fontWeight: 600,
                  fontSize: 13, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8,
                }}>
                  {section.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {section.items.map((item, i) => {
                    const key = `${section.title}-${i}`
                    return (
                      <div key={key} style={{ borderBottom: '1px solid var(--border)' }}>
                        <button
                          onClick={() => setOpenFaq(openFaq === key ? null : key)}
                          aria-expanded={openFaq === key}
                          aria-controls={`faq-answer-${key}`}
                          style={{
                            width: '100%', textAlign: 'left', padding: '20px 0',
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                            minHeight: 44,
                          }}
                        >
                          <span style={{
                            fontFamily: 'var(--font-syne)', fontSize: '0.95rem', fontWeight: 700,
                            color: 'var(--text)', lineHeight: 1.4,
                          }}>
                            {item.q}
                          </span>
                          <span style={{
                            color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 700, flexShrink: 0,
                            transform: openFaq === key ? 'rotate(45deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}>
                            +
                          </span>
                        </button>
                        <div
                          id={`faq-answer-${key}`}
                          role="region"
                          aria-labelledby={`faq-q-${key}`}
                          hidden={openFaq !== key}
                          style={{ paddingBottom: openFaq === key ? 20 : 0 }}
                        >
                          {item.a === 'RICH' && item.rich ? (
                            <div>{item.rich}</div>
                          ) : (
                            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, margin: 0 }}>
                              {item.a}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Tab: Contact Us */}
          <div
            role="tabpanel"
            id="panel-contact"
            aria-labelledby="tab-contact"
            hidden={activeTab !== 'contact'}
            style={{ maxWidth: 800, margin: '0 auto' }}
          >
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 8,
              color: 'var(--text)',
            }}>
              Contact Us
            </h2>

            {contactSubmitted ? (
              <div style={{
                padding: '48px 32px', background: '#111118', border: '1px solid var(--border)',
                borderRadius: 12, textAlign: 'center', marginTop: 32,
              }}>
                <div style={{
                  fontFamily: 'var(--font-syne)', fontSize: '1.2rem', fontWeight: 700,
                  color: 'var(--text)', marginBottom: 12,
                }}>
                  Message sent
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: 20 }}>
                  Thank you for reaching out. We&apos;ll get back to you as soon as we can.
                </p>
                <button
                  onClick={() => { setContactSubmitted(false); setContactForm({ name: '', email: '', subject: '', message: '' }); }}
                  style={{
                    fontFamily: 'var(--font-syne)', fontSize: '0.85rem', fontWeight: 600,
                    padding: '10px 24px', background: 'none', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text)', cursor: 'pointer',
                  }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div className="contact-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32, marginTop: 32 }}>
                {/* Left: editorial intro */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: 8 }}>
                  <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.85, marginBottom: 24 }}>
                    Questions, feedback, partnership inquiries? We&apos;d love to hear from you.
                  </p>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontWeight: 600,
                      fontSize: 13, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10,
                    }}>
                      Email
                    </div>
                    <a href="mailto:hello@signpost.community" style={{
                      color: 'var(--accent)', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600,
                    }}>
                      hello@signpost.community
                    </a>
                  </div>
                </div>

                {/* Right: form in card */}
                <form onSubmit={handleContactSubmit} style={{
                  padding: 32, background: '#111118', border: '1px solid var(--border)',
                  borderRadius: 12,
                }}>
                  <div className="contact-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div>
                      <label htmlFor="contact-name" style={{
                        display: 'block', fontFamily: "'Inter', sans-serif", fontSize: 13,
                        fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--muted)', marginBottom: 8,
                      }}>
                        Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        style={{
                          width: '100%', padding: '12px 14px', background: 'var(--surface)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                          color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" style={{
                        display: 'block', fontFamily: "'Inter', sans-serif", fontSize: 13,
                        fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--muted)', marginBottom: 8,
                      }}>
                        Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        style={{
                          width: '100%', padding: '12px 14px', background: 'var(--surface)',
                          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                          color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label htmlFor="contact-subject" style={{
                      display: 'block', fontFamily: "'Inter', sans-serif", fontSize: 13,
                      fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--muted)', marginBottom: 8,
                    }}>
                      Subject
                    </label>
                    <select
                      id="contact-subject"
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      style={{
                        width: '100%', padding: '12px 14px', background: 'var(--surface)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        color: contactForm.subject ? 'var(--text)' : 'var(--muted)',
                        fontSize: '0.9rem', outline: 'none', appearance: 'none',
                        WebkitAppearance: 'none',
                      }}
                    >
                      <option value="" disabled>Select a subject</option>
                      <option value="general">General inquiry</option>
                      <option value="accessibility">Accessibility concern</option>
                      <option value="bug">Bug report</option>
                      <option value="feature">Feature request</option>
                      <option value="partnership">Partnership / Community organization</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 28 }}>
                    <label htmlFor="contact-message" style={{
                      display: 'block', fontFamily: "'Inter', sans-serif", fontSize: 13,
                      fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--muted)', marginBottom: 8,
                    }}>
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={6}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      style={{
                        width: '100%', padding: '12px 14px', background: 'var(--surface)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                        resize: 'vertical', minHeight: 120,
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      padding: '14px 32px', fontSize: '0.95rem', fontWeight: 600,
                      border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      background: 'var(--accent)', color: '#0a0a0f',
                    }}
                  >
                    Send Message
                  </button>
                </form>
              </div>
            )}

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Link href="/policies" style={{
                color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}>
                Review our Policies &amp; Terms &rarr;
              </Link>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-hero-grid { grid-template-columns: 1fr !important; text-align: left; gap: 28px !important; }
          .about-hero-grid h2 { font-size: clamp(1.3rem, 4vw, 1.6rem) !important; }
          .about-hero-photo { max-width: 70% !important; margin: 0 auto !important; }
          .about-hero-text { padding-right: 0 !important; }
          .contact-form-grid { grid-template-columns: 1fr !important; }
          .contact-two-col { grid-template-columns: 1fr !important; }
          .pricing-top-grid { grid-template-columns: 1fr !important; }
          .pricing-free-grid { grid-template-columns: 1fr !important; }
          .about-tab-header { padding: 0 16px !important; }
          .about-tab-content { padding: 32px 16px 48px !important; }
        }
        @media (max-width: 640px) {
          .about-hero-grid { grid-template-columns: 1fr !important; }
          .about-founders-grid { grid-template-columns: 1fr !important; }
          .about-values-grid { grid-template-columns: 1fr !important; }
          .contact-form-grid { grid-template-columns: 1fr !important; }
          .contact-two-col { grid-template-columns: 1fr !important; }
          .pricing-top-grid { grid-template-columns: 1fr !important; }
          .pricing-free-grid { grid-template-columns: 1fr !important; }
          .about-founders-grid > div { align-items: center !important; text-align: center; }
        }
      `}</style>
    </div>
  );
}
