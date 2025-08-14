// Read-only Firebase templates list helper
// Returns unified TemplateMeta[] compatible with the manifest

export type TemplateMeta = {
  id: string;
  name: string;
  category: string;
  tags?: string[];
  layers?: number;
  size?: string;
  templatePath: string; // absolute https or public path
  previewPath: string;  // absolute https or public path
  contentHash?: string; // optional if remote doesn't provide
  updatedAt?: string | number | { _seconds: number; _nanoseconds?: number };
};

export async function listFirebaseTemplates(): Promise<TemplateMeta[]> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    const snapshot = await getDocs(collection(db, 'templates'));
    const arr = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
    return arr.map((t) => {
      const name = String(t.title || t.name || t.id || 'Untitled');
      const category = String(t.category || 'Uncategorized');
      const templatePath = String(
        t.jsonPath || t.templatePath || t.path || ''
      );
      const previewPath = String(
        t.preview || t.previewURL || t.thumbnail || t.previewPath || ''
      );
      const layers = Array.isArray(t.objects) ? t.objects.length : (Array.isArray(t.layers) ? t.layers.length : undefined);
      const size = (typeof t.width === 'number' && typeof t.height === 'number') ? `${t.width}x${t.height}` : undefined;
      return {
        id: String(t.id || docIdFromTemplate(name)),
        name,
        category,
        tags: Array.isArray(t.tags) ? t.tags : [],
        layers,
        size,
        templatePath,
        previewPath,
        contentHash: typeof t.contentHash === 'string' ? t.contentHash : undefined,
        updatedAt: t.updatedAt,
      } as TemplateMeta;
    });
  } catch {
    // Firebase not configured in this environment
    return [];
  }
}

function docIdFromTemplate(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Optional: read-only listing from Firebase Storage mirroring /templates/library
export async function listFirebaseStorageTemplates(baseFolder = '/templates/library.json'): Promise<TemplateMeta[]> {
  try {
    const { getStorage, ref, listAll, getDownloadURL } = await import('firebase/storage');
    const storage = getStorage();

    async function walkJSON(prefixRef: any): Promise<string[]> {
      const out: string[] = [];
      const res = await listAll(prefixRef);
      for (const f of res.items) {
        if (f.name.toLowerCase().endsWith('.json')) {
          out.push(f.fullPath);
        }
      }
      for (const folder of res.prefixes) {
        const nested = await walkJSON(folder);
        out.push(...nested);
      }
      return out;
    }

    const rootRef = ref(storage, baseFolder);
    const jsonPaths = await walkJSON(rootRef);

    const results: TemplateMeta[] = [];
    for (const jsonPath of jsonPaths) {
      try {
        const url = await getDownloadURL(ref(storage, jsonPath));
        const segs = jsonPath.split('/');
        const fileName = decodeURIComponent(segs[segs.length - 1] || 'template.json');
        const cat = decodeURIComponent(segs[segs.length - 2] || 'Uncategorized');
        const name = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');

        // Try fetching JSON to compute simple metadata (best-effort)
        let layers: number | undefined;
        let size: string | undefined;
        let contentHash: string | undefined;
        try {
          const resp = await fetch(url);
          const tpl = await resp.json();
          layers = Array.isArray(tpl?.objects) ? tpl.objects.length : (Array.isArray(tpl?.layers) ? tpl.layers.length : undefined);
          if (typeof tpl?.width === 'number' && typeof tpl?.height === 'number') {
            size = `${tpl.width}x${tpl.height}`;
          }
          // Lightweight hash on stringified core keys
          try {
            const core = JSON.stringify({ w: tpl?.width, h: tpl?.height, o: Array.isArray(tpl?.objects) ? tpl.objects.length : 0, l: Array.isArray(tpl?.layers) ? tpl.layers.length : 0 });
            contentHash = await hashText(core);
          } catch {}
        } catch {}

        // Guess preview url next to thumbs/<base>.png if present
        let previewPath = '';
        try {
          const base = fileName.replace(/\.[^.]+$/, '');
          const thumbRef = ref(storage, `${baseFolder}/thumbs/${base}.png`);
          previewPath = await getDownloadURL(thumbRef);
        } catch {}

        results.push({
          id: docIdFromTemplate(`${name}-${contentHash || fileName}`),
          name,
          category: cat,
          templatePath: url,
          previewPath,
          layers,
          size,
          contentHash,
        });
      } catch {}
    }

    return results;
  } catch {
    return [];
  }
}

async function hashText(text: string): Promise<string> {
  try {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback non-crypto
    let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0; return h.toString(16);
  }
}


