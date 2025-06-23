import { useState, useEffect, useRef } from 'react';
import type { Video } from '../lib/services/videoService';
import YouTube from 'react-youtube';

interface SpotlightVideo {
  video: Video;
  reason: string;
}

interface SpotlightCarouselProps {
  videos: SpotlightVideo[];
}

function getBestThumbnail(video: Video) {
  // Try maxresdefault, fallback to hqdefault
  return `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
}

export default function SpotlightCarousel({ videos }: SpotlightCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const timerRef = useRef<number | null>(null);
  const hoverTimeoutRef = useRef<number>();
  const hasVideos = videos && videos.length > 0;

  // Auto-advance every 3 seconds unless paused
  useEffect(() => {
    if (!hasVideos || isPaused) return;
    timerRef.current = window.setTimeout(() => {
      setCurrent((c) => (c === videos.length - 1 ? 0 : c + 1));
    }, 3000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [current, isPaused, hasVideos, videos.length]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setShowPreview(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    setShowPreview(false);
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

  const handlePrev = () => setCurrent((c) => (c === 0 ? videos.length - 1 : c - 1));
  const handleNext = () => setCurrent((c) => (c === videos.length - 1 ? 0 : c + 1));

  if (!hasVideos) {
    return (
      <div className="w-full h-[450px] rounded-lg overflow-hidden shadow-xl relative bg-gradient-to-r from-gray-900 via-black to-gray-900 mb-8 flex items-center justify-center">
        <video autoPlay loop muted className="w-full h-full object-cover absolute inset-0 opacity-70">
          <source src="/videos/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Just For You</h1>
          <p className="text-gray-200 mt-2">AI-powered personalized video recommendations.</p>
        </div>
      </div>
    );
  }

  const { video, reason } = videos[current];
  const thumbnailUrl = getBestThumbnail(video);

  const opts = {
    height: '450',
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

  return (
    <div
      className="w-full h-[450px] rounded-lg overflow-hidden shadow-xl relative bg-gradient-to-r from-gray-900 via-black to-gray-900 mb-8"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {showPreview ? (
        <div className="absolute inset-0 z-0">
          <YouTube
            videoId={video.id}
            opts={opts}
            className="w-full h-full"
          />
        </div>
      ) : (
        <img
          src={thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover absolute inset-0 opacity-90"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      <div className="absolute bottom-8 left-8 flex flex-col gap-4 z-10 max-w-xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-yellow-400 text-black font-bold px-3 py-1 rounded-full text-xs shadow">{reason}</span>
        </div>
        <h1 className="text-3xl font-bold text-white drop-shadow-lg line-clamp-2">{video.title}</h1>
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg shadow-lg text-lg flex items-center gap-2 w-fit"
          onClick={() => window.location.assign(`/video/${video.id}`)}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Watch Now
        </button>
      </div>
      {/* Carousel Controls */}
      {videos.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-20"
            onClick={handlePrev}
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-20"
            onClick={handleNext}
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
      {/* Dots */}
      {videos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {videos.map((_, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full ${i === current ? 'bg-yellow-400' : 'bg-white/30'} transition`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
