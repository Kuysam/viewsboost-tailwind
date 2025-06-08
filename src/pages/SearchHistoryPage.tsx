import React, { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface SearchEntry {
  query: string;
  ts: { seconds: number; nanoseconds: number };
}

export default function SearchHistoryPage() {
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const q = query(
        collection(db, `userSearchHistory/${uid}/queries`),
        orderBy('ts', 'desc')
      );
      const snap = await getDocs(q);
      setEntries(snap.docs.map(d => d.data() as SearchEntry));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p className="text-white">Loading search history…</p>;
  if (!entries.length) return <p className="text-yellow-300">No search history yet.</p>;

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl mb-4">Your Search History</h1>
      <ul className="space-y-2">
        {entries.map((e, i) => (
          <li key={i} className="bg-gray-800 p-3 rounded">
            <div>Query: {e.query}</div>
            <div>
              At: {new Date(e.ts.seconds * 1000).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
