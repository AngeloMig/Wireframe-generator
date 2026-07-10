# Website Blueprint Builder — Handoff Notes

Frontend-only prototype of a client-facing website wireframe builder for a web agency.
**No backend**: everything persists to localStorage behind repository abstractions so
Supabase can be swapped in later without touching components. Do NOT add Supabase,
auth providers, billing, or external APIs yet.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 (`@theme` in
`src/app/globals.css`, no config file) · dnd-kit · Zustand · React Hook Form + Zod ·
lucide-react. Scripts: `npm run dev` / `npm run build` / `npm run lint` (eslint src).

## Status by phase
- **Phase 1 (foundation)** ✅ types, mock data, repositories, stores, UI kit, app shell.
- **Phase 2 (dashboard/projects)** ✅ dashboard, projects list, creation wizard,
  project shell + overview, questionnaire, sitemap builder (dnd-kit, 2-level nesting),
  page management, review/submit, assets, activity, templates browser, settings
  (reset demo data), admin stubs (template toggle table, users, orgs).
- **Phase 3 (wireframe editor)** ✅ COMPLETE — build + lint clean, routes smoke-tested.
- **Phase 3.5 (Prebuilt Wireframe Section Library)** ⬜ **NEXT — full spec in the
  "NEXT PHASE" section near the bottom of this file.**
- **Phase 4 (collaboration: comments, approvals, notifications-on-review)** ⬜ not started.
- **Phase 5 (admin polish, a11y sweep, refactors)** ⬜ not started.

## Phase 3 editor — architecture (files under `src/components/editor/` unless noted)
- `src/stores/editor-store.ts` ✅ UI state: page, selection, device (desktop 1200 /
  tablet 768 / mobile 390), wireframe|styled mode, zoom + fitZoom, inspector tab,
  preview flag, undo/redo (`past`/`future` snapshots of the page's `sections`;
  `applySections(projectId, updater, {editKey, activity})` coalesces keystrokes with
  the same `editKey` within 1.2s into one history step). Persistence flows through
  `useProjectsStore.updateProject` (debounced autosave already built).
- `src/lib/editor-utils.ts` ✅ content helpers (`str`, `itemsOf`, `imageOf` — image
  values can be null | url-string | {url, alt}), goal-based `recommendedTemplates`,
  `brandTheme(project)` for styled mode, `tint()`.
- `wireframes/primitives.tsx` ✅ `WireProvider` context {styled, theme, device},
  `SectionFrame` (background/spacing/border/contentWidth from section.style/layout),
  Heading/Para/Eyebrow (render real content, skeleton bars when empty), WireButton,
  ImagePh, Grid, HeadingBlock, effectiveColumns (tablet clamps to 2, mobile uses
  responsiveSettings.mobileColumns).
- `wireframes/section-wireframe.tsx` ✅ realistic renderer switching on all 36
  template ids (see `src/data/section-templates.ts`), with `VARIATION_LAYOUT` map so
  changing variation is visible; generic card-grid fallback for unknown ids.
- `library/section-thumbnail.tsx`, `library/library-item.tsx` (draggable, id
  `library:<templateId>`, data `{type:'library', templateId}`), 
  `library/section-library.tsx` ✅ search/category/page-type filters, Recommended +
  Recently used groups, Add button inserts directly.
- `canvas/canvas-section.tsx` ✅ useSortable per section (data `{type:'section'}`),
  selection outline, drag grip, hidden/locked chips, collapse bar, floating toolbar
  (move up/down = keyboard alternative, duplicate, hide, lock, collapse, delete),
  drop-indicator line via `dropEdge` prop.
- `canvas/editor-canvas.tsx` ✅ scaled device frame (transform scale(zoom), fixed
  device width), measures container → `setFitZoom`, `CANVAS_APPEND_ID` droppable
  (append zone + empty state), WireProvider wrapping.
