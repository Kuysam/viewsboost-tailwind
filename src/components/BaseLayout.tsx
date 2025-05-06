import React, { useEffect, useState } from 'react';
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BaseLayoutProps {
  children: ReactNode;
}

export default function BaseLayout({ children }: BaseLayoutProps) {
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // 🔐 Secret Admin Shortcut: Ctrl + Shift + A
    const handleKey = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        const { getAuth } = await import('firebase/auth');
        const user = getAuth().currentUser;
        if (user?.email === 'cham212003@gmail.com') {
          window.location.href = '/admin-panel-237abc'; // or your protected route
        } else {
          alert('Unauthorized: This shortcut is for admin only.');
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dark]);

  // Determine which nav items to show
  let navItems: { label: string; to: string }[] = [];
  if (location.pathname === '/') {
    navItems = [
      { label: 'Sign In', to: '/auth' },
      { label: 'Sign Up', to: '/signup' },
    ];
  } else if (
    location.pathname.startsWith('/creator') ||
    location.pathname.startsWith('/viewer') ||
    location.pathname.startsWith('/video')
  ) {
    navItems = [];
  } else {
    navItems = [
      { label: 'Home', to: '/' },
      { label: 'Disclaimer', to: '/disclaimer' },
    ];
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-[#181818] via-[#232526] to-[#0a0a0a] overflow-hidden text-white">
      {/* Logo */}
      {!(location.pathname.startsWith('/viewer') || location.pathname.startsWith('/creator') || location.pathname.startsWith('/video')) && (
        <div className="absolute top-4 left-4 flex items-center z-20 opacity-80">
          <img src="/images/viewsboost-logo.png" alt="ViewsBoost" className="w-24 drop-shadow-lg" />
          <span className="ml-2 text-2xl font-bold text-yellow-400">ViewsBoost</span>
        </div>
      )}

      {/* Conditional nav links */}
      {navItems.length > 0 && (
        <div className="absolute top-4 right-4 flex gap-4 z-50 items-center">
          <button
            onClick={() => setDark((d) => !d)}
            className="bg-gray-900 text-yellow-400 font-bold py-2 px-4 rounded-lg shadow hover:scale-105 transition border border-yellow-400"
            title="Toggle dark mode"
          >
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          {navItems.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 font-semibold font-bold py-2 px-4 rounded-lg shadow-md hover:scale-105 transition text-gray-900"
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      {/* Page content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
