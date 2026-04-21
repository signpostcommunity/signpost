# Investigation: addRole Interpreter Flow Architecture

**Date:** 2026-04-20
**Scope:** Investigation only (no code changes)
**Bugs under investigation:** Bug 1 (DHH primary blocked at Finish step) and Bug 2 (Requester primary blocked at Step 7)

---

## 1. Summary

The interpreter addRole flow (`/interpreter/signup?addRole=true`) creates an `interpreter_profiles` row during initialization (line 697-711 of SignupClient.tsx), then UPDATEs that row across sections 3-7 using `.eq('user_id', uid)`. Bug 2 (Requester primary fails at Step 7) occurs when the addRole initialization INSERT silently fails or is blocked by a race condition, leaving no row for subsequent UPDATEs to target. Bug 1 (DHH primary blocked at Finish) occurs because `getMissingRequiredFields()` (lines 632-645) requires city, state, and country, but DHH signup does not collect location fields, and the addRole flow skips Section 1 (Account) where they would normally be entered. The `getExistingProfileData()` helper (lib/populateNewProfile.ts) attempts to copy location from existing profiles, but DHH profiles often have empty location fields, so the defaults come back as empty strings. Both bugs share an overlapping root cause: the addRole flow assumes the source profile is interpreter-shaped (has location fields, has a populated interpreter_profiles row), but DHH and Requester source profiles do not match that shape.

---

## 2. Flow Map

### 2.1 File List

| File | Role |
|---|---|
| `app/(auth)/interpreter/signup/page.tsx` | Server page wrapper (7 lines, renders SignupClient) |
| `app/(auth)/interpreter/signup/SignupClient.tsx` | Main client component (2901 lines). All 9 sections, state, validation, submission |
| `lib/populateNewProfile.ts` | `getExistingProfileData()` - fetches shared fields from all profile tables via admin client |
| `app/api/profile-defaults/route.ts` | `GET /api/profile-defaults` - authenticated wrapper for getExistingProfileData |
| `lib/nameSync.ts` | `syncNameFields()` - keeps name/first_name/last_name in sync |
| `lib/slugUtils.ts` | `generateSlug()` - creates vanity URL slug from name |
| `lib/normalize.ts` | `normalizeProfileFields()` - normalizes location/name fields |
| `lib/countries.ts` | `getCountryName()` - converts country code to display name |
| `lib/phone.ts` | `normalizePhone()` - formats phone numbers |
| `components/ui/LocationInput.tsx` | Country/State/City picker component |
| `components/ui/GoogleSignInButton.tsx` | OAuth sign-in button |
| `components/ui/InlineVideoCapture.tsx` | Video recorder/URL input for Section 6 |

### 2.2 Step Sequence

All sections are inline in SignupClient.tsx (no separate step component files).

| Section | Label | Lines | Fields Collected | Skipped when addRole? | Profile tables READ | interpreter_profiles WRITE | Write type |
|---|---|---|---|---|---|---|---|
| 1 | Account | 909-1097 | Email, password, first/last name, address, city, state, country, zip | **YES** | user_profiles (check existence) | INSERT (full row with location) | INSERT + UPDATE (vanity_slug) |
| 2 | How It Works | ~1098-1298 | None (education cards) | No | None | None | - |
| 3 | Professional | 1306-1351 | Interpreter type, years experience, work mode, gender, pronouns, phone, phone type, event coordination | No | None | UPDATE: interpreter_type, years_experience, work_mode, gender_identity, pronouns, phone, phone_type, event_coordination | UPDATE via `.eq('user_id', uid)` |
| 4 | Languages | 1607-1654 | Sign languages, spoken languages | No | None | UPDATE: sign_languages, spoken_languages | UPDATE via `.eq('user_id', uid)` |
| 5 | Credentials | 1886-1936 | Certifications (name, issuing body, year), Education (institution, degree, year) | No | None | DELETE + INSERT on interpreter_certifications, interpreter_education (keyed by interpreter_id = profileId) | INSERT (junction tables only) |
| 6 | About You | 2105-2233 | Photo (required), bio, bio_specializations, bio_extra, video_url | No | None | UPDATE: photo_url (on upload), bio, bio_specializations, bio_extra, video_url | UPDATE via `.eq('user_id', uid)` |
| 7 | How People Find You | 2456-2491 | Specializations, specialized_skills, lgbtq, deaf_parented, bipoc, bipoc_details, religious_affiliation, religious_details, mentorship_offering, mentorship_seeking | No | None | UPDATE: all listed fields | UPDATE via `.eq('user_id', uid)` |
| 8 | Finish | 2621-2677 | Terms agreement, optional add Deaf/Requester role | No | user_profiles (pending_roles) | UPDATE: submitted_at, status='approved' | UPDATE via `.eq('user_id', uid)` |
| 9 | Done | ~2780+ | None (success screen) | Skipped when addRole (redirect to dashboard instead) | None | None | - |

