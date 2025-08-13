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
}

// Zustand store
const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      document: {
        id: 'doc-1',
        pages: [
          {
            id: 'page-1',
            name: 'Page 1',
            durationMs: 5000,
            layers: []
          }
        ],
        layers: {},
        tracks: {
          'track-page': {
            id: 'track-page',
            type: 'page',
            name: 'Pages',
            clips: ['clip-page-1']
          },
          'track-text': {
            id: 'track-text',
            type: 'text',
            name: 'Text',
            clips: []
          },
          'track-elements': {
            id: 'track-elements',
            type: 'elements',
            name: 'Elements',
            clips: []
          },
          'track-media': {
            id: 'track-media',
            type: 'media',
            name: 'Images & Video',
            clips: []
          },
          'track-audio': {
            id: 'track-audio',
            type: 'audio',
            name: 'Audio',
            clips: []
          }
        },
        activePageId: 'page-1',
        fps: 30
      },
      selectedLayerId: null,
      selectedClipIds: [],
      currentTimeMs: 0,
      isPlaying: false,
      zoom: 100,
      showGrid: false,
      history: [],
      historyIndex: -1,
      templates: [],
      
      setSelectedLayer: (layerId) => set({ selectedLayerId: layerId }),
      setSelectedClips: (clipIds) => set({ selectedClipIds: clipIds }),
      setCurrentTime: (timeMs) => set({ currentTimeMs: timeMs }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setZoom: (zoom) => set({ zoom }),
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      
      addLayer: (layer) => set((state) => {
        const newDocument = {
          ...state.document,
          layers: { ...state.document.layers, [layer.id]: layer },
          pages: state.document.pages.map(page =>
            page.id === state.document.activePageId
              ? { ...page, layers: [...page.layers, layer.id] }
              : page
          )
        };
        return { document: newDocument };
      }),
      
      updateLayer: (layerId, props) => set((state) => ({
        document: {
          ...state.document,
          layers: {
            ...state.document.layers,
            [layerId]: { ...state.document.layers[layerId], ...props }
          }
        }
      })),
      
      deleteLayer: (layerId) => set((state) => {
        const { [layerId]: deleted, ...remainingLayers } = state.document.layers;
        return {
          document: {
            ...state.document,
            layers: remainingLayers,
            pages: state.document.pages.map(page => ({
              ...page,
              layers: page.layers.filter(id => id !== layerId)
            }))
          }
        };
      }),
      
      addPage: () => set((state) => {
        const newPageId = `page-${Date.now()}`;
        const newPage: Page = {
          id: newPageId,
          name: `Page ${state.document.pages.length + 1}`,
          durationMs: 5000,
          layers: []
        };
        return {
          document: {
            ...state.document,
            pages: [...state.document.pages, newPage]
          }
        };
      }),
      
      deletePage: (pageId) => set((state) => ({
        document: {
          ...state.document,
          pages: state.document.pages.filter(p => p.id !== pageId)
        }
      })),
      
      setActivePage: (pageId) => set((state) => ({
        document: { ...state.document, activePageId: pageId }
      })),
      
      addClip: (clip) => set((state) => {
        const track = state.document.tracks[clip.trackId];
        return {
          document: {
            ...state.document,
            tracks: {
              ...state.document.tracks,
              [clip.trackId]: {
                ...track,
                clips: [...track.clips, clip.id]
              }
            }
          }
        };
      }),
      
      updateClip: (clipId, props) => set((state) => {
        // Implementation for updating clips would go here
        return state;
      }),
      
      deleteClip: (clipId) => set((state) => {
        // Implementation for deleting clips would go here
        return state;
      }),
      
      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          return {
            document: state.history[state.historyIndex - 1],
            historyIndex: state.historyIndex - 1
          };
        }
        return state;
      }),
      
      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          return {
            document: state.history[state.historyIndex + 1],
            historyIndex: state.historyIndex + 1
          };
        }
        return state;
      }),
      
      pushHistory: () => set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(state.document);
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      })
    })
  )
);

// Main Editor Component
interface CanvaEditorProps {
  initialTemplate?: any;
}

