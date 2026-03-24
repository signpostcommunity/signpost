# REQUESTER_BUILD.md — Requester Portal Build Specification
# This is the single source of truth for the requester portal build.
# Claude Code reads this at the start of every requester prompt via:
#   cd /home/mollysano/signpost && git pull && cat CLAUDE.md && cat REQUESTER_BUILD.md

---

## 1. OVERVIEW

signpost is a sign language interpreter directory and booking platform. Three portals:
- **Interpreter portal** (cyan accent) — BUILT, in beta
- **Deaf/DB/HH portal** (purple accent) — BUILT, in beta
- **Requester portal** (cyan accent) — THIS BUILD

Requesters are organizations, medical offices, event coordinators, HR teams, or
individuals who book interpreters for professional/ADA settings. They pay a $15
flat platform fee per confirmed interpreter per booking. Deaf/DB/HH personal
requests are free and go through the Deaf portal, NOT the requester portal.

**"signpost" is always lowercase.** No emoji in UI components. Dark theme.

---

## 2. DESIGN SYSTEM

```
Background:     #0a0a0f
Card:           #111118
Surface:        #16161f
Border:         #1e2433
Accent (cyan):  #00e5ff
Purple:         #7b61ff
Text:           #f0f2f8
Muted:          #8891a8
Radius:         16px
Radius-sm:      10px
```

**Fonts:** Syne (headings, section labels, wordmark) + DM Sans (body, forms, buttons)
**Wordmark:** `sign` in white + `post` in cyan, via Syne font-weight 800
**Section labels:** Syne 0.7rem, uppercase, letter-spacing 0.1em, cyan color
**Requester portal uses cyan accent** (same as interpreter, NOT purple like Deaf)

---

## 3. DATABASE SCHEMA

### 3A. Tables the requester portal WRITES to

**bookings** — requester creates booking requests
```
id                  uuid PK (gen_random_uuid)
requester_id        uuid FK → auth.users.id       ← SET TO auth.uid() on insert
requester_name      text                           ← org name or personal name
request_type        text DEFAULT 'professional'    ← CHECK: personal | professional
title               text
description         text
notes               text
date                date
time_start          time
time_end            time
location            text
format              text                           ← CHECK: in_person | remote | hybrid
timezone            text DEFAULT 'America/Los_Angeles'
event_type          text                           ← e.g. "Doctor / Specialist appointment"
event_category      text                           ← e.g. "Medical & Wellness"
specialization      text
recurrence          text DEFAULT 'one-time'
interpreter_count   integer DEFAULT 1
interpreters_confirmed integer DEFAULT 0
status              text DEFAULT 'open'            ← CHECK: open | filled | cancelled | completed
wave_wait_hours     integer DEFAULT 24
is_urgent           boolean DEFAULT false
current_wave        integer DEFAULT 1
platform_fee_amount numeric DEFAULT 15.00
platform_fee_status text DEFAULT 'pending'         ← CHECK: pending | charged | waived | refunded
created_at          timestamptz DEFAULT now()
```
RLS: `requesters_create_bookings` INSERT policy exists. `bookings_select` and
`bookings_update` both check `requester_id = auth.uid()`.

**booking_recipients** — requester sends to specific interpreters
```
id                  uuid PK
booking_id          uuid FK → bookings.id
interpreter_id      uuid FK → interpreter_profiles.id
status              text DEFAULT 'sent'   ← CHECK: sent|viewed|declined|responded|confirmed|withdrawn
wave_number         integer DEFAULT 1
sent_at             timestamptz DEFAULT now()
viewed_at           timestamptz
responded_at        timestamptz
confirmed_at        timestamptz
declined_at         timestamptz
withdrawn_at        timestamptz
response_rate       numeric               ← interpreter's quoted rate
response_notes      text                  ← interpreter's notes with their rate
decline_reason      text
rate_profile_id     uuid                  ← FK to interpreter_rate_profiles.id
```
RLS: `requesters_add_recipients` INSERT exists. SELECT/UPDATE check `is_booking_requester()`.

**booking_dhh_clients** — requester tags a Deaf client to the booking
```
id                  uuid PK
booking_id          uuid FK → bookings.id
dhh_user_id         uuid FK → auth.users.id   ← the Deaf person's auth ID
context_video_url   text
context_video_visible_before_accept boolean DEFAULT true
comm_prefs_snapshot jsonb                      ← captured from deaf_profiles.comm_prefs at tag time
added_at            timestamptz DEFAULT now()
```
RLS: `requesters_add_dhh_clients` INSERT exists. SELECT checks `is_booking_requester()`.

