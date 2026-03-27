cd /home/mollysano/signpost && git pull && cat CLAUDE.md

# Add DESIGN_SYSTEM.md to repo and update CLAUDE.md

## TASK 1: Add DESIGN_SYSTEM.md

The file DESIGN_SYSTEM.md should already exist at the repo root (uploaded by 
the user). Verify it's there:

```bash
ls -la DESIGN_SYSTEM.md
head -5 DESIGN_SYSTEM.md
```

If it does NOT exist, print: "DESIGN_SYSTEM.md not found at repo root. 
Please upload it to the repo via GitHub before running this prompt."
Then stop.

## TASK 2: Update CLAUDE.md

Add a new section to CLAUDE.md that references the design system. Find a 
good insertion point (near the top, after any existing overview/context 
sections) and add:

```
## Design System

All UI work MUST follow the design system spec in DESIGN_SYSTEM.md.
Before creating or modifying any UI element:
1. Read DESIGN_SYSTEM.md
2. Identify which hierarchy level (L1-L6) the element belongs to
3. Use the correct font, weight, size, and color from the spec
4. Do not introduce new visual patterns without explicit approval

The design system covers: WCAG AAA color palette, 6-level typography 
hierarchy, spacing rules, button styles, form field styles, and portal-
specific accent colors.
```

Also add to the safety rules section (if one exists) or create one:

```
## Pre-flight: Design System Compliance

Every prompt that modifies UI must include this verification step:
- Confirm all new/modified elements follow DESIGN_SYSTEM.md
- No font-weight 800 except Level 1 page headlines
- No text colors outside the approved palette
- No font sizes below 12px
- Card backgrounds: #111118 only
- Button border-radius: 10px (not 8px, not 100px)
```

## Build
```bash
npm run build
```

## Push
```bash
git add -A
git commit -m "docs: add DESIGN_SYSTEM.md, update CLAUDE.md to enforce design system compliance"
git push origin csano/signpost-hack
```