**Key observation:** When `addRole=true`, Section 1 is skipped entirely. This means:
- Location fields (city, state, country) are ONLY populated from `getExistingProfileData()` defaults
- If the source profile has no location data, those fields remain empty strings
- No UI is presented during Sections 2-8 to collect location fields

### 2.3 INSERT Point

**Location:** SignupClient.tsx lines 697-711 (inside the addRole useEffect, lines 648-746)

```
Condition: isAddRole === true AND no existing interpreter_profiles row found for user_id
```

**Fields populated on INSERT:**
- `user_id` (from auth session)
- `first_name` (from defaults or empty string)
- `last_name` (from defaults or empty string)
- `email` (from auth session or defaults)
- `city` (from defaults or empty string)
- `state` (from defaults or empty string)
- `country` (from defaults or empty string)
- `country_name` (from defaults or empty string)
- `photo_url` (from defaults or null)

**What happens on INSERT failure:**
- Line 712-716: Error is logged to console and `setError()` displays a message to the user. `setInitFailed(true)` prevents further interaction.
- This is robust error handling for explicit INSERT errors.

**What could cause a silent failure:**
- The INSERT uses the authenticated Supabase client (not admin). The RLS INSERT policy is `user_id = auth.uid()`. This should pass for any authenticated user inserting their own row.
- However: if the `/api/profile-defaults` fetch is slow or fails, `defaults` could be an empty object, causing the INSERT to use empty strings for all shared fields. The INSERT itself would still succeed (all columns except id, user_id, status, created_at, updated_at are nullable or have defaults).

**There is also a second INSERT point** in Section 1 (line 1019-1039), but this only fires for fresh signups (not addRole).

### 2.4 UPDATE Points

| Line | Section | Columns Updated | Error Handling |
|---|---|---|---|
| 734-737 | addRole init | `vanity_slug` | None (fire-and-forget, no error check) |
| 857-863 | Auto-save (every 5s) | `draft_step`, `draft_data` | Console warn only |
| 899-905 | `goToSection()` | `draft_step`, `draft_data` | Console warn only |
| 1319-1332 | Section 3 | interpreter_type, years_experience, work_mode, gender_identity, pronouns, phone, phone_type, event_coordination | **Checks for zero rows** (line 1339-1344). Shows error to user. |
| 1628-1635 | Section 4 | sign_languages, spoken_languages | **Checks for zero rows** (line 1642-1647). Shows error to user. |
| 2210-2214 | Section 6 | bio, bio_specializations, bio_extra, video_url | **Checks for zero rows** (line 2221-2226). Shows error to user. |
| 2461-2476 | Section 7 | specializations, specialized_skills, lgbtq, deaf_parented, bipoc, bipoc_details, religious_affiliation, religious_details, mentorship_offering, mentorship_seeking | **Checks for zero rows** (line 2483-2488). Shows error to user. |
| 2640-2646 | Section 8 (submit) | submitted_at, status | Checks for `submitErr` only. Does NOT check for zero rows. |
| ~2167 | Section 6 (photo) | photo_url | Not visible in read range; likely similar pattern |

**The Step 7 UPDATE (line 2461-2476)** is the one producing the Bug 2 console message: `[addRole/interpreter/step-7] update matched zero rows (profile row missing?)`. This confirms the UPDATE found no row matching `.eq('user_id', uid)`.

---

## 3. INSERT and UPDATE Points (Detailed)

### INSERT points for interpreter_profiles across entire codebase

1. **SignupClient.tsx:697-711** - addRole initialization (conditional: only if no existing row)
2. **SignupClient.tsx:1019-1039** - Section 1 account creation (conditional: only for fresh signups, never fires when addRole=true)
3. **auth/callback/route.ts** - Google OAuth callback (creates profile for new Google sign-in users)

No other INSERT points exist in the codebase for `interpreter_profiles`.

### UPDATE points summary

All step-save handlers (Sections 3, 4, 6, 7) follow the same pattern:
1. `.update({...}).eq('user_id', userId).select()`
2. Check `error` (Supabase error object)
3. Check `data.length === 0` (zero rows matched)
4. Both conditions surface error to user via `setError()`

