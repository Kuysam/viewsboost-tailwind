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

```ini
VITE_STUDIO_V2=true

# Firebase (from your Firebase console → Web App settings)
VITE_FIREBASE_API_KEY=xxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX