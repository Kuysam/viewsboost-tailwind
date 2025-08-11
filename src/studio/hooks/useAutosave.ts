import { useEffect, useRef } from 'react';
import { doc as fsDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStudio } from '../state/studioStore';
export function useAutosave(userId?: string) {
  const { doc: design, ui, setDirty, setSaving } = useStudio();
  const t = useRef<number|null>(null);
  useEffect(() => {
    if (!design || !userId || !ui.dirty) return;
    const save = async () => {
      setSaving(true);
      const id = design.id || crypto.randomUUID();
      await setDoc(fsDoc(db, 'designs', id), { ...design, id, ownerId: userId, updatedAt: serverTimestamp(), createdAt: design.createdAt ?? serverTimestamp() }, { merge: true });
      setSaving(false); setDirty(false);
    };
    t.current && window.clearTimeout(t.current);
    t.current = window.setTimeout(save, 5000);
    return () => { if (t.current) window.clearTimeout(t.current); };
  }, [design, ui.dirty, userId]);
}
