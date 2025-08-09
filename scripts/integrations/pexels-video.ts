/*
  Pexels video pull
  Usage: npx tsx -r dotenv/config scripts/integrations/pexels-video.ts 1 "fitness"
*/
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

type VideoItem = {
  id: string;            // pexelsv:<id>
  source: 'pexels-video';
  url: string;           // mp4 link
  width: number;
  height: number;
  duration: number;      // seconds
  thumbnail: string;     // poster image
  credit: string;        // photographer/user
  license: string;       // "Pexels License"
  category?: string;     // query
};

const apiKey = (process.env.PEXELS_API_KEY || process.env.VITE_PEXELS_API_KEY || '').trim();
if (!apiKey) {
  console.error('Missing PEXELS_API_KEY'); process.exit(1);
}

const [, , countRaw, ...rest] = process.argv;
const count = Math.max(1, Math.min(5, Number(countRaw) || 1));
const query = (rest.join(' ') || 'demo').trim();

const url = new URL('https://api.pexels.com/videos/search');
url.searchParams.set('query', query);
url.searchParams.set('per_page', String(count));

const res = await fetch(url, { headers: { Authorization: apiKey } });
if (!res.ok) {
  console.error('Pexels videos request failed:', res.status, await res.text()); process.exit(1);
}

const json: any = await res.json();
const vids: any[] = Array.isArray(json.videos) ? json.videos : [];

function pickFile(v: any) {
  const files = (v?.video_files || []).filter((f: any) => /mp4/i.test(f?.file_type));
  if (!files.length) return null;
  // Prefer ~1080p, else highest
  const sorted = files.sort((a: any, b: any) => (b.height || 0) - (a.height || 0));
  const best1080 = sorted.find((f: any) => (f.height || 0) <= 1080);
  return best1080 || sorted[0];
}

const mapped: VideoItem[] = vids.map((v) => {
  const f = pickFile(v);
  return {
    id: `pexelsv:${v.id}`,
    source: 'pexels-video',
    url: String(f?.link || ''),
    width: Number(f?.width) || Number(v?.width) || 0,
    height: Number(f?.height) || Number(v?.height) || 0,
    duration: Number(v?.duration) || 0,
    thumbnail: String(v?.image || ''),
    credit: `${v?.user?.name || 'Pexels'}`,
    license: 'Pexels License',
    category: query,
  };
}).filter(m => m.url);

const manifestPath = path.resolve(process.cwd(), 'public', 'assets', 'videos', 'manifest.json');
await fs.mkdir(path.dirname(manifestPath), { recursive: true });

let existing: VideoItem[] = [];
try {
  existing = JSON.parse(await fs.readFile(manifestPath, 'utf8')) || [];
} catch {}

const seen = new Set(existing.map(x => x.id));
let added = 0;
for (const m of mapped) {
  if (seen.has(m.id)) continue;
  existing.push(m); seen.add(m.id); added++;
}

await fs.writeFile(manifestPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
console.log(`Fetched ${mapped.length}. Added ${added}. Saved -> assets/videos/manifest.json`);
