// src/pages/Shorts.tsx - Updated to remove the duplicate navigation bar
import React, { useState, useEffect, useRef } from 'react';
import { getVideos, Video } from '../lib/services/videoService';
import { useSwipeable } from 'react-swipeable';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Heart, MessageSquare, Share2, Volume2, VolumeX } from 'lucide-react';
import YouTube, { YouTubeEvent } from 'react-youtube';

interface SwipeVideo {
  id: string;
  title: string;
  embedUrl: string;
}

export default function Shorts() {
  // ─── Grid State ───────────────────────────────────────────────────────
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingGrid, setLoadingGrid] = useState(true);
  const [search, setSearch] = useState('');

  // ─── Swipe State ──────────────────────────────────────────────────────
  const [swipeVideos, setSwipeVideos] = useState<SwipeVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rewardCountdown, setRewardCountdown] = useState(10);
  const [user] = useAuthState(auth);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(true);

  // Add effect to hide duplicate navigation
  useEffect(() => {
    // Function to remove duplicate navigation
    const hideExtraNav = () => {
      // Target the specific navigation elements based on the HTML you shared
      const allNavs = document.querySelectorAll('.flex.items-center.justify-between header nav, nav.flex.items-center');
      
      if (allNavs.length > 1) {
        // Only hide the duplicate (the second navigation)
        for (let i = 1; i < allNavs.length; i++) {nnn
          const nav = allNavs[i] as HTMLElement;
          if (nav) {
            nav.style.display = 'none';
          }
        }
      }
      
      // Also try to find any other duplicate navigation by their location
      const possibleDuplicates = document.querySelectorAll('.flex.items-center.gap-1');
      possibleDuplicates.forEach((el) => {
        const element = el as HTMLElement;
        // Check if this is likely a navigation menu
        const hasLinks = element.querySelectorAll('a[href="/home"], a[href="/shorts"]').length > 0;
        if (hasLinks) {
          // We're in the shorts page and found a nav with home/shorts links
          // This is likely the duplicate we want to hide
          element.style.display = 'none';
        }
      });
    };
    
    // Run on component mount and after a slight delay to ensure DOM is ready
    hideExtraNav();
    const timeoutId = setTimeout(hideExtraNav, 200);
    
    // Clean up
    return () => clearTimeout(timeoutId);
  }, []);

  // ─── Load & classify shorts ────────────────────────────────────────────
  useEffect(() => {
    getVideos()
      .then(all => {
        // Show all videos with duration under 4 minutes as shorts
        const shorts = all.filter(v => v.duration > 0 && v.duration < 240);
        setVideos(shorts);
        setSwipeVideos(
          shorts.map(v => ({
            id: v.id,
            title: v.title,
            embedUrl: `https://www.youtube.com/embed/${v.id}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${v.id}`,
          }))
        );
      })
      .catch(err => console.error('Error loading shorts:', err))
      .finally(() => setLoadingGrid(false));
  }, []);

  // ─── Reward Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (swipeVideos.length === 0) return;

    setRewardCountdown(10);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setRewardCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          rewardUser();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [currentIndex, swipeVideos]);

  const rewardUser = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        shortsCoins: increment(1),
      });
      console.log('Rewarded user +1 coin');
    } catch (err) {
      console.error('Reward error:', err);
    }
  };

  // ─── Swipe Handlers ────────────────────────────────────────────────────
  const swipeHandlers = useSwipeable({
    onSwipedUp: () => {
      if (currentIndex < swipeVideos.length - 1) {
        setCurrentIndex(i => i + 1);
      }
    },
    onSwipedDown: () => {
      if (currentIndex > 0) {
        setCurrentIndex(i => i - 1);
      }
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true,
    delta: 20,
    flickThreshold: 0.2,
    axis: 'y',
  });

  // ─── Autoplay Next Video ──────────────────────────────────────────────
  const onPlayerReady = (e: YouTubeEvent) => {
    playerRef.current = e.target;
  };

  const onPlayerStateChange = (e: YouTubeEvent) => {
    // 0 = ended
    if (e.data === window.YT?.PlayerState?.ENDED && currentIndex < swipeVideos.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Add inline CSS to hide duplicate navigation (optional, can be removed if not needed) */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Hide duplicate navigation in Shorts page */
        .flex.items-center.justify-between nav + nav,
        .flex.items-center.justify-between nav:not(:first-of-type),
        .flex.items-center.gap-1:not(:first-of-type) {
          display: none !important;
        }
        
        /* Target the specific navigation we saw in your HTML */
        .lucide.lucide-house, .lucide.lucide-film, .lucide.lucide-video {
          /* This won't hide the icons, but marks them for next selector */
          data-navbar-item: true;
        }
        
        /* If we find a navbar that's not the first with these icons, hide it */
        .flex:has(> a > div > [data-navbar-item]):not(:first-of-type) {
          display: none !important;
        }
      `}} />
      <div className="max-w-7xl mx-auto py-8">
        {/* Only show swipe view for Shorts */}
        {swipeVideos.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-300 mb-2">No shorts available</p>
              <p className="text-sm text-gray-500">Try again later or check your connection</p>
            </div>
          </div>
        ) : (
          <div
            {...swipeHandlers}
            className="h-[80vh] w-full bg-black rounded-2xl overflow-hidden relative"
          >
            {/* YouTube Embed with mute/unmute */}
            <YouTube
              videoId={swipeVideos[currentIndex].id}
              opts={{
                height: '100%',
                width: '100%',
                playerVars: {
                  autoplay: 1,
                  mute: isMuted ? 1 : 0,
                  controls: 0,
                  modestbranding: 1,
                  loop: 0,
                  rel: 0,
                },
              }}
              className="w-full h-full absolute inset-0"
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
            />
            {/* Mute/Unmute Button */}
            <button
              className="absolute top-4 right-4 z-30 bg-black/60 rounded-full p-2 hover:bg-black/80 transition"
              onClick={() => setIsMuted(m => !m)}
            >
              {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
            </button>
            {/* Video Progress Bar */}
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4 z-20">
              {swipeVideos.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full flex-1 max-w-16 ${
                    idx === currentIndex 
                      ? 'bg-yellow-400' 
                      : idx < currentIndex 
                        ? 'bg-white/50' 
                        : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            {/* Info & Countdown */}
            <div className="absolute bottom-12 left-4 z-20 space-y-1 max-w-[70%] p-4 rounded-xl bg-black/40 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white">
                {swipeVideos[currentIndex].title}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xs">
                  ⏳
                </div>
                <span className="text-yellow-400 font-medium">
                  Reward in: {rewardCountdown}s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}