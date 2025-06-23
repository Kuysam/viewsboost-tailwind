import { useState, useEffect, useRef, useCallback } from 'react';
import { Video } from '../types';

interface MobileVideoFeedProps {
  videos: Video[];
  onVideoChange?: (index: number) => void;
}

export default function MobileVideoFeed({ videos, onVideoChange }: MobileVideoFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  // Auto-advance videos like TikTok
  useEffect(() => {
    if (isPlaying && videos.length > 1) {
      const timer = setTimeout(() => {
        const nextIndex = (currentIndex + 1) % videos.length;
        setCurrentIndex(nextIndex);
        onVideoChange?.(nextIndex);
      }, 15000); // 15 seconds per video

      return () => clearTimeout(timer);
    }
  }, [currentIndex, isPlaying, videos.length, onVideoChange]);

  // Handle touch swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartY.current - touchEndY.current > 50) {
      // Swipe up - next video
      const nextIndex = Math.min(currentIndex + 1, videos.length - 1);
      setCurrentIndex(nextIndex);
      onVideoChange?.(nextIndex);
    }

    if (touchEndY.current - touchStartY.current > 50) {
      // Swipe down - previous video
      const prevIndex = Math.max(currentIndex - 1, 0);
      setCurrentIndex(prevIndex);
      onVideoChange?.(prevIndex);
    }
  }, [currentIndex, videos.length, onVideoChange]);

  // Toggle play/pause on tap
  const handleTap = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const currentVideo = videos[currentIndex];

  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading amazing content...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      {/* Video Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={currentVideo.thumbnail}
          alt={currentVideo.title}
          className="w-full h-full object-cover"
          style={{ filter: isPlaying ? 'brightness(1)' : 'brightness(0.7)' }}
        />
        
        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/30 rounded-full p-6">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* TikTok-Style Side Actions */}
      <div className="absolute right-4 bottom-20 flex flex-col space-y-6 z-10">
        {/* Like Button */}
        <button className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform">
          <div className="bg-black/30 rounded-full p-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-xs">Like</span>
        </button>

        {/* Share Button */}
        <button className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform">
          <div className="bg-black/30 rounded-full p-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </div>
          <span className="text-xs">Share</span>
        </button>

        {/* Download Button */}
        <button className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform">
          <div className="bg-black/30 rounded-full p-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xs">Save</span>
        </button>
      </div>

      {/* Bottom Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-8">
        <div className="text-white">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{currentVideo.title}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span>{currentVideo.duration}s</span>
            <span>•</span>
            <span className="capitalize">{currentVideo.type}</span>
            {currentVideo.viewCount && (
              <>
                <span>•</span>
                <span>{currentVideo.viewCount.toLocaleString()} views</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="absolute top-4 left-4 right-20 flex space-x-1 z-10">
        {videos.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index === currentIndex ? 'bg-yellow-400' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Swipe Indicators */}
      <div className="absolute top-1/2 right-2 transform -translate-y-1/2 text-white/50 text-xs">
        {currentIndex < videos.length - 1 && (
          <div className="flex flex-col items-center space-y-1 animate-bounce">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
            <span>Swipe</span>
          </div>
        )}
      </div>
    </div>
  );
}