# Page Width Audit (2026-04-27)

## Summary

Dashboard pages across all three user portals (Deaf, Interpreter, Requester) suffer from inconsistent width constraints. The DESIGN_SYSTEM.md specifies `~960px` as the dashboard content max-width, but actual implementations range from **640px** (narrow forms) to **none/full-width** (unconstrained pages that stretch to the browser edge). The core problem has two layers:

1. **Layout-level constraints vary by portal.** The DHH layout caps at 960px, the Interpreter layout caps at 1120px, and the Requester portal has **no layout.tsx at all** — each page must self-constrain.
2. **Per-page overrides are ad hoc.** Some pages add their own `maxWidth` (sometimes contradicting the layout), while others rely entirely on the layout constraint or have none.

The result: narrow form pages (640px) feel cramped with wasted space, list/table pages without constraints blow out on wide monitors, and the overall dashboard experience feels inconsistent.

---

## Layout Families Identified

| Family | Description | Proposed max-width | Current usage |
|--------|-------------|-------------------|---------------|
| **Dashboard overview** | Stat grids, summary cards, 2-column layouts | 1120px | Interpreter overview, DHH overview, Requester overview |
| **Dense list** | Filterable lists of bookings, requests, inquiries, invoices | 1120px | Bookings, inquiries, confirmed, requests, invoices, client-lists |
| **Narrow form** | Single-column forms (profile editor, new request, preferences) | 720px (inner), 960px (outer) | DHH request, DHH preferences, requester profile, new-request |
| **Messaging** | Full-height conversation threads and inbox lists | full (no max-width) | All inbox + conversation pages |
| **Detail page** | Single-item detail views (invoice detail, accept booking) | 800px | Invoice [id], accept booking |
| **Admin data table** | Wide tables with many columns, filters, bulk actions | 1200px | Admin users, interpreters, bookings, flags, feedback |

---

## Per-Page Table

### Deaf (DHH) Portal

| Page | File path | Current max-width | Proposed max-width | Layout family | Severity |
|------|-----------|------------------|-------------------|---------------|----------|
| Dashboard overview | `app/(dashboard)/dhh/dashboard/page.tsx` | 960px (layout + page) | 1120px | Dashboard overview | **high** |
| Bookings | `app/(dashboard)/dhh/dashboard/bookings/page.tsx` | 960px (layout) | 1120px | Dense list | **high** |
| Circle | `app/(dashboard)/dhh/dashboard/circle/page.tsx` | 900px (page) | 960px | Dense list | low |
| Inbox | `app/(dashboard)/dhh/dashboard/inbox/page.tsx` | 960px (layout) | full | Messaging | med |
| Inbox conversation | `app/(dashboard)/dhh/dashboard/inbox/conversation/[conversationId]/page.tsx` | none (ConversationThread) | full | Messaging | low |
| Interpreters (roster) | `app/(dashboard)/dhh/dashboard/interpreters/page.tsx` | 960px (page) | 1120px | Dense list | **high** |
| Notifications | `app/(dashboard)/dhh/dashboard/notifications/page.tsx` | 960px (page) | 960px | Dense list | low |
| Preferences | `app/(dashboard)/dhh/dashboard/preferences/page.tsx` | 640px (inner) / 960px (layout) | 720px (inner) / 960px (outer) | Narrow form | **high** |
| Request (new) | `app/(dashboard)/dhh/dashboard/request/page.tsx` | 640px (inner) / 960px (layout) | 720px (inner) / 960px (outer) | Narrow form | **high** |
| Requests list | `app/(dashboard)/dhh/dashboard/requests/page.tsx` | 960px (layout) | 1120px | Dense list | **high** |
| Requesters | `app/(dashboard)/dhh/dashboard/requesters/page.tsx` | 960px (layout) | 1120px | Dense list | med |

**DHH layout:** `app/(dashboard)/dhh/dashboard/layout.tsx` — `maxWidth: 960px` on wrapper div. **Proposed:** widen to 1120px.

