import React, { useState } from 'react';
import { adminService } from '../../../lib/services/adminService';

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm) return;
    
    setLoading(true);
    try {
      const results = await adminService.searchUsers(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (uid: string, role: string) => {
    try {
      await adminService.updateUserRole(uid, role);
      // Refresh search results
      handleSearch();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleStatusUpdate = async (uid: string, status: 'active' | 'suspended' | 'banned') => {
    try {
      await adminService.updateUserStatus(uid, status);
      // Refresh search results
      handleSearch();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-6">
      <h2 className="text-xl font-bold text-white mb-4">User Management</h2>
      
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by email or UID"
          className="flex-1 p-3 rounded bg-white/10 focus:ring-2 focus:ring-yellow-500 placeholder-gray-400 text-white"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded hover:scale-105 transition-all duration-200"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-3 text-white">Email</th>
                <th className="text-left p-3 text-white">Role</th>
                <th className="text-left p-3 text-white">Status</th>
                <th className="text-left p-3 text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((user) => (
                <tr key={user.uid} className="border-b border-white/10">
                  <td className="p-3 text-gray-300">{user.email}</td>
                  <td className="p-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleUpdate(user.uid, e.target.value)}
                      className="bg-white/10 rounded p-1 text-white"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="creator">Creator</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      user.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(user.uid, 'active')}
                        className="px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(user.uid, 'suspended')}
                        className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(user.uid, 'banned')}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                      >
                        Ban
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 