import React, { useEffect, useState, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Profile() {
  const [userData, setUserData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchUser() {
      const user = auth.currentUser;
      if (!user) return;
      // Try to get from 'viewers' first, then 'creators'
      let docSnap = await getDoc(doc(db, 'viewers', user.uid));
      if (!docSnap.exists()) {
        docSnap = await getDoc(doc(db, 'creators', user.uid));
      }
      if (docSnap.exists()) setUserData(docSnap.data());
    }
    fetchUser();
  }, []);

  const user = auth.currentUser;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setUploadMsg(null);
    const file = e.target.files[0];
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      // Update Firestore
      const viewerRef = doc(db, 'viewers', user.uid);
      const creatorRef = doc(db, 'creators', user.uid);
      await updateDoc(viewerRef, { photoURL: url }).catch(() => {});
      await updateDoc(creatorRef, { photoURL: url }).catch(() => {});
      setUserData((prev: any) => ({ ...prev, photoURL: url }));
      setUploadMsg('Profile photo updated!');
    } catch (err) {
      setUploadMsg('Failed to upload photo. Please try again.');
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6" style={{ marginLeft: 120 }}>
      <h1 className="text-2xl text-yellow-400 font-bold mb-4">👤 Profile Page</h1>
      {user && userData ? (
        <div className="mb-8 flex items-center gap-6">
          <div className="relative w-28 h-28">
            <img
              src={userData.photoURL || '/images/default-avatar.png'}
              alt="Avatar"
              className="w-28 h-28 rounded-full border-4 border-yellow-400 object-cover"
            />
            <button
              className="absolute bottom-2 right-2 bg-yellow-400 text-black rounded-full px-3 py-1 text-xs font-bold hover:bg-orange-400 transition"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ zIndex: 2 }}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            {uploadMsg && (
              <div className={`absolute left-0 right-0 -bottom-8 text-center text-xs ${uploadMsg.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>
                {uploadMsg}
              </div>
            )}
          </div>
          <div>
            <div className="text-xl font-bold">{userData.displayName || user.displayName || 'No Name'}</div>
            <div className="text-gray-400">{user.email}</div>
            <div className="text-gray-300 mt-2">{userData.bio || 'No bio yet.'}</div>
          </div>
        </div>
      ) : (
        <div className="text-gray-400 mb-8">Loading user info...</div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-bold text-yellow-400 mb-2">Posts & Activity</h2>
        <div className="text-gray-300">Your posts and recent activity will appear here.</div>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-yellow-400 mb-2">Followers & Following</h2>
        <div className="text-gray-300">Your followers and following lists will appear here.</div>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-yellow-400 mb-2">Playlists & Collections</h2>
        <div className="text-gray-300">Your playlists and collections will appear here.</div>
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-yellow-400 mb-2">Analytics & Monetization</h2>
        <div className="text-gray-300">Your analytics and monetization stats will appear here.</div>
      </div>
    </div>
  );
}
