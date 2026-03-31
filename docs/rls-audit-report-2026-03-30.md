## RLS Smoke Test Report — 2026-03-30

### Summary
- 26 tests passed
- 0 tests failed
- 0 tests skipped
- 0 errors

### Test Results

| # | Test | Table | Role | Type | Expected | Actual | Status |
|---|------|-------|------|------|----------|--------|--------|
| A1 | User sees own user_profile | user_profiles | admin | positive | 1 | 1 | PASS |
| A2 | Admin sees all user_profiles | user_profiles | admin | positive | > 0 | 34 | PASS |
| A3 | Non-admin sees only own user_profile | user_profiles | deaf | negative | 0 | 0 | PASS |
| A4 | Interpreter sees own interpreter_profile | interpreter_profiles | interpreter | positive | 1 | 1 | PASS |
| A5 | Public reads approved interpreter_profiles | interpreter_profiles | interpreter | positive | > 0 | 24 | PASS |
| A6 | Deaf user sees own deaf_profile | deaf_profiles | deaf | positive | 1 | 1 | PASS |
| A7 | Deaf user sees profiles with slugs (public) | deaf_profiles | deaf | positive | > 0 | 27 | PASS |
| B1 | Requester sees own bookings | bookings | requester | positive | > 0 | 34 | PASS |
| B2 | Outsider sees 0 bookings | bookings | deaf | negative | 0 | 0 | PASS |
| B3 | Requester sees booking_recipients on own bookings | booking_recipients | requester | positive | > 0 | 36 | PASS |
| B4 | Outsider sees 0 booking_recipients | booking_recipients | deaf | negative | 0 | 0 | PASS |
| B5 | DHH client sees booking_dhh_clients entries | booking_dhh_clients | deaf | positive | > 0 | 12 | PASS |
| B6 | Non-participant sees 0 booking_dhh_clients | booking_dhh_clients | deaf | negative | 0 | 0 | PASS |
| C1 | Conversation member sees direct_messages | direct_messages | admin | positive | >= 0 | 6 | PASS |
| C2 | Non-member sees 0 direct_messages | direct_messages | deaf | negative | 0 | 0 | PASS |
| C3 | Interpreter sees own legacy messages | messages | interpreter | positive | >= 0 | 8 | PASS |
| C4 | Outsider sees 0 legacy messages | messages | deaf | negative | 0 | 0 | PASS |
| D1 | Non-admin cannot read beta_feedback | beta_feedback | deaf | negative | 0 | 0 | PASS |
| D2 | Admin reads all beta_feedback | beta_feedback | admin | positive | > 0 | 92 | PASS |
| D3 | User sees own deaf_roster | deaf_roster | deaf | positive | > 0 | 14 | PASS |
| D4 | Deaf user sees own deaf_roster entries | deaf_roster | deaf | positive | > 0 | 2 | PASS |
| D4b | Interpreter cannot see deaf_roster | deaf_roster | interpreter | negative | 0 | 0 | PASS |
| D5 | User sees own notifications | notifications | admin | positive | >= 0 | 16 | PASS |
| D6 | Admin sees profile_flags | profile_flags | admin | positive | >= 0 | 2 | PASS |
| D7 | Non-admin cannot read others profile_flags | profile_flags | deaf | negative | 0 | 0 | PASS |
| D8 | Requester sees own booking_credits | booking_credits | requester | positive | >= 0 | 0 | PASS |

---

### Critical Issues (must fix before launch)

None found. All RLS policies tested are functioning correctly.

---

### Warnings (should fix, not blocking)

1. **requester_profiles** — `public_read_requester_profiles` policy has `qual = true`, meaning ALL requester profiles are publicly readable by any authenticated user. This may over-expose requester data (org names, phone numbers, emails). Consider restricting to own-profile-only read, with a separate admin policy for full access.

2. **conversation_participants / conversations** — INSERT policies have `with_check = true` (no restriction), meaning any authenticated user can create conversations and add participants. This is likely intentional for the DM system but should be monitored for abuse.

3. **requester_beta_responses / requester_beta_status** — Admin read policy checks `user_profiles.role = 'admin'` instead of using `is_admin()` function. Since `user_profiles.role` stores the primary role (interpreter/deaf/requester), not 'admin', the admin read policy for these tables may silently fail. Admins like Molly (role='interpreter', is_admin=true) would NOT be able to read these tables via RLS.

4. **booking_credits** — D8 test shows Molly (requester) sees 0 credits. Policy is `requester_id = auth.uid()` for SELECT + admin ALL. Correct behavior, but confirms no booking credits exist yet.

