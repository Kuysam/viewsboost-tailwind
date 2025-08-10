import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import { getMessaging, isSupported as messagingSupported } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);

export const analyticsPromise = analyticsSupported().then(ok => ok ? getAnalytics(app) : null);

export const messagingPromise = messagingSupported().then(ok => {
  if (!ok) return null;
  try {
    return getMessaging(app);
  } catch (e) {
    console.warn('Messaging disabled (IDB unavailable):', e);
    return null;
  }
});

// Core services (safe to import throughout the app)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
