// src/utils/canvasMedia.ts
import { fabric } from 'fabric';

type MediaLayer = {
  type: 'image' | 'video';
  url: string;
  x?: number;
  y?: number;
  w?: number;      // target width; keeps aspect
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  poster?: string; // optional poster for video before play
};

export async function addMediaLayer(canvas: fabric.Canvas, layer: MediaLayer) {
  if (!canvas || !layer?.url) return;

  try {
    console.log('[canvasMedia] addMediaLayer ->', layer.type, layer.url);
  } catch {}

  const x = layer.x ?? 100;
  const y = layer.y ?? 100;

  if (layer.type === 'image') {
    return new Promise<void>((resolve) => {
      fabric.Image.fromURL(
        layer.url,
        (img) => {
          if (!img) return resolve();
          if (layer.w && layer.w > 0) img.scaleToWidth(layer.w);
          img.set({ left: x, top: y, selectable: true });
          canvas.add(img);
          canvas.requestRenderAll();
          resolve();
        },
        { crossOrigin: 'anonymous' }
      );
    });
  }

  if (layer.type === 'video') {
    const el = document.createElement('video');
    el.src = layer.url;
    el.preload = 'auto';
    // Only set crossOrigin for known CORS-friendly hosts; otherwise, let the browser do a non-CORS request
    try {
      const u = new URL(layer.url, window.location.href);
      const host = u.hostname;
      const corsAllowed = [
        window.location.hostname,
        'localhost',
        '127.0.0.1',
        'firebasestorage.googleapis.com',
        'storage.googleapis.com'
      ];
      if (corsAllowed.includes(host)) {
        el.crossOrigin = 'anonymous';
      }
    } catch {}
    el.playsInline = true;
    el.muted = layer.muted ?? true;   // needed for autoplay
    el.loop = layer.loop ?? true;

    const attachToCanvas = () => {
      // Offscreen canvas renderer for reliable frame drawing
      const vw = el.videoWidth || 640;
      const vh = el.videoHeight || 360;
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = vw;
      frameCanvas.height = vh;
      const frameCtx = frameCanvas.getContext('2d');

      // Draw a first frame/poster
      try { frameCtx?.drawImage(el, 0, 0, vw, vh); } catch {}

      const fabricImage = new fabric.Image(frameCanvas, {
        left: x,
        top: y,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        objectCaching: false,
      });

      // Cover the canvas area by default (fill), or respect requested width
      const canvasW = canvas.getWidth?.() || (canvas as any).width || 800;
      const canvasH = canvas.getHeight?.() || (canvas as any).height || 600;
      if (layer.w && layer.w > 0) {
        fabricImage.scaleToWidth(layer.w);
        fabricImage.set({ left: 10, top: 10 });
      } else {
        const scale = Math.max(canvasW / vw, canvasH / vh);
        fabricImage.set({
          scaleX: scale,
          scaleY: scale,
          left: Math.max(0, (canvasW - vw * scale) / 2),
          top: Math.max(0, (canvasH - vh * scale) / 2),
        });
      }

      canvas.add(fabricImage);
      try { (fabricImage as any).dirty = true; } catch {}
      try { canvas.bringToFront(fabricImage); } catch {}
      try { canvas.setActiveObject && canvas.setActiveObject(fabricImage); } catch {}
      canvas.requestRenderAll();

      // Expose global control for timeline sync (single-primary for now)
      try {
        (window as any).__viewsboost_primary_video = el;
        (window as any).__viewsboost_video_controls = {
          play: () => { try { el.play(); } catch {} },
          pause: () => { try { el.pause(); } catch {} },
          seek: (t: number) => { try { el.currentTime = Math.max(0, Math.min(el.duration || t, t)); } catch {} },
          duration: () => (el.duration || 0),
          currentTime: () => (el.currentTime || 0)
        };
      } catch {}

      const renderFrame = () => {
        try {
          if (!el.paused && !el.ended) {
            frameCtx?.drawImage(el, 0, 0, vw, vh);
            (fabricImage as any).dirty = true;
            canvas.requestRenderAll();
          }
        } catch {}
        requestAnimationFrame(renderFrame);
      };
      requestAnimationFrame(renderFrame);

      // Enable transform hooks to keep video fill correct when scaled
      const updateScale = () => {
        // When user rescales the proxy image, we don't need extra sync; Fabric handles pixels
        // But ensure we keep minimum size > 1px to avoid disappearing
        const minSize = 4;
        if ((fabricImage.getScaledWidth?.() || 0) < minSize) fabricImage.scaleToWidth(minSize);
        if ((fabricImage.getScaledHeight?.() || 0) < minSize) fabricImage.scaleToHeight(minSize);
      };
      fabricImage.on('scaling', updateScale);
      fabricImage.on('scaled', updateScale);
    };

    // Prefer adding after metadata is ready so first frame is visible
    let attached = false;
    const onReady = () => {
      if (attached) return;
      attached = true;
      try {
        console.log('[canvasMedia] video ready. size:', el.videoWidth, 'x', el.videoHeight);
      } catch {}
      // Force a visual frame for some browsers
      try { el.currentTime = Math.min(0.05, (el.duration || 1) * 0.005); } catch {}
      attachToCanvas();
      if (layer.autoplay ?? true) {
        try { el.play().catch(() => {}); } catch {}
      }
      el.removeEventListener('loadeddata', onReady);
      el.removeEventListener('canplay', onReady);
    };

    el.addEventListener('loadeddata', onReady, { once: true });
    el.addEventListener('canplay', onReady, { once: true });

    el.addEventListener('error', () => {
      try {
        console.warn('[canvasMedia] video error for URL:', layer.url);
      } catch {}
    });

    // Fallback: if events never fire, attach after a short delay
    setTimeout(() => {
      if (!attached) onReady();
    }, 700);
  }
}

// Helper to switch the primary video source (used by timeline)
export function setPrimaryVideoSource(url: string) {
  try {
    const v: HTMLVideoElement | undefined = (window as any).__viewsboost_primary_video;
    if (!v) return;
    v.pause();
    if (v.src !== url) {
      v.src = url;
      try { v.load(); } catch {}
    }
  } catch {}
}
