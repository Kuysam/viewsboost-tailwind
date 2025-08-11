import React from 'react';
import type { RouteObject } from 'react-router-dom';
import StudioHome from '../studio/pages/StudioHome';
import StudioEditor from '../studio/pages/StudioEditor';
import { flags } from '../lib/flags';
import { useUser } from '../studio/_auth/useUser';
import { Navigate, useLocation } from 'react-router-dom';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useUser(); const loc = useLocation();
  if (loading) return <div />;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}

export const studioRoutes: RouteObject[] = !flags.STUDIO_V2 ? [] : [
  { path: '/studio', element: <RequireAuth><StudioHome /></RequireAuth> },
  { path: '/studio/new', element: <RequireAuth><StudioEditor /></RequireAuth> },
  { path: '/studio/edit/:docId', element: <RequireAuth><StudioEditor /></RequireAuth> },
];
