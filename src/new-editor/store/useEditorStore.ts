import { create } from "zustand";
import { produce } from "immer";
import { fabric } from "fabric";
import { saveAuto } from "../utils/persist";
import { sleep } from "../utils/sleep";

export type Page = { id: string; name: string; json: any|null; durationSec?: number };

type EditorState = {
  canvas: fabric.Canvas | null;
  pages: Page[];
  activePage: number;
  zoom: number;
  requestSafeRender: () => void;
  addRect: () => void;
  addText: () => void;
  addImageFromFile: (file: File) => Promise<void>;
  addVideoFromFile: (file: File) => Promise<void>;
  deleteSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  setZoom: (z: number) => void;
  setPageDuration?: (index: number, sec: number) => void;
  savePage: () => Promise<void>;
  loadPage: (index: number) => Promise<void>;
  addPage: () => Promise<void>;
  addBlankPage?: () => Promise<void>;
  duplicatePage: () => Promise<void>;
  removePage: (index: number) => Promise<void>;
  exportPNG: () => Promise<Blob | null>;
  exportJSON: () => any;
  smartSuggestNextPage: () => Promise<void>;
  importProject: (pages: any[]) => Promise<void>;
  // Preview / export video
  previewing?: boolean;
  exporting?: boolean;
  playPreview?: () => Promise<void>;
  stopPreview?: () => void;
  exportWebM?: (opts?: { fps?: number }) => Promise<void>;
};

let rafId: number | undefined;
function ensureVideoTicker(cv: fabric.Canvas) {
  if (rafId) cancelAnimationFrame(rafId);
  const tick = () => { cv.requestRenderAll(); rafId = requestAnimationFrame(tick); };
  rafId = requestAnimationFrame(tick);
}
function stopTicker() { if (rafId) cancelAnimationFrame(rafId); rafId = undefined; }

