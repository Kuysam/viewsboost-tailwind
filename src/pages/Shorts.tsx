// src/pages/Shorts.tsx
import React, { useState, useEffect, useRef } from 'react';
import BaseLayout from '../components/BaseLayout';
import SearchBar from '../components/SearchBar';
import VideoGrid from '../components/VideoGrid';
import { getVideos, Video } from '../lib/services/videoService';
import { useSwipeable } from 'react-swipeable';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

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

  // ─── Tabs ─────────────────────────────────────────────────────────────
  const tabs = ['Grid View', 'Swipe View'] as const;
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Grid View');

  // ─── Load & classify shorts ────────────────────────────────────────────
  useEffect(() => {
    getVideos()
      .then(all => {
        // define shorts as either <60s OR tagged “#shorts”
        const shorts = all.filter(
          v =>
            v.duration < 60 ||
            v.title.toLowerCase().includes('#shorts')
        );

        // grid gets those shorts
        setVideos(shorts);

        // swipe gets same list with embed URLs
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
    if (activeTab !== 'Swipe View' || swipeVideos.length === 0) return;

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
  }, [activeTab, currentIndex, swipeVideos]);

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
  });

  // ─── Grid filter ───────────────────────────────────────────────────────
  const filteredGrid = videos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <BaseLayout>
      <div className="max-w-7xl mx-auto py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === tab
                  ? 'bg-yellow-400 text-black'
                  : 'bg-black/30 text-white hover:bg-black/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid View */}
        {activeTab === 'Grid View' && (
          <>
            <SearchBar value={search} onChange={setSearch} />
            {loadingGrid ? (
              <div className="text-center text-gray-300">Loading shorts…</div>
            ) : (
              <VideoGrid videos={filteredGrid} />
            )}
          </>
        )}

        {/* Swipe View */}
        {activeTab === 'Swipe View' && (
          <div
            {...swipeHandlers}
            className="h-screen w-screen bg-black text-white overflow-hidden relative"
          >
            {swipeVideos.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                No shorts available.
              </div>
            ) : (
              <>
                {/* YouTube Embed */}
                <iframe
                  key={swipeVideos[currentIndex].id}
                  src={swipeVideos[currentIndex].embedUrl}
                  className="w-full h-full absolute inset-0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />

                {/* Info & Countdown */}
                <div className="absolute bottom-12 left-4 z-10 space-y-1">
                  <h2 className="text-lg font-bold">
                    {swipeVideos[currentIndex].title}
                  </h2>
                  <div className="mt-2 text-yellow-400 font-bold">
                    ⏳ Reward in: {rewardCountdown}s
                  </div>
                </div>

                {/* Actions */}
                <div className="absolute right-4 bottom-12 z-10 flex flex-col items-center gap-4">
                  <button className="bg-white bg-opacity-10 p-2 rounded-full hover:bg-opacity-30">
                    ❤️
                  </button>
                  <button className="bg-white bg-opacity-10 p-2 rounded-full hover:bg-opacity-30">
                    💬
                  </button>
                  <button className="bg-white bg-opacity-10 p-2 rounded-full hover:bg-opacity-30">
                    ↗️
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