- `inspector/content-tab.tsx` ✅ schema-driven fields from template.contentSchema
  (text/textarea/url/number/select/image/repeater; repeater items support
  add/remove/duplicate/reorder; image upload capped 800KB → data URL).

### Completed remainder of Phase 3
- `inspector/inspector-types.ts` — `SectionMutator` (mutate + optional editKey).
- `inspector/layout-tab.tsx` — variation select, alignment / imagePosition / columns /
  contentWidth / items-shown / mobileStacking segmented controls, visibility toggle.
  Exports `SegmentedControl`, reused by style-tab.
- `inspector/style-tab.tsx` — background type, nullable color pickers with Reset,
  border, spacing, cardRadius, buttonStyle. No custom CSS.
- `inspector/notes-tab.tsx` — customerNote, quick-note chips (QUICK_NOTE_OPTIONS),
  contentStatus, imageRequirement, agencyQuestion.
- `inspector/section-inspector.tsx` — tab container + empty state; notes-dot badge.
- `editor-toolbar.tsx` — back link, page Select (?page= param via router.replace),
  PageStatusBadge, SaveIndicator, undo/redo, device toggles, wireframe/styled toggle,
  zoom −/%/+/fit, Preview toggle (hides side panels), Submit → review page. Styled
  mode shows the required "not the final website design" notice (rendered in editor.tsx).
- `editor.tsx` — owns DndContext (pointer distance 6 + keyboard sensor,
  pointerWithin→closestCenter collision). Library drag inserts
  `createSectionFromTemplate` at the computed DropTarget (append zone = end) with
  "section-added" activity + auto-select; section drag = arrayMove. DragOverlay for
  both. Shortcuts: Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, Delete/Backspace removes selection
  (all skipped while typing). Height `calc(100vh - 3.5rem)`.
- `editor/page.tsx` — Suspense + useSearchParams; full editor on lg+, read-only
  mobile wireframe preview + "works best on desktop" notice below lg; empty state
  when the project has no pages.
- `project-shell.tsx` skips chrome for the editor segment; `app-shell.tsx` renders
  `/projects/*/editor` full-bleed (regex on pathname).

### Known gotcha
If routes suddenly 500 with `Cannot find module './NNN.js'`, a stale `next start`
process was serving while a rebuild ran. Kill whatever listens on port 3000
(`Get-NetTCPConnection -LocalPort 3000`), delete `.next`, rebuild.

## Conventions (follow these)
- All persistence via stores/repositories — components never touch localStorage.
  `updateProject(id, updater, {immediate?})` autosaves debounced (SaveIndicator shows it).
- Activity log via `withActivity(project, type, message, user)` from
  src/lib/project-utils.ts; user from `useSessionStore`.
- UI kit in `src/components/ui/` (Button variants primary/outline/ghost/danger,
  Dialog/ConfirmDialog, DropdownMenu, Input/Select/Textarea/Label, Badge, EmptyState,
  Skeleton, toast via `toast()` from src/stores/ui-store).
- Labels/status metadata in `src/config/labels.ts`; product name in `src/config/app.ts`.
- Icons lucide-react, indigo-600 primary, slate neutrals, `cn()` from src/utils/cn.
- IDs `createId()`, timestamps `nowIso()` from src/utils/id. Keep `npm run build`
  and `npm run lint` clean before finishing any stage.

## Verification flow
Login page → enter as Customer → dashboard → open "Aurora Living" demo project
(furniture ecommerce, has a seeded homepage) → editor: drag section in, reorder,
edit heading, change variation, add note, switch device + styled mode, refresh
(edits persist), submit for review from the Review tab.

---

# NEXT PHASE — Prebuilt Wireframe Section Library (Phase 3.5)

Goal: a professional library of prebuilt section **design variations** per category
that customers preview, drag onto the canvas, and customize — never designing from
scratch. Still NO Supabase / auth / billing.

