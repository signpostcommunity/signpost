# Prototype artifacts audit (2026-04-28)

## Summary

Searched all production code under `app/` and `components/` for 8 patterns of hardcoded prototype data. **1 HIGH**, **3 MEDIUM**, and **20 LOW** findings. The original prototype names (Maya Chen, Takeshi Nara, Dana Whitfield, Jordan Rivera) from the Client Interpreter Lists fix are fully gone. However, a separate set of hardcoded mock bookings with fictitious names (Alex Rivera, Sofia Reyes, Marcus Kim, Priya Nair) is actively rendered to real Deaf users on the DHH Bookings page. Pattern 1 (prototype names), Pattern 3 (fake stats), Pattern 5 (stock photo URLs), Pattern 6 (hardcoded counts), and Pattern 8 (mock imports) returned zero hits.

## Findings by file

### Severity: HIGH

Items that visibly display fake data to real users in production paths.

| File | Line | Pattern | Excerpt | Recommended fix |
|---|---|---|---|---|
| `app/(dashboard)/dhh/dashboard/bookings/page.tsx` | 623-696 | Hardcoded mock data | `MOCK_ON_BEHALF_CONFIRMED` and `MOCK_ON_BEHALF_CANCELLED` contain names "Alex Rivera", "Sofia Reyes", "Marcus Kim", "Priya Nair" with fake booking details (Cardiology Appointment, Legal Consultation) | Replace with empty-state UI when no real on-behalf bookings exist. Currently these mocks are initialized in state (line 761) and persist when the user has zero real on-behalf bookings (line 856: "keep the mock data"). |
| `app/(dashboard)/dhh/dashboard/bookings/page.tsx` | 812-846 | Hardcoded mock data | Mock self-booking "ASL Practice" with interpreter "Marcus Kim" shown when user has zero real self-bookings | Same fix: show empty-state message instead of fake booking card |

### Severity: MEDIUM

Items that are likely safe but suspicious, worth a closer look.

| File | Line | Pattern | Excerpt | Note |
|---|---|---|---|---|
| `app/(dashboard)/request/dashboard/client-lists/ClientListsClient.tsx` | 411 | Coming soon | `setToast({ message: 'Invite feature coming soon.', type: 'success' })` | Rendered to real requester users who click the invite button. Feature stub, not prototype data, but the button is live and misleading. Either wire up the feature or disable the button. |
| `app/(public)/invite/InviteClient.tsx` | 484, 661, 712, 717 | Coming soon | `'SMS invites coming soon'` | Shown to real users who select SMS-only contacts in the invite flow. Intentional feature gate (10DLC approval pending per comment line 482), but the wording should be reviewed for launch. |
| `app/api/seed-deaf-beta/route.ts` | 637-672 | Hardcoded names | References to "Betty White", "Keanu Reeves", "Oprah Winfrey" as roster entries for seed deaf users | This is an API seed route, not rendered in UI. However, the route is deployed and accessible. Consider gating behind admin check or removing post-launch. |

### Severity: LOW

TODOs, dev comments, and internal placeholders that don't visibly affect users.

| File | Line | Pattern | Excerpt | Note |
|---|---|---|---|---|
| `app/(dashboard)/admin/dashboard/vision/page.tsx` | 284, 336 | Coming soon | `'Vision document coming soon.'` | Admin-only page. Internal documentation placeholder. |
| `app/(public)/about/page.tsx` | 37 | Coming soon | `'Video coming soon'` | Public-facing but minor. Shows in About page video section. |
| `app/(dashboard)/admin/dashboard/interpreters/InterpretersClient.tsx` | 1, 4 | TODO | `// TODO: Add rating summary to admin interpreter detail panel` | Admin-only feature note |
| `app/(dashboard)/dhh/dashboard/circle/page.tsx` | 1 | TODO | `// TODO: Trusted Circle rating sharing toggle` | Feature backlog note |
| `app/(dashboard)/dhh/dashboard/preferences/page.tsx` | 277 | TODO | `// TODO: Tech debt - remove deaf_profiles.name column` | Schema tech debt note |
| `app/(dashboard)/interpreter/dashboard/confirmed/page.tsx` | 203-205 | TODO | `// TODO: cancelled_by_requester`, `// TODO: If sub_search_initiated`, `// TODO: If D/HH consumer is linked` | Future feature wiring |
| `app/(dashboard)/interpreter/dashboard/confirmed/page.tsx` | 474 | TODO | `// TODO: Wire to real notification/message system` | Team notification stub |
| `app/(dashboard)/interpreter/dashboard/confirmed/page.tsx` | 669, 735, 741 | TODO | `// TODO: Add these columns to bookings table` | Schema extension notes |
| `app/(dashboard)/interpreter/dashboard/invoices/page.tsx` | 140 | TODO | `// TODO: Wire actual email delivery` | Invoice email stub |
| `app/(dashboard)/interpreter/dashboard/profile/ProfileClient.tsx` | 808, 964 | TODO | `// TODO: Tech debt - remove interpreter_profiles.name column` | Schema tech debt note (recurring) |
| `app/(dashboard)/request/dashboard/requests/RequestsClient.tsx` | 1 | TODO | `// TODO: Request detail view needs UI to add contact info` | Feature note |
| `app/(dashboard)/request/dashboard/page.tsx` | 95 | TODO | `// TODO: Tech debt - remove requester_profiles.name column` | Schema tech debt note |
| `app/auth/callback/route.ts` | 86, 150 | TODO | `// TODO: Tech debt - remove name column` | Schema tech debt note (x2) |
| `components/interpreter-signup/Step3Credentials.tsx` | 108 | TODO | `// TODO: Add file upload for business documents` | Feature backlog |
| `components/interpreter-signup/Step6Review.tsx` | 104 | TODO | `// TODO: Tech debt - remove interpreter_profiles.name column` | Schema tech debt note |
| `components/layout/Nav.tsx` | 239 | TODO | `// TODO: hook up i18n here when ready` | i18n placeholder |

### Not flagged (false positives excluded)

- **`@example.com` in placeholder attributes**: All 13 hits (e.g., `placeholder="you@example.com"`, `placeholder="friend@example.com"`) are HTML input placeholder text, not displayed as real data. This is standard UX practice. No action needed.
- **Seed data in `lib/data/seed.ts`**: Contains Betty White, Keanu Reeves, etc. per CLAUDE.md rules ("Seed profiles are NOT test accounts"). Not a prototype artifact.

## Recommendations

1. **Fix the DHH Bookings mock data immediately (HIGH).** Replace `MOCK_ON_BEHALF_CONFIRMED`, `MOCK_ON_BEHALF_CANCELLED`, and the mock self-booking (lines 812-846) with proper empty-state UI. Real Deaf users see "Alex Rivera" and "Sofia Reyes" as if they were actual bookings. This is the only active prototype artifact reaching end users.

2. **Wire up or disable the requester invite button (MEDIUM).** The "Invite feature coming soon" toast on `/request/dashboard/client-lists` is misleading — the button looks functional but does nothing. Either connect it to the existing invite system or grey it out with a disabled state.

3. **Review "Video coming soon" on About page (LOW but public).** This is visible to all visitors. Either add the video or remove the placeholder text.

4. **Consolidate the recurring tech-debt TODOs.** The `// TODO: Tech debt - remove X_profiles.name column` comment appears in 6 files. Consider creating a single tracked issue and removing the scattered comments.

5. **Gate or remove `api/seed-deaf-beta` for production.** This seed route is deployed and callable. It should either check `is_admin` or be removed from the production build.
