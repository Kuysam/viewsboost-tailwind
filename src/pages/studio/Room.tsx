import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { createLiveRoom } from '../../lib/services/liveService';
import { Users, Lock, Tag, Hash, MessageSquare } from 'lucide-react';

export default function Room() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    thumbnailUrl: '',
    maxParticipants: 10,
    isPrivate: false,
    password: '',
    allowedUsers: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const room = await createLiveRoom(auth.currentUser.uid, {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        allowedUsers: formData.isPrivate
          ? formData.allowedUsers.split(',').map(user => user.trim())
          : undefined,
      });

      navigate(`/live/${room.id}`);
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-white mb-8">Create a Live Room</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-400 mb-2">
            Room Title
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MessageSquare className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Enter room title"
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
            placeholder="Describe your room"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-zinc-400 mb-2">
            Category
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-zinc-500" />
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

        {/* Max Participants */}
        <div>
          <label htmlFor="maxParticipants" className="block text-sm font-medium text-zinc-400 mb-2">
            Maximum Participants
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              min="2"
              max="50"
              required
              value={formData.maxParticipants}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Private Room */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPrivate"
            name="isPrivate"
            checked={formData.isPrivate}
            onChange={handleChange}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-yellow-400 focus:ring-yellow-400"
          />
          <label htmlFor="isPrivate" className="text-sm font-medium text-zinc-400">
            Make this room private
          </label>
        </div>

        {/* Password (if private) */}
        {formData.isPrivate && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-2">
              Room Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Enter room password"
              />
            </div>
          </div>
        )}

        {/* Allowed Users (if private) */}
        {formData.isPrivate && (
          <div>
            <label htmlFor="allowedUsers" className="block text-sm font-medium text-zinc-400 mb-2">
              Allowed Users (comma-separated usernames)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="text"
                id="allowedUsers"
                name="allowedUsers"
                required
                value={formData.allowedUsers}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="user1, user2, user3"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Creating Room...'
            ) : (
              <>
                <Users className="h-5 w-5" />
                Create Room
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 