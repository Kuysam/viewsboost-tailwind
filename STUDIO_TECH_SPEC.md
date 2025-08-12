### ViewsBoost Studio — Technical Specification

This document defines the architecture, component boundaries, data models, contracts, and quality bars for the new Studio.

## 1) Architecture overview
- UI: React + Tailwind.
- Canvas: Fabric.js for 2D; WebGL acceleration when available; FFmpeg.wasm for export tasks in Web Workers.
- State: lightweight Context or Zustand for editor/session state; localStorage/IndexedDB for drafts and offline.
- Data: Firestore (templates, projects, comments, versions), Firebase Storage (media), CDN image proxy (thumbs/previews).
- Realtime: Firestore listeners for project/doc collaboration, template update notifications.

## 2) Component boundaries (planned)
- App Shell
  - `TopBar` (search, actions), `LeftRail` (modes), `RightPanel` (properties), `BottomTimeline` (motion).
- Studio Dashboard (current page)
  - `QuickStartGrid`, `CategoryRow` (horizontal virtualization + infinite fetch), `RecentList`.
- Template Browser
  - `TemplateGrid`, `TemplateCard`, `TemplatePreviewModal`, Filters (category/tags/aspect/source).
- Editor
  - `CanvasSurface` (Fabric instance lifecycle) — owns document state and selection.
  - `LayerPanel` (list, reorder, lock/hide), `PropertiesPanel` (contextual inspector), `AssetsPanel` (uploads, stock, brand).
  - `Timeline` (per‑layer tracks, keyframes, motion presets), `ExportPanel` (presets, queue, progress).
- Brand
  - `BrandKitManager` (colors, type scales, logos), `BrandStyles` (motion styles, safes, text styles).

Ownership rules
- Canvas owns the canonical doc; panels read/dispatch via actions. Panels must not mutate Fabric directly.
- Long‑running tasks (render, export, thumbnailing) run in a Worker; UI receives progress events.
- Rows and grids virtualize children; never render more than needed.

## 3) State management
- Editor state
  - Document model (size, bg, layers, timeline), selection, history, dirty flag, autosave ticker.
- Session state
  - User, brand kits, recent projects, feature flags, network status.
- Caching
  - Template lists (per category, paged), thumbnails, last search.

## 4) Data models (Firestore)

Template (collection: `templates`)
- id (doc id)
- title (string)
- category (string)
- tags (string[])
- previewURL (string)
- fileType ("image" | "video")
- width (number), height (number)
- baseDoc (object): width, height, bg, layers[], schemaVersion
- createdAt, updatedAt (timestamps)
- public (boolean)

Project (collection: `projects`)
- id (doc id)
- ownerId (string)
- title (string)
- doc (object): current document JSON
- versionId (string)
- collaborators (string[] user ids)
- createdAt, updatedAt (timestamps)
- status ("active" | "archived")

Version (subcollection: `projects/{id}/versions`)
- id (doc id)
- snapshot (object)
- createdAt (timestamp)
- message (string optional)

Comment (collection: `comments`)
- id (doc id)
- projectId (string)
- authorId (string)
- range/target (object: layerId, time, rect)
- text (string)
- createdAt (timestamp)

BrandKit (collection: `brandKits`)
- id (doc id)
- ownerId/teamId (string)
- colors (palette[]), typography (families, scales), logos (paths)
- motion (in/out styles, default timing), safes (platform overlays)

Asset (collection: `assets` or under `users/{uid}/assets`)
- id (doc id)
- ownerId (string)
- type ("image" | "video" | "audio" | "font")
- path (storage path), url (cdn)
- meta (width, height, duration, size, exif)
- createdAt (timestamp)

## 5) Storage layout (Firebase Storage)
- `users/{uid}/uploads/{yyyy}/{mm}/{filename}` — user uploads
- `users/{uid}/exports/{projectId}/{variant}/{file}` — renders/exports
- `templates/{id}/previews/{size}.jpg` — generated thumbnails
- `brand/{kitId}/logos/{file}` — brand assets

## 6) Contracts (hooks/services)
- Template loading
  - Input: category (string | null)
  - Output: `{ templates: Template[], loading: boolean }`
  - Behavior: Firestore‑only; category mapping/normalization applied; dedupe; optional pagination cursor.
- Template preview
  - Input: template
  - Output: open modal with rendered preview (cached); on select → open in editor.
- Editor open
  - Inputs: template or project id
  - Effects: hydrate Fabric doc, start autosave, bind keyboard/shortcuts, load brand styles.
- Export
  - Inputs: format, size preset, range (video), quality
  - Effects: run in worker; emit progress; upload to Storage on success; write export record (optional).

## 7) Routing
- `/studio` — dashboard
- `/templates/:category` — category browser
- `/video/:videoId` — existing media page (unchanged)
- Future
  - `/studio/edit/:projectId` — editor deep‑link
  - `/brand` — brand kit manager

## 8) Performance budgets
- Time‑to‑Studio ready: ≤ 1500 ms on mid hardware.
- Interaction latency (click → visual response): ≤ 100 ms.
- Template row hydration: ≤ 400 ms for first 12 cards.
- Canvas idle CPU: < 5%; memory growth bounded and reclaimed on unmount.

Techniques
- Code‑split heavy surfaces; prefetch when hovering links.
- Virtualize rows/grids; `IntersectionObserver` for thumb loading.
- Debounce inspector updates; batch Fabric mutations; requestIdleCallback for low‑prio work.

## 9) Error handling & recovery
- Autosave every 10s and on significant change; local draft if offline.
- Crash guard: persist unsaved changes; offer recovery on reload.
- Export retries with exponential backoff; resumable uploads.
- Clear user feedback with actionable messages; non‑blocking toasts.

## 10) Telemetry (privacy‑aware)
- Events: studio_open, template_open, export_start/success/fail, timeline_action, undo/redo.
- Metrics: time_to_edit, exports_per_session, template_reuse_rate, errors/session.

## 11) Testing strategy
- Unit: document operations, template normalization, category mapping.
- Integration: template loading + grid render, editor load from template, export worker happy path.
- UI: Playwright smoke (open /studio, scroll rows, open preview, navigate “Browse all”).
- Perf: Web Vitals + custom TTFM/TTFI probes.

## 12) Security
- Auth‑gated routes; Firestore rules on ownership and roles.
- Upload validations (mime/size), image sanitization, font loading sandboxing.
- Rate limiting for export/stock APIs.

## 13) Rollout plan
- Phase 1 (MVP): dashboard rows + editor core + exports + autosave.
- Phase 2: brand kits, richer timeline, stock integrations, procedural templates.
- Phase 3: collaboration (presence/comments), multi‑surface generator v1, scheduling.


