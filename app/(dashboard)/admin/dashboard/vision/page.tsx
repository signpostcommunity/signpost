'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';

const TABS = [
  { id: 'deaf', label: 'Deaf/DB/HH Portal' },
  { id: 'interpreter', label: 'Interpreter Portal' },
  { id: 'requester', label: 'Requester Portal' },
  { id: 'commitments', label: 'Commitments' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const ORANGE = '#ff7e45';
const PURPLE = '#9d87ff';
const CYAN = '#00e5ff';
const WARM = '#e8c77b';

/* ─── Shared typography helpers ────────────────────────────────────────────── */

function SectionDivider({ color = 'var(--border)' }: { color?: string }) {
  return <div style={{ height: 1, background: color, margin: '48px 0' }} />;
}

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
    }}>
      <div style={{
        fontFamily: 'var(--font-syne)', fontSize: '0.7rem', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase', color,
        whiteSpace: 'nowrap',
      }}>
        {children}
      </div>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

function FeatureBlock({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div>
      <h3 style={{
        fontFamily: 'var(--font-syne)', fontSize: '1.05rem', fontWeight: 700,
        color: accent, marginBottom: 12, letterSpacing: '-0.01em',
      }}>
        {title}
      </h3>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <li key={i} style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function WowFeature({ title, intro, bullets, callout, accent }: {
  title: string; intro: string; bullets: string[]; callout: string; accent: string;
}) {
  return (
    <div style={{
      padding: 28, background: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    }}>
      <h3 style={{
        fontFamily: 'var(--font-syne)', fontSize: '1.05rem', fontWeight: 800,
        color: accent, marginBottom: 10, letterSpacing: '-0.02em',
      }}>
        {title}
      </h3>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: 12 }}>
        {intro}
      </p>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.65 }}>
            <span dangerouslySetInnerHTML={{ __html: b }} />
          </li>
        ))}
      </ul>
      <p style={{
        color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.65,
        fontWeight: 700, margin: 0, fontStyle: 'italic',
      }}>
        {callout}
      </p>
    </div>
  );
}

/* ─── Tab content: Deaf/DB/HH Portal ──────────────────────────────────────── */

