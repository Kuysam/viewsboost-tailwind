// src/pages/EnhancedHome.tsx
import React, { useState, useEffect } from 'react';
import BaseLayout from '../components/BaseLayout';
import HeroCarousel from '../components/HeroCarousel';
import ContinueWatching from '../components/ContinueWatching';
import LiveNowMarquee from '../components/LiveNowMarquee';
import TrendingGrid from '../components/TrendingGrid';
import DailyPlaylist from '../components/DailyPlaylist';
import TopCreators from '../components/TopCreators';
import RewardsSnapshot from '../components/RewardsSnapshot';
import PollWidget from '../components/PollWidget';
import UpAndComingCreators from '../components/UpAndComingCreators';
import VideoGrid from '../components/VideoGrid';
import SearchBar from '../components/SearchBar';
import { getVideos, Video } from '../lib/services/videoService';

export default function EnhancedHome() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getVideos()
      .then(data => setVideos(data))
      .catch(err => console.error('Home load error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Split into shorts (< 60s) and standard (>= 60s)
  const shorts   = videos.filter(v => v.duration < 60);
  const standard = videos.filter(v => v.duration >= 60);

  // Apply search filter
  const filteredStandard = standard.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredShorts = shorts.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <BaseLayout>
      <div className="relative z-10 max-w-7xl mx-auto space-y-12 py-8">
        {/* 1) Hero carousel */}
        <section>
          <HeroCarousel items={filteredStandard.slice(0, 10)} />
        </section>

        {/* 2) Search bar */}
        <section>
          <SearchBar value={search} onChange={setSearch} />
        </section>

        {/* 3) Continue Watching + Live Now */}
        <section className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">
              Continue Watching
            </h2>
            <ContinueWatching items={filteredStandard.slice(0, 5)} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">
              Live Now
            </h2>
            <LiveNowMarquee streams={[]} />
          </div>
        </section>

        {/* 4) Trending Globally */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            Trending Globally
          </h2>
          <TrendingGrid items={filteredStandard.slice(0, 8)} />
        </section>

        {/* 5) Daily Playlist & Top Creators */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Your Daily Playlist
            </h2>
            <DailyPlaylist items={filteredStandard.slice(5, 10)} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Top Creators You Might Like
            </h2>
            <TopCreators creators={[]} />
          </div>
        </section>

        {/* 6) Rewards + Poll */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-8 bg-black/30 p-6 rounded-lg">
          <RewardsSnapshot balance={1240} />
          <PollWidget pollId="daily-theme" />
        </section>

        {/* 7) Up‑and‑Coming Creators */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            Up‑and‑Coming Creators
          </h2>
          <UpAndComingCreators creators={[]} />
        </section>

        {/* 8) Main Video Grid (standard videos) */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            All Videos
          </h2>
          {loading ? (
            <div className="text-center text-gray-300">Loading videos…</div>
          ) : (
            <VideoGrid videos={filteredStandard} />
          )}
        </section>
      </div>
    </BaseLayout>
  );
}
