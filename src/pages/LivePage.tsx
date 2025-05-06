import React, { useEffect, useState } from 'react';
import { db, storage } from '../lib/firebase';
import {
  collection,
  addDoc,
  Timestamp,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom';

const tabs = ['Live Now', 'Join Stream', 'Host Stream'];

export default function LivePage() {
  const [activeTab, setActiveTab] = useState('Live Now');
  const [title, setTitle] = useState('');
  const [liveType, setLiveType] = useState<'multi' | 'youtube'>('multi');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'liveSessions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLiveSessions(sessions);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateLive = async () => {
    if (!title) return alert('Please enter a title.');

    setCreating(true);
    try {
      let thumbnailUrl = '';
      if (thumbnail) {
        const thumbRef = ref(storage, `thumbnails/${uuidv4()}`);
        await uploadBytes(thumbRef, thumbnail);
        thumbnailUrl = await getDownloadURL(thumbRef);
      }

      await addDoc(collection(db, 'liveSessions'), {
        title,
        type: liveType,
        youtubeUrl: liveType === 'youtube' ? youtubeUrl : '',
        thumbnailUrl,
        creatorId: 'test-uid', // Replace with current user ID
        creatorName: 'DemoCreator', // Replace with real creator name
        createdAt: Timestamp.now()
      });

      alert('Live session created!');
      setTitle('');
      setYoutubeUrl('');
      setThumbnail(null);
    } catch (err) {
      console.error('Error creating live session', err);
      alert('Failed to create live.');
    }
    setCreating(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Live Now':
        return (
          <div className="text-white p-4">
            <h2 className="text-xl font-bold mb-2">Currently Live</h2>
            {liveSessions.length === 0 ? (
              <p className="text-gray-400">No one is live right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveSessions.map((session) => (
                  <div key={session.id} className="bg-gray-900 rounded-xl overflow-hidden shadow">
                    {session.thumbnailUrl && (
                      <img
                        src={session.thumbnailUrl}
                        alt={session.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <h3 className="font-bold text-yellow-400">{session.title}</h3>
                      <p className="text-sm text-gray-300">Host: {session.creatorName}</p>
                      <p className="text-xs mt-1 text-gray-400">Type: {session.type}</p>
                      <Link
                        to={`/live/watch/${session.id}`}
                        className="mt-2 inline-block bg-yellow-400 text-black font-bold px-3 py-1 rounded hover:bg-yellow-500"
                      >
                        ▶️ Watch Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'Join Stream':
        return (
          <div className="text-white p-4">
            <h2 className="text-xl font-bold mb-2">Join a Live</h2>
            <p>Enter a room or join a multi-user session.</p>
            <Link
              to="/live-room/sample-room-123"
              className="text-yellow-400 underline"
            >
              Join Sample Room
            </Link>
          </div>
        );
      case 'Host Stream':
        return (
          <div className="text-white p-4 space-y-4">
            <h2 className="text-xl font-bold">Host a Live</h2>
            <input
              type="text"
              placeholder="Live title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
            />
            <select
              value={liveType}
              onChange={(e) => setLiveType(e.target.value as 'multi' | 'youtube')}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
            >
              <option value="multi">Multi-user Live</option>
              <option value="youtube">YouTube-style Live</option>
            </select>
            {liveType === 'youtube' && (
              <input
                type="text"
                placeholder="YouTube Live URL"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              className="w-full text-gray-300"
            />
            <button
              onClick={handleCreateLive}
              disabled={creating}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded"
            >
              {creating ? 'Creating...' : 'Create Live Session'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex justify-center space-x-4 border-b border-gray-700 py-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition ${
              activeTab === tab
                ? 'bg-yellow-400 text-black'
                : 'hover:bg-gray-800 text-gray-300'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto">{renderContent()}</div>
    </div>
  );
}