function DeafPortalTab() {
  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
        fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.25, marginBottom: 8,
        color: 'var(--text)',
      }}>
        signpost: Deaf/DB/HH Portal
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 48 }}>
        Product vision document
      </p>

      <SectionLabel color={PURPLE}>Core Features</SectionLabel>

      <div className="vision-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 48 }}>
        <FeatureBlock accent={PURPLE} title="My Preferred Interpreter List" items={[
          'Organize interpreters into three tiers: <strong>Preferred</strong>, <strong>Secondary</strong>, and <strong>Do Not Book</strong>',
          'Set approval toggles per interpreter: work settings vs. personal/medical',
          'Add private notes on each interpreter (only you can see these)',
          'One-click tier changes. Move interpreters up, down, or to Do Not Book',
          'Built by browsing the directory and adding interpreters directly',
        ]} />

        <FeatureBlock accent={PURPLE} title="Personal Interpreter Request" items={[
          'Submit requests directly from your portal. Always free for Deaf/DB/HH individuals',
          'Specify: date/time, format (in-person/remote/hybrid), event type, location, interpreter count',
          'Choose which interpreters from your preferred list to send the request to',
          'Your communication preferences are automatically shared with every request',
        ]} />

        <FeatureBlock accent={PURPLE} title="Preferences & Profile" items={[
          'Set your communication preferences once:',
          'Signing style and pace',
          'Preferred domains (medical, legal, education, etc.)',
          'Team interpreting preferences',
          'CDI preference',
          'Notes for interpreters',
          'Basic profile: name, pronouns, location, bio, photo',
        ]} />

        <FeatureBlock accent={PURPLE} title="My Requesters" items={[
          'See which organizations and people have access to your preferred list',
          'Control what each requester can see: work settings, personal/medical, or both',
          'Revoke access anytime',
        ]} />

        <FeatureBlock accent={PURPLE} title="Share My List" items={[
          'Generate a shareable link or invite a requester by email',
          'They get a live, read-only view of your preferred interpreters and communication preferences',
          'When they book on your behalf, they already know who you trust and how you communicate',
        ]} />

        <FeatureBlock accent={PURPLE} title="Role Switcher" items={[
          'Deaf users who are also interpreters (DIs) or who coordinate for an org can switch between portals seamlessly',
          'Add roles during signup or anytime from the dashboard',
          'One account, multiple roles',
        ]} />

        <FeatureBlock accent={PURPLE} title="ASL Site Guide" items={[
          'Persistent icon on every page. Tap it and a Deaf native signer appears on screen',
          'Explains the features of whatever page you\'re on, in ASL',
          'Available during signup as an optional guided tour',
          'Always accessible afterward. Never goes away',
          'English captions included',
        ]} />
      </div>

      <SectionDivider color={PURPLE} />

      <SectionLabel color={PURPLE}>WOW Features</SectionLabel>

      <div className="vision-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <WowFeature
          accent={PURPLE}
          title={'"My Preferences Travel With Me"'}
          intro="Your communication preferences follow every request you make, automatically."
          bullets={[
            'Fill out your preferences once: signing style, pace, register, CDI needs, team interpreting notes, field-specific vocabulary',
            'Every time you request an interpreter, or an organization books one on your behalf, those preferences are attached',
            'The interpreter sees your full communication profile before they ever meet you',
          ]}
          callout="You never have to explain yourself again. Every new appointment starts with the right context."
        />

        <WowFeature
          accent={PURPLE}
          title="Communication Style Video"
          intro="You record a short video of yourself signing naturally."
          bullets={[
            'Your pace, your register, your style, captured in 30 to 90 seconds',
            'When an interpreter receives a request involving you, they watch your video first',
            'They assess language match before accepting, not after showing up',
          ]}
          callout="No more realizing within thirty seconds that the interpreter doesn't match your communication style. They already know."
        />

        <WowFeature
          accent={PURPLE}
          title="Visual Request Tracker"
          intro="See exactly where your interpreter request stands, in real time."
          bullets={[
            '<strong>Sent</strong> → <strong>Viewed by Interpreter</strong> → <strong>Interpreter Responding</strong> → <strong>Rate Shared</strong> → <strong>Confirmed</strong>',
            'Like tracking a package, but for your interpreter',
            'Updates live as the interpreter interacts with your request',
          ]}
          callout="No more waiting in the dark after making a request."
        />

        <WowFeature
          accent={PURPLE}
          title="Interpreters I've Worked With"
          intro="Every completed booking automatically builds your interpreter history."
          bullets={[
            'See who you\'ve worked with, when, and in what setting',
            'One tap to re-request the same interpreter for a similar appointment',
            'Your history grows over time into a personal resource',
          ]}
          callout="Your interpreting history becomes something useful, not something that disappears after every booking."
        />

        <WowFeature
          accent={PURPLE}
          title="Requester Transparency"
          intro="When an organization books an interpreter for you, you see everything."
          bullets={[
            'Who made the request',
            'Which interpreter was selected',
            'Whether your communication preferences were shared',
            'Whether your preferred interpreters were contacted first',
          ]}
          callout="Full transparency. No more wondering why you got assigned someone you've never met when your preferred interpreter was available."
        />

        <WowFeature
          accent={PURPLE}
          title="Deaf Community Trusted Circle"
          intro="A private recommendation network, Deaf to Deaf."
          bullets={[
            'Connect with other Deaf people you trust',
            'Share private interpreter notes within your circle: "great for medical," "not a good fit for legal"',
            'Notes are only visible to people in your trusted circle, not interpreters, not requesters',
            'An interpreter can\'t create a fake account and see what people are saying. They won\'t be in anyone\'s circle',
          ]}
          callout="The recommendations Deaf people already share informally now have a home."
        />

        <WowFeature
          accent={PURPLE}
          title="Emergency Heads-Up"
          intro="You're heading to the ER. The hospital is going to call an agency. Your name won't be on the request."
          bullets={[
            'Open signpost and tap <strong>"Heads Up"</strong>',
            'A notification goes to your preferred interpreter team: <em>"Keep an eye out for a request from [hospital name]. It\'s for me."</em>',
            'When your interpreter sees that request come in, they know it\'s you. They accept',
          ]}
          callout="You get someone who knows your signing style in a moment when it matters most."
        />
      </div>

      <SectionDivider />

      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, fontStyle: 'italic', textAlign: 'center' }}>
        Built by Molly Sano-Mahgoub and Regina McGinnis.<br />
        signpost: your interpreters, your choice.
      </p>
    </div>
  );
}

/* ─── Tab content: Interpreter Portal ─────────────────────────────────────── */

