import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  onWatchTimeUpdate?: (seconds: number) => void;
  onViewRecorded?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({ videoId, onWatchTimeUpdate, onViewRecorded }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [viewRecorded, setViewRecorded] = useState(false);

  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayer = useRef<any>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const viewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = createPlayer;
    }
    // Cleanup
    return () => {
      if (ytPlayer.current) {
        ytPlayer.current.destroy();
      }
    };
    // eslint-disable-next-line
  }, [videoId]);

  // Create the YouTube player
  const createPlayer = () => {
    if (!playerRef.current) return;
    ytPlayer.current = new window.YT.Player(playerRef.current, {
      videoId,
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
      playerVars: {
        enablejsapi: 1,
        origin: window.location.origin,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        controls: 0,
        fs: 1,
      },
    });
  };

  // Player event handlers
  const onPlayerReady = (event: any) => {
    setIsLoading(false);
    setDuration(event.target.getDuration());
    setCurrentTime(event.target.getCurrentTime());
    setIsMuted(event.target.isMuted());
    // Start interval to update current time
    const interval = setInterval(() => {
      if (ytPlayer.current && ytPlayer.current.getCurrentTime) {
        setCurrentTime(ytPlayer.current.getCurrentTime());
        setDuration(ytPlayer.current.getDuration());
      }
    }, 500);
    watchTimeIntervalRef.current = interval;
  };

  const onPlayerStateChange = (event: any) => {
    // 1 = playing, 2 = paused, 0 = ended
    if (event.data === 1) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const onPlayerError = (event: any) => {
    setError('Failed to load video');
    setIsLoading(false);
  };

  // Watch time and view recording
  useEffect(() => {
    if (isPlaying && !viewRecorded) {
      watchTimeIntervalRef.current = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          onWatchTimeUpdate?.(newTime);
          return newTime;
        });
      }, 1000);
      viewTimeoutRef.current = setTimeout(() => {
        setViewRecorded(true);
        onViewRecorded?.();
      }, 30000);
    }
    return () => {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current);
      }
      if (viewTimeoutRef.current) {
        clearTimeout(viewTimeoutRef.current);
      }
    };
  }, [isPlaying, viewRecorded, onWatchTimeUpdate, onViewRecorded]);

  // Controls visibility
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Custom controls
  const togglePlay = () => {
    if (!ytPlayer.current) return;
    if (isPlaying) {
      ytPlayer.current.pauseVideo();
    } else {
      ytPlayer.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!ytPlayer.current) return;
    if (isMuted) {
      ytPlayer.current.unMute();
      setIsMuted(false);
    } else {
      ytPlayer.current.mute();
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && playerRef.current) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ytPlayer.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTo = percent * duration;
    ytPlayer.current.seekTo(seekTo, true);
    setCurrentTime(seekTo);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="aspect-video bg-black/60 rounded-lg flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div 
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
        </div>
      )}

      {/* YouTube Player */}
      <div ref={playerRef} className="w-full h-full" />

      {/* Custom controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className="h-1 bg-white/20 rounded-full mb-2 cursor-pointer" onClick={handleProgressBarClick}>
          <div 
            className="h-full bg-yellow-400 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-yellow-400 transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={toggleMute}
              className="text-white hover:text-yellow-400 transition-colors"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-yellow-400 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
          </button>
        </div>
      </div>

      {/* Watch time indicator */}
      {viewRecorded && (
        <div className="absolute top-4 right-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-sm">
          View Recorded
        </div>
      )}
    </div>
  );
} 