# signpost — Design System

**Version:** 2.0
**Last updated:** March 26, 2026
**Status:** MANDATORY. All Claude Code agents must read this file before creating or modifying any UI element.

---

## Pre-flight requirement

Before creating or modifying ANY UI element, you MUST:

1. Identify which hierarchy level (L1–L6) the element belongs to
2. Confirm the correct font, weight, size, and color from this spec
3. Do NOT introduce new visual patterns, colors, sizes, or weights without explicit approval
4. If unsure which level an element belongs to, ASK before implementing

---

## Colors — WCAG AAA compliant

All text colors meet WCAG AAA (7:1 minimum contrast ratio) against the page background.

### Text colors (on #0a0a0f background)

| Role | Hex | Contrast | CSS Variable | Usage |
|------|------|----------|-------------|-------|
| White | #f0f2f8 | ~18:1 | --text | Headlines, bright body text, emphasis |
| Body | #c8cdd8 | ~12.5:1 | — | Standard paragraph text, form field labels |
| Muted | #96a0b8 | ~7.1:1 | --muted | Helper text, sub-labels, descriptions, placeholders |
| Cyan | #00e5ff | ~12:1 | --accent | Brand accent, interpreter/requester portal accent, L4 labels, CTAs |
| Purple | #a78bfa | ~7.3:1 | --accent2 | DHH portal accent (replaces cyan in DHH-specific elements) |

### NEVER use as text color

- **#7b61ff** — Only for filled button backgrounds or decorative elements where foreground is white/dark. Fails AAA as text.
- **#8891a8** — Old muted gray. Replaced by #96a0b8. If you see this in existing code, replace it.

### Background colors

| Role | Hex | CSS Variable | Usage |
|------|------|-------------|-------|
| Page background | #0a0a0f | --bg | Main background everywhere |
| Card background | #111118 | --card-bg | Cards, elevated surfaces, section backgrounds |
| Surface/inputs | #16161f | --surface | Form inputs, secondary surfaces |
| Border | #1e2433 | --border | All borders, dividers |

ALL card backgrounds must use #111118. Do NOT use rgb(17,17,24), rgb(15,17,24), rgb(13,18,32), or any other dark shade.

### Portal accent rules

