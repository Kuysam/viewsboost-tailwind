// src/App.tsx

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import BaseLayout from './components/BaseLayout';
import LandingPage from './components/LandingPage';
import Disclaimer from './pages/Disclaimer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import GetStarted from './pages/GetStarted';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import VideoWatchPage from './pages/VideoWatchPage';
import WatchHistoryPage from './pages/WatchHistoryPage';
import SearchHistoryPage from './pages/SearchHistoryPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

// New: Shorts and Live (modern, animated, Gen Z style)
import Shorts from './pages/Shorts';
import Live from './pages/Live';
import LiveStream from './pages/live/[id]';
import StudioLive from './pages/studio/Live';
import StudioRoom from './pages/studio/Room';

// --- Studio MVP Page (NEW) ---
import Studio from './pages/Studio'; // <-- Add this line
import TemplateImporter from "./pages/TemplateImporter";
// Admin panel route (hidden, secure)
import AdminPanel from './pages/AdminPanel';

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
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/auth" element={<SignIn />} /> {/* Alias for /auth */}
        <Route path="/import-templates" element={<TemplateImporter />} />
        {/* Video Watch Page */}
        <Route
          path="/video/:videoId"
          element={
            <ProtectedRoute>
              <VideoWatchPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard/Home */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />

        {/* History */}
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

        {/* Shorts: Pro Gen-Z, TikTok-style page */}
        <Route
          path="/shorts"
          element={
            <ProtectedRoute>
              <Shorts />
            </ProtectedRoute>
          }
        />

        {/* Live: multi-user and YouTube live */}
        <Route
          path="/live"
          element={
            <ProtectedRoute>
              <Live />
            </ProtectedRoute>
          }
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

        {/* ---- Studio MVP Route ---- */}
        <Route
          path="/studio"
          element={
            <ProtectedRoute>
              <Studio />
            </ProtectedRoute>
          }
        />

        {/* --- Hidden Admin Panel (Ctrl+Shift+A) --- */}
        <Route path="/admin-panel-237abc" element={<AdminPanel />} />

        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BaseLayout>
  );
}
