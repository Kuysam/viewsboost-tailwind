// src/components/Auth.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { quotaManager } from '../lib/quotaManager';
import { loginWithEmailPassword } from '../lib/auth';
import { userStatsService } from '../lib/services/userStats';
import { useAuthState } from 'react-firebase-hooks/auth';

const ADMIN_EMAIL = 'cham212003@gmail.com';
const ADMIN_PASSWORD = '212003Cham212003Kuysam!!';

export default function Auth() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [quotaData, setQuotaData] = useState([]);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        navigate('/home'); // Redirect to dashboard after login
      } else {
        setCheckingAuth(false); // Not logged in, show form
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = quotaManager.subscribeToQuotaUpdates((data) => {
      setQuotaData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if it's admin login
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const user = await loginWithEmailPassword(email, password);
        if (user) {
          sessionStorage.setItem('adminAuthenticated', 'true');
          navigate('/admin-panel');
          return;
        }
      }

      // Regular user login
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      
      // Track the login
      await userStatsService.trackLogin();
      
      // Navigation will be handled by onAuthStateChanged
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // First check if user exists in any collection
      const viewerDoc = await getDoc(doc(db, 'viewers', result.user.uid));
      const creatorDoc = await getDoc(doc(db, 'creators', result.user.uid));
      
      if (!viewerDoc.exists() && !creatorDoc.exists()) {
        // New user - create viewer profile
        await setDoc(doc(db, 'viewers', result.user.uid), {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          role: 'viewer',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          // Add these fields to ensure profile is complete
          uid: result.user.uid,
          status: 'active',
          preferences: {
            notifications: true,
            theme: 'dark'
          }
        });
      } else {
        // Update lastLogin for existing user
        const collectionName = viewerDoc.exists() ? 'viewers' : 'creators';
        await setDoc(doc(db, collectionName, result.user.uid), {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }

      // Track the login
      await userStatsService.trackLogin();

      // Navigation will be handled by onAuthStateChanged
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  if (loading) return <div>Loading...</div>;
  if (user) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center overflow-hidden">
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full max-w-md bg-black/60 backdrop-blur-md p-8 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to ViewsBoost</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 rounded bg-white/10 focus:ring-2 focus:ring-yellow-500 placeholder-gray-400"
            required
            disabled={loading}
          />
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 rounded bg-white/10 focus:ring-2 focus:ring-yellow-500 placeholder-gray-400"
            required
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold py-3 rounded-lg shadow-lg hover:scale-105 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black/60 px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-white text-gray-900 font-semibold py-3 rounded-lg shadow-lg hover:scale-105 transition flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>

        <div className="mt-6 text-center">
          <span className="text-gray-400">Don't have an account?</span>
          <button
            onClick={() => navigate('/signup')}
            className="ml-2 text-yellow-400 hover:underline font-semibold"
            type="button"
            tabIndex={0}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
