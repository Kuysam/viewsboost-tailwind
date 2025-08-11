Task: Sprint-002 — One Studio v1 Delta (no rework of Sprint-001)
Goal: Wire persistence, templates, Fabric bindings, uploads, guard, export, rules, tests, telemetry.

Deliverables:
1) Persistence
   - Implement Firestore load in /studio/edit/:id and setDocFull(...)
   - Debounced autosave already exists; ensure schemaVersion + timestamps
2) Templates
   - When `tmpl` query present, fetch templates/:id and hydrate baseDoc
   - Hook StudioHome search to Firestore query (public templates)
3) Fabric bindings + history
   - Map Layer {type, props} ↔ Fabric object; support select/move/resize
   - Undo/redo stack integrated with Fabric events
4) Uploads
   - Sidebar “Upload Image” → Storage path users/{uid}/assets/*
   - Insert uploaded image onto canvas; keep asset list
5) Auth guard
   - Protect /studio/*; on login, return to original intent (state.from)
6) Export
   - PNG/JPEG at 1×/2×; PNG transparency toggle
7) Rules
   - Tighten firestore.rules & storage.rules per PRD (owner-only designs; public templates read)
8) Tests & Telemetry
   - Playwright smoke: guard + save→reload restores canvas exactly
   - Instrument save/export events; surface toast on failures

Quality bar:
- No uncaught console errors through create→edit→save→export→reload
- Mobile pan/zoom works; text editing possible
- Keep all Sprint-001 UI intact (TopBar, presets, skeletons, a11y, layer controls, export dialog, cmd-k)

Docs:
- Update docs/prd/one-studio-v1.md “Status” section with Sprint-001 ✅ and Sprint-002 scope.
- Add README-studio.md with run/test notes.
GitHub checklist (drop in a single issue)
 S2.1 Load designs/:id → rehydrate canvas

 S3.1 ?tmpl= → hydrate from templates/:id

 S2.2 Fabric bindings (text/rect/image) + history

 S4.1 Upload → Storage → insert on canvas

 S1.3 Auth guard w/ return-to-intent

 S4.2 Export PNG/JPEG 1×/2× (+ transparency)

 S5.1 Firestore/Storage rules tighten

 S5.2 Playwright smoke (guard + save→reload)

 S5.3 Telemetry for save/export, error toasts