// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBJQVHpWywY8BAS3T6ApYwM-ILRfkQTnEA",
  authDomain: "viewsboostv2.firebaseapp.com",
  projectId: "viewsboostv2",
  storageBucket: "viewsboostv2.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable persistence for better offline support
setPersistence(auth, browserLocalPersistence);

export { app, auth, db, storage };
export default app;
