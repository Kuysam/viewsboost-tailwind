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
        left: x, top: y, selectable: true, objectCaching: false,
      });

      // Scale to provided width or fit canvas width
      const targetWidth = layer.w && layer.w > 0
        ? layer.w
        : Math.max(100, (canvas.getWidth?.() || (canvas as any).width || 800) - 40);
      fabricImage.scaleToWidth(targetWidth);
      fabricImage.set({ left: 10, top: 10 });

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
