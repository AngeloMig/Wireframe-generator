# Website Blueprint Builder — Handoff Notes

Frontend-only prototype of a client-facing website wireframe builder for a web agency.
**No backend**: everything persists to localStorage behind repository abstractions so
Supabase can be swapped in later without touching components. Do NOT add Supabase,
auth providers, billing, or external APIs yet.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 (`@theme` in
`src/app/globals.css`, no config file) · dnd-kit · Zustand · React Hook Form + Zod ·
lucide-react. Scripts: `npm run dev` (port 3002, `.next-dev`) /
`npm run build` (`.next`) / `npm run lint` (eslint src).

## Status by phase
- **Phase 1 (foundation)** ✅ types, mock data, repositories, stores, UI kit, app shell.
- **Phase 2 (dashboard/projects)** ✅ dashboard, projects list, creation wizard,
  project shell + overview, questionnaire, sitemap builder (dnd-kit, 2-level nesting),
  page management, review/submit, assets, activity, templates browser, settings
  (reset demo data), admin stubs (template toggle table, users, orgs).
- **Phase 3 (wireframe editor)** ✅ COMPLETE — build + lint clean, routes smoke-tested.
- **Phase 3.5 (Prebuilt Wireframe Section Library)** ✅ COMPLETE — 86 variations across
  10 section types (`src/data/section-variations.ts`), shared content schemas per type
  (`src/data/section-schemas.ts`), component registry
  (`editor/wireframes/registry.ts` + `sections/*.tsx`), library rework with favorites,
  preview modal, FAQ inspector panel, storage schema v2 migration.
- **Phase 4 (collaboration, review, versions, approvals)** ✅ COMPLETE — see the
  "PHASE 4" section below. Build + lint clean, primary workflow browser-tested
  end-to-end (submit → agency review → revisions → resubmit → approvals → export).
- **Phase 4.5 (guided client workspace + access control)** ✅ IN PROGRESS —
  customer-focused editor, fullscreen Figma-style comment mode, right-click canvas
  comment pins, project overview command center, customer access requests, agency
  approval controls, and controlled editor access levels.
- **Phase 5 (Supabase backend)** ⬜ NOT STARTED — do not begin until the Phase 4
  work has been reviewed and approved by the user.

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
Login page → enter as Customer → dashboard → open the "Nordhaus" demo project
(furniture ecommerce, has a seeded homepage) → editor: drag section in, reorder,
edit heading, change variation, add note, switch device + styled mode, refresh
(edits persist), submit for review from the Review tab.

---

# PHASE 4 — Collaboration, Review, Versions, Approvals (COMPLETE)

Frontend-only; all persistence via repository interfaces over localStorage so
Supabase can swap in later. Roles expanded to customer / agency-designer /
agency-developer / agency-pm / admin (`UserRole` in src/types/common.ts,
legacy "agency" migrates to agency-designer).

## Data layer
- `src/types/collaboration.ts` — ProjectMember, ProjectComment (scope,
  visibility, priority, mentions, replies, attachments, action-item fields,
  deletedSection context), PageReviewStatus/SectionReviewStatus,
  SectionVariationSuggestion, ApprovalRecord, ProjectVersion (+snapshot),
  RevisionRequest.
- Repository interfaces in `src/lib/repositories/types.ts`; Local*
  implementations: comment / member / version / approval / suggestion /
  revision repositories (+ per-user notification repo). Supabase-ready:
  SupabaseCommentRepository, SupabaseProjectMemberRepository,
  SupabaseVersionRepository, SupabaseApprovalRepository,
  SupabaseSuggestionRepository, SupabaseRevisionRequestRepository,
  SupabaseNotificationRepository (activity stays embedded in Project and
  flows through ProjectRepository).
- Zustand stores per collection (`src/stores/*-store.ts`, keyed by projectId)
  + `collab-ui-store` for transient UI (panel, comment mode, filters, compare
  picks). IMPORTANT: selectors return a stable EMPTY constant, and after
  `await store.load()` you must RE-READ `getState()` (see comments in
  src/lib/collab-service.ts — pre-load snapshots are stale).
- `src/lib/collab-service.ts` — ALL multi-step workflows (submit/review/
  revisions/approve/unlock/restore/suggestions + notification fan-out).
- `src/lib/permissions.ts` — reusable role checks (not UI-only).
- `src/lib/review-transitions.ts` — central status transition tables
  (project/page/section) with allowedRoles/requiresMessage/createsVersion;
  admins may perform any listed transition; invalid moves get explanations.
- Storage schema v3 (`migrateV2toV3` in src/lib/storage/seed.ts): embedded
  project.comments → standalone collection, "in-progress" page status →
  "content-needed", sections gain reviewStatus, notifications become
  per-user (actionUrl), roles normalized. Browser-tested with a simulated
  v2 payload — nothing destroyed.

## UI
- Collaboration panel (`components/collab/collaboration-panel.tsx`) on
  overview, editor comment mode, agency review: quick filters (all/open/
  assigned/mentions/action items/resolved/internal), detail filters, 5 sorts.
- Composer with @mention dropdown (ids stored separately), visibility
  selector (agency only), priority, assignee, action item + due date,
  object-URL attachments. Comment cards: reply/edit/delete(confirm)/resolve/
  reopen/assign/priority/copy link/jump to section/mark complete; internal
  notes amber-tinted; deleted-section comments keep a snapshot + Restore.
