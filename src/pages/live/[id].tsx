import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { getVideos, Video } from '../../lib/services/videoService';
import { LocalStream, LiveRoom, joinLiveRoom, leaveLiveRoom } from '../../lib/services/liveService';
import YouTube from 'react-youtube';
import { CircleDot, Users, MessageSquare, Heart, Send } from 'lucide-react';

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
}

export default function LiveStream() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<Video | LocalStream | LiveRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    const loadStream = async () => {
      try {
        // Try to get from YouTube first
        const videos = await getVideos();
        const youtubeStream = videos.find(v => v.id === id && v.duration >= 300); // Consider longer videos as potential live content
        
        if (youtubeStream) {
          setStream(youtubeStream);
          setLoading(false);
          return;
        }

        // Try to get from local streams
        const localStreamDoc = await getDoc(doc(db, 'localStreams', id));
        if (localStreamDoc.exists()) {
          setStream(localStreamDoc.data() as LocalStream);
          setLoading(false);
          return;
        }

        // Try to get from live rooms
        const roomDoc = await getDoc(doc(db, 'liveRooms', id));
        if (roomDoc.exists()) {
          setStream(roomDoc.data() as LiveRoom);
          setLoading(false);
          return;
        }

        // If not found, redirect to live page
        navigate('/live');
      } catch (err) {
        console.error('Failed to load stream:', err);
        navigate('/live');
      }
    };

    loadStream();
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;

    // Subscribe to chat messages
    const messagesRef = collection(db, 'liveStreams', id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as Message[];
      
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoinRoom = async () => {
    if (!auth.currentUser || !id) return;

    try {
      await joinLiveRoom(id, auth.currentUser.uid);
      setIsJoined(true);
    } catch (err) {
      console.error('Failed to join room:', err);
      alert('Failed to join room. Please try again.');
    }
  };

  const handleLeaveRoom = async () => {
    if (!auth.currentUser || !id) return;

    try {
      await leaveLiveRoom(id);
      setIsJoined(false);
    } catch (err) {
      console.error('Failed to leave room:', err);
      alert('Failed to leave room. Please try again.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !id || !newMessage.trim()) return;

    try {
      const messagesRef = collection(db, 'liveStreams', id, 'messages');
      await addDoc(messagesRef, {
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || 'Anonymous',
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

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
        <div className="text-white">Loading stream...</div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-white">Stream not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Stream/Room Preview */}
          <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden">
            {!('isRoom' in stream) && !('isLocal' in stream) && (
              <YouTube
                videoId={stream.id}
                opts={opts}
                className="w-full h-full"
              />
            )}
            {('isRoom' in stream) && stream.isRoom && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-16 h-16 text-white mb-4" />
                  <p className="text-white text-xl font-semibold">{stream.title}</p>
                  <p className="text-white/80">{stream.participants} participants</p>
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <CircleDot className="w-4 h-4" />
              LIVE
            </div>
            {('isLocal' in stream) && stream.isLocal && (
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                Local Stream
              </div>
            )}
          </div>

          {/* Stream/Room Info */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-white mb-2">{stream.title}</h1>
            <p className="text-zinc-400 mb-4">{stream.description}</p>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {('viewers' in stream) ? stream.viewers.toLocaleString() : '0'} watching
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                {('likes' in stream) ? stream.likes.toLocaleString() : '0'} likes
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {messages.length} messages
              </div>
            </div>
          </div>

          {/* Room Actions */}
          {('isRoom' in stream) && stream.isRoom && (
            <div className="mt-6">
              {!isJoined ? (
                <button
                  onClick={handleJoinRoom}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Join Room
                </button>
              ) : (
                <button
                  onClick={handleLeaveRoom}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Leave Room
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Live Chat</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div key={message.id} className="flex gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{message.username}</span>
                      <span className="text-xs text-zinc-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-zinc-300">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 