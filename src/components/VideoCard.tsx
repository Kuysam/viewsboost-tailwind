import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import VideoActions from './VideoActions';
import CommentsModal from './CommentsModal';

interface VideoCardProps {
  id: string;
  thumbnail: string;
  title: string;
}

export default function VideoCard({ id, thumbnail, title }: VideoCardProps) {
  const { darkMode } = useTheme();
  const [isHovering, setIsHovering] = useState(false);
  const navigate = useNavigate();
  const previewDelay = 500; // 500ms delay before showing preview
  let hoverTimer: NodeJS.Timeout;
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleMouseEnter = () => {
    hoverTimer = setTimeout(() => {
      setIsHovering(true);
    }, previewDelay);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer);
    setIsHovering(false);
  };

  const handleClick = () => {
    navigate(`/video/${id}`);
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-lg ${
        darkMode ? 'bg-black/40' : 'bg-black/20'
      } backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Thumbnail/Preview Container */}
      <div className="relative aspect-video">
        {isHovering ? (
          <iframe
            className="w-full h-full absolute inset-0 z-10"
            src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&loop=1&playlist=${id}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <img 
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Video Info */}
      <div className={`p-3 ${darkMode ? 'bg-black/20' : ''}`}>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">
            {title}
          </h3>
        </div>
      </div>

      {/* Actions (Like, Share, Comments) */}
      <VideoActions videoId={id} videoUrl={`https://www.youtube.com/watch?v=${id}`} />
      <button
        className="absolute bottom-2 right-2 z-20 p-1 bg-black/60 rounded-full hover:bg-yellow-500"
        title="Comments"
        onClick={e => { e.stopPropagation(); setCommentsOpen(true); }}
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </button>
      <CommentsModal videoId={id} open={commentsOpen} onClose={() => setCommentsOpen(false)} />

      {/* Hover Overlay */}
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isHovering ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 