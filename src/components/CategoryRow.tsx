// src/components/CategoryRow.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export interface CategoryItem {
  id: string;
  thumbnail: string;
  label: string;
  previewUrl?: string; // optional hover-preview video URL
}

interface CategoryRowProps {
  items: CategoryItem[];
}

export default function CategoryRow({ items }: CategoryRowProps) {
  if (!items || items.length === 0) {
    return <div className="text-gray-400 italic px-4">No videos found.</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex space-x-4 overflow-x-auto px-4">
        {items.map(item => (
          <Link
            to={`/video/${item.id}`}
            key={item.id}
            className="flex-shrink-0 outline-none focus:ring-4 focus:ring-yellow-400 rounded-lg"
          >
            <VideoCard item={item} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function VideoCard({ item }: { item: CategoryItem }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative w-40 h-56 rounded-lg overflow-hidden bg-gray-800 transform transition duration-200 hover:scale-105"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && item.previewUrl ? (
        <video
          src={item.previewUrl}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
        />
      ) : (
        <img
          src={item.thumbnail}
          alt={item.label}
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute bottom-0 w-full bg-black/50 text-white text-sm p-1">
        {item.label}
      </div>
    </div>
  );
}
