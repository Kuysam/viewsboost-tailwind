/*
 * Unified Templates Seeder
 * - Reads local templates from /templates_library (read-only)
 * - Fetches Firebase templates (read-only)
 * - Dedupes by contentHash (Firebase > Local)
 * - Copies templates to public/templates/library/<Category>/...
 * - Copies thumbnails to public/templates/library/thumbs/<id>.png
 * - Writes merged manifest to public/templates/manifest.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

type TemplateMeta = {
  id: string;
  name: string;
  category: string;
  tags?: string[];
  layers?: number;
  size?: string; // e.g. 1152x768
  templatePath: string; // public-relative
  previewPath: string; // public-relative
  contentHash: string;
  updatedAt?: string | number | { _seconds: number; _nanoseconds?: number };
};

const projectRoot = '/Users/samuelappolon/Desktop/viewsboost-tailwind';
async function getLocalSourceRoot(): Promise<string> {
  const candidates = [
    '/Users/samuelappolon/Desktop/viewsboost-tailwind/templates_library',
    '/Users/samuelappolon/Desktop/viewsboost-tailwind/templates_library ', // handle accidental trailing space
    path.resolve(projectRoot, 'templates_library'),
    path.resolve(projectRoot, 'templates_library '),
    path.resolve(projectRoot, 'templates_by_category'),
  ];
  for (const c of candidates) {
    try {
      const s = await fs.stat(c);
      if (s.isDirectory()) return c;
    } catch {}
  }
  return candidates[0];
}
// Canonical single folder layout
const publicTemplatesRoot = path.resolve(projectRoot, 'public/templates');
const libraryRoot = path.resolve(publicTemplatesRoot, 'library');
const thumbsDir = path.resolve(libraryRoot, 'thumbs');
const manifestOut = path.resolve(publicTemplatesRoot, 'manifest.json');
const categoriesDoc = path.resolve(projectRoot, 'docs/templateslistdocs.md');

const VOLATILE_KEYS = /^(id|updatedAt|createdAt|modifiedAt|timestamp|thumbnail|thumbnailPath|preview|previewPath|lastEdited|lastModified)$/i;

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function toTitleCase(input: string): string {
  return input
    .split(/[\s_/+-]+/)
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripVolatile(value: any): any {
  if (Array.isArray(value)) return value.map(stripVolatile);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    Object.keys(value)
      .sort()
      .forEach((k) => {
        if (VOLATILE_KEYS.test(k)) return;
        out[k] = stripVolatile(value[k]);
      });
    return out;
  }
  return value;
}

function stableStringify(value: any): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  const parts = keys.map(k => `${JSON.stringify(k)}:${stableStringify((value as any)[k])}`);
  return `{${parts.join(',')}}`;
}

function computeContentHash(obj: any): string {
  const stripped = stripVolatile(obj);
  const s = stableStringify(stripped);
  return crypto.createHash('sha256').update(s).digest('hex');
}

async function readJson(file: string): Promise<any> {
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

async function* walkJsonFiles(dir: string): AsyncGenerator<string> {
  let entries: any[] = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkJsonFiles(full);
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.json')) {
      yield full;
    }
  }
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function readDocCategories(): Promise<string[]> {
  try {
    const raw = await fs.readFile(categoriesDoc, 'utf8');
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const set = new Set<string>();
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const [parent, rest] = line.split(':').map(s => s.trim());
      if (parent) set.add(toTitleCase(parent));
      if (rest) {
        rest.split(',').map(s => s.trim()).filter(Boolean).forEach(s => set.add(toTitleCase(s)));
      }
    }
    set.add('Uncategorized');
    return Array.from(set);
  } catch {
    return ['Uncategorized'];
  }
}

async function resolveCategory(json: any, filePath: string, allowed: string[]): Promise<string> {
  const allow = allowed.map(c => ({ raw: c, norm: normalizeForMatch(c) }));
  // 1) json.meta.category
  const metaCat = (json?.meta?.category || '').toString();
  if (metaCat) {
    const norm = normalizeForMatch(metaCat);
    const hit = allow.find(c => c.norm === norm || c.norm.includes(norm) || norm.includes(c.norm));
    if (hit) return hit.raw;
  }
  // 2) Filename prefix before '__' or first '-'
  const base = path.parse(filePath).name;
  const prefix = base.split('__')[0].split('-')[0].replace(/_/g, ' ');
  if (prefix) {
    const candidate = toTitleCase(prefix);
    const norm = normalizeForMatch(candidate);
    const hit = allow.find(c => c.norm === norm || c.norm.includes(norm) || norm.includes(c.norm));
    if (hit) return hit.raw;
  }
  // 3) Parent folder name
  const parent = toTitleCase(path.basename(path.dirname(filePath)));
  if (parent) {
    const norm = normalizeForMatch(parent);
    const hit = allow.find(c => c.norm === norm || c.norm.includes(norm) || norm.includes(c.norm));
    if (hit) return hit.raw;
  }
  return 'Uncategorized';
}

async function findSidecarThumbnail(srcFile: string): Promise<string | null> {
  const base = srcFile.replace(/\.[^.]+$/, '');
  const candidates = ['.png', '.jpg', '.jpeg', '.webp'];
  for (const ext of candidates) {
    const p = `${base}${ext}`;
    try {
      const stat = await fs.stat(p);
      if (stat.isFile()) return p;
    } catch {}
  }
  return null;
}

async function copyJsonAndThumb(
  filePath: string,
  json: any,
  id: string,
  category: string,
): Promise<{ templatePath: string; previewPath: string }> {
  const safeCat = category.replace(/\//g, ' ');
  const outDir = path.join(libraryRoot, safeCat);
  await ensureDir(outDir);
  await ensureDir(thumbsDir);

  const fileName = path.basename(filePath);
  const destJson = path.join(outDir, fileName);
  await fs.copyFile(filePath, destJson);
  const templatePath = `/templates/library/${encodeURIComponent(safeCat)}/${encodeURIComponent(fileName)}`;

  // thumbnail resolution
  let thumbPathDisk: string | null = await findSidecarThumbnail(filePath);
  if (!thumbPathDisk && typeof json?.meta?.thumbnailPath === 'string') {
    const candidate = path.isAbsolute(json.meta.thumbnailPath)
      ? json.meta.thumbnailPath
      : path.resolve(path.dirname(filePath), json.meta.thumbnailPath);
    try { const s = await fs.stat(candidate); if (s.isFile()) thumbPathDisk = candidate; } catch {}
  }

  const destThumbPng = path.join(thumbsDir, `${id}.png`);
  try {
    if (thumbPathDisk) {
      await sharp(thumbPathDisk).png().toFile(destThumbPng);
    } else {
      // placeholder
      const placeholder = path.resolve(projectRoot, 'public/assets/template-thumb.png');
      try { await fs.copyFile(placeholder, destThumbPng); } catch {
        // generate a simple placeholder if not present
        const { createCanvas } = await import('canvas');
        const cnv = createCanvas(360, 270);
        const ctx = cnv.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 360, 270);
        g.addColorStop(0, '#a78bfa');
        g.addColorStop(1, '#f472b6');
        ctx.fillStyle = g as any; ctx.fillRect(0, 0, 360, 270);
        const buf = cnv.toBuffer('image/png');
        await fs.writeFile(destThumbPng, buf);
      }
    }
  } catch {}

  const previewPath = `/templates/library/thumbs/${id}.png`;
  return { templatePath, previewPath };
}

function mergeDedup(localItems: TemplateMeta[], remoteItems: TemplateMeta[]): TemplateMeta[] {
  const byHash = new Map<string, TemplateMeta>();
  const take = (incoming: TemplateMeta, isRemote: boolean) => {
    const existing = byHash.get(incoming.contentHash);
    if (!existing) { byHash.set(incoming.contentHash, incoming); return; }
    // precedence: remote (Firebase) over local
    const winner = isRemote ? incoming : existing;
    const loser = isRemote ? existing : incoming;
    const mergedTags = Array.from(new Set([...(winner.tags || []), ...(loser.tags || [])]));
    const updatedAt = (winner.updatedAt || loser.updatedAt);
    byHash.set(incoming.contentHash, { ...winner, tags: mergedTags, updatedAt });
  };
  localItems.forEach(i => take(i, false));
  remoteItems.forEach(i => take(i, true));
  return Array.from(byHash.values());
}

async function listLocalTemplates(): Promise<TemplateMeta[]> {
  const results: TemplateMeta[] = [];
  const sourceRoot = await getLocalSourceRoot();
  const docCats = await readDocCategories();
  for await (const filePath of walkJsonFiles(sourceRoot)) {
    try {
      const json = await readJson(filePath);
      // Skip non-template JSON arrays or objects without layers/objects
      const hasObjects = Array.isArray(json?.objects);
      const hasLayers = Array.isArray(json?.layers);
      if (!hasObjects && !hasLayers) {
        // ignore aggregated lists like "templates (10).json"
        continue;
      }
      const contentHash = computeContentHash(json);
      const baseName = path.parse(filePath).name;
      const name = toTitleCase(baseName);
      const category = await resolveCategory(json, filePath, docCats);
      const layers = hasObjects ? json.objects.length : (hasLayers ? json.layers.length : 0);
      const width = typeof json?.width === 'number' ? json.width : 1152;
      const height = typeof json?.height === 'number' ? json.height : 768;
      const size = `${Math.round(width)}x${Math.round(height)}`;
      const id = `${slugify(name)}-${contentHash.substring(0, 8)}`;
      const { templatePath, previewPath } = await copyJsonAndThumb(filePath, json, id, category);
      const tags: string[] = Array.isArray(json?.meta?.tags) ? json.meta.tags : [];
      results.push({ id, name, category, tags, layers, size, templatePath, previewPath, contentHash });
    } catch (e) {
      console.warn('Local template skipped due to error:', filePath, (e as any)?.message || e);
    }
  }
  return results;
}

async function listFirebaseTemplatesForSeed(): Promise<TemplateMeta[]> {
  try {
    const mod = await import(path.resolve(projectRoot, 'src/lib/templates/firebaseList.ts'));
    if (typeof mod.listFirebaseTemplates === 'function') {
      const arr = await mod.listFirebaseTemplates();
      return Array.isArray(arr) ? arr as TemplateMeta[] : [];
    }
  } catch {}
  return [];
}

async function main() {
  console.log('Seeding templates...');
  // Clean library dir to avoid stale double-encoded folders
  try { await fs.rm(publicTemplatesRoot, { recursive: true, force: true }); } catch {}
  await ensureDir(publicTemplatesRoot);
  await ensureDir(thumbsDir);

  const local = await listLocalTemplates();
  const remote = await listFirebaseTemplatesForSeed();

  const merged = mergeDedup(local, remote);

  const outArr = merged.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    tags: m.tags || [],
    layers: m.layers || 0,
    size: m.size || '1152x768',
    templatePath: m.templatePath,
    previewPath: m.previewPath,
    contentHash: m.contentHash,
    updatedAt: m.updatedAt ?? null,
  }));

  await fs.writeFile(manifestOut, JSON.stringify(outArr, null, 2), 'utf8');
  console.log(`local: ${local.length}, firebase: ${remote.length}, merged: ${merged.length} (dedup ${local.length + remote.length - merged.length})`);
  console.log(`✅ Wrote manifest → ${manifestOut}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});


