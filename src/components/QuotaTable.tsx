import React from 'react';

interface QuotaTableProps {
  quotaUsed: number;
  quotaRemaining: number;
  loginCount: number;
}

export default function QuotaTable({ quotaUsed, quotaRemaining, loginCount }: QuotaTableProps) {
  return (
    <div className="overflow-auto bg-gray-900/70 rounded-lg shadow-xl">
      <table className="min-w-full text-center text-white">
        <thead>
          <tr className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
            <th className="py-4 px-6 font-semibold">Metric</th>
            <th className="py-4 px-6 font-semibold">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-700">
            <td className="py-3 px-6">Quota Used</td>
            <td className="py-3 px-6">{quotaUsed}</td>
          </tr>
          <tr className="border-t border-gray-700">
            <td className="py-3 px-6">Quota Remaining</td>
            <td className="py-3 px-6">{quotaRemaining}</td>
          </tr>
          <tr className="border-t border-gray-700">
            <td className="py-3 px-6">User Logins Today</td>
            <td className="py-3 px-6">{loginCount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
