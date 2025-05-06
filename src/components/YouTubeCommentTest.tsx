import React, { useState, useEffect } from 'react';
import { getVideoComments, postComment } from '../lib/youtube';

const YouTubeCommentTest: React.FC = () => {
  const [videoId, setVideoId] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchComments = async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedComments = await getVideoComments(videoId);
      setComments(fetchedComments);
    } catch (err) {
      setError('Failed to fetch comments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!videoId || !newComment.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Note: You'll need to implement proper authentication for this to work
      await postComment(videoId, newComment, 'your_access_token_here');
      setNewComment('');
      handleFetchComments(); // Refresh comments
    } catch (err) {
      setError('Failed to post comment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">YouTube Comment Test</h2>
      
      <div className="mb-4">
        <input
          type="text"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          placeholder="Enter YouTube Video ID"
          className="border p-2 rounded mr-2"
        />
        <button
          onClick={handleFetchComments}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Loading...' : 'Fetch Comments'}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Enter your comment"
          className="border p-2 rounded w-full mb-2"
          rows={3}
        />
        <button
          onClick={handlePostComment}
          disabled={loading || !newComment.trim()}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold">Comments:</h3>
        {comments.map((comment) => (
          <div key={comment.id} className="border p-4 rounded">
            <p className="font-bold">{comment.author}</p>
            <p>{comment.text}</p>
            <p className="text-sm text-gray-500">
              {new Date(comment.publishedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YouTubeCommentTest; 