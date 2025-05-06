import React from 'react';

interface UserActivityProps {
  activeSubsection: string;
}

export default function UserActivity({ activeSubsection }: UserActivityProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-6">User Activity & Growth</h2>
      
      {activeSubsection === 'daily-logins' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Daily Logins Graph</h3>
          {/* Add login graph implementation */}
        </div>
      )}

      {activeSubsection === 'new-users' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">New Users Registered</h3>
          {/* Add new users stats */}
        </div>
      )}

      {activeSubsection === 'watch-time' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Watch Time Analytics</h3>
          {/* Add watch time analytics */}
        </div>
      )}

      {activeSubsection === 'active-users' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Top Active Users</h3>
          {/* Add active users list */}
        </div>
      )}
    </div>
  );
} 