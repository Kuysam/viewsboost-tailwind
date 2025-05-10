import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const defaultAvatar = '/images/default-avatar.png';

export default function UserAvatarDropdown() {
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      if (!user) return;
      let docSnap = await getDoc(doc(db, 'viewers', user.uid));
      if (!docSnap.exists()) {
        docSnap = await getDoc(doc(db, 'creators', user.uid));
      }
      if (docSnap.exists()) setUserData(docSnap.data());
    }
    fetchUser();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div className="fixed top-4 right-6 z-50" ref={dropdownRef}>
      <button
        className="w-12 h-12 rounded-full border-2 border-yellow-400 bg-black shadow-lg focus:outline-none transition-transform hover:scale-105"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open user menu"
      >
        <img
          src={userData?.photoURL || defaultAvatar}
          alt="User avatar"
          className="w-full h-full rounded-full object-cover"
        />
      </button>
      {/* Dropdown */}
      <div
        className={`absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-lg rounded-xl shadow-lg border border-yellow-400 p-4 transition-all duration-200 ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ minWidth: 280 }}
      >
        {/* Profile Overview */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={userData?.photoURL || defaultAvatar}
            alt="Avatar"
            className="w-16 h-16 rounded-full border-2 border-yellow-400 object-cover"
          />
          <div>
            <div className="text-lg font-bold">{userData?.displayName || user.displayName || 'No Name'}</div>
            <div className="text-gray-400 text-sm">{user.email}</div>
            <div className="text-gray-300 text-xs mt-1">{userData?.bio || 'No bio yet.'}</div>
            <div className="flex gap-2 mt-2 text-xs text-yellow-300">
              <span>Followers: {userData?.followers?.length || 0}</span>
              <span>•</span>
              <span>Videos: {userData?.videos?.length || 0}</span>
            </div>
          </div>
        </div>
        <hr className="border-yellow-400/30 my-2" />
        {/* Menu Options */}
        <div className="space-y-2">
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-yellow-400/10 transition font-semibold"
            onClick={() => { setOpen(false); navigate('/profile'); }}
          >
            👤 Full Profile
          </button>
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-yellow-400/10 transition font-semibold"
            onClick={() => { setOpen(false); navigate('/settings'); }}
          >
            ⚙️ Account Settings
          </button>
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-yellow-400/10 transition font-semibold"
            onClick={() => { setOpen(false); navigate('/studio'); }}
          >
            🎬 My Videos & Drafts
          </button>
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-yellow-400/10 transition font-semibold"
            onClick={() => { setOpen(false); navigate('/analytics'); }}
          >
            📊 Creator Analytics
          </button>
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-yellow-400/10 transition font-semibold"
            onClick={() => { setOpen(false); navigate('/notifications'); }}
          >
            🔔 Notifications
          </button>
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-yellow-400/10 transition font-semibold text-red-400"
            onClick={async () => { await signOut(auth); setOpen(false); navigate('/auth'); }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
} 