IMPORTANT: When a requester tags a D/HH client, snapshot their comm_prefs from
deaf_profiles at that moment. This ensures interpreters see the client's preferences
even if the Deaf user updates them later.

**requester_profiles** — requester account info
```
id                  uuid PK FK → user_profiles.id
user_id             uuid NOT NULL FK → auth.users.id
name                text NOT NULL
email               text
first_name          text
last_name           text
phone               text
country             text
city                text
state               text
country_name        text
location            text
org_name            text
org_type            text        ← School, Healthcare, Government, Non-profit, Legal, Corporate, Community, Event, Other
requester_type      text DEFAULT 'organization'  ← CHECK: organization | individual | personal_event
comm_prefs          jsonb DEFAULT '{}'
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()
```
RLS: `requester_own_profile` ALL where user_id = auth.uid(). Public read exists.

**requester_roster** — requester's preferred interpreter list
```
id                  uuid PK
requester_user_id   uuid FK → auth.users.id
interpreter_id      uuid FK → interpreter_profiles.id
tier                text DEFAULT 'preferred'  ← CHECK: preferred | secondary | dnb
notes               text
created_at          timestamptz DEFAULT now()
UNIQUE (requester_user_id, interpreter_id)
```
RLS: `requester_own_roster` ALL where requester_user_id = auth.uid().
Interpreters can see non-DNB entries for themselves.

**messages** — requester sends/receives messages about bookings
```
id                  uuid PK
booking_id          uuid FK → bookings.id
sender_id           uuid FK → user_profiles.id
interpreter_id      uuid FK → interpreter_profiles.id
sender_name         text
subject             text
body                text
preview             text
is_read             boolean DEFAULT false
created_at          timestamptz DEFAULT now()
```
RLS: SELECT checks sender_id = auth.uid() OR booking requester OR booking recipient.

**dhh_requester_connections** — requester connects with Deaf clients
```
id                  uuid PK
dhh_user_id         uuid FK → deaf_profiles.id  (nullable for off-platform)
requester_id        uuid FK → requester_profiles.id
status              text DEFAULT 'pending'  ← CHECK: active|pending|pending_offplatform|revoked
initiated_by        text  ← CHECK: dhh | requester
requester_org_name  text
offplatform_name    text
offplatform_email   text
offplatform_phone   text
created_at          timestamptz DEFAULT now()
confirmed_at        timestamptz
revoked_at          timestamptz
```
RLS: Requesters read/write own connections. D/HH users read/update own connections.

### 3B. Tables the requester portal READS from

**interpreter_profiles** — directory browsing, profile viewing
**interpreter_certifications** — displayed on profiles
**interpreter_rate_profiles** — shown when interpreter responds with rate
**interpreter_availability** — shown on profile Availability tab
**interpreter_away_periods** — away notice on profiles
**deaf_profiles** — when viewing a connected Deaf client's info
**deaf_roster** — when viewing a connected Deaf client's preferred interpreter list
  (filtered by approve_work or approve_personal based on context)
**invoices** — requester receives invoices from interpreters
  RLS: `requester_view_invoices` SELECT where requester_billing_email matches
  user_profiles.email for auth.uid()
**notifications** — requester's own notifications

### 3C. RLS Helper Functions

```sql
get_my_interpreter_id()    → SELECT id FROM interpreter_profiles WHERE user_id = auth.uid()
is_booking_recipient(uuid) → EXISTS booking_recipients WHERE booking_id = $1 AND interpreter_id = get_my_interpreter_id()
is_booking_requester(uuid) → EXISTS bookings WHERE id = $1 AND requester_id = auth.uid()
is_booking_dhh_client(uuid)→ EXISTS booking_dhh_clients WHERE booking_id = $1 AND dhh_user_id = auth.uid()
is_admin()                 → SELECT is_admin FROM user_profiles WHERE id = auth.uid()
```

---

## 4. CROSS-PORTAL DEPENDENCIES

### 4A. Booking Flow (all 3 portals)
1. Requester creates `bookings` row (requester_id = auth.uid(), request_type = 'professional')
2. Requester inserts `booking_recipients` rows for each selected interpreter
3. Requester optionally inserts `booking_dhh_clients` row to tag a Deaf client
4. Interpreter sees inquiry in their dashboard (via booking_recipients SELECT)
5. Interpreter responds with rate → sets booking_recipients.rate_profile_id + status = 'responded'
6. Requester sees response in inbox, reviews rate
7. Requester accepts → booking_recipients.status = 'confirmed', bookings.interpreters_confirmed++
8. Platform fee: bookings.platform_fee_status = 'charged' (mocked for beta)
9. Deaf client (if tagged) sees booking in "Requests made on my behalf"
10. Notification fires at each step (new_request, rate_received, booking_confirmed, etc.)

