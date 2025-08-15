// src/new-editor/pages/Editor2.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Circle, Text as KText, Image as KImage, Transformer, Group } from "react-konva";
import Konva from "konva";
import { nanoid } from "nanoid";
import {
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Type, Upload, Image as ImgIcon,
  Video as VideoIcon, Square, Circle as CircleIcon, Trash2, Lock, Unlock, Copy,
  ArrowUpToLine, ArrowDownToLine, Layers as LayersIcon, Download, FolderPlus, FolderMinus,
  HelpCircle
} from "lucide-react";

/** ---------- Props & Types ---------- */
export type PresetKey = "1080x1080" | "1080x1920" | "1280x720" | "1920x1080";

type Editor2Props = {
  initialPreset?: PresetKey;
};

type Kind = "image" | "video" | "text" | "rect" | "circle" | "group";

type BaseEl = {
  id: string;
  kind: Kind;
  name: string;
  x: number; y: number;
  width: number; height: number;
  rotation?: number;
  scaleX?: number; scaleY?: number;
  opacity?: number;
  locked?: boolean;
  visible?: boolean;
};

type ImageEl = BaseEl & { kind: "image"; src: string; };
type VideoEl = BaseEl & { kind: "video"; src: string; playing?: boolean; };
type TextEl  = BaseEl & { kind: "text"; text: string; fontSize: number; fill: string; align: "left"|"center"|"right"; };
type RectEl  = BaseEl & { kind: "rect"; fill: string; cornerRadius?: number; };
type CircleEl= BaseEl & { kind: "circle"; fill: string; };
type GroupEl = BaseEl & {
  kind: "group";
  /** children store local (relative-to-group) positions */
  children: Element[];
};
type Element = ImageEl | VideoEl | TextEl | RectEl | CircleEl | GroupEl;

// Remote catalog types
type VbPresetEl = Partial<Element> & { kind: Element["kind"] };
type VbTemplate = {
  id: string;
  name: string;
  tags?: string[];
  elements: VbPresetEl[];
};
type VbCatalog = {
  version: string;
  categories: { id: string; name: string }[];
  templates: VbTemplate[];
};

// Stock types
type StockProvider = "pexels-photo" | "pexels-video" | "unsplash" | "pixabay-photo" | "pixabay-video";
type StockAsset = {
  id: string;
  kind: "image" | "video";
  thumb: string;
  url: string;
  width: number;
  height: number;
  credit: string;
  link?: string;
};

type ApiTemplateItem = { template_id: string; name: string; format?: string };

type RuntimeMedia = { imageMap: Map<string, HTMLImageElement>; videoMap: Map<string, HTMLVideoElement>; };

/** ---------- Helpers ---------- */
const makeText = (text = "Double-click to edit"): TextEl => ({
  id: nanoid(), kind: "text", name: "Text",
  x: 200, y: 160, width: 300, height: 60,
  rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, locked: false, visible: true,
  text, fontSize: 36, fill: "#111827", align: "center",
});

const makeRect = (): RectEl => ({
  id: nanoid(), kind: "rect", name: "Rectangle",
  x: 180, y: 140, width: 240, height: 160,
  rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, locked: false, visible: true,
  fill: "#10b981", cornerRadius: 16,
});

const makeCircle = (): CircleEl => ({
  id: nanoid(), kind: "circle", name: "Circle",
  x: 360, y: 260, width: 160, height: 160,
  rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, locked: false, visible: true,
  fill: "#3b82f6",
});

function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }
function isGroup(el: Element): el is GroupEl { return el.kind === "group"; }
function boxesIntersect(a: {x:number;y:number;width:number;height:number}, b: {x:number;y:number;width:number;height:number}) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// ===== Remote Libraries Config =====
const VB_CATALOG_URL = import.meta?.env?.VITE_VB_PRESET_CATALOG_URL || ""; // e.g. https://cdn.viewsboost.com/presets/v1.json
const GOOGLE_FONTS_API_KEY = import.meta?.env?.VITE_GOOGLE_FONTS_KEY || "";
// Iconify single-icon endpoint: https://api.iconify.design/<collection>:<icon>.svg

/** ===== Remote Stock Providers (env keys or proxy) ===== */
const PEXELS_KEY = import.meta?.env?.VITE_PEXELS_KEY || "";
const UNSPLASH_KEY = import.meta?.env?.VITE_UNSPLASH_KEY || "";
const PIXABAY_KEY = import.meta?.env?.VITE_PIXABAY_KEY || "";
// If you prefer a backend proxy, set VITE_STOCK_PROXY like: /api/stock?provider=...&q=...&page=...
const STOCK_PROXY = import.meta?.env?.VITE_STOCK_PROXY || "";

/** ===== APITemplate.io ===== */
const APITEMPLATE_KEY =
  import.meta?.env?.VITE_APITEMPLATE_KEY ||
  import.meta?.env?.VITE_APITEMPLATE_API_KEY ||
  import.meta?.env?.VITE_APITEMPLATE_API_KE ||
  "";
const APITEMPLATE_BASE = "https://api.apitemplate.io/v1";

// ===== Templates export (optional backend) =====
const VB_TEMPLATE_POST_URL  = import.meta?.env?.VITE_VB_TEMPLATE_POST_URL  || "";
const VB_TEMPLATE_POST_AUTH = import.meta?.env?.VITE_VB_TEMPLATE_POST_AUTH || ""; // e.g. "Bearer sk_live_..."

// Returns a node's client rect relative to the Stage's coordinate space
const getRectRelToStage = (node: Konva.Node, stage: Konva.Stage) => {
  return (node as any).getClientRect({ skipTransform: false, relativeTo: stage });
};

// Build a map id -> rect (stage coords)
const buildIdToRect = (stage: Konva.Stage, ids: string[]) => {
  const out = new Map<string, {x:number;y:number;width:number;height:number}>();
  ids.forEach((id) => {
    const n = stage.findOne(`#node-${id}`) as Konva.Node | null;
    if (!n) return;
    const r = getRectRelToStage(n, stage);
    out.set(id, r);
  });
  return out;
};

