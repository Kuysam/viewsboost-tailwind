// src/components/LandingPage.tsx
import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  // Sync dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Video playlist
  const videoSources = [
    '/videos/video1.mp4',
    '/videos/video2.mp4',
    '/videos/video3.mp4',
    '/videos/video4.mp4',
    '/videos/video5.mp4',
    '/videos/video6.mp4',
  ];
  const refs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)];

  useEffect(() => {
    refs.forEach((ref, group) => {
      let idx = 0;
      const playNext = () => {
        const el = ref.current;
        if (!el) return;
        el.src = videoSources[group * 3 + idx];
        el
          .play()
          .catch(err => {
            if (!(err instanceof DOMException && err.name === 'AbortError')) {
              console.error('Video error', err);
            }
          });
        el.onended = () => {
          idx = (idx + 1) % 3;
          playNext();
        };
      };
      playNext();
    });
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center overflow-hidden">
      {/* dark overlay */}
      {darkMode && <div className="absolute inset-0 bg-black/60 z-10" />}

      {/* HEADER */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-4">
        {/* Logo + Title */}
        <Link to="/" className="flex items-center">
          {/* Logo: 3× bigger than before (was w-8 h-8) */}
          <img src="/images/viewsboost-logo.png" alt="ViewsBoost" className="w-24 h-24" />
          {/* Text in same yellow as your buttons */}
          <span className="ml-3 font-extrabold text-3xl text-yellow-400">
            ViewsBoost
          </span>
        </Link>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link
            to="/auth"
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* HERO TEXT */}
      <div className="relative z-20 pt-32 text-center px-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          Welcome to <span className="text-yellow-400">ViewsBoost</span>
        </h1>
        <p className="mt-4 text-lg text-gray-300">
          Revolutionize YouTube growth with AI‑powered views, engagement, and earnings.
        </p>
      </div>

      {/* PHONE MOCKUPS */}
      <div className="relative z-20 flex flex-col md:flex-row items-center justify-center min-h-screen px-6 mt-40 gap-20">
        {refs.map((ref, i) => (
          <div
            key={i}
            className="relative w-[300px] md:w-[360px] h-[660px]"
            style={{ perspective: '1200px' }}
          >
            <div
              className="absolute inset-0 rounded-[2rem] border-[6px] border-black shadow-2xl overflow-hidden"
              style={{
                transform: 'rotateY(-10deg) rotateX(5deg)',
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center',
              }}
            >
              <video ref={ref} autoPlay muted playsInline className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