### 4B. AddToListModal Integration
The AddToListModal component already handles deaf and interpreter roles via ROLE_CONFIGS.
A 'requester' config MUST be added:
- Requester adding interpreter → writes to requester_roster
- Modal shows: tier (Preferred/Secondary) + notes + DNB option
- NO work/personal approval checkboxes (those are Deaf-specific)
- Same notification suppression for DNB (already implemented)

### 4C. Directory Interaction
When browsing /directory as a requester:
- ?context=requester must be in sidebar link
- AddToListModal must recognize requester role
- "Request Booking" on profiles links to /request/dashboard/new-request?interpreter=[id]
- Directory profile should pre-fill interpreter in the request form

### 4D. Nav.tsx / Role Detection
- /request/dashboard must trigger signpost:lastRole = 'requester' in Nav.tsx
- RequesterDashboardSidebar needs "Browse Interpreter Directory" with ?context=requester
- "My Portal" link must resolve correctly for requester role on shared pages
- Role switcher ("Change Hats") must include requester option for multi-role users
- user_profiles.role CHECK constraint already includes 'requester'

### 4E. Auth Callback Routing
Auth callback must route requester role → /request/dashboard
Role picker screen (multi-role login) must include requester card

### 4F. Notifications (requester-specific types needed)
- new_request_response — interpreter responded to request
- rate_received — interpreter sent rate (Action Required badge in inbox)
- booking_confirmed — booking confirmed (both sides)
- booking_cancelled_by_interpreter — interpreter cancelled
- new_message — message from interpreter
- dhh_connection_request — Deaf user wants to share their list
- invoice_received — interpreter sent an invoice

### 4G. Deaf ↔ Requester Connection Flow
1. Deaf user shares their Interpreter Request Link (signpost.community/d/[slug])
2. Requester visits the link → sees Deaf user's name + comm prefs
3. Requester clicks "Connect" → creates dhh_requester_connections row (status: pending)
4. Deaf user sees pending connection in My Requesters tab
5. Deaf user approves → status = active
6. Requester can now see Deaf user's preferred interpreter list
   (filtered by deaf_roster.approve_work for work contexts)
7. When requester creates a booking, they can tag this Deaf client
8. Tagged Deaf client's comm_prefs are snapshotted to booking_dhh_clients

---

## 5. PROTOTYPE DESIGN REFERENCE

### 5A. Landing Page (/request)
- "For Requesters" cyan pill badge
- Headline: "Find the right interpreter, every time." with gradient text (cyan → purple)
- Subtitle: "Book directly with qualified interpreters. No agency markup. Full transparency on rates, credentials, and availability."
- Two-card layout:
  - Left card (cyan border hover): "New to signpost?" + 3 bullets + "Create my first request →"
  - Right card (purple border hover): "Been here before?" + 3 bullets + "Sign in to my portal →"
- Both cards have SVG icon at top, Syne heading, muted bullet points

### 5B. Signup Flow (5 steps)
**Step 1 — Your Role:** 3 role cards in a grid:
- Organization / Institution (building icon)
- Deaf / Hard of Hearing (redirects to Deaf portal if selected)
- Personal Event (person icon)

**Step 2 — Account Details:**
- Organization info (conditional, only if org selected): Org Name*, Org Type dropdown
- Requester info: First Name*, Last Name*, Phone, Email*, Country*, City/Region*
- Preferred Communication Method: Email, Text/SMS, Video Phone, Phone Call (toggle chips)

**Step 3 — First Request (optional, can skip):**
- Full request form (same fields as dashboard New Request)
- For beta: can skip this step entirely

**Step 4 — Find Interpreters:**
- Suggested interpreter grid from directory
- "Browse the full directory →" link

**Step 5 — Done:**
- Animated checkmark celebration (cyan→purple gradient ring)
- "You're all set." heading
- "Go to My Dashboard" + "Browse Interpreters" buttons

### 5C. Dashboard Sidebar
```
[Avatar] Alex Rivera
         Interpreter Coordinator

CHANGE HATS
[Requester ▾]

OVERVIEW
  Dashboard (active)

REQUESTS
  All Requests [badge: 3]
  New Request
  Drafts [badge: 1]
  Inbox [badge: 3]

FAVORITES
  Preferred Interpreters [badge: 3, gold]
  Secondary Tier Interpreters [badge: 5, purple]
  Client Interpreter Lists [badge: 2, cyan]

ACCOUNT
  My Profile
  Browse Interpreter Directory
  Back to signpost
```

