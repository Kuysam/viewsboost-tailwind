// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getVideos, Video, getTrendingVideos } from '../lib/services/videoService';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

import SpotlightCarousel from '../components/SpotlightCarousel';
import ContinueWatching from '../components/ContinueWatching';
import TrendingWorldwide from '../components/TrendingWorldwide';
import LiveNow from '../components/LiveNow';
import CommunityHub from '../components/CommunityHub';
import CreatorSpotlight from '../components/CreatorSpotlight';
import DailyPicks from '../components/DailyPicks';
import CreatorUploads from '../components/CreatorUploads';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  isCreator: boolean;
}

interface SpotlightVideo {
  video: Video;
  reason: string;
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [spotlightVideos, setSpotlightVideos] = useState<SpotlightVideo[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [dailyPicks, setDailyPicks] = useState<Video[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/get-started');
          return;
        }

        const [creatorDoc, viewerDoc] = await Promise.all([
          getDoc(doc(db, 'creators', user.uid)),
          getDoc(doc(db, 'viewers', user.uid)),
        ]);

        if (creatorDoc.exists()) {
          setUserData(creatorDoc.data() as UserData);
        } else if (viewerDoc.exists()) {
          setUserData(viewerDoc.data() as UserData);
        } else {
          // User exists but doesn't have profile data - create minimal data to allow dashboard access
          const basicUserData: UserData = {
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ')[1] || '',
            email: user.email || '',
            isCreator: false
          };
          setUserData(basicUserData);
          
          // Optionally create basic user record in Firestore for future use
          try {
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              displayName: user.displayName || 'User',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              role: 'viewer'
            }, { merge: true });
          } catch (error) {
            console.log('Could not create user record, but proceeding to dashboard');
          }
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        // Don't redirect on error, just use basic user data
        const user = auth.currentUser;
        if (user) {
          const basicUserData: UserData = {
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ')[1] || '',
            email: user.email || '',
            isCreator: false
          };
          setUserData(basicUserData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const pickSpotlight = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const cacheKey = `spotlight_arr_${user.uid}`;
      const cache = localStorage.getItem(cacheKey);
      if (cache) {
        const { videos, ts } = JSON.parse(cache);
        if (Date.now() - ts < 24 * 60 * 60 * 1000) {
          setSpotlightVideos(videos);
          return;
        }
      }
      // Fetch user watch history
      const histSnap = await getDoc(doc(db, 'userWatchHistory', user.uid));
      let watched: { [id: string]: any } = {};
      if (histSnap.exists()) watched = histSnap.data().entries || {};
      // Fetch user search history
      const searchSnap = await getDocs(query(collection(db, `userSearchHistory/${user.uid}/queries`), orderBy('ts', 'desc')));
      const searchTerms = searchSnap.docs.map(d => d.data().query.toLowerCase());
      // Fetch all videos
      const allVideos = await getVideos();
      // Filter out shorts (duration < 240s)
      const nonShortVideos = allVideos.filter(v => v.duration >= 240);
      // 1. Most watched
      const mostWatched = Object.entries(watched)
        .sort((a, b) => (b[1].totalWatched || 0) - (a[1].totalWatched || 0))
        .map(([id]) => nonShortVideos.find(v => v.id === id))
        .filter(Boolean) as Video[];
      // 2. Search match
      let searchMatch: Video[] = [];
      if (searchTerms.length) {
        for (const term of searchTerms.slice(0, 10)) {
          searchMatch = nonShortVideos.filter(v => v.title.toLowerCase().includes(term));
          if (searchMatch.length) break;
        }
      }
      // 3. Trending (real trending)
      const trendingVideos = await getTrendingVideos(1, 10); // last 24h, top 10
      const trending = trendingVideos.filter(v =>
        !mostWatched.some(mw => mw.id === v.id) &&
        !searchMatch.some(sm => sm.id === v.id)
      );
      // 4. Wildcard (random new or unseen)
      const unseen = nonShortVideos.filter(v => !watched[v.id]);
      const wildcard = unseen.length ? unseen[Math.floor(Math.random() * unseen.length)] : nonShortVideos[Math.floor(Math.random() * nonShortVideos.length)];
      // Compose picks with reasons
      const picks: SpotlightVideo[] = [];
      if (mostWatched[0]) picks.push({ video: mostWatched[0], reason: 'Your Most Watched' });
      if (searchMatch[0]) picks.push({ video: searchMatch[0], reason: `Because you searched: "${searchTerms[0]}"` });
      if (trending[0]) picks.push({ video: trending[0], reason: 'Trending Now' });
      if (wildcard) picks.push({ video: wildcard, reason: 'Discover Something New' });
      // Ensure 4 unique videos
      const unique = picks.filter((v, i, arr) => arr.findIndex(x => x.video.id === v.video.id) === i).slice(0, 4);
      setSpotlightVideos(unique);
      localStorage.setItem(cacheKey, JSON.stringify({ videos: unique, ts: Date.now() }));
    };
    pickSpotlight();
    getTrendingVideos(1, 10).then(setTrendingVideos).catch(() => setTrendingVideos([]));
    getVideos().then(setDailyPicks).catch(() => setDailyPicks([]));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white pb-16"
      style={{
        backgroundImage:
          // ● Dot-pattern layer repeats every 30px
          // ● Satin-phone-bg.png is "no-repeat" and covers the entire area
          "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px), url('/images/satin-phone-bg.png')",
        backgroundRepeat: 'repeat, no-repeat',
        backgroundSize: '30px 30px, cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Welcome */}
      <div className="text-xl font-semibold text-yellow-400 text-left px-4 pt-8">
        Welcome, {userData?.firstName}!
      </div>

      {/* Spotlight Carousel */}
      <div className="max-w-7xl mx-auto px-4">
        <SpotlightCarousel videos={spotlightVideos} />
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        <ContinueWatching />
        <TrendingWorldwide videos={trendingVideos} />
        <LiveNow />
        <CommunityHub />
        <CreatorSpotlight />
        <DailyPicks videos={dailyPicks} />
        <CreatorUploads /> {/* show creator uploads at the bottom */}
      </div>
    </div>
  );
}