## Architecture refactor (do this first)
Move from "template + cosmetic variations" to **sectionType + shared content schema
+ variation registry**:

```ts
type SectionType = "navigation" | "hero" | "faq" | "marquee" | "testimonials"
  | "services" | "cta" | "footer";

interface SectionVariation {
  id: string; sectionType: SectionType; name: string; description: string;
  previewImage?: string; tags: string[]; supportedPageTypes: PageType[];
  componentKey: string;
  defaultLayout: Record<string, unknown>; defaultStyle: Record<string, unknown>;
  responsiveSettings: Record<string, unknown>;
}
// PageSection gains sectionType + variationId (replaces templateId semantics).
```

- **One shared content schema per sectionType** (don't duplicate content structures
  across variations of the same type). Content is separate from design: switching
  variation preserves compatible content (FAQ heading/description/questions/answers/
  CTA; nav links; marquee items) — only layout/visual presentation changes.
- **Component registry**, not a giant switch in the editor:
  `sectionComponentRegistry[sectionType][componentKey] → React component`.
  Missing variation id → helpful error card, never a crash.
- Existing code to refactor: `src/data/section-templates.ts` (36 templates),
  `wireframes/section-wireframe.tsx` (current big switch — split into per-type
  variation components consumed via the registry), `PageSection.templateId` usage
  across editor/canvas/inspector/sitemap/demo data.
