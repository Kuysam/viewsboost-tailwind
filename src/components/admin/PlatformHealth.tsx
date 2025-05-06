import React, { useState, useEffect } from 'react';
import { platformHealthService } from '../../lib/services/platformHealthService';
import { 
  LineChart, 
  BarChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { AlertTriangle, Activity, Box, Users, RefreshCw, Clock, FileText } from 'lucide-react';

interface PlatformHealthProps {
  activeSubsection: string;
}

export default function PlatformHealth({ activeSubsection }: PlatformHealthProps) {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadPlatformHealth();
    const interval = setInterval(loadPlatformHealth, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [retryCount]);

  const loadPlatformHealth = async () => {
    try {
      setLoading(true);
      const data = await platformHealthService.getPlatformHealth();
      setHealthData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load platform health data:', err);
      setError('Failed to load platform health data');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const StatusIndicator = ({ status }: { status: 'healthy' | 'warning' | 'critical' }) => {
    const colors = {
      healthy: 'bg-green-500',
      warning: 'bg-yellow-500',
      critical: 'bg-red-500'
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colors[status]} animate-pulse`} />
        <span className="capitalize">{status}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
          <p className="text-gray-400">Loading platform health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'versions', label: 'Version Control', icon: Box },
    { id: 'errors', label: 'Error Logs', icon: AlertTriangle },
    { id: 'features', label: 'Feature Analytics', icon: Users }
  ];

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Platform & App Health</h2>
            <p className="text-gray-400 mt-1">Real-time monitoring and analytics</p>
          </div>
          <button 
            onClick={loadPlatformHealth}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* System Status Overview */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400">System Status</p>
                <StatusIndicator status={healthData.systemStatus.status} />
              </div>
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400">Current Version</p>
                <p className="text-xl font-semibold">{healthData.currentVersion.version}</p>
              </div>
              <Box className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400">24h Errors</p>
                <p className="text-xl font-semibold">{healthData.errorCount24h}</p>
              </div>
              <AlertTriangle className={`w-5 h-5 ${healthData.errorCount24h > 10 ? 'text-red-500' : 'text-yellow-500'}`} />
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400">Active Users</p>
                <p className="text-xl font-semibold">{healthData.activeUsers}</p>
              </div>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-4 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Add overview charts and metrics */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">System Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={healthData.performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    itemStyle={{ color: '#9CA3AF' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="responseTime" stroke="#3B82F6" name="Response Time" />
                  <Line type="monotone" dataKey="errorRate" stroke="#EF4444" name="Error Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="space-y-6">
            {/* Version distribution chart */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Version Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={healthData.versionInfo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="version" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    itemStyle={{ color: '#9CA3AF' }}
                  />
                  <Bar dataKey="activeUsers" fill="#3B82F6" name="Active Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Version details */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Version Details</h3>
              <div className="space-y-4">
                {healthData.versionInfo.map((version: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium">{version.version}</p>
                      <p className="text-sm text-gray-400">Released: {new Date(version.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-500">{version.activeUsers} users</p>
                      <p className="text-sm text-gray-400">{version.environment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add other tab contents similarly */}
      </div>
    </div>
  );
} 