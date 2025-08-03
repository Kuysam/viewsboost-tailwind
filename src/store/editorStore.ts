import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fabric } from 'fabric';

// Types
export interface CanvasObject {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group';
  fabricObject: fabric.Object;
  properties: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    visible: boolean;
    locked: boolean;
    zIndex: number;
    // Type-specific properties
    [key: string]: any;
  };
  layer: {
    name: string;
    order: number;
  };
}

export interface EditorState {
  // Canvas
  canvas: fabric.Canvas | null;
  canvasSize: { width: number; height: number };
  backgroundColor: string;
  
  // Objects
  objects: CanvasObject[];
  selectedObjectIds: string[];
  
  // UI State
  activeTool: string;
  activeSidebar: string;
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  showLayers: boolean;
  
  // History
  history: string[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Project info
  projectName: string;
  lastSaved: Date | null;
  isDirty: boolean;
}

export interface EditorActions {
  // Canvas actions
  setCanvas: (canvas: fabric.Canvas) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
  setBackgroundColor: (color: string) => void;
  
  // Object actions
  addObject: (object: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  removeObject: (id: string) => void;
  selectObjects: (ids: string[]) => void;
  clearSelection: () => void;
  duplicateObject: (id: string) => void;
  
  // UI actions
  setActiveTool: (tool: string) => void;
  setActiveSidebar: (sidebar: string) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleLayers: () => void;
  
  // History actions
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  // Project actions
  setProjectName: (name: string) => void;
  markDirty: () => void;
  markClean: () => void;
  
  // Loading actions
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
}

type EditorStore = EditorState & EditorActions;

const initialState: EditorState = {
  canvas: null,
  canvasSize: { width: 800, height: 600 },
  backgroundColor: '#ffffff',
  objects: [],
  selectedObjectIds: [],
  activeTool: 'select',
  activeSidebar: 'templates',
  zoom: 1,
  showGrid: false,
  showRulers: false,
  showLayers: false,
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  isLoading: false,
  isSaving: false,
  projectName: 'Untitled Project',
  lastSaved: null,
  isDirty: false,
};

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Canvas actions
      setCanvas: (canvas) => {
        const { canvas: previousCanvas } = get();
        
        // Clean up previous canvas event listeners
        if (previousCanvas) {
          try {
            previousCanvas.off(); // Remove all event listeners
            // Only dispose if not already disposed
            if (previousCanvas.getElement && previousCanvas.getElement()) {
              previousCanvas.dispose(); // Clean up canvas resources
            }
          } catch (error) {
            console.warn('Canvas disposal warning:', error);
          }
        }
        
        set({ canvas });
      },
      
      setCanvasSize: (size) => {
        const { canvas } = get();
        if (canvas && canvas.getElement && canvas.getElement()) {
          try {
            canvas.setDimensions(size);
            canvas.renderAll();
          } catch (error) {
            console.warn('Canvas size update warning:', error);
          }
        }
        set({ canvasSize: size });
      },
      
      setBackgroundColor: (color) => {
        const { canvas } = get();
        if (canvas && canvas.getElement && canvas.getElement()) {
          try {
            canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
          } catch (error) {
            console.warn('Canvas background color warning:', error);
          }
        }
        set({ backgroundColor: color });
      },

      // Object actions
      addObject: (object) => set((state) => {
        const newObjects = [...state.objects, object];
        return { 
          objects: newObjects, 
          selectedObjectIds: [object.id],
          isDirty: true 
        };
      }),
      
      updateObject: (id, updates) => set((state) => {
        const objects = state.objects.map(obj =>
          obj.id === id ? { ...obj, ...updates } : obj
        );
        return { objects, isDirty: true };
      }),
      
      removeObject: (id) => set((state) => {
        const objects = state.objects.filter(obj => obj.id !== id);
        const selectedObjectIds = state.selectedObjectIds.filter(selectedId => selectedId !== id);
        return { objects, selectedObjectIds, isDirty: true };
      }),
      