- **localStorage migration required**: bump `APP_CONFIG.storageSchemaVersion` and add
  a migration in `src/lib/storage/seed.ts` mapping old `templateId`/`variationId`
  records onto the new sectionType/variation ids (or reseed demo data if mapping is
  impractical — but don't silently corrupt existing saves).

## Library panel (rework `library/section-library.tsx`)
Categories first (Navigation, Hero, FAQ, Marquee & Ticker, Testimonials, Services,
Calls to Action, Footer) → selecting a category shows its variation cards:
wireframe thumbnail (code-generated, NO external image URLs), name, short
description, tags, Preview button, Add button, drag handle. Keep search, category
filter, page-type filter, recently used; ADD **favorites** (persist locally) and
recommended.

## Preview modal
Modal/drawer per variation: desktop/tablet/mobile preview + wireframe/styled toggle,
name, description, example content, "Add to Page" button. Reuse `WireProvider` +
device widths from `src/stores/editor-store.ts`. Accessible dialog (reuse ui/dialog).

## Required variations
**Navigation — 10, all fully functional wireframes:**
01 Standard left logo (links center/right, CTA, mobile hamburger) · 02 Centered logo
(links split both sides, optional announcement bar) · 03 Minimal (3–5 links, simple
CTA, spacious) · 04 Ecommerce (categories, search, account, cart, optional
announcement) · 05 Mega menu (large dropdown preview: columns + featured promo area —
wireframe representation is enough) · 06 Transparent overlay (overlaps hero,
light/dark modes, sticky-state preview) · 07 Sidebar nav (fixed left vertical,
portfolio/editorial) · 08 Utility bar (contact/language bar above main nav) ·
09 CTA-focused (minimal links, prominent CTA, optional login) · 10 Editorial
(oversized/centered logo, spacious, premium).
Shared nav content: logo, links[], ctaLabel, ctaUrl, announcementText, showSearch,
showAccount, showCart.

**FAQ — 10, all functional:** 01 Standard accordion · 02 Two-column accordion
(1 col mobile) · 03 Sidebar categories (left categories, right questions; becomes a
dropdown on mobile) · 04 Tabbed categories (tabs must switch) · 05 FAQ cards grid ·
06 Featured question + list · 07 Searchable (search input filters questions locally)
· 08 With contact/support CTA card · 09 Numbered editorial list · 10 Dark
high-contrast. Shared FAQ content: eyebrow, heading, description, categories[],
questions[] {question, answer, categoryId}, ctaHeading, ctaDescription, ctaButton,
searchPlaceholder. **Accordion interactions must work** (aria-expanded, keyboard).

**Marquee — 8:** 01 Logo marquee · 02 Text statement · 03 Category · 04 Review ·
05 Image cards · 06 Announcement ticker · 07 Dual-direction (two rows opposite ways)
· 08 Static-to-motion (static if items fit, animates on overflow).
Settings: animation on/off, direction, speed slow/medium/fast, pause on hover,
manual drag/scroll on mobile, item spacing, 1–2 rows, static fallback, fade edges,
show item labels. **Respect prefers-reduced-motion**: no auto-animation, fall back
to horizontally scrollable/wrapped static layout. Pause on hover AND keyboard focus.

**Foundation records + at least 3 fully polished wireframes each** (rest simpler but
NOT empty placeholders): Hero ×12 (centered, split image, full-bg image, with form,
product-focused, with statistics, with logo row, video, editorial text, with cards,
ecommerce promotion, minimal headline) · Testimonials ×8 · Services ×8 · CTA ×8 ·
Footer ×8.

## Inspector integration
Fields load per sectionType. FAQ: heading/description edits, add/edit/remove/
duplicate/reorder questions, create categories + assign questions, edit CTA.
Navigation: logo, add/remove/reorder links, CTA, toggles for announcement/search/
account/cart, transparent-vs-solid where supported. Marquee: add/remove/duplicate/
reorder items, change item type, speed, direction, pause-on-hover, fade edges,
animation toggle. (Current schema-driven `inspector/content-tab.tsx` covers most of
this — extend for category assignment + per-type settings panels.)

## Variation switching (rules)
1. Preserve section content. 2. Apply new variation's default layout. 3. Preserve
compatible custom style settings. 4. Keep the same PageSection id. 5. Push to undo
history. 6. Autosave. 7. Success toast. Confirmation dialog ONLY when switching
would drop incompatible content.

## DnD, thumbnails, responsive, a11y
- Drag variation directly onto page / between sections, Add button, reorder,
  duplicate, delete, undo — clear drop indicator (Phase 3 editor already does most;
  keep it working through the refactor).
- Thumbnails: lightweight React/CSS components (extend
  `library/section-thumbnail.tsx` pattern), representing columns/hierarchy/images/
  cards/accordions/buttons.
- Deliberate desktop/tablet/mobile behavior per variation (nav → mobile menu,
  FAQ columns stack, sidebar FAQ → dropdown, marquee → manual scroll, CTA/footer
  columns stack/wrap) — not just shrinking.
- A11y: keyboard Add buttons + reordering, accessible accordions (aria-expanded),
  focus-visible, marquee pause controls, reduced motion, semantic nav elements,
  accessible dialogs.

## Development order
1 refactor data architecture → 2 shared content schemas → 3 variation registry →
4 variation browser → 5 preview modal → 6 Navigation ×10 → 7 FAQ ×10 → 8 Marquee ×8
→ 9 remaining categories → 10 inspector integration → 11 variation switching →
12 dnd integration → 13 responsive → 14 accessibility → 15 test autosave + undo.

## Testing checklist
All 10 nav / 10 FAQ / 8 marquee variations addable · drag into empty page · insert
between two sections · reorder · FAQ content survives design switch · nav links
survive switch · marquee items survive switch · refresh preserves variations · undo
restores previous variation · mobile preview correct · reduced motion disables
marquee animation · zero TS errors · zero console errors.

## Final output expected
Run build + lint, fix everything; summarize every variation created; flag which are
fully polished vs simplified; list the registry files; explain how to add a new
variation; explain how content is preserved across design switches.

---

## Phase 4 pointers (after the section library)
Comment system types already exist (`ProjectComment`, replies, status) and demo data
contains comments. Build: comment panel (project/page/section targets), agency role
actions (request revisions, mark ready), approval flow, notifications on submit/
comment (notifications store exists). The review page already flips status to
`ready-for-review` and pushes a notification.
