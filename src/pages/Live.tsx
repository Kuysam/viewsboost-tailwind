import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVideos, Video } from '../lib/services/videoService';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { CircleDot, Users, MessageSquare, Heart, Share2, Video as VideoIcon } from 'lucide-react';
import YouTube from 'react-youtube';

interface LiveStream extends Video {
  viewers: number;
  likes: number;
  comments: number;
  isLocal?: boolean;
  isRoom?: boolean;
  roomParticipants?: number;
}

export default function Live() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'youtube' | 'local' | 'rooms'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const loadStreams = async () => {
      try {
        // Get YouTube live streams
        const data = await getVideos();
        const youtubeStreams = data
          .filter(v => v.duration >= 300) // Consider videos longer than 5 minutes as potential live content
          .map(v => ({
            ...v,
            viewers: Math.floor(Math.random() * 1000) + 100,
            likes: Math.floor(Math.random() * 500) + 50,
            comments: Math.floor(Math.random() * 200) + 20,
            isLocal: false,
            isRoom: false
          }));

        // Get local streams (from Firestore)
        const localStreamsRef = collection(db, 'localStreams');
        const localStreamsSnap = await getDocs(query(localStreamsRef, where('isLive', '==', true)));
        const localStreams = localStreamsSnap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Live Stream',
          thumbnail: doc.data().thumbnail || '/images/default-live-thumbnail.png',
          duration: doc.data().duration || 0,
          type: 'video' as const,
          viewers: doc.data().viewers || 0,
          likes: doc.data().likes || 0,
          comments: doc.data().comments || 0,
          description: doc.data().description || '',
          isLocal: true,
          isRoom: false,
          ...doc.data()
        })) as LiveStream[];

        // Get live rooms
        const roomsRef = collection(db, 'liveRooms');
        const roomsSnap = await getDocs(query(roomsRef, where('isActive', '==', true)));
        const liveRooms = roomsSnap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Live Room',
          thumbnail: doc.data().thumbnail || '/images/default-room-thumbnail.png',
          duration: doc.data().duration || 0,
          type: 'video' as const,
          viewers: doc.data().participants || 0,
          likes: doc.data().likes || 0,
          comments: doc.data().messages || 0,
          description: doc.data().description || '',
          participants: doc.data().participants || 0,
          isLocal: false,
          isRoom: true,
          ...doc.data()
        })) as LiveStream[];

        // Combine all streams
        const allStreams = [...youtubeStreams, ...localStreams, ...liveRooms];
        setStreams(allStreams);
      } catch (err) {
        console.error('Failed to load streams:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStreams();
  }, []);

  const filteredStreams = streams.filter(stream => {
    if (activeTab === 'all') return true;
    if (activeTab === 'youtube') return !stream.isLocal && !stream.isRoom;
    if (activeTab === 'local') return stream.isLocal;
    if (activeTab === 'rooms') return stream.isRoom;
    return true;
  });

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      fs: 1,
    },
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-white">Loading live streams...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Tabs */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-yellow-400 text-black'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          All Live
        </button>
        <button
          onClick={() => setActiveTab('youtube')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            activeTab === 'youtube'
              ? 'bg-yellow-400 text-black'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          YouTube Live
        </button>
        <button
          onClick={() => setActiveTab('local')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            activeTab === 'local'
              ? 'bg-yellow-400 text-black'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          Local Streams
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            activeTab === 'rooms'
              ? 'bg-yellow-400 text-black'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          Live Rooms
        </button>
      </div>

      {/* Streams Grid */}
      {filteredStreams.length === 0 ? (
        <div className="text-center py-12">
          <CircleDot className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Live Streams</h3>
          <p className="text-zinc-400">Check back later for live content</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStreams.map(stream => (
            <div
              key={stream.id}
              className="bg-zinc-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Stream Preview */}
              <div className="relative aspect-video">
                {stream.isRoom ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <div className="text-center">
                      <Users className="w-12 h-12 text-white mb-2" />
                      <p className="text-white font-semibold">{stream.title}</p>
                      <p className="text-white/80 text-sm">{stream.roomParticipants || 0} participants</p>
                    </div>
                  </div>
                ) : (
                  <YouTube
                    videoId={stream.id}
                    opts={opts}
                    className="w-full h-full"
                  />
                )}
                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <CircleDot className="w-3 h-3" />
                  LIVE
                </div>
                {stream.isLocal && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                    Local
                  </div>
                )}
              </div>

              {/* Stream Info */}
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2 line-clamp-2">{stream.title}</h3>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {stream.viewers.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {stream.likes.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {stream.comments.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Stream Actions */}
              <div className="px-4 pb-4 flex items-center gap-2">
                <button
                  onClick={() => navigate(`/live/${stream.id}`)}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  {stream.isRoom ? (
                    <>
                      <Users className="w-4 h-4" />
                      Join Room
                    </>
                  ) : (
                    <>
                      <VideoIcon className="w-4 h-4" />
                      Watch
                    </>
                  )}
                </button>
                <button className="p-2 hover:bg-zinc-800 rounded-lg transition">
                  <Share2 className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start Streaming Button */}
      {auth.currentUser && (
        <div className="fixed bottom-8 right-8 flex gap-4">
          <button
            onClick={() => navigate('/studio/live')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-full flex items-center gap-2 shadow-lg"
          >
            <VideoIcon className="w-5 h-5" />
            Start Streaming
          </button>
          <button
            onClick={() => navigate('/studio/room')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 shadow-lg"
          >
            <Users className="w-5 h-5" />
            Create Room
          </button>
        </div>
      )}
    </div>
  );
} 