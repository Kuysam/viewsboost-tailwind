// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Admin email constant for admin route check
const ADMIN_EMAIL = 'cham212003@gmail.com';

interface Props {
  children: React.ReactElement;
  roleCollection: 'all' | 'creators' | 'viewers' | 'admin';
}

export default function ProtectedRoute({ children, roleCollection }: Props) {
  const [user, loading] = useAuthState(auth);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setAllowed(false);
        return;
      }

      // Allow all authenticated users
      if (roleCollection === 'all') {
        setAllowed(true);
        return;
      }

      // Special handling for admin role
      if (roleCollection === 'admin') {
        if (user.email === ADMIN_EMAIL) {
          const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
          if (!isAuthenticated) {
            navigate('/');
            return;
          }
          setAllowed(true);
          return;
        }
        setAllowed(false);
        return;
      }

      // Check Firestore for creator/viewer roles
      try {
        const docRef = doc(db, roleCollection, user.uid);
        const docSnap = await getDoc(docRef);
        setAllowed(docSnap.exists());
      } catch (error) {
        console.error('Error checking role:', error);
        setAllowed(false);
      }
    }

    checkAccess();
  }, [user, roleCollection, navigate]);

  if (loading || allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-yellow-500 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
