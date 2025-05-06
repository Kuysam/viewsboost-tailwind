// src/pages/Shorts.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

interface VideoItem {
  id: string;
  title: string;
  videoUrl: string;
  creatorName: string;
}

export default function Shorts() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rewardCountdown, setRewardCountdown] = useState(10);
  const [user] = useAuthState(auth);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      const querySnapshot = await getDocs(collection(db, 'shorts'));
      const videoList: VideoItem[] = [];
      querySnapshot.forEach((doc) => {
        videoList.push({ id: doc.id, ...doc.data() } as VideoItem);
      });
      setVideos(videoList);
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    if (!videos.length) return;

    // Reset countdown when video changes
    setRewardCountdown(10);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setRewardCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          rewardUser();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex]);

  const rewardUser = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        shortsCoins: increment(1),
      });
      console.log('Rewarded user +1 coin');
    } catch (error) {
      console.error('Reward error:', error);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => {
      if (currentIndex < videos.length - 1) setCurrentIndex(currentIndex + 1);
    },
    onSwipedDown: () => {
      if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: true,
  });

  if (videos.length === 0) {
    return <div className="h-screen flex items-center justify-center text-white">Loading shorts...</div>;
  }

  const currentVideo = videos[currentIndex];

  return (
    <div
      {...swipeHandlers}
      className="h-screen w-screen bg-black text-white overflow-hidden relative"
    >
      <video
        key={currentVideo.id}
        src={currentVideo.videoUrl}
        className="h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute bottom-12 left-4 z-10">
        <h2 className="text-lg font-bold">{currentVideo.title}</h2>
        <p className="text-sm text-gray-300">@{currentVideo.creatorName}</p>
        <div className="mt-2 text-yellow-400 font-bold">
          ⏳ Reward in: {rewardCountdown}s
        </div>
      </div>
      <div className="absolute right-4 bottom-12 z-10 flex flex-col items-center gap-4">
        <button className="bg-white bg-opacity-10 p-2 rounded-full hover:bg-opacity-30">❤️</button>
        <button className="bg-white bg-opacity-10 p-2 rounded-full hover:bg-opacity-30">💬</button>
        <button className="bg-white bg-opacity-10 p-2 rounded-full hover:bg-opacity-30">↗️</button>
      </div>
    </div>
  );
}
