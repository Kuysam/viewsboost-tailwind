import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

interface QuotaChartProps {
  quotaUsed: number;
  quotaRemaining: number;
  loginCount: number;
}

export default function QuotaChart({ quotaUsed, quotaRemaining, loginCount }: QuotaChartProps) {
  const data = {
    labels: ['Quota Used', 'Quota Remaining', 'User Logins'],
    datasets: [
      {
        label: 'API Quota and User Logins',
        data: [quotaUsed, quotaRemaining, loginCount],
        fill: true,
        backgroundColor: 'rgba(255,165,0,0.2)',
        borderColor: 'rgba(255,165,0,1)',
        tension: 0.4,
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      x: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#fff' },
      },
    },
  };

  return (
    <div className="w-full bg-gray-900/70 rounded-lg p-4 shadow-xl" style={{ height: '400px' }}>
      <Line data={data} options={options} />
    </div>
  );
}
