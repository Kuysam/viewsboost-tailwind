// /src/lib/useTemplates.ts
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase"; // Adjust this path if your firebase config is elsewhere
import { useTemplateUpdates } from "./hooks/useTemplateUpdates";

// --- Developer Note ---
// Enhanced hook that reads from both Firestore AND local JSON files as fallback
// TEMPORARILY PRIORITIZING LOCAL JSON to show our new 362 premium Envato templates
// Now includes quality filtering to prioritize high-quality local content

export function useTemplates(category: string | null = "Business") {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forceFirestore, setForceFirestore] = useState(false);
  
  // Listen for real-time template updates from admin panel
  const { lastUpdateTimestamp } = useTemplateUpdates();

  // Listen for admin sync events to force Firestore reload
  useEffect(() => {
    const handleTemplatesUpdated = (event: any) => {
      console.log('🔄 [useTemplates] Received cache invalidation event:', event.detail);
      setForceFirestore(true);
      // Force immediate reload
      setTimeout(() => {
        console.log('🔄 [useTemplates] Resetting forceFirestore flag');
        setForceFirestore(false);
      }, 1000); // Increased timeout to ensure reload happens
    };

    window.addEventListener('templatesUpdated', handleTemplatesUpdated);
    return () => window.removeEventListener('templatesUpdated', handleTemplatesUpdated);
  }, []);

  // Quality scoring function
  const getTemplateQuality = (template: any): number => {
    let score = 0;
    
    // Envato premium templates get highest priority (150 points)
    if (template.platform === 'Envato Elements' || template.videoSource?.includes('envato-premium')) {
      score += 150;
    }
    
    // Local images get highest priority (100 points)
    if (template.preview?.startsWith('/images/') || template.preview?.startsWith('/templates/')) {
      score += 100;
    }
    
    // ViewsBoost branded templates get high priority (80 points)
    if (template.platform === 'ViewsBoost' || template.category?.includes('ViewsBoost')) {
      score += 80;
    }
    
    // Custom/manual imports get priority (60 points)
    if (!template.preview?.includes('unsplash.com') && 
        !template.preview?.includes('pexels.com') && 
        !template.preview?.includes('pixabay.com')) {
      score += 60;
    }
    
    // High resolution indicators (20 points)
    if (template.preview?.includes('w=1200') || template.preview?.includes('1920x1080')) {
      score += 20;
    }
    
    // Penalize known low-quality sources
    if (template.preview?.includes('images.unsplash.com')) score -= 30;
    if (template.preview?.includes('images.pexels.com')) score -= 20;
    if (template.preview?.includes('pixabay.com')) score -= 25;
    
    return score;
  };

  // Sort templates by quality
  const sortByQuality = (templates: any[]) => {
    return templates.sort((a, b) => getTemplateQuality(b) - getTemplateQuality(a));
  };

  useEffect(() => {
    let ignore = false;
    async function fetchTemplates() {
      setLoading(true);
      try {
        // PRIORITY LOGIC: Try local JSON first UNLESS admin sync forces Firestore
        if (forceFirestore) {
          console.log(`🔄 [useTemplates] FORCING Firestore reload for "${category}" due to admin sync`);
        } else {
        console.log(`📁 [useTemplates] Checking local JSON for "${category}" first...`);
        
        try {
          // Try to fetch from local templates.json first
          const response = await fetch('/templates/templates.json');
          if (response.ok) {
            const localData = await response.json();
            let filteredLocal = localData;
            
            if (category !== null) {
              filteredLocal = localData.filter((doc: any) => 
                doc.category?.toLowerCase() === category.toLowerCase()
              );
            }
            
            console.log(`📁 [useTemplates] Found ${filteredLocal.length} local templates for "${category}"`);
            
            // If we found templates in local JSON, use them (premium Envato templates)
            if (filteredLocal.length > 0) {
              const sortedLocal = sortByQuality(filteredLocal);
              console.log(`✨ [useTemplates] Using ${filteredLocal.length} local templates (includes premium Envato)`);
              
              if (!ignore) setTemplates(sortedLocal);
              if (!ignore) setLoading(false);
              return;
            }
          }
        } catch (localError) {
          console.warn('📁 [useTemplates] Local JSON fetch failed, trying Firestore:', localError);
          }
        }

        // Fallback to Firestore only if local JSON is empty or failed
        console.log(`📁 [useTemplates] Local JSON empty/failed, trying Firestore fallback for "${category}"`);
        const snapshot = await getDocs(collection(db, "templates"));
        let firestoreData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`📁 [useTemplates] Raw Firestore data: ${firestoreData.length} total templates`);
        console.log(`📁 [useTemplates] Categories in Firestore:`, [...new Set(firestoreData.map(d => d.category))]);
        
        // If category is null, return all templates; otherwise filter by category
        if (category !== null) {
          const beforeFilter = firestoreData.length;
          firestoreData = firestoreData.filter(doc => 
            doc.category?.toLowerCase() === category.toLowerCase()
          );
          console.log(`📁 [useTemplates] Filtered for "${category}": ${beforeFilter} → ${firestoreData.length} templates`);
          if (firestoreData.length > 0) {
            console.log(`📁 [useTemplates] Found templates:`, firestoreData.map(t => `${t.title} (${t.category})`));
          }
        }
        
        // Sort Firestore templates by quality as well
        const sortedFirestore = sortByQuality(firestoreData);
        console.log(`✨ [useTemplates] ${sortedFirestore.length} Firestore templates sorted by quality`);
        
        if (!ignore) setTemplates(sortedFirestore);
      } catch (err) {
        console.error('📁 [useTemplates] Both local and Firestore fetch failed:', err);
        if (!ignore) setTemplates([]); // fallback
      }
      if (!ignore) setLoading(false);
    }
    fetchTemplates();
    return () => { ignore = true; };
  }, [category, lastUpdateTimestamp, forceFirestore]); // Re-fetch when templates are updated in admin panel or force Firestore
  return { templates, loading };
}
