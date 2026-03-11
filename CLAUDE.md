# signpost-app — CLAUDE.md

## Project Overview

**signpost-app** is the production Next.js + Supabase migration of the original `signpost` single-file HTML prototype.
The original prototype lives at `/Users/csano/Projects/signpost/index.html` (694KB, vanilla JS, no backend).

**signpost** is a sign language interpreter marketplace/directory. It connects Deaf, DeafBlind, and Hard-of-Hearing individuals,
organizations, and requesters with certified sign language interpreters worldwide.

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth + DB | Supabase (Auth + Postgres + RLS) |
| Fonts | Syne (headings) + DM Sans (body) via `next/font/google` |
| Package manager | npm |

---

## Critical Conventions

### Tailwind CSS v4
- **No `tailwind.config.ts`** — Tailwind v4 uses a `@theme inline {}` block in `app/globals.css`
- Import: `@import "tailwindcss";` at the top of `globals.css`
- All custom tokens (colors, fonts, radius) are defined in the `@theme inline {}` block

### Middleware (auth guard)
- **File is `proxy.ts` at the root** — NOT `middleware.ts`
- Next.js 16 renamed the convention; the file exports `proxy` (not `middleware`) and `config`
- Protects `/interpreter/dashboard/*`, `/dhh/dashboard/*`, `/request/dashboard/*`
- Unauthenticated users → redirect to relevant portal login
- Authenticated users with wrong role → redirect to their correct portal

### Supabase Clients
- **Browser (Client Components):** `lib/supabase/client.ts` — `createBrowserClient()`
- **Server (Server Components, Route Handlers):** `lib/supabase/server.ts` — `createServerClient()` with `cookies()`

---

## Route Structure

```
app/
├── layout.tsx                         # Root layout: fonts, <html>, <body>
├── auth/callback/route.ts             # Google OAuth callback handler
├── (public)/
│   ├── layout.tsx                     # Nav + Footer wrapper
│   ├── page.tsx                       # Home page (hero + features)
│   ├── about/page.tsx
│   └── directory/
│       ├── page.tsx                   # Directory: filter sidebar + interpreter grid
│       └── [id]/
│           ├── page.tsx               # generateStaticParams + metadata
│           └── ProfileClient.tsx      # 4-tab profile (Overview, Credentials, Rates, Availability)
├── (auth)/
│   ├── layout.tsx                     # Nav + Footer wrapper (same as public)
│   ├── interpreter/
│   │   ├── page.tsx                   # Interpreter portal landing
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx            # 6-step form (client component)
│   ├── dhh/
│   │   ├── page.tsx                   # D/HH portal landing (imports DeafPortalClient)
│   │   ├── DeafPortalClient.tsx       # Inline signup/login forms matching prototype
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── request/
│       ├── page.tsx                   # Requester portal landing
│       ├── login/page.tsx
│       └── signup/page.tsx            # 5-step form
└── (dashboard)/
    ├── layout.tsx                     # Sticky top bar only
    ├── interpreter/dashboard/
    │   ├── layout.tsx                 # DashboardSidebar
    │   ├── page.tsx                   # Stats + pending inquiries
    │   ├── inquiries/page.tsx
    │   ├── confirmed/page.tsx
    │   ├── inbox/page.tsx
    │   ├── profile/page.tsx
    │   ├── rates/page.tsx
    │   ├── availability/page.tsx
    │   ├── team/page.tsx
    │   └── client-lists/page.tsx
    ├── dhh/dashboard/
    │   ├── layout.tsx                 # DhhDashboardSidebar (purple accent)
    │   └── page.tsx                   # My Preferred Interpreters — 3-tier roster (preferred/approved/dnb)
    └── request/dashboard/page.tsx    # Requests + bookings
```

**Important:** The D/HH portal and dashboard use `/dhh` (not `/deaf`). All route references use `/dhh`.

---

## Component Structure

