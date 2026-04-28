# Requester beta UI content archive

Extracted 2026-04-27 from commit 4a417addd08e31ba824b37c0ea99ddeb8f9ac74d.

**Source files (now removed):**
- `components/ui/BetaTryThis.tsx`
- `components/dashboard/requester/RequesterBetaPanel.tsx`

**Modified files (UI removal only):**
- `app/(dashboard)/request/layout.tsx`
- `app/(dashboard)/request/dashboard/RequesterOverviewClient.tsx`
- `app/(dashboard)/request/dashboard/requests/RequestsClient.tsx`
- `app/(dashboard)/request/dashboard/new-request/page.tsx`
- `app/(dashboard)/request/dashboard/interpreters/InterpretersClient.tsx`
- `app/(dashboard)/request/dashboard/client-lists/ClientListsClient.tsx`
- `app/(dashboard)/request/dashboard/profile/ProfileClient.tsx`

**Future use:** standalone requester beta feedback page (Monday 11864251233).

---

## Beta Feedback panel

**Component:** `RequesterBetaPanel` (`components/dashboard/requester/RequesterBetaPanel.tsx`)

**Rendering location:** `app/(dashboard)/request/layout.tsx` — fixed-position floating panel, rendered for all authenticated requester users.

**Behavior:** Renders as a floating orange pill button ("Beta Feedback") at bottom-right of viewport. Clicking opens a drawer with a page-specific question and a general question. Answers auto-save to the `beta_feedback` Supabase table after 1.5s debounce. Answers reset when navigating between pages. Panel does not render on sub-pages without a mapped question (e.g., `/inbox/conversation/[id]`).

### Pill button (closed state)

Label: `Beta Feedback`

Icon: chat bubble SVG

### Drawer header

Title: `Beta Feedback`

Subtitle: dynamic page label (see page labels below)

### Page labels

| Path | Label |
|------|-------|
| `/request/dashboard` | Dashboard |
| `/request/dashboard/new-request` | New Request |
| `/request/dashboard/requests` | All Requests |
| `/request/dashboard/inbox` | Inbox |
| `/request/dashboard/interpreters` | Preferred Interpreters |
| `/request/dashboard/client-lists` | Client Interpreter Lists |
| `/request/dashboard/profile` | Profile |

### Page-specific questions

| Path | Question |
|------|----------|
| `/request/dashboard` | What is the first thing you went looking for? Did you find it? |
| `/request/dashboard/new-request` | Did the booking process feel straightforward? Was anything confusing about the "Who is this for?" section or choosing interpreters? |
| `/request/dashboard/requests` | Can you easily understand the status of each request? Is anything unclear about how interpreter responses are shown? |
| `/request/dashboard/inbox` | Is the messaging with interpreters clear? Is there anything missing from the conversation view? |
| `/request/dashboard/interpreters` | Is it clear how to add interpreters to your roster? Does the Preferred vs Secondary tier distinction make sense? |
| `/request/dashboard/client-lists` | Is it clear how to request a Deaf client's preferred list? Does the process feel respectful of the Deaf person's control? |
| `/request/dashboard/profile` | Was setting up your profile straightforward? Is there anything missing from the payment method section? |

### General question (shown on all pages below the page-specific question)

Anything else about this page?

### Input placeholders

- Page-specific textarea: `Your thoughts...`
- General textarea: `Optional...`

### Save behavior

Saves to `beta_feedback` table with columns:
- `tester_email`: user's email
- `page`: `requester_` + pathname with slashes replaced by underscores
- `notes`: specific and general answers joined by `\n---\n`
- `specific_answer`: specific answer only
- `feedback_type`: `page_note`

Save confirmation text: `Saved for {pageLabel}`

Error text: `Error saving`

---

## Try This prompts

**Component:** `BetaTryThis` (`components/ui/BetaTryThis.tsx`)

**Behavior:** Orange left-bordered banner with "TRY THIS" label. Dismissible via "x" button; dismissed state persisted to localStorage under the provided `storageKey`. Once dismissed, does not reappear.

**Label text:** `TRY THIS`

**Dismiss button label:** `x` (aria-label: "Dismiss")

### Prompt 1: Dashboard — Recent Requests

**Page:** `/request/dashboard` (`RequesterOverviewClient.tsx`)

**Storage key:** `beta_try_dashboard_recent`

**Text:** Click on any of the sample requests below to see their details, interpreter responses, and status tracking. Try the 'Staff Training Workshop' request to see how interpreter rate responses work.

### Prompt 2: All Requests

**Page:** `/request/dashboard/requests` (`RequestsClient.tsx`)

**Storage key:** `beta_try_all_requests`

**Text:** Open the 'Staff Training Workshop' request to see interpreter responses with their rates. Try accepting one of the rates to see the confirmation flow.

### Prompt 3: New Request — Deaf client section

**Page:** `/request/dashboard/new-request` (`page.tsx`)

**Storage key:** `beta_try_new_request_deaf`

**Text:** Try entering jordan.rivera.test@signpost.community in the field below to see how a Deaf client's preferred interpreter list works. Then click '+ Add another person' and enter maria.chen.test@signpost.community. Notice which interpreters are recommended because they appear on both lists.

### Prompt 4: New Request — Interpreter section

**Page:** `/request/dashboard/new-request` (`page.tsx`)

**Storage key:** `beta_try_new_request_interp`

**Text:** The interpreters below come from your tagged client's preferred list. These are interpreters the Deaf client trusts. Notice how they appear above your own roster, giving priority to the client's preferences.

### Prompt 5: Preferred Interpreters

**Page:** `/request/dashboard/interpreters` (`InterpretersClient.tsx`)

**Storage key:** `beta_try_preferred_interp`

**Text:** Browse the interpreter directory and add a few interpreters to your preferred list. Try moving one to your secondary tier.

### Prompt 6: Client Interpreter Lists

**Page:** `/request/dashboard/client-lists` (`ClientListsClient.tsx`)

**Storage key:** `beta_try_client_lists`

**Text:** Enter jordan.rivera.test@signpost.community below to see how requesting a Deaf client's preferred interpreter list works.

### Prompt 7: Profile — Payment Method

**Page:** `/request/dashboard/profile` (`ProfileClient.tsx`)

**Storage key:** `beta_try_payment_method`

**Text:** Try adding a payment method using test card number 4242 4242 4242 4242 with any future expiry date and any CVC.

---

## Notes

- No welcome modal existed in the requester portal. The dashboard greeting ("Good to see you, {name}" / "Welcome to your dashboard.") is standard UI, not a beta surface.
- The `BetaTryThis` component was only used in the requester portal (7 instances across 6 files). No Deaf or Interpreter portal references.
- The `RequesterBetaPanel` was only rendered in `app/(dashboard)/request/layout.tsx`.
- Beta feedback was saved to the `beta_feedback` Supabase table. The table itself is not removed by this change.
- Each Try This prompt used localStorage persistence, meaning dismissed prompts would not reappear even if the component were re-added. Storage keys are listed above for reference.