---

### Interpreter Portal

| Page | File path | Current max-width | Proposed max-width | Layout family | Severity |
|------|-----------|------------------|-------------------|---------------|----------|
| Dashboard overview | `app/(dashboard)/interpreter/dashboard/page.tsx` → OverviewClient | 960px (component) | 1120px | Dashboard overview | **high** |
| Availability | `app/(dashboard)/interpreter/dashboard/availability/page.tsx` → AvailabilityClient | 960px (component) | 960px | Narrow form | low |
| Client lists | `app/(dashboard)/interpreter/dashboard/client-lists/page.tsx` | none (relies on layout 1120px) | 1120px | Dense list | low |
| Confirmed | `app/(dashboard)/interpreter/dashboard/confirmed/page.tsx` | none (relies on layout 1120px) | 1120px | Dense list | low |
| Inbox | `app/(dashboard)/interpreter/dashboard/inbox/page.tsx` | none (relies on layout 1120px) | full | Messaging | med |
| Inbox conversation | `app/(dashboard)/interpreter/dashboard/inbox/conversation/[conversationId]/page.tsx` → ConversationThread | none | full | Messaging | low |
| Inquiries | `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx` | none (relies on layout 1120px) | 1120px | Dense list | low |
| Invoices | `app/(dashboard)/interpreter/dashboard/invoices/page.tsx` | none (relies on layout 1120px) | 1120px | Dense list | low |
| Invoice detail | `app/(dashboard)/interpreter/dashboard/invoices/[id]/page.tsx` | 800px (page) | 800px | Detail page | low |
| Notifications | `app/(dashboard)/interpreter/dashboard/notifications/page.tsx` | 960px (page) | 960px | Dense list | low |
| Profile | `app/(dashboard)/interpreter/dashboard/profile/page.tsx` → ProfileClient | none | 720px (inner) / 1120px (layout) | Narrow form | med |
| Rates | `app/(dashboard)/interpreter/dashboard/rates/page.tsx` | none (relies on layout 1120px) | 960px | Narrow form | med |
| Team | `app/(dashboard)/interpreter/dashboard/team/page.tsx` | none (relies on layout 1120px) | 1120px | Dense list | low |

**Interpreter layout:** `app/(dashboard)/interpreter/dashboard/layout.tsx` — `maxWidth: 1120px`. **No change needed** — this is already the correct value for the wider family.

---

### Requester Portal

| Page | File path | Current max-width | Proposed max-width | Layout family | Severity |
|------|-----------|------------------|-------------------|---------------|----------|
| Dashboard overview | `app/(dashboard)/request/dashboard/page.tsx` | 960px (page) | 1120px | Dashboard overview | **high** |
| Accept booking | `app/(dashboard)/request/dashboard/accept/[bookingId]/[recipientId]/page.tsx` | 800px (page) | 800px | Detail page | low |
| Client lists | `app/(dashboard)/request/dashboard/client-lists/page.tsx` → ClientListsClient | none | 1120px | Dense list | **high** |
| Inbox | `app/(dashboard)/request/dashboard/inbox/page.tsx` | 960px (page) | full | Messaging | med |
| Inbox conversation | `app/(dashboard)/request/dashboard/inbox/conversation/[conversationId]/page.tsx` → ConversationThread | none | full | Messaging | low |
| Interpreters | `app/(dashboard)/request/dashboard/interpreters/page.tsx` → InterpretersClient | none | 1120px | Dense list | **high** |
| Invoices | `app/(dashboard)/request/dashboard/invoices/page.tsx` | none | 1120px | Dense list | med |
| New request | `app/(dashboard)/request/dashboard/new-request/page.tsx` | none | 720px (inner) / 960px (outer) | Narrow form | **high** |
| Notifications | `app/(dashboard)/request/dashboard/notifications/page.tsx` | 960px (page) | 960px | Dense list | low |
| Profile | `app/(dashboard)/request/dashboard/profile/page.tsx` → ProfileClient | 680px (inner) / 960px (outer) | 720px (inner) / 960px (outer) | Narrow form | med |
| Requests | `app/(dashboard)/request/dashboard/requests/page.tsx` → RequestsClient | 960px (page) | 1120px | Dense list | **high** |

