import React from 'react';
import VideoCard from './VideoCard';

interface Video {
  id: string;
  thumbnail: string;
  title: string;
}

interface VideoGridProps {
  videos: Video[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 mt-16">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          id={video.id}
          thumbnail={video.thumbnail}
          title={video.title}
        />
      ))}
    </div>
  );
} 