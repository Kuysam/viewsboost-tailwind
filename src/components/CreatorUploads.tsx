import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVideos } from '../lib/services/videoService';
import YouTube from 'react-youtube';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  type: string;
}

export default function CreatorUploads() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<number>();

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await getVideos();
        // Only show normal videos, not shorts or live
        setVideos(data.filter(v => v.type !== 'short'));
      } catch (err) {
        console.error('Failed to load creator videos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
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

  if (loading) return <div className="text-white">Loading creator uploads...</div>;
  if (!videos.length) return <div className="text-yellow-300">No videos uploaded yet.</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-yellow-400">Creator Uploads</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map(video => (
          <div
            key={video.id}
            onClick={() => navigate(`/video/${video.id}`)}
            className="bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:scale-105 transition transform duration-200 cursor-pointer relative"
            onMouseEnter={() => handleMouseEnter(video.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative">
              {hoveredVideoId === video.id ? (
                <div className="absolute inset-0 z-10">
                  <YouTube
                    videoId={video.id}
                    opts={opts}
                    className="w-full h-48"
                  />
                </div>
              ) : (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs text-white">
                {isNaN(video.duration) || video.duration <= 0
                  ? 'Unknown'
                  : `${Math.floor(video.duration / 60)}m ${video.duration % 60}s`}
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-semibold text-white truncate">{video.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
