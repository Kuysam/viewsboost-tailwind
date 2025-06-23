// src/pages/WatchHistoryPage.tsx

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { getVideoById, Video } from '../lib/services/videoService';
import { BASE_URL, getNextApiKey } from '../lib/youtube';
import YouTube from 'react-youtube';

interface WatchEntry {
  progress: number; // 0–1
  watchedAt: { seconds: number }; // Firestore timestamp
  lastPosition: number; // Last position in seconds
  totalWatched: number; // Total time watched in seconds
}

export default function WatchHistoryPage() {
  const [videos, setVideos] = useState<
    (Video & { 
      progress: number; 
      watchedAt: number;
      lastPosition: number;
      totalWatched: number;
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<number>();

  const parseISODuration = (iso: string) => {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    const h = +m[1] || 0, mm = +m[2] || 0, s = +m[3] || 0;
    return h * 3600 + mm * 60 + s;
  };

  useEffect(() => {
    const loadHistory = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'userWatchHistory', user.uid));
        if (!snap.exists()) {
          setVideos([]);
          return;
        }

        const rawMap = snap.data().entries as Record<string, WatchEntry>;
        const entries = Object.entries(rawMap || {}).map(([videoId, value]) => ({
          videoId,
          progress: value.progress || 0,
          watchedAt: value.watchedAt?.seconds || 0,
          lastPosition: value.lastPosition || 0,
          totalWatched: value.totalWatched || 0,
        }));

        entries.sort((a, b) => b.watchedAt - a.watchedAt);

        const full = await Promise.all(
          entries.map(async (e) => {
            let video = await getVideoById(e.videoId);
            if (!video.duration || !video.thumbnail) {
              try {
                const url = `${BASE_URL}/videos?part=snippet,contentDetails&id=${e.videoId}&key=${getNextApiKey()}`;
                const res = await fetch(url);
                const data = await res.json();
                const item = data.items?.[0];
                if (item) {
                  video = {
                    id: e.videoId,
                    title: item.snippet.title,
                    thumbnail:
                      item.snippet.thumbnails.high?.url ||
                      `https://img.youtube.com/vi/${e.videoId}/hqdefault.jpg`,
                    duration: parseISODuration(item.contentDetails.duration),
                    type: 'video' as const,
                  };
                }
              } catch (err) {
                console.error('Fallback failed:', err);
              }
            }

            return {
              ...video,
              progress: e.progress,
              watchedAt: e.watchedAt,
              lastPosition: e.lastPosition,
              totalWatched: e.totalWatched,
            };
          })
        );

        setVideos(full);
      } catch (err) {
        console.error('Failed to load watch history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleMouseEnter = (videoId: string) => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredVideoId(videoId);
    }, 300);
  };

  const handleMouseLeave = () => {
    setHoveredVideoId(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const opts = {
    height: '192',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      mute: 1,
    },
  };

  if (loading) {
    return <div className="text-white p-4">Loading Watch History…</div>;
  }
  if (!videos.length) {
    return <div className="text-yellow-400 p-4">No watch history found.</div>;
  }

  return (
    <div className="p-4 text-white max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6">Watch History</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((v) => {
          const mins = Math.floor(v.duration / 60);
          const secs = v.duration % 60;
          const pct = Math.round(v.progress * 100);
          const watchedMins = Math.floor(v.totalWatched / 60);
          const watchedSecs = Math.floor(v.totalWatched % 60);
          const lastPosMins = Math.floor(v.lastPosition / 60);
          const lastPosSecs = Math.floor(v.lastPosition % 60);

          return (
            <div
              key={v.id}
              onClick={() => navigate(`/video/${v.id}`)}
              className="bg-zinc-900 rounded-lg overflow-hidden shadow-md hover:scale-105 transition-transform cursor-pointer relative"
              onMouseEnter={() => handleMouseEnter(v.id)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="relative">
                {hoveredVideoId === v.id ? (
                  <div className="absolute inset-0 z-10">
                    <YouTube
                      videoId={v.id}
                      opts={opts}
                      className="w-full h-48"
                    />
                  </div>
                ) : (
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                  <div
                    className="h-1 bg-yellow-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="absolute bottom-1 right-1 text-xs bg-black bg-opacity-70 px-1 py-0.5 rounded">
                  {mins}:{secs.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-white truncate">{v.title}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-400">
                    Watched: {watchedMins}m {watchedSecs}s
                  </p>
                  <p className="text-xs text-gray-400">
                    Last position: {lastPosMins}:{lastPosSecs.toString().padStart(2, '0')}
                  </p>
                  <p className="text-xs text-yellow-400">
                    Progress: {pct}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
