// src/components/ContinueWatching.tsx
import React from 'react';

interface ContinueWatchingProps {
  items: any[];
}

export default function ContinueWatching({ items }: ContinueWatchingProps) {
  return (
    <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
      {/* TODO: implement your Continue Watching strip */}
      <span className="text-gray-500">ContinueWatching placeholder</span>
    </div>
  );
}
