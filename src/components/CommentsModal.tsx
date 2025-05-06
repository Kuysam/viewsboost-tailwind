import React, { useEffect, useState } from 'react';

interface Comment {
  id: string;
  author: string;
  text: string;
}

interface CommentsModalProps {
  videoId: string;
  open: boolean;
  onClose: () => void;
}

export default function CommentsModal({ videoId, open, onClose }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      // TODO: Replace with real YouTube API call
      setTimeout(() => {
        setComments([
          { id: '1', author: 'User1', text: 'Great video!' },
          { id: '2', author: 'User2', text: 'Thanks for sharing.' },
        ]);
        setLoading(false);
      }, 800);
    }
  }, [open, videoId]);

  const handlePost = () => {
    if (newComment.trim()) {
      // TODO: Post to YouTube API if authenticated
      setComments((prev) => [
        ...prev,
        { id: Date.now().toString(), author: 'You', text: newComment },
      ]);
      setNewComment('');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Comments</h2>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {comments.map((c) => (
              <div key={c.id} className="border-b border-gray-200 pb-2">
                <span className="font-semibold text-gray-900 dark:text-white">{c.author}:</span>
                <span className="text-gray-500 dark:text-gray-400">{c.text}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg"
          />
          <button
            onClick={handlePost}
            className="w-full mt-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
} 