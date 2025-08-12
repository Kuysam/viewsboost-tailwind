### ViewsBoost Studio — Product Brief

#### Vision
- **Creator‑first** Studio that turns one idea into consistent outputs across shorts, thumbnails, posts, docs, and videos — instantly and delightfully.

#### Core principles
- **Speed-as-a-feature**: sub‑100ms UI actions; prefetch and lazy‑load heavy work.
- **Low cognitive load**: contextual tools, keyboard‑first, strong defaults.
- **Composable**: every element is a reusable block (text, shape, media, motion).
- **Local‑first, cloud‑backed**: never lose work; sync when online.
- **AI‑assist, human‑led**: AI proposes; creators decide.

#### Primary personas
- Solo creators, editors, and small teams producing frequent social/video content.

#### Information architecture
- **Studio Dashboard** (aka “Studio Dashboard” UI): quick start, recent, categories, brand kits, continue editing.
- **Editor**: canvas + timeline, layers, properties, assets, templates.
- **Assets**: uploads, stock, brand assets, project media.
- **Templates**: category browser with filters, infinite horizontal rows, preview modal.
- **Projects**: autosaved docs with versions, collections, sharing.
- **Live**: real‑time collaboration and review.

#### Unparalleled differentiators
- **Multi‑surface generator**: one design → mapped to multiple aspect ratios with smart layout.
- **Brand Brain**: learns colors, type, motion; enforces consistency automatically.
- **Procedural templates**: parameterized templates producing infinite on‑brand variants.
- **Motion‑first editor**: timeline‑native with “motion styles” (entrance, kinetic text, beatsync).
- **Adaptive canvas**: responsive constraints; swap aspect ratios without breaking hierarchy.
- **Context AI**: rewrite text, summarize, generate alt/captions/thumbnails from current canvas.
- **Batch ops**: generate/re‑render many variants in a single run with queueing and progress.
- **Live feedback**: readability, contrast, safe areas, platform compliance.
- **Programmable actions**: reusable “recipes” for brand prep, export packs, scheduling.

#### MVP scope (Phase 1)
- Dashboard with Quick Start and Firestore‑backed category rows.
- Editor core: layers, text, shapes, images, alignment, color, brand palettes, keyboard shortcuts.
- Timeline‑lite: basic animations (fade/slide/scale), easing, per‑layer timing.
- Template marketplace: browse, preview, open; infinite horizontal rows; “Browse all” routes.
- Media: uploads + stock integrations, drag‑to‑canvas.
- Export: PNG/JPG/MP4/WebM, preset sizes, transparent backgrounds.
- Autosave + versioning, undo/redo, shareable view/comment links.

#### Technical blueprint
- Frontend: React + Tailwind, Context/Zustand for editor state, Fabric.js for 2D; WebGL when available; FFmpeg.wasm for exports; Web Workers for heavy work.
- Data: Firestore for templates/projects, Firebase Storage for media; localStorage/IndexedDB drafts.
- Templates: normalized JSON schema (constraints, styles, motion metadata); migration utilities.
- Performance: virtualized lists, debounced state, render budgeting, eager preview generation.

#### UX patterns
- Sticky header; left rail modes; right Properties; bottom Timeline.
- Vertical dashboard scroll; horizontal row scroll with snap and infinite load.
- Context toolbars; quick actions on selection.
- Accessibility: WCAG color checks, keyboard reachability, reduced‑motion mode.

#### Security & reliability
- Quotas, rate limiting, resumable uploads, background sync, crash recovery.
- Role‑based access; share links with scopes.

#### Metrics
- Time‑to‑first‑edit (<3s), project completion rate, exports/session, template reuse rate, collaboration sessions, error rate, churn.

#### Roadmap (fast path)
- Week 1: Template schema, Firestore wiring, Dashboard rows, Editor core, autosave.
- Week 2: Timeline‑lite, export pipeline, brand kits, stock integrations, template previews.
- Week 3: AI assist (text rewriter, palette suggestions), procedural params, batch exports.
- Week 4: Collaboration, comments/presence; multi‑surface generator v1.


