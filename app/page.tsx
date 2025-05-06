'use client';

import React, { useEffect, useState } from 'react';

interface ViewsResponse {
  views: number;
  error?: string;
}

export default function Home() {
  const [views, setViews] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchViews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/views');
      if (!response.ok) {
        throw new Error('Failed to fetch views');
      }
      const data: ViewsResponse = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setViews(data.views);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching views:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchViews();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-8">Views Counter</h1>
        {error ? (
          <p className="text-red-500 mb-4">Error: {error}</p>
        ) : (
          <p className="text-2xl mb-4">
            {isLoading ? 'Loading...' : `Total Views: ${views}`}
          </p>
        )}
        <button
          onClick={fetchViews}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Views'}
        </button>
      </div>
    </main>
  );
} 