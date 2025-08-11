// src/App.tsx
import StudioPage from './pages/studio/StudioPage';

import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import BaseLayout from './components/BaseLayout';
import LandingPage from './components/LandingPage';
import Disclaimer from './pages/Disclaimer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import GetStarted from './pages/GetStarted';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';



import VideoProcessingTest from './pages/VideoProcessingTest';


// Lazy load heavy components for better code splitting
const VideoWatchPage = React.lazy(() => import('./pages/VideoWatchPage'));
const WatchHistoryPage = React.lazy(() => import('./pages/WatchHistoryPage'));
const SearchHistoryPage = React.lazy(() => import('./pages/SearchHistoryPage'));

// Lazy load media-heavy components
const Shorts = React.lazy(() => import('./pages/Shorts'));

const LiveStream = React.lazy(() => import('./pages/live/[id]'));

// Lazy load studio components (large and specialized)
const StudioLive = React.lazy(() => import('./pages/studio/Live'));
const StudioRoom = React.lazy(() => import('./pages/studio/Room'));
const TemplateImporter = React.lazy(() => import('./pages/TemplateImporter'));
const CategoryTemplates = React.lazy(() => import('./pages/CategoryTemplates'));
// TemplateEditor replaced by Studio - all editor routes now use Studio
// const TemplateEditor = React.lazy(() => import('./pages/TemplateEditor'));

// Lazy load admin panel (rarely accessed, very large)
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

// --- Secret keyboard shortcut hook ---
function useSecretAdminShortcut() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+A for admin access
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        navigate('/admin-panel-237abc');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
}

export default function App() {
  useSecretAdminShortcut();

  return (
    <BaseLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes - Keep these eagerly loaded for fast initial load */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/sign-in" element={<SignIn />} />
                      <Route path="/auth" element={<SignIn />} /> {/* Alias for /auth */}


            <Route path="/video-processing-test" element={<VideoProcessingTest />} />
      
            <Route path="/simple-editor" element={<Navigate to="/studio" replace />} />
          
          {/* Template Importer - Lazy loaded (large component) */}
          <Route path="/import-templates" element={<TemplateImporter />} />
          <Route path="/template-importer" element={<TemplateImporter />} />
          
          {/* Video Watch Page - Lazy loaded */}
          <Route
            path="/video/:videoId"
            element={
              <ProtectedRoute>
                <VideoWatchPage />
              </ProtectedRoute>
            }
          />

          {/* Dashboard/Home - Keep eagerly loaded for authenticated users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />

          {/* History - Lazy loaded */}
          <Route
            path="/history/watch"
            element={
              <ProtectedRoute>
                <WatchHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history/search"
            element={
              <ProtectedRoute>
                <SearchHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Shorts: Pro Gen-Z, TikTok-style page - Lazy loaded */}
          <Route
            path="/shorts"
            element={
              <ProtectedRoute>
                <Shorts />
              </ProtectedRoute>
            }
          />

          {/* Live: multi-user and YouTube live - Redirects to studio live */}
          <Route
            path="/live"
            element={<Navigate to="/studio/live" replace />}
          />
          <Route
            path="/live/:id"
            element={
              <ProtectedRoute>
                <LiveStream />
              </ProtectedRoute>
            }
          />
          <Route
            path="/studio/live"
            element={
              <ProtectedRoute>
                <StudioLive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/studio/room"
            element={
              <ProtectedRoute>
                <StudioRoom />
              </ProtectedRoute>
            }
          />

          {/* ---- Studio BMAD Route - Uses new BMAD Studio UI ---- */}
          <Route
            path="/studio"
            element={
              <ProtectedRoute>
                <StudioPage />
              </ProtectedRoute>
            }
          />

          {/* ---- Canvas Editor Test Route - Redirects to Studio ---- */}
          <Route
            path="/canvas-editor"
            element={<Navigate to="/studio" replace />}
          />

          {/* Category Templates Route - Lazy loaded */}
          <Route
            path="/category/:category"
            element={
              <ProtectedRoute>
                <CategoryTemplates />
              </ProtectedRoute>
            }
          />

          {/* Studio Editor Routes - All editor routes now redirect to studio */}
          <Route path="/editor/shorts" element={<Navigate to="/studio" replace />} />
          <Route path="/editor/story" element={<Navigate to="/studio" replace />} />
          <Route path="/editor/square" element={<Navigate to="/studio" replace />} />
          <Route path="/editor/thumbnail" element={<Navigate to="/studio" replace />} />
          <Route path="/editor/video" element={<Navigate to="/studio" replace />} />
          <Route path="/editor/original" element={<Navigate to="/studio" replace />} />

          {/* --- Hidden Admin Panel (Ctrl+Shift+A) - Lazy loaded --- */}
          <Route path="/admin-panel-237abc" element={<AdminPanel />} />

          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BaseLayout>
  );
}
