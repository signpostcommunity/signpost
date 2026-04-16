# Booking Response Flow Audit

**Date:** 2026-04-16
**Scope:** Read-only audit of how `booking_recipients` responses flow across interpreter, requester, and Deaf user portals.
**Symptom that triggered the audit:** Betty (`responded`, $75/hr) and Keanu (`responded`, $85/hr) on the Staff Training Workshop booking both display as "Pending" on the Deaf portal card.

---

## A. Interpreter Response Model

The interpreter portal supports a **full three-action response model** (not a binary accept/decline):

| Action | Status set | Fields populated | Where |
|---|---|---|---|
| Accept & Send Rate | `responded` | `responded_at`, `response_notes` | `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:150-156` |
| Suggest Alternative Time | `proposed` | `proposed_date`, `proposed_start_time`, `proposed_end_time`, `proposal_note`, `response_rate`, `responded_at` | `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:683-694` |
| Decline | `declined` | `declined_at`, `decline_reason` | `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:837-844` |

### Critical bug — rate not persisted on Accept
The "Accept & Send Rate" path (`AcceptModal.handleSend`) **does NOT write `response_rate` or `rate_profile_id` to the database**. It only writes `status`, `responded_at`, and `response_notes`. The rate values (`customHourly`, `rateProfile`) are passed only inside the email notification metadata (line 217-219). Compare with the "Suggest Alternative" path, which correctly populates `response_rate` (line 681, 691).

This is the root cause of the "Pending" symptom: the Staff Training Workshop seed data writes `response_rate` directly via `lib/seedRequesterData.ts:83-84`, but **a real interpreter response leaves `response_rate` NULL** so the requester's accept page falls back to `rateProfile?.hourly_rate ?? 0` (`AcceptClient.tsx:90`) — which can show "$0/hr" if no rate_profile_id is set.

### Misleading notification copy
After "Accept & Send Rate", the interpreter sends *itself* a `booking_confirmed` notification (line 195-203) with subject "Booking confirmed: …" — but the booking is NOT confirmed at this point; status is `responded`. The requester also receives a duplicate `booking_confirmed` notification (line 225-233) before they have actually picked anyone. Both should be suppressed until the requester confirms.

---

## B. Requester Pick

### Pick exists and works
There is a real pick flow:
- Card view with per-recipient response: `app/(dashboard)/request/dashboard/requests/RequestsClient.tsx:751-873`
- "Review & Accept" CTA → `/request/dashboard/accept/[bookingId]/[recipientId]` (RequestsClient.tsx:838-851)
- Accept page reads `response_rate`, `response_notes`, `rate_profile_id`: `app/(dashboard)/request/dashboard/accept/[bookingId]/[recipientId]/page.tsx:30`
- Confirm action: `AcceptClient.tsx:99-115` updates the picked recipient to `confirmed` and the booking to `filled`.
- Inbox surfaces all `responded` recipients for review: `app/(dashboard)/request/dashboard/inbox/page.tsx:111-160`.

### Critical gap — unchosen "responded" interpreters are abandoned
After a requester clicks "Yes, Confirm Booking" (`AcceptClient.handleConfirm`):
- The chosen recipient goes to `confirmed` ✓
- The booking goes to `filled` ✓
- **The OTHER `responded` recipients are NOT updated**. They stay in `responded` status forever.
- **No "thanks, not needed this time" notification fires** for those interpreters.
- **No notification fires to the chosen interpreter either** — `AcceptClient.handleConfirm` sends ZERO notifications (grep confirms `sendNotification` is absent from `app/(dashboard)/request/dashboard/accept/`).

The cancel handler (`RequestsClient.tsx:351-364`) only withdraws `sent`/`viewed` recipients, not `responded` ones — so even cancelling a booking leaves responded interpreters in limbo.

### Alternative time pick is also incomplete
"Accept at Suggested Time" (`RequestsClient.tsx:387-403`) updates the picked recipient to `confirmed` but does not change the booking date/time, does not notify the picked interpreter, and does not address the other recipients.

---

## C. Deaf User Views