Section 8 (final submit) only checks for `submitErr`, not zero rows. This means if the profile row is missing at submit time, the UPDATE would silently succeed with zero rows matched, and the flow would proceed to pending_roles cleanup and dashboard redirect, but the profile would never actually be marked as approved.

---

## 4. Assumption Table

| Assumption | Which step / file | Source types where this HOLDS | Source types where it FAILS |
|---|---|---|---|
| city is non-empty | Finish (getMissingRequiredFields, line 636) | Interpreter (collected in Section 1) | DHH (location not always collected), Requester (location may be empty) |
| state is non-empty | Finish (getMissingRequiredFields, line 637) | Interpreter (collected in Section 1) | DHH (location not always collected), Requester (location may be empty) |
| country is non-empty | Finish (getMissingRequiredFields, line 638) | Interpreter (collected in Section 1) | DHH (location not always collected), Requester (location may be empty) |
| interpreter_profiles row exists for user_id | Sections 3, 4, 6, 7, 8 UPDATEs | All types IF addRole init INSERT succeeded | Any type IF addRole init INSERT failed silently or was blocked |
| profileId state variable is set | Section 5 (interpreter_certifications/education use profileId) | All types IF addRole init set it | Any type IF addRole init failed to set profileId |
| photo_url is non-empty | Finish (getMissingRequiredFields, line 639) | Interpreter (required in Section 6), DHH (if photo existed) | DHH or Requester with no photo on source profile |
| user has at least one sign language | Finish (getMissingRequiredFields, line 640) | Any type that completes Section 4 | Any type that somehow skips Section 4 (not possible in normal flow) |
| user has at least one specialization | Finish (getMissingRequiredFields, line 643) | Any type that completes Section 7 | Any type where Section 7 save fails silently |
| getExistingProfileData returns location | addRole init INSERT (lines 699-711) | Interpreter source (has location from Section 1) | DHH source (often no location), Requester source (may have location from Step 3) |

---

## 5. Silent-Failure Paths

### 5.1 UPDATE returns zero rows with no Supabase error

This is normal Postgres behavior. When `.update().eq('user_id', uid)` matches no rows, Supabase returns `{ error: null, data: [] }`. Sections 3, 4, 6, and 7 all check for this and surface an error. Section 8 does NOT check for zero rows.

### 5.2 Auto-save draft fails silently

Lines 857-863 and 899-905: The auto-save (every 5 seconds) and the `goToSection()` draft persistence both use fire-and-forget `.then()` patterns. If the UPDATE fails (no row, RLS denial), it only logs to console. The user sees no indication their draft is not being saved.

### 5.3 Vanity slug UPDATE is fire-and-forget

Lines 734-737: After the addRole init INSERT, the vanity slug update has no error handling at all. If this fails, the interpreter profile has no slug, which may cause issues later in the dashboard.

### 5.4 profile-defaults fetch failure is swallowed

Lines 681-683: If the `/api/profile-defaults` fetch fails, it catches the error and logs a warning. The flow continues with empty defaults, meaning the INSERT at lines 697-711 will create a profile with empty strings for city, state, country. These will fail the getMissingRequiredFields check at Finish.

### 5.5 Section 8 submit does not check zero-row UPDATE

Lines 2640-2652: The final submit UPDATE only checks `submitErr` (Supabase error object). If the UPDATE matches zero rows (profile missing), it returns `{ error: null, data: undefined }` (no `.select()` is called here), and the flow proceeds as if successful. The profile is never marked as approved, but the user is redirected to the dashboard.

### 5.6 RLS silent denial on INSERT

The INSERT RLS policy is `user_id = auth.uid()`. As long as the INSERT sets `user_id` to the authenticated user's ID, this will pass. There is no scenario where RLS would block a legitimate addRole INSERT for any source profile type.

### 5.7 profileId not set when Section 5 fires

If the addRole init fails to set `profileId` (line 718: `setProfileId(newProfile.id)`), Section 5's certifications and education INSERTs use `profileId` as `interpreter_id`. If profileId is null/undefined, these INSERTs would use a null FK and fail, but the Section 5 handler at lines 1886-1936 does check for errors.

---

## 6. RLS and Schema Findings

### 6.1 RLS Policies on interpreter_profiles

| Policy | Command | Qualification | With Check |
|---|---|---|---|
| interpreters insert own profile | INSERT | (none) | `user_id = auth.uid()` |
| public read approved interpreters | SELECT | `status = 'approved'` | (none) |
| users read own interpreter profile | SELECT | `user_id = auth.uid()` | (none) |
| interpreters update own profile | UPDATE | `user_id = auth.uid()` | (none) |

