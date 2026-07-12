# Website Blueprint Builder — Handbook

A page-by-page manual: what each screen is for, who sees it, and what every
feature does. Written so you can follow along in the app.

> **Prototype note:** there is no real login and no server. Everything you do
> is saved in your browser's local storage. "Logging in" just picks a role.

---

## Contents

- [Roles & who sees what](#roles--who-sees-what)
- [Login](#login)
- [Dashboard (agency)](#dashboard-agency)
- [Home (customer)](#home-customer)
- [Projects list](#projects-list)
- [New project wizard](#new-project-wizard)
- [Project shell & navigation](#project-shell--navigation)
- [Project → Overview](#project--overview)
- [Project → Editor](#project--editor) ← the big one
- [Project → Pages (Sitemap)](#project--pages-sitemap)
- [Project → Content (Assets)](#project--content-assets)
- [Project → Feedback (Activity)](#project--feedback-activity)
- [Project → Review](#project--review)
- [Project → Project brief (Questionnaire)](#project--project-brief-questionnaire)
- [Project → People & access (Members)](#project--people--access-members)
- [Project → Version history](#project--version-history)
- [Project → Revision requests](#project--revision-requests)
- [Project → Agency review](#project--agency-review)
- [Project → Export handoff](#project--export-handoff)
- [Templates](#templates)
- [Tasks / Activity / Settings / Admin](#tasks--activity--settings--admin)
- [The review workflow (how statuses move)](#the-review-workflow-how-statuses-move)
- [Design system](#design-system)
- [For developers](#for-developers)

---

## Roles & who sees what

You pick a role on the login screen. The app changes based on it.

| Role | Sees | Can do |
|---|---|---|
| **Customer** | A focused, editor-only workspace | Build/edit their own assigned project(s), comment, submit for review, approve |
| **Agency Designer** | Full agency workspace | Review blueprints, leave feedback, request revisions |
| **Agency Developer** | Full agency workspace | Add technical notes, mark sections technically reviewed |
| **Agency Project Manager** | Full agency workspace | Assign work, manage statuses, send for approval, export handoffs |
| **Administrator** | Everything + admin screens | Manage templates, users, organizations, settings |

Customers deliberately do **not** see the sidebar, dashboard, admin screens,
or project-management tabs — their entire app is the editor. Switch roles any
time from the profile menu (top-right avatar → "Switch role").

---

## Login

**Route:** `/login` · **Everyone**

The front door. A split screen: a deep drafting-panel on the left where a
miniature blueprint assembles itself and a "redline" review pin drops in
(purely decorative, sets the tone), and a role picker on the right.

**What to do:** click a role card to enter the app. There's no password —
this is a prototype. Logged-in users are sent straight to the dashboard (or,
for customers, into their project).

---

## Dashboard (agency)

**Route:** `/dashboard` · **Agency & admin roles**

Your command center across all projects. Includes:

- **Welcome + status summary** — a quick count of projects by status.
- **Role-specific queues** — Ready for review, Reviewing, Awaiting revisions,
  Awaiting approval, Recently approved. Each lists the projects sitting in
  that stage so you know what needs you.
- **Collaboration signals** — action items assigned to you, urgent/overdue
  items pulled from across every project.
- **Recent projects** — the projects you touched most recently.
- **Start a new project** — launches the [wizard](#new-project-wizard).

---

## Home (customer)

**Route:** `/dashboard` (customers land here) · **Customers only**

Customers get a "drafting table," not a dashboard. Behavior depends on how
many projects are shared with them:

- **One project** → sent straight into its editor.
- **Several** → a picker. Each project is a **drawing sheet**: a live
  miniature of its homepage wireframe over a title block (company, sheet
  count, status), plus signal chips ("1 task for you", "Continue revisions",
  "design suggestion", "open comments"). The last-opened project takes the
  featured full-width slot.
- **None** → a friendly empty state with a "Contact your agency" button.

"Continue where you left off" remembers your last project **and** page.

---

## Projects list

**Route:** `/projects` · **Agency & admin**

Every blueprint in one place, as **sheet-preview cards** (live homepage
wireframe + company/sheets/status title block).

- **Search** by name, company, or type.
- **Status filter** (All active, by status).
- **New Blueprint** → the [wizard](#new-project-wizard).
- **Per-card "⋯" menu** — Open project, View sitemap, Duplicate, Archive,
  Delete. (This menu was recently fixed so it no longer gets clipped by the
  card edge.)

---

## New project wizard

**Route:** `/projects/new` · **Agency & admin**

Six steps that shape a good starting point:

1. **Project info** — name, company, industry, description, goal, audience,
   estimated pages, platform.
2. **Goals** — what the site should achieve (pick one or more).
3. **Visual style** — style directions.
4. **Brand** — colors, fonts, corners (skippable).
5. **Inspiration** — reference sites (optional).
6. **Starting point** — recommended template, a specific template, or blank.

**"Create Blueprint"** builds the project (with a homepage) and drops you into
its Overview. New projects start in **Customer Editing** status.

**Resume vs. start fresh:** if you left a wizard half-finished, you'll see a
banner — *"You have an unfinished draft — Resume / Start fresh."* Clicking
"Start a new project" always opens a **clean** form; the old draft is never
silently reloaded. (This was a fix — previously a stale draft could block you
from starting a new project.)

---

## Project shell & navigation

**All `/projects/[id]/*` routes**

Every project screen shares a header (project name, company, status badge,
completion %) and a tab bar:

**Overview · Pages · Editor · Content · Feedback · Review**, plus a **More ▾**
menu with: Project brief, People & access, Version history, Revision requests,
Agency review, Export handoff. (The More menu is a proper dropdown that no
longer clips.)

Customers see a slimmed frame — just the project name, status, and a "Back to
the editor" button — since their world is the editor.

---

## Project → Overview

**Route:** `/projects/[id]/overview`

The project's home base — answers "what needs me and what do I open."

- **Command hero** — the single most useful next action (e.g. "Submit for
  agency review") with a progress bar.
- **Open action-item banner** — how many action items are open and how many
  are assigned to you, linking to Feedback.
- **Quick actions** — Continue Building, View Sitemap, Submit for Review,
  Project Settings.
- **Pages list** — every page with its status.
- **Feedback triage card** — a compact summary: Open threads · Action items
  (Tasks for you) · Urgent · Resolved, with "Open feedback →". (This replaced
  an endless inline comment wall — the full threads live in the Feedback tab.)
- **Status checklist** — what's done and what still needs attention.
- **Project information** — the brief at a glance.
- **Assets** — uploaded content.

---

## Project → Editor

**Route:** `/projects/[id]/editor` · **The main workspace**

A lightweight design tool laid out in three parts: **structure rail (left) ·
canvas (center) · inspector (right)**, with a toolbar on top. Modeled on a
theme editor.

### Toolbar

- **Back** — to the project (agency) or your projects (customer).
- **Page selector** — a popover listing every page with its status and how
  many sections still need content. Switch pages here.
- **Save status** — live autosave indicator ("Saving…", "Saved", "Save
  failed", "Offline changes").
- **Add section** — opens the section library flyout.
- **Undo / Redo** — full history (⌘Z / ⌘⇧Z).
- **Device preview** — Desktop / Tablet / Mobile widths.
- **Wireframe / Styled** toggle — grayscale skeleton vs. brand-colored
  preview. Styled mode shows a small note that it's a direction, not the
  final design.
- **Theme** (styled mode only) — a popover to tweak brand colors, heading
  font, and corner style; changes preview instantly and are saved per project.
- **Zoom** — buttons, plus **Ctrl/⌘ + scroll** to zoom on the canvas; opens
  fitted to the canvas.
- **Comment / Preview** — enter comment mode or a clean preview.
- **Customer toolbar** also has: **Submit for review**, **Ask the agency**,
  and the **profile menu**.

### Structure rail (left)

The page as a grouped outline — **Header / Template / Footer**.

- **Click a row** to select the section and scroll the canvas to it.
- **Drag Template rows** to reorder (keyboard: the move arrows on hover).
- **Hover a row** for quick move-up/down and hide/show.
- **Amber dot** = "needs your input" (open feedback, an assigned task, or a
  content flag on that section).
- **Scroll-sync** — the row for the section currently in view is highlighted
  as you scroll the canvas.
- **+ Add section** at the bottom of the Template group.

### Canvas (center)

The page rendered as real wireframe "sheets."

- **Click a section** to select it (blue outline).
- **Section toolbar** (on the selected section) — move up/down, duplicate,
  **change design**, hide, lock, collapse, delete.
- **Inline text editing** — click any heading, paragraph, eyebrow, or button
  label (including inside cards, testimonials, FAQ answers) and type. Enter
  commits, Escape reverts, changes autosave.
- **Click-to-fill** — empty text shows a ghost prompt ("Add a heading…") you
  can click and type into.
- **Right-click anywhere** → "Comment on this section" or "Comment on this
  page" — drops a comment pin right where you clicked.
- **Comment pins** — numbered markers show where feedback lives; color shows
  priority; a checkmark means resolved.

### Inspector (right)

Edits for the selected section, grouped into tabs:

- **Content** — the section's words and images. Empty text fields offer
  **copy suggestions drawn from the project brief** (one click to fill).
  Images can be uploaded or picked from the asset library.
- **Design** — a **thumbnail grid** of alternate designs for this section
  type; one click swaps the design and keeps your content.
- **Settings** — technical layout/style controls. **Hidden for customers.**
- **Notes** — customer note / agency question per section.

When nothing is selected, the inspector shows a gentle hint instead of an
empty panel.

### Add-section library

Opens as a flyout (not permanently docked). Browse by category, favorite
designs, preview, and add. New sections are inserted **below the currently
selected section** and scrolled into view.

### Customer specifics

- The technical **Settings** tab is hidden.
- **Approval-locked** sections can't be edited/reordered/deleted.
- **Editing pauses** when the project is submitted or in approval — the
  canvas becomes read-only with a banner ("…editing is paused until the
  agency responds"). You can still comment. (This lock was recently fixed so
  an access grant can't bypass it.)
- **First-run guided tour** — four coach marks pointing out the structure
  rail, click-to-edit, the inspector, and submit. Shows once.

### On mobile

A slim toolbar (page selector, save status, Comments, Submit, Ask the agency)
over a tap-to-edit preview, with a "Best edited on desktop" note for section
rearranging.

---

## Project → Pages (Sitemap)

**Route:** `/projects/[id]/sitemap`

Build and organize the site's pages — the page tree, nav placement, and page
settings. Add a homepage here first if a project has none.

---

## Project → Content (Assets)

**Route:** `/projects/[id]/assets`

The project's asset/content library — images and content that feed into
section image fields.

---

## Project → Feedback (Activity)

**Route:** `/projects/[id]/activity`

The full comment and activity stream, with filters (All / Open / Assigned to
me / Mentions / Action items / Resolved). This is where the Overview's
triage card links to. Reply, resolve, assign, set priority, mark action
items complete.

---

## Project → Review

**Route:** `/projects/[id]/review`

The submission and approval screen.

- **Customer:** a pre-submission checklist (missing content, unresolved
  items) and **Submit for review** / **Submit changes**. When the project is
  in approval, approve each **page**, then **Approve blueprint** (blocked
  until all pages are approved and urgent items are cleared).
- Shows the current feedback so you know what's outstanding before submitting.

---

## Project → Project brief (Questionnaire)

**Route:** `/projects/[id]/questionnaire`

The full intake form the recommendations are based on: project details,
website goals, visual style, brand preferences, and inspiration sites. Edit
any time; it also drives the editor's copy suggestions.

---

## Project → People & access (Members)

**Route:** `/projects/[id]/members`

Who's on the project and what they can do.

- **Member list** — names, roles, access levels (View / Comment / Edit).
- **Access requests** — when a customer asks for more access, agency PMs/admin
  see the pending request here with **Approve / Decline**. Approving raises
  the customer's access level. (The request dialog uses tappable
  checkbox-style options: "Add or edit a page" / "Edit page content" /
  "Build and arrange sections".)

---

## Project → Version history

**Route:** `/projects/[id]/versions`

Snapshots of the blueprint (created automatically on submission and at key
transitions). **Restore** rolls the project back to a snapshot.

---

## Project → Revision requests

**Route:** `/projects/[id]/revisions` · **Customer & admin**

The list of changes the agency has asked for, so customers can work through
them and resubmit.

---

## Project → Agency review

**Route:** `/projects/[id]/agency-review` · **Agency roles**

The agency's review cockpit for a submitted blueprint.

- **Start review** → moves the project to *Agency Reviewing*.
- **Request changes** → a dialog (summary + message + which pages need work)
  that sends it back to the customer as *Revisions Requested*.
- **Send for approval** → moves it to *Awaiting Approval* and flips pages to
  *Ready for Approval*.
- **Set status** per page/section, and per-section review actions.

---

## Project → Export handoff

**Route:** `/projects/[id]/handoff` · **Agency roles**

Turns the approved blueprint into something a developer can build from.

- **Audience toggle** — *Internal* (includes agency-only notes, labelled) vs.
  *Customer-facing* (strips internal notes/assignments).
- **Download brief (Markdown)** — a readable developer document: project meta,
  design system (brand colors, type, direction), and a page-by-page section
  breakdown with content and open items.
- **Download JSON** — the full structured export (project, design system,
  sitemap, pages+sections with slugs/nav/status, comments, approvals,
  activity).
- **Print-friendly view** and **Copy content summary** (plain-text outline).

---

## Templates

**Route:** `/templates` · **Everyone**

A read-only browser of the built-ins:

- **Section designs** — every section variation, filterable by category,
  searchable, favoritable, previewable.
- **Page templates** — complete page structures. Preview the full page before
  using one.

---

## Tasks / Activity / Settings / Admin

- **Tasks** (`/tasks`) — your action items across projects.
- **Activity** (`/activity`) — cross-project activity feed.
- **Settings** (`/settings`) — app/system settings (admin).
- **Admin** (`/admin/templates`, `/admin/users`, `/admin/organizations`) —
  manage section templates, users, and organizations.

---

## The review workflow (how statuses move)

The heart of the product — the agency ↔ customer loop. Statuses move like
this (each transition is enforced and saved):

```
Customer editing
      │  customer: Submit for review
      ▼
Ready for review
      │  agency: Start review
      ▼
Agency reviewing ──── agency: Request changes ──► Revisions requested
      │                                                   │
      │  agency: Send for approval          customer edits + resubmits
      ▼                                                   │
Awaiting approval  ◄──────────────────────────────────────┘
      │  customer: Approve each page, then Approve blueprint
      ▼
Approved  →  In development  →  Completed
```

**Editing is locked** whenever the project is in an agency-controlled phase
(Ready for review, Agency reviewing, Awaiting approval). Requesting revisions
reopens editing for the customer.

---

## Design system

Applied everywhere via tokens in `src/app/globals.css`:

- **Color** — a cool blue-gray neutral scale (pale blue-gray canvas, white
  cards, hairline borders), with a deep **green** as the single identity
  accent (login panel, brand mark, project hero) and Polaris-style status
  colors (blue = editing, amber = needs review, rose = revisions, green =
  approved).
- **Type** — **Archivo** for page titles (display), **Spline Sans Mono** for
  small uppercase labels/eyebrows, **Inter** for body.
- **Motion** — quiet, fast fades (respects reduced-motion). The login
  blueprint assembly is the one signature moment.

Because it's all tokens, restyling happens by editing `globals.css`, not by
sweeping components.

---

## For developers

- **Run:** `npm run dev` → http://localhost:3000
- **Checks:** `npm run lint` · `npx tsc --noEmit` · `npm test` (vitest)
- **Tests** cover the core rules that must not regress: the editor edit-gate
  (a submitted project stays locked even with an access grant), the
  permission matrix, and the review transition table.
- **Data** lives in `localStorage` (prefix `wbb:`). Reset from the profile
  menu → "Reset demo data".
- **Structure:** pages in `src/app/(app)/…`, editor in
  `src/components/editor/…`, workflow logic in `src/lib/collab-service.ts` and
  `src/lib/review-transitions.ts`, permissions in `src/lib/permissions.ts`,
  state in `src/stores/…`.

_No real authentication, no backend, no external services — everything is
local and reversible._