The Deaf portal uses **the same component (`InterpreterMiniCard`) for both professional and personal bookings** with NO branching on `request_type` and NO branching on whether the Deaf user is the requester.

### Professional bookings (Deaf is participant, not requester)
- File: `app/(dashboard)/dhh/dashboard/requests/page.tsx:202-269` and identical copy at `app/(dashboard)/dhh/dashboard/page.tsx:141-205`
- Rendering rules from the status map (`requests/page.tsx:211-218`, `page.tsx:150-157`):
  | DB status | Label shown | Color |
  |---|---|---|
  | `confirmed` | Confirmed | green |
  | `sent` | Sent | grey |
  | `viewed` | Viewed | blue |
  | `responded` | **Pending** | orange |
  | `declined` | Declined | pink |
  | `withdrawn` | Withdrawn | grey |
- Rates: NOT shown ✓ (correct for professional)
- Pick button: NOT present ✓ (correct for professional)
- Privacy: see Section F.

### Personal bookings (Deaf IS requester)
- Same component, same rules. **No rates are shown. No pick button is present.**
- The Deaf user has no UI path to:
  - See the rate Betty submitted
  - See the rate Keanu submitted
  - Pick one of them
  - Confirm the booking
- The personal-bookings tab (`requests/page.tsx:1241, 1279-1281`) only changes the empty-state text and which `AppointmentVideoSection` renders. The interpreter-response UI is identical to professional.

