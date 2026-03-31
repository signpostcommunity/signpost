'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

const TABS = [
  { id: 'about', label: 'About Us' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'social', label: 'Social Commitment' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact Us' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const faqItems = [
  {
    q: 'How does signpost work?',
    a: 'signpost is a directory and booking platform that connects Deaf, DeafBlind, and Hard of Hearing individuals and organizations directly with certified sign language interpreters. Browse interpreter profiles, view credentials and intro videos, and submit booking inquiries, all without going through a traditional agency.',
  },
  {
    q: 'Is signpost open to all interpreters?',
    a: 'signpost is open to certified and pre-certified sign language interpreters. All interpreter profiles go through a review process before being published to the directory. We prioritize transparency, accurate credentials, and a commitment to serving the Deaf community well.',
  },
  {
    q: 'Do I need a certification to sign up?',
    a: 'You do not need a national certification to create a profile, but your certification status will be clearly displayed on your profile. Pre-certified interpreters, student interpreters, and CDIs (Certified Deaf Interpreters) are all welcome. Transparency is key: clients can see exactly where you are in your professional journey.',
  },
  {
    q: 'How much does signpost cost?',
    a: 'signpost is free for Deaf, DeafBlind, and Hard of Hearing individuals. It is also free for interpreters to create and maintain a profile. For requesters (organizations, agencies, and hearing individuals booking interpreters), there is a flat $15 fee per interpreter per confirmed booking. No hidden fees, no percentage-based commissions.',
  },
  {
    q: 'What is the Platform Booking Policy?',
    a: 'PLATFORM_BOOKING_POLICY',
  },
  {
    q: 'What is "Deaf-Parented Interpreter / CODA"?',
    a: 'CODA stands for Child of Deaf Adults. A Deaf-Parented Interpreter (or CODA interpreter) is a hearing interpreter who grew up with Deaf parents and acquired ASL as a native or first language. Many Deaf individuals prefer working with CODA interpreters because of their deep cultural fluency and native signing ability. On signpost, interpreters can self-identify as CODA on their profile.',
  },
  {
    q: 'Will there be a mobile app?',
    a: 'A native mobile app is on our roadmap. For now, signpost is fully responsive and works well on mobile browsers. We are focused on getting the core web experience right before expanding to dedicated apps.',
  },
  {
    q: 'Where can I find signpost\'s policies and terms?',
    a: 'LINK_TO_POLICIES',
  },
];

export default function AboutPage() {
  const searchParams = useSearchParams();
  const initialTab = TABS.some(t => t.id === searchParams.get('tab')) ? searchParams.get('tab') as TabId : 'about';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  return (
    <div>
      {/* Tab bar header */}
      <div style={{ background: '#1a1a24', paddingTop: 48 }}>
        <div className="about-tab-header" style={{ width: '100%', padding: '0 40px' }}>
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
        <div className="about-tab-content" style={{ width: '100%', padding: '48px 40px 80px' }}>

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
                </div>
              </div>
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
            style={{ maxWidth: 760 }}
          >
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 32,
              color: 'var(--text)',
            }}>
              Pricing
            </h2>

            <div style={{
              padding: 28, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', marginBottom: 24,
            }}>
              <h3 style={{
                fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '15px',
                color: 'var(--text)', marginBottom: 16,
              }}>
                Platform Fee
              </h3>
              <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#c8cdd8' }}>
                <p style={{ margin: '0 0 16px' }}>
                  signpost charges a $15 platform fee per interpreter, per confirmed booking. This fee is charged to the requester when a booking is confirmed. Booking requests for personal events submitted by Deaf/DB/HH individuals are always free.
                </p>
                <p style={{ margin: '0 0 24px' }}>
                  Each booking covers a single event or session (maximum 24 hours). For multi-day events, submit a separate request for each day.
                </p>

                <div style={{
                  fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '15px',
                  color: 'var(--text)', marginBottom: 14,
                }}>
                  Examples
                </div>
                <div style={{ color: '#96a0b8', fontSize: '14px', lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                    <div>1 interpreter for a 2-hour meeting: 1 booking = $15</div>
                    <div>2 interpreters for a full-day conference: 2 bookings = $30</div>
                    <div>2 interpreters for a 3-day event: 6 bookings (2 x 3 days) = $90</div>
                    <div>Weekly recurring appointment, 1 interpreter: $15 per week</div>
                  </div>
                </div>

                <p style={{ margin: 0, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  The platform fee is signpost&apos;s only charge. Interpreters set their own rates and invoice clients directly. signpost never takes a percentage of interpreter pay.
                </p>
              </div>
            </div>
          </div>

          {/* Tab 2: Accessibility */}
          <div
            role="tabpanel"
            id="panel-accessibility"
            aria-labelledby="tab-accessibility"
            hidden={activeTab !== 'accessibility'}
          >
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 24,
              color: 'var(--text)',
            }}>
              Our Accessibility Commitment
            </h2>

            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 32 }}>
              signpost is built for the Deaf, DeafBlind, and Hard of Hearing community. Accessibility isn&apos;t an afterthought. It&apos;s foundational to everything we build.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {[
                { title: 'WCAG 2.2 Level AA', desc: 'We meet or exceed Web Content Accessibility Guidelines 2.2 at the AA conformance level across the entire platform.' },
                { title: 'Screen reader friendly', desc: 'Semantic HTML, ARIA labels, and full keyboard navigation throughout.' },
                { title: 'DeafBlind-friendly mode', desc: 'A high-contrast display toggle optimized for DeafBlind users is in active development and will be available before public launch.' },
                { title: 'Ongoing improvement', desc: 'Accessibility is never "done." We continuously test and improve.' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', lineHeight: '1.65', flexShrink: 0 }}>&mdash;</span>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{item.title}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>: {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              padding: 28, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
                If you experience any accessibility barriers on signpost, please reach out to us at{' '}
                <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  hello@signpost.community
                </a>
                . We take every concern seriously and will address it promptly.
              </p>
            </div>
          </div>

          {/* Tab 3: Social Commitment */}
          <div
            role="tabpanel"
            id="panel-social"
            aria-labelledby="tab-social"
            hidden={activeTab !== 'social'}
          >
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 24,
              color: 'var(--text)',
            }}>
              Our Social Commitment
            </h2>

            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 16 }}>
              signpost exists because of the Deaf community, and we are committed to giving back to it. We believe that the platform we build should actively support the organizations, advocates, and educators who have been doing this work long before us.
            </p>

            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 40 }}>
              Beyond the Deaf community, signpost stands in solidarity with all marginalized communities. We believe access to communication is a fundamental right, and we are committed to building a platform that reflects values of equity, inclusion, and justice for everyone.
            </p>

            {/* Organizations section */}
            <div style={{ marginBottom: 40 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
              }}>
                <div style={{
                  fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)',
                  whiteSpace: 'nowrap',
                }}>
                  Community Partners
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <div style={{
                padding: '48px 32px', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', textAlign: 'center',
              }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.75, margin: 0 }}>
                  We&apos;re building our community partnerships. Check back soon.
                </p>
              </div>
            </div>

            <div style={{
              padding: 28, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
                Have an organization you&apos;d like to recommend? Reach out at{' '}
                <a href="mailto:hello@signpost.community" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  hello@signpost.community
                </a>
              </p>
            </div>
          </div>

          {/* Tab 4: FAQ */}
          <div
            role="tabpanel"
            id="panel-faq"
            aria-labelledby="tab-faq"
            hidden={activeTab !== 'faq'}
          >
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 32,
              color: 'var(--text)',
            }}>
              Frequently Asked Questions
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {faqItems.map((item, i) => (
                <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
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
                      transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}>
                      +
                    </span>
                  </button>
                  <div
                    id={`faq-answer-${i}`}
                    role="region"
                    aria-labelledby={`faq-q-${i}`}
                    hidden={openFaq !== i}
                    style={{ paddingBottom: openFaq === i ? 20 : 0 }}
                  >
                    {item.a === 'LINK_TO_POLICIES' ? (
                      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
                        All of signpost&apos;s policies, terms of service, and legal documents are available on our{' '}
                        <Link href="/policies" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                          Policies &amp; Terms
                        </Link>{' '}
                        page.
                      </p>
                    ) : item.a === 'PLATFORM_BOOKING_POLICY' ? (
                      <div style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75 }}>
                        <p style={{ margin: '0 0 16px' }}>
                          When an organization or requester first connects with an interpreter through signpost, future bookings with that organization should continue through the platform. This is how signpost sustains itself as a free resource for the Deaf community and for interpreters.
                        </p>
                        <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text)' }}>What this means:</p>
                        <ul style={{ margin: '0 0 16px', paddingLeft: 20, listStyleType: 'disc' }}>
                          <li>If a requester found you on signpost and booked you for the first time through signpost, that&apos;s a signpost connection.</li>
                          <li>Future work with that same requester should continue to be booked through signpost.</li>
                          <li>The $15 platform fee per confirmed booking applies to these connections.</li>
                          <li>Requesters should not ask interpreters to work off-platform to avoid the booking fee. If this happens, interpreters are encouraged to let us know.</li>
                        </ul>
                        <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--text)' }}>What this does NOT mean:</p>
                        <ul style={{ margin: 0, paddingLeft: 20, listStyleType: 'disc' }}>
                          <li>This does not apply to clients or organizations you worked with before joining signpost.</li>
                          <li>This does not apply to Deaf/DB/HH individuals you already know personally or professionally.</li>
                          <li>If a Deaf person you&apos;ve interpreted for many times happens to also be on signpost, your existing relationship is yours. They can continue to book you via signpost, or however else you may prefer.</li>
                          <li>If an organization has been booking you independently for years and then joins signpost, your pre-existing relationship is unaffected. They can continue to book you via signpost, or however else you may prefer.</li>
                        </ul>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.75, margin: 0 }}>
                        {item.a}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab 5: Contact Us */}
          <div
            role="tabpanel"
            id="panel-contact"
            aria-labelledby="tab-contact"
            hidden={activeTab !== 'contact'}
          >
            <h2 style={{
              fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
              fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 8,
              color: 'var(--text)',
            }}>
              Contact Us
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 32 }}>
              Questions, feedback, partnership inquiries? We&apos;d love to hear from you.
            </p>

            {contactSubmitted ? (
              <div style={{
                padding: '48px 32px', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-syne)', fontSize: '1.2rem', fontWeight: 700,
                  color: 'var(--text)', marginBottom: 12,
                }}>
                  Message sent
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 20 }}>
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
              <form onSubmit={handleContactSubmit} style={{
                padding: 32, background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}>
                <div className="contact-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div>
                    <label htmlFor="contact-name" style={{
                      display: 'block', fontFamily: 'var(--font-syne)', fontSize: '0.7rem',
                      fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
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
                        width: '100%', padding: '12px 14px', background: 'var(--card-bg)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" style={{
                      display: 'block', fontFamily: 'var(--font-syne)', fontSize: '0.7rem',
                      fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
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
                        width: '100%', padding: '12px 14px', background: 'var(--card-bg)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label htmlFor="contact-subject" style={{
                    display: 'block', fontFamily: 'var(--font-syne)', fontSize: '0.75rem',
                    fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
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
                      width: '100%', padding: '12px 14px', background: 'var(--card-bg)',
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
                    display: 'block', fontFamily: 'var(--font-syne)', fontSize: '0.75rem',
                    fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
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
                      width: '100%', padding: '12px 14px', background: 'var(--card-bg)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
                      resize: 'vertical', minHeight: 120,
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '14px 32px', fontSize: '0.95rem', fontWeight: 600,
                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }}
                >
                  Submit
                </button>
              </form>
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
          .about-tab-header { padding: 0 16px !important; }
          .about-tab-content { padding: 32px 16px 48px !important; }
        }
        @media (max-width: 640px) {
          .about-hero-grid { grid-template-columns: 1fr !important; }
          .about-founders-grid { grid-template-columns: 1fr !important; }
          .about-values-grid { grid-template-columns: 1fr !important; }
          .contact-form-grid { grid-template-columns: 1fr !important; }
          .about-founders-grid > div { align-items: center !important; text-align: center; }
        }
      `}</style>
    </div>
  );
}
