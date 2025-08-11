# ViewsBoost — One Studio v1

A single, feature-flagged Studio at `/studio` that uses Fabric.js for canvas editing, Firestore for persistence, and Firebase Storage for assets. This README covers local setup, routes, data shapes, and gotchas.

---

## 1) Prereqs
- Node 18+
- Firebase project (Firestore + Storage enabled)
- Vite + React + TS (already in repo)

## 2) Setup

### .env.local
Create `.env.local` at the repo root:

    VITE_STUDIO_V2=true

    # Firebase (from your Firebase console → Web App settings)
    VITE_FIREBASE_API_KEY=xxxxxxxxxxxxxxxxxxxxx
    VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your-app
    VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
    VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
    VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX

> Keep service account keys **out** of the client and out of git. Rotate any exposed keys.

### Install & run

    npm i
    npm run dev
    # open http://localhost:5173/studio

## 3) Routes (behind `VITE_STUDIO_V2`)
- `/studio` → Template gallery & quick sizes  
- `/studio/new?size=1080x1920` → Blank doc  
- `/studio/new?tmpl=<templateId>` → From template  
- `/studio/edit/:docId` → Edit existing design  

Auth guard: signed-out users are redirected to `/login` and returned to their intended route after sign-in.

## 4) Data model (Firestore)

Design documents (`designs/{id}`):

    {
      "id": "string",
      "ownerId": "string",
      "title": "string",
      "width": 1080,
      "height": 1920,
      "bg": "#ffffff",
      "layers": [
        { "id": "l1", "type": "text", "props": { "text": "Headline", "left": 120, "top": 160, "fontSize": 72, "fill": "#111827" } }
      ],
      "schemaVersion": 1,
      "status": "draft",
      "createdAt": "Timestamp",
      "updatedAt": "Timestamp"
    }

Template documents (`templates/{id}`):

    {
      "public": true,
      "title": "Template Title",
      "tags": ["sale","fashion"],
      "previewURL": "https://...",
      "baseDoc": { "width": 1080, "height": 1920, "bg": "#ffffff", "layers": [], "schemaVersion": 1 }
    }

Asset documents (`assets/{id}`):

    {
      "ownerId": "string",
      "type": "image",
      "filePath": "users/{uid}/assets/abc.png",
      "width": 1200, "height": 1600,
      "createdAt": "Timestamp"
    }

### Firestore rules (append safely)

    // designs: owner-only; templates: public read
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /designs/{docId} {
          allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;
          allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
        }
        match /templates/{tmplId} {
          allow read: if resource.data.public == true;
          allow write: if false; // author via admin only
        }
      }
    }

### Storage rules (append safely)

    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /users/{uid}/assets/{fileId} {
          allow read: if true; // or tighten if needed
          allow write: if request.auth != null
            && request.auth.uid == uid
            && request.resource.size < 15 * 1024 * 1024;
        }
      }
    }

## 5) Studio basics
- **Canvas engine:** Fabric.js in `FabricCanvasProvider`  
- **State:** Zustand slices (`useStudio`)  
- **Autosave:** debounced 5s to `designs/{id}` (sets `createdAt/updatedAt`)  
- **Export:** PNG/JPEG at 1×/2×; optional transparent PNG  
- **Templates:** public collection; gallery search by `tags[]`  
- **Uploads:** images saved to `users/{uid}/assets/*` then inserted on canvas  

### Keyboard shortcuts
- `Cmd/Ctrl + S` save (manual)  
- `Cmd/Ctrl + Z` / `Shift + Cmd/Ctrl + Z` undo/redo  
- `Delete` remove layer  
- Arrow keys nudge (hold `Shift` = 10px)

## 6) Seeding a template (optional)

**Quick path (Console):** Firestore → `templates` → Add document with fields above.

Example `baseDoc`:

    {
      "width": 1080,
      "height": 1920,
      "bg": "#ffffff",
      "layers": [
        { "id": "t1", "type": "text", "props": { "text": "New Drop!", "left": 120, "top": 160, "fontSize": 72, "fill": "#111827" } },
        { "id": "r1", "type": "rect", "props": { "left": 80, "top": 520, "width": 920, "height": 960, "fill": "#eef2ff" } }
      ],
      "schemaVersion": 1
    }

## 7) Testing (smoke)

- Visit `/studio` while signed-out → expect redirect to `/login`  
- Create new doc → add text → wait for autosave → reload `/studio/edit/:id` → canvas rehydrates exactly  
- Export PNG returns a data URL and triggers download  

Run:

    npx playwright install
    npm run test:e2e
    # or use your existing test script

## 8) Troubleshooting
- **Auth loop / blank screen:** check `.env.local` Firebase values and that your Auth providers are enabled.  
- **Permission denied (Firestore/Storage):** verify rules above and that `ownerId == auth.uid` on new designs.  
- **Fonts look wrong:** ensure the font family used by a layer is loaded in CSS; consider preloading common fonts.  
- **Large image imports are slow:** downscale sources > 4000px before upload; history depth is capped to avoid memory spikes.  
- **Nothing shows in Template search:** make sure `public=true` and `tags` contain your query words (lowercase).

## 9) Roadmap (Sprint-002 scope)
- Load existing `designs/:id` + exact rehydration  
- `?tmpl=` hydration from `templates/:id`  
- Fabric bindings + history stack  
- Upload to Storage + insert  
- Auth guard with return-to-intent  
- Export 1×/2× (+ transparency)  
- Rules hardening, smoke tests, telemetry

---

**Definition of Done (v1):** All acceptance criteria pass, no uncaught console errors through create → edit → save → export → reload, and this README is up to date.
