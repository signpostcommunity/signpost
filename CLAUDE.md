# signpost-app — CLAUDE.md

## Project Overview

**signpost-app** is the production Next.js + Supabase migration of the original `signpost` single-file HTML prototype.
The original prototype lives at `/Users/csano/Projects/signpost/index.html` (694KB, vanilla JS, no backend).

**signpost** is a sign language interpreter marketplace/directory. It connects Deaf, DeafBlind, and Hard-of-Hearing individuals,
organizations, and requesters with certified sign language interpreters worldwide.

---

## Product Principle: Tool, Not Service Provider

signpost is a tool, not a service provider. We provide infrastructure that connects Deaf/DB/HH individuals with interpreters directly. We do not book interpreters, coordinate assignments, or arbitrate payment disputes. Customer support scope is limited to technical and bug issues. This reflects existing policies.

Affects:
- Feature decisions (what is in scope vs. deferred)
- Admin tooling scope
- Support responses
- Copy positioning

Example: payment tracking supports marking paid and adding notes. It does not include dispute resolution workflows.

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

## Design System

All UI work MUST follow the design system spec in DESIGN_SYSTEM.md.
Before creating or modifying any UI element:
1. Read DESIGN_SYSTEM.md
2. Identify which hierarchy level (L1-L6) the element belongs to
3. Use the correct font, weight, size, and color from the spec
4. Do not introduce new visual patterns without explicit approval

The design system covers: WCAG AAA color palette, 6-level typography
hierarchy, spacing rules, button styles, form field styles, and portal-
specific accent colors.

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
- **Admin/Service Role:** `lib/supabase/admin.ts` — `getSupabaseAdmin()` — bypasses RLS entirely

### When to use Admin/Service Role
Use the authenticated client by default. Use `getSupabaseAdmin()` only for:
- Public pages that bypass RLS (e.g., /d/[slug] landing page)
- API routes where an authenticated user needs data from a table their RLS doesn't cover (e.g., requester reading a Deaf user's roster via an active connection)
- **Always verify permission FIRST with the authenticated client, THEN use admin for the privileged read.** Never use admin as a shortcut to skip auth checks.
- Service role errors are silent — a bug here exposes data without failing loudly. Check errors on every admin client read.

### Layout Alignment Rule
When adding new UI elements adjacent to existing sections, ALWAYS read the existing layout's CSS/styles first and match the exact same grid/flex ratios. Don't guess at pixel values — read the actual styles on adjacent content and replicate them.

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
├── d/[slug]/
│   ├── page.tsx                       # Public landing page for Deaf user's Interpreter Request Link
│   └── DeafLandingClient.tsx          # Client component: auth state handling, connection creation CTA
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
├── api/
│   ├── connections/
│   │   ├── create/route.ts            # POST: create dhh_requester_connection
│   │   └── preferences/route.ts       # GET: fetch connected Deaf user's roster (service role)
│   ├── request/
│   │   └── booking/route.ts           # POST: requester booking creation, auto-adds DHH participant
│   ├── notifications/
│   │   ├── send/route.ts              # Email delivery via Resend
│   │   └── preferences/route.ts       # User notification preferences
│   ├── check-slug/route.ts            # Slug uniqueness check (interpreter + deaf profiles)
│   └── dhh/
│       └── request/route.ts           # GET/POST: Deaf personal request management
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
    │   ├── page.tsx                   # 2x2 stat grid + QR card, recent requests, preferred interpreters
    │   ├── bookings/page.tsx          # My requests + requests made on my behalf
    │   ├── preferences/page.tsx       # Comm prefs + My Interpreter Request Link (QR, slug editor)
    │   └── interpreters/page.tsx      # 3-tier roster (preferred/approved/dnb)
    ├── request/dashboard/page.tsx     # Requests + bookings + RecommendedInterpreters for connected Deaf users
    └── admin/
        ├── layout.tsx                 # Admin layout + auth check (is_admin gate)
        └── dashboard/
            ├── page.tsx               # Admin overview stats
            ├── AdminOverviewClient.tsx
            ├── users/
            ├── flags/
            ├── feedback/
            └── interpreters/
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
│   ├── DhhDashboardSidebar.tsx        # Deaf portal sidebar (purple accent, roster/requesters badges)
│   ├── AdminSidebar.tsx               # Admin dashboard sidebar (orange accent #ff7e45)
│   └── PendingRolesSection.tsx        # Red-dot pending role indicator for sidebar role switcher
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
├── shared/
│   └── LocationPicker.tsx             # Reusable Country→State→City picker (uses country-state-city npm package)
├── requester-signup/
│   ├── SignupStepper.tsx
│   ├── Step1Role.tsx through Step5Done.tsx
├── dashboard/
│   ├── interpreter/ (OverviewPanel, InquiriesPanel, ConfirmedPanel, InboxPanel)
│   ├── dhh/
│   │   ├── InterpreterRequestLinkCard.tsx  # Dashboard QR card (slug, copy link, edit link)
│   │   ├── RequestTracker.tsx
│   │   └── RosterPanel                     # 3-tier preferred/approved/dnb with approval toggles
│   └── requester/
│       ├── RequestsPanel
│       └── RecommendedInterpreters.tsx     # Tiered interpreter display for connected Deaf user bookings
└── ui/
    ├── GoogleSignInButton.tsx
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
  4. Auto-generates vanity_slug for deaf users
  5. Redirects to appropriate dashboard

