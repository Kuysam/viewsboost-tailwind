import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { Video } from '../lib/services/videoService';
import { useNavigate } from 'react-router-dom';

interface Props {
  videos?: Video[];
}

export default function DailyPicks({ videos = [] }: Props) {
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<number>();
  const navigate = useNavigate();

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

  const handleVideoClick = (videoId: string) => {
    console.log(`Clicked Daily Pick video: ${videoId}`);
    navigate(`/video/${videoId}`);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const opts = {
    height: '144',
    width: '256',
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

  // Filter out shorts (videos under 4 minutes)
  const filteredVideos = videos.filter(video => video.type !== 'short');

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">Daily Picks</h2>
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {filteredVideos.length === 0 && (
          <div className="text-gray-400">No daily picks available.</div>
        )}
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="w-64 h-36 rounded-lg shadow-lg flex-shrink-0 relative overflow-hidden"
            onMouseEnter={() => handleMouseEnter(video.id)}
            onMouseLeave={handleMouseLeave}
          >
            {hoveredVideoId === video.id ? (
              <div className="absolute inset-0 z-10">
                <YouTube
                  videoId={video.id}
                  opts={opts}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            )}
            <div
              className="absolute inset-0 z-30 cursor-pointer"
              onClick={() => handleVideoClick(video.id)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white text-sm font-medium line-clamp-2">{video.title}</h3>
                <p className="text-gray-300 text-xs mt-1">
                  Duration: {Math.round(video.duration / 60)} min
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
