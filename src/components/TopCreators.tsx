//    src/components/TopCreators.tsx
import React from 'react';

interface TopCreatorsProps {
  items: any[];
}

export default function TopCreators({ items }: TopCreatorsProps) {
  return (
    <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
      {/* TODO: implement your Top Creators strip */}
      <span className="text-gray-500">TopCreators placeholder</span>
    </div>
  );
}

