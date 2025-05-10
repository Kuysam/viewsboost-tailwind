import React, { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Film,
  Video,
  Newspaper,
  Palette,
  User,
  List,
  Settings
} from 'lucide-react';

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
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // hide sidebar/nav on the very first landing route
  const hideNav = location.pathname === '/';

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

  return (
    <div className="relative">
      {/* full-screen bg image */}
      <div className="fixed inset-0 bg-[url('/images/satin-phone-bg.png')] bg-fixed bg-cover bg-center z-0" />
      {/* dark overlay if in dark mode */}
      <div className={`fixed inset-0 ${dark ? 'bg-black/60' : 'bg-transparent'} z-10`} />

      <div className="relative z-20 flex min-h-screen">
        {/* SIDEBAR */}
        {!hideNav && (
          <aside className="
            hidden md:flex flex-col
            items-start justify-between
            fixed top-0 bottom-0 left-0
            w-64  
            bg-black/75 backdrop-blur-lg
            p-6 space-y-6
            rounded-r-3xl
            shadow-2xl
          ">
            <Link to="/home" className="self-center mb-8">
              <img src="/images/viewsboost-logo.png" alt="ViewsBoost" className="w-16" />
            </Link>

            <nav className="flex-1 flex flex-col gap-4">
              {menuItems.map(({ label, to, icon }) => {
                const isActive = location.pathname === to;
                const isLive = to === '/live';
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`
                      flex items-center gap-4
                      px-4 py-3
                      rounded-2xl
                      transition
                      ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}
                    `}
                  >
                    <div className={`
                      ${isLive ? '' : 'text-white'}
                      ${isActive && !isLive ? 'text-yellow-400' : ''}
                    `}>
                      {icon}
                    </div>
                    <span className={`
                      text-lg font-semibold
                      ${isLive
                        ? isActive
                          ? 'text-yellow-400'
                          : 'text-white'
                        : 'text-white'
                      }
                    `}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => setDark(d => !d)}
              className="self-center mt-auto text-white hover:text-yellow-400 transition"
            >
              Toggle {dark ? 'Light' : 'Dark'}
            </button>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main className={`flex-1 ${hideNav ? 'mx-auto w-full max-w-4xl' : 'ml-0 md:ml-64'}`}>
          {children}
        </main>

        {/* MOBILE TABS */}
        {!hideNav && (
          <nav className="fixed bottom-0 inset-x-0 bg-black/80 backdrop-blur py-2 flex justify-around items-center md:hidden z-20">
            {menuItems.map(({ to, icon }) => (
              <Link key={to} to={to} className="text-white">
                {icon}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