This is the most consequential gap. **A Deaf user submitting a personal request has no way to act on responses.** The booking sits at `responded` indefinitely unless a requester role exists (which it doesn't on a personal booking).

### Bookings page (separate from requests page)
`app/(dashboard)/dhh/dashboard/bookings/page.tsx:508-540` only renders **confirmed** recipients. Pre-confirmation responses are not shown here at all, so a Deaf user looking at their bookings page sees nothing about who is "available" — only who is confirmed.

---

## D. Notifications

| Event | Fires? | Where |
|---|---|---|
| Interpreter responds with rate → requester | YES (`rate_response`) | `inquiries/page.tsx:206-223` |
| Interpreter suggests alt time → requester | YES (`rate_response`) | `inquiries/page.tsx:712-730` |
| Premature `booking_confirmed` to interpreter on response | YES (BUG) | `inquiries/page.tsx:195-203` |
| Premature `booking_confirmed` to requester on response | YES (BUG) | `inquiries/page.tsx:225-233` |
| Picked interpreter → "you were selected, here's full job info" | **NO** | `AcceptClient.tsx:93-170` sends none |
| Unchosen `responded` interpreter → "thanks, not needed" | **NO** | No code path exists; grep for `not_needed`/`not selected` returns zero hits |
| Deaf user (professional) → "an interpreter is available" | **NO** | No notification type exists for this |
| Deaf user (personal) → "responses ready, please pick" | **NO** | No path to even reach a pick |

`lib/notifications-server.ts` defines `booking_confirmed`, `rate_response`, `booking_cancelled`, wave types, and preferred-list types — but **no `not_needed`, `not_selected`, or "thanks but no thanks" type exists**.

---

## E. Role-Based Rendering

There is no shared, role-aware booking-detail component. Each portal has its own implementation:

| Portal | Component | Rate visible | Pick action |
|---|---|---|---|
| Interpreter own inquiry | `interpreter/dashboard/inquiries/page.tsx` (own row only) | Own rate inputs | n/a (responds, doesn't pick) |
| Requester | `request/dashboard/requests/RequestsClient.tsx` + `accept/.../AcceptClient.tsx` | YES | YES |
| Deaf (any request_type) | `dhh/dashboard/requests/page.tsx` + `page.tsx` `InterpreterMiniCard` | NO | NO |

The Deaf component has **no `request_type` branch** and **no `is_requester` branch**. Personal bookings render identically to professional bookings. There are two near-duplicate copies of `InterpreterMiniCard` (`requests/page.tsx:202` and `page.tsx:141`) with the same status-to-label mapping.

The status pill mapping is duplicated in at least four places:
- `components/dashboard/interpreter/shared.tsx:49-67` — interpreter portal (`responded` → "Responded", cyan)
- `app/(dashboard)/request/dashboard/requests/RequestsClient.tsx:109-175` — requester (`responded` → "Rate received", amber, with pill background)
- `app/(dashboard)/dhh/dashboard/requests/page.tsx:211-219` — Deaf requests (`responded` → "Pending", orange)
- `app/(dashboard)/dhh/dashboard/page.tsx:150-158` — Deaf dashboard home (same as above)

So `responded` collapses into "Pending" on the Deaf portal but is shown distinctly as "Rate received" on the requester portal. No portal labels `viewed` and `responded` differently from each other on the Deaf side beyond color.

---

## F. Privacy

### Interpreter-to-interpreter — OK
`inquiries/page.tsx:942-946` filters by `interpreter_id = profile.id`, returning only the current interpreter's own row. They cannot see other interpreters invited to the same booking. Other interpreters' rates, names, and responses are not exposed in any query under `app/(dashboard)/interpreter/`.

### Rate exposure to Deaf users on professional bookings — LEAK IN API
The frontend (`InterpreterMiniCard`) does not display rates. **However, the API endpoint `app/api/dhh/request/route.ts:332-339` selects `response_rate, response_notes, decline_reason` for every recipient on every booking the Deaf user can see** — including professional bookings where they are not the requester. This means:

- The data is delivered in the JSON response to the browser
- A Deaf user (or anyone with their session) can read other interpreters' rates from DevTools / network tab on a professional booking
- This violates the design intent: "**No rates shown** for Deaf user on professional booking"

The Deaf user's own client also pulls `decline_reason` for every recipient, which may include free-text the interpreter wrote (`app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:836-851` lets the interpreter type "Other: …" reasons that get persisted verbatim).

### Cross-recipient data on personal bookings — fine in principle, broken in practice
Personal bookings *should* expose rates to the Deaf user (they are the requester). The API does send the data, but no UI consumes it.

---

## G. Severity-Ranked Gaps

### Critical
1. **Personal bookings have no Deaf-user pick UI.** A Deaf user creating a personal request cannot see rates, cannot pick an interpreter, cannot confirm. Booking is permanently stuck at `responded`. *Files: `app/(dashboard)/dhh/dashboard/requests/page.tsx:1241, 1278-1281`; `InterpreterMiniCard` lines 202-269.*
2. **Rate not persisted on interpreter "Accept & Send Rate".** `response_rate` and `rate_profile_id` are never written; the requester's accept page sees `$0/hr` for any non-seed booking. *File: `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:150-156`.*
3. **Rate leak to Deaf users on professional bookings via API.** `response_rate` and `response_notes` are sent in the JSON payload regardless of `request_type`. *File: `app/api/dhh/request/route.ts:332-339`.*
4. **Premature `booking_confirmed` notifications.** The interpreter responding triggers "Booking confirmed" emails to both interpreter and requester before any pick has occurred. Misrepresents state and creates duplicate confirmations when the real pick happens. *File: `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:194-234`.*

### High
5. **No notification to chosen interpreter on confirmation.** `AcceptClient.handleConfirm` writes status changes but sends zero notifications. Chosen interpreter learns of selection only by checking the dashboard. *File: `app/(dashboard)/request/dashboard/accept/[bookingId]/[recipientId]/AcceptClient.tsx:93-170`.*
6. **No "not needed this time" path for unchosen `responded` interpreters.** No status update, no notification, no UI cleanup. They remain in their own inquiries list as "Responded" forever. *Search: zero hits for `not_needed` / `not_selected` across `lib/notifications-server.ts` and `app/api/`.*
7. **Booking cancel doesn't clean up `responded` recipients.** `RequestsClient.tsx:351-364` only withdraws `sent`/`viewed`. Responded interpreters stay marked `responded` against a cancelled booking.

### Medium
8. **Duplicated status-label maps across portals.** Four near-identical objects in `dhh/dashboard/page.tsx`, `dhh/dashboard/requests/page.tsx`, `request/dashboard/requests/RequestsClient.tsx`, `components/dashboard/interpreter/shared.tsx`. Drift risk; symptoms-of-symptoms (the "Pending" label is only set in the Deaf maps).
9. **`responded` rendered as "Pending" on Deaf portal is ambiguous.** A more useful label would distinguish "Awaiting requester selection" (professional) from "Action needed: pick an interpreter" (personal). *Files: `dhh/dashboard/requests/page.tsx:215`, `dhh/dashboard/page.tsx:154`.*
10. **Tracker counts `viewed` as "responded".** `respondedOrBetter` includes `viewed`, but viewing an inquiry is not responding. Inflates the "N of M responded" sublabel. *File: `components/dashboard/dhh/RequestTracker.tsx:90-96`.*

### Low
11. **`InterpreterMiniCard` defined twice with identical bodies** in `dhh/dashboard/page.tsx:141-205` and `dhh/dashboard/requests/page.tsx:202-269`. Should be extracted.
12. **Decline reason free-text exposed unredacted to Deaf user via API** (`response_notes`/`decline_reason` selected at `app/api/dhh/request/route.ts:337`). Currently not rendered, but live in the JSON.
13. **No emoji-policy enforcement** in `inquiries/page.tsx` cards (`📅`, `🕐`, `📍`, `🔁` at lines 1110-1114) — violates DESIGN_SYSTEM.md "No emoji in UI".

---

## H. File:line References

### Interpreter response side
- `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:146-239` — AcceptModal.handleSend (rate not persisted, premature confirm notifs)
- `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:676-735` — SuggestModal.handleSend (correctly sets response_rate)
- `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:832-852` — DeclineModal.handleDecline
- `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:925-1034` — fetch only own row (privacy OK)

### Requester pick side
- `app/(dashboard)/request/dashboard/requests/RequestsClient.tsx:109-175` — recipient status pill for requester
- `app/(dashboard)/request/dashboard/requests/RequestsClient.tsx:351-364` — cancel handler (does not touch `responded`)
- `app/(dashboard)/request/dashboard/requests/RequestsClient.tsx:387-403` — acceptAtSuggested (no notifications)
- `app/(dashboard)/request/dashboard/requests/RequestsClient.tsx:751-873` — per-recipient rendering with rates
- `app/(dashboard)/request/dashboard/accept/[bookingId]/[recipientId]/page.tsx:1-125` — server-side accept page
- `app/(dashboard)/request/dashboard/accept/[bookingId]/[recipientId]/AcceptClient.tsx:90-170` — handleConfirm (no notifications, doesn't update other recipients)
- `app/(dashboard)/request/dashboard/inbox/page.tsx:108-167` — inbox lists all `responded` for current requester

### Deaf user views
- `app/(dashboard)/dhh/dashboard/requests/page.tsx:202-269` — InterpreterMiniCard (no request_type branch)
- `app/(dashboard)/dhh/dashboard/requests/page.tsx:1240-1281` — pro/personal tab split
- `app/(dashboard)/dhh/dashboard/page.tsx:141-205` — duplicate InterpreterMiniCard
- `app/(dashboard)/dhh/dashboard/bookings/page.tsx:440-540` — bookings page only shows confirmed

### API
- `app/api/dhh/request/route.ts:332-339` — privacy leak: `response_rate, response_notes, decline_reason` sent regardless of `request_type`

### Notifications
- `lib/notifications-server.ts:206-248` — `booking_confirmed` template (no role-aware sender)
- `lib/notifications-server.ts:311-367` — `rate_response` template
- (search) no `not_needed` / `not_selected` / `unchosen` template exists

### Badges / tracker / shared
- `components/dashboard/interpreter/shared.tsx:49-67` — interpreter StatusBadge
- `components/dashboard/dhh/RequestTracker.tsx:85-200` — tracker step computation, `respondedOrBetter` includes `viewed`

### Seed data (helpful for reproducing)
- `lib/seedRequesterData.ts:83-84` — Betty/Keanu seeded with `status: 'responded'` AND `response_rate` set directly (the only way `response_rate` is non-null in the system today, since the live interpreter flow doesn't persist it)