- **Cyan (#00e5ff)** is the universal brand accent. Nav, wordmark, home page, interpreter portal, requester portal.
- **Purple (#a78bfa)** is the DHH portal identity color. Within DHH pages only, purple replaces cyan for: L4 form section labels, stat card numbers, sidebar active state, portal badges, sidebar count badges.
- Shared/global elements stay cyan even inside DHH portal: wordmark, nav links, primary CTAs.
- Determine portal by file path:
  - `app/(dashboard)/dhh/` → purple accent
  - `app/(dashboard)/interpreter/` → cyan accent
  - `app/(dashboard)/request/` → cyan accent

---

## Typography — 6-level hierarchy

### Fonts

- **Syne** — Headings and brand moments (Levels 1–3)
- **Inter / DM Sans** — Body, labels, helper text (Levels 4–6)

### Minimum font size: 12px

Nothing on the site goes below 12px. Ever.

### Level 1: Page headline

- Font: Syne
- Weight: **775**
- Size: **27px**
- Color: #f0f2f8
- Letter-spacing: -0.02em
- Usage: ONE per page. The main "where am I" title.
- Examples: "My Profile", "My Requests", "About signpost"

**This is the ONLY place font-weight 775 is used anywhere on the site.**

### Level 2: Section heading

- Font: Syne
- Weight: **700**
- Size: **20px**
- Color: #f0f2f8
- Letter-spacing: -0.01em
- Usage: Major divisions within a page.
- Examples: "A direct line between you and your interpreter.", "Our Accessibility Commitment"

### Level 3: Card / group heading

- Font: Syne
- Weight: **600**
- Size: **15px**
- Color: #f0f2f8
- Usage: Card titles, collapsible sections, item names.
- Examples: "Your choice, always" (How It Works card), interpreter names on booking cards

### Level 4: Form section label

- Font: Inter / DM Sans
- Weight: **600**
- Size: **13px**
- Transform: UPPERCASE
- Letter-spacing: 0.08em
- Color: #00e5ff (cyan) or #a78bfa (purple in DHH portal)
- Usage: Major section dividers on forms and list pages.
- Examples: "SIGN LANGUAGES", "PERSONAL INFORMATION", "PREFERRED"

### Level 5: Sub-label

- Font: Inter / DM Sans
- Weight: **500**
- Size: **12px** (the minimum floor)
- Transform: UPPERCASE
- Letter-spacing: 0.06em
- Color: #96a0b8 (muted)
- Usage: Subordinate to Level 4.
- Examples: "MOST COMMON", "MORE LANGUAGES BY REGION"

For **form field labels** (First Name, City, etc.): sentence case, 13px, weight 500, color #c8cdd8.

### Level 6: Helper / body text

- Font: Inter / DM Sans
- Weight: **400**
- Size: **14–15px**
- Transform: none (sentence case)
- Color: #96a0b8 (helper/instructions) or #c8cdd8 (body paragraphs)
- Line-height: 1.5–1.7
- Examples: "Select all sign languages in which you have professional-level fluency."

---

## Font weight rules

| Weight | Where | Never use for |
|--------|-------|---------------|
| 775 | Level 1 page headlines ONLY | Anything else |
| 700 | Level 2 section headings | Card titles, form labels |
| 600 | Level 3 card headings, Level 4 form labels | Body text, sub-labels |
| 500 | Level 5 sub-labels, form field labels | Headlines, section headings |
| 400 | Level 6 body/helper text | Labels, headings |

---

## Spacing

### Between hierarchy levels on pages

| After this | Gap to next element |
|------------|-------------------|
| Level 1 (page headline) → subtitle | 6–8px |
| Subtitle → first section | 24–28px |
| Level 2 (section heading) → content | 16–20px |
| Level 4 (section label) → content | 12–14px |
| Level 5 (sub-label) → content | 8–10px |
| Between section groups | 32–36px |

### Dashboard spacing

| Between | Gap |
|---------|-----|
| Greeting → stat cards | 28–32px |
| Stat cards → first content section | 36–40px |
| Between content sections | 32–36px |
| Section heading → its cards | 14–16px |
| Between sibling cards | 12–14px |
| Content area horizontal padding | 32–40px each side |
| Content area max-width | ~960px (dashboard pages) |

---

## Buttons

### Primary CTA

- Border-radius: 10px
- Padding: 10px 20px
- Font-size: 14.5px
- Font-weight: 600
- Background: #00e5ff (or #a78bfa in DHH portal)
- Text: dark (#0a0a0f)

### Secondary / outlined

- Border-radius: 10px
- Border: 1px solid rgba(0,229,255,0.3)
- Padding: 8px 16px
- Font-size: 13.5px
- Background: transparent
- Text: #00e5ff (or #a78bfa in DHH portal)

### Tertiary / ghost

- Border-radius: 10px
- Border: 1px solid #1e2433
- Padding: 8px 16px
- Font-size: 13.5px

### Never

- border-radius: 100px (pill shape) — exception: role switcher dropdown only
- border-radius: 8px on buttons (standardize to 10px)

---

## Form fields

- Input background: #16161f (var(--surface))
- Input border: 1px solid #1e2433
- Input border-radius: 10px
- Input padding: 11px 14px
- Input height: ~47px
- Input font-size: 15px
- Label: weight 500, color #c8cdd8, size 13px, sentence case

---

## Invite banners

Standard pattern for all invite/CTA banners across the site:

- Background: rgba(0, 229, 255, 0.04)
- Border: 1px dashed rgba(0, 229, 255, 0.2)
- Border-radius: 12px
- Padding: 20px 24px
- CTA: solid cyan button (not inline links, not plain text)

Use this consistently for: /dhh/dashboard/interpreters, /directory, /interpreter/dashboard/team, /dhh/dashboard/circle.

---

## Multi-Select Patterns

**Pills** for ≤5 ungrouped short-label options. Quick-tap selections where labels are 1-3 words.
**Two-column checkboxes** for 6+ options, OR any set with category groupings regardless of count.

Examples:
- Pronouns (3 items, ungrouped) -> pills
- Phone type (3 items) -> pills
- Communication method (4 items) -> pills
- Sign languages (10+) -> two-column checkboxes
- Spoken languages (8+) -> two-column checkboxes
- Specializations (40+, grouped) -> two-column checkboxes with cyan category headers
- Specialized skills (7 items) -> two-column checkboxes

Checkbox styling: 16x16 custom box, 1.5px border, rgba(255,255,255,0.2) unchecked, rgba(0,229,255,0.15) bg + #00e5ff border checked, cyan check SVG inside. Text: Inter 14px, #c8cdd8. Grid gap: 6px 16px. Single column at 640px breakpoint.

Category headers (grouped sets): Inter 13px, fontWeight 600, #00e5ff, uppercase, letterSpacing 0.06em, borderBottom 1px solid rgba(0,229,255,0.1).

Pills styling: padding 8px 16px, borderRadius 8-10px. Selected: bg rgba(0,229,255,0.12), border 1px solid rgba(0,229,255,0.4), color #00e5ff. Unselected: bg transparent, border 1px solid rgba(255,255,255,0.12), color #96a0b8. Purple portal variant: swap #00e5ff for #a78bfa.

---

## Form Patterns

**FormCard**: bg #111118, borderRadius 16px, padding 32px (20px on mobile ≤640px). Wraps all form fields within a signup section.

**Labels**: Inter 13px, fontWeight 600, textTransform uppercase, letterSpacing 0.08em. Color: #00e5ff (interpreter/requester portals), #a78bfa (Deaf portal).

**Inputs**: bg #16161f, border 1px solid rgba(0,229,255,0.15), borderRadius 10px, padding 11px 14px, color #f0f2f8, fontSize 14px. Focus: borderColor rgba(0,229,255,0.5).

**Dropdowns**: Add .signup-select CSS class for custom chevron caret. appearance: none + SVG background-image chevron. Cyan chevron for interpreter/requester, purple for Deaf portal.

**Required field indicators**: Asterisk (*) after label text on all required fields. Validation errors: Inter 14px, color #f06b85, shown inline below the Continue button or at top of section.

**Amber info notes** (encouraging, not blocking): bg rgba(240,166,35,0.08), borderLeft 3px solid #f0a623, padding 10px 14px, borderRadius 0. Text: Inter 14px, color #f0a623.

---

## Landing Page Editorial Card

All portal landing pages use the same editorial card pattern:

- Card: bg #111118, borderRadius 16px, maxWidth 560px, border 1px solid rgba(accent,0.15), overflow hidden, padding 0 36px 36px
- Gradient accent bar: 3px height at top, full width via negative margin, linear-gradient(90deg, primary accent, secondary accent)
- Icon: 64x64, borderRadius 16px, centered, accent-tinted background
- Heading: Syne 700/24px, centered, key word in italic + accent color
- Subheading: Syne 600/18px, #f0f2f8, centered
- Divider: 1px rgba(255,255,255,0.06), directly below heading
- Body: Inter 400/15px, #96a0b8
- Tagline: Inter 500/16px, accent color, only "your" in italic via <em> tag. Parent element does NOT have fontStyle italic.
- Buttons: two side-by-side. Primary: accent bg, dark text. Secondary: transparent bg, accent border + text.

---

## Education Cards (Expandable Accordion)

Used in signup Step 1/2 across all portals for "How signpost works" content.

- Accordion behavior: only one card open at a time
- Card header: icon (16x16 accent SVG) + title (Inter 15px/600, #f0f2f8) + chevron (rotates on expand)
- Card body: Inter 15px, #96a0b8, lineHeight 1.7
- Cards inside a FormCard container
- Step-flow cards (sequential steps): use centered accent down-arrow SVGs between steps
- Closing/summary lines: brighter color #c8cdd8 to stand out from body
- "Got it" button at bottom: full width, accent bg

---

## Sidebar Navigation (Interpreter Signup)

8-section sidebar with section names, checkmarks on completed sections, left border indicator on current section.

- Section names are clickable for completed and current sections
- Future (unvisited) sections: disabled, muted color, cursor default
- Clicking scrolls to top: window.scrollTo({ top: 0, behavior: 'smooth' })
- Font: Syne 700/0.92rem for section names

---

## Single-Sided Borders

borderRadius: 0 on any element with a border on only one side (border-left accents, border-bottom dividers, pull-quote blocks, amber info notes). Rounded corners only apply when all sides have borders.

---

## General rules

- **"signpost" is always lowercase** in all UI text, copy, code comments, docs. Never "Signpost" or "SIGNPOST" (exception: env variable names).
- **No emoji in UI** — use simple SVG line icons or text only.
- **Em dashes used very sparingly** — prefer periods, commas, or colons.
- **WCAG 2.2 Level AA minimum everywhere** — our stated accessibility commitment.
- **Do not change route paths or variable names** — only user-facing display text.
- **Terminology:** always "Deaf/DB/HH" (not "Deaf/HH"); standalone "Deaf" fine as shorthand.
- **CODA** always displayed as "Deaf-Parented Interpreter / CODA".
- **"Booking"** = confirmed appointment; **"request"** = forwarded item — never "job".
