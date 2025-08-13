## ViewsBoost Canva Editor Roadmap

Scope: Upgrade the existing Fabric.js editor to professional level in five iterative feature tracks. This document tracks scope, acceptance, and rollout order. Keep runtime stable; no breaking changes to non‑studio pages.

### 0) Baseline (done or in-progress)
- Normalize template fields from both manifest and Firebase: `templatePath|jsonPath`, `previewPath|thumbnail`.
- Parse `size` strings like `1152x768` and set canvas size accordingly.
- If no JSON/layers but `previewPath` exists, set as background to start editing.
- Fit-to-board, Ctrl/Cmd + wheel zoom.

### 1) Timeline + Scrubbing (video layers)
- Goals:
  - Bottom timeline bar with play/pause, current time, duration, and a scrubber.
  - Spacebar toggles play/pause.
  - Works with the primary video element added via `addMediaLayer()`.
- Acceptance:
  - User can play/pause and scrub; canvas updates frames live.
  - If no video present, controls are disabled.

### 2) Multi‑Page Documents (Artboards)
- Goals:
  - Add page manager sidebar: create, duplicate, delete pages.
  - Persist page list (in-memory for now); switch pages without losing state.
- Acceptance:
  - At least 10 pages supported; switch is <100ms on typical machine.

### 3) Style Panel (Shadows, Strokes, Gradients)
- Goals:
  - Right panel section for selected object styles: fill (solid/linear gradient), stroke (color/width), shadow (color/blur/offset).
  - Works with shapes, text, and images (where applicable).
- Acceptance:
  - Live preview; undo/redo integrates with editor history.

### 4) Asset Browser (Firebase Storage)
- Goals:
  - Left panel “Assets” tab listing buckets/folders from Firebase Storage.
  - Drag/drop or click-to-insert images/videos onto canvas.
- Acceptance:
  - Lists at least 100 assets with lazy load; inserts respect CORS.

### 5) Smart Snapping & Guides
- Goals:
  - Snap to artboard center, edges, and sibling centers/edges with guide lines.
  - Configurable snap strength and toggle.
- Acceptance:
  - Movement shows guides; objects land precisely; feels Canva‑like.

### Rollout & Testing
- Each feature merges behind stable UI, no changes to non‑studio pages.
- Manual QA checklist per feature; smoke tests: open/edit/export.
- Performance target: 60fps interactions on typical laptop; no memory leaks.

### Notes
- Local videos must come from `/public/assets/videos/` or Firebase Storage per project rules.
- Keep image/video crossOrigin safe; avoid tainting canvas when possible.


