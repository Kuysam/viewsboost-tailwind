export type TemplateManifestItem = {
  id: string;
  name: string;
  category: string;
  templatePath: string; // public or absolute
  previewPath: string;  // public or absolute
  contentHash?: string;
  tags?: string[];
  layers?: number;
  size?: string;
  updatedAt?: any;
};

let manifestCache: TemplateManifestItem[] | null = null;
let lastFetchPromise: Promise<TemplateManifestItem[]> | null = null;

async function fetchManifest(): Promise<TemplateManifestItem[]> {
  if (manifestCache) return manifestCache;
  if (lastFetchPromise) return lastFetchPromise;

  lastFetchPromise = fetch('/templates/manifest.json')
    .then(async (res) => {
      if (!res.ok) throw new Error(`Failed to fetch manifest.json (${res.status})`);
      const arr = await res.json();
      const normalized: TemplateManifestItem[] = (Array.isArray(arr) ? arr : []).map((it: any) => ({
        id: String(it.id || it.slug || it.name || cryptoLikeId()),
        name: String(it.name || it.title || 'Untitled'),
        category: String(it.category || 'Uncategorized'),
        templatePath: String(it.templatePath || it.path || it.jsonPath || ''),
        previewPath: String(it.previewPath || it.thumbnail || it.preview || it.previewURL || ''),
        contentHash: typeof it.contentHash === 'string' ? it.contentHash : undefined,
        tags: Array.isArray(it.tags) ? it.tags : [],
        layers: typeof it.layers === 'number' ? it.layers : undefined,
        size: typeof it.size === 'string' ? it.size : undefined,
        updatedAt: it.updatedAt,
      }));
      manifestCache = normalized;
      return normalized;
    })
    .finally(() => {
      lastFetchPromise = null;
    });

  return lastFetchPromise;
}

export async function getManifest(): Promise<TemplateManifestItem[]> {
  return fetchManifest();
}

// Runtime merge with Firebase
import { listFirebaseTemplates, TemplateMeta as RemoteMeta } from './firebaseList';

function dedupeByHash(localArr: TemplateManifestItem[], remoteArr: RemoteMeta[]): TemplateManifestItem[] {
  const byHash = new Map<string, TemplateManifestItem>();
  const put = (item: TemplateManifestItem, isRemote: boolean) => {
    const key = item.contentHash || `${item.name}|${item.templatePath}`;
    const existing = byHash.get(key);
    if (!existing) { byHash.set(key, item); return; }
    // precedence: remote
    const winner = isRemote ? item : existing;
    const loser = isRemote ? existing : item;
    const mergedTags = Array.from(new Set([...(winner.tags || []), ...(loser.tags || [])]));
    byHash.set(key, { ...winner, tags: mergedTags, updatedAt: winner.updatedAt || loser.updatedAt });
  };
  localArr.forEach((l) => put(l, false));
  remoteArr.forEach((r) => put({
    id: r.id,
    name: r.name,
    category: r.category,
    templatePath: r.templatePath,
    previewPath: r.previewPath,
    contentHash: r.contentHash,
    tags: r.tags,
    layers: r.layers,
    size: r.size,
    updatedAt: r.updatedAt,
  }, true));
  return Array.from(byHash.values());
}

async function loadUnified(): Promise<TemplateManifestItem[]> {
  const local = await fetchManifest();
  const remote = await listFirebaseTemplates();
  return dedupeByHash(local, remote);
}

export async function getCategories(): Promise<string[]> {
  const items = await loadUnified();
  return Array.from(new Set(items.map(i => i.category))).sort();
}

export async function getTemplates(category?: string): Promise<TemplateManifestItem[]> {
  const items = await loadUnified();
  if (!category || category.toLowerCase() === 'all') return items;
  return items.filter(i => i.category.toLowerCase() === category.toLowerCase());
}

export async function getTemplateById(id: string): Promise<TemplateManifestItem | undefined> {
  const items = await loadUnified();
  return items.find(i => i.id === id);
}

export async function searchTemplates(q: string): Promise<TemplateManifestItem[]> {
  const items = await loadUnified();
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter(i => `${i.name} ${i.category} ${(i.tags||[]).join(' ')}`.toLowerCase().includes(s));
}

function cryptoLikeId(): string { return Math.random().toString(36).slice(2); }



