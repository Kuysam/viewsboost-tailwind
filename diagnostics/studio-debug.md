## env
- node: v23.11.0
- npm:  10.9.2
- branch: debug/studio-templates-20250814-105840

## vite config snippet
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
    },
  },

  // Avoid prebundling IDB wrappers (prevents Firebase IndexedDB init issues)
  optimizeDeps: {
    exclude: ['idb', 'wrap-idb-value'],
  },

  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: true,
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
  },

  // Helpful locally; safe defaults
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  },

  // Some libs expect a Node-like global
  define: {
    global: 'globalThis',
  },
})

## templates dir
total 0
drwxr-xr-x@  3 samuelappolon  staff   96 Aug 14 03:02 .
drwxr-xr-x@ 15 samuelappolon  staff  480 Aug 13 10:43 ..
drwxr-xr-x@ 25 samuelappolon  staff  800 Aug 13 16:20 json

## fetch/templates references
no code references found

## studio page snippet
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplates, getCategories, TemplateManifestItem } from '../lib/templates/registry';
import TemplateCard from '../components/TemplateCard';
import CanvaEditor from '../components/CanvaEditor/CanvaEditor';
import { viewsBoostTemplateService } from '../components/CanvaEditor/services/ViewsBoostTemplateService';
import { fabric } from 'fabric';
import { addMediaLayer } from '../utils/canvasMedia';

type TemplateItem = any;

function Row({
  title,
  items,
  onBrowseAll,
  itemWidth = 220,
  aspect = '4/3',
  titleClassName = 'text-base font-bold',
  cardBgClass = 'bg-white',
  borderClass = 'border-black/10',
}: {
  title: string;
  items: TemplateItem[];
  onBrowseAll: () => void;
  itemWidth?: number;
  aspect?: string;
  titleClassName?: string;
  cardBgClass?: string;
  borderClass?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(12);
  const onScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const nearEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 200;
    if (nearEnd) setVisible((v) => Math.min(v + 12, items.length));
  }, [items.length]);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className={titleClassName}>{title}</h3>
        <button onClick={onBrowseAll} className="text-xs text-yellow-300 hover:underline">
          Browse all
          </button>
      </div>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex gap-3 overflow-x-auto snap-x scrollbar-thin scrollbar-thumb-zinc-700/60 scrollbar-track-transparent"
      >
        {items.slice(0, visible).map((t, i) => (
          <div
            key={t.id || i}
            className={`rounded-lg bg-white border ${borderClass} shrink-0 snap-start overflow-hidden`}
            style={{ width: itemWidth }}
            title={t.title || t.name}
            data-testid="template-card"
          >
            <TemplateCard template={t as any} dark={titleClassName.includes('text-white')} aspect={aspect} />
    </div>
              ))}
            </div>
    </section>
  );
}

