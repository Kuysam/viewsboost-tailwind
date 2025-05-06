import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { youtubeQuotaService } from '../../../lib/services/youtubeQuotaService';

export default function YoutubeQuotaDashboard() {
  const [quotaData, setQuotaData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = youtubeQuotaService.subscribeToQuotaUpdates((data) => {
      setQuotaData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getTotalQuotaUsed = () => {
    return quotaData.reduce((total, item) => total + item.quotaUsed, 0);
  };

  const getQuotaRemaining = () => {
    return 10000 - getTotalQuotaUsed();
  };

  const getQuotaPercentage = () => {
    return (getTotalQuotaUsed() / 10000) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Today's Usage</h3>
          <div className="text-3xl font-bold text-yellow-500">
            {getTotalQuotaUsed().toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Quota points used</div>
        </div>

        <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Remaining Quota</h3>
          <div className="text-3xl font-bold text-green-500">
            {getQuotaRemaining().toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Points available</div>
        </div>

        <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-2 text-white">Usage Level</h3>
          <div className={`text-3xl font-bold ${
            getQuotaPercentage() > 80 ? 'text-red-500' :
            getQuotaPercentage() > 50 ? 'text-yellow-500' :
            'text-green-500'
          }`}>
            {getQuotaPercentage().toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Of daily limit</div>
        </div>
      </div>

      {/* Usage Graph */}
      <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Historical Usage</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTimeRange('24h')}
              className={`px-3 py-1 rounded ${
                selectedTimeRange === '24h'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/10 text-white'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => setSelectedTimeRange('7d')}
              className={`px-3 py-1 rounded ${
                selectedTimeRange === '7d'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/10 text-white'
              }`}
            >
              7d
            </button>
            <button
              onClick={() => setSelectedTimeRange('30d')}
              className={`px-3 py-1 rounded ${
                selectedTimeRange === '30d'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/10 text-white'
              }`}
            >
              30d
            </button>
          </div>
        </div>

        <div className="h-80">
          <Line
            data={{
              labels: quotaData.map(d => new Date(d.timestamp.toDate()).toLocaleString()),
              datasets: [
                {
                  label: 'Quota Usage',
                  data: quotaData.map(d => d.quotaUsed),
                  borderColor: 'rgb(255, 99, 132)',
                  backgroundColor: 'rgba(255, 99, 132, 0.5)',
                  fill: false
                }
              ]
            }}
          />
        </div>
      </div>
    </div>
  );
} 