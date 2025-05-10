//   src/components/DailyPlaylist.tsx
import React from 'react';

interface DailyPlaylistProps {
  items: any[];
}

export default function DailyPlaylist({ items }: DailyPlaylistProps) {
  return (
    <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
      {/* TODO: implement your Daily Playlist strip */}
      <span className="text-gray-500">DailyPlaylist placeholder</span>
    </div>
  );
}

