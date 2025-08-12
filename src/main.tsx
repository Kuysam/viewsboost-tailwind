// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext'; // ✅ Added
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from './lib/toast';

import './lib/firebase';

// Firebase configuration
// Initialize Firebase
try {
  if (import.meta.env.DEV) {

  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Log Firebase config for development
if (import.meta.env.DEV) {

}

// ✅ Wrap App with StudioProvider and Toaster for BMAD Studio UI
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
              <Toaster richColors />
            </BrowserRouter>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
