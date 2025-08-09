/*
  Unsplash pull script
  Usage: npx tsx scripts/integrations/unsplash.ts 20 "concert poster"
*/

import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

type ManifestItem = {
  id: string;
  source: 'unsplash';
  url: string;
  width: number;
  height: number;
  tags: string[];
  credit: string;
  license: string;
  category?: string;
};

const envKey = (process.env.UNSPLASH_ACCESS_KEY || '').trim();
if (!envKey) {
  console.error(
    'Missing UNSPLASH_ACCESS_KEY. Create a .env file with:\nUNSPLASH_ACCESS_KEY=your_key_here\n' +
      'or export it in your shell before running the script.'
  );
  process.exit(1);
}

// Parse CLI args
const [, , countArgRaw, ...rest] = process.argv;
const countArg = Number(countArgRaw);
let count = Number.isFinite(countArg) ? countArg : 20;
count = Math.max(1, Math.min(30, count));
const category = (rest.join(' ') || 'design').trim();

const url = new URL('https://api.unsplash.com/search/photos');
url.searchParams.set('query', category);
url.searchParams.set('per_page', String(count));
url.searchParams.set('order_by', 'relevant');
url.searchParams.set('content_filter', 'high');
url.searchParams.set('orientation', 'landscape');

const res = await fetch(url, {
  headers: {
    Authorization: `Client-ID ${envKey}`,
  },
});

if (!res.ok) {
  const bodyText = await res.text().catch(() => '');
  console.error(`Unsplash request failed: ${res.status} ${res.statusText}\n${bodyText}`);
  process.exit(1);
}

const data = (await res.json()) as any;
const results: any[] = Array.isArray(data?.results) ? data.results : [];

const items: ManifestItem[] = results.map((r) => ({
  id: String(r.id),
  source: 'unsplash',
  url: `${r?.urls?.raw || ''}&auto=format&fit=max&q=90`,
  width: Number(r.width) || 0,
  height: Number(r.height) || 0,
  tags: (Array.isArray(r.tags) ? r.tags : [])
    .map((t: any) => t?.title)
    .filter((t: any) => typeof t === 'string' && t.trim())
    .slice(0, 8),
  credit: `${r?.user?.name || 'Unknown'} / Unsplash`,
  license: 'Unsplash License',
  category,
}));

const manifestPath = path.resolve(process.cwd(), 'assets', 'manifest.json');
await fs.mkdir(path.dirname(manifestPath), { recursive: true });

let existing: ManifestItem[] = [];
try {
  const raw = await fs.readFile(manifestPath, 'utf8');
  existing = JSON.parse(raw);
  if (!Array.isArray(existing)) existing = [];
} catch (_) {
  // file missing or invalid JSON -> start fresh
  existing = [];
}

const seen = new Set(existing.map((m) => `${m.source}:${m.id}`));
const toAdd = items.filter((m) => !seen.has(`${m.source}:${m.id}`));
const next = existing.concat(toAdd);

await fs.writeFile(manifestPath, JSON.stringify(next, null, 2) + '\n', 'utf8');

console.log(`Added ${toAdd.length} new item(s). Total: ${next.length}. Saved to assets/manifest.json`);


