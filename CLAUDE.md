# signpost-app — CLAUDE.md

## Project Overview

**signpost-app** is the production Next.js + Supabase migration of the original `signpost` single-file HTML prototype.
The original prototype lives at `/Users/csano/Projects/signpost/index.html` (694KB, vanilla JS, no backend).

**signpost** is a sign language interpreter marketplace/directory. It connects Deaf/Hard-of-Hearing individuals,
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
│   │   ├── page.tsx                   # D/HH portal landing
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
    ├── dhh/dashboard/page.tsx         # Roster management + approvals
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
│   └── DashboardSidebar.tsx           # Sidebar with badge counts, role-aware styling
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
│   ├── deaf/ (RosterPanel, ShareModal)
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
- `deaf_profiles` — D/HH user data
- `deaf_roster` — interpreter shortlist (top/preferred/backup tiers)
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
- **D/HH routes**: All Deaf/Hard-of-Hearing routes use `/dhh` — not `/deaf`. `user_profiles.role` still stores `'deaf'` as the role value.

---

## Session Handoff

### Session 4 — March 3, 2026

**Completed:**
- ✅ Claude Code installed and configured on Chromebook Linux environment
- ✅ GitHub auth configured with personal access token on remote URL
- ✅ `app/(auth)/interpreter/page.tsx` — full redesign matching prototype: left-aligned layout, correct headline "Your interpreter profile, working for you." with purple→cyan gradient, two-column cards with icon squares, full-width CTA buttons
- ✅ `app/(auth)/interpreter/signup/page.tsx` — restored correct 6-step form (was accidentally overwritten with landing page content), then rewrote Step 1 to match prototype: 3-column field grids, Professional Bio, Interpreter Type/Mode/Work/Years dropdowns, Website/LinkedIn fields, Regions travel grid with colored dot tiles, Event Coordination checkbox with conditional reveal
- ✅ `app/(auth)/layout.tsx` — replaced minimal wordmark header with full Nav component and Footer

**In progress / pick up here next session:**
- Interpreter signup Steps 2–6 audit vs prototype
- Deaf/HoH signup flow audit
- Requester signup flow audit
- Footer component — confirm it exists and is wired up correctly
- Platform Policies doc expansions (due Mar 6–7): HIPAA-adjacent medical booking language, interpreter sub-finding responsibility, data privacy and retention policy