**Requester layout:** No `layout.tsx` exists. **Proposed:** Create `app/(dashboard)/request/dashboard/layout.tsx` with `maxWidth: 1120px` wrapper, matching interpreter portal pattern.

---

### Admin Portal

| Page | File path | Current max-width | Proposed max-width | Layout family | Severity |
|------|-----------|------------------|-------------------|---------------|----------|
| Dashboard overview | `app/(dashboard)/admin/dashboard/page.tsx` → AdminOverviewClient | 1200px (component) but capped at 960px (layout) | 1200px | Admin data table | med |
| Announcements | `app/(dashboard)/admin/dashboard/announcements/page.tsx` | 960px (page + layout) | 1200px | Admin data table | med |
| Bookings | `app/(dashboard)/admin/dashboard/bookings/page.tsx` → BookingsClient | 1200px (component) but capped at 960px (layout) | 1200px | Admin data table | med |
| Feedback | `app/(dashboard)/admin/dashboard/feedback/page.tsx` → FeedbackClient | 1200px (component) but capped at 960px (layout) | 1200px | Admin data table | med |
| Flags | `app/(dashboard)/admin/dashboard/flags/page.tsx` → FlagsClient | 1200px (component) but capped at 960px (layout) | 1200px | Admin data table | med |
| Interpreters | `app/(dashboard)/admin/dashboard/interpreters/page.tsx` → InterpretersClient | 1200px (component) but capped at 960px (layout) | 1200px | Admin data table | med |
| Settings | `app/(dashboard)/admin/dashboard/settings/page.tsx` | 960px (page + layout) | 960px | Narrow form | low |
| Users | `app/(dashboard)/admin/dashboard/users/page.tsx` → UsersClient | 1200px (component) but capped at 960px (layout) | 1200px | Admin data table | med |
| Vision | `app/(dashboard)/admin/dashboard/vision/page.tsx` | none | full | Detail page | low |
| Smoke test | `app/(dashboard)/admin/smoke-test/page.tsx` | none | full | Detail page | low |

**Admin layout:** `app/(dashboard)/admin/layout.tsx` — `maxWidth: 960px` on wrapper. **Proposed:** widen to 1200px (admin tables need the space).

---

## Recommended Layout Family Standards

### 1. Dashboard Overview — `max-width: 1120px`

- **Side padding:** 40px each side (32px on mobile ≤768px)
- **When to break:** Never narrower. Can go full-width only if a future kanban/calendar view demands it.
- **Rationale:** 960px is too narrow for 2-column stat grids + cards on modern 1440px+ displays. 1120px gives breathing room without floating in space on ultrawide.

### 2. Dense List — `max-width: 1120px`

- **Side padding:** 40px each side (24px on mobile ≤768px)
- **When to break:** Tables with 6+ columns may need 1200px or horizontal scroll. Lists with only 2-3 columns can optionally stay at 960px.
- **Rationale:** Request lists, booking lists, and roster tables all have multi-column card layouts that get squeezed at 960px.

### 3. Narrow Form — `max-width: 720px` (inner content), `960px` (outer container)

- **Side padding:** 32px each side on outer (20px on mobile ≤640px)
- **When to break:** Multi-column form layouts (side-by-side fields) should use the outer 960px width. Single-column forms stay at 720px.
- **Rationale:** Forms read best at ~65-75 characters per line. 640px is too tight (especially with 32px padding eating into it). 720px hits the sweet spot.

### 4. Messaging — `max-width: full` (no constraint)

