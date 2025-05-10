// src/components/BaseLayout.tsx
import React, { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Newspaper, Palette, User, List, Settings } from 'lucide-react';
import UserAvatarDropdown from './UserAvatarDropdown';

interface BaseLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { label: 'Home',    to: '/home',    icon: <Home size={24} /> },
  { label: 'Shorts',  to: '/shorts',  icon: <Film size={24} /> },
  { label: 'Live',    to: '/live',    icon: <span className="block h-3 w-3 bg-red-600 rounded-full" /> },
  { label: 'News',    to: '/news',    icon: <Newspaper size={24} /> },
  { label: 'Studio',  to: '/studio',  icon: <Palette size={24} /> },
  { label: 'Profile', to: '/profile', icon: <User size={24} /> },
  { label: 'Feed',    to: '/feed',    icon: <List size={24} /> },
  { label: 'Settings',to: '/settings',icon: <Settings size={24} /> },
];

export default function BaseLayout({ children }: BaseLayoutProps) {
  const { pathname } = useLocation();
  const isHome    = pathname === '/home';
  const isLanding = pathname === '/';
  const isAuth    = pathname === '/auth' || pathname === '/signup';

  // hide all framing (header/sidebar) on landing + auth/signup
  const hideFrame = isLanding || isAuth;

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
  }, [dark]);

  // If we're on landing or auth pages, just render the background + children
  if (hideFrame) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center" />
        <div className="fixed inset-0 bg-black/60" />
        <div className="relative z-10 flex items-center justify-center p-4">
          {children}
        </div>
      </div>
    );
  }

  // Otherwise render full layout with header + optional sidebar
  return (
    <div className="relative min-h-screen">
      {/* Background layers */}
      <div className="fixed inset-0 bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center z-0" />
      <div className="fixed inset-0 bg-black/60 z-10" />

      <div className="relative z-20 flex min-h-screen">
        {/* Sidebar only on /home */}
        {isHome && (
          <aside
            className="hidden md:flex flex-col justify-between fixed inset-y-0 left-0 w-64
                       backdrop-blur-lg bg-white/5 dark:bg-black/20 p-6 space-y-6 rounded-r-3xl shadow-lg"
          >
            <nav className="flex-1 flex flex-col gap-4">
              {menuItems.map(({ label, to, icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition ${
                      active
                        ? 'bg-white/20 dark:bg-white/10'
                        : 'hover:bg-white/10 dark:hover:bg-white/20'
                    }`}
                  >
                    <div className={active ? 'text-yellow-400' : 'text-white'}>
                      {icon}
                    </div>
                    <span className={`text-lg font-semibold ${active ? 'text-yellow-400' : 'text-white'}`}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => setDark(d => !d)}
              className="self-center text-white hover:text-yellow-400 transition"
            >
              Toggle {dark ? 'Light' : 'Dark'}
            </button>
          </aside>
        )}

        {/* Main content area */}
        <div className={`flex-1 flex flex-col ${isHome ? 'md:pl-72' : ''}`}>
          {/* Header */}
          <header className="flex items-center justify-between p-4">
            <Link to="/home" className="flex items-center gap-2">
              <img src="/images/viewsboost-logo.png" alt="ViewsBoost" className="w-12 h-12" />
              <span className="text-3xl font-bold text-yellow-400">ViewsBoost</span>
            </Link>

            <div>
              <UserAvatarDropdown />
            </div>
          </header>

          {/* Page body */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
