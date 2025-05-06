import React, { useState } from 'react';

interface VideoActionsProps {
  videoId: string;
  videoUrl: string;
}

export default function VideoActions({ videoId, videoUrl }: VideoActionsProps) {
  const [liked, setLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => !prev);
    // TODO: Optionally send like to backend or YouTube API
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: 'Check out this video!',
        url: videoUrl,
      });
    } else {
      navigator.clipboard.writeText(videoUrl);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex gap-2 absolute top-2 right-2 z-20">
      <button
        onClick={handleLike}
        className={`p-1 rounded-full bg-black/60 hover:bg-yellow-500 transition-colors`}
        title="Like"
      >
        <svg
          className={`w-5 h-5 ${liked ? 'text-yellow-400' : 'text-white'}`}
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            strokeWidth="2"
          />
        </svg>
      </button>
      <button
        onClick={handleShare}
        className="p-1 rounded-full bg-black/60 hover:bg-yellow-500 transition-colors"
        title="Share"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v14" />
        </svg>
      </button>
    </div>
  );
} 