function InterpreterPortalTab() {
  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
        fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.25, marginBottom: 8,
        color: 'var(--text)',
      }}>
        signpost: Interpreter Portal
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 48, fontStyle: 'italic' }}>
        Vision document coming soon. Core features are live and in beta testing.
      </p>

      <div className="vision-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <SectionLabel color={CYAN}>Currently Live</SectionLabel>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '6-step profile builder (personal info, languages, credentials, bio, skills, community & identity)',
              'Directory listing with photo, intro video, certifications, specializations',
              'Rate profiles and invoicing tools',
              'Preferred Team management',
              'Client Lists (shared Deaf user preferences)',
              'Availability calendar',
              'Notification preferences',
            ].map((item, i) => (
              <li key={i} style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <SectionLabel color={CYAN}>Planned</SectionLabel>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Calendar sync (Google Calendar, Outlook)',
              'Push notifications (mobile app)',
              'Premium business tools subscription (invoicing, payments, reporting)',
              'Mentorship connections',
            ].map((item, i) => (
              <li key={i} style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab content: Requester Portal ───────────────────────────────────────── */

function RequesterPortalTab() {
  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
        fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.25, marginBottom: 8,
        color: 'var(--text)',
      }}>
        signpost: Requester Portal
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 48, fontStyle: 'italic' }}>
        Vision document coming soon. Portal build is in progress.
      </p>

      <div className="vision-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <SectionLabel color={CYAN}>Planned Features</SectionLabel>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '5-step signup (role selection, account details, first request, find interpreters, confirmation)',
              'Request management (all requests, drafts, status tracking)',
              'Inbox with interpreter communication',
              'Preferred and Secondary Tier interpreter lists',
            ].map((item, i) => (
              <li key={i} style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <SectionLabel color={CYAN}>Pricing & Payment</SectionLabel>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Client Interpreter Lists (receiving shared Deaf user preferences)',
              '$15 flat fee per interpreter per confirmed booking',
              'Mocked payment UI (Stripe integration post-beta)',
            ].map((item, i) => (
              <li key={i} style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab content: Commitments ────────────────────────────────────────────── */

function CommitmentsTab() {
  const sections = [
    {
      title: 'Accessibility',
      items: [
        'WCAG 2.2 Level AA compliance across the entire platform',
        'Screen reader friendly: semantic HTML, ARIA labels, full keyboard navigation',
        'DeafBlind-friendly high-contrast toggle before public launch',
        'Ongoing testing and improvement',
      ],
    },
    {
      title: 'Community',
      items: [
        'Always free for Deaf/DB/HH individuals',
        'Open to all interpreters regardless of region or certification body',
        'Giving back to Deaf organizations and community initiatives',
        'Supporting marginalized and disenfranchised communities',
      ],
    },
    {
      title: 'Transparency',
      items: [
        'Transparent pricing: $15 flat fee per interpreter per confirmed booking for requesters',
        'signpost never touches interpreter money. Invoicing and payment is entirely between interpreter and requester',
        'Platform Booking Policy only applies to NEW organizational connections made via signpost, not existing relationships',
        'Open platform. No gatekeeping, no hidden fees',
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        'signpost does not process or store financial account information',
        'Interpreter rates are shared privately when responding to an inquiry, not displayed publicly',
        'Deaf user communication preferences are controlled by the user. They choose who sees what',
        'Profile flagging system for community-driven quality control',
      ],
    },
  ];

  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
        fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.25, marginBottom: 48,
        color: 'var(--text)',
      }}>
        signpost: Our Commitments
      </h2>

      <div className="vision-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {sections.map((section) => (
          <div key={section.title}>
            <SectionLabel color={WARM}>{section.title}</SectionLabel>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.items.map((item, i) => (
                <li key={i} style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */

export default function VisionPage() {
  const [activeTab, setActiveTab] = useState<TabId>('deaf');

  return (
    <div>
      {/* Tab bar header */}
      <div style={{ background: '#1a1a24', paddingTop: 48 }}>
        <div style={{ padding: '0 40px' }}>
          <h1 style={{
            fontFamily: 'var(--font-syne)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
            fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.3,
            color: 'var(--text)', marginBottom: 32,
          }}>
            Product Vision
          </h1>
          <div role="tablist" aria-label="Product vision sections" style={{
            display: 'flex', gap: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                id={`vision-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`vision-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontFamily: 'var(--font-syne)', fontSize: '0.82rem', fontWeight: 600,
                  letterSpacing: '0.02em', padding: '12px 20px',
                  background: activeTab === tab.id ? '#000' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text)' : 'var(--muted)',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `2px solid ${ORANGE}` : '2px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
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
        <div style={{ width: '100%', padding: '48px 40px 80px' }}>
          <div
            role="tabpanel"
            id="vision-panel-deaf"
            aria-labelledby="vision-tab-deaf"
            hidden={activeTab !== 'deaf'}
          >
            <DeafPortalTab />
          </div>

          <div
            role="tabpanel"
            id="vision-panel-interpreter"
            aria-labelledby="vision-tab-interpreter"
            hidden={activeTab !== 'interpreter'}
          >
            <InterpreterPortalTab />
          </div>

          <div
            role="tabpanel"
            id="vision-panel-requester"
            aria-labelledby="vision-tab-requester"
            hidden={activeTab !== 'requester'}
          >
            <RequesterPortalTab />
          </div>

          <div
            role="tabpanel"
            id="vision-panel-commitments"
            aria-labelledby="vision-tab-commitments"
            hidden={activeTab !== 'commitments'}
          >
            <CommitmentsTab />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .vision-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
