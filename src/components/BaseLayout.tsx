// src/components/BaseLayout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserAvatarDropdown from './UserAvatarDropdown';
import { auth } from '../lib/firebase';
import {
  Home,
  Video,
  CircleDot,
  Newspaper,
  Paintbrush,
  User,
  List,
  Settings,
} from 'lucide-react';
import { getVideos } from '../lib/services/videoService';
import type { Video as VideoType } from '../lib/services/videoService';

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<VideoType[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Search effect
  useEffect(() => {
    if (search.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearchLoading(true);
    getVideos().then((videos) => {
      const filtered = videos.filter((v) =>
        v.title.toLowerCase().includes(search.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 8));
      setShowResults(true);
      setSearchLoading(false);
    });
  }, [search]);

  // Hide results on navigation
  useEffect(() => {
    setShowResults(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 shadow-md bg-black/80 backdrop-blur-sm z-50 relative">
        {/* Left: Menu + Logo */}
        <div className="flex items-center space-x-4">
          {isLoggedIn && (
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-4 py-1 rounded-lg shadow hover:opacity-90 transition"
            >
              Menu <span className="ml-1">⋮</span>
            </button>
          )}

          <div className="flex items-center space-x-2">
            <img src="/images/viewsboost-logo.png" alt="Logo" className="h-10 w-10" />
            <span className="text-xl font-bold text-yellow-400">ViewsBoost</span>
          </div>
        </div>

        {/* Right: Avatar */}
        <div className="relative">{isLoggedIn && <UserAvatarDropdown />}</div>

        {/* Sidebar Dropdown Menu */}
        {menuOpen && isLoggedIn && (
          <div className="absolute top-16 left-4 bg-zinc-900 rounded-xl shadow-lg w-56 p-4 z-50 space-y-4">
            <MenuItem icon={<Home size={20} />} label="Home" path="/dashboard" navigate={navigate} />
            <MenuItem icon={<Video size={20} />} label="Shorts" path="/shorts" navigate={navigate} />
            <MenuItem icon={<CircleDot size={20} className="text-red-500" />} label="Live" path="/live" navigate={navigate} highlight />
            <MenuItem icon={<Newspaper size={20} />} label="News" path="/news" navigate={navigate} />
            <MenuItem icon={<Paintbrush size={20} />} label="Studio" path="/studio" navigate={navigate} />
            <MenuItem icon={<User size={20} />} label="Profile" path="/profile/me" navigate={navigate} />
            <MenuItem icon={<List size={20} />} label="Feed" path="/feed" navigate={navigate} />
            <MenuItem icon={<Settings size={20} />} label="Settings" path="/settings" navigate={navigate} />
          </div>
        )}
      </header>

      {/* Search Bar for Dashboard/Homepage only */}
      {location.pathname === '/dashboard' && (
        <div className="flex flex-col items-center mt-6 relative z-30">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search videos, creators, topics..."
            className="w-full max-w-xl px-4 py-2 rounded-lg bg-zinc-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            autoComplete="off"
          />
          {showResults && (
            <div className="absolute top-12 w-full max-w-xl bg-zinc-900 rounded-lg shadow-lg border border-zinc-700 mt-2 overflow-hidden">
              {searchLoading ? (
                <div className="p-4 text-center text-gray-400">Searching…</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-400">No results found.</div>
              ) : (
                <ul>
                  {searchResults.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 cursor-pointer transition"
                      onClick={() => {
                        navigate(`/video/${v.id}`);
                        setShowResults(false);
                        setSearch('');
                      }}
                    >
                      <img
                        src={v.thumbnail || `/images/video-thumb-placeholder.png`}
                        alt={v.title}
                        className="w-14 h-8 object-cover rounded"
                      />
                      <span className="truncate text-sm">{v.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Page Content */}
      <main className="p-4">{children}</main>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  path,
  navigate,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  path: string;
  navigate: (path: string) => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={() => navigate(path)}
      className="flex items-center space-x-3 text-white hover:text-yellow-300 transition w-full text-left"
    >
      <span className={highlight ? 'text-red-500' : ''}>{icon}</span>
      <span className={highlight ? 'text-yellow-400 font-semibold' : 'text-gray-100'}>{label}</span>
    </button>
  );
}
