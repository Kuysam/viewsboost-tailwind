//    src/components/RewardsSnapshot.tsx
import React from 'react';

interface RewardsSnapshotProps {
  items: any[];
}

export default function RewardsSnapshot({ items }: RewardsSnapshotProps) {
  return (
    <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
      {/* TODO: implement your Rewards Snapshot strip */}
      <span className="text-gray-500">RewardsSnapshot placeholder</span>
    </div>
  );
}
