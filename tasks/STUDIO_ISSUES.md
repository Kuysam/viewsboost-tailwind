### ViewsBoost Studio — Implementation Tickets (MVP → Phase 2)

Legend: [P]riority (P0 critical, P1 high, P2 normal), [E]stimate (S=0.5d, M=1–2d, L=3–5d)

#### Phase 1 — MVP (shipping baseline Studio)

- [ ] P0 — Editor shell + CanvasSurface
  - Scope: Create `CanvasSurface` with Fabric init/unmount, selection, zoom/pan; bind resize.
  - Acceptance: Open from template, render layers, select/move/scale; no memory leaks on unmount.
  - Files: `src/pages/Studio.tsx`, `src/components/editor/CanvasSurface.tsx` (new)
  - E: L

- [ ] P0 — Document model + autosave
  - Scope: Central doc store (size, bg, layers, history), 10s autosave to Firestore, local draft fallback.
  - Acceptance: Offline edits persist; on reconnect, sync draft → project; undo/redo works.
  - Files: `src/state/editorStore.ts` (new), `src/lib/projects.ts` (new)
  - E: L

- [ ] P0 — Export worker (PNG/JPG/MP4/WebM)
  - Scope: Worker with FFmpeg.wasm for video; image export via canvas; Storage upload; progress events.
  - Acceptance: Export presets succeed; UI shows progress and final download/URL.
  - Files: `src/workers/exportWorker.ts` (new), `src/services/exportService.ts` (new)
  - E: L

- [ ] P1 — PropertiesPanel (context inspector)
  - Scope: Typography, color, alignment, opacity, layer rename/lock/hide.
  - Acceptance: Edits reflect instantly; keyboard nudge; numeric inputs with drag-to-change.
  - Files: `src/components/editor/PropertiesPanel.tsx` (new)
  - E: M

- [ ] P1 — LayerPanel
  - Scope: List, reorder (drag), visibility/lock, delete, group/ungroup.
  - Acceptance: Drag reorder updates canvas z-index deterministically; group selection works.
  - Files: `src/components/editor/LayerPanel.tsx` (new)
  - E: M

- [ ] P1 — Timeline‑lite
  - Scope: Per-layer in/out with basic motions (fade/slide/scale), easing, duration.
  - Acceptance: Play/seek; export preserves timing.
  - Files: `src/components/timeline/*` (new), integrate with export.
  - E: L

- [ ] P1 — Template Preview Modal
  - Scope: Open from rows; show large preview; Open in editor.
  - Acceptance: Works from `/studio` and `/templates/:category`.
  - Files: `src/components/TemplatePreviewModal.tsx` (reuse/align)
  - E: S

- [ ] P1 — Recent projects section
  - Scope: Track last-opened projects; show 4 latest.
  - Acceptance: Appears on `/studio`; opens to editor.
  - Files: `src/services/recentService.ts` (new)
  - E: S

- [ ] P2 — Brand kit (colors, type)
  - Scope: Save palettes, font scales; quick apply; default styles.
  - Acceptance: New elements pick brand defaults; palette accessible everywhere.
  - Files: `src/pages/Brand.tsx` (new), `src/services/brandService.ts` (new)
  - E: M

#### Phase 2 — Differentiators

- [ ] P0 — Multi‑surface generator v1
  - Scope: Constraints system to remap one doc to multiple aspect ratios; anchors for key elements.
  - Acceptance: Generate Shorts, Thumbnail, Square post from one base design with minimal manual fixes.
  - Files: `src/services/layoutMapping.ts` (new)
  - E: L

- [ ] P1 — Procedural templates
  - Scope: Parameters (palette, density, motion seed) → deterministic variant generation.
  - Acceptance: “Shuffle” produces on‑brand alternatives; parameters are savable.
  - Files: `src/services/proceduralTemplates.ts` (new)
  - E: M

- [ ] P1 — AI assist (text + palette)
  - Scope: Rewrite titles/descriptions; palette suggestions from image; safe prompt handling.
  - Acceptance: One‑click improvements; user can accept/undo.
  - Files: `src/services/aiAssist.ts` (new)
  - E: M

#### Infra & quality

- [ ] P0 — Firestore rules pass
  - Scope: Projects CRUD, assets per‑user, templates read; RBAC for admin tools.
  - Acceptance: Security tests green.
  - Files: `firestore.rules`
  - E: S

- [ ] P0 — Performance budgets
  - Scope: Web Vitals probes; memory/CPU guardrails; virtualized rows/grids.
  - Acceptance: TTI ≤ 1.5s, interaction ≤ 100ms; no memory leaks during editor session.
  - Files: `src/lib/monitoring.ts`
  - E: M

- [ ] P1 — E2E smoke (Playwright)
  - Scope: open `/studio`, scroll rows, open preview, open editor, export PNG.
  - Acceptance: CI green on PR.
  - Files: `tests/e2e/studio.spec.ts` (new)
  - E: M

#### Notes
- Keep edits isolated and incremental; avoid regressions in non‑Studio pages.
- Prefer new files/paths above to avoid touching legacy code.


