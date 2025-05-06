import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import VideoGrid from '../components/VideoGrid';

export default function History() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return setLoading(false);

      // Assumes you store history as a subcollection: users/{uid}/history
      const historyRef = collection(db, 'users', user.uid, 'history');
      const snapshot = await getDocs(historyRef);
      const videoList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVideos(videoList);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="text-center text-white mt-20">Loading history...</div>;

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Watch History</h2>
      <VideoGrid videos={videos} />
    </div>
  );
} 