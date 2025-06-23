// /src/lib/useTemplates.ts
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // Adjust this path if your firebase config is elsewhere

// --- Developer Note ---
// There is NO fetch limit here. All matching templates are fetched from Firestore.
// If you want to paginate or limit, add a Firestore 'limit' query.

interface Template {
  id: string;
  title: string;
  category: string;
  description?: string;
  preview?: string;
  [key: string]: any;
}

export function useTemplates(category?: string) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'templates'));
        let data: Template[] = snap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || '',
          category: doc.data().category || '',
          ...doc.data()
        }));
        
        if (category) {
          data = data.filter(doc => doc.category === category);
        }
        
        if (!ignore) setTemplates(data);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to fetch templates');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchTemplates();
    return () => { ignore = true; };
  }, [category]);

  return { templates, loading, error };
}
