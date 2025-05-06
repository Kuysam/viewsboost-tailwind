import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { userAnalyticsService } from '../../../lib/services/userAnalyticsService';

export default function UserActivityDashboard() {
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [newUserStats, setNewUserStats] = useState({ today: 0, thisWeek: 0 });
  const [watchTimeStats, setWatchTimeStats] = useState({ today: 0, thisWeek: 0 });
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      const [stats, newUsers, watchTime, activeUsers] = await Promise.all([
        userAnalyticsService.getDailyLoginStats(timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90),
        userAnalyticsService.getNewUserStats(),
        userAnalyticsService.getWatchTimeStats(),
        userAnalyticsService.getTopActiveUsers(10)
      ]);

      setDailyStats(stats);
      setNewUserStats(newUsers);
      setWatchTimeStats(watchTime);
      setTopUsers(activeUsers);
    } catch (error) {
      console.error('Error loading user analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWatchTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-2 text-white">New Users Today</h3>
          <div className="text-3xl font-bold text-yellow-500">
            {newUserStats.today}
          </div>
        </div>
      </div>
    </div>
  );
} 