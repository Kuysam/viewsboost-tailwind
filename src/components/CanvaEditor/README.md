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

The editor is completely self-contained and doesn't modify any project files or dependencies beyond what's strictly necessary.