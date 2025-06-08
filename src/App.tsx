// src/App.tsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import Shorts from './pages/Shorts';

export default function App() {
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

        {/* Video Watch Page */}
        <Route
          path="/video/:videoId"
          element={
            <ProtectedRoute>
              <VideoWatchPage />
            </ProtectedRoute>
          }
        />

        {/* Dashboard (also acts as homepage) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />

        {/* History Pages */}
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

        {/* Shorts Page */}
        <Route
          path="/shorts"
          element={
            <ProtectedRoute>
              <Shorts />
            </ProtectedRoute>
          }
        />

        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BaseLayout>
  );
}
