import React from 'react';
import RelatedVideoCard from './RelatedVideoCard';

export default function VideoGrid({ videos }) {
  if (!videos?.length) {
    return <div className="text-gray-400">No videos found.</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {videos.map(video => (
        <RelatedVideoCard key={video.id} video={video} />
      ))}
    </div>
  );
} 