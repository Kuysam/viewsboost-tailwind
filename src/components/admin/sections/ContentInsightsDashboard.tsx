import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { contentAnalyticsService } from '../../../lib/services/contentAnalyticsService';

export default function ContentInsightsDashboard() {
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [topChannels, setTopChannels] = useState<any[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      const [videos, channels, retention] = await Promise.all([
        contentAnalyticsService.getTrendingVideos(timeRange),
        contentAnalyticsService.getTopChannels(),
        contentAnalyticsService.getRetentionAnalytics(7)
      ]);

      setTrendingVideos(videos);
      setTopChannels(channels);
      setRetentionData(retention);
    } catch (error) {
      console.error('Error loading content insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 rounded ${
                timeRange === range
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Videos */}
      <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-6">
        <h3 className="text-xl font-semibold mb-4 text-white">🔥 Trending Videos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendingVideos.map((video) => (
            <div key={video.videoId} className="flex space-x-4 bg-white/5 rounded-lg p-4">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-32 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="text-white font-medium mb-1 truncate">{video.title}</h4>
                <p className="text-gray-400 text-sm">{video.creatorName}</p>
                <div className="flex space-x-4 mt-2 text-sm">
                  <span className="text-yellow-500">{video.views.toLocaleString()} views</span>
                  <span className="text-blue-400">{formatDuration(video.watchTime)} watch time</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Channels */}
      <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-6">
        <h3 className="text-xl font-semibold mb-4 text-white">🔥 Top Channels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topChannels.map((channel) => (
            <div key={channel.creatorId} className="flex space-x-4 bg-white/5 rounded-lg p-4">
              <img
                src={channel.profilePic}
                alt={channel.creatorName}
                className="w-32 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="text-white font-medium mb-1 truncate">{channel.creatorName}</h4>
                <p className="text-gray-400 text-sm">{channel.totalViews.toLocaleString()} views</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention Analytics */}
      <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-6">
        <h3 className="text-xl font-semibold mb-4 text-white">🔥 Retention Analytics</h3>
        <div className="h-[300px]">
          <Line
            data={{
              labels: retentionData.map(data => data.timestamp.toDate().toLocaleDateString()),
              datasets: [
                {
                  label: 'Completion Rate',
                  data: retentionData.map(data => data.completionRate),
                  borderColor: 'rgb(255, 99, 132)',
                  backgroundColor: 'rgba(255, 99, 132, 0.5)',
                },
                {
                  label: 'Bounce Rate',
                  data: retentionData.map(data => data.bounceRate),
                  borderColor: 'rgb(54, 162, 235)',
                  backgroundColor: 'rgba(54, 162, 235, 0.5)',
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Retention Analytics',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 