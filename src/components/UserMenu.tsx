import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function UserMenu() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  // List of languages
  const languages = [
    'English', 'Español', 'Français', 'Deutsch', '中文', 'العربية',
    'Português', 'Русский', '日本語', '한국어'
  ];

  // Close dropdown when menu closes
  const handleMenuToggle = () => {
    setUserMenuOpen((open) => !open);
    setLanguageDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleMenuToggle}
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-2 rounded-lg shadow-md hover:scale-105 transition"
        aria-haspopup="true"
        aria-expanded={userMenuOpen}
        aria-label="Open user menu"
      >
        <span role="img" aria-label="Home">🏠</span>
      </button>
      {userMenuOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg z-30 border border-white/10">
          <ul className="py-1">
            <li
              onClick={() => { navigate('/viewer/profile'); setUserMenuOpen(false); }}
              className="px-4 py-3 hover:bg-white/10 cursor-pointer font-bold"
              tabIndex={0}
            >
              Profile
            </li>
            {/* Language Dropdown */}
            <li
              className="px-4 py-3 hover:bg-white/10 cursor-pointer font-bold relative"
              tabIndex={0}
              onClick={() => setLanguageDropdownOpen((open) => !open)}
              onBlur={() => setLanguageDropdownOpen(false)}
              aria-haspopup="true"
              aria-expanded={languageDropdownOpen}
            >
              Language: <span className="ml-1 text-yellow-400">{language}</span>
              {languageDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-gray-900/95 rounded-lg shadow-lg z-40">
                  {languages.map(lang => (
                    <div
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setLanguageDropdownOpen(false);
                        setUserMenuOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-yellow-500/20 cursor-pointer"
                      role="menuitem"
                      tabIndex={0}
                      aria-label={`Switch to ${lang}`}
                    >
                      {lang}
                    </div>
                  ))}
                </div>
              )}
            </li>
            <li className="px-4 py-3 hover:bg-white/10 cursor-pointer font-bold">
              Dark Mode
            </li>
            <li className="px-4 py-3 hover:bg-white/10 cursor-pointer font-bold">
              Location
            </li>
            <li className="px-4 py-3 hover:bg-white/10 cursor-pointer font-bold">
              Notification
            </li>
            <li
              onClick={async () => {
                await signOut(auth);
                setUserMenuOpen(false);
                navigate('/auth');
              }}
              className="px-4 py-3 hover:bg-white/10 cursor-pointer font-bold text-red-500"
              tabIndex={0}
            >
              Logout
            </li>
          </ul>
        </div>
      )}
    </div>
  );
} 