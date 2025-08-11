import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { startLocalStream } from '../../lib/services/liveService';
import { Video, Mic, Tag, Hash } from 'lucide-react';

export default function Live() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    thumbnailUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      // Generate a unique stream key and RTMP URL
      const streamKey = Math.random().toString(36).substring(2, 15);
      const rtmpUrl = `rtmp://your-rtmp-server/live/${streamKey}`;

      const stream = await startLocalStream(auth.currentUser.uid, {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        streamKey,
        rtmpUrl,
        isLive: true,
      });

      navigate(`/studio/live/${stream.id}`);
    } catch (err) {
      console.error('Failed to start stream:', err);
      alert('Failed to start stream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-white mb-8">Start a Live Stream</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-400 mb-2">
            Stream Title
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Video className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Enter stream title"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-400 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="block w-full px-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            placeholder="Describe your stream"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-zinc-400 mb-2">
            Category
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mic className="h-5 w-5 text-zinc-500" />
            </div>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option value="">Select a category</option>
              <option value="gaming">Gaming</option>
              <option value="music">Music</option>
              <option value="talk">Talk Show</option>
              <option value="education">Education</option>
              <option value="sports">Sports</option>
              <option value="art">Art</option>
              <option value="tech">Technology</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-zinc-400 mb-2">
            Tags (comma-separated)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="gaming, live, tutorial"
            />
          </div>
        </div>

        {/* Thumbnail URL */}
        <div>
          <label htmlFor="thumbnailUrl" className="block text-sm font-medium text-zinc-400 mb-2">
            Thumbnail URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="url"
              id="thumbnailUrl"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="https://example.com/thumbnail.jpg"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Starting Stream...'
            ) : (
              <>
                <Video className="h-5 w-5" />
                Start Streaming
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 