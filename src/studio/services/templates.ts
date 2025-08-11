import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TemplateDoc } from '../../types/studio';
export async function searchTemplates(qs: string): Promise<TemplateDoc[]> {
  const col = collection(db, 'templates');
  const q = qs
    ? query(col, where('public','==',true), where('tags','array-contains-any', qs.toLowerCase().split(/\s+/).slice(0,5)), limit(24))
    : query(col, where('public','==',true), orderBy('updatedAt','desc'), limit(24));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as TemplateDoc));
}
