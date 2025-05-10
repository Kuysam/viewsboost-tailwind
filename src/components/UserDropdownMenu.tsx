import React, { useState, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function UserDropdownMenu() {
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const user = auth.currentUser;

  React.useEffect(() => {
    async function fetchUser() {
      if (!user) return;
      let docSnap = await getDoc(doc(db, 'viewers', user.uid));
      if (!docSnap.exists()) {
        docSnap = await getDoc(doc(db, 'creators', user.uid));
      }
      if (docSnap.exists()) setUserData(docSnap.data());
    }
    fetchUser();
  }, [user]);

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <div className="fixed top-4 right-6 z-50">
      <button
        className="relative w-14 h-14 rounded-full border-4 border-yellow-400 bg-black focus:outline-none"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open user menu"
      >
        <img
          src={userData?.photoURL || '/images/default-avatar.png'}
          alt="Avatar"
          className="w-full h-full rounded-full object-cover"
        />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-lg rounded-xl shadow-lg border border-yellow-400 p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-16 h-16">
              <img
                src={userData?.photoURL || '/images/default-avatar.png'}
                alt="Avatar"
                className="w-16 h-16 rounded-full border-2 border-yellow-400 object-cover"
              />
              <button
                className="absolute bottom-0 right-0 bg-yellow-400 text-black rounded-full px-2 py-1 text-xs font-bold hover:bg-orange-400 transition"
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
            </div>
            <div>
              <div className="text-lg font-bold">{userData?.displayName || user.displayName || 'No Name'}</div>
              <div className="text-gray-400 text-sm">{user.email}</div>
              <div className="text-gray-300 text-xs mt-1">{userData?.bio || 'No bio yet.'}</div>
            </div>
          </div>
          {uploadMsg && (
            <div className={`mb-2 text-xs ${uploadMsg.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>
              {uploadMsg}
            </div>
          )}
          <hr className="border-yellow-400/30 my-2" />
          <div className="space-y-2">
            <button
              className="w-full text-left px-4 py-2 rounded hover:bg-yellow-400/10 transition font-semibold"
              onClick={() => { setOpen(false); navigate('/settings'); }}
            >
              ⚙️ Settings
            </button>
            <button
              className="w-full text-left px-4 py-2 rounded hover:bg-yellow-400/10 transition font-semibold"
              onClick={() => { setOpen(false); navigate('/feed'); }}
            >
              📰 My Feed
            </button>
            <button
              className="w-full text-left px-4 py-2 rounded hover:bg-yellow-400/10 transition font-semibold"
              onClick={() => { setOpen(false); navigate('/studio'); }}
            >
              🎨 Studio
            </button>
            <button
              className="w-full text-left px-4 py-2 rounded hover:bg-yellow-400/10 transition font-semibold"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 