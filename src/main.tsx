// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext'; // ✅ Added
import ErrorBoundary from './components/ErrorBoundary';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  if (import.meta.env.DEV) {
    console.log('✅ Firebase initialized successfully!');
    console.log('📱 Connected to project:', firebaseConfig.projectId);
    console.log('🔑 Auth domain:', firebaseConfig.authDomain);
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Log Firebase config for development
if (import.meta.env.DEV) {
  console.log('Firebase Config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
}

// ✅ Wrap App in both ThemeProvider and LanguageProvider
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <App />
          </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