/** ---------- Component ---------- */
export default function Editor2({ initialPreset = "1080x1080" }: Editor2Props) {
  // Presets
  const presets = useMemo(
    () => [
      { key: "1080x1080" as const, label: "1080×1080 (Square)", w: 1080, h: 1080 },
      { key: "1080x1920" as const, label: "1080×1920 (Story/Shorts)", w: 1080, h: 1920 },
      { key: "1280x720"  as const, label: "1280×720 (YouTube Thumb)", w: 1280, h: 720 },
      { key: "1920x1080" as const, label: "1920×1080 (HD)", w: 1920, h: 1080 },
    ],
    []
  );
  const presetIndexByKey: Record<PresetKey, number> = { "1080x1080":0, "1080x1920":1, "1280x720":2, "1920x1080":3 };

  // canvas size
  const [presetIdx, setPresetIdx] = useState<number>(() => presetIndexByKey[initialPreset] ?? 0);
  const canvasW = presets[presetIdx].w;
  const canvasH = presets[presetIdx].h;

  // Stage zoom & pan
  const [scale, setScale] = useState(0.5);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const selRectRef = useRef<Konva.Rect>(null);
  const selectionStart = useRef<{x:number;y:number}|null>(null);
  const [selectionRect, setSelectionRect] = useState<{x:number;y:number;width:number;height:number;visible:boolean}>({x:0,y:0,width:0,height:0,visible:false});
  const suppressClickAfterDrag = useRef(false);

  // Elements, selection & history
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const trRef = useRef<Konva.Transformer>(null);

  const [history, setHistory] = useState<Element[][]>([]);
  const [redoStack, setRedoStack] = useState<Element[][]>([]);

  // Rename & layer drag state
  const [renamingId, setRenamingId] = useState<string|null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [draggingId, setDraggingId] = useState<string|null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [catalog, setCatalog] = useState<VbCatalog | null>(null);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");
  const [fonts, setFonts] = useState<{family: string; variants?: string[]}[]>([]);
  const [iconQuery, setIconQuery] = useState("lucide:star");
  const [stockProvider, setStockProvider] = useState<StockProvider>("pexels-photo");
  const [stockQ, setStockQ] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockHasMore, setStockHasMore] = useState(false);
  const [stockResults, setStockResults] = useState<StockAsset[]>([]);
  const [stockError, setStockError] = useState<string | null>(null);
  // APITemplate.io
  const [apiTplKeyOverride, setApiTplKeyOverride] = useState<string>("");
  const [apiTplLoading, setApiTplLoading] = useState(false);
  const [apiTplError, setApiTplError] = useState<string | null>(null);
  const [apiTemplates, setApiTemplates] = useState<ApiTemplateItem[]>([]);
  const [apiTplSelected, setApiTplSelected] = useState<string>("");
  const [apiTplOverrides, setApiTplOverrides] = useState<string>(
    `{ "overrides": [ { "name": "text_1", "text": "Hello world" } ] }`
  );

  const runtime = useRef<RuntimeMedia>({ imageMap: new Map(), videoMap: new Map() });

  // Cleanup effect for memory management
  useEffect(() => {
    return () => {
      // Clean up video elements
      runtime.current.videoMap.forEach(video => {
        video.pause();
        video.src = '';
        video.load();
      });
      runtime.current.videoMap.clear();
      
      // Clean up image elements
      runtime.current.imageMap.clear();
      
      // Revoke blob URLs to prevent memory leaks
      elements.forEach(el => {
        if ((el.kind === 'image' || el.kind === 'video') && el.src?.startsWith('blob:')) {
          URL.revokeObjectURL(el.src);
        }
      });
    };
  }, []);

  // save history on mutation
  const commit = useCallback((next: Element[] | ((prev: Element[]) => Element[])) => {
    setElements(prev => {
      const resolved = typeof next === "function" ? (next as any)(prev) : next;
      setHistory(h => [...h, deepClone(prev)]);
      setRedoStack([]);
      return resolved;
    });
  }, []);

  // transformer nodes sync - optimized to only depend on selection changes
  const selectedNodes = useMemo(() => {
    const stage = stageRef.current;
    if (!stage) return [];
    
    return selectedIds
      .map(id => stage.findOne(`#node-${id}`))
      .filter(Boolean) as Konva.Node[];
  }, [selectedIds]); // Only depends on selection, not all elements

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    
    tr.nodes(selectedNodes);
    // Debounced redraw to prevent excessive redraws
    const timeoutId = setTimeout(() => tr.getLayer()?.batchDraw(), 16);
    return () => clearTimeout(timeoutId);
  }, [selectedNodes]);

  // video tick - optimized to only run when videos are actually playing
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    
    // Check if any videos are actually playing
    const hasPlayingVideos = elements.some(el => {
      if (el.kind !== "video") return false;
      const v = runtime.current.videoMap.get(el.id);
      return v && !v.paused && !v.ended;
    });
    
    if (!hasPlayingVideos) return; // No RAF loop if no videos playing
    
    let raf = 0;
    const tick = () => {
      // Only redraw if we still have playing videos
      const stillPlaying = elements.some(el => {
        if (el.kind !== "video") return false;
        const v = runtime.current.videoMap.get(el.id);
        return v && !v.paused && !v.ended;
      });
      
      if (stillPlaying) {
        layer.batchDraw();
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [elements]);

  /** ---------- Asset loaders ---------- */
  const pendingImages = useRef<Set<string>>(new Set());
  const imageLoadTimeout = useRef<NodeJS.Timeout | null>(null);

  const loadImage = useCallback(async (elId: string, src: string) => {
    if (runtime.current.imageMap.get(elId)) return;
    
    pendingImages.current.add(elId);
    
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    
    try {
      await new Promise<void>((res, rej) => { 
        img.onload = () => res(); 
        img.onerror = rej; 
      });
      
      runtime.current.imageMap.set(elId, img);
      pendingImages.current.delete(elId);
      
      // Batch redraw - only redraw once after all pending images are loaded
      if (imageLoadTimeout.current) {
        clearTimeout(imageLoadTimeout.current);
      }
      
      imageLoadTimeout.current = setTimeout(() => {
        if (pendingImages.current.size === 0) {
          layerRef.current?.batchDraw();
        }
      }, 16); // 16ms debounce for smooth 60fps
      
    } catch (error) {
      pendingImages.current.delete(elId);
      console.warn('Failed to load image:', src, error);
    }
  }, []);

  const createVideo = (elId: string, src: string) => {
    let v = runtime.current.videoMap.get(elId);
    if (v) return v;
    v = document.createElement("video");
    v.src = src; v.muted = true; v.loop = true; v.playsInline = true;
    runtime.current.videoMap.set(elId, v);
    v.play().catch(() => {});
    return v;
  };

  /** ---------- Commands ---------- */
  const onAddText = () => commit(prev => [...prev, makeText()]);
  const onAddRect = () => commit(prev => [...prev, makeRect()]);
  const onAddCircle = () => commit(prev => [...prev, makeCircle()]);

  const onUpload = (files: FileList | null) => {
    if (!files?.length) return;
    const added: Element[] = [];
    Array.from(files).forEach((f) => {
      const url = URL.createObjectURL(f);
      const common: Partial<BaseEl> = {
        id: nanoid(), name: f.name || (f.type.startsWith("video/") ? "Video" : "Image"),
        x: 120 + Math.random() * 80, y: 120 + Math.random() * 80,
        width: 360, height: 240, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, locked: false, visible: true,
      };
      if (f.type.startsWith("video/")) added.push({ ...(common as any), kind: "video", src: url } as VideoEl);
      else added.push({ ...(common as any), kind: "image", src: url } as ImageEl);
    });
    commit(prev => [...prev, ...added]);
  };

  const onDelete = () => {
    if (selectedIds.length === 0) return;
    commit(prev => prev.filter(e => !selectedIds.includes(e.id)));
    setSelectedIds([]);
  };

  const bringToFront = () => {
    if (!selectedIds.length) return;
    commit(prev => {
      const remain = prev.filter(e => !selectedIds.includes(e.id));
      const picked = prev.filter(e => selectedIds.includes(e.id));
      return [...remain, ...picked]; // preserve order of picked at top
    });
  };

  const sendToBack = () => {
    if (!selectedIds.length) return;
    commit(prev => {
      const remain = prev.filter(e => !selectedIds.includes(e.id));
      const picked = prev.filter(e => selectedIds.includes(e.id));
      return [...picked, ...remain];
    });
  };

  const onDuplicate = () => {
    if (!selectedIds.length) return;
    commit(prev => {
      const newEls: Element[] = [];
      const reIdElement = (el: Element): Element => {
        const clone = deepClone(el) as any;
        clone.id = nanoid();
        // re-id nested children if group
        if (clone.kind === "group") {
          clone.children = (clone.children as Element[]).map((c) => {
            const cc = deepClone(c) as any;
            cc.id = nanoid();
            return cc as Element;
          });
        }
        // offset so it's visible as a copy
        clone.x = (el.x ?? 0) + 24;
        clone.y = (el.y ?? 0) + 24;
        clone.name = (el.name || "Layer") + " Copy";
        return clone as Element;
      };

      for (const id of selectedIds) {
        const el = prev.find(e => e.id === id);
        if (!el) continue;
        newEls.push(reIdElement(el));
      }
      return [...prev, ...newEls];
    });
  };

  const toggleLock = () => {
    if (!selectedIds.length) return;
    commit(prev => {
      const allLocked = prev.filter(e => selectedIds.includes(e.id)).every(e => e.locked);
      return prev.map(e => selectedIds.includes(e.id) ? { ...e, locked: !allLocked } : e);
    });
  };

  // ---- Group / Ungroup ----
  const groupSelection = () => {
    const uniq = Array.from(new Set(selectedIds));
    if (uniq.length < 2) return;
    const stage = stageRef.current; if (!stage) return;

    const pickedRaw = elements.filter(e => uniq.includes(e.id));
    const remain = elements.filter(e => !uniq.includes(e.id));

    // Flatten groups -> absolute children (canvas coords)
    const flattened: Element[] = pickedRaw.flatMap((e) => {
      if (e.kind !== "group") return [e];
      const g = e as GroupEl;
      return g.children.map((c) => ({
        ...(deepClone(c) as any),
        x: c.x + (g.x || 0),
        y: c.y + (g.y || 0),
      })) as Element[];
    });

    // Stage-relative rects
    const ids = flattened.map(e => e.id);
    const idToRect = buildIdToRect(stage, ids);
    const haveRects = idToRect.size === flattened.length;
    let minX: number, minY: number, maxX: number, maxY: number;

    if (haveRects) {
      const rects = [...idToRect.values()];
      minX = Math.min(...rects.map(r => r.x));
      minY = Math.min(...rects.map(r => r.y));
      maxX = Math.max(...rects.map(r => r.x + r.width));
      maxY = Math.max(...rects.map(r => r.y + r.height));
    } else {
      minX = Math.min(...flattened.map(e => e.x));
      minY = Math.min(...flattened.map(e => e.y));
      maxX = Math.max(...flattened.map(e => e.x + e.width));
      maxY = Math.max(...flattened.map(e => e.y + e.height));
    }

    const children: Element[] = flattened.map((e) => {
      const r = idToRect.get(e.id);
      if (!r) {
        return { ...(deepClone(e) as any), x: e.x - minX, y: e.y - minY } as Element;
      }
      return {
        ...(deepClone(e) as any),
        x: r.x - minX,
        y: r.y - minY,
        width: Math.max(1, r.width),
        height: Math.max(1, r.height),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      } as Element;
    });

    const grp: GroupEl = {
      id: nanoid(),
      kind: "group",
      name: `Group (${children.length})`,
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      rotation: 0,
      scaleX: 1, scaleY: 1,
      opacity: 1,
      locked: false,
      visible: true,
      children,
    };

    commit(() => {
      setSelectedIds([grp.id]);
      return [...remain, grp];
    });
  };

  const ungroupSelection = () => {
    if (!selectedIds.length) return;
    const stage = stageRef.current; if (!stage) return;

    commit(prev => {
      const out: Element[] = [];
      const toSelect: string[] = [];

      const bakeChild = (child: Element): Element => {
        const node = stage.findOne(`#node-${child.id}`) as Konva.Node | null;
        if (!node) return deepClone(child);
        const r = (node as any).getClientRect({ skipTransform: false });
        return { ...(deepClone(child) as any), x: r.x, y: r.y, width: Math.max(1,r.width), height: Math.max(1,r.height), rotation: 0, scaleX:1, scaleY:1 } as Element;
      };

      for (const e of prev) {
        if (e.kind === "group" && selectedIds.includes(e.id)) {
          const g = e as GroupEl;
          for (const c of g.children) {
            const baked = bakeChild(c);
            out.push(baked);
            toSelect.push(baked.id);
          }
        } else {
          out.push(e);
        }
      }

      setSelectedIds(toSelect);
      return out;
    });
  };

  const toggleVisible = (id: string) => {
    commit(prev => prev.map(e => e.id === id ? { ...e, visible: e.visible === false ? true : false } : e));
  };

  const onUndo = () => {
    setHistory(h => {
      if (h.length === 0) return h;
      setRedoStack(r => [deepClone(elements), ...r]);
      const last = h[h.length - 1];
      setElements(deepClone(last));
      return h.slice(0, -1);
    });
  };

  const onRedo = () => {
    setRedoStack(r => {
      if (r.length === 0) return r;
      setHistory(h => [...h, deepClone(elements)]);
      const [next, ...rest] = r;
      setElements(deepClone(next));
      return rest;
    });
  };

  const onZoom = (dir: "in" | "out" | "reset") => {
    if (dir === "reset") { setScale(0.5); setStagePos({ x: 0, y: 0 }); return; }
    const factor = dir === "in" ? 1.1 : 1 / 1.1;
    const s = Math.min(3, Math.max(0.1, scale * factor));
    setScale(s);
  };

  const exportPNG = async () => {
    const stage = stageRef.current; if (!stage) return;
    const activeVideos: HTMLVideoElement[] = [];
    elements.forEach(e => { if (e.kind === "video") { const v = runtime.current.videoMap.get(e.id); if (v && !v.paused) { v.pause(); activeVideos.push(v); } } });
    const url = stage.toDataURL({ pixelRatio: 2 });
    activeVideos.forEach(v => v.play().catch(()=>{}));
    const a = document.createElement("a"); a.href = url; a.download = "viewsboost-canvas.png"; a.click();
  };

  const updateEl = (id: string, patch: Partial<Element>) => {
    commit(prev => prev.map(e => e.id===id ? { ...e, ...patch } as Element : e));
  };

  // ---------- Save-as-Template helpers ----------
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

  type TemplateElement = {
    kind: Element["kind"];
    x: number; y: number; width: number; height: number;
    rotation?: number; fill?: string; text?: string; fontSize?: number; align?: "left"|"center"|"right"; fontFamily?: string; cornerRadius?: number; src?: string;
    name?: string;
  };
  type SavedTemplate = {
    id: string;
    name: string;
    version: "1";
    meta?: { canvas: { width: number; height: number } };
    elements: TemplateElement[];
  };

  const elToTemplate = (el: Element, stage: Konva.Stage): TemplateElement[] => {
    if (el.kind === "group") {
      const g = el as GroupEl;
      return g.children.flatMap((c) => {
        const node = stage.findOne(`#node-${c.id}`) as Konva.Node | null;
        if (node) {
          const r = getRectRelToStage(node, stage);
          return [{
            kind: c.kind as any,
            name: (c as any).name,
            x: r.x, y: r.y, width: Math.max(1, r.width), height: Math.max(1, r.height),
            rotation: 0,
            ...(c.kind === "rect"   ? { fill: (c as any).fill, cornerRadius: (c as any).cornerRadius || 0 } : {}),
            ...(c.kind === "circle" ? { fill: (c as any).fill } : {}),
            ...(c.kind === "text"   ? { text: (c as any).text, fontSize: (c as any).fontSize, fill: (c as any).fill, align: (c as any).align, fontFamily: (c as any).fontFamily } : {}),
            ...(c.kind === "image"  ? { src: (c as any).src } : {}),
            ...(c.kind === "video"  ? { src: (c as any).src } : {}),
          }];
        }
        return [{
          kind: c.kind as any,
          name: (c as any).name,
          x: c.x + (el.x || 0), y: c.y + (el.y || 0), width: c.width, height: c.height, rotation: 0,
          ...(c.kind === "rect"   ? { fill: (c as any).fill, cornerRadius: (c as any).cornerRadius || 0 } : {}),
          ...(c.kind === "circle" ? { fill: (c as any).fill } : {}),
          ...(c.kind === "text"   ? { text: (c as any).text, fontSize: (c as any).fontSize, fill: (c as any).fill, align: (c as any).align, fontFamily: (c as any).fontFamily } : {}),
          ...(c.kind === "image"  ? { src: (c as any).src } : {}),
          ...(c.kind === "video"  ? { src: (c as any).src } : {}),
        }];
      });
    }
    return [{
      kind: el.kind as any,
      name: (el as any).name,
      x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation || 0,
      ...(el.kind === "rect"   ? { fill: (el as any).fill, cornerRadius: (el as any).cornerRadius || 0 } : {}),
      ...(el.kind === "circle" ? { fill: (el as any).fill } : {}),
      ...(el.kind === "text"   ? { text: (el as any).text, fontSize: (el as any).fontSize, fill: (el as any).fill, align: (el as any).align, fontFamily: (el as any).fontFamily } : {}),
      ...(el.kind === "image"  ? { src: (el as any).src } : {}),
      ...(el.kind === "video"  ? { src: (el as any).src } : {}),
    }];
  };

  const saveAsTemplate = async () => {
    const stage = stageRef.current; if (!stage) return;
    const pick = selectedIds.length ? elements.filter(e => selectedIds.includes(e.id)) : elements;
    if (!pick.length) { alert("Nothing to save. Select layers or add elements."); return; }

    const name = window.prompt("Template name", "My Template") || "My Template";
    const parts: TemplateElement[] = pick.flatMap(e => elToTemplate(e, stage));
    const payload: SavedTemplate = {
      id: `vb-${Date.now()}`,
      name,
      version: "1",
      meta: { canvas: { width: canvasW, height: canvasH } },
      elements: parts,
    };

    if (VB_TEMPLATE_POST_URL) {
      const res = await fetch(VB_TEMPLATE_POST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(VB_TEMPLATE_POST_AUTH ? { "Authorization": VB_TEMPLATE_POST_AUTH } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(()=> "");
        alert(`Upload failed: ${res.status} ${txt || ""}`);
        return;
      }
      alert("Template uploaded ✅");
      return;
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug(name) || "template"}-${Date.now()}.vbtemplate.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  // ===== Stock helpers =====
  const placeSize = (w: number, h: number, maxW = 720) => {
    const scale = Math.min(1, maxW / Math.max(1, w));
    return { width: Math.max(8, Math.round(w * scale)), height: Math.max(8, Math.round(h * scale)) };
  };

  const addStockAssetToCanvas = (a: StockAsset) => {
    if (a.kind === "image") {
      const sz = placeSize(a.width, a.height, 720);
      const el: ImageEl = {
        id: nanoid(), kind: "image", name: `${a.credit}`,
        x: 160, y: 160, width: sz.width, height: sz.height,
        rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, locked: false, visible: true,
        src: a.url,
      };
      commit(prev => [...prev, el]);
      setSelectedIds([el.id]);
      return;
    }
    const sz = placeSize(a.width, a.height, 720);
    const el: VideoEl = {
      id: nanoid(), kind: "video", name: `${a.credit}`,
      x: 160, y: 160, width: sz.width, height: sz.height,
      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, locked: false, visible: true,
      src: a.url,
    };
    commit(prev => [...prev, el]);
    setSelectedIds([el.id]);
  };

  const mapPexelsPhoto = (p: any): StockAsset => ({
    id: String(p.id), kind: "image",
    thumb: p.src?.medium || p.src?.small || p.src?.tiny,
    url: p.src?.original || p.src?.large2x || p.src?.large || p.src?.medium,
    width: p.width || 1920, height: p.height || 1080,
    credit: `Pexels • ${p.photographer || "Unknown"}`,
    link: p.photographer_url || p.url,
  });
  const pickPexelsVideoFile = (files: any[]) => {
    const byQuality = [...files].sort((a,b) => (b.height||0) - (a.height||0));
    const best = byQuality.find(f => f.height >= 1080) || byQuality.find(f => f.height >= 720) || byQuality[0];
    return best;
  };
  const mapPexelsVideo = (v: any): StockAsset | null => {
    const file = pickPexelsVideoFile(v.video_files || []);
    if (!file) return null;
    return {
      id: String(v.id), kind: "video",
      thumb: (v.video_pictures && v.video_pictures[0]?.picture) || "",
      url: file.link,
      width: file.width || 1280, height: file.height || 720,
      credit: `Pexels Video • ${v.user?.name || "Unknown"}`,
      link: v.url,
    };
  };
  const mapUnsplashPhoto = (p: any): StockAsset => ({
    id: String(p.id), kind: "image",
    thumb: p.urls?.small || p.urls?.thumb,
    url: p.urls?.raw ? `${p.urls.raw}&q=90&fm=jpg&w=2000` : (p.urls?.full || p.urls?.regular || p.urls?.small),
    width: p.width || 1920, height: p.height || 1080,
    credit: `Unsplash • ${p.user?.name || "Unknown"}`,
    link: p.links?.html,
  });
  const mapPixabayPhoto = (h: any): StockAsset => ({
    id: String(h.id), kind: "image",
    thumb: h.webformatURL || h.previewURL,
    url: h.largeImageURL || h.webformatURL,
    width: h.imageWidth || 1920, height: h.imageHeight || 1080,
    credit: `Pixabay • ${h.user || "Unknown"}`,
    link: h.pageURL,
  });
  const pickPixaVideoFile = (videos: any) => (videos?.large || videos?.medium || videos?.small || videos?.tiny || null);
  const mapPixabayVideo = (h: any): StockAsset | null => {
    const file = pickPixaVideoFile(h.videos);
    if (!file) return null;
    return {
      id: String(h.id), kind: "video",
      thumb: h.previewURL || "",
      url: file.url,
      width: file.width || 1280, height: file.height || 720,
      credit: `Pixabay Video • ${h.user || "Unknown"}`,
      link: h.pageURL,
    };
  };

  const fetchViaProxy = async (provider: StockProvider, q: string, page: number) => {
    const url = `${STOCK_PROXY}?provider=${encodeURIComponent(provider)}&q=${encodeURIComponent(q)}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Proxy ${res.status}`);
    return res.json();
  };

  const searchStock = async (append = false) => {
    if (!stockQ.trim()) return;
    setStockLoading(true); setStockError(null);
    try {
      let next: StockAsset[] = [];
      let hasMore = false;

      if (STOCK_PROXY) {
        const data = await fetchViaProxy(stockProvider, stockQ.trim(), append ? stockPage + 1 : 1);
        next = data.assets || [];
        hasMore = !!data.hasMore;
      } else {
        if (stockProvider === "pexels-photo") {
          if (!PEXELS_KEY) throw new Error("Missing VITE_PEXELS_KEY");
          const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(stockQ)}&per_page=30&page=${append ? stockPage + 1 : 1}`, { headers: { Authorization: PEXELS_KEY } });
          if (!res.ok) throw new Error(`Pexels ${res.status}`);
          const data = await res.json();
          next = (data.photos || []).map(mapPexelsPhoto);
          hasMore = (data.page || 1) * (data.per_page || 30) < (data.total_results || 0);
        } else if (stockProvider === "pexels-video") {
          if (!PEXELS_KEY) throw new Error("Missing VITE_PEXELS_KEY");
          const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(stockQ)}&per_page=20&page=${append ? stockPage + 1 : 1}`, { headers: { Authorization: PEXELS_KEY } });
          if (!res.ok) throw new Error(`Pexels ${res.status}`);
          const data = await res.json();
          next = (data.videos || []).map(mapPexelsVideo).filter(Boolean) as StockAsset[];
          hasMore = (data.page || 1) * (data.per_page || 20) < (data.total_results || 0);
        } else if (stockProvider === "unsplash") {
          if (!UNSPLASH_KEY) throw new Error("Missing VITE_UNSPLASH_KEY");
          const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(stockQ)}&per_page=30&page=${append ? stockPage + 1 : 1}`, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
          if (!res.ok) throw new Error(`Unsplash ${res.status}`);
          const data = await res.json();
          next = (data.results || []).map(mapUnsplashPhoto);
          hasMore = (append ? stockPage + 1 : 1) * 30 < (data.total || 0);
        } else if (stockProvider === "pixabay-photo") {
          if (!PIXABAY_KEY) throw new Error("Missing VITE_PIXABAY_KEY");
          const res = await fetch(`https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(stockQ)}&image_type=photo&per_page=30&page=${append ? stockPage + 1 : 1}&safesearch=true`);
          if (!res.ok) throw new Error(`Pixabay ${res.status}`);
          const data = await res.json();
          next = (data.hits || []).map(mapPixabayPhoto);
          hasMore = ((append ? stockPage + 1 : 1) * 30) < (data.totalHits || 0);
        } else if (stockProvider === "pixabay-video") {
          if (!PIXABAY_KEY) throw new Error("Missing VITE_PIXABAY_KEY");
          const res = await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${encodeURIComponent(stockQ)}&per_page=20&page=${append ? stockPage + 1 : 1}&safesearch=true`);
          if (!res.ok) throw new Error(`Pixabay ${res.status}`);
          const data = await res.json();
          next = (data.hits || []).map(mapPixabayVideo).filter(Boolean) as StockAsset[];
          hasMore = ((append ? stockPage + 1 : 1) * 20) < (data.totalHits || 0);
        }
      }

      setStockResults(prev => append ? [...prev, ...next] : next);
      setStockPage(prev => append ? prev + 1 : 1);
      setStockHasMore(hasMore);
    } catch (err: any) {
      setStockError(err?.message || "Search failed");
    } finally {
      setStockLoading(false);
    }
  };
  // Add template from remote catalog
  const addTemplate = (t: VbTemplate) => {
    const placed: Element[] = t.elements.map((raw, i) => {
      const id = nanoid();
      const base = {
        id,
        name: (raw as any).name || `${t.name} ${i+1}`,
        x: ((raw as any).x ?? 120) + i * 8,
        y: ((raw as any).y ?? 120) + i * 8,
        width: Math.max(8, (raw as any).width ?? 200),
        height: Math.max(8, (raw as any).height ?? 100),
        rotation: (raw as any).rotation ?? 0,
        scaleX: 1, scaleY: 1,
        opacity: (raw as any).opacity ?? 1,
        locked: false,
        visible: true,
        kind: (raw as any).kind as Element["kind"],
      } as BaseEl;

      if ((raw as any).kind === "text") {
        return {
          ...(base as any),
          kind: "text",
          text: (raw as any).text || "Text",
          fontSize: (raw as any).fontSize || 40,
          fill: (raw as any).fill || "#111827",
          align: (raw as any).align || "center",
          fontFamily: (raw as any).fontFamily || "Inter",
        } as TextEl;
      }
      if ((raw as any).kind === "rect") {
        return { ...(base as any), kind:"rect", fill: (raw as any).fill || "#10b981", cornerRadius: (raw as any).cornerRadius || 16 } as RectEl;
      }
      if ((raw as any).kind === "circle") {
        return { ...(base as any), kind:"circle", fill: (raw as any).fill || "#3b82f6" } as CircleEl;
      }
      if ((raw as any).kind === "image") {
        return { ...(base as any), kind:"image", src: (raw as any).src || "" } as ImageEl;
      }
      if ((raw as any).kind === "video") {
        return { ...(base as any), kind:"video", src: (raw as any).src || "" } as VideoEl;
      }
      return base as any;
    });

    commit(prev => [...prev, ...placed]);
    setSelectedIds(placed.map(p => p.id));
  };

  // Apply Google Font to selected text elements
  const applyGoogleFont = async (family: string) => {
    const id = `gf-${family.replace(/\s+/g,'-')}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@100..900&display=swap`;
      document.head.appendChild(link);
    }
    commit(prev => prev.map(el => (selectedIds.includes(el.id) && el.kind === "text")
      ? ({ ...(el as any), fontFamily: family } as Element)
      : el
    ));
  };

  // Add Iconify icon as image element
  const addIconifyIcon = async (iconName: string) => {
    if (!iconName.includes(":")) return;
    try {
      const res = await fetch(`https://api.iconify.design/${iconName}.svg`);
      if (!res.ok) return;
      const svg = await res.text();
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      const el: ImageEl = {
        id: nanoid(), kind: "image", name: iconName,
        x: 160, y: 160, width: 160, height: 160,
        rotation: 0, scaleX:1, scaleY:1, opacity:1, locked:false, visible:true,
        src: dataUrl,
      };
      commit(prev => [...prev, el]);
      setSelectedIds([el.id]);
    } catch {}
  };

  // ===== APITemplate.io helpers =====
  const getApiTplKey = () => (apiTplKeyOverride?.trim() || APITEMPLATE_KEY || "").trim();

  const listApiTemplates = async () => {
    const key = getApiTplKey();
    if (!key) { setApiTplError("Missing APITemplate API key"); return; }
    setApiTplLoading(true); setApiTplError(null);
    try {
      const res = await fetch(`${APITEMPLATE_BASE}/list-templates`, { headers: { "X-API-KEY": key } });
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      const data = await res.json();
      const items: ApiTemplateItem[] = (data.templates || []).map((t: any) => ({ template_id: t.template_id, name: t.name, format: t.format }));
      setApiTemplates(items);
      if (!apiTplSelected && items[0]) setApiTplSelected(items[0].template_id);
    } catch (err: any) {
      setApiTplError(err?.message || "List failed");
    } finally {
      setApiTplLoading(false);
    }
  };

  const addRenderedImage = async (url: string, credit: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const loaded = new Promise<{w:number;h:number}>((res, rej) => {
      img.onload = () => res({ w: img.naturalWidth || 1200, h: img.naturalHeight || 630 });
      img.onerror = rej;
    });
    img.src = url;
    const { w, h } = await loaded;
    const maxW = 1080;
    const scale = Math.min(1, maxW / Math.max(1, w));
    const W = Math.max(8, Math.round(w * scale));
    const H = Math.max(8, Math.round(h * scale));
    const el: ImageEl = {
      id: nanoid(), kind: "image", name: credit,
      x: 160, y: 160, width: W, height: H,
      rotation: 0, scaleX:1, scaleY:1, opacity:1, locked:false, visible:true,
      src: url,
    };
    commit(prev => [...prev, el]);
    setSelectedIds([el.id]);
  };

  const renderApiTemplate = async () => {
    const key = getApiTplKey();
    if (!key) { setApiTplError("Missing APITemplate API key"); return; }
    if (!apiTplSelected) { setApiTplError("Choose a template"); return; }
    let payload: any = {};
    try { payload = apiTplOverrides?.trim() ? JSON.parse(apiTplOverrides) : {}; } catch { setApiTplError("Overrides must be valid JSON"); return; }
    setApiTplLoading(true); setApiTplError(null);
    try {
      const url = `${APITEMPLATE_BASE}/create?template_id=${encodeURIComponent(apiTplSelected)}`;
      const res = await fetch(url, { method: "POST", headers: { "X-API-KEY": key, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Render failed: ${res.status}`);
      const data = await res.json();
      const out = data.download_url_png || data.download_url;
      if (!out) throw new Error("No download_url returned");
      await addRenderedImage(out, `APITemplate • ${apiTplSelected}`);
    } catch (err: any) {
      setApiTplError(err?.message || "Render failed");
    } finally {
      setApiTplLoading(false);
    }
  };

  const commitRename = useCallback(() => {
    if (!renamingId) return;
    const name = renameValue.trim();
    if (name) updateEl(renamingId, { name } as any);
    setRenamingId(null);
  }, [renamingId, renameValue]);

  /** ---------- Mouse selection & transforms ---------- */
  const onStageMouseDown = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    // clicked empty? start marquee
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      const pos = stage.getPointerPosition();
      if (!pos) return;
      // transform to local (content) coords
      const transform = stage.getAbsoluteTransform().copy().invert();
      const p = transform.point(pos);

      selectionStart.current = { x: p.x, y: p.y };
      setSelectionRect({ x: p.x, y: p.y, width: 0, height: 0, visible: true });
      setIsSelecting(true);
      setSelectedIds([]); // clear current selection while drawing
      return;
    }

    // clicked node: select (toggle with Shift)
    const node: Konva.Node = e.target;
    const id = (node.id() || "").replace("node-", "");
    if (!id) return;

    const isShift = e.evt?.shiftKey;
    setSelectedIds(prev => {
      if (isShift) {
        return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      }
      return [id];
    });
  };

  const onStageMouseMove = () => {
    if (!isSelecting) return;
    const stage = stageRef.current; if (!stage) return;
    const pos = stage.getPointerPosition(); if (!pos) return;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const p = transform.point(pos);

    const s = selectionStart.current!;
    const nx = Math.min(s.x, p.x);
    const ny = Math.min(s.y, p.y);
    const nw = Math.abs(p.x - s.x);
    const nh = Math.abs(p.y - s.y);
    setSelectionRect({ x: nx, y: ny, width: nw, height: nh, visible: true });
  };

  const finalizeMarquee = () => {
    const stage = stageRef.current; if (!stage) return;

    const sel = {
      x: selectionRect.x,
      y: selectionRect.y,
      width: selectionRect.width,
      height: selectionRect.height,
    };

    const picked: string[] = [];
    for (const el of elements) {
      const node = stage.findOne(`#node-${el.id}`);
      if (!node) continue;
      const r = getRectRelToStage(node, stage);
      const hit = sel.x < r.x + r.width && sel.x + sel.width > r.x && sel.y < r.y + r.height && sel.y + sel.height > r.y;
      if (hit) picked.push(el.id);
    }

    setSelectedIds(picked);
    setIsSelecting(false);
    setSelectionRect(prev => ({ ...prev, visible: false, width: 0, height: 0 }));
    selectionStart.current = null;
  };

  const onStageMouseUp = () => {
    if (isSelecting) finalizeMarquee();
  };

  const onNodeDragEnd = (id: string, evt: Konva.KonvaEventObject<DragEvent>) => {
    const el = elements.find(e => e.id === id);
    if (!el || el.locked) return;
    updateEl(id, { x: evt.target.x(), y: evt.target.y() });
  };

  const onNodeTransformEnd = (id: string, node: Konva.Node) => {
    const el = elements.find(e => e.id === id);
    if (!el || el.locked) return;
    const sx = (node as any).scaleX(); const sy = (node as any).scaleY();
    const width = (node as any).width() * sx; const height = (node as any).height() * sy;
    (node as any).scaleX(1); (node as any).scaleY(1);
    updateEl(id, { x: (node as any).x(), y: (node as any).y(), width, height, rotation: (node as any).rotation() });
  };

  // Toolbar enablement
  const canGroup = selectedIds.length >= 2;
  const canUngroup = selectedIds.some(id => (elements.find(e => e.id === id)?.kind === "group"));

  // hydrate media
  useEffect(() => {
    elements.forEach(el => {
      if (el.kind === "image") loadImage(el.id, el.src);
      if (el.kind === "video") createVideo(el.id, el.src);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  // Fetch remote templates catalog
  useEffect(() => {
    if (!VB_CATALOG_URL) return;
    fetch(VB_CATALOG_URL)
      .then(r => r.json())
      .then((json: VbCatalog) => setCatalog(json))
      .catch(() => setCatalog(null));
  }, []);

  // Fetch Google Fonts list
  useEffect(() => {
    if (!GOOGLE_FONTS_API_KEY) return;
    fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`)
      .then(r => r.json())
      .then(d => {
        const list = (d.items || []).map((f: any) => ({ family: f.family, variants: f.variants }));
        setFonts(list);
      })
      .catch(() => setFonts([]));
  }, []);

  /** ---------- Keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('input, textarea, select, [contenteditable="true"]'))) return;

      const mod = e.metaKey || e.ctrlKey;

      // Group / Ungroup
      if (mod && e.key.toLowerCase() === 'g' && !e.shiftKey) { e.preventDefault(); groupSelection(); return; }
      if (mod && e.key.toLowerCase() === 'g' && e.shiftKey) { e.preventDefault(); ungroupSelection(); return; }
      // Undo / Redo
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); onUndo(); return; }
      if ((mod && e.key.toLowerCase() === 'z' && e.shiftKey) || (mod && e.key.toLowerCase() === 'y')) { e.preventDefault(); onRedo(); return; }

      // Duplicate
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); onDuplicate(); return; }

      // Lock / Unlock
      if (mod && e.key.toLowerCase() === 'l') { e.preventDefault(); toggleLock(); return; }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onDelete(); return; }

      // Clear selection
      if (e.key === 'Escape') { setSelectedIds([]); return; }

      // Select All (visible)
      if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const allVisible = elements.filter(el => el.visible !== false).map(el => el.id);
        setSelectedIds(allVisible);
        return;
      }

      // Help (Cmd/Ctrl + /) or Shift+?
      if ((mod && e.key === '/') || e.key === '?') {
        e.preventDefault();
        setShowHelp((s) => !s);
        return;
      }

      // Nudge
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key) && selectedIds.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        commit(prev => prev.map(el => {
          if (!selectedIds.includes(el.id) || el.locked) return el;
          if (e.key === "ArrowUp")   return { ...el, y: el.y - step };
          if (e.key === "ArrowDown") return { ...el, y: el.y + step };
          if (e.key === "ArrowLeft") return { ...el, x: el.x - step };
          if (e.key === "ArrowRight")return { ...el, x: el.x + step };
          return el;
        }));
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, elements, commit]);

  /** ---------- UI ---------- */
  return (
    <div className="flex h-full w-full">
      {/* Left rail */}
      <div className="w-64 border-r border-white/10 bg-zinc-900/50 text-white p-3 flex flex-col gap-3">
        <div className="font-semibold text-sm opacity-80">Uploads</div>
        <label className="border border-white/10 rounded-lg px-3 py-4 text-center cursor-pointer hover:bg-white/5">
          <div className="flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Upload media</span>
          </div>
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
        </label>

        <div className="font-semibold text-sm opacity-80 mt-6">Add</div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={onAddText} className="rounded-md border border-white/10 px-2 py-2 hover:bg-white/5 flex items-center justify-center"><Type className="w-4 h-4" /></button>
          <button onClick={onAddRect} className="rounded-md border border-white/10 px-2 py-2 hover:bg-white/5 flex items-center justify-center"><Square className="w-4 h-4" /></button>
          <button onClick={onAddCircle} className="rounded-md border border-white/10 px-2 py-2 hover:bg-white/5 flex items-center justify-center"><CircleIcon className="w-4 h-4" /></button>
        </div>

        {/* ===== Stock (Pexels + Unsplash + Pixabay) ===== */}
        <div className="font-semibold text-sm opacity-80 mt-6">Stock</div>
        <div className="flex items-center gap-2">
          <select
            className="bg-zinc-800 border border-white/10 rounded px-2 py-1 text-sm"
            value={stockProvider}
            onChange={(e)=>{ setStockProvider(e.target.value as StockProvider); setStockPage(1); }}
          >
            <option value="pexels-photo">Pexels • Photos</option>
            <option value="pexels-video">Pexels • Videos</option>
            <option value="unsplash">Unsplash • Photos</option>
            <option value="pixabay-photo">Pixabay • Photos</option>
            <option value="pixabay-video">Pixabay • Videos</option>
          </select>
          <input
            className="flex-1 bg-zinc-800/50 border border-white/10 rounded px-2 py-1 text-sm"
            placeholder="Search stock…"
            value={stockQ}
            onChange={(e)=>setStockQ(e.target.value)}
            onKeyDown={(e)=>{ if (e.key === 'Enter') searchStock(false); }}
          />
          <button onClick={()=>searchStock(false)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-xs">
            Search
          </button>
        </div>
        <div className="mt-2 border border-white/10 rounded p-2 max-h-56 overflow-auto">
          {stockError && <div className="text-xs text-red-300 mb-2">Error: {stockError}</div>}
          {!stockResults.length && !stockLoading && (
            <div className="text-xs opacity-60">Type a query and hit Search. (Set VITE_PEXELS_KEY / VITE_UNSPLASH_KEY / VITE_PIXABAY_KEY or VITE_STOCK_PROXY)</div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {stockResults.map(a => (
              <button
                key={`${a.kind}-${a.id}`}
                onClick={()=>addStockAssetToCanvas(a)}
                className="relative group rounded overflow-hidden border border-white/10 hover:border-white/20"
                title={`${a.credit}`}
                style={{ aspectRatio: '1 / 1' }}
              >
                <img src={a.thumb} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
              </button>
            ))}
          </div>
          {stockHasMore && (
            <div className="flex justify-center mt-2">
              <button onClick={()=>searchStock(true)} disabled={stockLoading} className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-xs">
                {stockLoading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
        <div className="text-[11px] opacity-60 mt-1">
          • Pexels/Unsplash/Pixabay require attribution. We store credit in the layer name. <br/>
          • For production, prefer a backend proxy (set <code>VITE_STOCK_PROXY</code>) to hide API keys.
        </div>

        {/* ===== APITemplate (Templates → Render) ===== */}
        <div className="font-semibold text-sm opacity-80 mt-6">APITemplate</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder={APITEMPLATE_KEY ? "Key loaded from env" : "Paste API key…"}
              className="flex-1 bg-zinc-800/50 border border-white/10 rounded px-2 py-1 text-sm"
              value={apiTplKeyOverride}
              onChange={(e)=>setApiTplKeyOverride(e.target.value)}
            />
            <button onClick={listApiTemplates} className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-xs" disabled={apiTplLoading} title="List templates">
              {apiTplLoading ? "Loading…" : "List"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="flex-1 bg-zinc-800 border border-white/10 rounded px-2 py-1 text-sm"
              value={apiTplSelected}
              onChange={(e)=>setApiTplSelected(e.target.value)}
            >
              <option value="" disabled>Select template…</option>
              {apiTemplates.map(t => (
                <option key={t.template_id} value={t.template_id}>{t.name}{t.format ? ` • ${t.format}` : ""}</option>
              ))}
            </select>
            <button onClick={renderApiTemplate} className="px-2 py-1 rounded bg-yellow-400 text-black text-xs font-semibold hover:brightness-95" disabled={apiTplLoading || !apiTplSelected} title="Render and add to canvas">
              Render
            </button>
          </div>
          <textarea
            className="w-full h-28 bg-zinc-800/50 border border-white/10 rounded px-2 py-1 text-xs font-mono"
            value={apiTplOverrides}
            onChange={(e)=>setApiTplOverrides(e.target.value)}
            placeholder='{
  "overrides":[{"name":"text_1","text":"Hello"}]
}'
          />
          {apiTplError && (<div className="text-xs text-red-300">{apiTplError}</div>)}
          <div className="text-[11px] opacity-60">
            • Uses <code>POST /v1/create?template_id=…</code> with <code>X-API-KEY</code> and your JSON payload.<br/>
            • The returned <code>download_url(_png)</code> is placed into the canvas as an Image layer.
          </div>
        </div>

        <div className="font-semibold text-sm opacity-80 mt-6">Presets (4)</div>
        {(() => {
          type Preset = { kind: "rect"|"circle"|"text"; label: string; fill?: string; width?: number; height?: number; cornerRadius?: number; text?: string; fontSize?: number; };
          const templates: Preset[] = [
            { kind: "rect",   label: "Card",   fill: "#10b981", width: 320, height: 180, cornerRadius: 24 },
            { kind: "circle", label: "Circle", fill: "#3b82f6", width: 160, height: 160 },
            { kind: "rect",   label: "Badge",  fill: "#f59e0b", width: 200, height: 60,  cornerRadius: 999 },
            { kind: "text",   label: "Text",   fill: "#111827", text: "Your text", fontSize: 36, width: 300, height: 60 },
          ];
          const addPreset = (t: Preset) => {
            commit(prev => {
              if (t.kind === "rect") {
                const r = makeRect();
                (r as any).fill = t.fill ?? (r as any).fill;
                if (t.cornerRadius !== undefined) (r as any).cornerRadius = t.cornerRadius;
                if (t.width) r.width = t.width; if (t.height) r.height = t.height;
                return [...prev, r];
              }
              if (t.kind === "circle") {
                const c = makeCircle();
                (c as any).fill = t.fill ?? (c as any).fill;
                if (t.width) c.width = t.width; if (t.height) c.height = t.height;
                return [...prev, c];
              }
              if (t.kind === "text") {
                const txt = makeText(t.text || "Text");
                (txt as any).fill = t.fill ?? (txt as any).fill;
                if (t.fontSize) (txt as any).fontSize = t.fontSize;
                if (t.width) txt.width = t.width; if (t.height) txt.height = t.height;
                return [...prev, txt];
              }
              return prev;
            });
          };
          return (
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t, idx) => (
                <button key={idx} onClick={() => addPreset(t)} className="rounded-md border border-white/10 px-2 py-2 hover:bg-white/5 text-left text-xs" title={t.label}>
                  {t.label}
                </button>
              ))}
            </div>
          );
        })()}

        <div className="font-semibold text-sm opacity-80 mt-6 flex items-center gap-2">
          <LayersIcon className="w-4 h-4" /> Layers
        </div>
        <div className="flex-1 overflow-auto pr-1">
          {elements.map((e) => (
            <div
              key={e.id}
              className={`flex items-center gap-2 text-sm px-2 py-1 rounded cursor-pointer ${selectedIds.includes(e.id)?'bg-white/10':''} ${draggingId === e.id ? 'opacity-60' : ''}`}
              draggable
              onDragStart={(ev) => {
                setDraggingId(e.id);
                try { ev.dataTransfer?.setData('text/plain', e.id); } catch {}
                ev.dataTransfer && (ev.dataTransfer.effectAllowed = 'move');
              }}
              onDragOver={(ev) => {
                ev.preventDefault();
                if (draggingId && draggingId !== e.id) {
                  ev.dataTransfer && (ev.dataTransfer.dropEffect = 'move');
                }
              }}
              onDrop={(ev) => {
                ev.preventDefault();
                const fromId = draggingId || ev.dataTransfer?.getData('text/plain');
                const toId = e.id;
                if (!fromId || fromId === toId) { setDraggingId(null); return; }
                commit(prev => {
                  const copy = [...prev];
                  const fromIdx = copy.findIndex(x => x.id === fromId);
                  const toIdx = copy.findIndex(x => x.id === toId);
                  if (fromIdx < 0 || toIdx < 0) return prev;
                  const [moved] = copy.splice(fromIdx, 1);
                  copy.splice(toIdx, 0, moved);
                  return copy;
                });
                setDraggingId(null);
                suppressClickAfterDrag.current = true;
              }}
              onDragEnd={() => setDraggingId(null)}
              onClick={(evt) => {
                if (suppressClickAfterDrag.current) { suppressClickAfterDrag.current = false; return; }
                const isMulti = evt.shiftKey || evt.metaKey || evt.ctrlKey;
                setSelectedIds(prev => isMulti
                  ? (prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id])
                  : [e.id]
                );
              }}
            >
              <button className="text-xs opacity-70 hover:opacity-100" onClick={(ev) => { ev.stopPropagation(); toggleVisible(e.id); }}>
                {e.visible===false ? "🙈" : "👁️"}
              </button>
              <div className="w-4 text-center">
                {e.kind==="text" ? "T"
                 : e.kind==="image" ? <ImgIcon className="w-3 h-3" />
                 : e.kind==="video" ? <VideoIcon className="w-3 h-3" />
                 : e.kind==="rect" ? "▭"
                 : e.kind==="circle" ? "◯"
                 : "🗂️"}
              </div>
              <div
                className="flex-1 truncate"
                onDoubleClick={(ev) => {
                  ev.stopPropagation();
                  setRenamingId(e.id);
                  setRenameValue(e.name || (e.kind === "group" ? `Group (${(e as any).children?.length ?? 0})` : e.kind));
                }}
              >
                {renamingId === e.id ? (
                  <input
                    autoFocus
                    className="w-full bg-zinc-800/60 border border-white/10 rounded px-2 py-1 text-sm"
                    value={renameValue}
                    onChange={(ev)=>setRenameValue(ev.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter") commitRename();
                      if (ev.key === "Escape") setRenamingId(null);
                    }}
                  />
                ) : (
                  <span>
                    {e.kind === "group" ? `Group (${(e as any).children?.length ?? 0})` : (e.name || e.kind)}
                  </span>
                )}
              </div>
              {e.locked ? <Lock className="w-3 h-3 opacity-70" /> : <Unlock className="w-3 h-3 opacity-70" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main work area */}
      <div className="flex-1 flex flex-col bg-zinc-950">
        {/* Toolbar */}
        <div className="h-12 border-b border-white/10 bg-zinc-900/60 text-white flex items-center gap-2 px-3">
          <select
            value={presetIdx}
            onChange={(e)=>setPresetIdx(Number(e.target.value))}
            className="bg-zinc-800 border border-white/10 rounded px-2 py-1 text-sm"
          >
            {presets.map((p, i)=>(
              <option key={p.key} value={i}>{p.label}</option>
            ))}
          </select>

          <div className="mx-2 h-6 w-px bg-white/10" />

          <button title="Undo (⌘/Ctrl+Z)" onClick={onUndo} className="btn-icon"><Undo2 className="w-4 h-4" /></button>
          <button title="Redo (⇧⌘/Ctrl+Y)" onClick={onRedo} className="btn-icon"><Redo2 className="w-4 h-4" /></button>

          <div className="mx-2 h-6 w-px bg-white/10" />

          <button title="Zoom in" onClick={()=>onZoom("in")} className="btn-icon"><ZoomIn className="w-4 h-4" /></button>
          <button title="Zoom out" onClick={()=>onZoom("out")} className="btn-icon"><ZoomOut className="w-4 h-4" /></button>
          <button title="Reset view" onClick={()=>onZoom("reset")} className="btn-icon"><Maximize className="w-4 h-4" /></button>

          <div className="mx-2 h-6 w-px bg-white/10" />

          <button title="Duplicate (⌘/Ctrl+D)" onClick={onDuplicate} disabled={!selectedIds.length} className="btn-icon"><Copy className="w-4 h-4" /></button>
          <button
            title="Group (⌘/Ctrl+G)"
            onClick={groupSelection}
            disabled={!canGroup}
            className="btn-icon"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            title="Ungroup (⇧⌘/Ctrl+G)"
            onClick={ungroupSelection}
            disabled={!canUngroup}
            className="btn-icon"
          >
            <FolderMinus className="w-4 h-4" />
          </button>
          <button title="Bring to front" onClick={bringToFront} disabled={!selectedIds.length} className="btn-icon"><ArrowUpToLine className="w-4 h-4" /></button>
          <button title="Send to back" onClick={sendToBack} disabled={!selectedIds.length} className="btn-icon"><ArrowDownToLine className="w-4 h-4" /></button>
          <button title="Lock / Unlock (⌘/Ctrl+L)" onClick={toggleLock} disabled={!selectedIds.length} className="btn-icon">
            {elements.filter(e=>selectedIds.includes(e.id)).every(e=>e.locked) ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button title="Delete (Del/Backspace)" onClick={onDelete} disabled={!selectedIds.length} className="btn-icon text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>

          <div className="ml-auto" />
          <button
            title="Save as Template (JSON)"
            onClick={saveAsTemplate}
            className="btn-icon"
          >
            Save Tmpl
          </button>
          <button
            title="Shortcuts (⌘/Ctrl + /)"
            onClick={() => setShowHelp(true)}
            className="btn-icon"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button onClick={exportPNG} className="flex items-center gap-2 bg-yellow-400 text-black px-3 py-1.5 rounded-md font-semibold hover:brightness-95">
            <Download className="w-4 h-4" /> Export PNG
          </button>
        </div>

        {/* Canvas area */}
        <div
          className="flex-1 overflow-auto relative"
          onWheel={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); onZoom(e.deltaY > 0 ? "out" : "in"); } }}
        >
          <div className="min-h-full flex items-center justify-center p-10">
            <div className="rounded-xl bg-zinc-800/40 p-4 shadow-inner border border-white/10">
              <Stage
                ref={stageRef}
                width={canvasW}
                height={canvasH}
                scaleX={scale}
                scaleY={scale}
                x={stagePos.x}
                y={stagePos.y}
                onDragEnd={(e)=> setStagePos({ x: e.target.x(), y: e.target.y() })}
                onMouseDown={onStageMouseDown}
                onMouseMove={onStageMouseMove}
                onMouseUp={onStageMouseUp}
                // only allow panning when nothing is selected (prevents "teleport-like" feeling)
                draggable={!isSelecting && selectedIds.length === 0}
                className="bg-white rounded-lg shadow-2xl"
                style={{ borderRadius: 12 }}
              >
                <Layer ref={layerRef}>
                  {/* ======= ELEMENTS RENDER BLOCK — drop in to replace your current map ======= */}
                  {elements.map((el) => {
                    if (el.visible === false) return null;

                    const common: any = {
                      id: `node-${el.id}`,
                      name: "vb-node",
                      draggable: !el.locked,
                      x: el.x,
                      y: el.y,
                      rotation: el.rotation || 0,
                      opacity: el.opacity ?? 1,
                      onDragEnd: (evt: any) => onNodeDragEnd(el.id, evt),
                      onTransformEnd: (evt: any) => onNodeTransformEnd(el.id, evt.target),
                      onClick: (evt: any) => {
                        const isMulti = evt.evt?.shiftKey || evt.evt?.metaKey || evt.evt?.ctrlKey;
                        setSelectedIds((prev) =>
                          isMulti ? (prev.includes(el.id) ? prev.filter((x) => x !== el.id) : [...prev, el.id]) : [el.id]
                        );
                      },
                      onTap: () => setSelectedIds([el.id]),
                    };

                    // ---- Rect (unchanged) ----
                    if (el.kind === "rect") {
                      const r = el as RectEl;
                      return (
                        <Rect
                          key={el.id}
                          {...common}
                          width={el.width}
                          height={el.height}
                          fill={r.fill}
                          cornerRadius={r.cornerRadius || 0}
                        />
                      );
                    }

                    // ---- ✅ Circle FIX (no disappearing, scales cleanly) ----
                    // Render as a rounded Rect with cornerRadius = min(width,height)/2
                    if (el.kind === "circle") {
                      const c = el as CircleEl;
                      const rr = Math.max(1, Math.floor(Math.min(el.width, el.height) / 2));
                      return (
                        <Rect
                          key={el.id}
                          {...common}
                          width={el.width}
                          height={el.height}
                          fill={c.fill}
                          cornerRadius={rr}
                        />
                      );
                    }

                    // ---- ✅ TEXT FIX (centered in box + proportional scaling) ----
                    if (el.kind === "text") {
                      const t = el as TextEl;
                      return (
                        <KText
                          key={el.id}
                          {...common}
                          width={Math.max(10, t.width)}
                          height={Math.max(10, t.height)}
                          text={t.text}
                          fontSize={t.fontSize}
                          fill={t.fill}
                          align={t.align}                  // 'left' | 'center' | 'right'
                          verticalAlign={"middle" as any}  // center vertically inside the box
                          listening={true}
                          // Bake font size + box size on transform so it scales proportionally
                          onTransformEnd={(evt: any) => {
                            const node = evt.target as Konva.Text;
                            const sx = Math.abs(node.scaleX());
                            const sy = Math.abs(node.scaleY());
                            const avg = (sx + sy) / 2;

                            const nextW = Math.max(10, node.width() * sx);
                            const nextH = Math.max(10, node.height() * sy);
                            const nextFont = Math.max(6, (t.fontSize || 16) * avg);

                            node.scaleX(1);
                            node.scaleY(1);

                            updateEl(el.id, {
                              x: node.x(),
                              y: node.y(),
                              width: nextW,
                              height: nextH,
                              rotation: node.rotation(),
                              ...( { fontSize: nextFont } as any ),
                            } as any);
                          }}
                        />
                      );
                    }

                    // ---- Image (unchanged) ----
                    if (el.kind === "image") {
                      const img = runtime.current.imageMap.get(el.id);
                      return <KImage key={el.id} {...common} width={el.width} height={el.height} image={img || undefined} />;
                    }

                    // ---- Video (unchanged) ----
                    if (el.kind === "video") {
                      const vid = runtime.current.videoMap.get(el.id);
                      if (vid && vid.readyState >= 2 && vid.paused) {
                        vid.play().catch(() => {});
                      }
                      return <KImage key={el.id} {...common} width={el.width} height={el.height} image={vid || undefined} />;
                    }

                    return null;
                  })}

                  {/* Transformer for single or multiple nodes */}
                  <Transformer
                    ref={trRef}
                    rotateEnabled
                    enabledAnchors={[
                      "top-left","top-right","bottom-left","bottom-right",
                      "middle-left","middle-right","top-center","bottom-center"
                    ]}
                    keepRatio={false}
                    anchorStroke="#fbbf24"
                    anchorFill="#fde68a"
                    borderStroke="#fbbf24"
                  />

                  {/* Marquee selection rectangle */}
                  {selectionRect.visible && (
                    <Rect
                      ref={selRectRef}
                      x={selectionRect.x}
                      y={selectionRect.y}
                      width={selectionRect.width}
                      height={selectionRect.height}
                      stroke="#fbbf24"
                      dash={[4, 4]}
                      strokeWidth={1}
                      fill="rgba(251,191,36,0.1)"
                      listening={false}
                    />
                  )}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>

        {/* Properties panel */}
        <div className="h-16 border-t border-white/10 bg-zinc-900/60 text-white flex items-center gap-4 px-4">
          {selectedIds.length === 1 ? (
            <>
              <span className="text-sm opacity-70">Properties</span>
              {(() => {
                const el = elements.find(e => e.id === selectedIds[0]);
                if (!el) return null;

                if (el.kind === "text") {
                  const t = el as TextEl;
                  return (
                    <>
                      <input className="bg-zinc-800 border border-white/10 rounded px-2 py-1 text-sm w-64"
                        value={t.text} onChange={(e)=>updateEl(el.id, { text: e.target.value } as any)} />
                      <label className="text-xs opacity-70">Size</label>
                      <input type="number" className="w-20 bg-zinc-800 border border-white/10 rounded px-2 py-1 text-sm"
                        value={t.fontSize} onChange={(e)=>updateEl(el.id, { fontSize: Number(e.target.value) } as any)} />
                      <label className="text-xs opacity-70">Color</label>
                      <input type="color" className="w-10 h-8 bg-zinc-800 border border-white/10 rounded"
                        value={t.fill} onChange={(e)=>updateEl(el.id, { fill: e.target.value } as any)} />
                      <select className="bg-zinc-800 border border-white/10 rounded px-2 py-1 text-sm"
                        value={t.align} onChange={(e)=>updateEl(el.id, { align: e.target.value as any })}>
                        <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                      </select>
                    </>
                  );
                }

                if (el.kind === "rect" || el.kind === "circle") {
                  return (
                    <>
                      <label className="text-xs opacity-70">Fill</label>
                      <input type="color" className="w-10 h-8 bg-zinc-800 border border-white/10 rounded"
                        value={(el as any).fill} onChange={(e)=>updateEl(el.id, { ...(el as any), fill: e.target.value } as any)} />
                      <label className="text-xs opacity-70">Opacity</label>
                      <input type="range" min={0.1} max={1} step={0.05}
                        value={el.opacity ?? 1} onChange={(e)=>updateEl(el.id, { opacity: Number(e.target.value) } as any)} />
                      {el.kind === "rect" && (
                        <>
                          <label className="text-xs opacity-70">Radius</label>
                          <input type="number" className="w-20 bg-zinc-800 border border-white/10 rounded px-2 py-1 text-sm"
                            value={(el as RectEl).cornerRadius || 0}
                            onChange={(e)=>updateEl(el.id, { ...(el as any), cornerRadius: Number(e.target.value) } as any)} />
                        </>
                      )}
                    </>
                  );
                }

                if (el.kind === "video") {
                  const v = runtime.current.videoMap.get(el.id);
                  return (
                    <>
                      <button className="btn-slim" onClick={()=> v?.paused ? v.play().catch(()=>{}) : v?.pause()}>
                        {v?.paused ? "Play" : "Pause"}
                      </button>
                      <input type="range" min={0} max={v?.duration || 1} step={0.01}
                        value={v?.currentTime || 0}
                        onChange={(e)=>{ if (v) { v.currentTime = Number(e.target.value); layerRef.current?.batchDraw(); } }} />
                    </>
                  );
                }

                if (el.kind === "image") {
                  return (
                    <>
                      <label className="text-xs opacity-70">Opacity</label>
                      <input type="range" min={0.1} max={1} step={0.05}
                        value={el.opacity ?? 1} onChange={(e)=>updateEl(el.id, { opacity: Number(e.target.value) } as any)} />
                    </>
                  );
                }
                return null;
              })()}
            </>
          ) : selectedIds.length > 1 ? (
            <span className="text-sm opacity-80">Multiple selected ({selectedIds.length}). Use handles to transform together, arrows to nudge, toolbar to reorder/lock/duplicate/delete.</span>
          ) : (
            <span className="text-sm opacity-60">No selection. Tip: hold ⌘/Ctrl + wheel to zoom, drag on empty area to marquee-select.</span>
          )}
        </div>
      </div>

      {showHelp && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-3xl rounded-xl bg-zinc-900 text-white border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 opacity-80" />
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/15"
              >
                Esc
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                ["Select All (visible)", "⌘/Ctrl + A"],
                ["Group", "⌘/Ctrl + G"],
                ["Ungroup", "⇧ + ⌘/Ctrl + G"],
                ["Duplicate", "⌘/Ctrl + D"],
                ["Lock / Unlock", "⌘/Ctrl + L"],
                ["Undo", "⌘/Ctrl + Z"],
                ["Redo", "⇧ + ⌘/Ctrl + Z  or  ⌘/Ctrl + Y"],
                ["Delete", "Delete / Backspace"],
                ["Clear Selection", "Esc"],
                ["Toggle Select", "Shift + Click  or  ⌘/Ctrl + Click"],
                ["Marquee Select", "Drag on empty canvas"],
                ["Nudge", "Arrow Keys (⇧ = 10px)"],
                ["Zoom In/Out", "⌘/Ctrl + Wheel  (or toolbar)"],
                ["Reset View", "Toolbar (maximize icon)"],
                ["Export PNG", "Toolbar → Export PNG"],
                ["Open Shortcuts", "⌘/Ctrl + /  or  ?"],
              ].map(([label, keys], i) => (
                <div key={i as number} className="flex items-center justify-between gap-4 px-3 py-2 rounded-md bg-white/5 border border-white/10">
                  <span className="opacity-90">{label as string}</span>
                  <span className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded">{keys as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn-icon { display:inline-flex; align-items:center; justify-content:center;
          padding:6px; border-radius:8px; background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08); transition:all .15s; }
        .btn-icon:hover { background:rgba(255,255,255,0.08); }
        .btn-icon:disabled { opacity:.4; cursor:not-allowed; }
        .btn-slim { padding:6px 10px; border-radius:8px; background:#1f2937; border:1px solid rgba(255,255,255,.1); }
        .btn-slim:hover { background:#273449; }
      `}</style>
    </div>
  );
}
