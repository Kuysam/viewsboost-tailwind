import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  views?: number;
  likes?: number;
  comments?: number;
}

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        if (!id) {
          setError('No video ID provided');
          return;
        }

        const videoDoc = await getDoc(doc(db, 'videos', id));
        if (!videoDoc.exists()) {
          setError('Video not found');
          return;
        }

        const videoData = videoDoc.data() as Video;
        setVideo({
          ...videoData,
          id: videoDoc.id,
          views: Math.floor(Math.random() * 10000) + 1000,
          likes: Math.floor(Math.random() * 1000) + 100,
          comments: Math.floor(Math.random() * 100) + 10,
        });
      } catch (err) {
        setError('Failed to load video');
        console.error('Error fetching video:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">{error || 'Video not found'}</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-gray-800 px-6 py-4">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <img src="/images/viewsboost-logo.png" alt="ViewsBoost" className="h-8" />
            <button
              onClick={() => navigate(-1)}
              className="text-white/80 hover:text-white flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
              <video
                src={video.url}
                controls
                className="w-full h-full"
                poster={video.thumbnail}
              />
            </div>

            {/* Video Info */}
            <div className="mt-6">
              <h1 className="text-2xl font-bold text-white mb-4">{video.title}</h1>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-800" />
                  <div>
                    <h3 className="font-medium">{video.creatorName}</h3>
                    <p className="text-sm text-white/60">
                      {video.views?.toLocaleString()} views
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full">
                    <ThumbsUp className="h-5 w-5" />
                    <span>{video.likes?.toLocaleString()}</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full">
                    <MessageCircle className="h-5 w-5" />
                    <span>{video.comments}</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full">
                    <Share2 className="h-5 w-5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/80 whitespace-pre-wrap">{video.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar - Could be used for recommended videos */}
          <div className="lg:col-span-1">
            {/* Add recommended videos here */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoPlayer; 