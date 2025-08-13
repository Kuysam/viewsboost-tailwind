## ViewsBoost Studio — Canva V2 (Unparalleled Editor) Roadmap

Goal: Build a next‑gen, modular, high‑performance design/video editor competitive with Adobe Express, VistaCreate, CapCut, and Canva — with a distinctive ViewsBoost identity.

Core principles
- Realtime feel at 60fps; latency budget per interaction <16ms
- Non‑blocking architecture: workerized rendering, incremental state updates
- Editor as platform: plugins, tools, effects, data model stable and extensible
- Cloud‑ready: Firebase Storage for assets; Firestore/RTDB for sessions/collab

High‑level architecture
- UI Shell (React + Tailwind): panels, docking, shortcuts, command palette
- Scene Core (Fabric.js v5+ or Konva): unified layer model (vector, raster, video, audio)
- Timeline Engine: tracks, clips, keyframes, transitions, effects; worker timers
- Asset Graph: sources (Firebase, local, external), lazy metadata/thumbnailer
- Rendering/FX Workers: off‑main thread bitmap filters, LUTs, AI helpers
- Persistence: project schema v2 (JSON), media manifests, revisions/snapshots
- Collaboration (phase 2): CRDT/Y.js for multi‑user edits, presence, comments

Data model (v2)
- Project: { id, title, pages[], settings, createdAt, updatedAt }
- Page: { id, size{w,h}, background, layers[], guides[] }
- Layer (union): shape, text, image, video, audio, group, component
- Timeline: { tracks[], fps, duration }
- Track: { id, type: video|image|audio|effect, clips[] }
- Clip: { id, src, in, out, start, duration, transforms, params{mute,speed,volume,opacity}, keyframes[] }
- Keyframe: { time, prop, value, easing }

Features (release slices)
1) MVP Canvas + Timeline
  - Multi‑page artboards, snapping/guides, transform tools
  - Timeline with multi‑track, clip drag/trim, ripple, snap to playhead/edges
  - Per‑clip controls: mute/speed/volume; image duration; transitions (crossfade)
  - Thumbnails: offscreen video capture; cached in project manifest

2) Styles & Effects
  - Fill (solid/gradient/image), stroke, shadow, blend modes
  - Video effects: brightness/contrast/saturation; LUT via worker
  - Text engine with fonts loader, variable fonts; styles presets

3) Asset Browser + Importers
  - Firebase Storage browser with folders, search, lazy pagination
  - Drag/drop to canvas/timeline; background uploads and metadata extraction
  - External sources (Pexels/Unsplash) via serverless proxies

4) Export & Renders
  - Image export (PNG/JPG/SVG), PDF for multipage
  - Video export (client: ffmpeg.wasm) with presets; server render optional
  - Render queue UI; background renders with notifications

5) Collaboration & Review (phase 2)
  - Presence cursors, live updates with Y.js
  - Comment pins, share links with role‑based access

Technical plan
- Package layout: `src/editor/` with domain folders: core, timeline, tools, panels, hooks, workers
- State: Zustand + selectors; undo/redo via history slices; actions/events bus
- Workers: `canvasFx.worker.ts`, `thumb.worker.ts` for CPU‑heavy tasks
- Hotkeys: unified map; command palette executes actions
- Telemetry: optional perf marks for frame budget; error boundaries

Migration plan
- Keep current Studio routes working; mount Editor V2 under feature flag
- Import from v1 JSON → v2 schema migration script
- Once stable, switch Studio to V2 and retire v1

Milestones
- M1 (week 1–2): Editor shell, page manager, basic timeline (multi‑track), asset drop
- M2 (week 3–4): Styles/effects, robust snapping, transitions, thumbnails cache
- M3 (week 5–6): Export (images, basic video), Storage browser, polish
- M4 (phase 2): Collaboration, advanced exports, plugin API

Delete/replace strategy
- Avoid breaking routes: do NOT delete current `ViewsBoostCanvaEditor.tsx` until V2 MVP mounts and passes smoke tests.
- After M1 green, replace entry point and remove v1 files.

Next actions
1) Scaffold `src/editor/` (core/timeline/tools/panels) and mount `EditorV2` behind a flag.
2) Implement V2 project schema, page manager, and multi‑track timeline MVP.
3) Wire Firebase Storage browser (read‑only first) and clip insertion.