const CanvaEditor: React.FC<CanvaEditorProps> = ({ initialTemplate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>('text');
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(true);
  const [templateSource, setTemplateSource] = useState<'viewsboost' | 'mock'>('viewsboost');
  
  const {
    document,
    selectedLayerId,
    zoom,
    showGrid,
    isPlaying,
    currentTimeMs,
    setZoom,
    toggleGrid,
    setSelectedLayer,
    addLayer,
    setIsPlaying,
    setCurrentTime,
    undo,
    redo
  } = useEditorStore();

  // Initialize templates - prioritize ViewsBoost templates
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        console.log('[CanvaEditor] Loading ViewsBoost templates...');
        
        // Load ViewsBoost templates first
        const viewsBoostTemplates = await viewsBoostTemplateService.getTemplates();
        const viewsBoostCategories = await viewsBoostTemplateService.getCategories();
        
        if (viewsBoostTemplates.length > 0) {
          console.log(`[CanvaEditor] Loaded ${viewsBoostTemplates.length} ViewsBoost templates`);
          setTemplates(viewsBoostTemplates);
          setCategories(viewsBoostCategories);
          setTemplateSource('viewsboost');
        } else {
          console.log('[CanvaEditor] No ViewsBoost templates found, falling back to mock templates');
          // Fallback to mock templates
          const mockTemplates = templateService.getTemplates();
          setTemplates(mockTemplates);
          setCategories(['all', ...templateService.getCategories()]);
          setTemplateSource('mock');
          
          // Load API templates
          await templateService.fetchApiTemplates();
          const allMockTemplates = templateService.getTemplates();
          setTemplates(allMockTemplates);
        }
      } catch (error) {
        console.error('[CanvaEditor] Error loading templates:', error);
        // Fallback to mock templates
        const mockTemplates = templateService.getTemplates();
        setTemplates(mockTemplates);
        setCategories(['all', ...templateService.getCategories()]);
        setTemplateSource('mock');
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    
    loadTemplates();
  }, []);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: 'white'
      });
      
      fabricCanvasRef.current = canvas;
      
      // Handle selection
      canvas.on('selection:created', (e) => {
        if (e.selected && e.selected[0]) {
          setSelectedLayer(e.selected[0].id || null);
        }
      });
      
      canvas.on('selection:cleared', () => {
        setSelectedLayer(null);
      });

      // Handle drag and drop
      canvas.on('drop', (e) => {
        if (draggedItem) {
          const pointer = canvas.getPointer(e.e);
          if (draggedItem.type === 'template') {
            insertTemplate(draggedItem.template);
          } else {
            addElementAtPosition(fabricCanvasRef.current, addLayer, draggedItem, pointer.x, pointer.y);
          }
          setDraggedItem(null);
        }
      });
    }
    
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [setSelectedLayer, draggedItem, addLayer]);

  // Insert a template into the Fabric canvas (define BEFORE any effect that depends on it)
  const insertTemplate = useCallback(async (template: TemplateMeta) => {
    if (!fabricCanvasRef.current) return;
    try {
      console.log('[CanvaEditor] Inserting template:', template.title);
      // Clear canvas
      fabricCanvasRef.current.clear();
      // Handle ViewsBoost templates first
      if (templateSource === 'viewsboost' && (template as any)?.payload?.originalData) {
        console.log('[CanvaEditor] Using ViewsBoost template insertion');
        const success = await viewsBoostTemplateService.insertTemplateIntoCanvas(
          template.id,
          fabricCanvasRef.current
        );
        if (success) {
          console.log('[CanvaEditor] ViewsBoost template inserted successfully');
          return;
        }
      }
      // Fallback/mock templates
      if ((template as any)?.payload?.pages?.[0]) {
        console.log('[CanvaEditor] Using mock template insertion');
        const page = (template as any).payload.pages[0];
        const layers = (template as any).payload.layers || {};
        for (const layerId of page.layers || []) {
          const layer = layers[layerId];
          if (!layer) continue;
          try {
            if (layer.type === 'image' && layer.props.src) {
              await viewsBoostMediaService.addMediaToCanvas(fabricCanvasRef.current, {
                type: 'image',
                url: layer.props.src,
                title: layer.name,
                x: layer.props.left,
                y: layer.props.top,
                width: layer.props.width
              });
            } else if (layer.type === 'text') {
              addElementAtPosition(
                fabricCanvasRef.current,
                addLayer,
                {
                type: 'text',
                text: layer.props.text,
                fontSize: layer.props.fontSize,
                fill: layer.props.fill,
                fontFamily: layer.props.fontFamily
                },
                layer.props.left,
                layer.props.top
              );
            } else if (layer.type === 'shape') {
              addElementAtPosition(
                fabricCanvasRef.current,
                addLayer,
                {
                type: layer.props.shapeType || 'rectangle',
                width: layer.props.width,
                height: layer.props.height,
                fill: layer.props.fill
                },
                layer.props.left,
                layer.props.top
              );
            }
          } catch (error) {
            console.warn('[CanvaEditor] Failed to insert layer:', layer.name, error);
          }
        }
      }
    } catch (error) {
      console.error('[CanvaEditor] Failed to insert template:', error);
    }
  }, [addLayer, templateSource]);

  // Load initial template when provided
  useEffect(() => {
    if (initialTemplate && fabricCanvasRef.current) {
      console.log('[CanvaEditor] Loading initial template:', initialTemplate);
      
      // Check if this is a template with templateData (our enhanced templates)
      if (initialTemplate.templateData) {
        const template = initialTemplate.templateData;
        console.log('[CanvaEditor] Using enhanced template data:', template);
        insertTemplate(template);
      } else {
        // Fallback for other template formats
        console.log('[CanvaEditor] Using fallback template loading');
        insertTemplate(initialTemplate);
      }
    }
  }, [initialTemplate, insertTemplate]);

  // Handle zoom
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setZoom(zoom / 100);
      fabricCanvasRef.current.renderAll();
    }
  }, [zoom]);

  const addText = () => addElementAtPosition(fabricCanvasRef.current, addLayer, { type: 'text', name: 'Text' }, 100, 100);
  const addRectangle = () => addElementAtPosition(fabricCanvasRef.current, addLayer, { type: 'rectangle', name: 'Rectangle' }, 150, 150);
  const addCircle = () => addElementAtPosition(fabricCanvasRef.current, addLayer, { type: 'circle', name: 'Circle' }, 200, 200);

  

  const handleDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayback();
    } else if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    } else if (e.code === 'Delete' && selectedLayerId) {
      // Delete selected layer
      if (fabricCanvasRef.current) {
        const activeObject = fabricCanvasRef.current.getActiveObject();
        if (activeObject) {
          fabricCanvasRef.current.remove(activeObject);
        }
      }
    }
  }, [isPlaying, setIsPlaying, undo, redo, selectedLayerId]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const exportToPNG = () => {
    if (!fabricCanvasRef.current) return;
    
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });
    
    const link = document.createElement('a');
    link.download = 'canvas-export.png';
    link.href = dataURL;
    link.click();
  };

  const showExportStub = () => {
    alert('Video export (MP4/GIF) is stubbed. Integration with ffmpeg.wasm would go here.');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* README Section */}
      <div className="bg-blue-50 border-b border-blue-200 p-3">
        <h2 className="text-sm font-semibold text-blue-900 mb-1">Canva-Style Editor</h2>
        <p className="text-xs text-blue-700">
          Drop-in React editor with Fabric.js canvas, timeline, templates with deduplication. 
          Mount with &lt;CanvaEditor /&gt;. Plug real templates via TemplateService.
        </p>
      </div>
      
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={undo}
            className="p-2 hover:bg-gray-100 rounded"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            onClick={redo}
            className="p-2 hover:bg-gray-100 rounded"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷ Redo
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={togglePlayback}
            className={`px-4 py-2 text-white rounded hover:bg-blue-700 ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600'}`}
            title="Play/Pause (Space)"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <div className="text-sm text-gray-600">
            {formatTime(currentTimeMs)} / {formatTime(document.pages.find(p => p.id === document.activePageId)?.durationMs || 5000)}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Zoom:</span>
            <input
              type="range"
              min="25"
              max="400"
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-sm w-12">{zoom}%</span>
          </div>
          <button 
            onClick={toggleGrid}
            className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          >
            # Grid
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Preview
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Save
          </button>
          <div className="relative">
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Export ▼
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-lg z-10 hidden group-hover:block">
              <button 
                onClick={exportToPNG}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
              >
                PNG Image
              </button>
              <button 
                onClick={showExportStub}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
              >
                MP4 Video (stub)
              </button>
              <button 
                onClick={showExportStub}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
              >
                GIF (stub)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex">
              {['text', 'shapes', 'images', 'upload', 'templates'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSidebarTab(tab)}
                  className={`flex-1 px-2 py-2 text-xs font-medium capitalize ${
                    activeSidebarTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 h-full overflow-y-auto">
            {activeSidebarTab === 'text' && (
              <div className="space-y-2">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'text', text: 'Heading', fontSize: 32, name: 'Heading' })}
                  onClick={addText}
                  className="w-full p-3 border border-gray-200 rounded hover:bg-gray-50 text-left cursor-pointer"
                >
                  <div className="font-bold text-lg">Add heading</div>
                  <div className="text-xs text-gray-500">Drag to canvas</div>
                </div>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'text', text: 'Subheading', fontSize: 24, name: 'Subheading' })}
                  onClick={addText}
                  className="w-full p-3 border border-gray-200 rounded hover:bg-gray-50 text-left cursor-pointer"
                >
                  <div className="font-semibold">Add subheading</div>
                  <div className="text-xs text-gray-500">Drag to canvas</div>
                </div>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'text', text: 'Body text', fontSize: 16, name: 'Body Text' })}
                  onClick={addText}
                  className="w-full p-3 border border-gray-200 rounded hover:bg-gray-50 text-left cursor-pointer"
                >
                  <div className="text-sm">Add body text</div>
                  <div className="text-xs text-gray-500">Drag to canvas</div>
                </div>
              </div>
            )}
            
            {activeSidebarTab === 'shapes' && (
              <div className="space-y-2">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'rectangle', name: 'Rectangle' })}
                  onClick={addRectangle}
                  className="w-full p-3 border border-gray-200 rounded hover:bg-gray-50 text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-4 bg-red-400 rounded"></div>
                    <span>Rectangle</span>
                  </div>
                  <div className="text-xs text-gray-500">Drag to canvas</div>
                </div>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'circle', name: 'Circle' })}
                  onClick={addCircle}
                  className="w-full p-3 border border-gray-200 rounded hover:bg-gray-50 text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-blue-400 rounded-full"></div>
                    <span>Circle</span>
                  </div>
                  <div className="text-xs text-gray-500">Drag to canvas</div>
                </div>
              </div>
            )}
            
            {activeSidebarTab === 'templates' && (
              <div className="space-y-4">
                {/* Template Source Indicator */}
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="text-xs font-medium text-blue-900">
                    {templateSource === 'viewsboost' ? '🚀 ViewsBoost Templates' : '🧪 Demo Templates'}
                  </div>
                  <div className="text-xs text-blue-700">
                    {templateSource === 'viewsboost' 
                      ? `${templates.length} templates from registry + Firebase`
                      : `${templates.length} demo templates with deduplication`
                    }
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    disabled={isLoadingTemplates}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Loading State */}
                {isLoadingTemplates && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading templates...</span>
                    </div>
                  </div>
                )}
                
                {/* Templates Grid */}
                {!isLoadingTemplates && (
                  <div className="space-y-2">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { type: 'template', template })}
                        onClick={() => insertTemplate(template)}
                        className="border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {template.thumbnail && (
                          <div className="relative">
                            <img 
                              src={template.thumbnail}
                              alt={template.title}
                              className="w-full h-20 object-cover rounded-t"
                              onError={(e) => {
                                // Fallback to placeholder on image error
                                const img = e.target as HTMLImageElement;
                                img.src = `https://placehold.co/240x120/e5e7eb/6b7280?text=${encodeURIComponent(template.title.substring(0, 10))}`;
                              }}
                            />
                            {templateSource === 'viewsboost' && (
                              <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                                LIVE
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-2">
                          <div className="text-sm font-medium truncate" title={template.title}>
                            {template.title}
                          </div>
                          <div className="text-xs text-gray-500">{template.author}</div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-xs text-blue-600 capitalize">{template.category}</div>
                            <div className="text-xs text-gray-400">{template.source}</div>
                          </div>
                          {template.payload.originalData && (
                            <div className="text-xs text-green-600 mt-1">✓ Full compatibility</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!isLoadingTemplates && filteredTemplates.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-sm text-gray-500 mb-2">
                      No templates found in this category
                    </div>
                    <button
                      onClick={() => viewsBoostTemplateService.refreshTemplates().then(() => window.location.reload())}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Refresh templates
                    </button>
                  </div>
                )}
                
                {/* Debug & Test Section */}
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                  <button
                    onClick={() => {
                      const stats = viewsBoostTemplateService.getStats();
                      const mediaStats = viewsBoostMediaService.getStats();
                      alert(`ViewsBoost Integration Stats:\n\nTemplates: ${stats.totalTemplates}\nCategories: ${stats.categoriesCount}\nLast Fetch: ${stats.lastFetch.toLocaleTimeString()}\n\nMedia Cache: ${mediaStats.cacheSize} items\n\nSource: ${templateSource}`);
                    }}
                    className="w-full px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                  >
                    Integration Stats
                  </button>
                  
                  {templateSource === 'mock' && (
                    <button
                      onClick={() => {
                        const results = runDeduplicationTests();
                        alert(`Deduplication Tests:\nPassed: ${results.passed}\nFailed: ${results.failed}\n\n${results.results.join('\n')}`);
                      }}
                      className="w-full px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Run Dedup Tests
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {activeSidebarTab === 'images' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Image upload coming soon...</p>
              </div>
            )}
            
            {activeSidebarTab === 'upload' && (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500">Drag and drop files here</p>
                  <p className="text-xs text-gray-400">or click to browse</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
            <div className="border-2 border-gray-300 bg-white" style={{ width: 800, height: 600 }}>
              <canvas
                ref={canvasRef}
                className="block"
              />
            </div>
          </div>
          
          {/* Timeline */}
          <div className="h-48 bg-white border-t border-gray-200">
            {/* Timeline Header */}
            <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center px-4">
              <div className="text-sm font-medium">Timeline</div>
              <div className="ml-auto text-sm text-gray-500">
                {formatTime(currentTimeMs)} / {formatTime(document.pages.find(p => p.id === document.activePageId)?.durationMs || 5000)}
              </div>
            </div>
            
            {/* Timeline Ruler */}
            <div className="h-6 bg-gray-100 border-b border-gray-200 relative">
              <div className="flex h-full">
                {Array.from({ length: 21 }, (_, i) => (
                  <div key={i} className="flex-1 border-r border-gray-300 text-xs text-gray-600 pl-1 flex items-center">
                    {i % 5 === 0 ? `${i}s` : ''}
                  </div>
                ))}
              </div>
              {/* Playhead */}
              <div 
                className="absolute top-0 w-px h-full bg-red-500"
                style={{ left: `${(currentTimeMs / 20000) * 100}%` }}
              >
                <div className="w-3 h-3 bg-red-500 transform -translate-x-1/2 -translate-y-1"></div>
              </div>
            </div>
            
            {/* Timeline Tracks */}
            <div className="flex-1 overflow-y-auto">
              {Object.values(document.tracks).map((track) => (
                <div key={track.id} className="flex h-8 border-b border-gray-100">
                  {/* Track Label */}
                  <div className="w-24 px-2 text-xs font-medium truncate bg-gray-50 border-r border-gray-200 flex items-center">
                    {track.name}
                  </div>
                  {/* Track Timeline */}
                  <div className="flex-1 h-full bg-white relative">
                    {track.type === 'page' && (
                      <div 
                        className="absolute h-full bg-blue-200 border border-blue-300 rounded flex items-center px-2"
                        style={{ 
                          left: '0%', 
                          width: `${(5000 / 20000) * 100}%` 
                        }}
                      >
                        <span className="text-xs font-medium text-blue-800">Page 1 - 5.0s</span>
                      </div>
                    )}
                    
                    {/* Sample clips for demonstration */}
                    {track.type === 'text' && document.layers && Object.values(document.layers).some(l => l.type === 'text') && (
                      <div 
                        className="absolute h-full bg-green-200 border border-green-300 rounded flex items-center px-2"
                        style={{ 
                          left: '10%', 
                          width: '20%' 
                        }}
                      >
                        <span className="text-xs font-medium text-green-800">Text</span>
                      </div>
                    )}
                    
                    {track.type === 'elements' && document.layers && Object.values(document.layers).some(l => l.type === 'shape') && (
                      <div 
                        className="absolute h-full bg-purple-200 border border-purple-300 rounded flex items-center px-2"
                        style={{ 
                          left: '15%', 
                          width: '25%' 
                        }}
                      >
                        <span className="text-xs font-medium text-purple-800">Shape</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Add Track Button */}
              <div className="flex h-8">
                <div className="w-24 px-2 bg-gray-50 border-r border-gray-200 flex items-center">
                  <button className="text-xs text-gray-500 hover:text-gray-700">+ Track</button>
                </div>
                <div className="flex-1 h-full bg-white"></div>
              </div>
            </div>
            
            {/* Page Thumbnails */}
            <div className="h-12 bg-gray-50 border-t border-gray-200 px-4 flex items-center space-x-2">
              {document.pages.map((page, index) => (
                <div 
                  key={page.id}
                  onClick={() => {/* TODO: Switch to page */}}
                  className={`w-16 h-9 border-2 rounded cursor-pointer flex items-center justify-center text-xs ${
                    page.id === document.activePageId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <span>{index + 1}</span>
                  <div className="absolute -bottom-1 text-xs text-gray-500 whitespace-nowrap">
                    {formatTime(page.durationMs)}
                  </div>
                </div>
              ))}
              <button 
                onClick={() => {/* TODO: Add page */}}
                className="w-16 h-9 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 hover:border-gray-400"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-64 bg-white border-l border-gray-200 p-4">
          <h3 className="text-sm font-semibold mb-3">Properties</h3>
          {selectedLayerId ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="X"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Y"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="W"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="H"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select an object to edit properties</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvaEditor;