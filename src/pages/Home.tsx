// src/pages/Home.tsx
import React, { useEffect, useState } from 'react';
import { getVideos } from '../lib/services/videoService';
import VideoGrid from '../components/VideoGrid';

interface VideoItem { /* ... */ }

export default function Home() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetched = await getVideos();
        setVideos(fetched);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load videos.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400">🎥 ViewsBoost Feed</h1>

      {loading && <p className="text-center text-gray-300">Loading videos...</p>}
      {error && <p className="text-center text-red-400">{error}</p>}

      {!loading && videos.length > 0 ? (
        <VideoGrid videos={videos} />
      ) : !loading && !error ? (
        <p className="text-center text-gray-400">No videos available yet.</p>
      ) : null}
    </div>
  );
}
