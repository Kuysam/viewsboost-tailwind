import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TemplateDoc } from '../../types/studio';

export async function searchTemplates(qs: string): Promise<TemplateDoc[]> {
  const col = collection(db, 'templates');
  const qy = qs
    ? query(col, where('public','==',true), where('tags','array-contains-any', qs.toLowerCase().split(/\s+/).slice(0,5)), limit(24))
    : query(col, where('public','==',true), orderBy('updatedAt','desc'), limit(24));
  const snap = await getDocs(qy);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as TemplateDoc));
}

export async function getTemplate(id: string): Promise<TemplateDoc | null> {
  const ref = doc(db, 'templates', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as TemplateDoc;
}
