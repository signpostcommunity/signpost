# Portal Frame Audit - 2026-04-28

## Summary

**8 surfaces found** where a logged-in user navigates from inside their portal (dashboard frame with sidebar, hat selector) to a page that renders with the public top nav (signpost wordmark + Browse Directory + My Portal + EN pill) instead of the portal frame.

**Recommended fix path:** Option 1 (conditional layout wrap), applied to the 3 high-traffic surfaces first.

**Pre-launch scoping:** Ship a minimal fix covering `/directory/[id]` and `/invite` before May 1. Defer the remaining 6 surfaces to post-launch.

---

## Methodology

1. Listed every `page.tsx` in the app directory and grouped by route group: `(dashboard)`, `(public)`, `(auth)`, and standalone (`d/[slug]`, `auth/callback`).
2. Identified the layout inheritance chain for each group:
   - `(dashboard)` pages inherit `app/(dashboard)/layout.tsx` which renders `DashboardHeaderNav` (dashboard top bar with wordmark). Portal-specific sidebars are rendered by nested layouts (e.g., `interpreter/dashboard/layout.tsx` renders `DashboardSidebar`).
   - `(public)` pages inherit `app/(public)/layout.tsx` which renders `Nav` (public top nav) + `Footer`.
   - `(auth)` pages inherit `app/(auth)/layout.tsx` which also renders `Nav` + `Footer`.
   - `d/[slug]` inherits only `app/layout.tsx` (bare root layout, no nav, no footer).
3. Searched all dashboard pages and components for outbound links (Link href, router.push) targeting non-dashboard routes.
4. For each destination route under `(public)`, verified whether it has any auth-aware layout wrapping. Only `/directory` (the listing) has the `DirectoryPortalSidebar` wrapper added in the Monday 11813170128 fix. All other `(public)` pages render the public nav unconditionally.
5. Categorized each surface by type, traffic, and fix complexity.

---

## Surface Enumeration

### Entity Detail Pages

| # | Path | Reached From | Current Layout | Role-aware? | Notes |
|---|------|-------------|----------------|-------------|-------|
| 1 | `/directory/[id]` | Directory grid cards (all 3 portals), booking cards in DHH bookings/requests, interpreter cards in DHH interpreters/circle, requester client-lists, requester interpreters list, requester requests, requester overview, interpreter overview team links, admin flags, admin interpreters | Public top nav (Nav + Footer via `(public)/layout.tsx`) | **Partially.** `ProfileClient.tsx` detects user role client-side and adjusts CTAs (e.g., "Book this interpreter" href changes based on deaf vs requester role, video request button checks auth). But the page chrome is always the public nav. | **Highest traffic surface.** Every directory click funnels here. The profile page has role-dependent behavior (different booking CTAs for deaf vs requester, add-to-list modal) that would benefit from portal context. |
| 2 | `/book/[slug]` | Interpreter profile page embed code, external shared links | Public top nav (Nav + Footer via `(public)/layout.tsx`) | No. No auth check. Renders same `ProfileClient` component as `/directory/[id]`. | Reachable from interpreter dashboard profile page (embed code). Lower traffic from inside portal since the embed is meant for external sharing. |

### Action Pages

