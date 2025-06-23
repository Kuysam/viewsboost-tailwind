import React from 'react';
import RelatedVideoCard from './RelatedVideoCard';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  [key: string]: any;
}

interface VideoGridProps {
  videos: Video[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  if (!videos?.length) {
    return <div className="text-gray-400">No videos found.</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map(video => (
        <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold text-white">{video.title}</h3>
            <p className="text-gray-400 text-sm">Duration: {video.duration}s</p>
          </div>
        </div>
      ))}
    </div>
  );
} 