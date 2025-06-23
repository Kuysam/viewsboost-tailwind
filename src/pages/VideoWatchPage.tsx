// src/pages/VideoWatchPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import YouTube from 'react-youtube';
import type { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { getVideoById, getVideos } from '../lib/services/videoService';
import { getVideoComments } from '../lib/youtube';
import { auth, db } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import RelatedVideoCard from '../components/RelatedVideoCard';
import { BASE_URL, getNextApiKey } from '../lib/youtube';
import { recordWatchProgress } from '../lib/services/watchHistoryService';
import { storeVideoMetadata } from '../lib/services/storeVideoMetadata';

// Declare YT global
declare global {
  interface Window {
    YT: {
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
  }
}

interface VideoMeta {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
}

export default function VideoWatchPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [related, setRelated] = useState<VideoMeta[]>([]);
  const [comments, setComments] = useState<
    { id: string; author: string; text: string; publishedAt: string }[]
  >([]);
  const [appViews, setAppViews] = useState(0);
  const [ytViews, setYtViews] = useState<number | null>(null);
  const [ytDurationSec, setYtDurationSec] = useState<number | null>(null);
  const [lastPosition, setLastPosition] = useState<number>(0);
  const [totalWatched, setTotalWatched] = useState<number>(0);

  const hasTrackedRef = useRef(false);
  const playerRef = useRef<any>(null);
  const watchStartTimeRef = useRef<number | null>(null);
  const lastProgressUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!videoId) return;

    // Load watch history
    const loadWatchHistory = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      
      const ref = doc(db, 'userWatchHistory', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const entry = snap.data().entries?.[videoId];
        if (entry) {
          setLastPosition(entry.lastPosition || 0);
          setTotalWatched(entry.totalWatched || 0);
        }
      }
    };

    loadWatchHistory();

    // 1) fetch our Firestore metadata
    getVideoById(videoId).then(async (data) => {
      // Fallback: If title is missing or 'Unknown Title', fetch from YouTube API
      if (!data?.title || data.title === 'Unknown Title') {
        try {
          const url = `${BASE_URL}/videos?part=snippet&id=${videoId}&key=${getNextApiKey()}`;
          const res = await fetch(url);
          const ytData = await res.json();
          const item = ytData.items?.[0];
          if (item) {
            const ytTitle = item.snippet.title;
            setVideo({
              id: videoId,
              title: ytTitle,
              thumbnail: item.snippet.thumbnails?.high?.url || data.thumbnail,
              duration: data.duration,
            });
            return;
          }
        } catch (err) {
          // ignore, fallback to data
        }
      }
      setVideo(data);
      if (data) {
        await storeVideoMetadata(data); // 🟡 Ensure it's saved properly for WatchHistory
      }
    });

    // 2) fetch YouTube stats + contentDetails
    (async () => {
      try {
        const url = `${BASE_URL}/videos?part=statistics,contentDetails&id=${videoId}&key=${getNextApiKey()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`YT ${res.status}`);
        const data = await res.json();
        const item = data.items?.[0];
        if (item?.statistics?.viewCount) {
          setYtViews(+item.statistics.viewCount);
        }
        const iso = item?.contentDetails?.duration as string;
        if (iso) {
          const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (m) {
            const h = +m[1] || 0,
              mm = +m[2] || 0,
              s = +m[3] || 0;
            setYtDurationSec(h * 3600 + mm * 60 + s);
          }
        }
      } catch (e) {
        console.error('YT stats err', e);
      }
    })();

    // 3) related from our service
    getVideos()
      .then((all) => all.filter((v) => v.id !== videoId).slice(0, 6))
      .then(setRelated)
      .catch(console.error);

    // 4) comments
    getVideoComments(videoId).then(setComments).catch(console.error);

    // 5) track ViewsBoost
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const ref = doc(db, 'videos', videoId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          views: 1,
          watchTime: 0,
          lastViewed: serverTimestamp(),
        });
        setAppViews(1);
      } else {
        const prev = (snap.data().views as number) || 0;
        await updateDoc(ref, {
          views: increment(1),
          lastViewed: serverTimestamp(),
        });
        setAppViews(prev + 1);
      }
    })();
  }, [videoId]);

  const effectiveSec =
    ytDurationSec != null
      ? ytDurationSec
      : video && video.duration > 0
      ? video.duration
      : null;
  const formattedDuration =
    effectiveSec != null
      ? `${Math.floor(effectiveSec / 60)}m ${effectiveSec % 60}s`
      : 'Unknown';

  if (!video) {
    return <div className="text-center text-white">Loading video...</div>;
  }

  const ytOpts: YouTubePlayer = {
    height: '480',
    width: '100%',
    playerVars: {
      autoplay: 1,
      start: Math.floor(lastPosition),
    },
  };

  const onPlayerReady = (e: YouTubeEvent) => {
    playerRef.current = e.target;
    if (lastPosition > 0) {
      e.target.seekTo(lastPosition);
    }
  };

  const onPlayerStateChange = (e: YouTubeEvent) => {
    if (e.data === window.YT.PlayerState.PLAYING) {
      if (!hasTrackedRef.current) {
        hasTrackedRef.current = true;
        watchStartTimeRef.current = Date.now();
      }
      
      // Update progress every 5 seconds
      const now = Date.now();
      if (now - lastProgressUpdateRef.current >= 5000) {
        lastProgressUpdateRef.current = now;
        const current = e.target.getCurrentTime();
        const dur = e.target.getDuration();
        const progress = Math.min(current / dur, 1);
        const uid = auth.currentUser?.uid;
        if (uid) {
          const newTotalWatched = totalWatched + (now - (watchStartTimeRef.current || now)) / 1000;
          setTotalWatched(newTotalWatched);
          recordWatchProgress(uid, video.id, progress, current, newTotalWatched);
        }
      }
    } else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) {
      const current = e.target.getCurrentTime();
      const dur = e.target.getDuration();
      const progress = Math.min(current / dur, 1);
      const uid = auth.currentUser?.uid;
      if (uid && watchStartTimeRef.current) {
        const newTotalWatched = totalWatched + (Date.now() - watchStartTimeRef.current) / 1000;
        setTotalWatched(newTotalWatched);
        recordWatchProgress(uid, video.id, progress, current, newTotalWatched);
      }
    }
  };

  return (
    <div className="p-4 text-white max-w-screen-xl mx-auto">
      {/* ─── PLAYER ───────────────────────────────────────────── */}
      <div className="mb-6">
        <YouTube
          videoId={video.id}
          opts={ytOpts}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
        />
        <h1 className="text-2xl font-bold mt-4">{video.title}</h1>
        <p className="text-sm text-yellow-300">
          ViewsBoost Views: {appViews.toLocaleString()}
        </p>
        {ytViews != null && (
          <p className="text-sm text-blue-400">
            YouTube Views: {ytViews.toLocaleString()}
          </p>
        )}
        <p className="text-sm text-gray-400">Duration: {formattedDuration}</p>
      </div>

      {/* ─── POST A COMMENT ───────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Post a Comment</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={''}
            readOnly
            className="flex-grow p-2 rounded bg-gray-800 text-white"
          />
          <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded">
            Post
          </button>
        </div>
      </div>

      {/* ─── YOUTUBE COMMENTS ─────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">YouTube Comments</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {comments.map((c, i) => (
            <div key={i} className="bg-gray-800 p-3 rounded">
              <p className="font-semibold">{c.author}</p>
              <p className="text-sm">{c.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── RELATED VIDEOS ──────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Related Videos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {related.map((v) => (
            <RelatedVideoCard key={v.id} video={{...v, type: 'video' as const}} />
          ))}
        </div>
      </div>
    </div>
  );
}
