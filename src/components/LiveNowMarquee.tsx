
//  src/components/LiveNowMarquee.tsx
import React from 'react';

interface LiveNowMarqueeProps {
  items: any[];
}

export default function LiveNowMarquee({ items }: LiveNowMarqueeProps) {
  return (
    <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
      {/* TODO: implement your Live Now Marquee strip */}
      <span className="text-gray-500">LiveNowMarquee placeholder</span>
    </div>
  );
}


