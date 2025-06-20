// /src/lib/useTemplates.ts
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // Adjust this path if your firebase config is elsewhere

// --- Developer Note ---
// There is NO fetch limit here. All matching templates are fetched from Firestore.
// If you want to paginate or limit, add a Firestore 'limit' query.

export function useTemplates(category: string | null = "Business") {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchTemplates() {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "templates"));
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // If category is null, return all templates; otherwise filter by category
        if (category !== null) {
          data = data.filter(doc => doc.category === category);
        }
        
        if (!ignore) setTemplates(data);
      } catch (err) {
        if (!ignore) setTemplates([]); // fallback
      }
      if (!ignore) setLoading(false);
    }
    fetchTemplates();
    return () => { ignore = true; };
  }, [category]);
  return { templates, loading };
}
