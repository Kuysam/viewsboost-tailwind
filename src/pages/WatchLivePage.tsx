import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getLiveVideoIdFromChannel } from '../lib/youtube';

export default function WatchLivePage() {
  const { id } = useParams();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ytLiveId, setYtLiveId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const docRef = doc(db, 'liveSessions', id!);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        setSession(data);

        // Try to extract channelId from youtubeUrl if it's a YouTube live
        if (data.type === 'youtube' && data.youtubeUrl) {
          const channelId = extractChannelId(data.youtubeUrl);
          if (channelId) {
            const liveId = await getLiveVideoIdFromChannel(channelId);
            setYtLiveId(liveId);
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  const extractChannelId = (url: string): string | null => {
    try {
      const match = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };
  

  if (loading) return <div className="text-white p-4">Loading live stream...</div>;
  if (!session) return <div className="text-red-500 p-4">Live session not found.</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold text-yellow-400 mb-4">
        🎥 {session.title}
      </h1>

      {session.type === 'youtube' && ytLiveId ? (
        <iframe
          className="w-full aspect-video rounded-xl shadow-xl"
          src={`https://www.youtube.com/embed/${ytLiveId}?autoplay=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
      ) : session.type === 'multi' ? (
        <p className="text-gray-400 mt-4">🔴 Multi-user stream feature coming soon...</p>
      ) : (
        <p className="text-gray-400 mt-4">❌ Unable to detect a valid stream.</p>
      )}
    </div>
  );
}