```
components/
├── layout/
│   ├── Nav.tsx                        # Responsive nav (desktop links + mobile drawer)
│   ├── Footer.tsx
│   ├── DashboardSidebar.tsx           # Interpreter sidebar with badge counts
│   └── DhhDashboardSidebar.tsx        # Deaf portal sidebar (purple accent, roster/requesters badges)
├── directory/
│   ├── FilterSidebar.tsx              # 9 filter groups
│   ├── InterpreterGrid.tsx
│   ├── InterpreterCard.tsx
│   └── FilterChip.tsx
├── profile/
│   ├── ProfileHero.tsx
│   ├── ProfileTabs.tsx
│   ├── OverviewTab.tsx
│   ├── CredentialsTab.tsx
│   ├── RatesTab.tsx                   # Collapsible rate cards
│   └── AvailabilityTab.tsx            # Weekly grid
├── interpreter-signup/
│   ├── SignupStepper.tsx
│   ├── Step1Personal.tsx through Step6Review.tsx
├── requester-signup/
│   ├── SignupStepper.tsx
│   ├── Step1Role.tsx through Step5Done.tsx
├── dashboard/
│   ├── interpreter/ (OverviewPanel, InquiriesPanel, ConfirmedPanel, InboxPanel)
│   ├── deaf/ (RosterPanel — 3-tier preferred/approved/dnb with approval toggles)
│   └── requester/ (RequestsPanel)
└── ui/
    ├── GoogleSignInButton.tsx         # Google OAuth sign-in/up button
    ├── Toast.tsx
    ├── Chip.tsx
    ├── RatingStars.tsx
    ├── CalendarDropdown.tsx
    └── RegionBadge.tsx
```

---

## Authentication

### Email/Password
- Interpreter signup: 6-step form → `supabase.auth.signUp()` → insert `user_profiles` (role=interpreter) + `interpreter_profiles`
- D/HH signup: form → `supabase.auth.signUp()` → insert `user_profiles` (role=deaf) + `deaf_profiles`
- Requester signup: 5-step form → `supabase.auth.signUp()` → insert `user_profiles` (role=requester) + `requester_profiles`
- Login: `supabase.auth.signInWithPassword()` → read `user_profiles.role` → redirect to dashboard

### Google OAuth
- Button: `components/ui/GoogleSignInButton.tsx`
- Calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback?role=<role>' } })`
- Callback at `app/auth/callback/route.ts`:
  1. Exchanges code for session
  2. Checks if `user_profiles` row exists (returning user → redirect to dashboard)
  3. New user → creates `user_profiles` + role-specific profile row
  4. Redirects to appropriate dashboard

### Supabase Setup Required
1. Go to Supabase dashboard → Authentication → Providers → Google → Enable
2. Create OAuth credentials in Google Cloud Console; paste Client ID + Secret into Supabase
3. Add `http://localhost:3000/auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs
4. Add production URL to Redirect URLs when deploying

---

## Supabase Schema

Full schema in `supabase/migrations/001_initial_schema.sql`

**Tables:**
- `user_profiles` — extends `auth.users`, stores `role` (interpreter/deaf/requester/org)
- `interpreter_profiles` — main interpreter data, status: pending/approved/rejected
- `interpreter_sign_languages`, `interpreter_spoken_languages`, `interpreter_specializations`, `interpreter_regions`
- `interpreter_certifications`, `interpreter_education`
- `interpreter_rate_profiles` — multiple rate cards per interpreter
- `interpreter_availability` — weekly schedule
- `deaf_profiles` — D/HH user data (id, user_id, name, first_name, last_name, email, pronouns, bio, photo_url, location, state, country, country_name, city, phone, comm_prefs, created_at, updated_at)
- `deaf_roster` — interpreter shortlist (preferred/approved/dnb tiers), with approve_work + approve_personal toggles
- `requester_profiles` — requester/org data
- `bookings` — job requests linking requester + interpreter
- `reviews` — post-booking ratings
- `messages` — per-booking chat

**RLS:** All tables have RLS enabled. Interpreters can read/write own rows; directory only shows `status='approved'` interpreters; rosters/bookings/messages scoped to owner.

---

## Design System

CSS variables defined in `app/globals.css` and mapped to Tailwind tokens via `@theme inline {}`:

```css
--bg: #000000
--surface: #0f1118
--surface2: #161923
--border: #1e2433
--accent: #00e5ff        /* cyan — primary CTA */
--accent2: #9d87ff       /* purple — D/HH branding */
--accent3: #ff6b85       /* pink — error/alert */
--text: #f0f2f8
--muted: #b0b8d0
--card-bg: #0d1220
--radius: 16px
--radius-sm: 10px
```

**Reusable CSS classes** (defined in `globals.css`):
- `.btn-primary` — cyan gradient CTA button
- `.btn-large` — larger variant
- `.chip` — filter/tag chip
- `.available-badge` — green dot + "Available" label
- `.wordmark` — signpost logo with styled `<span>`

---

## Environment Variables

File: `.env.local` (not committed)

```
NEXT_PUBLIC_SUPABASE_URL=https://udyddevceuulwkqpxkxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

