# Encryption F2 Investigation — 2026-04-29

Pentest finding F2 (Monday 11876202979). The `/api/decrypt` endpoint checks authentication but not data ownership. Any authenticated user can POST arbitrary `enc:` ciphertext and receive plaintext.

---

## Endpoint Summary

- **Path:** `app/api/decrypt/route.ts`
- **Auth check:** Calls `supabase.auth.getUser()` — verifies the caller has a valid Supabase session. Does NOT verify they own or have access to the data being decrypted.
- **Request shape:** `{ fields: Record<string, string | null> }` — arbitrary key/value pairs where values are `enc:` ciphertext strings
- **Response shape:** `{ fields: Record<string, string | null> }` — same keys, values replaced with plaintext
- **Batch support:** Yes — accepts multiple fields in a single request. The `decryptBatchClient` helper further batches across multiple objects by flattening all encrypted fields from an array of records into one API call.

---

## Callers

All callers go through the `lib/decrypt-client.ts` helper (`decryptBatchClient` or `decryptFieldsClient`), which is the sole consumer of `/api/decrypt`.

| # | File:Line | Caller | Fields decrypted | Server had plaintext? | Surface |
|---|---|---|---|---|---|
| 1 | `app/(dashboard)/dhh/dashboard/bookings/page.tsx:754,759` | `fetchData` callback | `['title']` | **Yes** — calls `/api/dhh/request` which decrypts at line 468 before responding | DHH Bookings page (self + on-behalf tabs) |
| 2 | `app/(dashboard)/dhh/dashboard/page.tsx:665` | `fetchData` callback (fallback path only) | `['title']` | **Partially** — primary path calls `/api/dhh/request` (already decrypted); fallback queries `bookings` table directly via browser Supabase client | DHH Dashboard overview (recent bookings) |
| 3 | `app/(dashboard)/interpreter/dashboard/confirmed/page.tsx:1792` | `fetchBookings` callback | `['title', 'description', 'notes']` | **No** — queries `bookings` table directly via browser Supabase client | Interpreter Confirmed Bookings page |
| 4 | `app/(dashboard)/interpreter/dashboard/inquiries/page.tsx:1150` | `fetchBookings` callback | `['title', 'notes']` | **No** — queries `bookings` table directly via browser Supabase client | Interpreter Inquiries page |
| 5 | `app/(dashboard)/interpreter/dashboard/OverviewClient.tsx:455` | inline async in `useEffect` | `['title', 'notes']` | **No** — queries `bookings` table directly via browser Supabase client | Interpreter Dashboard overview (upcoming bookings) |

**No callers found in test files.** No dead imports or removed-but-lingering references.

---

## Categorization

### Server already had plaintext: 1 caller (+ 1 partial)

- **Caller 1** (DHH Bookings): The `decryptBatchClient` call is a harmless no-op. The `/api/dhh/request` route decrypts at `route.ts:468` before returning JSON. By the time the client receives the data, all `enc:` prefixes are gone — `decryptBatchClient` sees no encrypted fields and returns without hitting `/api/decrypt`. **This caller can be cleaned up by simply removing the `decryptBatchClient` import and call.** Zero functional change.

- **Caller 2** (DHH Dashboard): The primary path (`/api/dhh/request`) is already decrypted. The fallback path (lines 658–675) queries Supabase directly from the browser and genuinely needs client-side decrypt. However, the fallback only fires on API failure and fetches at most 3 bookings.

### Server-side refactor needed: 3 callers

- **Callers 3, 4, 5** (Interpreter Confirmed, Inquiries, Overview): All three are `'use client'` components that query the `bookings` table directly from the browser via `createClient()`. The data never passes through a server route. To eliminate `/api/decrypt` for these, the booking data fetch would need to move to either:
  - (a) A server component or API route that decrypts before sending to the client, or
  - (b) A new API route (e.g., `/api/interpreter/bookings`) analogous to `/api/dhh/request`

### Genuinely needs client decrypt: 0

No caller has a legitimate reason to decrypt on the client.

**Summary:**
- Server already had plaintext: **1** (caller 1)
- Server already had plaintext, partial: **1** (caller 2, primary path only)
- Server-side refactor needed: **3** (callers 3, 4, 5)
- Genuinely needs client decrypt: **0**

---

## Recommended Path: Hybrid — Option (b) primary, Option (a) as defense-in-depth

### Rationale

- Only 5 call sites total, with 3 requiring actual refactoring.
- All 3 "refactor needed" callers follow the same pattern: interpreter dashboard client components fetching bookings via browser Supabase. A single new API route (`/api/interpreter/bookings`) could serve all three.
- The requester dashboard pages already use server-side `decryptFields` — the interpreter dashboard is the only portal still doing client-side decrypt. This is an architectural inconsistency worth fixing.
- Caller count is low enough that option (b) is achievable before May 1. The interpreter dashboard refactor is medium-lift but scoped to one pattern.

### Recommended sequence

1. **Immediate (pre-launch):** Harden the endpoint with option (a) — add a required `context` param and ownership check. This takes ~1 hour and closes the pentest finding regardless of option (b) progress.
2. **Same sprint:** Refactor interpreter dashboard callers (option b). Create `/api/interpreter/bookings` route that handles the queries + decrypt server-side. Update callers 3, 4, 5.
3. **Cleanup:** Remove the no-op `decryptBatchClient` calls from callers 1 and 2's primary path.
4. **Post-refactor:** Delete `/api/decrypt` endpoint and `lib/decrypt-client.ts` once all callers are migrated. No caller will remain.