- Editor Comment Mode: toolbar toggle, numbered markers (color by state/
  priority, reply counts), click-to-target composer, editing paused; section
  delete preserves comments via deletedSection.
- Review submission (`submission-dialog.tsx`): included/excluded pages,
  blocking (no homepage / empty homepage / missing details) vs warnings;
  creates version, locks editing (status-driven via canEditProjectContent).
- Agency Review Mode (`/agency-review`): per-section wireframes + transition
  buttons, feedback/internal notes, suggest-design dialog, request-revisions
  dialog (pages, sections, action items, priority, due date), send for
  approval (PM), explicit Edit Wireframe.
- Customer Revision Mode (`/revisions`): request summary, progress, required
  pages/sections jump links, action items, pre-submit warnings.
- Approvals on `/review`: page approve (locks page + sections) → blueprint
  approve (acknowledgement checkbox, stores approvedVersionId); PM/admin
  Unlock with required reason (revokes approval, creates version, notifies).
- Versions (`/versions`): list with triggers/approval badges, view, rename
  manual, restore (backup version created first), compare — customer-friendly
  diff (`src/lib/version-compare.ts`).
- `/members`: add mock member, role/access changes, primary contact (PM/admin).
- `/handoff`: internal vs customer-facing JSON export + print view + copy
  summary; customer exports exclude agency-only comments and internal notes.
- Dashboards: customer signal tiles + priority actions; agency work queues +
  urgent/overdue; notification panel with unread filter + clear; global
  search covers comments/action items/versions/approvals/members/activity.

## Verification flow (browser-tested end to end)
Reset demo data → customer: comment w/ mention in editor comment mode, accept
product-grid suggestion (content preserved), submit for review (v3 snapshot,
agency notified) → designer: start review, request revisions (v4, action
items assigned) → customer: revision mode, complete action item, submit (v5)
→ PM: start review, send for approval, compare v1→v5 → customer: approve
homepage (v6, locked) + blueprint (v7, approvedVersionId) → PM: handoff
export, internal/customer privacy verified. Zero console errors.

## Known gotchas (Phase 4 additions)
- A stray `~/package-lock.json` once made Next infer the HOME dir as the
  workspace root → builds appeared to hang for 10+ min. Fixed permanently via
  `outputFileTracingRoot` in next.config.ts.
- Zustand: never return fresh `[]` from a selector (infinite getSnapshot
  loop) and never read a pre-`await` getState() snapshot after a load.
- Keep the dev server and production build caches separate. `npm run dev` uses
  `.next-dev`; `npm run build` uses `.next`. If a live preview reports missing
  generated files after a build, stop duplicate Next processes, remove only
  `.next-dev`, and restart `npm run dev -p 3002`.

## Phase 4.5 — Current product direction

The customer/client experience is editor-first. After login, customers should be
guided to their assigned project and spend most of their time in the wireframe
editor. The customer should not feel like they are operating an agency admin tool.

### Customer editor

- The editor is the primary customer workspace; the project overview is a command
  center for status, progress, next action, pages, feedback, and submission readiness.
- Customers can edit approved content fields, add comments, preview responsive modes,
  and submit changes according to their access level.
- Comment mode is a temporary fullscreen workspace. Comment placement is right-click
  only: choose **Comment here** anywhere on the canvas. The thread opens in a floating
  popover beside the location, not in a permanent sidebar.
- The editor selects a section on pointer-down so clicking canvas content immediately
  opens the contextual inspector. The structure rail is optional for selection.
- Customer-facing language should remain simple: Add section, Change design, Ask the
  agency, Request access, Submit for review.

### Controlled access model

Project members retain the existing `view`, `comment`, and `edit` access levels.
Access requests are persisted in `STORAGE_KEYS.accessRequests` and represented by
`AccessRequest` in `src/types/collaboration.ts`.

Customers can request:

- Page access — request to add or edit a page.
- Content editing — request to edit page content.
- Builder access — request to build and arrange sections.

Requests are created from the editor toolbar and reviewed by agency users from
**Project → More → People & access**. Agency users can approve or decline requests;
approval updates the member's controlled editor access level. The request record
keeps requester, reason, page, status, decision, and response for future audit history.

### Current visual system

- Warm neutral application background with white elevated surfaces.
- Deep evergreen primary accent with amber action accent.
- Canvas-first editor with structure rail, contextual inspector, responsive preview,
  and stronger page elevation.
- Project overview uses a dark command-center hero with recommended next action,
  progress, status, checklist attention, and calmer quick actions.
- `src/app/globals.css` owns the centralized design tokens; avoid scattering new
  application colors across components.

### Remaining access-control work

- Make access grants page-specific instead of project-wide.
- Add access expiry and explicit section locks.
- Add an agency request queue/dashboard view with notifications.
- Add customer-visible access status and request history.
- Enforce controlled access on page creation, section reorder, and global design
  settings (not only the editor's general edit gate).

## Phase 5 pointers (Supabase — DO NOT START until Phase 4.5 is approved)
Swap Local* repositories for Supabase* implementations behind the same
interfaces; enforce `src/lib/permissions.ts` + `review-transitions.ts` rules
in RLS/server functions; all ids are UUID-compatible; organization/project
ids on every record. Non-critical leftovers: comment attachments are
object-URLs (lost on reload by design), editor comment markers are
desktop-first, notification panel has no pagination, action-item due-soon
notifications are not scheduled (no cron in the prototype).
