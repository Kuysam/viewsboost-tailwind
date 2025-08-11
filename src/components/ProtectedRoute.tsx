// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();

  // Optional development bypass (disabled by default for safety)
  // To enable temporarily during local dev, set VITE_ALLOW_STUDIO_BYPASS=true
  const allowBypass = import.meta.env.VITE_ALLOW_STUDIO_BYPASS === 'true';
  if (import.meta.env.DEV && allowBypass && window.location.pathname === '/studio') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/get-started" replace />;
  }

  return <>{children}</>;
}
