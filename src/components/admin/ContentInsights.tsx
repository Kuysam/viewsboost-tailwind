import React from 'react';

interface ContentInsightsProps {
  activeSubsection: string;
}

export default function ContentInsights({ activeSubsection }: ContentInsightsProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-6">AI & Content Insights</h2>
      
      {activeSubsection === 'trending-videos' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Top Trending Videos</h3>
          {/* Add trending videos implementation */}
        </div>
      )}

      {activeSubsection === 'watched-channels' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Most Watched Channels</h3>
          {/* Add watched channels stats */}
        </div>
      )}
    </div>
  );
} 