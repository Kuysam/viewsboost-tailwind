Here’s a focused inventory of every path containing “template” (case-insensitive) in this project, plus what each is for and whether it’s safe to keep/remove. I’ve grouped by area.
Canonical runtime/template data
public/templates
Canonical output root. Contains manifest.json and the library/ folder with per-category JSON templates and thumbs.
Keep. This is the only template output folder we now use.
Authoring, UI and editor components
src/components/TemplateCard.tsx
Renders a template tile. Now reads previewPath for thumbnail and passes click to open in editor.
Keep; this is used by Studio and Category pages.
src/components/TemplateCategoryManager.tsx
Admin-like UI for organizing templates (Firestore-heavy). Useful for internal management.
Keep if you use the admin features; otherwise optional.
src/components/TemplateGrid.tsx, ModernTemplateGrid.tsx
Grid rendering for templates; ModernTemplateGrid is used in CategoryTemplates route.
Keep.
src/components/TemplatePreviewModal.tsx
Modal preview. Used by CategoryTemplates to preview before open.
Keep.
src/components/VideoTemplateProcessor.tsx
Utilities for video templates (if used by your flows).
Keep if your flows use it; otherwise optional.
Pages and routes
src/pages/Studio.tsx
Main gallery. Uses registry.getTemplates() and opens templates in ViewsBoostCanvaEditor.
Keep.
src/pages/CategoryTemplates.tsx
Category route that lists templates from registry and opens them into Studio editor.
Keep.
src/pages/ModernTemplateShowcase.tsx
Alternative showcase page. Optional; keep if referenced.
src/pages/TemplateImporter.tsx (+ .backup)
UI to import templates (historical). Optional; keep for admin/import workflows.
Runtime data/logic
src/lib/templates (directory)
Registry and Firebase list helpers.
registry.ts: loads public/templates/manifest.json and merges with Firebase at runtime; exports getTemplates/getCategories/searchTemplates/getTemplateById.
firebaseList.ts: Firestore list and optional Storage crawler.
Keep.
src/lib/templateLoader.ts
Utilities for loading templates into the editor (if used by any editor code).
Keep.
src/lib/useTemplates.ts
Firestore-only hook (legacy; not used by Studio after registry integration).
Optional; keep if other pages rely on it; otherwise can be retired later.
src/lib/firestoreTemplates.ts
Small helper to fetch templates collection. Optional now that registry is used; keep for admin paths.
src/lib/hooks/useTemplateUpdates.ts
Broadcast/listen to “templatesUpdated” events. Still useful if you fire events from admin tools.
Keep.
Seeders and utilities
scripts/seed-templates.ts
Canonical seeder (TS/ESM) that scans the local source folder, resolves category, computes contentHash, copies JSON to public/templates/library/<Category>, writes thumbs to public/templates/library/thumbs/, and writes public/templates/manifest.json.
Keep; this is the main import tool.
scripts/seed-templates.cjs
Earlier/alternate seeder script. Optional; superseded by TS one above.
scripts/generate-thumbnails.cjs
Renders thumbnails from JSON and writes to /templates/library/thumbs/<id>.png; updates manifest previewPath if missing.
Keep; used when you want to refresh thumbs.
scripts/create-templates-from-videos.cjs, update-firestore-template-videos.cjs, quick-template-check.js, bulk-import-templates.cjs, check-template-sources.cjs, fix-templates.sh
Utilities to create/check/fix templates; keep as tooling where needed.
Docs and audits
docs/templateslistdocs.md
Source of canonical categories. Seeder uses it for fuzzy category normalization.
Keep.
TEMPLATE_DELETION_GUIDE.md, TEMPLATE_PREVIEW_FIX_PLAN.md, TEMPLATE_PREVIEW_TEST_GUIDE.md
Process docs; keep.
template-validation.cjs, template-validation-report.json, template-audit-script.cjs, template-audit-report.json, template-url-alignment.* (js/mjs)
Validation and audit scripts; keep as reference tools.
Admin and dev aids
src/dev/SeedTemplates.tsx
Dev page to seed/import in-browser. Optional.
test-template-previews.js, test-video-template-fix.js, test-real-template-fix.js
Test scripts for previews/video templates; optional in production.
Non-project matches (ignore)
.bmad-core/templates, .bmad-core/utils/bmad-doc-template.md
BMAD docs/templates; unrelated to Studio runtime. Keep if you use these docs; they don’t affect UI.
Everything under .venv-rembg and site-packages, numpy/skimage “template.py”, etc.
Python env noise; unrelated to app.
public/assets/template-thumb.png, public/default-template.png
Placeholder assets; keep for fallback only.
Summary: Single template folder and routes
Single canonical folder: public/templates (with library/ subdir and thumbs/)
Manifest: public/templates/manifest.json (Studio/Category pages load from this)
Registry runtime: src/lib/templates/registry.ts (merges local manifest + Firebase list)
Editor: ViewsBoostCanvaEditor loads real content via jsonPath
Thumbnails: TemplateCard uses previewPath; generator ensures they are real
there might be some changes cuz or future update ,you will need to deep scan to confirm the changes and updates this file.