- **Side padding:** 0 (messaging chrome handles its own padding)
- **When to break:** Always full-width within the sidebar layout. Conversation threads need vertical real estate, not width constraints.
- **Rationale:** Chat UIs benefit from full available width for the message list + compose area.

### 5. Detail Page — `max-width: 800px`

- **Side padding:** 48px each side (24px on mobile ≤768px)
- **When to break:** If detail pages gain side panels (e.g., activity log), expand to 1120px with a grid layout.
- **Rationale:** Single-item views (invoice, booking acceptance) are readable and focused at 800px.

### 6. Admin Data Table — `max-width: 1200px`

- **Side padding:** 40px each side (24px on mobile ≤768px)
- **When to break:** If admin tables grow beyond 8 columns, consider horizontal scroll rather than wider max-width.
- **Rationale:** Admin pages have wide tables with many columns. The current 960px layout constraint is actively blocking the 1200px that components already request.

---

## Surfaces Flagged in BATCH 11863833678

### New Interpreter Request page (Deaf personal events)
- **File:** `app/(dashboard)/dhh/dashboard/request/page.tsx`
- **Current:** 640px inner form, 960px outer layout
- **Issue:** Form feels cramped. The interpreter picker and date/time fields are squeezed.
- **Proposed:** 720px inner form width
- **Severity:** high

### Messages tab
- **Files:** `app/(dashboard)/dhh/dashboard/inbox/page.tsx`, `app/(dashboard)/interpreter/dashboard/inbox/page.tsx`, `app/(dashboard)/request/dashboard/inbox/page.tsx`
- **Current:** DHH inbox capped at 960px (layout); Interpreter inbox at 1120px (layout); Requester inbox at 960px (page).
- **Issue:** Messaging should be full-width. The DHH 960px cap makes the conversation list feel narrow.
- **Proposed:** Full-width (no max-width) for all messaging pages; let the messaging chrome manage its own internal widths.
- **Severity:** med

### Notifications tab
- **Files:** `app/(dashboard)/dhh/dashboard/notifications/page.tsx`, `app/(dashboard)/interpreter/dashboard/notifications/page.tsx`, `app/(dashboard)/request/dashboard/notifications/page.tsx`
- **Current:** All three use 960px.
- **Issue:** 960px is acceptable for notification lists (single-column card layout). No change needed.
- **Severity:** low

### Deaf profile editor (preferences)
- **File:** `app/(dashboard)/dhh/dashboard/preferences/page.tsx`
- **Current:** 640px inner constraint
- **Issue:** Profile editor fields (name, bio, location, video, slug) are squeezed at 640px. Side-by-side fields like first/last name don't have room.
- **Proposed:** 720px inner constraint
- **Severity:** high

---

## Recommendations Summary

1. **Widen the DHH layout from 960px to 1120px** (`app/(dashboard)/dhh/dashboard/layout.tsx`). This is the single highest-impact change — it unblocks every DHH page simultaneously. The interpreter portal already uses 1120px.

2. **Create a Requester dashboard layout** (`app/(dashboard)/request/dashboard/layout.tsx`) with `maxWidth: 1120px`. Currently every requester page must self-constrain, leading to inconsistency and several pages with no constraint at all.

3. **Widen the Admin layout from 960px to 1200px** (`app/(dashboard)/admin/layout.tsx`). Six admin client components already request 1200px but are silently capped by the 960px layout — a contradiction that wastes the wider styling work already done.

4. **Bump narrow form inner constraints from 640px to 720px** on DHH preferences, DHH request, and requester profile pages. 640px is too tight for forms with side-by-side fields and interpreter pickers.

5. **Remove per-page maxWidth overrides that duplicate the layout constraint.** Pages like DHH overview (960px on both layout and page) and interpreter OverviewClient (960px when layout is 1120px) should defer to the layout. Per-page overrides should only exist when the page intentionally differs from the layout default (e.g., detail pages at 800px, forms at 720px inner).