**Key finding:** There is no restriction preventing a DHH or Requester primary user from inserting an interpreter_profiles row. The only check is `user_id = auth.uid()`. Any authenticated user can INSERT a row with their own user_id. Similarly, any user can UPDATE their own row. RLS is NOT the cause of either bug.

### 6.2 Schema - Required Columns (NOT NULL, no default)

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | uuid_generate_v4() |
| user_id | uuid | NO | (none) |
| status | text | NO | 'pending' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

Only `user_id` is truly required on INSERT (no default). All other NOT NULL columns have defaults. This means the addRole init INSERT (lines 697-711) can succeed with just `user_id` -- all other fields can be empty strings or null.

### 6.3 Schema - Columns the addRole flow populates vs. what Finish requires

| Required by Finish | Populated in addRole init INSERT | Populated in which Section | Gap? |
|---|---|---|---|
| first_name | Yes (from defaults, may be empty) | Section 1 (SKIPPED) | **YES if defaults empty** |
| last_name | Yes (from defaults, may be empty) | Section 1 (SKIPPED) | **YES if defaults empty** |
| city | Yes (from defaults, may be empty) | Section 1 (SKIPPED) | **YES -- root cause of Bug 1** |
| state | Yes (from defaults, may be empty) | Section 1 (SKIPPED) | **YES -- root cause of Bug 1** |
| country | Yes (from defaults, may be empty) | Section 1 (SKIPPED) | **YES -- root cause of Bug 1** |
| photo_url | Yes (from defaults, may be null) | Section 6 (photo upload) | No -- Section 6 is not skipped |
| sign_languages (at least one) | No | Section 4 | No -- Section 4 is not skipped |
| spoken_languages (at least one) | No | Section 4 | No -- Section 4 is not skipped |
| years_experience | No | Section 3 | No -- Section 3 is not skipped |
| specializations (at least one) | No | Section 7 | No -- Section 7 is not skipped |

---

## 7. Cross-Portal Comparison

### 7.1 DHH addRole Flow (`/dhh/signup?addRole=true`)

**File:** `app/(auth)/dhh/signup/SignupClient.tsx` (1596 lines)

**Structure:** Parallel to interpreter flow. 6 steps, skips Step 1 when addRole=true.

**INSERT timing:** Lines 492-510. Same pattern as interpreter: checks for existing deaf_profiles row, INSERTs if missing. Uses `syncNameFields()`. Includes city, state, country, country_name from defaults.

**Key difference from interpreter flow:** DHH signup does not require city/state/country at Finish. The DHH flow collects communication preferences (signing styles, voice, DI preference) but not location. This means the DHH addRole flow works for Interpreter primaries adding DHH because it does not validate location at the end.

**Would it work for Requester primary adding DHH?** Likely yes, because:
- The INSERT uses the same `getExistingProfileData()` pattern
- DHH Finish does not require location fields
- Requester profiles have location from Step 3, so defaults would be populated anyway

### 7.2 Requester addRole Flow (`/request/signup?addRole=true`)

**File:** `app/(auth)/request/signup/SignupClient.tsx` (1270 lines)

**Structure:** 4 steps, skips Step 1 when addRole=true.

**Critical difference: uses UPSERT, not INSERT-then-UPDATE.**

The requester flow does NOT use the same "INSERT in init, UPDATE in steps" pattern. Instead:
- The addRole init (lines 656-731) creates a minimal requester_profiles row
- The final `handleSubmit()` (line 811) uses `.upsert(syncNameFields({...}), { onConflict: 'id' })`
- This means even if the init INSERT fails, the submit UPSERT will create the row

**Step 3 collects location.** The requester signup Step 3 ("Account Details") collects city, state, country, phone, address, and org details. This step is NOT skipped when addRole=true. So even if the source profile has no location, the user fills it in during Step 3.

**Why requester addRole is robust across all source types:**
1. It collects location in Step 3 (not skipped), so it never relies solely on defaults
2. It uses UPSERT at submit, so even if the init row is missing, the final write creates it
3. Its Finish validation only requires first_name, last_name, and email (not location)

**This is the template for fixing the interpreter flow.**

### 7.3 Parity Summary

| Aspect | Interpreter addRole | DHH addRole | Requester addRole |
|---|---|---|---|
| Init INSERT creates row | Yes | Yes | Yes |
| Steps use UPDATE on that row | Yes (Sections 3-8) | Yes (Steps 2-5) | No (uses UPSERT at submit) |
| Location collected in flow | No (skipped with Section 1) | No (not collected in DHH flow at all) | Yes (Step 3, not skipped) |
| Location required at Finish | **YES (city, state, country)** | No | No |
| Robust to missing init row | Partially (Sections 3,4,6,7 check; Section 8 does not) | Unknown | Yes (UPSERT at submit) |
| Works for Interpreter primary | Yes | Yes (Test 1) | Yes (Test 2) |
| Works for DHH primary | **NO (Bug 1: location missing)** | N/A (same role) | Yes (Test 4) |
| Works for Requester primary | **NO (Bug 2: profile row missing)** | Untested (Test 6 never run) | N/A (same role) |

