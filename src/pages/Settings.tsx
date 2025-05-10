import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Settings() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl text-yellow-400 font-bold mb-4">⚙️ Settings</h1>
      <button
        onClick={handleLogout}
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition"
      >
        Logout
      </button>
      {/* Add more settings options here as needed */}
    </div>
  );
} 