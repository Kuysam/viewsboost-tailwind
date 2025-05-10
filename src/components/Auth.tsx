// src/components/Auth.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { userStatsService } from '../lib/services/userStats';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ChevronLeft, Mail, Lock } from 'lucide-react';

// **NEW** import the Google "G" icon
import { FcGoogle } from 'react-icons/fc';

const ADMIN_EMAIL = 'cham212003@gmail.com';
const ADMIN_PASSWORD = '212003Cham212003Kuysam!!';

export default function Auth() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) navigate('/home');
      else setCheckingAuth(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // admin login...
      }
      await signInWithEmailAndPassword(auth, email, password);
      await userStatsService.trackLogin();
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  const handleGmail = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // enforce @gmail.com
      const userEmail = result.user.email || '';
      if (!userEmail.toLowerCase().endsWith('@gmail.com')) {
        await signOut(auth);
        throw new Error('Please sign in with a Gmail account');
      }

      // Check if user exists in viewers or creators
      const viewerDoc = await getDoc(doc(db, 'viewers', result.user.uid));
      const creatorDoc = await getDoc(doc(db, 'creators', result.user.uid));
      if (!viewerDoc.exists() && !creatorDoc.exists()) {
        await signOut(auth);
        setError('No account found. Please sign up first.');
        return;
      }

      // User exists, proceed as before
      await userStatsService.trackLogin();
      navigate('/home');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gmail sign‑in failed. Please try again.');
    }
  };

  if (checkingAuth || loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }
  if (user) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full max-w-md bg-black/60 backdrop-blur-md p-8 rounded-lg text-white shadow-2xl">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          aria-label="Go back"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center drop-shadow-sm">
          Login to ViewsBoost
        </h2>

        {/* **UPDATED** Google button uses FcGoogle */}
        <button
          onClick={handleGmail}
          className="w-full mb-4 flex items-center justify-center gap-2 py-3 bg-white rounded-lg shadow hover:shadow-lg transition text-gray-900 font-medium"
        >
          <FcGoogle size={24} />
          Continue with Gmail
        </button>

        <div className="my-4 flex items-center">
          <div className="flex-1 h-px bg-gray-500/30" />
          <span className="px-3 text-gray-400 text-sm">or sign in with email</span>
          <div className="flex-1 h-px bg-gray-500/30" />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Gmail address"
              className="w-full pl-10 pr-4 py-3 rounded bg-white/10 focus:ring-2 focus:ring-yellow-500 placeholder-gray-400"
              required
            />
            <Mail
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 rounded bg-white/10 focus:ring-2 focus:ring-yellow-500 placeholder-gray-400"
              required
            />
            <Lock
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="text-right">
            <Link to="/reset-password" className="text-sm text-gray-400 hover:text-white">
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold py-3 rounded-lg shadow-lg hover:scale-105 transition"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400 text-sm">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-yellow-400 hover:underline">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
