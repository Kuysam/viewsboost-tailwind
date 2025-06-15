// src/components/UserAvatarDropdown.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  ChevronDown,
  User,
  Settings,
  Video,
  BarChart2,
  Bell,
  LogOut,
  History,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../lib/auth';

export default function UserAvatarDropdown() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<{ displayName: string; photoURL: string } | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch basic profile data
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (!user) return;
      // Try users, then creators, then viewers
      let snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) snap = await getDoc(doc(db, 'creators', user.uid));
      if (!snap.exists()) snap = await getDoc(doc(db, 'viewers', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          displayName: data.displayName || data.firstName + ' ' + data.lastName || 'User',
          photoURL: data.photoURL || '/images/avatar-placeholder.png',
        });
      }
    })();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSignOut = async () => {
    await logoutUser();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <img
          src={profile?.photoURL || '/images/avatar-placeholder.png'}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover ring-2 ring-yellow-400"
        />
        <ChevronDown className={`w-5 h-5 text-white transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-black/90 backdrop-blur-lg rounded-lg shadow-xl text-white z-50 overflow-hidden animate-fade-in">
          {/* Profile Overview */}
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <img
                src={profile?.photoURL || '/images/avatar-placeholder.png'}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{profile?.displayName || 'Loading...'}</p>
                <p className="text-sm text-gray-300">Member since 2023</p>
              </div>
            </div>
          </div>

          <ul className="p-2 space-y-1">
            <li>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center w-full px-3 py-2 rounded hover:bg-white/10 transition"
              >
                <User className="w-5 h-5 mr-2" /> My Profile
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate('/studio')}
                className="flex items-center w-full px-3 py-2 rounded hover:bg-white/10 transition"
              >
                <Video className="w-5 h-5 mr-2" /> My Videos
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate('/history/watch')}
                className="flex items-center w-full px-3 py-2 rounded hover:bg-white/10 transition"
              >
                <History className="w-5 h-5 mr-2" /> Watch History
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate('/history/search')}
                className="flex items-center w-full px-3 py-2 rounded hover:bg-white/10 transition"
              >
                <Search className="w-5 h-5 mr-2" /> Search History
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate('/analytics')}
                className="flex items-center w-full px-3 py-2 rounded hover:bg-white/10 transition"
              >
                <BarChart2 className="w-5 h-5 mr-2" /> Analytics
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate('/notifications')}
                className="flex items-center w-full px-3 py-2 rounded hover:bg-white/10 transition"
              >
                <Bell className="w-5 h-5 mr-2" /> Notifications
              </button>
            </li>

            <li>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center w-full px-3 py-2 rounded hover:bg-white/10 transition"
              >
                <Settings className="w-5 h-5 mr-2" /> Settings
              </button>
            </li>
          </ul>

          <div className="border-t border-white/20">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 rounded hover:bg-red-600 transition text-red-400"
            >
              <LogOut className="w-5 h-5 mr-2" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
