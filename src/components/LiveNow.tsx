import React, { useEffect, useState } from 'react';
import { getVideos } from '../lib/services/videoService';

export default function LiveNow() {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVideos()
      .then(data => {
        // Filter for live videos and ensure they are NOT shorts (i.e., duration >= 4 minutes)
        const liveStreams = data.filter(v => v.type === 'live' && v.duration >= 240);
        setStreams(liveStreams);
      })
      .catch(() => setStreams([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white">Loading live streams...</div>;
  if (!streams.length) return <div className="text-yellow-300">No live streams right now.</div>;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">Live Now</h2>
      <div className="flex gap-4 overflow-x-auto">
        {streams.map((stream, idx) => (
          <div key={stream.id} className="w-64 h-36 bg-red-600 rounded-lg shadow-lg relative flex-shrink-0">
            <span className="absolute top-2 left-2 bg-red-700 text-white px-2 py-1 rounded text-xs animate-pulse">LIVE</span>
            <div className="bg-black bg-opacity-60 h-full flex items-end rounded-lg">
              <p className="text-white p-3 text-sm">{stream.title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