      selectObjects: (ids) => set({ selectedObjectIds: ids }),
      
      clearSelection: () => set({ selectedObjectIds: [] }),
      
      duplicateObject: (id) => {
        const state = get();
        const original = state.objects.find(obj => obj.id === id);
        if (original && state.canvas) {
          original.fabricObject.clone((cloned: fabric.Object) => {
            cloned.set({
              left: (cloned.left || 0) + 20,
              top: (cloned.top || 0) + 20,
            });

            const newId = `${original.type}-${Date.now()}`;
            (cloned as any).id = newId;

            state.canvas!.add(cloned);
            state.canvas!.setActiveObject(cloned);
            state.canvas!.renderAll();

            const newObject: CanvasObject = {
              ...original,
              id: newId,
              fabricObject: cloned,
              properties: {
                ...original.properties,
                x: cloned.left || 0,
                y: cloned.top || 0,
              }
            };

            set((state) => ({
              objects: [...state.objects, newObject],
              selectedObjectIds: [newId],
              isDirty: true
            }));
          });
        }
      },

      // UI actions
      setActiveTool: (tool) => set({ activeTool: tool }),
      setActiveSidebar: (sidebar) => set({ activeSidebar: sidebar }),
      setZoom: (zoom) => {
        const { canvas } = get();
        if (canvas) {
          canvas.setZoom(zoom);
          canvas.renderAll();
        }
        set({ zoom });
      },
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
      toggleLayers: () => set((state) => ({ showLayers: !state.showLayers })),

      // History actions
      saveToHistory: () => {
        const { canvas, history, historyIndex, maxHistorySize } = get();
        if (!canvas) return;

        const state = JSON.stringify(canvas.toJSON());
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(state);
        
        set({
          history: newHistory.slice(-maxHistorySize),
          historyIndex: Math.min(newHistory.length - 1, maxHistorySize - 1)
        });
      },
      
      undo: () => {
        const { canvas, history, historyIndex } = get();
        if (!canvas || historyIndex <= 0) return;

        const prevState = history[historyIndex - 1];
        canvas.loadFromJSON(prevState, () => {
          canvas.renderAll();
          set((state) => ({
            historyIndex: state.historyIndex - 1,
            selectedObjectIds: []
          }));
        });
      },
      
      redo: () => {
        const { canvas, history, historyIndex } = get();
        if (!canvas || historyIndex >= history.length - 1) return;

        const nextState = history[historyIndex + 1];
        canvas.loadFromJSON(nextState, () => {
          canvas.renderAll();
          set((state) => ({
            historyIndex: state.historyIndex + 1,
            selectedObjectIds: []
          }));
        });
      },

      // Project actions
      setProjectName: (name) => set({ projectName: name }),
      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false, lastSaved: new Date() }),

      // Loading actions
      setLoading: (loading) => set({ isLoading: loading }),
      setSaving: (saving) => set({ isSaving: saving }),
    }),
    {
      name: 'editor-store',
      partialize: (state) => ({
        canvasSize: state.canvasSize,
        backgroundColor: state.backgroundColor,
        showGrid: state.showGrid,
        showRulers: state.showRulers,
        showLayers: state.showLayers,
        projectName: state.projectName,
      }),
    }
  )
);

// Selectors for better performance
export const useCanvasObjects = () => useEditorStore((state) => state.objects);
export const useSelectedObjects = () => useEditorStore((state) => 
  state.objects.filter(obj => state.selectedObjectIds.includes(obj.id))
);
export const useCanvasState = () => useEditorStore((state) => ({
  canvas: state.canvas,
  canvasSize: state.canvasSize,
  backgroundColor: state.backgroundColor,
  zoom: state.zoom,
}));
export const useHistoryState = () => useEditorStore((state) => ({
  canUndo: state.historyIndex > 0,
  canRedo: state.historyIndex < state.history.length - 1,
})); 