### 5D. Dashboard Overview
- Greeting: "Good to see you, [name]."
- Subtitle: "Here's a snapshot of your activity on signpost."
- 4 stat cards: Active Requests, Drafts Saved, Preferred Interpreters, Secondary Tier
- Two-column layout: Recent Requests (left) + Preferred Interpreters preview (right)

### 5E. Request Cards (in All Requests)
Each card shows:
- Title + created date + category
- Status badge (Pending/Sent/Confirmed/Waiting on Payer)
- Meta row: date, time, location, recurrence
- Interpreter status line (e.g. "Sofia Reyes confirmed", "Sent to 2 Preferred")
- Action buttons: View Details, Message, Edit, Add to Calendar

Status types and their colors:
- Pending: amber/yellow
- Sent: cyan
- Confirmed: green
- Waiting on Payer: red/pink

### 5F. New Request Form (Dashboard)
Fields in order:
1. Date* / Start Time* / End Time (3-column grid)
2. Recurrence dropdown (One-time, Daily, Weekly, Bi-weekly, Monthly, Custom)
3. Mode* (In-person, Remote VRI, Hybrid) / Location/Platform
4. Number of Interpreters Needed (1-5+ with team interpretation note)
5. Context/Setting* (grouped optgroups: Arts, Legal, Medical, Personal, Work, Other)
6. Job Title / Description*
7. Sign Language(s) Needed* (language picker)
8. Spoken Language(s) Needed (language picker)
9. Additional Notes for Interpreter
10. Prep Materials upload (drag/drop, PDF/Word/PPT/images, 25MB max)
11. Send To: toggle buttons for Preferred (count) / Secondary (count) / Select Specific
    - Select Specific shows interpreter picker with checkboxes grouped by tier
    - "+ Browse directory to add more" link
12. Payment section: "$15 platform fee per interpreter, per occurrence"
    - Card not charged until requester reviews and accepts interpreter's rate
    - "Unlike traditional agencies, we don't charge an hourly percentage"
    - Payment method input (mocked for beta, Stripe for launch)

### 5G. Inbox
Message threads showing:
- Interpreter avatar + name + booking reference
- Preview text
- Timestamp
- Unread dot (cyan)
- "Action Required" badge (cyan border highlight) for rate reviews
- "Review Rate & Confirm →" CTA button inline

### 5H. Client Interpreter Lists
Collapsible cards per connected Deaf client:
- Client avatar + name + interpreter count + last updated
- "Live · Read-only" badge
- Expanded view shows: Preferred tier + Secondary tier sections
- Each interpreter row: avatar, name, certifications, specializations
- Work/Personal approval pills (from deaf_roster.approve_work/approve_personal)

### 5I. My Profile
- Org avatar + name + type badge
- Info rows: Primary Contact, Role, Email, Phone, Location, Preferred Mode
- "Note to interpreters" section (editable text block)
- For beta: mocked Stripe payment method section

---

## 6. BUILD PHASES