export const useEditorStore = create<EditorState>((set, get) => ({
  canvas: null,
  pages: [{ id: "p1", name: "Page 1", json: null, durationSec: 5 }],
  activePage: 0,
  zoom: 1,
  previewing: false,
  exporting: false,

  requestSafeRender: () => {
    const c: any = get().canvas;
    // When Fabric canvas is disposed, contextContainer becomes null.
    if (!c || !c.contextContainer || !c.lowerCanvasEl) return;
    c.requestRenderAll();
  },

  setCanvas: (cv) => {
    set({ canvas: cv });
    if (cv) {
      cv.off('object:removed');
      cv.on('object:removed', (e:any) => {
        const obj = e?.target as any;
        const el = obj && (obj as any)._element as HTMLVideoElement | undefined;
        if (obj && (obj as any).__isVideo && el) { try { el.pause(); } catch {} }
        if (obj && typeof (obj as any).__src === 'string' && (obj as any).__src.startsWith('blob:')) { try { URL.revokeObjectURL((obj as any).__src); } catch {} }
      });
    }
  },

  addRect: () => {
    const cv = get().canvas; if (!cv) return;
    const rect = new fabric.Rect({ left: 120, top: 120, width: 240, height: 140, fill: "#7c3aed", rx: 12, ry: 12 });
    cv.add(rect); cv.setActiveObject(rect); cv.requestRenderAll();
  },
  addText: () => {
    const cv = get().canvas; if (!cv) return;
    const tb = new fabric.Textbox("Double-click to edit", { left: 180, top: 80, fontSize: 24, fill: "#111827" });
    cv.add(tb); cv.setActiveObject(tb); cv.requestRenderAll();
  },
  addImageFromFile: async (file) => {
    const cv = get().canvas; if (!cv) return;
    const data = await file.arrayBuffer();
    const url = URL.createObjectURL(new Blob([data]));
    await new Promise<void>((res) => {
      fabric.Image.fromURL(url, (img) => { img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 }); cv.add(img); cv.setActiveObject(img); cv.requestRenderAll(); res(); }, { crossOrigin: "anonymous" });
    });
  },
  addVideoFromFile: async (file) => {
    const cv = get().canvas; 
    if (!cv) {
      console.error('No canvas available for video upload');
      return;
    }

    const createVideoElement = (src: string) => new Promise<HTMLVideoElement>((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.preload = 'metadata';
      
      let resolved = false;
      
      const onCanPlay = () => {
        if (resolved) return;
        resolved = true;
        console.log('Video can play:', { 
          duration: video.duration, 
          videoWidth: video.videoWidth, 
          videoHeight: video.videoHeight,
          readyState: video.readyState 
        });
        cleanup();
        resolve(video);
      };
      
      const onLoaded = () => {
        if (resolved) return;
        resolved = true;
        console.log('Video metadata loaded successfully:', { 
          duration: video.duration, 
          videoWidth: video.videoWidth, 
          videoHeight: video.videoHeight,
          readyState: video.readyState 
        });
        cleanup();
        resolve(video);
      };
      
      const onError = (e: Event) => {
        if (resolved) return;
        resolved = true;
        console.error('Video load error details:', e, 'Video error:', video.error);
        cleanup();
        reject(new Error(`Video load error: ${video.error?.message || 'Unknown error'}`));
      };
      
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('error', onError);
      };
      
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      video.addEventListener('canplay', onCanPlay, { once: true });
      video.addEventListener('error', onError, { once: true });
      
      // Set src after event listeners are attached
      video.src = src;
      
      // Longer timeout for video processing
      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        cleanup();
        if (video.readyState >= 1) { // HAVE_METADATA or better
          console.log('Video timeout but has metadata, proceeding:', video.readyState);
          resolve(video);
        } else {
          console.error('Video load timeout, readyState:', video.readyState);
          reject(new Error('Video load timeout'));
        }
      }, 10000); // Increased to 10 seconds
    });

    let url = URL.createObjectURL(file);
    let video: HTMLVideoElement;
    
    try {
      video = await createVideoElement(url);
    } catch (error) {
      console.warn('Blob URL failed, trying data URL fallback:', error);
      URL.revokeObjectURL(url);
      
      // Fallback to data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('File read error'));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      
      url = dataUrl;
      try {
        video = await createVideoElement(url);
      } catch (dataUrlError) {
        console.error('Both blob URL and data URL failed:', dataUrlError);
        throw new Error(`Video upload failed: ${error.message}. Data URL also failed: ${dataUrlError.message}`);
      }
    }

    // Try to play video (may be blocked by autoplay policy)
    try {
      await video.play();
    } catch (playError) {
      // Autoplay blocked - this is normal behavior
    }

    // Create Fabric image from video
    try {
      const fabricImage = new fabric.Image(video, {
        left: 120,
        top: 140,
        scaleX: 0.4,
        scaleY: 0.4,
        objectCaching: false
      }) as any;

      // Mark as video for special handling
      fabricImage.__isVideo = true;
      fabricImage.__src = url;
      fabricImage.__videoElement = video;

      cv.add(fabricImage);
      cv.setActiveObject(fabricImage);
      cv.requestRenderAll();

      // Start video rendering loop
      ensureVideoTicker(cv);
    } catch (fabricError) {
      console.error('Failed to create video element on canvas:', fabricError);
      // Clean up URL if we created it
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      throw fabricError;
    }
  },
  deleteSelected: () => {
    const cv = get().canvas; if (!cv) return;
    const sel = cv.getActiveObjects(); if (!sel.length) return;
    sel.forEach(o => cv.remove(o)); cv.discardActiveObject(); cv.requestRenderAll();
  },
  bringForward: () => { const cv = get().canvas; if (!cv) return; const o = cv.getActiveObject(); if (o) { cv.bringForward(o); cv.requestRenderAll(); } },
  sendBackward: () => { const cv = get().canvas; if (!cv) return; const o = cv.getActiveObject(); if (o) { cv.sendBackwards(o); cv.requestRenderAll(); } },

  setZoom: (z) => {
    const cv = get().canvas; if (!cv) return;
    const center = cv.getCenter();
    cv.setZoom(z);
    cv.setViewportTransform([z,0,0,z, center.left*(1-z), center.top*(1-z) ]);
    cv.requestRenderAll();
    set({ zoom: z });
  },
  setPageDuration: (index, sec) => set(produce<EditorState>(s => { if (s.pages[index]) s.pages[index].durationSec = sec; })),

  savePage: async () => {
    const { canvas, pages, activePage } = get(); 
    if (!canvas) return;
    if (!pages || !pages[activePage]) return;
    
    const json = canvas.toJSON();
    set(produce<EditorState>(s => { 
      if (s.pages[activePage]) {
        s.pages[activePage].json = json; 
      }
    }));
    saveAuto(get().pages as any[]);
  },

  loadPage: async (index) => {
    const { canvas, pages } = get(); if (!canvas) return;
    const data = pages[index]?.json;
    // Safe clear: Fabric can throw if contextContainer is temporarily null
    try {
      // In rare cases contextContainer is null; reconstruct it from lowerCanvasEl
      const anyCv = canvas as any;
      if (!anyCv.contextContainer && anyCv.lowerCanvasEl) {
        anyCv.contextContainer = anyCv.lowerCanvasEl.getContext('2d');
      }
      canvas.clear();
    } catch {
      try {
        // Fallback: remove objects one by one
        const objs = canvas.getObjects();
        objs.forEach(o => canvas.remove(o));
        canvas.requestRenderAll();
      } catch {}
    }
    if (data) {
      await new Promise<void>((res) => canvas.loadFromJSON(data, () => res()));
      canvas.renderAll();
    } else {
      const rect = new fabric.Rect({ left: 100, top: 140, width: 180, height: 120, fill: "#f59e0b", rx: 16, ry: 16 });
      const tb = new fabric.Textbox("New page", { left: 100, top: 90, fontSize: 28, fill: "#111827" });
      canvas.add(tb, rect); canvas.requestRenderAll();
    }
    set({ activePage: index });
  },

  addPage: async () => {
    await get().savePage();
    set(produce<EditorState>(s => { s.pages.push({ id: `p${s.pages.length+1}`, name: `Page ${s.pages.length+1}`, json: null, durationSec: 5 }); }));
    await get().loadPage(get().pages.length-1);
    saveAuto(get().pages as any[]);
  },

  // Create a new truly blank page (no default objects)
  addBlankPage: async () => {
    await get().savePage();
    set(produce<EditorState>(s => { s.pages.push({ id: `p${s.pages.length+1}`, name: `Page ${s.pages.length+1}`, json: { objects: [] }, durationSec: 5 }); }));
    await get().loadPage(get().pages.length-1);
    saveAuto(get().pages as any[]);
  },

  duplicatePage: async () => {
    await get().savePage();
    const { pages, activePage } = get();
    const clone = JSON.parse(JSON.stringify(pages[activePage].json || null));
    const dur = pages[activePage].durationSec || 5;
    set(produce<EditorState>(s => { s.pages.splice(activePage+1, 0, { id: `p${Date.now()}`, name: `${s.pages[activePage].name} Copy`, json: clone, durationSec: dur }); }));
    await get().loadPage(activePage+1);
    saveAuto(get().pages as any[]);
  },

  removePage: async (i) => {
    const { pages, activePage } = get();
    if (pages.length<=1) return;
    set(produce<EditorState>(s => { s.pages.splice(i,1); }));
    await get().loadPage(Math.max(0, i-1 === activePage ? i-1 : activePage));
    saveAuto(get().pages as any[]);
  },

  exportPNG: async () => {
    const cv = get().canvas; if (!cv) return null;
    const dataURL = cv.toDataURL({ format: "png", multiplier: 2, enableRetinaScaling: true });
    const res = await fetch(dataURL); return await res.blob();
  },
  exportJSON: () => {
    const cv = get().canvas; if (!cv) return null;
    return cv.toJSON();
  },
  playPreview: async () => {
    const cv = get().canvas; if (!cv) return;
    set({ previewing: true });
    cv.getObjects().forEach(o => {
      const el = (o as any)._element as HTMLVideoElement | undefined;
      if ((o as any).__isVideo && el) { el.currentTime = 0; el.play().catch(()=>{}); }
    });
    ensureVideoTicker(cv);
  },
  stopPreview: () => {
    const cv = get().canvas; if (!cv) return;
    cv.getObjects().forEach(o => {
      const el = (o as any)._element as HTMLVideoElement | undefined;
      if ((o as any).__isVideo && el) { try { el.pause(); } catch {} }
    });
    stopTicker();
    set({ previewing: false });
    cv.requestRenderAll();
  },
  exportWebM: async ({ fps = 30 }: { fps?: number } = {}) => {
    const canvasEl = document.getElementById('editor2-canvas') as HTMLCanvasElement | null;
    const cv = get().canvas; if (!canvasEl || !cv) return;
    await get().savePage();
    const pages = get().pages.slice();
    const stream = canvasEl.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    set({ exporting: true });
    try {
      recorder.start(100);
      for (let i = 0; i < pages.length; i++) {
        await get().loadPage(i);
        await sleep(100);
        cv.getObjects().forEach(o => {
          const el = (o as any)._element as HTMLVideoElement | undefined;
          if ((o as any).__isVideo && el) { el.currentTime = 0; el.play().catch(()=>{}); }
        });
        ensureVideoTicker(cv);
        await sleep(((pages[i].durationSec || 5)) * 1000);
        cv.getObjects().forEach(o => {
          const el = (o as any)._element as HTMLVideoElement | undefined;
          if ((o as any).__isVideo && el) { try { el.pause(); } catch {} }
        });
      }
      stopTicker();
      recorder.stop();
      const blob: Blob = await new Promise((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'viewsboost-video.webm';
      document.body.appendChild(a); a.click(); a.remove();
    } finally { set({ exporting: false }); }
  },

  smartSuggestNextPage: async () => {
    await get().savePage();
    const { pages, activePage } = get();
    const src = pages[activePage].json;
    set(produce<EditorState>(s => { s.pages.splice(activePage+1, 0, { id: `flow-${Date.now()}`, name: "Suggested", json: src ? remixLayout(src) : null }); }));
    await get().loadPage(activePage+1);
    saveAuto(get().pages as any[]);
  },

  importProject: async (pagesIn) => {
    const pages: Page[] = (pagesIn || []).map((p: any, idx: number) => ({ id: p.id || `p${idx+1}`, name: p.name || `Page ${idx+1}`, json: p.json ?? null, durationSec: p.durationSec || 5 }));
    if (!pages.length) pages.push({ id: "p1", name: "Page 1", json: null });
    set({ pages, activePage: 0 });
    await get().loadPage(0);
    saveAuto(get().pages as any[]);
  }
}));

function remixLayout(json: any) {
  try {
    const copy = JSON.parse(JSON.stringify(json));
    const objs = copy.objects || [];
    objs.forEach((o: any, idx: number) => {
      if (o.type === "textbox") { o.text = (o.text || "").toString().toUpperCase(); o.fontSize = Math.min(36, (o.fontSize||24)+4); o.left = 120; o.top = 80 + idx*60; }
      if (o.type === "rect") { o.fill = "#22c55e"; o.left = 360; o.top = 120 + idx*80; o.rx = 20; o.ry = 20; }
      if (o.type === "image") { o.left = 80; o.top = 220; }
    });
    return copy;
  } catch { return json; }
}
