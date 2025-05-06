// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import BaseLayout from './components/BaseLayout';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Signup from './pages/Signup';
import Disclaimer from './pages/Disclaimer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import WatchLivePage from './pages/WatchLivePage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import AdminAuth from './components/admin/AdminAuth';
import AdminDashboard from './pages/AdminDashboard';
import { ThemeProvider } from './contexts/ThemeContext';

// ViewsBoost Pages
import Home from './pages/Home';
import Feed from './pages/Feed';
import Shorts from './pages/Shorts';
import LivePage from './pages/LivePage';
import NewsPage from './pages/NewsPage';
import Studio from './pages/Studio';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import History from './pages/History';
import VideoWatchPage from './pages/VideoWatchPage';

export default function App() {
  const location = useLocation();
  const [showAdminAuth, setShowAdminAuth] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAdminAuth(true);
      }
      if (e.key === 'Escape' && showAdminAuth) {
        setShowAdminAuth(false);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showAdminAuth]);

  const isAdminRoute = location.pathname === '/admin-panel';

  return (
    <ThemeProvider>
      <BaseLayout>
        {showAdminAuth && !isAdminRoute && <AdminAuth />}
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/live/watch/:id" element={<WatchLivePage />} />

          {/* Redirect old creator/viewer paths to Home */}
          <Route path="/creator/*" element={<Navigate to="/home" replace />} />
          <Route path="/viewer/*" element={<Navigate to="/home" replace />} />

          {/* Unified Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute roleCollection="all">
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute roleCollection="all">
                <Feed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shorts"
            element={
              <ProtectedRoute roleCollection="all">
                <Shorts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live"
            element={
              <ProtectedRoute roleCollection="all">
                <LivePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news"
            element={
              <ProtectedRoute roleCollection="all">
                <NewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/studio"
            element={
              <ProtectedRoute roleCollection="all">
                <Studio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roleCollection="all">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute roleCollection="all">
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute roleCollection="all">
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video/:id"
            element={
              <ProtectedRoute roleCollection="all">
                <VideoWatchPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin route */}
          <Route
            path="/admin-panel"
            element={
              sessionStorage.getItem('adminAuthenticated') === 'true' ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BaseLayout>
    </ThemeProvider>
  );
}