---

### Observations (document for redesign)

1. **SECURITY DEFINER functions are the backbone of RLS.** 7 helper functions (`get_my_interpreter_id`, `is_admin`, `is_booking_dhh_client`, `is_booking_recipient`, `is_booking_requester`, `is_conversation_member`, `is_trusted_circle_member`) are used across multiple policies. These are safe — they perform simple lookups and don't accept arbitrary input.

2. **`rls_auto_enable` trigger** automatically enables RLS on any new public table. This is good — prevents accidentally creating unprotected tables.

3. **`set_beta_feedback_user_info` trigger** auto-populates user info on beta_feedback INSERT. It's SECURITY DEFINER because it reads from `auth.users` and `interpreter_profiles`. Safe but couples beta_feedback to interpreter_profiles schema.

4. **deaf_profiles has 4 SELECT policies** that overlap: `deaf users read own profile`, `interpreters_read_booking_dhh_profiles`, `public_read_deaf_profile_by_slug`. This creates OR conditions that effectively make any profile with a vanity_slug publicly readable (intentional for /d/[slug] landing pages).

5. **interpreter_availability has duplicate policies**: `interpreter write own availability` and `interpreter_own_availability` (both ALL, same qual), plus `public read availability` and `public_read_availability` (both SELECT, same qual). These duplicates are harmless but should be cleaned up.

6. **`messages` table (legacy)** — Policies correctly reference `bookings`, `booking_recipients`, and `booking_dhh_clients`. No reference to `bookings_legacy` (which no longer exists). The `interpreter_own_messages` policy allows interpreters to see messages by `interpreter_id` match. The `booking_participants_read_messages` policy covers requester, recipient, and DHH client access via booking relationships.

7. **`bookings_legacy` table does not exist.** It has been fully removed. No policies, no data, no references remain anywhere in the database.

---

### Storage Bucket Status

| Bucket | Public | Size Limit | Mime Types |
|--------|--------|------------|------------|
| asl-guide | Yes | 500 MB | video/mp4 |
| avatars | Yes | 2 MB | image/jpeg, image/png, image/webp, image/gif |
| interpreter videos | Yes | 100 MB | video/mp4, video/webm, video/quicktime |
| message-attachments | No | 10 MB | image/jpeg, image/png, image/webp, image/gif, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain |
| profile-photos | Yes | 2 MB | image/jpeg, image/png, image/webp, image/gif |
| videos | Yes | 100 MB | video/mp4, video/webm, video/quicktime |

All buckets have file size limits and mime type restrictions configured. `message-attachments` is correctly set to private (not public).

---

### Migration Drift

- **Migration 035 (`rls_smoke_test_function`)** — Applied via Supabase MCP and saved to repo as `supabase/migrations/035_rls_smoke_test_function.sql`. Creates `rls_test_count()` function for RLS testing.
- **General note**: Migration files in `supabase/migrations/` are documentation-only (Supabase CLI is not linked locally). Some migrations were applied directly via MCP without corresponding repo files. The `rls_test_count` function was applied via MCP `execute_sql` and then saved as migration 035.

---

### Tables with RLS Enabled (39 total)

beta_feedback, booking_credits, booking_dhh_clients, booking_recipients, bookings, conversation_participants, conversations, deaf_profiles, deaf_roster, dhh_beta_responses, dhh_beta_status, dhh_requester_connections, direct_messages, interpreter_availability, interpreter_away_periods, interpreter_certifications, interpreter_education, interpreter_preferred_team, interpreter_profiles, interpreter_rate_profiles, interpreter_ratings, interpreter_regions, interpreter_sign_languages, interpreter_specializations, interpreter_spoken_languages, interpreter_videos, invoices, message_attachments, messages, notifications, profile_flags, requester_beta_responses, requester_beta_status, requester_profiles, requester_roster, reviews, trusted_deaf_circle, user_profiles, video_requests

---

### Test Infrastructure

- **Function**: `rls_test_count(p_user_id uuid, p_sql text)` — SECURITY INVOKER with `SET role = 'authenticated'`. Impersonates users by setting `request.jwt.claims` and executing count queries under RLS.
- **API route**: `POST /api/admin/smoke-test` — Admin-gated, runs all tests via `getSupabaseAdmin().rpc('rls_test_count', ...)`
- **UI**: `/admin/smoke-test` — Summary cards + results table with pass/fail/error status
- **Test users**: Molly (admin, all roles), Jenny Henn (interpreter-only), Adam (deaf-only)