---

## If Option (b): Refactor Plan

### Caller 1 — DHH Bookings (`dhh/dashboard/bookings/page.tsx`)

**Change:** Remove `decryptBatchClient` import and calls at lines 754, 759. No other change needed — the data is already plaintext from `/api/dhh/request`.

**Lift:** Trivial (delete 3 lines + 1 import).

### Caller 2 — DHH Dashboard (`dhh/dashboard/page.tsx`)

**Change:** In the fallback path (lines 658–675), either:
- Remove the fallback entirely (the API path is the primary), or
- Move the fallback query to go through `/api/dhh/request` with a `?limit=3` param

**Lift:** Low.

### Callers 3, 4, 5 — Interpreter Dashboard (confirmed, inquiries, overview)

**Change:** Create a new API route `/api/interpreter/bookings` (or similar) that:
1. Authenticates the user
2. Verifies they have an interpreter profile
3. Queries `booking_recipients` → `bookings` (same queries currently in the client components)
4. Calls `decryptFields` server-side
5. Returns plaintext JSON

Then update each client component to call the new API instead of querying Supabase directly. The query logic moves from the component to the API route.

**Lift:** Medium. The query logic is already written — it moves, not rewrites. Each of the 3 callers has slightly different query params (status filters, field selections), so the API may need mode/status params. Alternatively, 3 separate thin API routes could each handle one surface.

**Note:** The interpreter confirmed page selects ~20 columns including PII fields like `onsite_contact_name`, `onsite_contact_phone`, `onsite_contact_email`. Moving server-side is a net security win beyond just the F2 fix — it means these fields never transit the client-side Supabase channel unencrypted.

---

## If Option (a): Endpoint Hardening Plan

If option (a) is applied (as the immediate pre-launch patch):

### Context params to require

Add a required `context` field to the request body:

```
{ 
  context: { type: 'booking', ids: string[] } | { type: 'message', ids: string[] },
  fields: Record<string, string | null> 
}
```

### Ownership verification

1. For `type: 'booking'`: Query `bookings` + `booking_recipients` + `booking_dhh_clients` using the authenticated user's ID to verify they are either:
   - The requester (`bookings.requester_id`)
   - A recipient interpreter (`booking_recipients.interpreter_id`)
   - A DHH participant (`booking_dhh_clients.dhh_user_id`)
   - An admin (`user_profiles.is_admin`)

2. For `type: 'message'`: Verify the user is a participant in the conversation containing the message.

3. Reject requests where any referenced ID fails the ownership check.

### Considerations

- This adds a DB round-trip to every decrypt call. For batched calls (e.g., 10 bookings × 2 fields), this is one query to verify 10 booking IDs — acceptable.
- The `decryptBatchClient` helper would need updating to pass context params. The key format (`{index}_{field}`) doesn't currently carry entity IDs — the helper would need the original items array to extract IDs.

---

## Tech Debt Flags

1. **Client-side Supabase queries for sensitive data.** The interpreter dashboard pages (confirmed, inquiries, overview) query the `bookings` table directly from the browser using `createClient()`. This means encrypted ciphertext transits to the browser, gets decrypted via `/api/decrypt`, and the final plaintext is set in React state. The requester dashboard already does this server-side. The interpreter dashboard should follow the same pattern. This is the root architectural issue that created the F2 vulnerability.

2. **DHH bookings double-decrypt pattern.** Caller 1 calls `decryptBatchClient` on data that `/api/dhh/request` already decrypted. The no-op is harmless but indicates the DHH bookings page was written without awareness that the API route already handles decryption. This suggests the encryption layer was added retroactively to the API route after the client-side decrypt pattern was established.

3. **DHH dashboard fallback path.** The fallback at `page.tsx:658–675` queries Supabase directly from the browser only when the `/api/dhh/request` call fails. This is a belt-and-suspenders pattern that re-introduces the client decrypt dependency for an edge case. It should be removed or routed through the API.

4. **`notes` field decrypt inconsistency.** Callers 3, 4, 5 decrypt `notes` but it is never encrypted at write time (per F5 in pentest doc). These are no-ops. When `BOOKING_ENCRYPTED_FIELDS` is expanded (F1 fix), `notes` should be included — at which point these calls become load-bearing. Currently they're dead code that happens to be forward-compatible.

5. **No rate-limiting on `/api/decrypt`.** The endpoint accepts unbounded `fields` objects. An authenticated attacker could submit thousands of ciphertext values in a single request. Even with ownership checks (option a), rate limiting should be added.

---

## Estimated Wall Clock

| Task | Estimate |
|---|---|
| Option (a) endpoint hardening (pre-launch patch) | 2–3 hours |
| Remove no-op decrypt calls (callers 1, 2 primary) | 30 minutes |
| Create `/api/interpreter/bookings` route + refactor callers 3, 4, 5 | 4–6 hours |
| Delete `/api/decrypt` + `lib/decrypt-client.ts` | 30 minutes |
| **Total for full option (b) migration** | **7–10 hours** |
| **Pre-launch minimum (option a only)** | **2–3 hours** |

These estimates assume Lucy with current calibration and include testing.

---

## Verification

```
$ npx tsc --noEmit
(clean — no errors)
```

Investigation only — no source files modified. next build was not run locally as no code changes were made; tsc passed clean.

---

## Working Tree State

This investigation added one file:
- `docs/encryption-f2-investigation.md` (this report)

No other files modified.