| # | Path | Reached From | Current Layout | Role-aware? | Notes |
|---|------|-------------|----------------|-------------|-------|
| 3 | `/invite` | Sidebar "Invite Interpreters" link in all 3 portal sidebars (`DashboardSidebar`, `DhhDashboardSidebar`, `RequesterDashboardSidebar`) | Public top nav (Nav + Footer via `(public)/layout.tsx`) | **Partially.** `InviteClient.tsx` detects auth client-side to pre-fill sender name/email and skip manual entry. But layout chrome is public nav. | **High traffic.** Prominent sidebar CTA in every portal. Confirmed by Molly as a known defect surface. |
| 4 | `/help/calendar-sync` | Interpreter dashboard profile page "How to add this to my calendar" link, `CalendarSyncCard` component | Public top nav (Nav + Footer via `(public)/layout.tsx`) | No. Pure static help content. | Low traffic. Only reachable from interpreter dashboard. Static content page -- minimal need for portal frame. |
| 5 | `/feedback/deaf-beta` | Beta feedback panel (if active) | Public top nav (Nav + Footer via `(public)/layout.tsx`) | No. Client-only form, no auth detection for layout. | Low traffic. Beta-specific, may be removed post-launch. |
| 6 | `/about` | Footer "About Us" link (appears on all pages including dashboard), Nav mobile drawer | Public top nav (Nav + Footer via `(public)/layout.tsx`) | No. | Low traffic from portal context. Users clicking footer links are browsing, not in a workflow. |
| 7 | `/policies` | Footer "Terms & Policies" link | Public top nav (Nav + Footer via `(public)/layout.tsx`) | No. | Same as above. Informational page. |
| 8 | `/privacy` | Footer "Privacy Policy" link | Public top nav (Nav + Footer via `(public)/layout.tsx`) | No. | Same as above. Informational page. |

### Public-by-Design (Correct as-is)

These pages are intentionally public/standalone and should NOT get the portal frame:

- **`/` (home page)** -- Marketing landing page. Correct as public.
- **`/d/[slug]` (Deaf user interpreter request link landing)** -- Public share target for QR codes. Renders bare (root layout only, no nav/footer). Intentionally standalone so requesters/interpreters landing from a shared link get a focused experience. Correct as-is.
- **`/interpreter`, `/dhh`, `/request` (portal landings)** -- Auth flow entry points under `(auth)` group. Correct as public nav.
- **`/interpreter/login`, `/dhh/login`, `/request/login`** -- Login pages. Correct as public.
- **`/interpreter/signup`, `/dhh/signup`, `/request/signup`** -- Signup flows. Correct as public.
- **`/directory` (listing page)** -- Already fixed in Monday 11813170128. Logged-in users see `DirectoryPortalSidebar` with hat selector, role-aware nav, and dashboard links. Correct.
- **`/auth/callback`** -- OAuth callback route handler. No UI.

---

## Recommended Fix Path

**Option 1: Conditional layout wrap** (detect auth state, conditionally render portal sidebar alongside content).

### Rationale

1. **Surface count is small.** Only 3 surfaces need fixing urgently (interpreter profile, invite, book/slug). The remaining 5 are low-traffic informational pages where the frame break is cosmetically annoying but not workflow-disrupting.

2. **The pattern already exists.** The directory listing page (`/directory`) already implements this exact pattern: `page.tsx` checks auth on the server, passes `userData` to `DirectoryClient`, which conditionally renders `DirectoryPortalSidebar`. This is a proven, shipped pattern.

3. **No route explosion.** Option 2 (separate authenticated routes) would require duplicating `/directory/[id]`, `/invite`, `/book/[slug]`, etc. under each portal's dashboard route group, creating 3x route files for the same content. The content components are identical regardless of portal -- only the sidebar chrome differs.

4. **Role-aware CTAs already work client-side.** `ProfileClient.tsx` already detects user role and adjusts behavior (booking CTA, add-to-list). It doesn't need a different route to know the role. The missing piece is just the sidebar chrome.

### Canary surfaces (where Option 1 could get ugly)

- **`/directory/[id]` (interpreter profile):** This page already has meaningful role-dependent behavior: Deaf users see "Book this interpreter" linking to `/dhh/dashboard/request?interpreter={id}`, requesters see it linking to `/request`. The `AddToListModal` also varies by role. However, this complexity is already handled client-side in `ProfileClient.tsx` without needing separate routes. Option 1 works fine here -- the sidebar is additive chrome, not a behavioral change.

- **`/invite`:** The invite page pre-fills sender info when logged in and hides the manual name/email fields. This is already handled client-side. No conflict with Option 1.

