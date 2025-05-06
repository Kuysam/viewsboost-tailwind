import React, { useEffect, useState } from 'react';

interface YouTubeCommentsProps {
  videoId: string;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  publishedAt: string;
}

export default function YouTubeComments({ videoId }: YouTubeCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComments() {
      setLoading(true);
      // TODO: Replace this with a real YouTube Data API call
      setTimeout(() => {
        setComments([
          {
            id: '1',
            author: 'Jane Doe',
            text: 'Awesome video!',
            publishedAt: '2024-06-01T12:00:00Z',
          },
          {
            id: '2',
            author: 'John Smith',
            text: 'Very informative, thanks!',
            publishedAt: '2024-06-01T13:00:00Z',
          },
        ]);
        setLoading(false);
      }, 1000);
    }
    fetchComments();
  }, [videoId]);

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4 text-white">Comments</h2>
      {loading ? (
        <div className="text-gray-400">Loading comments...</div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="font-semibold text-yellow-400">{comment.author}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {new Date(comment.publishedAt).toLocaleString()}
                </span>
              </div>
              <div className="text-white">{comment.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 