import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { quotaService, QuotaData } from '../../lib/services/quotaService';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminQuota() {
  const [activeView, setActiveView] = useState<'table' | 'graph'>('table');
  const [quotaData, setQuotaData] = useState<QuotaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const [newQuota, setNewQuota] = useState<number | ''>('');

  useEffect(() => {
    const unsubscribe = quotaService.subscribeToQuota((data) => {
      setQuotaData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white/10 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Quota Usage Logs</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView('table')}
            className={`px-4 py-2 rounded transition-colors ${
              activeView === 'table' 
                ? 'bg-yellow-500 text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setActiveView('graph')}
            className={`px-4 py-2 rounded transition-colors ${
              activeView === 'graph' 
                ? 'bg-yellow-500 text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Graph
          </button>
        </div>
      </div>

      {activeView === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-4 text-white">Timestamp</th>
                <th className="p-4 text-white">Quota Used</th>
                <th className="p-4 text-white">Quota Remaining</th>
              </tr>
            </thead>
            <tbody>
              {quotaData.map((data, index) => (
                <tr key={index} className="border-b border-white/10">
                  <td className="p-4 text-gray-300">{formatTimestamp(data.timestamp)}</td>
                  <td className="p-4 text-yellow-400">{data.quotaUsed.toLocaleString()}</td>
                  <td className="p-4 text-green-400">{data.quotaRemaining.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-96">
          <Line
            data={{
              labels: quotaData.map(d => d.timestamp),
              datasets: [
                {
                  label: 'Quota Used',
                  data: quotaData.map(d => d.quotaUsed),
                  borderColor: '#EAB308',
                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                  fill: true,
                  tension: 0.1,
                },
                {
                  label: 'Quota Remaining',
                  data: quotaData.map(d => d.quotaRemaining),
                  borderColor: '#4ADE80',
                  backgroundColor: 'rgba(74, 222, 128, 0.1)',
                  fill: true,
                  tension: 0.1,
                }
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                  },
                },
                x: {
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                  },
                  ticks: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    maxRotation: 45,
                    minRotation: 45,
                  },
                },
              },
              plugins: {
                legend: {
                  labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                  },
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                }
              },
            }}
          />
        </div>
      )}
    </div>
  );
} 