No surfaces were found where Option 1 would be genuinely ugly or require different server-side data fetching based on portal context. Option 2 is not justified.

### Implementation sketch

For each affected `(public)` page:

1. In `page.tsx` (server component): check auth, fetch user profile data (same pattern as `directory/page.tsx` lines 11-67).
2. Pass `userData` prop to the client component.
3. In the client component: if `userData` is present, render `DirectoryPortalSidebar` + content in a flex layout. Otherwise render content only.
4. Extract the auth-check + profile-fetch logic into a shared server utility (e.g., `lib/getPortalUserData.ts`) to avoid duplicating the 50-line pattern in every page.

---

## Pre-launch Scoping Recommendation

**Ship a minimal fix covering 2 surfaces before May 1. Defer the rest.**

### Phase 1 (ship by May 1)

| Surface | Path | Rationale |
|---------|------|-----------|
| Interpreter profile | `/directory/[id]` | Highest traffic. Every directory click goes here. The jarring frame drop is the most visible UX issue. |
| Invite flow | `/invite` | Prominent sidebar CTA in all 3 portals. Users clicking "Invite Interpreters" expect to stay in their portal. |

**Estimated work:** ~2 hours. The `DirectoryPortalSidebar` component and the auth-check pattern from `/directory/page.tsx` are ready to reuse. Main work is wiring the server-side auth check into these two pages and wrapping the client components.

### Phase 2 (post-launch)

| Surface | Path | Priority |
|---------|------|----------|
| Vanity booking page | `/book/[slug]` | Medium. Reachable from interpreter profile embed code. Same `ProfileClient` component -- fix mirrors `/directory/[id]`. |
| Calendar sync help | `/help/calendar-sync` | Low. Static content page. Could just add a "Back to dashboard" breadcrumb instead of full portal wrap. |
| Beta feedback | `/feedback/deaf-beta` | Low. May be removed post-launch anyway. |
| About page | `/about` | Low. Informational. Footer link -- users expect to leave the portal. |
| Policies page | `/policies` | Low. Same as above. |
| Privacy page | `/privacy` | Low. Same as above. |

### Why not ship everything?

- May 1 launch is ~2 days out. The 2-surface fix is low-risk and testable in an afternoon.
- The 6 remaining surfaces are all low-traffic or informational pages where the frame break is cosmetically imperfect but not workflow-blocking.
- Shipping all 8 surfaces increases the blast radius of a last-minute change right before launch.

### Why not defer entirely?

- The interpreter profile click-through (`/directory/[id]`) is the single most-visited page reachable from the directory. Every authenticated user who browses the directory and clicks a profile hits this bug. It's the primary workflow: browse directory -> click profile -> book interpreter. The frame drop in the middle of that flow feels broken.

---

## Followup Items to File

### Monday item: Phase 1 fix (pre-launch)

**Title:** Fix portal frame breakout on interpreter profile and invite pages
**Description:** Apply the `DirectoryPortalSidebar` conditional wrap pattern (from the directory listing fix in Monday 11813170128) to:
1. `app/(public)/directory/[id]/page.tsx` -- add server-side auth check, pass `userData` to `ProfileClient`, wrap in portal sidebar when logged in
2. `app/(public)/invite/page.tsx` -- same pattern for `InviteClient`

Extract shared auth-check utility to `lib/getPortalUserData.ts`.

**Priority:** Critical
**Due:** May 1 2026

### Monday item: Phase 2 fix (post-launch)

**Title:** Fix portal frame breakout on remaining public pages
**Description:** Apply the same conditional portal frame wrap to:
- `/book/[slug]`
- `/help/calendar-sync`
- `/feedback/deaf-beta`
- `/about`, `/policies`, `/privacy` (evaluate whether these should get portal frame or just a "Back to dashboard" breadcrumb)

**Priority:** Medium
**Due:** Post-launch
