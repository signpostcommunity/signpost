# signpost — CLAUDE.md

## Project Overview

**signpost** is a single-file HTML prototype for a sign language interpreter marketplace/directory. It allows Deaf/Hard-of-Hearing individuals, organizations, and requesters to find, browse, and connect with certified sign language interpreters worldwide.

The entire application lives in `index.html` (~694KB). There is no build system, no package manager, no backend — it is a fully self-contained HTML/CSS/JS prototype.

## Architecture

- **Single file:** All HTML, CSS, and JavaScript are in `index.html`.
- **No frameworks:** Vanilla JS only. No React, Vue, or other libraries.
- **No backend:** All data is hardcoded mock data. Auth is simulated via a floating demo switcher bar.
- **Multi-view SPA pattern:** Views are `<div class="view">` elements toggled via `showView(name)`. Only one view has `class="active"` at a time.
- **Fonts:** Google Fonts — `Syne` (headings) and `DM Sans` (body).
- **Color scheme:** Dark theme with CSS custom properties defined in `:root`.

## Views

| View ID | Purpose |
|---|---|
| `view-home` | Landing page / hero |
| `view-directory` | Interpreter search/browse directory |
| `view-profile` | Individual interpreter profile |
| `view-signup` | Interpreter signup (multi-step form) |
| `view-about` | About page |
| `view-interpreter-portal` | Interpreter marketing/landing |
| `view-interpreter-login` | Interpreter login |
| `view-interpreter-dashboard` | Interpreter's logged-in dashboard |
| `view-deaf-portal` | Deaf/HoH marketing/landing |
| `view-deaf-dashboard` | Deaf/HoH logged-in dashboard |
| `view-requester-portal` | Requester marketing/landing |
| `view-requester-login` | Requester login |
| `view-requester-signup` | Requester signup (role selection) |
| `view-requester-dashboard` | Requester/Org logged-in dashboard |

## User Roles

```
null          — Logged out (default)
'interpreter' — Sign language interpreter
'deaf'        — Deaf / Hard-of-Hearing user
'org'         — Organization / Institution
'requester'   — General service requester
```

Role is stored in `let currentUserRole = null;` and toggled via the orange demo switcher bar at the bottom of the page (prototype only).

## Key JavaScript Sections (line references approximate)

| Section | Location |
|---|---|
| Mock interpreter data (`interpreters[]`) | ~line 3489 |
| View switching (`showView`) | ~line 3644 |
| Mock login switcher (`setMockUser`, `updateMockLoginUI`) | ~line 3539 |
| Interpreter grid rendering (`renderGrid`) | ~line 3660 |
| Profile open (`openProfile`, `openRosterProfile`) | ~line 3710 |
| Rate profile management | ~line 3787 |
| Multi-step interpreter signup form | ~line 3886 |
| Mobile nav toggle | ~line 3949 |
| Filter drawer | ~line 3993 |
| Dashboard panels/tabs | ~line 6763 |
| Region options | ~line 6784 |
| Requester signup steps | ~line 6811 |

## CSS Variables

```css
--bg: #000000
--surface: #0f1118
--surface2: #161923
--border: #1e2433
--accent: #00e5ff      /* cyan — primary CTA */
--accent2: #9d87ff     /* purple — D/HH branding */
--accent3: #ff6b85     /* pink */
--text: #f0f2f8
--muted: #b0b8d0
--card-bg: #0d1220
--radius: 16px
--radius-sm: 10px
```

## Interpreter Data Schema

```js
{
  id: Number,
  initials: String,
  name: String,
  location: String,        // "City, Country"
  state: String,
  signLangs: String[],     // e.g. ['ASL','BSL','IS']
  spokenLangs: String[],   // e.g. ['English','Spanish']
  specs: String[],         // specializations
  certs: String[],         // certification bodies
  rating: Number,
  reviews: Number,
  available: Boolean,
  color: String,           // CSS gradient for avatar
  regions: String[]        // e.g. ['EU','Worldwide']
}
```

## Development Notes

- This is a **prototype/demo** — no real auth, no real database, no API calls.
- The mock login switcher bar (orange, bottom-center) is for demo purposes only and should be removed before any production deployment.
- The file is very large because everything is inline. When editing, search by comment section headers like `// ============ SECTION NAME ============` to navigate.
- All login forms accept any non-empty input — they immediately set the role and redirect to the appropriate dashboard.
- Responsive breakpoints are handled with `@media` queries. The main mobile breakpoint is `max-width: 768px` with additional tweaks at `900px`.
