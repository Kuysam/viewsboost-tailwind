// src/pages/VideoWatchPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import YouTubeComments from '../components/YouTubeComments';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getVideoById } from '../lib/services/videoService'; // Adjust path if needed

export default function VideoWatchPage() {
  const { id } = useParams(); // Get videoId from the URL
  const navigate = useNavigate();
  const [video, setVideo] = useState<{ id: string; title: string; thumbnail: string } | null>(null);
  const watchStart = useRef<number | null>(null);

  // Fetch video info
  useEffect(() => {
    if (id) {
      getVideoById(id).then(setVideo);
    }
  }, [id]);

  // Track watch time and save to history
  useEffect(() => {
    watchStart.current = Date.now();
    return () => {
      if (watchStart.current && video?.id) {
        const watchedMs = Date.now() - watchStart.current;
        if (watchedMs > 30000) {
          const user = auth.currentUser;
          if (user) {
            setDoc(
              doc(db, 'users', user.uid, 'history', video.id),
              {
                id: video.id,
                title: video.title,
                thumbnail: video.thumbnail,
                watchedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }
        }
      }
    };
  }, [video]);

  if (!id) return <p className="text-center text-white mt-20">Video ID not found</p>;

  return (
    <div className="min-h-screen bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center text-white p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-yellow-400 hover:underline"
        >
          <ArrowLeft className="mr-2" size={20} /> Back
        </button>

        <div className="aspect-video w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${id}?autoplay=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
        <YouTubeComments videoId={id as string} />
      </div>
    </div>
  );
}