---

## 8. Bonus: 400-Error Observation

The interpreter dashboard OverviewClient.tsx (lines 278-280) queries three legacy junction tables:
- `interpreter_sign_languages`
- `interpreter_spoken_languages`
- `interpreter_specializations`

These tables exist in the database schema. However, the interpreter signup flow (both fresh and addRole) writes sign languages, spoken languages, and specializations as **array columns on interpreter_profiles** (e.g., `sign_languages text[]`), NOT as rows in these junction tables.

This means:
- For users who signed up through the current signup flow, these junction tables have **zero rows**
- The OverviewClient queries these tables expecting count data and gets 0 for all three
- Depending on the RLS policies on these junction tables, queries could return 400 errors if RLS is misconfigured, or simply return empty results

The 400 errors Desi observed during Setup 1A are likely caused by these junction table queries in OverviewClient.tsx hitting rows that have mismatched `interpreter_id` values or encountering RLS restrictions. The junction tables appear to be a legacy pattern from the seed script (`lib/data/seed-script.ts` lines 85-91 populate them) that was superseded by array columns on the main table. The dashboard was never updated to read from the array columns instead.

**Do not fix.** This is a separate issue from the addRole bugs. The fix would be updating OverviewClient.tsx to read from `interpreter_profiles.sign_languages`, `.spoken_languages`, and `.specializations` array columns instead of the junction tables.

---

## 9. Recommended Fix Shape

### Root Cause Summary

- **Bug 1** (DHH primary, location missing): The addRole flow skips Section 1 where location is collected. DHH profiles typically have empty location fields. `getExistingProfileData()` returns empty strings. `getMissingRequiredFields()` blocks submission.

- **Bug 2** (Requester primary, zero-row UPDATE): The addRole init INSERT succeeds or fails, but the `profileId` or `userId` state variable used in UPDATEs does not match the row. Most likely cause: a timing issue where `userId` is not yet set when the UPDATE fires, or the INSERT was blocked/failed silently.

### Proposed Fix Architecture

1. **Add a location-collection substep to the addRole flow.** When `isAddRole=true` and the source profile has no location data (city/state/country all empty after defaults are fetched), present a compact location form before or as part of Section 3 (Professional). This could be:
   - A new "Location" mini-step between Section 2 and Section 3
   - Or an inline location section at the top of Section 3
   - The location form should use the existing `LocationInput` component

2. **Change all step-save handlers to use UPSERT instead of UPDATE.** Follow the requester flow pattern. Each section save should use `.upsert({...}, { onConflict: 'user_id' })` (or `onConflict: 'id'` if using `profileId`). This makes every step self-healing: if the init INSERT failed, the first step save creates the row.

   Alternatively, keep the INSERT-then-UPDATE pattern but add a guard at the start of each step-save handler that checks for the row's existence and creates it if missing.

3. **Add zero-row check to Section 8 submit.** Add `.select()` to the final submit UPDATE and check for `data.length === 0`, matching the pattern already used in Sections 3, 4, 6, and 7.

4. **Handle all three source profile types uniformly.** The fix should not branch on source profile type. Instead:
   - Always fetch defaults via `getExistingProfileData()`
   - Always INSERT a minimal row (current behavior)
   - If location fields are empty after defaults, show location collection UI
   - UPDATEs should be resilient to missing rows (upsert or pre-check)

5. **No migrations needed.** The interpreter_profiles schema already has all needed columns as nullable with defaults. No DDL changes required.

6. **Estimated scope: Medium.** Changes needed:
   - `SignupClient.tsx`: Add location collection UI for addRole when location is empty (new conditional section or inline in Section 3). Optionally convert step-save UPDATEs to UPSERTs. Add zero-row check to Section 8.
   - No changes to `lib/populateNewProfile.ts` (it already works correctly)
   - No changes to RLS policies
   - No migrations
   - Approximately 1 file modified, 50-100 lines changed/added

### Alternative Approach

Instead of adding location collection to the interpreter addRole flow, the fix could ensure location is always populated by making `getExistingProfileData()` fall back to a geocoding service or by requiring location in all portal signups. However, this is a larger change affecting multiple flows and is not recommended for the immediate fix.
