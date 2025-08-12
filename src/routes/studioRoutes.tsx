import React from 'react';
import type { RouteObject } from 'react-router-dom';
import StudioHome from '../pages/Studio';
// Legacy StudioEditor route removed in fresh start
import { flags } from '../lib/flags';
import { useAuth as useUser } from '../lib/auth';
import { Navigate, useLocation } from 'react-router-dom';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useUser(); const loc = useLocation();
  if (loading) return <div />;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}

export const studioRoutes: RouteObject[] = !flags.STUDIO_V2 ? [] : [
  { path: '/studio', element: <RequireAuth><StudioHome /></RequireAuth> },
];