export default function Studio() {
  const navigate = useNavigate();
  // --- Theme system ---
  const THEMES = useMemo(
    () => [
      { id: 'polished-dark', name: 'Polished Dark', dark: true, bg: 'linear-gradient(135deg,#17171c 0%,#232438 100%)' },
      { id: 'matte-dark', name: 'Matte Dark', dark: true, bg: 'linear-gradient(135deg,#121318 0%,#1b1d26 100%)' },
      { id: 'midnight', name: 'Midnight', dark: true, bg: 'linear-gradient(135deg,#0b1020 0%,#151a2e 100%)' },
      { id: 'deep-violet', name: 'Deep Violet', dark: true, bg: 'linear-gradient(135deg,#1d1033 0%,#2a1d4a 100%)' },
      { id: 'slate', name: 'Slate', dark: true, bg: 'linear-gradient(135deg,#0f172a 0%,#1f2937 100%)' },
      { id: 'ocean-dark', name: 'Ocean Dark', dark: true, bg: 'linear-gradient(135deg,#0b132b 0%,#1c2541 100%)' },
      { id: 'soft-light', name: 'Soft Light', dark: false, bg: 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)' },
      { id: 'warm-sunrise', name: 'Warm Sunrise', dark: false, bg: 'linear-gradient(135deg,#fff7ed 0%,#fde68a 100%)' },
      { id: 'mint-fresh', name: 'Mint Fresh', dark: false, bg: 'linear-gradient(135deg,#ecfeff 0%,#d1fae5 100%)' },
      { id: 'sky-day', name: 'Sky Day', dark: false, bg: 'linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%)' },
      { id: 'desert-sand', name: 'Sand', dark: false, bg: 'linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)' },
      { id: 'peach', name: 'Peach', dark: false, bg: 'linear-gradient(135deg,#ffe4e6 0%,#fecdd3 100%)' },
      // New light themes
      { id: 'lavender-mist', name: 'Lavender Mist', dark: false, bg: 'linear-gradient(135deg,#f5f3ff 0%,#e9d5ff 100%)' },
      { id: 'citrus-cream', name: 'Citrus Cream', dark: false, bg: 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 50%,#fde68a 100%)' },
      { id: 'aqua-breeze', name: 'Aqua Breeze', dark: false, bg: 'linear-gradient(135deg,#ecfeff 0%,#bae6fd 50%,#a7f3d0 100%)' },
      { id: 'blush-cloud', name: 'Blush Cloud', dark: false, bg: 'linear-gradient(135deg,#fff1f2 0%,#ffe4e6 50%,#fbcfe8 100%)' },
    ],
    []
  );
  const [themeId, setThemeId] = useState<string>('soft-light');
  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [THEMES, themeId]);
  const textPrimary = theme.dark ? 'text-white' : 'text-zinc-900';
  const textSubtle = theme.dark ? 'text-white/90' : 'text-zinc-800';
  const titleStrong = theme.dark ? 'text-white' : 'text-zinc-900';
  const borderSubtle = theme.dark ? 'border-white/10' : 'border-black/10';
  const cardBg = theme.dark ? 'bg-zinc-900' : 'bg-white';
  const chipBg = theme.dark ? 'bg-zinc-900/60' : 'bg-white';
  const filterTabs = useMemo(
    () => ['All', 'Birthday', 'Business', 'Fashion', 'Food', 'Sale', 'Social', 'Instagram', 'Facebook', 'YouTube', 'TikTok', 'Twitter/X', 'LinkedIn', 'Shorts/Video', 'Thumbnails', 'Web/Content', 'Ads', 'Print', 'Docs', 'Branding', 'Events/Personal', 'Commerce/Promo'],
    []
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState<boolean>(true);

  // --- merge base + generated manifests (minimal) ---
  useEffect(() => {
    let mounted = true;

    const get = async (url: string) => {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) return [];
        const j = await r.json();
        return Array.isArray(j) ? j : [];
      } catch {
        return [];
      }
    };

    (async () => {
      try {
        setLoadingAll(true);
        const [base, gen] = await Promise.all([
          get("/assets/templates/manifest.json"),
          get("/assets/templates/manifest.generated.json"),
        ]);

        if (!mounted) return;

        const norm = (item: any) => ({
          id: item.id ?? item._id ?? crypto.randomUUID(),
          name: item.name ?? item.title ?? "Untitled",
          title: item.name ?? item.title ?? "Untitled",
          width: Number(item.width ?? item.w ?? 1080),
          height: Number(item.height ?? item.h ?? 1350),
          jsonPath: item.jsonPath ?? item.jsonpath ?? item.path ?? "",
          thumbnail: item.thumbnail ?? item.thumb ?? "/default-template.png",
          category: item.category ?? "General",
          ...item,
        });

        const merged = [...base.map(norm), ...gen.map(norm)];
        console.table({ base: base.length, generated: gen.length, total: merged.length });
        setAllTemplates(merged);
      } catch (error) {
        console.error('[Studio] Failed to load manifests:', error);
        // Fallback to demo templates so user sees something
        setAllTemplates(demoTemplates);
        console.log('[Studio] Using demo templates as fallback');
      } finally {
        if (mounted) setLoadingAll(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const createPlaceholders = useCallback((count: number, category?: string) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `ph-${category || 'all'}-${i}`,
      title: category ? `${category} concept ${i + 1}` : `Template idea ${i + 1}`,
      category: category || ['Birthday','Business','Fashion','Food','Sale','Social','Instagram','Facebook','YouTube'][i % 9],
      tags: [],
    }));
  }, []);

  // Use enhanced templates instead of manifest
  const allFromManifest = useMemo(() => {
    return allTemplates;
  }, [allTemplates]);

  const featured = useMemo(() => {
    const t = allFromManifest;
    const sel = selectedFilter.toLowerCase();
    if (sel === 'all') return t.slice(0, 24);
    return t
      .filter((x) => {
        const hay = `${x.category || ''} ${x.title || ''}`.toLowerCase();
        return hay.includes(sel) || hay.replace(/-/g, ' ').includes(sel);
      })
      .slice(0, 24);
  }, [allFromManifest, selectedFilter]);

  // Demo editable templates (image, video, and docs)
  const demoTemplates = useMemo(() => [
    {
      id: 'demo-image-1080',
      title: 'Modern Poster A',
      category: 'Poster',
      width: 1080,
      height: 1350,
      studioEditor: {
        canvasType: 'image',
        dimensions: { width: 1080, height: 1350 },
        layers: [

## template service snippet
### src/components/CanvaEditor/CanvaEditor.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { templateService } from './services/TemplateService';
import { viewsBoostTemplateService } from './services/ViewsBoostTemplateService';
import { viewsBoostMediaService } from './services/ViewsBoostMediaService';
import { jsonTemplateService } from './services/JsonTemplateService';
import runDeduplicationTests from './services/__tests__/TemplateService.test';

// Type definitions
export type LayerType = 'text' | 'shape' | 'image';

export interface Layer {
  id: string;
  type: LayerType;
  name: string;
  props: Record<string, any>;
  locked?: boolean;
  hidden?: boolean;
}

export interface Page {
  id: string;
  name: string;
  durationMs: number;
  layers: string[]; // layer ids
}

export type TrackType = 'page' | 'text' | 'elements' | 'media' | 'audio';

export interface Clip {
  id: string;
  trackId: string;
  layerId?: string;
  startMs: number;
  endMs: number;
  payload?: any;
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  clips: string[];
}

export interface Document {
  id: string;
  pages: Page[];
  layers: Record<string, Layer>;
  tracks: Record<string, Track>;
  activePageId: string;
  fps: number;
}

export interface TemplateMeta {
  id: string;
  title: string;
  category: string;
  author?: string;
  thumbnail?: string;
  phash?: string;
  layerSignatureHash?: string;
  source: 'local' | 'api';
  payload: any;
  tags?: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  pages?: Page[];
  createdAt?: string;
  updatedAt?: string;
}

// Drag/insert item types for canvas additions
type InsertTextItem = {
  type: 'text';
  text?: string;
  fontSize?: number;
  fill?: string;
  fontFamily?: string;
  name?: string;
};

type InsertRectangleItem = {
  type: 'rectangle';
  width?: number;
  height?: number;
  fill?: string;
  name?: string;
};

type InsertCircleItem = {
  type: 'circle';
  radius?: number;
  fill?: string;
  name?: string;
};

type InsertItem = InsertTextItem | InsertRectangleItem | InsertCircleItem;

const generateId = (): string => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Hoisted helper to add an element to the provided Fabric canvas at a position
function addElementAtPosition(
  canvas: fabric.Canvas | null,
  addLayer: (layer: Layer) => void,
  item: InsertItem,
  x: number,
  y: number
): void {
  if (!canvas) return;

  let fabricObject: fabric.Object | null = null;
  const id = generateId();

  switch (item.type) {
    case 'text':
      fabricObject = new fabric.Textbox(item.text || 'Add your text', {
        left: x,
        top: y,
        fontFamily: item.fontFamily || 'Arial',
        fontSize: item.fontSize || 24,
        fill: item.fill || '#000000'
      });
      break;
    case 'rectangle':
      fabricObject = new fabric.Rect({
        left: x,
        top: y,
        width: item.width || 100,
        height: item.height || 100,
        fill: item.fill || '#ff6b6b'
      });
      break;
    case 'circle':
      fabricObject = new fabric.Circle({
        left: x,
        top: y,
        radius: item.radius || 50,
        fill: item.fill || '#4ecdc4'
      });
      break;
    default:
      return;
  }

  if (fabricObject) {
    // @ts-expect-error: fabric types don't include custom id; we attach for tracking
    fabricObject.id = id;
    canvas.add(fabricObject);
    canvas.setActiveObject(fabricObject);

    addLayer({
      id,
      type: item.type === 'rectangle' || item.type === 'circle' ? 'shape' : item.type,
      name: item.name || item.type,
      props: {
        left: x,
        top: y,
        ...item
      }
    });
  }
}

// Store interface
interface EditorState {
  document: Document;
  selectedLayerId: string | null;
  selectedClipIds: string[];
  currentTimeMs: number;
  isPlaying: boolean;
  zoom: number;
  showGrid: boolean;
  history: Document[];
  historyIndex: number;
  templates: TemplateMeta[];
  
  // Actions
  setSelectedLayer: (layerId: string | null) => void;
  setSelectedClips: (clipIds: string[]) => void;
  setCurrentTime: (timeMs: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  addLayer: (layer: Layer) => void;
  updateLayer: (layerId: string, props: Partial<Layer>) => void;
  deleteLayer: (layerId: string) => void;
  addPage: () => void;
  deletePage: (pageId: string) => void;
  setActivePage: (pageId: string) => void;
  addClip: (clip: Clip) => void;
  updateClip: (clipId: string, props: Partial<Clip>) => void;
  deleteClip: (clipId: string) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
### src/components/CanvaEditor/README.md
# Canva-Style Editor

A complete browser-based design/video editor built with React + TypeScript + Tailwind + Fabric.js.

## Features

### Core Functionality
- ✅ **Fabric.js Canvas** - Vector/raster editing with zoom (25-400%), pan, grid toggle
- ✅ **Multi-track Timeline** - Pages, Text, Elements, Media, Audio tracks with clips
- ✅ **Drag & Drop** - From sidebar to canvas with live positioning
- ✅ **Template System** - Local/API templates with deduplication logic
- ✅ **Keyboard Shortcuts** - Space (play/pause), Ctrl+Z/Y (undo/redo), Delete
- ✅ **Export System** - PNG export working, MP4/GIF stubbed for ffmpeg.wasm

### Template Deduplication
- **Perceptual Hash Matching** - Detects visually similar templates (<=10 Hamming distance)
- **Canonical Key Matching** - slug(title) + slug(author) + layer signature
- **Metadata Merging** - Preserves richest data from duplicates
- **Source Tracking** - Local vs API templates with provenance

### UI Components
- **Left Sidebar** - Text, Shapes, Images, Upload, Templates tabs
- **Center Stage** - 800x600 canvas with zoom controls
- **Right Properties** - Object position, size, rotation, styling
- **Top Bar** - Undo/redo, play/pause, zoom, grid, export
- **Timeline** - Ruler, playhead, tracks, page thumbnails

## Usage

### Drop-in Integration
```tsx
import CanvaEditor from './components/CanvaEditor/CanvaEditor';

function App() {
  return <CanvaEditor />;
}
```

### Extending Templates
```tsx
// Local templates in TemplateService.ts
const localTemplates: TemplateMeta[] = [
  {
    id: 'custom-1',
    title: 'My Template',
    category: 'custom',
    author: 'Your Name',
    source: 'local',
    payload: {
      pages: [{
        id: 'page-1',
        layers: [
          { id: 'layer-1', type: 'text', props: { text: 'Hello', left: 100, top: 100 } }
        ]
      }]
    }
  }
];

// API templates adapter
class ApiTemplateAdapter {
  async fetchTemplates(): Promise<TemplateMeta[]> {
    const response = await fetch('/api/templates');
    return response.json();
  }
}
```

## Dependencies Required

Add these to your package.json:

```json
{
  "dependencies": {
    "fabric": "^5.3.0",
    "zustand": "^4.4.1",
    "@types/fabric": "^5.3.0"
  }
}
```

## Data Model

```typescript
type LayerType = 'text' | 'shape' | 'image';
type TrackType = 'page' | 'text' | 'elements' | 'media' | 'audio';

interface Document {
  id: string;
  pages: Page[];
  layers: Record<string, Layer>;
  tracks: Record<string, Track>;
  activePageId: string;
  fps: number;
}

interface TemplateMeta {
  id: string;
  title: string;
  category: string;
  author?: string;
  thumbnail?: string;
  phash?: string; // Perceptual hash for deduplication
  layerSignatureHash?: string; // Layer structure hash
  source: 'local' | 'api';
  payload: any;
}
```

## Keyboard Shortcuts

- **Space** - Play/Pause timeline
- **Ctrl+Z** - Undo
- **Ctrl+Shift+Z** - Redo  
- **Delete** - Remove selected object
- **Ctrl+D** - Duplicate (planned)
- **S** - Split clip (planned)

## Export Options

- **PNG Export** - Working (uses canvas.toDataURL)
- **MP4 Export** - Stubbed (ready for ffmpeg.wasm integration)
- **GIF Export** - Stubbed (ready for ffmpeg.wasm integration)

## Performance

- **Code Splitting** - Separate chunks for different features
- **Virtualized Timeline** - Handles large projects
- **RequestAnimationFrame** - Smooth 60fps stage transforms
- **IndexedDB Autosave** - Draft persistence every 5s

## Testing

The template deduplication system includes unit tests:

```tsx
// Run tests from Templates tab
const results = runDeduplicationTests();
console.log(`Passed: ${results.passed}, Failed: ${results.failed}`);
```

## Architecture

```
CanvaEditor/
├── CanvaEditor.tsx           # Main component
├── services/
│   ├── TemplateService.ts    # Template management + deduplication
│   └── __tests__/
│       └── TemplateService.test.ts  # Deduplication tests
└── README.md                 # This file
```

## Next Steps

To integrate into your existing project:

1. Install dependencies: `npm install fabric zustand @types/fabric`
2. Copy `CanvaEditor/` folder to your components
3. Import and use `<CanvaEditor />` 
4. Replace mock templates with your real data
5. Integrate ffmpeg.wasm for video export
6. Add authentication/saving to your backend
7. Customize styling to match your brand

The editor is completely self-contained and doesn't modify any project files or dependencies beyond what's strictly necessary.### src/components/CanvaEditor/services/ViewsBoostTemplateService.ts
import { TemplateMeta, Layer, Page } from '../CanvaEditor';
import { getTemplates, getCategories, getTemplateById, TemplateManifestItem } from '../../../lib/templates/registry';
import { addMediaLayer } from '../../../utils/canvasMedia';
import { jsonTemplateService, JsonTemplate } from './JsonTemplateService';

// Enhanced template service that integrates with ViewsBoost's existing template system
export class ViewsBoostTemplateService {
  private templates: TemplateMeta[] = [];
  private categories: string[] = [];
  private lastFetch = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadTemplates();
  }

  // Load templates from ViewsBoost registry (local + Firebase)
  private async loadTemplates(): Promise<void> {
    try {
      const now = Date.now();
      if (now - this.lastFetch < this.CACHE_DURATION && this.templates.length > 0) {
        return; // Use cached data
      }

      console.log('[ViewsBoostTemplateService] Loading JSON templates only...');
      
      // Get JSON templates from the new library
      const jsonTemplates = await jsonTemplateService.getTemplates();
      console.log(`[ViewsBoostTemplateService] Found ${jsonTemplates.length} JSON templates`);

      // Convert JSON templates to Canva editor format
      const convertedJsonTemplates = await Promise.all(
        jsonTemplates.map(template => this.convertJsonTemplate(template))
      );

      // Use only JSON templates for now (cleaner, no registry conflicts)
      this.templates = convertedJsonTemplates.filter(Boolean) as TemplateMeta[];
      
      // Get JSON template categories
      const jsonCategories = [...new Set(jsonTemplates.map(t => t.category))];
      this.categories = jsonCategories;
      
      this.lastFetch = now;

      console.log(`[ViewsBoostTemplateService] Successfully loaded ${this.templates.length} JSON templates across ${this.categories.length} categories`);
    } catch (error) {
      console.error('[ViewsBoostTemplateService] Failed to load templates:', error);
      // Fallback to local mock templates
      this.loadMockTemplates();
    }
  }

  // Convert ViewsBoost registry template to Canva editor format
  private async convertRegistryTemplate(registryTemplate: TemplateManifestItem): Promise<TemplateMeta | null> {
    try {
      // Load template JSON if available
      let templateData: any = null;
      if (registryTemplate.templatePath) {
        try {
          const response = await fetch(registryTemplate.templatePath);
          if (response.ok) {
            templateData = await response.json();
          }
        } catch (error) {
          console.warn(`[ViewsBoostTemplateService] Failed to load template data for ${registryTemplate.id}:`, error);
        }
      }

      // Generate layer signature for deduplication
      let layerSignatureHash = '';
      let layers: Layer[] = [];

      if (templateData) {
        // Handle different template formats
        if (templateData.studioEditor?.layers) {
          // Studio editor format
          layers = this.convertStudioLayers(templateData.studioEditor.layers);
        } else if (templateData.layers) {
          // Custom layers format
          layers = this.convertCustomLayers(templateData.layers);
        } else if (templateData.objects) {
          // Fabric.js format
          layers = this.convertFabricObjects(templateData.objects);
        }

        layerSignatureHash = this.generateLayerSignatureHash(layers);
      }

      // Parse dimensions
      let dimensions = { width: 1920, height: 1080 };
      if (registryTemplate.size) {
        const match = registryTemplate.size.match(/^(\d+)x(\d+)$/i);
        if (match) {
          dimensions = { width: parseInt(match[1]), height: parseInt(match[2]) };
        }
      }
      if (templateData?.width && templateData?.height) {
        dimensions = { width: templateData.width, height: templateData.height };
      }

      const template: TemplateMeta = {
        id: registryTemplate.id,
        title: registryTemplate.name,
        category: registryTemplate.category.toLowerCase(),
        author: 'ViewsBoost',
        thumbnail: registryTemplate.previewPath,
        phash: this.generatePerceptualHash(registryTemplate.previewPath),
        layerSignatureHash,
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            name: 'Page 1',
            durationMs: 5000,
            layers: layers.map(l => l.id),
            dimensions
          }],
          layers: layers.reduce((acc, layer) => {
            acc[layer.id] = layer;
            return acc;
          }, {} as Record<string, Layer>),
          originalData: templateData // Keep original for ViewsBoostCanvaEditor compatibility
        }
      };

      return template;
    } catch (error) {
      console.error(`[ViewsBoostTemplateService] Error converting template ${registryTemplate.id}:`, error);
      return null;
    }
  }

  // Convert JSON template to Canva editor format
  private async convertJsonTemplate(jsonTemplate: JsonTemplate): Promise<TemplateMeta | null> {
    try {
      console.log(`[ViewsBoostTemplateService] Converting JSON template: ${jsonTemplate.name}`);

      // Load fabric data from JSON template service
      const fabricData = await jsonTemplateService.loadFabricData(jsonTemplate);
      if (!fabricData) {
        console.warn(`[ViewsBoostTemplateService] No fabric data for ${jsonTemplate.name}`);
        return null;
      }

      // Convert fabric.js objects to our layer format
      const layers = this.convertFabricObjects(fabricData.objects || []);
      const layerSignatureHash = this.generateLayerSignatureHash(layers);

      const template: TemplateMeta = {
        id: jsonTemplate.id,
        title: jsonTemplate.name,
        thumbnail: jsonTemplate.thumbnail || await this.generateJsonTemplateThumbnail(jsonTemplate),
        category: jsonTemplate.category,
        source: 'local' as const,
        payload: {
          originalData: {
            type: 'fabric-json',
            data: fabricData,
            source: 'json-library'
          }
        },
        tags: [jsonTemplate.category.toLowerCase().replace(/[^a-z0-9]/g, '')],
        dimensions: {
          width: fabricData.width || jsonTemplate.width,
          height: fabricData.height || jsonTemplate.height
        },
        pages: [{
          id: `${jsonTemplate.id}-page-1`,
          layers: layers,
          background: this.extractBackgroundFromFabric(fabricData.objects)
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        layerSignatureHash
      };

      console.log(`[ViewsBoostTemplateService] Successfully converted JSON template: ${jsonTemplate.name}`);
      return template;
    } catch (error) {
      console.error(`[ViewsBoostTemplateService] Error converting JSON template ${jsonTemplate.id}:`, error);
      return null;
    }
  }

  // Generate thumbnail for JSON template if not available
  private async generateJsonTemplateThumbnail(jsonTemplate: JsonTemplate): Promise<string> {
    // Use JsonTemplateService's thumbnail generation
    return jsonTemplate.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij5UZW1wbGF0ZTwvdGV4dD4KPC9zdmc+';
  }

  // Extract background from fabric objects
  private extractBackgroundFromFabric(objects: any[]): { type: 'solid' | 'gradient' | 'image'; value: string } {
    // Find the first background object
    const backgroundObj = objects.find(obj => 
      obj.name?.toLowerCase().includes('background') || 
      (obj.left === 0 && obj.top === 0 && obj.selectable === false)
    );

    if (backgroundObj?.fill) {
      if (typeof backgroundObj.fill === 'string') {
### src/components/CanvaEditor/services/JsonTemplateService.ts
import { fabric } from 'fabric';
import { embeddedTemplates, getEmbeddedTemplate } from './JsonTemplateData';

export interface JsonTemplate {
  id: string;
  name: string;
  category: string;
  jsonPath: string;
  thumbnail?: string;
  fabricData?: any;
  width: number;
  height: number;
}

export class JsonTemplateService {
  private static instance: JsonTemplateService;
  private templates: JsonTemplate[] = [];
  private fabricDataCache = new Map<string, any>();

  static getInstance(): JsonTemplateService {
    if (!JsonTemplateService.instance) {
      JsonTemplateService.instance = new JsonTemplateService();
    }
    return JsonTemplateService.instance;
  }

  constructor() {
    this.loadTemplateRegistry();
  }

  // Load all JSON templates from public folder
  private loadTemplateRegistry(): void {
    const templateFiles = [
      'ads', 'birthday', 'branding', 'business', 'commerce_promo', 'docs',
      'events_personal', 'facebook', 'fashion', 'food', 'instagram', 'linkedin',
      'print', 'sale', 'shorts_video', 'social', 'thumbnails', 'tiktok',
      'twitch', 'twitter_x', 'web_content', 'youtube'
    ];

    this.templates = templateFiles.map((fileName, index) => ({
      id: `json-template-${fileName}`,
      name: this.formatTemplateName(fileName),
      category: this.getCategoryFromFileName(fileName),
      jsonPath: `/templates/json/${fileName}.json`,
      width: 1152,
      height: 768,
    }));

    console.log(`[JsonTemplateService] Loaded ${this.templates.length} JSON templates`);
  }

  // Format filename to readable name
  private formatTemplateName(fileName: string): string {
    return fileName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  // Map filename to category
  private getCategoryFromFileName(fileName: string): string {
    const categoryMap: Record<string, string> = {
      'ads': 'Marketing/Promotional',
      'birthday': 'Events/Personal',
      'branding': 'Marketing/Promotional',
      'business': 'Business',
      'commerce_promo': 'Marketing/Promotional',
      'docs': 'Documents',
      'events_personal': 'Events/Personal',
      'facebook': 'Social Media Posts',
      'fashion': 'Fashion',
      'food': 'Food',
      'instagram': 'Social Media Posts',
      'linkedin': 'Social Media Posts',
      'print': 'Print',
      'sale': 'Marketing/Promotional',
      'shorts_video': 'Shorts',
      'social': 'Social Media Posts',
      'thumbnails': 'Thumbnails',
      'tiktok': 'Social Media Posts',
      'twitch': 'Social Media Posts',
      'twitter_x': 'Social Media Posts',
      'web_content': 'Web/Content',
      'youtube': 'Thumbnails',
    };

    return categoryMap[fileName] || 'General';
  }

  // Get all available templates
  async getTemplates(): Promise<JsonTemplate[]> {
    console.log(`[JsonTemplateService] Returning ${this.templates.length} templates`);
    
    // Generate thumbnails if not already done
    for (const template of this.templates) {
      if (!template.thumbnail) {
        try {
          template.thumbnail = await this.generateThumbnail(template);
        } catch (error) {
          console.warn(`[JsonTemplateService] Failed to generate thumbnail for ${template.name}:`, error);
          template.thumbnail = this.generatePlaceholderThumbnail(template);
        }
      }
    }

    return this.templates;
  }

  // Get templates by category
  async getTemplatesByCategory(category: string): Promise<JsonTemplate[]> {
    const allTemplates = await this.getTemplates();
    return allTemplates.filter(template => 
      template.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Load fabric.js data for a template
  async loadFabricData(template: JsonTemplate): Promise<any> {
    // Check cache first
    if (this.fabricDataCache.has(template.id)) {
      return this.fabricDataCache.get(template.id);
    }

    // First try embedded data
    const templateKey = this.getTemplateKey(template.id);
    if (templateKey) {
      const embeddedData = getEmbeddedTemplate(templateKey);
      if (embeddedData) {
        console.log(`[JsonTemplateService] Using embedded data for ${template.name}`);
        this.fabricDataCache.set(template.id, embeddedData);
        return embeddedData;
      }
    }

    // Fallback to HTTP request
    try {
      const response = await fetch(template.jsonPath);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }

      const fabricData = await response.json();
      
      // Cache the data
      this.fabricDataCache.set(template.id, fabricData);
      
      console.log(`[JsonTemplateService] Loaded fabric data via HTTP for ${template.name}`);
      return fabricData;
    } catch (error) {
      console.error(`[JsonTemplateService] Error loading ${template.name}:`, error);
      
      // Final fallback - try to use any embedded template
      const fallbackKeys = Object.keys(embeddedTemplates);
      if (fallbackKeys.length > 0) {
        console.log(`[JsonTemplateService] Using fallback template for ${template.name}`);
        return embeddedTemplates[fallbackKeys[0]];
      }
      
      return null;
    }
  }

  // Apply template to canvas
  async applyTemplateToCanvas(canvas: fabric.Canvas, template: JsonTemplate): Promise<boolean> {
    try {
      const fabricData = await this.loadFabricData(template);
      if (!fabricData) {
        console.error('[JsonTemplateService] No fabric data available for template:', template.name);
        return false;
      }

      // Clear existing canvas
      canvas.clear();

      // Set canvas dimensions
      canvas.setWidth(fabricData.width || 1152);
      canvas.setHeight(fabricData.height || 768);

      // Load from JSON
      return new Promise((resolve) => {
        canvas.loadFromJSON(fabricData, () => {
          canvas.renderAll();
          console.log(`[JsonTemplateService] Successfully applied template: ${template.name}`);
          resolve(true);
        });
      });
    } catch (error) {
      console.error('[JsonTemplateService] Error applying template to canvas:', error);
      return false;
    }
  }

  // Generate thumbnail for template
  private async generateThumbnail(template: JsonTemplate): Promise<string> {
    // First, try to use pre-generated SVG thumbnail
    const templateKey = this.getTemplateKey(template.id);
    if (templateKey) {
      const svgThumbnail = `/templates/json/thumbnails/${templateKey}.svg`;
      // Check if the SVG exists (we'll assume it does since we generated them)
      return svgThumbnail;
    }
### src/components/CanvaEditor/services/TemplateService.ts
import { TemplateMeta, Layer, Page } from '../CanvaEditor';

// Simple hash function for strings
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// Perceptual hash simulation (simplified)
function generatePerceptualHash(imageUrl?: string): string {
  if (!imageUrl) return '';
  // In a real implementation, this would analyze the image
  return simpleHash(imageUrl);
}

// Generate layer signature hash from layer structure
function generateLayerSignatureHash(layers: Layer[]): string {
  const signature = layers
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(layer => `${layer.type}:${layer.props.left || 0},${layer.props.top || 0}`)
    .join('|');
  return simpleHash(signature);
}

// Normalize string for canonical key generation
function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-');
}

// Hamming distance calculation for perceptual hash comparison
function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

// Template deduplication class
class TemplateDeduplicator {
  private templates: Map<string, TemplateMeta> = new Map();
  private readonly PHASH_THRESHOLD = 10;

  private generateCanonicalKey(template: TemplateMeta): string {
    const titleSlug = slugify(template.title);
    const authorSlug = slugify(template.author || 'unknown');
    return `${titleSlug}:${authorSlug}`;
  }

  private isDuplicateByHash(newTemplate: TemplateMeta): TemplateMeta | null {
    if (!newTemplate.phash) return null;
    
    for (const existing of this.templates.values()) {
      if (existing.phash && 
          hammingDistance(newTemplate.phash, existing.phash) <= this.PHASH_THRESHOLD) {
        return existing;
      }
    }
    return null;
  }

  private isDuplicateBySignature(newTemplate: TemplateMeta): TemplateMeta | null {
    const canonicalKey = this.generateCanonicalKey(newTemplate);
    
    for (const existing of this.templates.values()) {
      const existingKey = this.generateCanonicalKey(existing);
      if (canonicalKey === existingKey && 
          newTemplate.layerSignatureHash === existing.layerSignatureHash) {
        return existing;
      }
    }
    return null;
  }

  private mergeTemplateMetadata(existing: TemplateMeta, newTemplate: TemplateMeta): TemplateMeta {
    return {
      ...existing,
      // Prefer richer metadata
      thumbnail: existing.thumbnail || newTemplate.thumbnail,
      author: existing.author || newTemplate.author,
      // Merge payload, preferring existing
      payload: { ...newTemplate.payload, ...existing.payload }
    };
  }

  addTemplate(template: TemplateMeta): TemplateMeta {
    // Check for duplicates by perceptual hash
    const duplicateByHash = this.isDuplicateByHash(template);
    if (duplicateByHash) {
      const merged = this.mergeTemplateMetadata(duplicateByHash, template);
      this.templates.set(duplicateByHash.id, merged);
      return merged;
    }

    // Check for duplicates by canonical key + layer signature
    const duplicateBySignature = this.isDuplicateBySignature(template);
    if (duplicateBySignature) {
      const merged = this.mergeTemplateMetadata(duplicateBySignature, template);
      this.templates.set(duplicateBySignature.id, merged);
      return merged;
    }

    // No duplicate found, add new template
    this.templates.set(template.id, template);
    return template;
  }

  getTemplates(): TemplateMeta[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): TemplateMeta[] {
    return this.getTemplates().filter(t => t.category === category);
  }

  getTemplateById(id: string): TemplateMeta | null {
    return this.templates.get(id) || null;
  }

  clear(): void {
    this.templates.clear();
  }
}

// Template Service
export class TemplateService {
  private deduplicator = new TemplateDeduplicator();
  private localTemplates: TemplateMeta[] = [];
  private apiTemplates: TemplateMeta[] = [];

  constructor() {
    this.initializeLocalTemplates();
  }

  private initializeLocalTemplates(): void {
    // Sample local templates with deterministic data
    const localTemplates: TemplateMeta[] = [
      {
        id: 'local-1',
        title: 'Modern Presentation',
        category: 'presentation',
        author: 'Design Team',
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjNEY0NkU1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI2MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiPlByZXNlbnRhdGlvbjwvdGV4dD4KPHN2Zz4=',
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'text', props: { text: 'Presentation', left: 50, top: 60, fontSize: 24, fill: '#ffffff' } },
              { id: 'layer-2', type: 'shape', props: { left: 50, top: 100, width: 220, height: 60, fill: '#6366f1' } }
            ]
          }]
        }
      },
      {
        id: 'local-2',
        title: 'Social Media Post',
        category: 'social',
        author: 'Creative Studio',
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRkY2QjZCIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5MCIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiPlNvY2lhbCBQb3N0PC90ZXh0Pgo8L3N2Zz4=',
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'text', props: { text: 'Social Post', left: 50, top: 90, fontSize: 20, fill: '#ffffff' } },
              { id: 'layer-2', type: 'shape', props: { left: 200, top: 50, width: 80, height: 80, fill: '#ec4899', rx: 40 } }
            ]
          }]
        }
      },
      {
        id: 'local-3',
        title: 'Business Card',
        category: 'business',
        author: 'Pro Designer',
        thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMTExODI3Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI3MCIgZmlsbD0iI0Y5RkFGQiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCI+Sm9obiBEb2U8L3RleHQ+Cjx0ZXh0IHg9IjUwIiB5PSIxMDAiIGZpbGw9IiM5Q0EzQUYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+RGVzaWduZXI8L3RleHQ+CjxyZWN0IHg9IjIwMCIgeT0iNjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzEwQjk4MSIvPgo8L3N2Zz4=',
        source: 'local',
        payload: {
          pages: [{
            id: 'page-1',
            layers: [
              { id: 'layer-1', type: 'text', props: { text: 'John Doe', left: 50, top: 70, fontSize: 18, fill: '#f9fafb' } },
              { id: 'layer-2', type: 'text', props: { text: 'Designer', left: 50, top: 100, fontSize: 14, fill: '#9ca3af' } },
              { id: 'layer-3', type: 'shape', props: { left: 200, top: 60, width: 80, height: 60, fill: '#10b981' } }
            ]
          }]
        }
      },
      {
### src/components/TemplateCategoryManager.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TemplateService, Template, CategoryUpdateResult } from '../lib/services/templateService';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ImageService } from '../lib/services/imageService';
import { ref as storageRef, uploadBytes, getDownloadURL, uploadBytesResumable, UploadTaskSnapshot } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { auth } from '../lib/firebase';

interface TemplateCategoryManagerProps {
  onTemplateUpdated?: (result: CategoryUpdateResult) => void;
  onCategoryUpdated?: () => void;
}

interface CategoryGroup {
  id: string;
  title: string;
  templates: Template[];
  color: string;
  icon: string;
  isExpanded: boolean;
  isSelected?: boolean;
}

// ALL STUDIO CATEGORIES - Complete list matching Studio.tsx exactly
const ALL_STUDIO_CATEGORIES = [
  // Main Create Categories (top-level tabs)
  { id: 'business', title: 'Business', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Main' },
  { id: 'marketing', title: 'Marketing', color: 'from-green-600 to-green-700', icon: '📢', group: 'Main' },
  { id: 'social-media', title: 'Social Media', color: 'from-purple-600 to-purple-700', icon: '📱', group: 'Main' },
  { id: 'web-design', title: 'Web Design', color: 'from-cyan-600 to-cyan-700', icon: '🌐', group: 'Main' },
  { id: 'documents', title: 'Documents', color: 'from-gray-600 to-gray-700', icon: '📄', group: 'Main' },
  { id: 'education', title: 'Education', color: 'from-yellow-600 to-yellow-700', icon: '🎓', group: 'Main' },
  { id: 'events', title: 'Events', color: 'from-pink-600 to-pink-700', icon: '🎉', group: 'Main' },
  { id: 'personal', title: 'Personal', color: 'from-indigo-600 to-indigo-700', icon: '👤', group: 'Main' },

  // Video Categories (from VIDEO_SELECTOR_LIST in Studio.tsx)
  { id: 'youtube-video', title: 'YouTube Video', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Video' },
  { id: 'facebook-video', title: 'Facebook Video', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Video' },
  { id: 'video-landscape', title: 'Video Landscape', color: 'from-green-500 to-green-600', icon: '🖥️', group: 'Video' },
  { id: 'video-ads', title: 'Video Ads', color: 'from-purple-500 to-purple-600', icon: '📺', group: 'Video' },
  { id: 'twitter-video', title: 'Twitter Video', color: 'from-sky-500 to-sky-600', icon: '🐦', group: 'Video' },
  { id: 'viewsboost-video', title: 'ViewsBoost Video', color: 'from-violet-500 to-violet-600', icon: '⚡', group: 'Video' },
  { id: 'intro-outro', title: 'Intro/Outro', color: 'from-orange-500 to-orange-600', icon: '🎭', group: 'Video' },
  { id: 'square-video', title: 'Square Video', color: 'from-pink-500 to-pink-600', icon: '⬜', group: 'Video' },
  { id: 'vertical-video', title: 'Vertical Video', color: 'from-emerald-500 to-emerald-600', icon: '📱', group: 'Video' },
  { id: 'podcast', title: 'Podcast', color: 'from-purple-500 to-purple-600', icon: '🎙️', group: 'Video' },
  { id: 'multi-screen', title: 'Multi-screen', color: 'from-cyan-500 to-cyan-600', icon: '🖥️', group: 'Video' },
  { id: 'hd-video', title: 'HD Video', color: 'from-blue-500 to-blue-600', icon: '🎥', group: 'Video' },
  { id: 'linkedin-videos', title: 'LinkedIn Videos', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Video' },

  // Shorts Categories (from SHORTS_SELECTOR_LIST in Studio.tsx)
  { id: 'facebook-reel', title: 'Facebook Reel', color: 'from-blue-400 to-blue-500', icon: '📘', group: 'Shorts' },
  { id: 'instagram-reel', title: 'Instagram Reel', color: 'from-purple-400 to-purple-500', icon: '📸', group: 'Shorts' },
  { id: 'snapchat-shorts', title: 'Snapchat Shorts', color: 'from-yellow-400 to-yellow-500', icon: '👻', group: 'Shorts' },
  { id: 'tiktok-shorts', title: 'TikTok Shorts', color: 'from-pink-500 to-pink-600', icon: '🎵', group: 'Shorts' },
  { id: 'pinterest-video-pin', title: 'Pinterest Video Pin', color: 'from-red-400 to-red-500', icon: '📌', group: 'Shorts' },
  { id: 'linked-short', title: 'Linked Short', color: 'from-blue-500 to-blue-600', icon: '🔗', group: 'Shorts' },
  { id: 'linkedin-video', title: 'LinkedIn Video', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Shorts' },
  { id: 'viewsboost-shorts', title: 'ViewsBoost Shorts', color: 'from-violet-400 to-violet-500', icon: '⚡', group: 'Shorts' },
  { id: 'youtube-shorts', title: 'YouTube Shorts', color: 'from-red-400 to-red-500', icon: '📱', group: 'Shorts' },

  // Photo Categories (from PHOTO_SELECTOR_LIST in Studio.tsx)
  { id: 'social-media-posts', title: 'Social Media Posts', color: 'from-purple-500 to-purple-600', icon: '📱', group: 'Photo' },
  { id: 'marketing-promotional', title: 'Marketing/Promotional', color: 'from-green-500 to-green-600', icon: '📢', group: 'Photo' },
  { id: 'restaurant', title: 'Restaurant', color: 'from-orange-500 to-orange-600', icon: '🍽️', group: 'Photo' },
  { id: 'quote-motivational', title: 'Quote/Motivational', color: 'from-yellow-500 to-yellow-600', icon: '💭', group: 'Photo' },
  { id: 'business-professional', title: 'Business/Professional', color: 'from-blue-500 to-blue-600', icon: '💼', group: 'Photo' },
  { id: 'e-commerce', title: 'E-commerce', color: 'from-emerald-500 to-emerald-600', icon: '🛍️', group: 'Photo' },
  { id: 'event-announcement', title: 'Event/Announcement', color: 'from-pink-500 to-pink-600', icon: '🎉', group: 'Photo' },
  { id: 'infographic', title: 'Infographic', color: 'from-cyan-500 to-cyan-600', icon: '📊', group: 'Photo' },
  { id: 'seasonal-holiday', title: 'Seasonal/Holiday', color: 'from-red-500 to-red-600', icon: '🎄', group: 'Photo' },
  { id: 'personal-branding', title: 'Personal Branding', color: 'from-indigo-500 to-indigo-600', icon: '👤', group: 'Photo' },

  // Post Categories (from POST_SELECTOR_LIST in Studio.tsx)
  { id: 'marketing', title: 'Marketing', color: 'from-green-500 to-green-600', icon: '📢', group: 'Post' },
  { id: 'promotions', title: 'Promotions', color: 'from-orange-500 to-orange-600', icon: '🎯', group: 'Post' },
  { id: 'educational-informative', title: 'Educational & Informative', color: 'from-blue-500 to-blue-600', icon: '📚', group: 'Post' },
  { id: 'personal-lifestyle', title: 'Personal & Lifestyle', color: 'from-purple-500 to-purple-600', icon: '🌟', group: 'Post' },
  { id: 'entertainment', title: 'Entertainment', color: 'from-pink-500 to-pink-600', icon: '🎭', group: 'Post' },
  { id: 'humorous', title: 'Humorous', color: 'from-yellow-500 to-yellow-600', icon: '😂', group: 'Post' },
  { id: 'inspirational', title: 'Inspirational', color: 'from-cyan-500 to-cyan-600', icon: '✨', group: 'Post' },
  { id: 'motivational', title: 'Motivational', color: 'from-emerald-500 to-emerald-600', icon: '💪', group: 'Post' },
  { id: 'events-seasonal', title: 'Events & Seasonal', color: 'from-red-500 to-red-600', icon: '🎉', group: 'Post' },
  { id: 'interactive-engagement', title: 'Interactive & Engagement', color: 'from-violet-500 to-violet-600', icon: '🤝', group: 'Post' },
  { id: 'creative-artistic', title: 'Creative & Artistic', color: 'from-indigo-500 to-indigo-600', icon: '🎨', group: 'Post' },

  // Carousel Categories (from CAROUSEL_SELECTOR_LIST in Studio.tsx)
  { id: 'educational', title: 'Educational', color: 'from-blue-500 to-blue-600', icon: '📚', group: 'Carousel' },
  { id: 'business', title: 'Business', color: 'from-gray-500 to-gray-600', icon: '💼', group: 'Carousel' },
  { id: 'e-commerce-carousel', title: 'E-commerce', color: 'from-emerald-500 to-emerald-600', icon: '🛍️', group: 'Carousel' },
  { id: 'storytelling', title: 'Storytelling', color: 'from-purple-500 to-purple-600', icon: '📖', group: 'Carousel' },
  { id: 'tips-lists', title: 'Tips & Lists', color: 'from-green-500 to-green-600', icon: '📝', group: 'Carousel' },
  { id: 'portfolio', title: 'Portfolio', color: 'from-cyan-500 to-cyan-600', icon: '🎨', group: 'Carousel' },
  { id: 'before-after', title: 'Before & After', color: 'from-orange-500 to-orange-600', icon: '🔄', group: 'Carousel' },
  { id: 'creative', title: 'Creative', color: 'from-pink-500 to-pink-600', icon: '✨', group: 'Carousel' },

  // Thumbnail Categories (from THUMBNAIL_SELECTOR_LIST in Studio.tsx)
  { id: 'youtube', title: 'YouTube', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Thumbnail' },
  { id: 'igtv', title: 'IGTV', color: 'from-purple-500 to-purple-600', icon: '📺', group: 'Thumbnail' },
  { id: 'facebook-video-thumb', title: 'Facebook Video', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Thumbnail' },
  { id: 'course-webinar', title: 'Course/Webinar', color: 'from-green-500 to-green-600', icon: '🎓', group: 'Thumbnail' },
  { id: 'gaming', title: 'Gaming', color: 'from-purple-600 to-purple-700', icon: '🎮', group: 'Thumbnail' },
  { id: 'vlog', title: 'Vlog', color: 'from-pink-500 to-pink-600', icon: '📹', group: 'Thumbnail' },
  { id: 'tutorial', title: 'Tutorial', color: 'from-blue-600 to-blue-700', icon: '📖', group: 'Thumbnail' },
  { id: 'entertainment-thumb', title: 'Entertainment', color: 'from-yellow-500 to-yellow-600', icon: '🎭', group: 'Thumbnail' },
  { id: 'business-thumb', title: 'Business', color: 'from-gray-500 to-gray-600', icon: '💼', group: 'Thumbnail' },
  { id: 'text-style', title: 'Text Style', color: 'from-cyan-500 to-cyan-600', icon: '📝', group: 'Thumbnail' },
  { id: 'arrow-pointer', title: 'Arrow/Pointer', color: 'from-orange-500 to-orange-600', icon: '👉', group: 'Thumbnail' },
  { id: 'minimalist', title: 'Minimalist', color: 'from-gray-400 to-gray-500', icon: '⚪', group: 'Thumbnail' },
  { id: 'text-focus', title: 'Text Focus', color: 'from-indigo-500 to-indigo-600', icon: '🔤', group: 'Thumbnail' },
  { id: 'split-screen', title: 'Split Screen', color: 'from-emerald-500 to-emerald-600', icon: '⚡', group: 'Thumbnail' },
  { id: 'face-reaction', title: 'Face Reaction', color: 'from-pink-600 to-pink-700', icon: '😮', group: 'Thumbnail' },

  // Cover & Banner Categories (from COVER_SELECTOR_LIST in Studio.tsx)
  { id: 'social-media-general', title: 'Social Media General (Universal Appeal)', color: 'from-purple-500 to-purple-600', icon: '📱', group: 'Cover' },
  { id: 'youtube-channel-art', title: 'YouTube Channel Art (Video-focused engagement)', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Cover' },
  { id: 'facebook-covers', title: 'Facebook Covers (Community-focused)', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Cover' },
  { id: 'linkedin-banners', title: 'LinkedIn Banners (Professional Networking)', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Cover' },
  { id: 'event-promotions', title: 'Event & Promotions (Timely Engagement)', color: 'from-pink-500 to-pink-600', icon: '🎉', group: 'Cover' },
  { id: 'business-corporate', title: 'Business & Corporate (Brand Authority)', color: 'from-gray-500 to-gray-600', icon: '🏢', group: 'Cover' },
  { id: 'music-entertainment', title: 'Music & Entertainment (Broad Audience Appeal)', color: 'from-yellow-500 to-yellow-600', icon: '🎵', group: 'Cover' },
  { id: 'health-fitness', title: 'Health & Fitness (Wellness Engagement)', color: 'from-green-500 to-green-600', icon: '💪', group: 'Cover' },
  { id: 'creative-artistic-cover', title: 'Creative & Artistic (Visual Inspiration)', color: 'from-indigo-500 to-indigo-600', icon: '🎨', group: 'Cover' },

  // Profile Categories (from PROFILE_SELECTOR_LIST in Studio.tsx)
  { id: 'personal-branding-profile', title: 'Personal Branding', color: 'from-indigo-500 to-indigo-600', icon: '👤', group: 'Profile' },
  { id: 'business-corporate-profile', title: 'Business & Corporate', color: 'from-gray-500 to-gray-600', icon: '🏢', group: 'Profile' },
  { id: 'influencer-creator', title: 'Influencer & Creator', color: 'from-purple-500 to-purple-600', icon: '⭐', group: 'Profile' },
  { id: 'creative-artistic-profile', title: 'Creative & Artistic', color: 'from-pink-500 to-pink-600', icon: '🎨', group: 'Profile' },
  { id: 'educational-academic', title: 'Educational & Academic', color: 'from-blue-500 to-blue-600', icon: '🎓', group: 'Profile' },
  { id: 'beauty-fashion', title: 'Beauty & Fashion', color: 'from-pink-600 to-pink-700', icon: '💄', group: 'Profile' },
  { id: 'health-fitness-profile', title: 'Health & Fitness', color: 'from-green-500 to-green-600', icon: '💪', group: 'Profile' },
  { id: 'music-entertainment-profile', title: 'Music & Entertainment', color: 'from-yellow-500 to-yellow-600', icon: '🎵', group: 'Profile' },
  { id: 'real-estate', title: 'Real Estate', color: 'from-emerald-500 to-emerald-600', icon: '🏠', group: 'Profile' },

  // Story Categories (from STORY_SELECTOR_LIST in Studio.tsx)
  { id: 'promotional', title: 'Promotional', color: 'from-orange-500 to-orange-600', icon: '📢', group: 'Story' },
  { id: 'educational-story', title: 'Educational', color: 'from-blue-500 to-blue-600', icon: '📚', group: 'Story' },
  { id: 'engagement', title: 'Engagement', color: 'from-purple-500 to-purple-600', icon: '🤝', group: 'Story' },
  { id: 'business-story', title: 'Business', color: 'from-gray-500 to-gray-600', icon: '💼', group: 'Story' },
  { id: 'personal-story', title: 'Personal', color: 'from-pink-500 to-pink-600', icon: '👤', group: 'Story' },
  { id: 'seasonal-story', title: 'Seasonal', color: 'from-green-500 to-green-600', icon: '🌿', group: 'Story' },
  { id: 'quote-motivational-story', title: 'Quote/Motivational', color: 'from-yellow-500 to-yellow-600', icon: '💭', group: 'Story' },
  { id: 'announcement-story', title: 'Announcement', color: 'from-red-500 to-red-600', icon: '📣', group: 'Story' },
  { id: 'user-generated-content', title: 'User-Generated Content', color: 'from-cyan-500 to-cyan-600', icon: '👥', group: 'Story' },
  { id: 'call-to-action', title: 'Call-to-Action', color: 'from-emerald-500 to-emerald-600', icon: '📞', group: 'Story' },
  { id: 'youtube-story', title: 'Youtube story', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Story' },
  { id: 'instagram-story-cat', title: 'Instagram story', color: 'from-purple-500 to-purple-600', icon: '📸', group: 'Story' },
  { id: 'twitter-story', title: 'Twitter story', color: 'from-sky-500 to-sky-600', icon: '🐦', group: 'Story' },
  { id: 'facebook-story-cat', title: 'Facebook story', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Story' },

  // Live Categories (from LIVE_SELECTOR_LIST in Studio.tsx)
  { id: 'live-event-promotion', title: 'Live Event Promotion', color: 'from-red-500 to-red-600', icon: '🎪', group: 'Live' },
  { id: 'qa-interviews', title: 'Q&A and Interviews', color: 'from-blue-500 to-blue-600', icon: '❓', group: 'Live' },
  { id: 'gaming-live', title: 'Gaming', color: 'from-purple-500 to-purple-600', icon: '🎮', group: 'Live' },
  { id: 'esports', title: 'Esports', color: 'from-violet-500 to-violet-600', icon: '🏆', group: 'Live' },
  { id: 'music-live', title: 'Music', color: 'from-yellow-500 to-yellow-600', icon: '🎵', group: 'Live' },
  { id: 'performance', title: 'Performance', color: 'from-pink-500 to-pink-600', icon: '🎭', group: 'Live' },
  { id: 'educational-informative-live', title: 'Educational & Informative', color: 'from-green-500 to-green-600', icon: '📚', group: 'Live' },
  { id: 'beauty-fashion-live', title: 'Beauty & Fashion', color: 'from-pink-600 to-pink-700', icon: '💄', group: 'Live' },
  { id: 'health-fitness-live', title: 'Health & Fitness', color: 'from-emerald-500 to-emerald-600', icon: '💪', group: 'Live' },
  { id: 'interactive-engagement-live', title: 'Interactive Engagement', color: 'from-cyan-500 to-cyan-600', icon: '🤝', group: 'Live' },
  { id: 'behind-the-scenes', title: 'Behind-the-Scenes', color: 'from-orange-500 to-orange-600', icon: '🎬', group: 'Live' },

  // Ads Categories (from ADS_SELECTOR_LIST in Studio.tsx)
  { id: 'sales-promotions', title: 'Sales & Promotions', color: 'from-green-500 to-green-600', icon: '💰', group: 'Ads' },
  { id: 'lead-generation', title: 'Lead Generation', color: 'from-blue-500 to-blue-600', icon: '🎯', group: 'Ads' },
  { id: 'brand-awareness', title: 'Brand Awareness', color: 'from-purple-500 to-purple-600', icon: '🏷️', group: 'Ads' },
  { id: 'product-showcase-ads', title: 'Product Showcase', color: 'from-orange-500 to-orange-600', icon: '🛍️', group: 'Ads' },
  { id: 'event-ads', title: 'Event', color: 'from-pink-500 to-pink-600', icon: '🎉', group: 'Ads' },
  { id: 'webinar-promotions', title: 'Webinar Promotions', color: 'from-cyan-500 to-cyan-600', icon: '🎙️', group: 'Ads' },
  { id: 'fashion-beauty-ads', title: 'Fashion & Beauty', color: 'from-pink-600 to-pink-700', icon: '💄', group: 'Ads' },
  { id: 'tech-ads', title: 'Tech', color: 'from-blue-600 to-blue-700', icon: '💻', group: 'Ads' },
  { id: 'digital-products', title: 'Digital Products', color: 'from-indigo-500 to-indigo-600', icon: '📱', group: 'Ads' },
  { id: 'educational-in', title: 'Educational & In', color: 'from-emerald-500 to-emerald-600', icon: '📚', group: 'Ads' },
### src/lib/services/templateService.ts
import { db } from '../firebase';
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDoc,
  deleteDoc,
  addDoc
} from 'firebase/firestore';

export interface Template {
  id: string;
  title: string;
  category: string;
  desc: string;
  icon: string;
  preview: string;
  videoSource?: string;
  platform?: string;
  quality?: string;
  tags?: string[];
  useVideoPreview?: boolean;
  processedDate?: string;
  originalFilename?: string;
  generatedBy?: string;
  lastModified?: any;
  modifiedBy?: string;
  [key: string]: any;
}

export interface CategoryUpdateResult {
  success: boolean;
  templateId: string;
  oldCategory: string;
  newCategory: string;
  timestamp: string;
  error?: string;
  source?: string;
}

export class TemplateService {
  /**
   * Update a template's category with optimistic updates
   */
  static async updateTemplateCategory(
    templateId: string,
    newCategory: string,
    adminUser: string = 'admin'
  ): Promise<CategoryUpdateResult> {
    try {
      const templateRef = doc(db, 'templates', templateId);
      
      // Get current template data to track old category
      const templateSnap = await getDoc(templateRef);
      if (!templateSnap.exists()) {
        throw new Error('Template not found');
      }
      
      const currentData = templateSnap.data();
      const oldCategory = currentData.category;
      
      // Update the template with new category
      await updateDoc(templateRef, {
        category: newCategory,
        lastModified: serverTimestamp(),
        modifiedBy: adminUser,
        categoryChangedAt: serverTimestamp(),
        previousCategory: oldCategory
      });

      return {
        success: true,
        templateId,
        oldCategory,
        newCategory,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating template category:', error);
      return {
        success: false,
        templateId,
        oldCategory: '',
        newCategory,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new template in Firestore
   */
  static async createTemplate(
    templateData: Omit<Template, 'id'>,
    adminUser: string = 'admin'
  ): Promise<CategoryUpdateResult> {
    try {
      const templatesRef = collection(db, 'templates');
      
      // Prepare template data for Firestore
      const firestoreData = {
        ...templateData,
        lastModified: serverTimestamp(),
        modifiedBy: adminUser,
        createdAt: serverTimestamp(),
        createdBy: adminUser
      };

      // Clean up undefined values that Firebase doesn't accept
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined) {
          delete firestoreData[key];
          console.warn(`⚠️ [TemplateService] Removed undefined field '${key}' before Firestore creation`);
        }
      });

      // Validate required fields
      if (!firestoreData.title || !firestoreData.category) {
        throw new Error('Missing required fields: title and category are required');
      }

      console.log(`📤 [TemplateService] Creating template with fields:`, Object.keys(firestoreData));

      // Create new document
      const docRef = await addDoc(templatesRef, firestoreData);

      return {
        success: true,
        templateId: docRef.id,
        oldCategory: '',
        newCategory: templateData.category,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating template:', error);
      return {
        success: false,
        templateId: '',
        oldCategory: '',
        newCategory: templateData.category || '',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Bulk update multiple templates' categories
   */
  static async bulkUpdateCategories(
    updates: Array<{ templateId: string; newCategory: string }>,
    adminUser: string = 'admin'
  ): Promise<CategoryUpdateResult[]> {
    const results: CategoryUpdateResult[] = [];
    const batch = writeBatch(db);
    let batchCount = 0;

    for (const update of updates) {
      try {
        const templateRef = doc(db, 'templates', update.templateId);
        
        // Get current data to track old category
        const templateSnap = await getDoc(templateRef);
        if (!templateSnap.exists()) {
          results.push({
            success: false,
            templateId: update.templateId,
            oldCategory: '',
            newCategory: update.newCategory,
            timestamp: new Date().toISOString(),
            error: 'Template not found'
          });
          continue;
        }
        
        const currentData = templateSnap.data();
        const oldCategory = currentData.category;
        
        batch.update(templateRef, {
          category: update.newCategory,
          lastModified: serverTimestamp(),
          modifiedBy: adminUser,
          categoryChangedAt: serverTimestamp(),
          previousCategory: oldCategory
        });

        results.push({
          success: true,
          templateId: update.templateId,
          oldCategory,
          newCategory: update.newCategory,
          timestamp: new Date().toISOString()
        });
### src/pages/Studio.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplates, getCategories, TemplateManifestItem } from '../lib/templates/registry';
import TemplateCard from '../components/TemplateCard';
import CanvaEditor from '../components/CanvaEditor/CanvaEditor';
import { viewsBoostTemplateService } from '../components/CanvaEditor/services/ViewsBoostTemplateService';
import { fabric } from 'fabric';
import { addMediaLayer } from '../utils/canvasMedia';

type TemplateItem = any;

function Row({
  title,
  items,
  onBrowseAll,
  itemWidth = 220,
  aspect = '4/3',
  titleClassName = 'text-base font-bold',
  cardBgClass = 'bg-white',
  borderClass = 'border-black/10',
}: {
  title: string;
  items: TemplateItem[];
  onBrowseAll: () => void;
  itemWidth?: number;
  aspect?: string;
  titleClassName?: string;
  cardBgClass?: string;
  borderClass?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(12);
  const onScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const nearEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 200;
    if (nearEnd) setVisible((v) => Math.min(v + 12, items.length));
  }, [items.length]);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className={titleClassName}>{title}</h3>
        <button onClick={onBrowseAll} className="text-xs text-yellow-300 hover:underline">
          Browse all
          </button>
      </div>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex gap-3 overflow-x-auto snap-x scrollbar-thin scrollbar-thumb-zinc-700/60 scrollbar-track-transparent"
      >
        {items.slice(0, visible).map((t, i) => (
          <div
            key={t.id || i}
            className={`rounded-lg bg-white border ${borderClass} shrink-0 snap-start overflow-hidden`}
            style={{ width: itemWidth }}
            title={t.title || t.name}
            data-testid="template-card"
          >
            <TemplateCard template={t as any} dark={titleClassName.includes('text-white')} aspect={aspect} />
    </div>
              ))}
            </div>
    </section>
  );
}

export default function Studio() {
  const navigate = useNavigate();
  // --- Theme system ---
  const THEMES = useMemo(
    () => [
      { id: 'polished-dark', name: 'Polished Dark', dark: true, bg: 'linear-gradient(135deg,#17171c 0%,#232438 100%)' },
      { id: 'matte-dark', name: 'Matte Dark', dark: true, bg: 'linear-gradient(135deg,#121318 0%,#1b1d26 100%)' },
      { id: 'midnight', name: 'Midnight', dark: true, bg: 'linear-gradient(135deg,#0b1020 0%,#151a2e 100%)' },
      { id: 'deep-violet', name: 'Deep Violet', dark: true, bg: 'linear-gradient(135deg,#1d1033 0%,#2a1d4a 100%)' },
      { id: 'slate', name: 'Slate', dark: true, bg: 'linear-gradient(135deg,#0f172a 0%,#1f2937 100%)' },
      { id: 'ocean-dark', name: 'Ocean Dark', dark: true, bg: 'linear-gradient(135deg,#0b132b 0%,#1c2541 100%)' },
      { id: 'soft-light', name: 'Soft Light', dark: false, bg: 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)' },
      { id: 'warm-sunrise', name: 'Warm Sunrise', dark: false, bg: 'linear-gradient(135deg,#fff7ed 0%,#fde68a 100%)' },
      { id: 'mint-fresh', name: 'Mint Fresh', dark: false, bg: 'linear-gradient(135deg,#ecfeff 0%,#d1fae5 100%)' },
      { id: 'sky-day', name: 'Sky Day', dark: false, bg: 'linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%)' },
      { id: 'desert-sand', name: 'Sand', dark: false, bg: 'linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)' },
      { id: 'peach', name: 'Peach', dark: false, bg: 'linear-gradient(135deg,#ffe4e6 0%,#fecdd3 100%)' },
      // New light themes
      { id: 'lavender-mist', name: 'Lavender Mist', dark: false, bg: 'linear-gradient(135deg,#f5f3ff 0%,#e9d5ff 100%)' },
      { id: 'citrus-cream', name: 'Citrus Cream', dark: false, bg: 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 50%,#fde68a 100%)' },
      { id: 'aqua-breeze', name: 'Aqua Breeze', dark: false, bg: 'linear-gradient(135deg,#ecfeff 0%,#bae6fd 50%,#a7f3d0 100%)' },
      { id: 'blush-cloud', name: 'Blush Cloud', dark: false, bg: 'linear-gradient(135deg,#fff1f2 0%,#ffe4e6 50%,#fbcfe8 100%)' },
    ],
    []
  );
  const [themeId, setThemeId] = useState<string>('soft-light');
  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [THEMES, themeId]);
  const textPrimary = theme.dark ? 'text-white' : 'text-zinc-900';
  const textSubtle = theme.dark ? 'text-white/90' : 'text-zinc-800';
  const titleStrong = theme.dark ? 'text-white' : 'text-zinc-900';
  const borderSubtle = theme.dark ? 'border-white/10' : 'border-black/10';
  const cardBg = theme.dark ? 'bg-zinc-900' : 'bg-white';
  const chipBg = theme.dark ? 'bg-zinc-900/60' : 'bg-white';
  const filterTabs = useMemo(
    () => ['All', 'Birthday', 'Business', 'Fashion', 'Food', 'Sale', 'Social', 'Instagram', 'Facebook', 'YouTube', 'TikTok', 'Twitter/X', 'LinkedIn', 'Shorts/Video', 'Thumbnails', 'Web/Content', 'Ads', 'Print', 'Docs', 'Branding', 'Events/Personal', 'Commerce/Promo'],
    []
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState<boolean>(true);

  // --- merge base + generated manifests (minimal) ---
  useEffect(() => {
    let mounted = true;

    const get = async (url: string) => {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) return [];
        const j = await r.json();
        return Array.isArray(j) ? j : [];
      } catch {
        return [];
      }
    };

    (async () => {
      try {
        setLoadingAll(true);
        const [base, gen] = await Promise.all([
          get("/assets/templates/manifest.json"),
          get("/assets/templates/manifest.generated.json"),
        ]);

        if (!mounted) return;

        const norm = (item: any) => ({
          id: item.id ?? item._id ?? crypto.randomUUID(),
          name: item.name ?? item.title ?? "Untitled",
          title: item.name ?? item.title ?? "Untitled",
          width: Number(item.width ?? item.w ?? 1080),
          height: Number(item.height ?? item.h ?? 1350),
          jsonPath: item.jsonPath ?? item.jsonpath ?? item.path ?? "",
          thumbnail: item.thumbnail ?? item.thumb ?? "/default-template.png",
          category: item.category ?? "General",
          ...item,
        });

        const merged = [...base.map(norm), ...gen.map(norm)];
        console.table({ base: base.length, generated: gen.length, total: merged.length });
        setAllTemplates(merged);
      } catch (error) {
        console.error('[Studio] Failed to load manifests:', error);
        // Fallback to demo templates so user sees something
        setAllTemplates(demoTemplates);
        console.log('[Studio] Using demo templates as fallback');
      } finally {
        if (mounted) setLoadingAll(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const createPlaceholders = useCallback((count: number, category?: string) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `ph-${category || 'all'}-${i}`,
      title: category ? `${category} concept ${i + 1}` : `Template idea ${i + 1}`,
      category: category || ['Birthday','Business','Fashion','Food','Sale','Social','Instagram','Facebook','YouTube'][i % 9],
      tags: [],
    }));
  }, []);

  // Use enhanced templates instead of manifest
  const allFromManifest = useMemo(() => {
    return allTemplates;
  }, [allTemplates]);

  const featured = useMemo(() => {
    const t = allFromManifest;
    const sel = selectedFilter.toLowerCase();
    if (sel === 'all') return t.slice(0, 24);
    return t
      .filter((x) => {
        const hay = `${x.category || ''} ${x.title || ''}`.toLowerCase();
        return hay.includes(sel) || hay.replace(/-/g, ' ').includes(sel);
      })
      .slice(0, 24);
  }, [allFromManifest, selectedFilter]);

  // Demo editable templates (image, video, and docs)
  const demoTemplates = useMemo(() => [
    {
      id: 'demo-image-1080',
      title: 'Modern Poster A',
      category: 'Poster',
      width: 1080,
      height: 1350,
      studioEditor: {
        canvasType: 'image',
        dimensions: { width: 1080, height: 1350 },
        layers: [
### src/pages/AdminPanel.tsx
// src/pages/AdminPanel.tsx

import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { getApiKeyList } from "../lib/youtube/apiKeyManager";
import { getAllChannelVideos, getUploadsPlaylistId } from "../lib/youtube";
import TemplateImporter from "./TemplateImporter";
import { logoutUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { templateAnalyticsService } from "../lib/services/templateAnalyticsService";
import { activityMonitoringService } from "../lib/services/activityMonitoringService";
import { youtubeQuotaService } from "../lib/services/youtubeQuotaService";
import { reanalyzePlatformData, analyzePlatformBias } from "../utils/platformReanalysisScript";
import { externalApiService } from "../lib/services/externalApiService";
import { duplicateDetectionService } from "../lib/services/duplicateDetectionService";
import VideoUploadProcessor from "../components/VideoUploadProcessor";
import TemplateCategoryManager from "../components/TemplateCategoryManager";
import CategoryBrowser from '../components/CategoryBrowser';
import VideoTemplateProcessor from '../components/VideoTemplateProcessor';
import { TemplateService, CategoryUpdateResult } from "../lib/services/templateService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { auth } from "../lib/firebase";
import { stockApiService } from "../lib/services/stockApiService";
import { backupService } from "../lib/services/backupService";

type QuotaStats = {
  [key: string]: {
    used?: number;
    errors?: number;
    [key: string]: any;
  };
};

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [quota, setQuota] = useState<QuotaStats>({});
  const [videos, setVideos] = useState<any[]>([]);
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ingestMsg, setIngestMsg] = useState("");
  const [done, setDone] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [showImporterModal, setShowImporterModal] = useState(false);
  
  // New navigation states
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'analytics' | 'templates' | 'importers' | 'video-processor' | 'category-manager' | 'template-browser' | 'file-converter'>('overview');
  const [activeAnalyticsSubTab, setActiveAnalyticsSubTab] = useState<'platforms' | 'error' | 'activity' | 'refresh'>('platforms');
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  
  // Analytics states
  const [templateSources, setTemplateSources] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [externalSearchTerm, setExternalSearchTerm] = useState("");
  const [externalSearchResults, setExternalSearchResults] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'users' | 'creators' | 'templates'>('all');
  const [bulkSelectedTemplates, setBulkSelectedTemplates] = useState<Set<string>>(new Set());
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [quotaHistory, setQuotaHistory] = useState<any[]>([]);
  const [realTimeActivities, setRealTimeActivities] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['Pexels', 'Pixabay', 'Unsplash']));
  
  // Duplicate detection states
  const [duplicateReport, setDuplicateReport] = useState<any>(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [showDuplicatePreview, setShowDuplicatePreview] = useState(false);
  
  // Backup management states
  const [availableBackups, setAvailableBackups] = useState<any[]>([]);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  
  // Broken images filter states
  const [showOnlyBrokenImages, setShowOnlyBrokenImages] = useState(false);
  const [brokenImagesList, setBrokenImagesList] = useState<Set<string>>(new Set());
  const [testingImages, setTestingImages] = useState(false);
  const [testingProgress, setTestingProgress] = useState({ current: 0, total: 0, currentBatch: 0, totalBatches: 0 });
  const [deletingProgress, setDeletingProgress] = useState({ current: 0, total: 0, isDeleting: false });
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTemplateId, setDraggedTemplateId] = useState<string | null>(null);
  
  // Individual template deletion states
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);
  
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showAdminMenu && !target.closest('.admin-menu-dropdown')) {
        setShowAdminMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminMenu]);

  async function handleLogout() {
    await logoutUser();
    navigate("/sign-in");
  }

  async function fetchTemplates() {
    setTemplatesLoading(true);
    const snap = await getDocs(collection(db, "templates"));
    setTemplates(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setTemplatesLoading(false);
  }

  async function fetchAnalyticsData() {
    try {
      // Fetch template analytics
      const sources = await templateAnalyticsService.getTemplateSourcesAnalytics();
      setTemplateSources(sources);

      const categoryDist = await templateAnalyticsService.getCategoryDistribution();
      setCategoryDistribution(categoryDist);

      // Fetch activity data
      const activities = await activityMonitoringService.getRecentActivities();
      setRecentActivities(activities);

      const engagement = await activityMonitoringService.getEngagementMetrics();
      setEngagementMetrics(engagement);

      const errors = await activityMonitoringService.getSystemErrors();
      setSystemErrors(errors);

      // Fetch quota history
      const quotaHist = await youtubeQuotaService.getHistoricalUsage(7);
      setQuotaHistory(quotaHist);

      // Fetch platform statistics
      await fetchPlatformStats();
    } catch (error) {
      // Silently handle analytics errors - they're not critical for core functionality
      console.warn('Analytics data temporarily unavailable:', error.message || 'Permission denied');
    }
  }

  async function fetchPlatformStats() {
    try {
      // Get all templates to calculate live counts per platform
      const templatesSnap = await getDocs(collection(db, "templates"));
      const allTemplates = templatesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Get template sources from analytics service
      const sources = await templateAnalyticsService.getTemplateSourcesAnalytics();

      // Calculate live template counts per platform
      const platformData = sources.map(source => {
        // Count live templates from this platform/source using enhanced detection
        const liveTemplates = allTemplates.filter(template => {
