// /src/lib/useTemplates.ts
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // Adjust this path if your firebase config is elsewhere

export function useTemplates(category = "Business") {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchTemplates() {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "templates"));
        let data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => doc.category === category);
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
