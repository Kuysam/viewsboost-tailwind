// src/components/RelatedVideoCard.tsx
import { useState, useRef, useEffect } from 'react';
import { Video } from '../lib/services/videoService';
import { useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';

interface Props {
  video: Video;
}

export default function RelatedVideoCard({ video }: Props) {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeoutRef = useRef<number>();

  const handleMouseEnter = () => {
    setIsHovering(true);
    // Add a small delay before showing the preview to prevent flickering
    hoverTimeoutRef.current = window.setTimeout(() => {
      if (isHovering) {
        setShowPreview(true);
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
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

  const opts = {
    height: '120',
    width: '144',
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
      className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-800 transition cursor-pointer relative"
      onClick={() => navigate(`/video/${video.id}`)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-36 h-20">
        {showPreview ? (
          <div className="absolute inset-0 z-10">
            <YouTube
              videoId={video.id}
              opts={opts}
              className="w-full h-full rounded-md"
            />
          </div>
        ) : (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover rounded-md"
          />
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-white line-clamp-2">{video.title}</h4>
        <p className="text-xs text-gray-400 mt-1">
          Duration: {Math.round(video.duration / 60)} min
        </p>
      </div>
    </div>
  );
}
