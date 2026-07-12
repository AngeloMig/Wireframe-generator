# What was added — changelog

A running log of what changed and why, newest first. Each entry maps to a
commit so you can trace exactly what was added where. See
[HANDBOOK.md](./HANDBOOK.md) for how each feature works.

---

## Fixes & polish

**`c9c88f7` — Fixed a build error in the Templates page**
The "Page templates" tab had a broken JSX structure (unclosed fragment) that
stopped the whole app from building. Fixed so `npm run build` passes again.

**`0ff8b92` — Project card menu no longer clipped**
The "⋯" actions menu on project cards (Open / Duplicate / Archive / Delete)
was getting cut off by the card edge. The card's clipping now applies only to
the preview image, so the menu shows fully.

---

## Handoff export

**`ce0da9f` — Downloadable Markdown developer brief**
The handoff page can now export a readable Markdown document (project details,
design system with brand colors/type, page-by-page section breakdown) in
addition to the existing JSON export, print view, and copy-summary.
→ *Project → Export handoff*

---

## Quality: tests & workflow integrity

**`435b291` — Automated regression tests (vitest)**
Added `npm test` with unit tests that lock the rules most likely to break:
the editor edit-gate, the permission matrix, and the review transition table.
Catches regressions automatically instead of relying on manual testing.

**`1c73a48` — Fixed: submitting for review didn't lock editing**
A customer could keep editing a project after submitting it, because an
access grant was bypassing the review lock. Now editing requires both an
editable status **and** edit rights — access grants can't override the lock.
→ *Project → Editor (edit lock)*

**`4015e81` — Fixed: "Start a new project" reloaded a stale draft**
Starting a new project silently restored a leftover wizard draft, which could
leave you stuck. Now the form always opens fresh; an unfinished draft is
offered as an explicit "Resume / Start fresh" choice.
→ *New project wizard*

---

## Overview & design consistency

**`8b22162` — Overview feedback triage**
The project Overview showed the entire comment thread inline (an endless
wall). Replaced with a compact triage card (open threads / action items /
urgent / resolved) that links to the Feedback tab.
→ *Project → Overview*

**`07e46bf` — Unified design tokens**
The neutral colors were half warm-paper and half blue-gray. Cooled the whole
palette to one consistent blue-gray system with green as the single identity
accent.
→ *Design system*

**`d7e94fe` — Drafting-studio visual identity**
A cohesive look across all pages: display + mono typography, warm/blue-gray
surfaces, a green identity accent, and the animated login "blueprint"
signature.
→ *Login, all pages*

---

## Customer workspace

**`8fe29b2` — Customer home: live sheet-preview cards**
The customer project picker renders each project as a drawing sheet — a live
miniature of its homepage wireframe over a title block — instead of a plain
text row.
→ *Home (customer)*

**`e595a1e` — Access-request checkbox + agency sheet cards**
Access-request options became tappable checkbox-style choices (instead of a
native dropdown), and agency project cards got the same live-preview
treatment.
→ *People & access; Projects list*

**`356047a` — Customer editor-only workspace + Shopify/Polaris revamp**
Customers now get a focused, editor-only app (login → straight to their
project; no sidebar/admin/management screens; minimal header with submit/ask
/preview). Plus the theme-editor three-panel editor layout and the Polaris
design foundation.
→ *Roles; Project → Editor*

---

## Editor capabilities

**`49ff0f1` — Right-click anywhere to comment**
Right-clicking the canvas opens a menu to comment on the section or the page,
dropping a pin exactly where you clicked.
→ *Project → Editor (canvas)*

**`829f9de` — Ten editor upgrades**
Item-level inline editing (cards, quotes, FAQ answers), click-to-fill empty
text, "needs your input" dots in the structure rail, on-canvas design swap,
Ctrl/⌘+wheel zoom, the page-selector popover, the styled-mode theme panel, the
first-run customer tour, and copy suggestions from the project brief.
→ *Project → Editor*

**`9862f20` — Editor foundations**
Inline text editing, structure-rail drag-reorder, mobile editing toolbar, and
the design-swap thumbnail grid.
→ *Project → Editor*

---

## Not yet built (paused mid-request)

A set of 10 additional editor features was scoped but **not** implemented yet.
When resumed, they are, in priority order: (1) command palette (⌘K),
(2) keyboard shortcuts + cheat sheet, (3) copy/paste sections across pages,
(4) blueprint readiness/content linter, (5) suggested next section,
(6) reusable saved blocks, (7) multi-select + bulk actions, (8) visual
per-device controls, (9) inline comment resolve/reply on pins, (10) focus mode
+ section minimap.
