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
import { StudioProvider } from './state/studio.tsx';
import { Toaster } from './lib/toast';

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

// ✅ Wrap App with StudioProvider and Toaster for BMAD Studio UI
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <StudioProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <App />
              <Toaster richColors />
            </BrowserRouter>
          </StudioProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