### Supabase Setup Required
1. Go to Supabase dashboard → Authentication → Providers → Google → Enable
2. Create OAuth credentials in Google Cloud Console; paste Client ID + Secret into Supabase
3. Add `http://localhost:3000/auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs
4. Add production URL to Redirect URLs when deploying

---

## Supabase Schema

Full schema in `supabase/migrations/001_initial_schema.sql`

**Core Tables:**
- `user_profiles` — extends `auth.users`, stores `role` (interpreter/deaf/requester/org), `is_admin` (boolean, default false), `pending_roles` (text[], default '{}') for multi-role signup
- `interpreter_profiles` — main interpreter data, status: pending/approved/rejected, `vanity_slug` (unique, case-insensitive)
- `interpreter_sign_languages`, `interpreter_spoken_languages`, `interpreter_specializations`, `interpreter_regions`
- `interpreter_certifications`, `interpreter_education`
- `interpreter_rate_profiles` — multiple rate cards per interpreter
- `interpreter_availability` — weekly schedule
- `deaf_profiles` — D/HH user data (id, user_id, name, first_name, last_name, email, pronouns, bio, photo_url, location, state, country, country_name, city, phone, comm_prefs, vanity_slug, profile_video_url, created_at, updated_at)
- `deaf_roster` — interpreter shortlist per Deaf user. Columns: deaf_user_id (FK → deaf_profiles), interpreter_id (FK → interpreter_profiles), tier ('preferred'/'approved'), do_not_book (boolean), approve_work (boolean), approve_personal (boolean), notes, created_at
- `requester_profiles` — requester/org data (id, name, phone, country, city, org_name, org_type, comm_prefs)
- `bookings` — requests linking requester + interpreter
- `booking_recipients` — interpreter assignment per booking (status, wave_number, confirmed_at, declined_at)
- `booking_dhh_clients` — Deaf participants on a booking (dhh_user_id, comm_prefs_snapshot, context_video_url)
- `reviews` — post-booking ratings
- `messages` — per-booking chat
- `notifications` — in-app notifications
- `trusted_deaf_circle` — Deaf-to-Deaf list sharing

### Deaf/Requester Connection System
- `dhh_requester_connections` — links Deaf users to coordinators who book on their behalf
  - Columns: id, dhh_user_id (FK → deaf_profiles, nullable for off-platform), requester_id (FK → requester_profiles), status, initiated_by, requester_org_name, offplatform_name, offplatform_email, offplatform_phone, created_at, confirmed_at, revoked_at
  - Status values: `active`, `pending`, `pending_offplatform`, `revoked`
  - initiated_by values: `dhh` (auto-approves), `requester` (pending until Deaf user approves)
  - Unique constraint on (dhh_user_id, requester_id) WHERE status IN ('active', 'pending')
  - 6 RLS policies: dhh read/update own, requester read/insert, dhh insert, admin read all
- `deaf_profiles.vanity_slug` — public landing page at /d/[slug], case-insensitive unique index
- Preferences API at /api/connections/preferences uses SERVICE ROLE to read deaf_roster (RLS blocks requester access)
- **DNB is sacred:** Do Not Book information must never leak specifics. No count, no names, no indication of whose list. Display only: "Not recommended for this request" with greyed-out styling.

**RLS:** All tables have RLS enabled. Interpreters can read/write own rows; directory only shows `status='approved'` interpreters; rosters/bookings/messages scoped to owner. The `is_booking_dhh_client()` helper function allows Deaf users to see bookings where they're a participant.

---

## Design System

**Brand rules:**
- **"signpost" is ALWAYS lowercase** in all user-facing text. Never "Signpost" or "SIGNPOST". This is a locked design rule.
- **No emoji in UI components.** Use SVG line icons or text only.
- **WCAG 2.2 Level AA minimum** for all color contrast ratios (4.5:1 normal text, 3:1 large text/UI).
- **Admin accent orange: `#ff7e45`** (WCAG AA compliant on dark backgrounds).
- **"CODA" in labels** should always appear as "Deaf-Parented Interpreter / CODA" so hearing users understand the term.
- **Tab bar design** (all tabbed pages): dark grey header (#1a1a24), black active tabs, cyan underline, proper ARIA roles (tablist/tab/tabpanel).
- **Accessibility commitment** is published on the About page → Accessibility tab. All ARIA, semantic HTML, and keyboard navigation patterns must be maintained.

CSS variables defined in `app/globals.css` and mapped to Tailwind tokens via `@theme inline {}`:

```css
--bg: #000000
--surface: #0f1118
--surface2: #161923
--border: #1e2433
--accent: #00e5ff        /* cyan — primary CTA, interpreter/requester branding */
--accent2: #9d87ff       /* purple — D/HH branding */
--accent3: #ff6b85       /* pink — error/alert */
--text: #f0f2f8
--muted: #c8cfe0
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

### Dashboard Layout Convention
The Deaf dashboard uses `display: grid; grid-template-columns: 1.5fr 1fr` for two-column sections.
- Left column (1.5fr): primary content (stats, recent requests)
- Right column (1fr): secondary content (QR card, preferred interpreters)
- New dashboard elements must use this same ratio to maintain column alignment.

### Connection System UI Patterns
- Interpreter Request Link card: QR code (cyan on #111118), monospace URL, Copy Link button with "Copied!" feedback
- Tier labels on interpreter cards: "Top Choice" (cyan), "Approved" (muted), "Not recommended for this request" (greyed out, opacity 0.4, pointer-events: none)
- Setting-specific indicators: "Preferred for personal settings" / "Preferred for work settings" (muted, italic, informational only, never blocking)

---

## Environment Variables

File: `.env.local` (not committed)

```
NEXT_PUBLIC_SUPABASE_URL=https://udyddevceuulwkqpxkxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
RESEND_API_KEY=<resend api key>
STRIPE_SECRET_KEY=<stripe secret key>
STRIPE_PUBLISHABLE_KEY=<stripe publishable key>
STRIPE_WEBHOOK_SECRET=<stripe webhook secret>
```

---

## Development

```bash
npm run dev        # Start dev server at localhost:3000
npm run build      # Build (zero errors expected)
npm run lint       # ESLint check
npm run seed       # Seed demo interpreters into Supabase
```

**Seed script note:** `lib/data/seed-script.ts` uses `dotenv` and is excluded from `tsconfig.json`
`exclude` array to avoid build-time errors. Run it directly with `ts-node` or via `npm run seed`.

**Seed data rules:** Only use fake celebrity profiles as interpreters: Betty White, Keanu Reeves, Idris Elba, Oprah Winfrey. Never use real interpreter names in seed/test data. Primary test account: mollysano.nicm@gmail.com (has interpreter + deaf + admin roles).

---

## Key Data Files

- `lib/data/seed.ts` — hardcoded interpreters (`interpretersData` array) plus `ALL_SIGN_LANGS`, `ALL_SPOKEN_LANGS`, `ALL_SPECS`, `ALL_CERTS`, `ALL_REGIONS` arrays
- `lib/types.ts` — TypeScript interfaces: `InterpreterProfile`, `RateProfile`, `Certification`, `Education`, etc.
- `lib/slugUtils.ts` — `generateSlug()` and `validateSlug()` for vanity URLs (interpreter + deaf profiles)
- `lib/email.ts` — Resend email delivery utility
- `lib/email-template.ts` — HTML email template wrapper
- `lib/notifications-server.ts` — server-side notification service (uses admin client)
- `lib/notifications.ts` — client-side notification helper
- `lib/hooks/useFocusTrap.ts` — reusable hook for modal focus trapping

---

## User Roles

| Role | Portal | Dashboard |
|---|---|---|
| `interpreter` | `/interpreter` | `/interpreter/dashboard` |
| `deaf` | `/dhh` | `/dhh/dashboard` |
| `requester` | `/request` | `/request/dashboard` |
| `org` | `/request` | `/request/dashboard` |
| admin (any role) | — | `/admin/dashboard` |

Users can hold multiple roles simultaneously. The sidebar includes a "Change Hats" role switcher.

**Admin access:** Controlled by `user_profiles.is_admin` boolean column. Admin routes at `/admin/*` check this column in the layout and redirect non-admins to `/`. Admin dashboard uses orange accent (`#ff7e45`).

---

## Safety Rules

### Pre-flight: Design System Compliance

Every prompt that modifies UI must include this verification step:
- Confirm all new/modified elements follow DESIGN_SYSTEM.md
- No font-weight 775 except Level 1 page headlines (800 is reserved for logo/wordmark only)
- No text colors outside the approved palette
- No font sizes below 12px
- Card backgrounds: #111118 only
- Button border-radius: 10px (not 8px, not 100px)

### Before writing any code
1. **Verify column names before querying.** Run `SELECT column_name FROM information_schema.columns WHERE table_name = '[table_name]'` to confirm columns exist and names are exact. A wrong column name in a nested select causes a 400 error that silently breaks the entire query.
2. **Check errors on every write AND every service role read.** Service role bypasses RLS, so bugs expose data silently.
3. **Match existing layout ratios.** Before adding any new UI section to a page, read the adjacent sections' layout styles (grid-template-columns, flex ratios) and match exactly. Don't guess pixel values.

### Component rules
4. **Create wrapper components, not modifications.** When adding tier labels, badges, or visual overlays to existing components (like interpreter cards), create WRAPPER components. Never modify the base component — other pages depend on it.
5. **Protect existing functionality.** Never remove or modify existing routes, variable names, or component props unless explicitly asked.

### Supabase-specific
6. **RLS is silent.** Supabase RLS failures don't surface as errors — they silently drop rows or block writes. Nested embeds in `.select()` perform inner joins; if the embedded table has restrictive RLS, the join silently drops parent rows. Fix: split into separate queries.
7. **Text array columns** (e.g., `sign_languages text[]`) require `contains()` / `@>` operator, not `.eq()` or `.in()`.
8. **Multi-statement queries** only return last result — run as separate `execute_sql` calls.
9. **deaf_profiles dual-ID pattern:** deaf_profiles has both `id` and `user_id` columns. Currently they always match, but all queries should use `.or('id.eq.${userId},user_id.eq.${userId}')` for safety.

### DNB protection
10. **Do Not Book is sacred.** DNB information must never leak specifics — no count, no names, no indication of whose list an interpreter is on. The only permitted display is "Not recommended for this request" with greyed-out styling.

---

## Verification & Commit Discipline

*Added after the 4/20 deploy cascade (commits 861f049 → e2bf31d). Three rules to prevent cascading Vercel failures, orphan file accumulation, and scope drift.*

### Rule 1 — Use `npx next build` for verification, not `npx tsc --noEmit`

For any commit that will deploy to Vercel, run `npx next build` as the final verification step. Do NOT rely on `npx tsc --noEmit` alone.

If `next build` is infeasible in the current environment (e.g., Chromebook OOM with exit code 135 bus error), fall back to `npx tsc --noEmit` but EXPLICITLY note the limitation in the final report with the exact phrase: "next build was not run locally due to [reason]; tsc passed clean; Vercel build is the authoritative verification."

**Why:** On 4/20, commit 861f049 passed `tsc --noEmit` but failed on Vercel with three TS2352 errors in OverviewClient.tsx. Every subsequent commit inherited the broken tree. Vercel uses `next build` which enforces stricter type checks than bare `tsc`, including stricter narrowing rules for cast expressions.

**When `next build` is required:**
- Commit touches a new file that deploys
- Commit touches configuration (next.config.ts, tsconfig.json)
- Commit adds dependencies

**When `tsc` alone is sufficient:**
- Docs-only changes (README, markdown)

### Rule 2 — Final report must surface orphan files

Before any commit, run these two commands and include output in the final report:

```bash
git status --short
git diff --stat
```

In the final report, under a **"Working tree state"** heading, list:
- Every file that was modified, staged or not
- Every untracked file
- For any file NOT included in the commit, explain why in one sentence

If the working tree is clean after the commit, say explicitly: **"Working tree clean — no orphan files."**

**Why:** Between 4/20 commits 861f049 and e2bf31d, three consecutive sessions left uncommitted work in the tree (policies pages unstaged, lib/populateNewProfile.ts unstaged, 247 lines of multirole WIP across signup files). None flagged the orphan files prominently. Three separate orphan sets accumulated silently.

**If orphan files from a prior session are found:**
1. Report them explicitly at the start of the session
2. Ask for guidance rather than auto-committing them
3. If user confirms they should be ignored, stash them with `git stash push -m "descriptive-label" <paths>` before starting work

### Rule 3 — Investigation-only prompts must not write code

If a prompt's scope is labeled "investigation only," "analysis only," "no code," "report only," or similar:

1. Do NOT make any file-editing tool calls
2. If you find yourself wanting to edit code to complete the analysis, STOP before the first edit
3. Report the scope mismatch in a final report labeled **"SCOPE ESCALATION REQUIRED"**
4. Wait for explicit user authorization before proceeding

The final report should include: what you found, why code changes seem necessary, and a proposed scope for a follow-up prompt.

**Why:** On 4/20, an investigation-only prompt drifted into writing code across three signup files and a shared helper. The session crashed, leaving 247 lines of WIP that required 90 minutes of manual recovery. The failure was scope drift without mid-task flagging.

**Scope indicators — no code:** "investigate," "analyze" (without "and fix"), "report only," "produce a report," "do not modify files," "diagnostic" / "diagnose without fixing"

**Scope indicators — code authorized:** "fix," "implement," "refactor," "update," "add," "remove," or explicit file-editing instructions in the body

If scope is genuinely ambiguous, default to investigation-only and ask: "Should I proceed with code changes in a follow-up prompt, or is this expected within current scope?"

---

## Known Issues / Gotchas

- **`proxy.ts` not `middleware.ts`**: Next.js 16 changed the auth middleware filename convention.
- **Tailwind v4**: No `tailwind.config.ts` exists. Do not create one — add new tokens to the `@theme inline {}` block in `globals.css`.
- **Seed script excluded from build**: `lib/data/seed-script.ts` is in `tsconfig.json` `exclude` because it imports `dotenv` which isn't in Next.js deps.
- **Route groups**: The `(public)`, `(auth)`, `(dashboard)` directories are Next.js route groups — they don't appear in the URL path.
- **D/DB/HH terminology**: All user-facing text uses "Deaf/DB/HH" (Deaf, DeafBlind, Hard of Hearing). Standalone "Deaf" is fine as shorthand. Routes use `/dhh`, and `user_profiles.role` stores `'deaf'` as the role value.
- **RLS on deaf_roster blocks requester reads:** The preferences API MUST use admin/service role to read deaf_roster entries for connected Deaf users. Connection verified first with authenticated client, then admin used for the roster read.
- **Migration files vs applied migrations:** Some migrations were applied directly via Supabase MCP (e.g., dhh_requester_connections). Migration files in supabase/migrations/ may duplicate already-applied changes. Since Supabase CLI is not linked locally, these files are documentation only.
- **Static files:** Static HTML pages (feature sheets, one-pagers) go in `public/features/`. Served by Vercel at `signpost.community/features/[filename].html`.
- **Claude Code prompt batching:** Claude Code can run multiple sequential prompts in a single session if the full spec is provided upfront. This is faster and more context-aware than separate sessions with git pull between each.
- **Vercel env vars are silent when missing.** Missing or misassigned env vars fail silently. All env vars must be on `signpost-pdir` project and set to All Environments.

---

## Prototype Comparison Protocol

### Working Rules

1. **No piecemeal fixes.** Read the ENTIRE component, identify ALL problems at once, fix everything in one pass. One commit.

2. **Prototype-first.** Before touching any UI, grep /home/mollysano/signpost/index.html for the relevant section. If the Next.js version doesn't match exactly, full rewrite — not a patch.

3. **Intentional additions are sacred — never remove:**
   - Log in button in logged-out nav
   - Beta feedback panel
   - force-dynamic on all server pages
   - onAuthStateChange + initialSession in Nav
   - router.refresh() before router.push() on auth redirects

4. **Read before you write.** cat the actual file. grep for the specific lines. Then write the fix.

5. **Diagnose completely before fixing.** Identify root cause first. Do not try the first thing that comes to mind.

When in doubt, ask before removing anything. The prototype is the visual contract — not the feature contract.

---

## Current State

### Active priorities
Check Monday.com board 18402265380 for current tasks and priorities.
Filter by status "Working on it" or priority "Critical" for what to work on next.
Workspace ID: 14529137.

### Recently added files
Update this list when adding major new features. Remove entries once they're established.

| File / Directory | Purpose |
|---|---|
| app/d/[slug]/ | Public Deaf user landing page (Connection System) |
| app/api/connections/create/ | POST: create dhh_requester_connection |
| app/api/connections/preferences/ | GET: fetch connected Deaf user's roster (service role) |
| app/api/request/booking/ | POST: requester booking creation, auto-adds DHH participant |
| components/dashboard/dhh/InterpreterRequestLinkCard.tsx | Dashboard QR card |
| components/dashboard/requester/RecommendedInterpreters.tsx | Tiered interpreter display for bookings |
| components/dashboard/requester/PaymentMethodSection.tsx | Stripe payment method CRUD (real, replaces mock) |
| lib/stripe.ts | Stripe server client + publishable key helper |
| app/api/stripe/ | Stripe API routes: customer, setup-intent, payment-method, charge-platform-fee, booking-credit |
| app/api/webhooks/stripe/ | Stripe webhook handler (payment events, disputes) |
| app/api/admin/payment-stats/ | Admin API: fees collected, failed, credits outstanding |
| supabase/migrations/031_stripe_payment_integration.sql | Stripe columns + booking_credits table |
| public/features/deaf.html | Deaf portal feature sheet (static) |

### Known incomplete work
- Connection System Phase 2: requester-initiated flow, off-platform invites, decline messaging
- Connection System Phase 3: multi-participant matching algorithm
- Beta questions system: welcome modal, per-page panel, final survey (content in Monday doc object_id 18404390225)
- Dashboard QR card: height needs to match stat grid, text needs update
- D/HH signup audit: test script exists, not yet run
- Requester portal: Phase 1 (landing, signup, login, dashboard layout, sidebar) built; Phase 2+ (booking form, inbox, requests) not started

### Environment variables
No recent additions. All required vars documented in Environment Variables section above.

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
