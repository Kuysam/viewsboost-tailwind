import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getVideoById } from '../lib/services/videoService';
import { BASE_URL, getNextApiKey } from '../lib/youtube';
import YouTube from 'react-youtube';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  progress: number;
  lastPosition: number;
  totalWatched: number;
}

interface WatchHistoryEntry {
  progress: number;
  watchedAt: {
    seconds: number;
  };
  lastPosition: number;
  totalWatched: number;
}

interface WatchHistoryData {
  entries: {
    [videoId: string]: WatchHistoryEntry;
  };
}

function parseISODuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = +m[1] || 0, mm = +m[2] || 0, s = +m[3] || 0;
  return h * 3600 + mm * 60 + s;
}

export default function ContinueWatching() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<number>();

  useEffect(() => {
    const loadContinueWatching = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, 'userWatchHistory', user.uid);
        const snap = await getDoc(ref);
        
        if (!snap.exists()) {
          setVideos([]);
          return;
        }

        const data = snap.data() as WatchHistoryData;
        const entries = data.entries || {};
        const unwatchedVideos = Object.entries(entries)
          .filter(([_, entry]) => entry.progress < 0.95)
          .sort((a, b) => b[1].watchedAt.seconds - a[1].watchedAt.seconds)
          .slice(0, 6);

        const videosWithDetails = await Promise.all(
          unwatchedVideos.map(async ([videoId, entry]) => {
            let video = await getVideoById(videoId);
            // Fallback logic for missing thumbnail or duration
            if (!video.duration || !video.thumbnail) {
              try {
                const url = `${BASE_URL}/videos?part=snippet,contentDetails&id=${videoId}&key=${getNextApiKey()}`;
                const res = await fetch(url);
                const data = await res.json();
                const item = data.items?.[0];
                if (item) {
                  video = {
                    id: videoId,
                    title: item.snippet.title,
                    thumbnail:
                      item.snippet.thumbnails.high?.url ||
                      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    duration: parseISODuration(item.contentDetails.duration),
                  };
                }
              } catch (err) {
                // fallback to YouTube default thumbnail
                video.thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                video.duration = 0;
              }
            }
            return {
              ...video,
              progress: entry.progress,
              lastPosition: entry.lastPosition,
              totalWatched: entry.totalWatched,
            };
          })
        );

        setVideos(videosWithDetails);
      } catch (err) {
        console.error('Failed to load continue watching:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContinueWatching();
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
    height: '160',
    width: '288',
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
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">Continue Watching</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-72 bg-gray-800 rounded-lg shadow-lg flex-shrink-0 animate-pulse">
              <div className="h-40 bg-gray-700 rounded-t-lg" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!videos.length) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-yellow-400">Continue Watching</h2>
        <button 
          onClick={() => navigate('/history/watch')}
          className="text-sm text-gray-400 hover:text-yellow-400 transition-colors"
        >
          View All History →
        </button>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {videos.map((video) => {
          const pct = Math.round(video.progress * 100);
          const watchedMins = Math.floor(video.totalWatched / 60);
          const watchedSecs = Math.floor(video.totalWatched % 60);
          const lastPosMins = Math.floor(video.lastPosition / 60);
          const lastPosSecs = Math.floor(video.lastPosition % 60);

          return (
            <div
              key={video.id}
              onClick={() => navigate(`/video/${video.id}`)}
              className="w-72 bg-gray-800 rounded-lg shadow-lg flex-shrink-0 cursor-pointer transform hover:scale-105 transition-all duration-200 hover:shadow-xl group"
              onMouseEnter={() => handleMouseEnter(video.id)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="relative">
                {hoveredVideoId === video.id ? (
                  <div className="absolute inset-0 z-10">
                    <YouTube
                      videoId={video.id}
                      opts={opts}
                      className="w-full h-40 rounded-t-lg"
                    />
                  </div>
                ) : (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-200">
                    <svg 
                      className="w-6 h-6 text-black" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                  <div
                    className="h-1 bg-yellow-400 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs text-white">
                  {formatTime(video.duration)}
                </div>
                <div className="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs text-white">
                  {pct}% Watched
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-white font-semibold line-clamp-2 text-sm group-hover:text-yellow-400 transition-colors">
                  {video.title}
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-400">
                    <span className="w-24">Time Watched:</span>
                    <span className="text-blue-400">
                      {watchedMins}m {watchedSecs}s
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <span className="w-24">Continue from:</span>
                    <span className="text-green-400">
                      {lastPosMins}:{lastPosSecs.toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <button 
                  className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-1.5 px-4 rounded transition-colors flex items-center justify-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/video/${video.id}`);
                  }}
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Continue Watching
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
