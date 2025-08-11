# Sprint: ViewsBoost Studio — Week 1–2 UI Hardening

**Purpose**: “first design in 30 seconds” flow; clear creation → confident editing → clean export.  
**Success**: TTFD ≤ 30s, export success ≥ 95%, core keyboard shortcuts discoverable, AA contrast.

---

## PR-01: Shell + TopBar (Undo/Redo/Autosave/Hotkeys/Toasts)
- [ ] Add `<TopBar>` with Undo/Redo/Export/New buttons
- [ ] Wire hotkeys: mod+z, mod+shift+z, mod+n, mod+k, `/` focus search, `?` show hint
- [ ] `<AutosaveStatus dirty>` shows “Saving…” then “All changes saved • HH:MM”
- [ ] Add `<Toaster />` at app root and centralize toast usage  
**DoD**: Works with keyboard & mouse; no console errors; ESLint passes.

## PR-02: New Design Modal + Presets
- [ ] Create `src/constants/canvasPresets.ts`
- [ ] Build `<NewDesignModal>` with 3 presets + custom size
- [ ] Wire `onCreate(w,h)` → initialize canvas and mark `dirty=false`  
**DoD**: Esc closes; Tab order correct; screen readers announce title.

## PR-03: Template/Asset Grid Skeletons
- [ ] `<SkeletonCard>` (fixed aspect, animate-pulse)
- [ ] `<TemplateGrid items, loading>` retains layout; hover label; lazy images  
**DoD**: No CLS when results load.

## PR-04: Accessibility Baseline
- [ ] Toolbars use `role="toolbar"`; groups labelled
- [ ] Add `<LiveRegion />` and announce: uploads, align, export done
- [ ] Global focus utility classes applied to icon buttons  
**DoD**: Keyboard-only journey succeeds.

## PR-05: Layers Panel Micro-controls
- [ ] `<LayerItem>` with eye/lock/drag affordances on hover
- [ ] Context menu: Group, Duplicate, Bring to front  
**DoD**: Selection visible; actions work on current layer.

## PR-06: Export Dialog
- [ ] `<ExportDialog>` with PNG/JPG/PDF, scale 1–4×, transparency (PNG only)
- [ ] Hook into canvas exporter; estimate size (optional)  
**DoD**: Files open correctly on desktop & mobile.

## PR-07: Command Palette
- [ ] `<CommandPalette>`; open via custom `open-cmdk` event and ⌘/Ctrl+K
- [ ] Register commands: New design, Export, Duplicate, Group, Align, Toggle grid  
**DoD**: Fuzzy search; Enter runs; Esc closes.

## PR-08: Motion-safe + Focus Utilities
- [ ] Prefix animations with `motion-safe:`; audit hover transitions
- [ ] Ensure all buttons have `focus-visible` ring + 44×44 targets  
**DoD**: Reduced-motion set → no distracting animations.

## PR-09: QA + Polish
- [ ] Zero states: Templates (“Try ‘poster’/‘reel’/‘thumb’”), Uploads (“Drag & drop or paste ⌘/Ctrl+V”)
- [ ] Responsive tidy: collapse left nav ≤1024px; maintain canvas pan/zoom
- [ ] Bug scrub and copy tweaks  
**DoD**: Golden path completes under 30s; no blockers.

---

### Notes & Links
- Studio route: `/studio`
- Netlify SPA fallback: ensure `netlify.toml` has 200 redirect to `/index.html`.
- Alias set: `@ → src/*` (see `vite.config.ts`, `tsconfig.json`).

**Owner:** @you  
**Timeline:** Week 1–2  
**Labels:** sprint, ui, studio
