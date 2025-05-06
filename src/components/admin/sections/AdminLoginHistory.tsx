import React, { useState, useEffect } from 'react';
import { adminService } from '../../../lib/services/adminService';

export default function AdminLoginHistory() {
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoginHistory();
  }, []);

  const loadLoginHistory = async () => {
    try {
      const history = await adminService.getLoginHistory();
      setLoginHistory(history);
    } catch (error) {
      console.error('Error loading login history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-6">
      <h2 className="text-xl font-bold text-white mb-4">Admin Login History</h2>
      
      {loading ? (
        <div className="text-yellow-500">
        </div>
      ) : (
        <div className="text-white">
          {/* Render your login history component here */}
        </div>
      )}
    </div>
  );
} 