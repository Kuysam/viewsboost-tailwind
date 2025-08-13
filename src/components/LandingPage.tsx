// src/components/LandingPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';


export default function LandingPage() {
  const navigate = useNavigate();
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


  // Use public videos (served from /public/videos)
  const videoSources = [
    '/videos/video1.mp4',
    '/videos/video2.mp4',
    '/videos/video3.mp4',
    '/videos/video4.mp4',
    '/videos/video5.mp4',
    '/videos/video6.mp4',
  ];
  const videoRefs = Array.from({ length: 2 }, () => useRef<HTMLVideoElement>(null));


  useEffect(() => {
    const playSequential = (ref: any, group: number) => {
      let i = 0;
      const playNext = () => {
        if (!ref.current) return;
        ref.current.src = videoSources[group * 3 + i];
       // Suppress play() promise errors
       const playPromise = ref.current.play();
       if (playPromise && typeof playPromise.catch === 'function') {
         playPromise.catch(() => {});
       }
        ref.current.onended = () => {
          i = (i + 1) % 3;
          playNext();
        };
      };
      playNext();
    };
    playSequential(videoRefs[0], 0);
    playSequential(videoRefs[1], 1);
  }, []);


  return (
    <div className="relative w-full min-h-screen bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center text-white overflow-hidden">


      {/* Hero Section */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 text-center px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-2xl mb-4">
          Welcome to <span className="text-yellow-400">ViewsBoost</span>
        </h1>
        <p className="text-lg md:text-xl bg-black/60 px-6 py-3 rounded-lg shadow-lg">
          Revolutionize YouTube growth with AI-powered views, engagement, and earnings.
        </p>
       <div className="mt-6 space-x-4">
          <button
            onClick={() => navigate('/get-started')}
           className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition"
          >
            Get Started
          </button>
         <button
           onClick={() => navigate('/sign-in')}
           className="bg-white/10 backdrop-blur-md text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-white/20 transition"
         >
           Sign In
         </button>
        </div>
      </div>


      {/* Phones Section */}
      <div className="relative z-30 flex flex-col md:flex-row items-center justify-center min-h-screen px-6 mt-40 gap-[80px]">
        {videoRefs.map((ref, i) => (
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
              <video
                ref={ref}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



