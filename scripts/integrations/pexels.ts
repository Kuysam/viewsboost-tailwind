/*
  Pexels pull script
  Usage: npx tsx -r dotenv/config scripts/integrations/pexels.ts 20 "concert poster"
*/
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

type ManifestItem = {
  id: string;        // `${source}:${photo.id}`
  source: 'pexels';
  url: string;       // photo.src.large2x (fallbacks used)
  width: number;
  height: number;
  tags: string[];    // from photo.alt
  credit: string;    // `${photo.photographer} / Pexels`
  license: string;   // "Pexels License"
  category?: string; // query
};

// Accept either PEXELS_API_KEY or VITE_PEXELS_API_KEY
const apiKey = (process.env.PEXELS_API_KEY || process.env.VITE_PEXELS_API_KEY || '').trim();
if (!apiKey) {
  console.error(
    'Missing PEXELS_API_KEY. Add PEXELS_API_KEY=your_key_here (or VITE_PEXELS_API_KEY) to .env, then rerun.'
  );
  process.exit(1);
}

// Args
const [, , countRaw, ...rest] = process.argv;
const parsed = Number(countRaw);
let count = Number.isFinite(parsed) ? parsed : 20;
count = Math.max(1, Math.min(80, count));
const query = (rest.join(' ') || 'design').trim();

// Build request
const url = new URL('https://api.pexels.com/v1/search');
url.searchParams.set('query', query);
url.searchParams.set('per_page', String(count));
url.searchParams.set('orientation', 'landscape');

const res = await fetch(url, {
  headers: {
    // Pexels expects the raw key (NO "Bearer" prefix)
    Authorization: apiKey,
  },
});

if (!res.ok) {
  const bodyText = await res.text().catch(() => '');
  console.error(`Pexels request failed: ${res.status} ${res.statusText}`);
  if (res.status === 401) {
    console.error('401 Unauthorized — verify your PEXELS_API_KEY and ensure it is NOT prefixed with "Bearer".');
  }
  if (bodyText) console.error(bodyText);
  process.exit(1);
}

const json: any = await res.json().catch(() => null);
if (!json || !Array.isArray(json.photos)) {
  console.error('Unexpected Pexels response: missing photos array.');
  process.exit(1);
}

const photos: any[] = json.photos;
const minW = Number(process.env.ASSET_MIN_WIDTH ?? 0);
const minH = Number(process.env.ASSET_MIN_HEIGHT ?? 0);
const usable = photos.filter((p) => (p?.width ?? 0) >= minW && (p?.height ?? 0) >= minH);


const tokenize = (alt?: string): string[] =>
  typeof alt === 'string' ? (alt.toLowerCase().match(/[a-z0-9]+/g) || []).slice(0, 8) : [];

const mapped: ManifestItem[] = usable.map((p) => ({
  id: `pexels:${p.id}`,
  source: 'pexels',
  url: String(p?.src?.large2x ?? p?.src?.original ?? ''),
  width: Number(p?.width) || 0,
  height: Number(p?.height) || 0,
  tags: tokenize(p?.alt),
  credit: `${p?.photographer || 'Unknown'} / Pexels`,
  license: 'Pexels License',
  category: query,
}));

const manifestPath = path.resolve(process.cwd(), 'assets', 'manifest.json');
await fs.mkdir(path.dirname(manifestPath), { recursive: true });

let existing: ManifestItem[] = [];
try {
  const raw = await fs.readFile(manifestPath, 'utf8');
  const parsedJson = JSON.parse(raw);
  if (Array.isArray(parsedJson)) existing = parsedJson;
} catch {
  existing = [];
}

// Build a key that works whether legacy IDs are prefixed or not
const keyOf = (m: any) => (typeof m?.id === 'string' && m.id.includes(':') ? m.id : `${m?.source}:${m?.id}`);
const seen = new Set(existing.map(keyOf));

let added = 0;
let skipped = 0;
for (const item of mapped) {
  if (!item.url) { skipped++; continue; }
  if (seen.has(item.id)) { skipped++; continue; }
  existing.push(item);
  seen.add(item.id);
  added++;
}

await fs.writeFile(manifestPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');

console.log(
  `Fetched: ${photos.length}. Kept: ${usable.length}. Added: ${added}. Skipped (duplicates): ${skipped}. Manifest size: ${existing.length}.`
);