### Phase 1: Foundation (Day 1-2)
Files to create/modify:
- app/(auth)/request/page.tsx — Landing page
- app/(auth)/request/signup/page.tsx — Signup flow (steps 1-5)
- app/(auth)/request/login/page.tsx — Login page
- app/auth/callback/route.ts — Add requester → /request/dashboard routing
- app/(dashboard)/request/layout.tsx — Dashboard layout + sidebar
- components/layout/RequesterDashboardSidebar.tsx — Sidebar component
- components/layout/Nav.tsx — Add /request/* → signpost:lastRole = 'requester'

CRITICAL: Test multi-role login → role picker → requester card → /request/dashboard

### Phase 2: Booking Creation Chain (Day 3)
Files to create:
- app/(dashboard)/request/dashboard/page.tsx — Dashboard overview
- app/(dashboard)/request/dashboard/new-request/page.tsx — Request form
- app/api/bookings/create/route.ts — OR modify existing booking creation API

This phase writes to: bookings, booking_recipients, booking_dhh_clients
Must verify: interpreter sees the request in their Inquiries page after creation

### Phase 3: Response + Accept Chain (Day 4)
Files to create:
- app/(dashboard)/request/dashboard/requests/page.tsx — All Requests
- app/(dashboard)/request/dashboard/inbox/page.tsx — Inbox
- Rate review + accept flow (modal or inline)

This phase reads: booking_recipients (rate_profile_id, status), interpreter_rate_profiles
Must verify: requester accepts → booking_recipients.status = 'confirmed' → 
interpreter sees confirmation → bookings.interpreters_confirmed increments

### Phase 4: Lists + Connections (Day 5)
Files to create:
- app/(dashboard)/request/dashboard/interpreters/page.tsx — Preferred Interpreters
- app/(dashboard)/request/dashboard/interpreters/secondary/page.tsx — Secondary Tier
- app/(dashboard)/request/dashboard/client-lists/page.tsx — Client Interpreter Lists
- Modify components/directory/AddToListModal.tsx — Add ROLE_CONFIGS['requester']

Must verify: AddToListModal writes to requester_roster (not deaf_roster)
Must verify: Client Interpreter Lists reads connected Deaf users' deaf_roster

### Phase 5: Profile + Polish (Day 6)
Files to create:
- app/(dashboard)/request/dashboard/profile/page.tsx — My Profile
- app/(dashboard)/request/dashboard/drafts/page.tsx — Drafts
- Seed data for requester beta testing
- Beta panel prompts for requester pages
- Mobile responsiveness audit

---

## 7. SHARED COMPONENTS TO REUSE

Do NOT rebuild these — import and configure:
- AddToListModal (add requester config)
- InterpreterCard (directory grid cards)
- InterpreterGrid (directory grid layout)
- LocationPicker (geocoded location input)
- Toast (notification toasts)
- PageHeader (dashboard page headers)
- Language pickers (sign + spoken)

---

## 8. NOTIFICATION TRIGGERS TO ADD

When building each phase, add notification INSERT at each event:

| Event | Type | Recipient | When |
|---|---|---|---|
| Request sent | new_request | Each interpreter | Phase 2 |
| Interpreter responds | rate_received | Requester | Phase 3 |
| Requester accepts | booking_confirmed | Interpreter | Phase 3 |
| Interpreter declines | request_declined | Requester | Phase 3 |
| New message | new_message | Other party | Phase 3 |
| D/HH connection request | dhh_connection_request | Requester | Phase 4 |
| Invoice sent | invoice_received | Requester | Deferred |

Each notification also sends email via Resend (existing /api/notifications/send route).

---

## 9. REQUESTER-SPECIFIC RULES

1. request_type = 'professional' on ALL requester bookings (never 'personal')
2. platform_fee_amount = 15.00 by default
3. platform_fee_status starts as 'pending', moves to 'charged' on accept (mocked for beta)
4. $15 fee is per interpreter per confirmed booking, NOT per request
5. Deaf/DB/HH personal requests are FREE — never route through requester portal
6. "signpost billing is completely separate from interpreter invoicing"
7. The interpreter receives 100% of their rate — signpost never touches interpreter money
8. RequesterDashboardSidebar link to directory: /directory?context=requester
9. "Booking" = confirmed appointment. "Request" = sent/pending item. Never "job."
10. Platform Booking Policy (anti-poaching) applies only to new connections made via signpost

---

## 10. PRE-FLIGHT CHECKLIST (every prompt)

Before writing code for any requester feature:

1. ☐ Verify relevant DB tables exist with correct columns (run SQL via Supabase MCP)
2. ☐ Verify RLS policies allow the operation for the requester role
3. ☐ Check that queries don't use nested embeds with RLS (split into separate queries)
4. ☐ Confirm shared components (AddToListModal, Nav.tsx) have requester support
5. ☐ Check for existing API routes that can be reused vs. creating new ones
6. ☐ Verify notification triggers fire for requester events
7. ☐ Test that multi-role users see correct requester context on shared pages

---

## 11. KNOWN GOTCHAS

- RLS failures are SILENT — returns empty arrays, not errors. Always verify.
- Nested .select() embeds perform inner joins — if embedded table has restrictive RLS,
  parent rows silently drop. Fix: split into separate queries.
- user_profiles.role stores the SIGNUP role, not the active role. Use signpost:lastRole
  from localStorage for active role detection on shared pages.
- bookings.requester_id FK points to auth.users.id (not requester_profiles.id)
- invoices.requester_billing_email is matched against user_profiles.email in RLS —
  requester_profiles.email MUST match user_profiles.email for invoice visibility
- The messages table has TWO messaging systems:
  1. messages table (booking-based, has booking_id + interpreter_id)
  2. conversations/direct_messages/conversation_participants (non-booking DMs)
  Use the messages table for booking-related requester ↔ interpreter communication.
- Three name columns on interpreter_profiles (name, first_name, last_name) — always
  use first_name + last_name, never trust name column alone