For the seed script only (not in Next.js runtime):
```
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

---

## Development

```bash
npm run dev        # Start dev server at localhost:3000
npm run build      # Build (36 pages, zero errors expected)
npm run lint       # ESLint check
npm run seed       # Seed 10 demo interpreters into Supabase
```

**Seed script note:** `lib/data/seed-script.ts` uses `dotenv` and is excluded from `tsconfig.json`
`exclude` array to avoid build-time errors. Run it directly with `ts-node` or via `npm run seed`.

---

## Key Data Files

- `lib/data/seed.ts` — 10 hardcoded interpreters (`interpretersData` array) matching the original HTML mock data, plus `ALL_SIGN_LANGS`, `ALL_SPOKEN_LANGS`, `ALL_SPECS`, `ALL_CERTS`, `ALL_REGIONS` arrays
- `lib/types.ts` — TypeScript interfaces: `InterpreterProfile`, `RateProfile`, `Certification`, `Education`, etc.
- `public/hero.jpg` — hero image extracted from original `index.html` (was base64-encoded at ~line 2317)

---

## User Roles

| Role | Portal | Dashboard |
|---|---|---|
| `interpreter` | `/interpreter` | `/interpreter/dashboard` |
| `deaf` | `/dhh` | `/dhh/dashboard` |
| `requester` | `/request` | `/request/dashboard` |
| `org` | `/request` | `/request/dashboard` |

---

## Known Issues / Gotchas

- **`proxy.ts` not `middleware.ts`**: Next.js 16 changed the auth middleware filename convention.
- **Tailwind v4**: No `tailwind.config.ts` exists. Do not create one — add new tokens to the `@theme inline {}` block in `globals.css`.
- **Seed script excluded from build**: `lib/data/seed-script.ts` is in `tsconfig.json` `exclude` because it imports `dotenv` which isn't in Next.js deps.
- **Route groups**: The `(public)`, `(auth)`, `(dashboard)` directories are Next.js route groups — they don't appear in the URL path.
- **D/DB/HH terminology**: All user-facing text uses "Deaf/DB/HH" (Deaf, DeafBlind, Hard of Hearing) or "D/DB/HH". Standalone "Deaf" is fine as shorthand. Routes still use `/dhh`, and `user_profiles.role` still stores `'deaf'` as the role value.
- **WCAG focus trap hook**: `lib/hooks/useFocusTrap.ts` — reusable hook for modal focus trapping. Import and call `useFocusTrap(isOpen)`, assign returned ref to the dialog container div.

---

## ⚠️ PROTOTYPE COMPARISON PROTOCOL

### NON-NEGOTIABLE WORKING RULES

1. **No piecemeal fixes.** Read the ENTIRE component, identify ALL problems at once, fix everything in one pass. One commit. Not fix → deploy → find next issue → fix → deploy again.

2. **Prototype-first.** Before touching any UI, grep /home/mollysano/signpost/index.html for the relevant section. If the Next.js version doesn't match exactly, full rewrite — not a patch.

3. **Intentional additions are sacred — never remove:**
   - Log in button in logged-out nav
   - Beta feedback panel
   - force-dynamic on all server pages
   - onAuthStateChange + initialSession in Nav
   - router.refresh() before router.push() on auth redirects

4. **Read before you write.** cat the actual file. grep for the specific lines. Then write the fix.

5. **Diagnose completely before fixing.** Identify root cause first. Do not try the first thing that comes to mind.

### ⚠️ CRITICAL RULES — READ BEFORE ANY UI WORK

1. **Prototype-first:** Before touching any component or page, read the corresponding section of the original HTML prototype at /home/mollysano/signpost/index.html. If the Next.js implementation does not match the prototype exactly, do a full rewrite based on the prototype. Do not patch.

2. **Intentional additions are sacred:** Some features were deliberately added to the Next.js app that do NOT exist in the prototype. These must never be removed when aligning to the prototype. Current intentional additions include:
   - Log in button in the logged-out nav (between D/DB/HH Portal and Request Interpreters)
   - Beta feedback panel on all pages
   - force-dynamic exports on server pages
   - onAuthStateChange session management in Nav
   - initialSession prop passed from layouts to Nav

   When in doubt, ask before removing anything. The prototype is the visual contract — not the feature contract.

---

## Session Handoff

### Session 6 — March 10, 2026

**Completed:**
- ✅ DB migration `006_deaf_profiles_columns_and_rls.sql`: Added pronouns, bio, photo_url, email, user_id, first_name, last_name, location, state, country_name, created_at, updated_at to deaf_profiles
- ✅ Updated deaf_roster tiers from top/preferred/backup → preferred/approved/dnb to match prototype
- ✅ RLS policies updated for deaf_profiles (id OR user_id matching) + deaf_roster (scoped via deaf_profiles lookup)
- ✅ Deaf portal landing page: full rewrite matching prototype — purple pill badge, hero with gradient, two-card grid (signup/login), inline form area
- ✅ Deaf signup flow: inline form with first_name + last_name + email + password → signUp + user_profiles + deaf_profiles insert
- ✅ Deaf login flow: inline form with email + password → signInWithPassword → redirect to dashboard
- ✅ Auth callback updated to write first_name, last_name, email, user_id to deaf_profiles for OAuth users
- ✅ DhhDashboardSidebar rewritten: purple accent (#9d87ff), user info header with gradient avatar + "Deaf Individual" label, full prototype nav (My Preferred Interpreters, Personal Interpreter Request, Preferences & Profile, My Requesters, Share My List, Back to signpost), badge counts from deaf_roster
- ✅ Dashboard layout updated to fetch first_name/last_name from deaf_profiles
- ✅ My Preferred Interpreters tab: full rewrite with 3-tier sections (preferred/approved/dnb), interpreter cards with tier badges, approval toggles (work/personal), tier move controls, note editing, remove — all wired to Supabase deaf_roster

**In progress / pick up here next session:**
- Interpreter signup Steps 2–6 audit vs prototype
- Requester signup flow audit
- Platform Policies doc expansions: HIPAA-adjacent medical booking language, interpreter sub-finding responsibility, data privacy and retention policy
- Remaining deaf dashboard tabs: Personal Interpreter Request, Preferences & Profile, My Requesters, Share My List

### Session 5 — March 10, 2026

**Completed:**
- ✅ Global "Deaf/HH" → "Deaf/DB/HH" across all user-facing text (8 files: Nav, portal pages, login, signup, sidebar, beta panel, confirmed page). Routes/variables/DB unchanged.
- ✅ D/HH + Requester coming-soon overlay copy updated (no longer centers interpreters over Deaf visitors)
- ✅ Privacy policy rates language verified correct (already says "shared privately when an interpreter responds to a booking inquiry")
- ✅ Stat card top-alignment fix (flexDirection: column on Link wrapper)
- ✅ WCAG 2.2 Level AA remediation (29 files, 1 new): skip nav, aria-live, keyboard a11y for non-buttons, form label associations, aria-expanded on collapsibles, aria-hidden on decoratives, semantic landmarks (<aside> on sidebars), form validation ARIA, modal focus trapping (new useFocusTrap hook at lib/hooks/useFocusTrap.ts), focus-not-obscured CSS, min target size CSS, heading hierarchy fix, focus-visible indicator
- ✅ Monday board updated: 3 tasks marked Done

**In progress / pick up here next session:**
- Interpreter signup Steps 2–6 audit vs prototype
- Deaf/HoH signup flow audit
- Requester signup flow audit
- Platform Policies doc expansions: HIPAA-adjacent medical booking language, interpreter sub-finding responsibility, data privacy and retention policy

### Session 4 — March 3, 2026

**Completed:**
- ✅ Claude Code installed and configured on Chromebook Linux environment
- ✅ GitHub auth configured with personal access token on remote URL
- ✅ `app/(auth)/interpreter/page.tsx` — full redesign matching prototype
- ✅ `app/(auth)/interpreter/signup/page.tsx` — restored correct 6-step form, rewrote Step 1 to match prototype
- ✅ `app/(auth)/layout.tsx` — replaced minimal wordmark header with full Nav component and Footer
