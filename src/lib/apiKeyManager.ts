import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getVideoById } from '../lib/services/videoService'; // Adjust path as needed

const apiKeys = [
    'AIzaSyBdr4M5QyT9Lcg67LjSbwlWWGklGmER_u8',
    'AIzaSyA7RGJh_JiiBPCwPFd4M7GLxyka10P4jTk',
    'AIzaSyCcOAQhmSYFGx26Pk3-7MQ5S9xGHnCd3Z8',
    'AIzaSyCIQdRtOB93WvHN0uBND8N63n9yfj9vAcM',
  ];
  
  let current = 0;
  
  export function getNextApiKey() {
    const key = apiKeys[current];
    current = (current + 1) % apiKeys.length;
    return key;
  }
  
const [video, setVideo] = useState(null);

useEffect(() => {
  if (id) {
    getVideoById(id).then(setVideo);
  }
}, [id]);

const watchStart = useRef<number | null>(null);

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
  