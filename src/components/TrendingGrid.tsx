//  src/components/TrendingGrid.tsx
import React from 'react';

interface TrendingGridProps {
  items: any[];
}

export default function TrendingGrid({ items }: TrendingGridProps) {
  return (
    <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
      {/* TODO: implement your Trending Grid strip */}
      <span className="text-gray-500">TrendingGrid placeholder</span>
    </div>
  );
}

