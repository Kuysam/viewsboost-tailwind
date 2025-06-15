// src/pages/AdminPanel.tsx

import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { getApiKeyList } from "../lib/youtube/apiKeyManager";
import { getAllChannelVideos, getUploadsPlaylistId } from "../lib/youtube";

type QuotaStats = {
  [key: string]: {
    used?: number;
    errors?: number;
    [key: string]: any;
  };
};

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [quota, setQuota] = useState<QuotaStats>({});
  const [videos, setVideos] = useState<any[]>([]);
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ingestMsg, setIngestMsg] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "users")).then((snap) =>
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    getDocs(collection(db, "creators")).then((snap) =>
      setCreators(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    getDocs(collection(db, "videos")).then((snap) =>
      setVideos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const today = new Date().toISOString().slice(0, 10);
    getDoc(doc(db, "quotaUsage", today)).then((snap) => {
      setQuota(snap.exists() ? (snap.data().keys || {}) : {});
    });
  }, []);

  const keyList = getApiKeyList();

  const handleIngest = async () => {
    setIngesting(true);
    setDone(false);
    setIngestMsg("Counting creators...");
    setProgress(0);

    try {
      const creatorsSnap = await getDocs(collection(db, "creators"));
      const creatorList = creatorsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (!creatorList.length) throw new Error("No creators found.");

      let totalCreators = creatorList.length;
      let creatorCount = 0;
      let totalVideos = 0;
      let processedVideos = 0;

      for (const creator of creatorList) {
        if (!creator.channelId) {
          creatorCount++;
          setIngestMsg(`Skipping creator without channelId (${creator.id})...`);
          setProgress(Math.round((creatorCount / totalCreators) * 100));
          continue;
        }
        setIngestMsg(`Fetching videos for: ${creator.channelId} (${creatorCount + 1}/${totalCreators})`);
        const uploadsPlaylistId = await getUploadsPlaylistId(creator.channelId);
        const videosList = await getAllChannelVideos(uploadsPlaylistId);
        totalVideos += videosList.length;

        let doneForCreator = 0;
        for (const video of videosList) {
          const type = video.duration <= 240 ? "short" : "video";
          const docRef = doc(db, "videos", video.id);
          await setDoc(docRef, {
            ...video,
            youtubeId: video.id, // Always store the real YouTube ID!
            type,
            creatorId: creator.id,
            lastSynced: new Date().toISOString(),
          }, { merge: true });

          processedVideos++;
          doneForCreator++;
          const creatorWeight = 0.2;
          const videoWeight = 0.8;
          const creatorProgress = creatorWeight * ((creatorCount + doneForCreator / videosList.length) / totalCreators);
          const videoProgress = videoWeight * (processedVideos / (totalVideos || 1));
          setProgress(Math.round((creatorProgress + videoProgress) * 100));
        }
        creatorCount++;
        setProgress(Math.round((creatorCount / totalCreators) * 100));
      }
      setProgress(100);
      setIngestMsg("✅ All videos ingested! Shorts & Dashboard will update now.");
      setDone(true);
    } catch (e) {
      setIngesting(false);
      setDone(false);
      setIngestMsg("❌ Ingestion failed. See console for details.");
      return;
    }
    setIngesting(false);
    setDone(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

      {/* --- Ingest Button & Progress Bar --- */}
      <button
        style={{
          background: 'linear-gradient(90deg,#ffa726,#fb8c00,#d84315)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 'bold',
          fontSize: 22,
          padding: '18px 44px',
          margin: '30px 0 12px 0',
          cursor: 'pointer',
          boxShadow: '0 2px 12px #ff980050',
          transition: 'opacity 0.3s',
          opacity: ingesting ? 0.7 : 1,
        }}
        disabled={ingesting}
        onClick={handleIngest}
      >
        {ingesting ? (
          <span>
            <span role="img" aria-label="rocket">🚀</span> Ingesting All Videos...
          </span>
        ) : (
          "Ingest All Creators Videos"
        )}
      </button>

      {/* --- Progress Bar --- */}
      {(ingesting || progress === 100) && (
        <div className="w-full mb-6 relative" style={{ height: 14, maxWidth: 400 }}>
          <div
            style={{
              width: `${progress}%`,
              height: 14,
              background: "linear-gradient(90deg, #ff6a00, #f9d423 50%, #f83600 90%, #f9d423)",
              borderRadius: 14,
              boxShadow: "0 0 18px 2px #ff9100aa, 0 0 20px 6px #ffe08266",
              transition: "width 0.22s cubic-bezier(.4,2.5,.6,1)",
              position: "absolute",
              left: 0,
              top: 0,
            }}
          />
          <div
            style={{
              width: "100%",
              height: 14,
              borderRadius: 14,
              background: "#fff2",
              position: "absolute",
              left: 0,
              top: 0,
              zIndex: -1,
            }}
          />
        </div>
      )}

      {ingestMsg && (
        <div style={{
          color: progress === 100 ? "#38ef7d" : "#fff",
          fontSize: 20,
          marginBottom: 18,
          fontWeight: 600,
          letterSpacing: 1,
          textShadow: progress === 100 ? "0 0 12px #38ef7dcc" : "none",
          transition: "color .3s, text-shadow .3s"
        }}>
          {progress === 100 ? (
            <span>🎉 Ingestion Complete! Enjoy your Shorts & Videos. 🎉</span>
          ) : (
            ingestMsg
          )}
        </div>
      )}

      {/* API Key Quota Usage */}
      <div className="mb-8">
        <h2 className="font-semibold">API Key Quota Usage (Today)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          {keyList.map((k: string, i: number) => (
            <div key={k} className="rounded-lg bg-gray-900 text-white p-4">
              <div className="text-xs opacity-70 mb-1">Key #{i + 1}</div>
              <div className="text-xs break-all mb-2">{k}</div>
              <div>
                <b>Used:</b> {quota[k]?.used ?? 0}
              </div>
              <div>
                <b>Errors:</b> {quota[k]?.errors ?? 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users */}
      <div className="mb-8">
        <h2 className="font-semibold">Users ({users.length})</h2>
        <ul className="max-h-32 overflow-auto text-xs">
          {users.map((u) => (
            <li key={u.id}>
              <b>{u.id}</b> — {u.email || u.displayName || "no email"}
            </li>
          ))}
        </ul>
      </div>

      {/* Creators */}
      <div className="mb-8">
        <h2 className="font-semibold">Creators ({creators.length})</h2>
        <ul className="max-h-32 overflow-auto text-xs">
          {creators.map((c) => (
            <li key={c.id}>
              <b>{c.id}</b> — {c.channelId || "no channel"}
            </li>
          ))}
        </ul>
      </div>

      {/* Videos */}
      <div>
        <h2 className="font-semibold">Videos ({videos.length})</h2>
        <ul className="max-h-48 overflow-auto text-xs">
          {videos.map((v) => (
            <li key={v.id}>
              <b>{v.id}</b> — {v.title || "no title"} ({v.duration ?? "?"}s)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
